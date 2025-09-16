import { widgetEventBus, WidgetEventTypes, emitWidgetEvent, subscribeToWidgetEvent } from '../widget-event-bus';

describe('WidgetEventBus', () => {
  beforeEach(() => {
    // 각 테스트 전 이벤트 버스 초기화
    widgetEventBus.unsubscribeAll();
    widgetEventBus.clearHistory();
  });

  describe('기본 이벤트 발행/구독', () => {
    it('이벤트를 발행하고 구독자가 받을 수 있어야 함', (done) => {
      const testData = { message: 'Hello Widget!' };
      
      widgetEventBus.subscribe('test-event', (data) => {
        expect(data).toEqual(testData);
        done();
      });
      
      widgetEventBus.emit({
        type: 'test-event',
        source: 'test-widget',
        data: testData
      });
    });

    it('여러 구독자가 동일한 이벤트를 받을 수 있어야 함', () => {
      const results: number[] = [];
      
      widgetEventBus.subscribe('multi-test', (data) => {
        results.push(data.value * 2);
      });
      
      widgetEventBus.subscribe('multi-test', (data) => {
        results.push(data.value * 3);
      });
      
      widgetEventBus.emit({
        type: 'multi-test',
        source: 'test',
        data: { value: 10 }
      });
      
      expect(results).toEqual([20, 30]);
    });

    it('타겟이 지정된 이벤트는 해당 타겟 구독자만 받아야 함', () => {
      const results: string[] = [];
      
      // 특정 타겟 구독
      widgetEventBus.subscribe('targeted-event', (data) => {
        results.push(`widget-a: ${data.message}`);
      }, { target: 'widget-a' });
      
      // 일반 구독
      widgetEventBus.subscribe('targeted-event', (data) => {
        results.push(`general: ${data.message}`);
      });
      
      widgetEventBus.emit({
        type: 'targeted-event',
        source: 'sender',
        target: 'widget-a',
        data: { message: 'Hello' }
      });
      
      expect(results).toEqual(['widget-a: Hello', 'general: Hello']);
    });
  });

  describe('구독 해제', () => {
    it('unsubscribe로 특정 핸들러를 해제할 수 있어야 함', () => {
      let count = 0;
      const handler = () => { count++; };
      
      const subscription = widgetEventBus.subscribe('unsubscribe-test', handler);
      
      widgetEventBus.emit({
        type: 'unsubscribe-test',
        source: 'test',
        data: {}
      });
      
      expect(count).toBe(1);
      
      subscription.unsubscribe();
      
      widgetEventBus.emit({
        type: 'unsubscribe-test',
        source: 'test',
        data: {}
      });
      
      expect(count).toBe(1); // 변경 없음
    });

    it('unsubscribeAll로 모든 구독을 해제할 수 있어야 함', () => {
      let count = 0;
      
      widgetEventBus.subscribe('clear-test-1', () => { count++; });
      widgetEventBus.subscribe('clear-test-2', () => { count++; });
      
      widgetEventBus.unsubscribeAll();
      
      widgetEventBus.emit({ type: 'clear-test-1', source: 'test', data: {} });
      widgetEventBus.emit({ type: 'clear-test-2', source: 'test', data: {} });
      
      expect(count).toBe(0);
    });
  });

  describe('이벤트 히스토리', () => {
    it('이벤트 히스토리를 저장해야 함', () => {
      widgetEventBus.emit({
        type: 'history-test',
        source: 'widget-1',
        data: { value: 1 }
      });
      
      widgetEventBus.emit({
        type: 'history-test',
        source: 'widget-2',
        data: { value: 2 }
      });
      
      const history = widgetEventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].source).toBe('widget-1');
      expect(history[1].source).toBe('widget-2');
    });

    it('히스토리를 필터링할 수 있어야 함', () => {
      widgetEventBus.emit({
        type: 'type-a',
        source: 'widget-1',
        data: {}
      });
      
      widgetEventBus.emit({
        type: 'type-b',
        source: 'widget-2',
        data: {}
      });
      
      widgetEventBus.emit({
        type: 'type-a',
        source: 'widget-3',
        data: {}
      });
      
      const filteredHistory = widgetEventBus.getHistory({ type: 'type-a' });
      expect(filteredHistory).toHaveLength(2);
      expect(filteredHistory.every(e => e.type === 'type-a')).toBe(true);
    });

    it('히스토리 크기를 제한할 수 있어야 함', () => {
      widgetEventBus.emit({ type: 'test', source: 'widget-1', data: {} });
      widgetEventBus.emit({ type: 'test', source: 'widget-2', data: {} });
      widgetEventBus.emit({ type: 'test', source: 'widget-3', data: {} });
      
      const limitedHistory = widgetEventBus.getHistory({ limit: 2 });
      expect(limitedHistory).toHaveLength(2);
      expect(limitedHistory[0].source).toBe('widget-2');
      expect(limitedHistory[1].source).toBe('widget-3');
    });
  });

  describe('타입 안전한 헬퍼 함수', () => {
    it('emitWidgetEvent와 subscribeToWidgetEvent가 올바르게 동작해야 함', (done) => {
      const subscription = subscribeToWidgetEvent(
        WidgetEventTypes.DATA_UPDATE,
        (data) => {
          expect(data.widgetId).toBe('test-widget');
          expect(data.data).toEqual({ value: 42 });
          expect(data.changes).toEqual(['value']);
          done();
        }
      );
      
      emitWidgetEvent(
        WidgetEventTypes.DATA_UPDATE,
        'source-widget',
        {
          widgetId: 'test-widget',
          data: { value: 42 },
          changes: ['value']
        }
      );
    });

    it('타겟이 지정된 타입 안전한 이벤트가 동작해야 함', () => {
      const results: string[] = [];
      
      subscribeToWidgetEvent(
        WidgetEventTypes.MESSAGE,
        (data) => {
          results.push(`Received: ${data.message}`);
        },
        { target: 'widget-b' }
      );
      
      emitWidgetEvent(
        WidgetEventTypes.MESSAGE,
        'widget-a',
        {
          from: 'widget-a',
          to: 'widget-b',
          message: 'Hello B!'
        },
        'widget-b'
      );
      
      expect(results).toEqual(['Received: Hello B!']);
    });
  });

  describe('에러 처리', () => {
    it('핸들러에서 에러가 발생해도 다른 핸들러는 실행되어야 함', () => {
      const results: number[] = [];
      
      widgetEventBus.subscribe('error-test', () => {
        throw new Error('Handler error');
      });
      
      widgetEventBus.subscribe('error-test', (data) => {
        results.push(data.value);
      });
      
      // 콘솔 에러를 무시
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      widgetEventBus.emit({
        type: 'error-test',
        source: 'test',
        data: { value: 100 }
      });
      
      expect(results).toEqual([100]);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('디버그 정보', () => {
    it('디버그 정보를 제공해야 함', () => {
      widgetEventBus.subscribe('debug-1', () => {});
      widgetEventBus.subscribe('debug-1', () => {});
      widgetEventBus.subscribe('debug-2', () => {});
      
      widgetEventBus.emit({ type: 'debug-1', source: 'test', data: {} });
      
      const debugInfo = widgetEventBus.getDebugInfo();
      
      expect(debugInfo.subscriberCount).toBe(2); // 'debug-1'과 'debug-2'
      expect(debugInfo.historySize).toBe(1);
      expect(debugInfo.subscribers).toContainEqual({
        key: 'debug-1',
        handlerCount: 2
      });
    });
  });
});