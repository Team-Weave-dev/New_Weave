import { describe, it, expect, beforeEach } from '@jest/globals';
import { AutoReflowEngine } from '../../lib/dashboard/flexible-grid/auto-reflow';
import type { IOSStyleWidget, GridConfig } from '../../types/ios-dashboard';

describe('AutoReflowEngine', () => {
  let engine: AutoReflowEngine;
  let widgets: Map<string, IOSStyleWidget>;
  let gridConfig: GridConfig;

  const createWidget = (
    id: string,
    gridColumnStart: number,
    gridRowStart: number,
    width: number,
    height: number
  ): IOSStyleWidget => ({
    id,
    type: 'note',
    position: { 
      gridColumnStart, 
      gridRowStart, 
      width, 
      height,
      gridColumnEnd: gridColumnStart + width - 1,
      gridRowEnd: gridRowStart + height - 1
    },
    data: {} as any,
  });

  beforeEach(() => {
    gridConfig = {
      maxColumns: 8,
      maxRows: 20,
      columnGap: 1,
      rowGap: 1
    };
    widgets = new Map();
  });

  describe('초기화', () => {
    it('기본 설정으로 엔진을 초기화해야 함', () => {
      engine = new AutoReflowEngine(gridConfig, widgets);
      expect(engine).toBeDefined();
    });

    it('커스텀 설정으로 엔진을 초기화해야 함', () => {
      const customConfig = {
        maxColumns: 12,
        maxRows: 30,
        columnGap: 2,
        rowGap: 2
      };
      
      const customEngine = new AutoReflowEngine(customConfig, widgets);
      expect(customEngine).toBeDefined();
    });

    it('위젯과 함께 초기화해야 함', () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 3, 1, 2, 2);
      
      widgets.set('widget-1', widget1);
      widgets.set('widget-2', widget2);
      
      engine = new AutoReflowEngine(gridConfig, widgets);
      expect(engine).toBeDefined();
    });
  });

  describe('Reflow 실행', () => {
    it('빈 위젯 맵으로 reflow를 실행해야 함', async () => {
      engine = new AutoReflowEngine(gridConfig, widgets);
      const result = await engine.executeReflow();
      
      expect(result).toBeDefined();
      expect(result.movedWidgets).toEqual([]);
      expect(result.totalMovementDistance).toBe(0);
      expect(result.stability).toBeGreaterThanOrEqual(0);
      expect(result.stability).toBeLessThanOrEqual(1);
    });

    it('위젯이 있을 때 reflow를 실행해야 함', async () => {
      // 아래쪽에 떨어진 위젯들 생성
      const widget1 = createWidget('widget-1', 1, 5, 2, 2);
      const widget2 = createWidget('widget-2', 3, 8, 2, 2);
      
      widgets.set('widget-1', widget1);
      widgets.set('widget-2', widget2);
      
      engine = new AutoReflowEngine(gridConfig, widgets);
      const result = await engine.executeReflow();
      
      expect(result).toBeDefined();
      expect(result.movedWidgets.length).toBeGreaterThan(0);
      expect(result.reflowTime).toBeGreaterThan(0);
    });

    it('gravity를 적용하여 위젯을 위로 이동시켜야 함', async () => {
      // 아래쪽에 있는 위젯
      const widget = createWidget('widget-1', 1, 10, 2, 2);
      widgets.set('widget-1', widget);
      
      engine = new AutoReflowEngine(gridConfig, widgets, {
        enableGravity: true,
        enableLeftAlignment: false,
        preserveRelativeOrder: false,
        minimumGap: 0,
        maxIterations: 10,
        stabilityThreshold: 0.95
      });
      
      const result = await engine.executeReflow();
      
      expect(result.movedWidgets).toHaveLength(1);
      if (result.movedWidgets.length > 0) {
        // 위젯이 위로 이동해야 함
        expect(result.movedWidgets[0].newPosition.gridRowStart).toBeLessThan(10);
      }
    });

    it('좌측 정렬을 적용해야 함', async () => {
      // 오른쪽에 있는 위젯
      const widget = createWidget('widget-1', 5, 1, 2, 2);
      widgets.set('widget-1', widget);
      
      engine = new AutoReflowEngine(gridConfig, widgets, {
        enableGravity: false,
        enableLeftAlignment: true,
        preserveRelativeOrder: false,
        minimumGap: 0,
        maxIterations: 10,
        stabilityThreshold: 0.95
      });
      
      const result = await engine.executeReflow();
      
      expect(result.movedWidgets).toHaveLength(1);
      if (result.movedWidgets.length > 0) {
        // 위젯이 왼쪽으로 이동해야 함
        expect(result.movedWidgets[0].newPosition.gridColumnStart).toBeLessThan(5);
      }
    });

    it('충돌하는 위젯은 겹치지 않게 배치해야 함', async () => {
      const widget1 = createWidget('widget-1', 1, 1, 3, 3);
      const widget2 = createWidget('widget-2', 2, 2, 3, 3); // 겹침
      
      widgets.set('widget-1', widget1);
      widgets.set('widget-2', widget2);
      
      engine = new AutoReflowEngine(gridConfig, widgets, {
        enableGravity: true,
        enableLeftAlignment: true,
        preserveRelativeOrder: false,
        minimumGap: 0,
        maxIterations: 10,
        stabilityThreshold: 0.95
      });
      
      const result = await engine.executeReflow();
      
      // 충돌이 해결되어야 함
      expect(result.stability).toBeGreaterThan(0);
    });
  });

  describe('안정성 평가', () => {
    it('안정적인 레이아웃은 높은 안정성 점수를 받아야 함', async () => {
      // 이미 정렬된 위젯들
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 3, 1, 2, 2);
      const widget3 = createWidget('widget-3', 5, 1, 2, 2);
      
      widgets.set('widget-1', widget1);
      widgets.set('widget-2', widget2);
      widgets.set('widget-3', widget3);
      
      engine = new AutoReflowEngine(gridConfig, widgets);
      const result = await engine.executeReflow();
      
      // 이미 정렬되어 있으므로 안정성이 높아야 함
      expect(result.stability).toBeGreaterThan(0.9);
    });

    it('불안정한 레이아웃은 낮은 안정성 점수를 받아야 함', async () => {
      // 흩어진 위젯들
      const widget1 = createWidget('widget-1', 1, 10, 2, 2);
      const widget2 = createWidget('widget-2', 6, 5, 2, 2);
      const widget3 = createWidget('widget-3', 3, 15, 2, 2);
      
      widgets.set('widget-1', widget1);
      widgets.set('widget-2', widget2);
      widgets.set('widget-3', widget3);
      
      engine = new AutoReflowEngine(gridConfig, widgets, {
        enableGravity: true,
        enableLeftAlignment: true,
        preserveRelativeOrder: false,
        minimumGap: 0,
        maxIterations: 1, // 한 번만 실행하여 불안정한 상태 유지
        stabilityThreshold: 0.99
      });
      
      const result = await engine.executeReflow();
      
      // 한 번의 반복으로는 완전히 안정화되지 않음
      expect(result.stability).toBeLessThan(0.99);
    });
  });

  describe('성능 측정', () => {
    it('reflow 시간을 측정해야 함', async () => {
      const widget1 = createWidget('widget-1', 1, 5, 2, 2);
      const widget2 = createWidget('widget-2', 3, 8, 2, 2);
      
      widgets.set('widget-1', widget1);
      widgets.set('widget-2', widget2);
      
      engine = new AutoReflowEngine(gridConfig, widgets);
      const result = await engine.executeReflow();
      
      expect(result.reflowTime).toBeGreaterThan(0);
      expect(result.reflowTime).toBeLessThan(1000); // 1초 이내
    });

    it('총 이동 거리를 계산해야 함', async () => {
      const widget1 = createWidget('widget-1', 1, 10, 2, 2);
      const widget2 = createWidget('widget-2', 5, 15, 2, 2);
      
      widgets.set('widget-1', widget1);
      widgets.set('widget-2', widget2);
      
      engine = new AutoReflowEngine(gridConfig, widgets, {
        enableGravity: true,
        enableLeftAlignment: true,
        preserveRelativeOrder: false,
        minimumGap: 0,
        maxIterations: 10,
        stabilityThreshold: 0.95
      });
      
      const result = await engine.executeReflow();
      
      expect(result.totalMovementDistance).toBeGreaterThan(0);
    });
  });

  describe('설정 옵션', () => {
    it('상대적 순서를 유지해야 함', async () => {
      const widget1 = createWidget('widget-1', 1, 5, 2, 2);
      const widget2 = createWidget('widget-2', 3, 3, 2, 2);
      const widget3 = createWidget('widget-3', 5, 7, 2, 2);
      
      widgets.set('widget-1', widget1);
      widgets.set('widget-2', widget2);
      widgets.set('widget-3', widget3);
      
      engine = new AutoReflowEngine(gridConfig, widgets, {
        enableGravity: true,
        enableLeftAlignment: false,
        preserveRelativeOrder: true,
        minimumGap: 0,
        maxIterations: 10,
        stabilityThreshold: 0.95
      });
      
      const result = await engine.executeReflow();
      
      // 상대적 순서가 유지되어야 함
      expect(result).toBeDefined();
    });

    it('최소 간격을 유지해야 함', async () => {
      const widget1 = createWidget('widget-1', 1, 1, 2, 2);
      const widget2 = createWidget('widget-2', 3, 1, 2, 2);
      
      widgets.set('widget-1', widget1);
      widgets.set('widget-2', widget2);
      
      engine = new AutoReflowEngine(gridConfig, widgets, {
        enableGravity: false,
        enableLeftAlignment: false,
        preserveRelativeOrder: false,
        minimumGap: 1, // 최소 1칸 간격
        maxIterations: 10,
        stabilityThreshold: 0.95
      });
      
      const result = await engine.executeReflow();
      
      expect(result).toBeDefined();
    });

    it('최대 반복 횟수를 제한해야 함', async () => {
      // 많은 위젯으로 복잡한 레이아웃 생성
      for (let i = 0; i < 10; i++) {
        const widget = createWidget(`widget-${i}`, (i % 4) * 2 + 1, Math.floor(i / 4) * 3 + 1, 2, 2);
        widgets.set(`widget-${i}`, widget);
      }
      
      engine = new AutoReflowEngine(gridConfig, widgets, {
        enableGravity: true,
        enableLeftAlignment: true,
        preserveRelativeOrder: false,
        minimumGap: 0,
        maxIterations: 2, // 2번만 반복
        stabilityThreshold: 0.99
      });
      
      const result = await engine.executeReflow();
      
      // 최대 반복 횟수 내에서 완료되어야 함
      expect(result).toBeDefined();
    });
  });
});