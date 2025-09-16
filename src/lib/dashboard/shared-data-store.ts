import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { widgetEventBus, WidgetEventTypes, emitWidgetEvent } from './widget-event-bus';

/**
 * SharedDataStore - 위젯 간 공유 데이터 저장소
 * 
 * Zustand를 활용하여 위젯 간 데이터를 공유하고
 * 구독 기반으로 실시간 업데이트를 관리합니다.
 */

export interface WidgetData {
  id: string;
  type: string;
  data: any;
  metadata?: {
    lastUpdated: number;
    version?: number;
    source?: string;
  };
}

export interface WidgetSubscription {
  widgetId: string;
  subscribedTo: string[];
  lastAccess?: number;
}

interface SharedDataStoreState {
  // 위젯 데이터 저장소
  widgets: Map<string, WidgetData>;
  
  // 구독 관계 (위젯 ID -> 구독 대상 위젯 ID 목록)
  subscriptions: Map<string, Set<string>>;
  
  // 전역 데이터 (모든 위젯이 접근 가능)
  globalData: Map<string, any>;
  
  // 액션
  setData: (widgetId: string, data: any, metadata?: Partial<WidgetData['metadata']>) => void;
  getData: (widgetId: string) => WidgetData | undefined;
  deleteData: (widgetId: string) => void;
  
  subscribe: (widgetId: string, targetWidgetId: string) => void;
  unsubscribe: (widgetId: string, targetWidgetId: string) => void;
  getSubscribers: (widgetId: string) => string[];
  getSubscriptions: (widgetId: string) => string[];
  
  setGlobalData: (key: string, value: any) => void;
  getGlobalData: (key: string) => any;
  deleteGlobalData: (key: string) => void;
  
  // 유틸리티
  clear: () => void;
  getSnapshot: () => {
    widgets: [string, WidgetData][];
    subscriptions: [string, string[]][];
    globalData: [string, any][];
  };
  restore: (snapshot: ReturnType<SharedDataStoreState['getSnapshot']>) => void;
}

// Zustand 스토어 생성
export const useSharedDataStore = create<SharedDataStoreState>()(
  subscribeWithSelector((set, get) => ({
    widgets: new Map(),
    subscriptions: new Map(),
    globalData: new Map(),
    
    setData: (widgetId: string, data: any, metadata?: Partial<WidgetData['metadata']>) => {
      const currentData = get().widgets.get(widgetId);
      const newData: WidgetData = {
        id: widgetId,
        type: currentData?.type || 'unknown',
        data,
        metadata: {
          lastUpdated: Date.now(),
          version: (currentData?.metadata?.version || 0) + 1,
          source: metadata?.source || 'user',
          ...metadata
        }
      };
      
      set((state) => {
        const newWidgets = new Map(state.widgets);
        newWidgets.set(widgetId, newData);
        return { widgets: newWidgets };
      });
      
      // 이벤트 발행: 데이터 변경 알림
      emitWidgetEvent(
        WidgetEventTypes.DATA_UPDATE,
        widgetId,
        {
          widgetId,
          data: newData.data,
          changes: Object.keys(data)
        }
      );
      
      // 구독자들에게 알림
      const subscribers = get().getSubscribers(widgetId);
      subscribers.forEach(subscriberId => {
        emitWidgetEvent(
          WidgetEventTypes.DATA_UPDATE,
          widgetId,
          {
            widgetId,
            data: newData.data,
            changes: Object.keys(data)
          },
          subscriberId
        );
      });
    },
    
    getData: (widgetId: string) => {
      return get().widgets.get(widgetId);
    },
    
    deleteData: (widgetId: string) => {
      set((state) => {
        const newWidgets = new Map(state.widgets);
        newWidgets.delete(widgetId);
        
        // 구독 관계도 정리
        const newSubscriptions = new Map(state.subscriptions);
        newSubscriptions.delete(widgetId);
        
        // 다른 위젯의 구독에서도 제거
        newSubscriptions.forEach((subscriptions, key) => {
          subscriptions.delete(widgetId);
        });
        
        return { 
          widgets: newWidgets,
          subscriptions: newSubscriptions
        };
      });
      
      // 삭제 이벤트 발행
      widgetEventBus.emit({
        type: WidgetEventTypes.DESTROY,
        source: 'shared-store',
        data: { widgetId }
      });
    },
    
    subscribe: (widgetId: string, targetWidgetId: string) => {
      set((state) => {
        const newSubscriptions = new Map(state.subscriptions);
        
        if (!newSubscriptions.has(widgetId)) {
          newSubscriptions.set(widgetId, new Set());
        }
        
        newSubscriptions.get(widgetId)!.add(targetWidgetId);
        return { subscriptions: newSubscriptions };
      });
    },
    
    unsubscribe: (widgetId: string, targetWidgetId: string) => {
      set((state) => {
        const newSubscriptions = new Map(state.subscriptions);
        const widgetSubs = newSubscriptions.get(widgetId);
        
        if (widgetSubs) {
          widgetSubs.delete(targetWidgetId);
          
          if (widgetSubs.size === 0) {
            newSubscriptions.delete(widgetId);
          }
        }
        
        return { subscriptions: newSubscriptions };
      });
    },
    
    getSubscribers: (widgetId: string) => {
      const subscriptions = get().subscriptions;
      const subscribers: string[] = [];
      
      subscriptions.forEach((targets, subscriberId) => {
        if (targets.has(widgetId)) {
          subscribers.push(subscriberId);
        }
      });
      
      return subscribers;
    },
    
    getSubscriptions: (widgetId: string) => {
      const subscriptions = get().subscriptions.get(widgetId);
      return subscriptions ? Array.from(subscriptions) : [];
    },
    
    setGlobalData: (key: string, value: any) => {
      set((state) => {
        const newGlobalData = new Map(state.globalData);
        newGlobalData.set(key, value);
        return { globalData: newGlobalData };
      });
      
      // 전역 데이터 변경 이벤트
      widgetEventBus.emit({
        type: 'global:data:update',
        source: 'shared-store',
        data: { key, value }
      });
    },
    
    getGlobalData: (key: string) => {
      return get().globalData.get(key);
    },
    
    deleteGlobalData: (key: string) => {
      set((state) => {
        const newGlobalData = new Map(state.globalData);
        newGlobalData.delete(key);
        return { globalData: newGlobalData };
      });
    },
    
    clear: () => {
      set({
        widgets: new Map(),
        subscriptions: new Map(),
        globalData: new Map()
      });
      
      widgetEventBus.emit({
        type: 'store:clear',
        source: 'shared-store',
        data: {}
      });
    },
    
    getSnapshot: () => {
      const state = get();
      return {
        widgets: Array.from(state.widgets.entries()),
        subscriptions: Array.from(state.subscriptions.entries()).map(([key, value]) => [
          key,
          Array.from(value)
        ]),
        globalData: Array.from(state.globalData.entries())
      };
    },
    
    restore: (snapshot) => {
      set({
        widgets: new Map(snapshot.widgets),
        subscriptions: new Map(
          snapshot.subscriptions.map(([key, value]) => [key, new Set(value)])
        ),
        globalData: new Map(snapshot.globalData)
      });
      
      widgetEventBus.emit({
        type: 'store:restore',
        source: 'shared-store',
        data: { snapshot }
      });
    }
  }))
);

