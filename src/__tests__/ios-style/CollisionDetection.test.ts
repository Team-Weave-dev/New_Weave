import { describe, it, expect, beforeEach } from '@jest/globals';
import { CollisionDetectionEngine } from '../../lib/dashboard/flexible-grid/collision-detection';
import type { IOSStyleWidget } from '../../types/ios-dashboard';

describe('CollisionDetectionEngine', () => {
  let engine: CollisionDetectionEngine;

  const createWidget = (
    id: string,
    gridColumn: number,
    gridRow: number,
    columns: number,
    rows: number
  ): IOSStyleWidget => ({
    id,
    type: 'note',
    position: { gridColumn, gridRow, columns, rows },
    data: {} as any,
  });

  beforeEach(() => {
    engine = new CollisionDetectionEngine({
      maxColumns: 8,
      maxRows: 20,
    });
  });

  describe('초기화', () => {
    it('기본 설정으로 엔진을 초기화해야 함', () => {
      expect(engine).toBeDefined();
      expect(engine.getOccupancyMap()).toBeDefined();
    });

    it('커스텀 설정으로 엔진을 초기화해야 함', () => {
      const customEngine = new CollisionDetectionEngine({
        maxColumns: 12,
        maxRows: 30,
      });
      
      expect(customEngine).toBeDefined();
      const map = customEngine.getOccupancyMap();
      expect(map.length).toBe(30);
      expect(map[0].length).toBe(12);
    });
  });

  describe('Occupancy Map 관리', () => {
    it('위젯을 occupancy map에 추가해야 함', () => {
      const widget = createWidget('widget-1', 1, 1, 2, 2);
      engine.addToOccupancyMap(widget);
      
      const map = engine.getOccupancyMap();
      expect(map[0][0]).toBe('widget-1');
      expect(map[0][1]).toBe('widget-1');
      expect(map[1][0]).toBe('widget-1');
      expect(map[1][1]).toBe('widget-1');
    });

    it('위젯을 occupancy map에서 제거해야 함', () => {
      const widget = createWidget('widget-1', 1, 1, 2, 2);
      engine.addToOccupancyMap(widget);
      engine.removeFromOccupancyMap(widget);
      
      const map = engine.getOccupancyMap();
      expect(map[0][0]).toBeNull();
      expect(map[0][1]).toBeNull();
      expect(map[1][0]).toBeNull();
      expect(map[1][1]).toBeNull();
    });

    it('occupancy map을 초기화해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 3, 1, 2, 2);
      
      engine.addToOccupancyMap(widget1);
      engine.addToOccupancyMap(widget2);
      engine.clearOccupancyMap();
      
      const map = engine.getOccupancyMap();
      expect(map[0][0]).toBeNull();
      expect(map[0][2]).toBeNull();
    });

    it('경계를 벗어나는 위젯을 처리해야 함', () => {
      const widget = createWidget('widget-1', 7, 19, 3, 3);
      engine.addToOccupancyMap(widget);
      
      const map = engine.getOccupancyMap();
      // 경계 내의 셀만 채워져야 함
      expect(map[18][6]).toBe('widget-1');
      expect(map[19][6]).toBe('widget-1');
      // 경계를 벗어나는 부분은 무시
    });
  });

  describe('충돌 감지', () => {
    beforeEach(() => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 4, 1, 2, 2);
      engine.addToOccupancyMap(widget1);
      engine.addToOccupancyMap(widget2);
    });

    it('충돌하는 위젯을 감지해야 함', () => {
      const newWidget = createWidget('widget-3', 2, 1, 2, 2);
      const collisions = engine.detectCollisions(newWidget);
      
      expect(collisions).toHaveLength(1);
      expect(collisions[0]).toBe('widget-1');
    });

    it('충돌하지 않는 위젯은 빈 배열을 반환해야 함', () => {
      const newWidget = createWidget('widget-3', 1, 3, 2, 2);
      const collisions = engine.detectCollisions(newWidget);
      
      expect(collisions).toHaveLength(0);
    });

    it('여러 위젯과의 충돌을 감지해야 함', () => {
      const largeWidget = createWidget('widget-3', 1, 1, 6, 2);
      const collisions = engine.detectCollisions(largeWidget);
      
      expect(collisions).toHaveLength(2);
      expect(collisions).toContain('widget-1');
      expect(collisions).toContain('widget-2');
    });

    it('자기 자신과는 충돌하지 않아야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const collisions = engine.detectCollisions(widget1, ['widget-1']);
      
      expect(collisions).toHaveLength(0);
    });
  });

  describe('충돌 영역 계산', () => {
    it('충돌 영역을 정확히 계산해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 3, 3);
      const widget2 = createWidget('widget-2', 2, 2, 3, 3);
      
      const area = engine.calculateCollisionArea(widget1, widget2);
      
      expect(area).toBeDefined();
      expect(area?.overlapWidth).toBe(2);
      expect(area?.overlapHeight).toBe(2);
      expect(area?.overlapArea).toBe(4);
      expect(area?.overlapPercentage).toBeCloseTo(0.44, 1); // 4/9
    });

    it('충돌하지 않는 위젯은 null을 반환해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 4, 1, 2, 2);
      
      const area = engine.calculateCollisionArea(widget1, widget2);
      
      expect(area).toBeNull();
    });

    it('완전히 겹치는 위젯의 충돌 영역을 계산해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 1, 1, 2, 2);
      
      const area = engine.calculateCollisionArea(widget1, widget2);
      
      expect(area?.overlapPercentage).toBe(1);
    });

    it('부분적으로 겹치는 위젯의 충돌 영역을 계산해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 4, 4);
      const widget2 = createWidget('widget-2', 3, 3, 4, 4);
      
      const area = engine.calculateCollisionArea(widget1, widget2);
      
      expect(area?.overlapWidth).toBe(2);
      expect(area?.overlapHeight).toBe(2);
      expect(area?.overlapArea).toBe(4);
    });
  });

  describe('충돌 해결 전략', () => {
    it('push 전략을 적용해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 2, 1, 2, 2);
      
      engine.addToOccupancyMap(widget1);
      
      const result = engine.resolveCollision(widget2, ['widget-1'], 'push');
      
      expect(result.success).toBe(true);
      expect(result.position).toBeDefined();
      expect(result.position?.gridColumn).toBeGreaterThanOrEqual(3);
    });

    it('swap 전략을 적용해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 2, 1, 2, 2);
      
      engine.addToOccupancyMap(widget1);
      
      const result = engine.resolveCollision(widget2, ['widget-1'], 'swap');
      
      expect(result.success).toBe(true);
      expect(result.swappedWidgets).toBeDefined();
      expect(result.swappedWidgets).toContain('widget-1');
    });

    it('reposition 전략을 적용해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 1, 1, 2, 2);
      
      engine.addToOccupancyMap(widget1);
      
      const result = engine.resolveCollision(widget2, ['widget-1'], 'reposition');
      
      expect(result.success).toBe(true);
      expect(result.position).toBeDefined();
      // 새 위치는 충돌하지 않아야 함
      const collisions = engine.detectCollisions({
        ...widget2,
        position: result.position!,
      });
      expect(collisions).toHaveLength(0);
    });

    it('해결 불가능한 충돌을 처리해야 함', () => {
      // 전체 그리드를 채움
      for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 8; col++) {
          const widget = createWidget(`widget-${row}-${col}`, col + 1, row + 1, 1, 1);
          engine.addToOccupancyMap(widget);
        }
      }
      
      const newWidget = createWidget('new-widget', 1, 1, 2, 2);
      const result = engine.resolveCollision(newWidget, ['widget-0-0'], 'reposition');
      
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('Incremental 감지', () => {
    it('증분 충돌 감지를 수행해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 4, 1, 2, 2);
      
      engine.addToOccupancyMap(widget1);
      engine.addToOccupancyMap(widget2);
      
      // widget-1을 오른쪽으로 이동
      const movedWidget = { ...widget1, position: { ...widget1.position, gridColumn: 3 } };
      const incrementalCollisions = engine.detectIncrementalCollisions(
        movedWidget,
        widget1.position,
        ['widget-1']
      );
      
      expect(incrementalCollisions).toHaveLength(1);
      expect(incrementalCollisions[0]).toBe('widget-2');
    });

    it('이동하지 않은 경우 빈 배열을 반환해야 함', () => {
      const widget = createWidget('widget-1', 1, 1, 2, 2);
      engine.addToOccupancyMap(widget);
      
      const collisions = engine.detectIncrementalCollisions(
        widget,
        widget.position,
        ['widget-1']
      );
      
      expect(collisions).toHaveLength(0);
    });
  });

  describe('배치 가능 여부 확인', () => {
    beforeEach(() => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 4, 1, 2, 2);
      engine.addToOccupancyMap(widget1);
      engine.addToOccupancyMap(widget2);
    });

    it('배치 가능한 위치를 확인해야 함', () => {
      const canPlace = engine.canPlaceWidget(1, 3, 2, 2);
      expect(canPlace).toBe(true);
    });

    it('배치 불가능한 위치를 확인해야 함', () => {
      const canPlace = engine.canPlaceWidget(1, 1, 2, 2);
      expect(canPlace).toBe(false);
    });

    it('경계를 벗어나는 위치를 확인해야 함', () => {
      const canPlace = engine.canPlaceWidget(7, 1, 3, 2);
      expect(canPlace).toBe(false);
    });

    it('특정 위젯을 제외하고 배치 가능 여부를 확인해야 함', () => {
      const canPlace = engine.canPlaceWidget(1, 1, 2, 2, ['widget-1']);
      expect(canPlace).toBe(true);
    });
  });

  describe('충돌 패턴 분석', () => {
    it('충돌 패턴을 분석해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 2, 2, 2, 2);
      const widget3 = createWidget('widget-3', 3, 3, 2, 2);
      
      engine.addToOccupancyMap(widget1);
      engine.addToOccupancyMap(widget2);
      engine.addToOccupancyMap(widget3);
      
      const pattern = engine.analyzeCollisionPattern([widget1, widget2, widget3]);
      
      expect(pattern).toBeDefined();
      expect(pattern.density).toBeGreaterThan(0);
      expect(pattern.clusters).toBeDefined();
    });

    it('빈 레이아웃의 패턴을 분석해야 함', () => {
      const pattern = engine.analyzeCollisionPattern([]);
      
      expect(pattern.density).toBe(0);
      expect(pattern.clusters).toHaveLength(0);
    });
  });
});