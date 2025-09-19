import { describe, it, expect, beforeEach } from '@jest/globals';
import { FlexibleGridEngine } from '../../lib/dashboard/flexible-grid/FlexibleGridEngine';
import type { IOSStyleWidget, FlexibleWidgetPosition } from '../../types/ios-dashboard';

describe('FlexibleGridEngine', () => {
  let engine: FlexibleGridEngine;
  const mockWidgets: IOSStyleWidget[] = [
    {
      id: 'widget-1',
      type: 'analytics',
      position: {
        gridColumn: 1,
        gridRow: 1,
        columns: 2,
        rows: 2,
      },
      data: { type: 'analytics', title: 'Analytics Widget' } as any,
    },
    {
      id: 'widget-2',
      type: 'calendar',
      position: {
        gridColumn: 3,
        gridRow: 1,
        columns: 2,
        rows: 2,
      },
      data: { type: 'calendar', title: 'Calendar Widget' } as any,
    },
  ];

  beforeEach(() => {
    engine = new FlexibleGridEngine({
      maxColumns: 8,
      maxRows: 20,
    });
  });

  describe('초기화', () => {
    it('기본 설정으로 엔진을 초기화해야 함', () => {
      expect(engine).toBeDefined();
      expect(engine.getConfig().maxColumns).toBe(8);
      expect(engine.getConfig().maxRows).toBe(20);
    });

    it('커스텀 설정으로 엔진을 초기화해야 함', () => {
      const customEngine = new FlexibleGridEngine({
        maxColumns: 12,
        maxRows: 30,
        minColumns: 2,
        minRows: 2,
      });
      
      expect(customEngine.getConfig().maxColumns).toBe(12);
      expect(customEngine.getConfig().maxRows).toBe(30);
      expect(customEngine.getConfig().minColumns).toBe(2);
      expect(customEngine.getConfig().minRows).toBe(2);
    });
  });

  describe('위젯 레이아웃 초기화', () => {
    it('위젯 레이아웃을 초기화해야 함', () => {
      engine.initializeLayout(mockWidgets);
      const layout = engine.getLayout();
      
      expect(layout).toHaveLength(2);
      expect(layout[0].id).toBe('widget-1');
      expect(layout[1].id).toBe('widget-2');
    });

    it('빈 배열로 레이아웃을 초기화해야 함', () => {
      engine.initializeLayout([]);
      const layout = engine.getLayout();
      
      expect(layout).toHaveLength(0);
    });

    it('중복된 위젯 ID를 필터링해야 함', () => {
      const duplicateWidgets = [
        ...mockWidgets,
        { ...mockWidgets[0], position: { gridColumn: 5, gridRow: 1, columns: 2, rows: 2 } },
      ];
      
      engine.initializeLayout(duplicateWidgets);
      const layout = engine.getLayout();
      
      expect(layout).toHaveLength(2);
    });
  });

  describe('충돌 감지', () => {
    beforeEach(() => {
      engine.initializeLayout(mockWidgets);
    });

    it('충돌하는 위젯을 감지해야 함', () => {
      const newWidget: IOSStyleWidget = {
        id: 'widget-3',
        type: 'note',
        position: {
          gridColumn: 2,
          gridRow: 1,
          columns: 2,
          rows: 2,
        },
        data: {} as any,
      };

      const collisions = engine.detectCollisions(newWidget);
      expect(collisions).toHaveLength(1);
      expect(collisions[0].id).toBe('widget-1');
    });

    it('충돌하지 않는 위젯은 빈 배열을 반환해야 함', () => {
      const newWidget: IOSStyleWidget = {
        id: 'widget-3',
        type: 'note',
        position: {
          gridColumn: 5,
          gridRow: 1,
          columns: 2,
          rows: 2,
        },
        data: {} as any,
      };

      const collisions = engine.detectCollisions(newWidget);
      expect(collisions).toHaveLength(0);
    });

    it('자기 자신과는 충돌하지 않아야 함', () => {
      const collisions = engine.detectCollisions(mockWidgets[0]);
      expect(collisions).toHaveLength(0);
    });
  });

  describe('위젯 이동', () => {
    beforeEach(() => {
      engine.initializeLayout(mockWidgets);
    });

    it('위젯을 새 위치로 이동해야 함', () => {
      const result = engine.moveWidget('widget-1', { gridColumn: 5, gridRow: 3 });
      
      expect(result.success).toBe(true);
      expect(result.widget?.position.gridColumn).toBe(5);
      expect(result.widget?.position.gridRow).toBe(3);
    });

    it('충돌 시 이동을 실패해야 함', () => {
      const result = engine.moveWidget('widget-1', { gridColumn: 3, gridRow: 1 });
      
      expect(result.success).toBe(false);
      expect(result.collisions).toHaveLength(1);
      expect(result.collisions?.[0].id).toBe('widget-2');
    });

    it('존재하지 않는 위젯 이동 시 실패해야 함', () => {
      const result = engine.moveWidget('non-existent', { gridColumn: 1, gridRow: 1 });
      
      expect(result.success).toBe(false);
      expect(result.widget).toBeUndefined();
    });

    it('경계를 벗어나는 이동을 방지해야 함', () => {
      const result = engine.moveWidget('widget-1', { gridColumn: 8, gridRow: 1 });
      
      expect(result.success).toBe(false);
    });
  });

  describe('위젯 크기 조정', () => {
    beforeEach(() => {
      engine.initializeLayout(mockWidgets);
    });

    it('위젯 크기를 조정해야 함', () => {
      const result = engine.resizeWidget('widget-1', { columns: 3, rows: 3 });
      
      expect(result.success).toBe(true);
      expect(result.widget?.position.columns).toBe(3);
      expect(result.widget?.position.rows).toBe(3);
    });

    it('충돌 시 크기 조정을 실패해야 함', () => {
      const result = engine.resizeWidget('widget-1', { columns: 4, rows: 2 });
      
      expect(result.success).toBe(false);
      expect(result.collisions).toHaveLength(1);
    });

    it('최소 크기보다 작게 조정할 수 없어야 함', () => {
      const result = engine.resizeWidget('widget-1', { columns: 0, rows: 0 });
      
      expect(result.success).toBe(false);
    });

    it('경계를 벗어나는 크기 조정을 방지해야 함', () => {
      const result = engine.resizeWidget('widget-1', { columns: 10, rows: 2 });
      
      expect(result.success).toBe(false);
    });
  });

  describe('위젯 추가/제거', () => {
    beforeEach(() => {
      engine.initializeLayout(mockWidgets);
    });

    it('새 위젯을 추가해야 함', () => {
      const newWidget: IOSStyleWidget = {
        id: 'widget-3',
        type: 'note',
        position: {
          gridColumn: 5,
          gridRow: 1,
          columns: 2,
          rows: 2,
        },
        data: {} as any,
      };

      const result = engine.addWidget(newWidget);
      
      expect(result.success).toBe(true);
      expect(engine.getLayout()).toHaveLength(3);
    });

    it('충돌하는 위젯 추가를 실패해야 함', () => {
      const newWidget: IOSStyleWidget = {
        id: 'widget-3',
        type: 'note',
        position: {
          gridColumn: 1,
          gridRow: 1,
          columns: 2,
          rows: 2,
        },
        data: {} as any,
      };

      const result = engine.addWidget(newWidget);
      
      expect(result.success).toBe(false);
      expect(engine.getLayout()).toHaveLength(2);
    });

    it('위젯을 제거해야 함', () => {
      const result = engine.removeWidget('widget-1');
      
      expect(result).toBe(true);
      expect(engine.getLayout()).toHaveLength(1);
      expect(engine.getLayout()[0].id).toBe('widget-2');
    });

    it('존재하지 않는 위젯 제거 시 false를 반환해야 함', () => {
      const result = engine.removeWidget('non-existent');
      
      expect(result).toBe(false);
      expect(engine.getLayout()).toHaveLength(2);
    });
  });

  describe('자동 재배치', () => {
    it('자동 재배치를 수행해야 함', () => {
      const sparseWidgets: IOSStyleWidget[] = [
        {
          id: 'widget-1',
          type: 'analytics',
          position: {
            gridColumn: 1,
            gridRow: 3,
            columns: 2,
            rows: 2,
          },
          data: {} as any,
        },
        {
          id: 'widget-2',
          type: 'calendar',
          position: {
            gridColumn: 3,
            gridRow: 5,
            columns: 2,
            rows: 2,
          },
          data: {} as any,
        },
      ];

      engine.initializeLayout(sparseWidgets);
      const result = engine.applyAutoReflow();
      
      expect(result.success).toBe(true);
      expect(result.layout).toBeDefined();
      
      const layout = engine.getLayout();
      expect(layout[0].position.gridRow).toBeLessThan(3);
      expect(layout[1].position.gridRow).toBeLessThan(5);
    });

    it('빈 레이아웃에서 자동 재배치를 처리해야 함', () => {
      engine.initializeLayout([]);
      const result = engine.applyAutoReflow();
      
      expect(result.success).toBe(true);
      expect(result.layout).toHaveLength(0);
    });
  });

  describe('최적 위치 찾기', () => {
    beforeEach(() => {
      engine.initializeLayout(mockWidgets);
    });

    it('위젯에 대한 최적 위치를 찾아야 함', () => {
      const position = engine.findOptimalPosition({ columns: 2, rows: 2 });
      
      expect(position).toBeDefined();
      expect(position?.gridColumn).toBeGreaterThanOrEqual(1);
      expect(position?.gridRow).toBeGreaterThanOrEqual(1);
    });

    it('너무 큰 위젯에 대해 null을 반환해야 함', () => {
      const position = engine.findOptimalPosition({ columns: 10, rows: 10 });
      
      expect(position).toBeNull();
    });

    it('가득 찬 그리드에서 빈 공간을 찾아야 함', () => {
      const fullWidgets: IOSStyleWidget[] = [];
      
      // 그리드의 첫 번째 행을 채움
      for (let i = 0; i < 4; i++) {
        fullWidgets.push({
          id: `widget-${i}`,
          type: 'note',
          position: {
            gridColumn: i * 2 + 1,
            gridRow: 1,
            columns: 2,
            rows: 2,
          },
          data: {} as any,
        });
      }

      engine.initializeLayout(fullWidgets);
      const position = engine.findOptimalPosition({ columns: 2, rows: 2 });
      
      expect(position).toBeDefined();
      expect(position?.gridRow).toBeGreaterThan(2);
    });
  });

  describe('레이아웃 유효성 검증', () => {
    it('유효한 레이아웃을 검증해야 함', () => {
      engine.initializeLayout(mockWidgets);
      const isValid = engine.validateLayout();
      
      expect(isValid).toBe(true);
    });

    it('충돌하는 레이아웃을 무효로 판정해야 함', () => {
      const invalidWidgets: IOSStyleWidget[] = [
        {
          id: 'widget-1',
          type: 'analytics',
          position: {
            gridColumn: 1,
            gridRow: 1,
            columns: 2,
            rows: 2,
          },
          data: {} as any,
        },
        {
          id: 'widget-2',
          type: 'calendar',
          position: {
            gridColumn: 1,
            gridRow: 1,
            columns: 2,
            rows: 2,
          },
          data: {} as any,
        },
      ];

      engine.initializeLayout(invalidWidgets);
      const isValid = engine.validateLayout();
      
      expect(isValid).toBe(false);
    });

    it('경계를 벗어나는 위젯이 있는 레이아웃을 무효로 판정해야 함', () => {
      const outOfBoundsWidgets: IOSStyleWidget[] = [
        {
          id: 'widget-1',
          type: 'analytics',
          position: {
            gridColumn: 7,
            gridRow: 1,
            columns: 3,
            rows: 2,
          },
          data: {} as any,
        },
      ];

      engine.initializeLayout(outOfBoundsWidgets);
      const isValid = engine.validateLayout();
      
      expect(isValid).toBe(false);
    });
  });

  describe('드래그 앤 드롭 지원', () => {
    beforeEach(() => {
      engine.initializeLayout(mockWidgets);
    });

    it('드래그 미리보기를 생성해야 함', () => {
      const preview = engine.getDragPreview('widget-1', { gridColumn: 5, gridRow: 3 });
      
      expect(preview).toBeDefined();
      expect(preview?.position.gridColumn).toBe(5);
      expect(preview?.position.gridRow).toBe(3);
      expect(preview?.isValid).toBe(true);
    });

    it('충돌하는 드래그 미리보기를 무효로 표시해야 함', () => {
      const preview = engine.getDragPreview('widget-1', { gridColumn: 3, gridRow: 1 });
      
      expect(preview?.isValid).toBe(false);
      expect(preview?.collisions).toHaveLength(1);
    });

    it('드롭 작업을 수행해야 함', () => {
      const result = engine.handleDrop('widget-1', { gridColumn: 5, gridRow: 3 });
      
      expect(result.success).toBe(true);
      expect(result.layout).toBeDefined();
    });
  });
});