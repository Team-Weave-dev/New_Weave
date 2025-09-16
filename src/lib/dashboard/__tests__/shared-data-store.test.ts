import { useSharedDataStore, sharedDataStore } from '../shared-data-store';
import { widgetEventBus } from '../widget-event-bus';

describe('SharedDataStore', () => {
  beforeEach(() => {
    // 스토어와 이벤트 버스 초기화
    sharedDataStore.clear();
    widgetEventBus.unsubscribeAll();
    widgetEventBus.clearHistory();
  });

  describe('위젯 데이터 관리', () => {
    it('위젯 데이터를 저장하고 조회할 수 있어야 함', () => {
      const widgetData = {
        title: 'Test Widget',
        value: 42
      };
      
      sharedDataStore.setData('widget-1', widgetData);
      
      const retrieved = sharedDataStore.getData('widget-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.data).toEqual(widgetData);
      expect(retrieved?.id).toBe('widget-1');
      expect(retrieved?.metadata?.version).toBe(1);
    });

    it('위젯 데이터 업데이트 시 버전이 증가해야 함', () => {
      sharedDataStore.setData('widget-1', { value: 1 });
      const v1 = sharedDataStore.getData('widget-1');
      expect(v1?.metadata?.version).toBe(1);
      
      sharedDataStore.setData('widget-1', { value: 2 });
      const v2 = sharedDataStore.getData('widget-1');
      expect(v2?.metadata?.version).toBe(2);
    });

    it('위젯 데이터 삭제가 동작해야 함', () => {
      sharedDataStore.setData('widget-1', { value: 1 });
      expect(sharedDataStore.getData('widget-1')).toBeDefined();
      
      sharedDataStore.deleteData('widget-1');
      expect(sharedDataStore.getData('widget-1')).toBeUndefined();
    });

    it('메타데이터를 커스텀 설정할 수 있어야 함', () => {
      sharedDataStore.setData('widget-1', { value: 1 }, {
        source: 'api',
        version: 10
      });
      
      const data = sharedDataStore.getData('widget-1');
      expect(data?.metadata?.source).toBe('api');
      expect(data?.metadata?.version).toBe(10);
    });
  });

  describe('구독 관리', () => {
    it('위젯 간 구독 관계를 설정할 수 있어야 함', () => {
      sharedDataStore.subscribe('widget-1', 'widget-2');
      sharedDataStore.subscribe('widget-1', 'widget-3');
      
      const subscriptions = sharedDataStore.getSubscriptions('widget-1');
      expect(subscriptions).toContain('widget-2');
      expect(subscriptions).toContain('widget-3');
    });

    it('구독 해제가 동작해야 함', () => {
      sharedDataStore.subscribe('widget-1', 'widget-2');
      sharedDataStore.subscribe('widget-1', 'widget-3');
      
      sharedDataStore.unsubscribe('widget-1', 'widget-2');
      
      const subscriptions = sharedDataStore.getSubscriptions('widget-1');
      expect(subscriptions).not.toContain('widget-2');
      expect(subscriptions).toContain('widget-3');
    });

    it('구독자 목록을 조회할 수 있어야 함', () => {
      sharedDataStore.subscribe('widget-1', 'widget-target');
      sharedDataStore.subscribe('widget-2', 'widget-target');
      sharedDataStore.subscribe('widget-3', 'widget-target');
      
      const subscribers = sharedDataStore.getSubscribers('widget-target');
      expect(subscribers).toHaveLength(3);
      expect(subscribers).toContain('widget-1');
      expect(subscribers).toContain('widget-2');
      expect(subscribers).toContain('widget-3');
    });

    it('위젯 삭제 시 관련 구독도 정리되어야 함', () => {
      sharedDataStore.subscribe('widget-1', 'widget-2');
      sharedDataStore.subscribe('widget-2', 'widget-3');
      
      sharedDataStore.deleteData('widget-2');
      
      const subscriptions = sharedDataStore.getSubscriptions('widget-1');
      expect(subscriptions).not.toContain('widget-2');
      
      const subscribers = sharedDataStore.getSubscribers('widget-3');
      expect(subscribers).not.toContain('widget-2');
    });
  });

  describe('전역 데이터 관리', () => {
    it('전역 데이터를 저장하고 조회할 수 있어야 함', () => {
      sharedDataStore.setGlobalData('theme', 'dark');
      sharedDataStore.setGlobalData('user', { id: 1, name: 'Test User' });
      
      expect(sharedDataStore.getGlobalData('theme')).toBe('dark');
      expect(sharedDataStore.getGlobalData('user')).toEqual({
        id: 1,
        name: 'Test User'
      });
    });

    it('전역 데이터를 삭제할 수 있어야 함', () => {
      sharedDataStore.setGlobalData('temp', 'value');
      expect(sharedDataStore.getGlobalData('temp')).toBe('value');
      
      sharedDataStore.deleteGlobalData('temp');
      expect(sharedDataStore.getGlobalData('temp')).toBeUndefined();
    });
  });

  describe('이벤트 통합', () => {
    it('데이터 업데이트 시 이벤트가 발행되어야 함', (done) => {
      widgetEventBus.subscribe('widget:data:update', (data) => {
        expect(data.widgetId).toBe('widget-1');
        expect(data.data).toEqual({ value: 100 });
        done();
      });
      
      sharedDataStore.setData('widget-1', { value: 100 });
    });

    it('구독자들에게 데이터 업데이트 이벤트가 전달되어야 함', () => {
      const received: any[] = [];
      
      // widget-2가 widget-1의 데이터 업데이트를 받도록 설정
      widgetEventBus.subscribe('widget:data:update', (data) => {
        received.push(data);
      }, { target: 'widget-2' });
      
      // widget-2가 widget-1을 구독
      sharedDataStore.subscribe('widget-2', 'widget-1');
      
      // widget-1의 데이터 업데이트
      sharedDataStore.setData('widget-1', { value: 200 });
      
      // widget-2에 타겟팅된 이벤트를 받았는지 확인
      const targetedEvent = received.find(r => r.widgetId === 'widget-1');
      expect(targetedEvent).toBeDefined();
      expect(targetedEvent?.data).toEqual({ value: 200 });
    });

    it('위젯 삭제 시 destroy 이벤트가 발행되어야 함', (done) => {
      sharedDataStore.setData('widget-1', { value: 1 });
      
      widgetEventBus.subscribe('widget:destroy', (data) => {
        expect(data.widgetId).toBe('widget-1');
        done();
      });
      
      sharedDataStore.deleteData('widget-1');
    });

    it('전역 데이터 변경 시 이벤트가 발행되어야 함', (done) => {
      widgetEventBus.subscribe('global:data:update', (data) => {
        expect(data.key).toBe('config');
        expect(data.value).toEqual({ setting: 'value' });
        done();
      });
      
      sharedDataStore.setGlobalData('config', { setting: 'value' });
    });
  });

  describe('스냅샷과 복원', () => {
    it('현재 상태의 스냅샷을 생성할 수 있어야 함', () => {
      sharedDataStore.setData('widget-1', { value: 1 });
      sharedDataStore.setData('widget-2', { value: 2 });
      sharedDataStore.subscribe('widget-1', 'widget-2');
      sharedDataStore.setGlobalData('theme', 'light');
      
      const snapshot = sharedDataStore.getSnapshot();
      
      expect(snapshot.widgets).toHaveLength(2);
      expect(snapshot.subscriptions).toHaveLength(1);
      expect(snapshot.globalData).toHaveLength(1);
    });

    it('스냅샷에서 상태를 복원할 수 있어야 함', () => {
      // 초기 상태 설정
      sharedDataStore.setData('widget-1', { value: 1 });
      sharedDataStore.subscribe('widget-1', 'widget-2');
      sharedDataStore.setGlobalData('theme', 'dark');
      
      // 스냅샷 생성
      const snapshot = sharedDataStore.getSnapshot();
      
      // 스토어 초기화
      sharedDataStore.clear();
      expect(sharedDataStore.getData('widget-1')).toBeUndefined();
      
      // 스냅샷에서 복원
      sharedDataStore.restore(snapshot);
      
      // 복원 확인
      const restoredWidget = sharedDataStore.getData('widget-1');
      expect(restoredWidget?.data).toEqual({ value: 1 });
      expect(sharedDataStore.getSubscriptions('widget-1')).toContain('widget-2');
      expect(sharedDataStore.getGlobalData('theme')).toBe('dark');
    });
  });

  describe('React Hooks (모의 테스트)', () => {
    it('useWidgetData 훅 기본 동작 확인', () => {
      // Zustand 스토어를 직접 테스트
      const state = useSharedDataStore.getState();
      
      state.setData('widget-1', { value: 42 });
      const data = state.getData('widget-1');
      
      expect(data?.data).toEqual({ value: 42 });
    });

    it('useGlobalData 훅 기본 동작 확인', () => {
      const state = useSharedDataStore.getState();
      
      state.setGlobalData('theme', 'dark');
      const theme = state.getGlobalData('theme');
      
      expect(theme).toBe('dark');
    });

    it('useMultipleWidgetData 훅 기본 동작 확인', () => {
      const state = useSharedDataStore.getState();
      
      state.setData('widget-1', { value: 1 });
      state.setData('widget-2', { value: 2 });
      state.setData('widget-3', { value: 3 });
      
      const widgets = ['widget-1', 'widget-2', 'widget-3']
        .map(id => state.widgets.get(id));
      
      expect(widgets).toHaveLength(3);
      expect(widgets[0]?.data).toEqual({ value: 1 });
      expect(widgets[1]?.data).toEqual({ value: 2 });
      expect(widgets[2]?.data).toEqual({ value: 3 });
    });

    it('useSharedDataDebug 훅 기본 동작 확인', () => {
      const state = useSharedDataStore.getState();
      
      state.setData('widget-1', { value: 1 });
      state.subscribe('widget-1', 'widget-2');
      state.setGlobalData('debug', true);
      
      const debugInfo = {
        widgetCount: state.widgets.size,
        subscriptionCount: state.subscriptions.size,
        globalDataCount: state.globalData.size
      };
      
      expect(debugInfo.widgetCount).toBe(1);
      expect(debugInfo.subscriptionCount).toBe(1);
      expect(debugInfo.globalDataCount).toBe(1);
    });
  });

  describe('동시성 및 경쟁 조건', () => {
    it('동시에 여러 데이터 업데이트가 발생해도 순서대로 처리되어야 함', () => {
      const updates: number[] = [];
      
      widgetEventBus.subscribe('widget:data:update', (data) => {
        updates.push(data.data.value);
      });
      
      // 빠르게 연속 업데이트
      for (let i = 1; i <= 5; i++) {
        sharedDataStore.setData('widget-1', { value: i });
      }
      
      expect(updates).toEqual([1, 2, 3, 4, 5]);
      
      const finalData = sharedDataStore.getData('widget-1');
      expect(finalData?.data.value).toBe(5);
      expect(finalData?.metadata?.version).toBe(5);
    });
  });
});