// 싱글톤 인스턴스를 위한 헬퍼
export const sharedDataStore = {
  setData: (widgetId: string, data: any, metadata?: Partial<WidgetData['metadata']>) => {
    useSharedDataStore.getState().setData(widgetId, data, metadata);
  },
  
  getData: (widgetId: string) => {
    return useSharedDataStore.getState().getData(widgetId);
  },
  
  deleteData: (widgetId: string) => {
    useSharedDataStore.getState().deleteData(widgetId);
  },
  
  subscribe: (widgetId: string, targetWidgetId: string) => {
    useSharedDataStore.getState().subscribe(widgetId, targetWidgetId);
  },
  
  unsubscribe: (widgetId: string, targetWidgetId: string) => {
    useSharedDataStore.getState().unsubscribe(widgetId, targetWidgetId);
  },
  
  getSubscribers: (widgetId: string) => {
    return useSharedDataStore.getState().getSubscribers(widgetId);
  },
  
  getSubscriptions: (widgetId: string) => {
    return useSharedDataStore.getState().getSubscriptions(widgetId);
  },
  
  setGlobalData: (key: string, value: any) => {
    useSharedDataStore.getState().setGlobalData(key, value);
  },
  
  getGlobalData: (key: string) => {
    return useSharedDataStore.getState().getGlobalData(key);
  },
  
  deleteGlobalData: (key: string) => {
    useSharedDataStore.getState().deleteGlobalData(key);
  },
  
  clear: () => {
    useSharedDataStore.getState().clear();
  },
  
  getSnapshot: () => {
    return useSharedDataStore.getState().getSnapshot();
  },
  
  restore: (snapshot: ReturnType<SharedDataStoreState['getSnapshot']>) => {
    useSharedDataStore.getState().restore(snapshot);
  }
};

// React Hook으로 특정 위젯 데이터 구독
export function useWidgetData(widgetId: string) {
  return useSharedDataStore((state) => state.widgets.get(widgetId));
}

// React Hook으로 전역 데이터 구독
export function useGlobalData<T = any>(key: string): T | undefined {
  return useSharedDataStore((state) => state.globalData.get(key));
}

// React Hook으로 여러 위젯 데이터 구독
export function useMultipleWidgetData(widgetIds: string[]) {
  return useSharedDataStore((state) => {
    return widgetIds.map(id => state.widgets.get(id));
  });
}

// 디버그용 훅
export function useSharedDataDebug() {
  const widgets = useSharedDataStore((state) => state.widgets);
  const subscriptions = useSharedDataStore((state) => state.subscriptions);
  const globalData = useSharedDataStore((state) => state.globalData);
  
  return {
    widgetCount: widgets.size,
    subscriptionCount: subscriptions.size,
    globalDataCount: globalData.size,
    widgets: Array.from(widgets.entries()),
    subscriptions: Array.from(subscriptions.entries()).map(([key, value]) => ({
      widget: key,
      subscribedTo: Array.from(value)
    })),
    globalData: Array.from(globalData.entries())
  };
}

export default sharedDataStore;