/**
 * WidgetEventBus - 위젯 간 이벤트 기반 통신 시스템
 * 
 * 이벤트 발행/구독 패턴을 통해 위젯 간 느슨한 결합 상태에서
 * 데이터와 상태를 공유할 수 있게 해줍니다.
 */

export type WidgetEventHandler<T = any> = (data: T) => void;

export interface WidgetEvent<T = any> {
  type: string;
  source: string;
  target?: string;
  data: T;
  timestamp: number;
}

export interface EventSubscription {
  unsubscribe: () => void;
}

class WidgetEventBus {
  private subscribers: Map<string, Set<WidgetEventHandler>> = new Map();
  private eventHistory: WidgetEvent[] = [];
  private maxHistorySize = 100;
  
  /**
   * 이벤트를 발행합니다
   */
  emit<T = any>(event: Omit<WidgetEvent<T>, 'timestamp'>): void {
    const fullEvent: WidgetEvent<T> = {
      ...event,
      timestamp: Date.now()
    };
    
    // 이벤트 히스토리 저장
    this.addToHistory(fullEvent);
    
    // 타겟이 지정된 경우
    if (fullEvent.target) {
      const targetKey = this.createTargetKey(fullEvent.type, fullEvent.target);
      this.notifySubscribers(targetKey, fullEvent);
    }
    
    // 모든 구독자에게 알림
    this.notifySubscribers(fullEvent.type, fullEvent);
  }
  
  /**
   * 이벤트를 구독합니다
   */
  subscribe<T = any>(
    eventType: string, 
    handler: WidgetEventHandler<T>,
    options?: { target?: string }
  ): EventSubscription {
    const key = options?.target 
      ? this.createTargetKey(eventType, options.target)
      : eventType;
      
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(handler);
    
    return {
      unsubscribe: () => this.unsubscribe(eventType, handler, options)
    };
  }
  
  /**
   * 이벤트 구독을 해제합니다
   */
  unsubscribe<T = any>(
    eventType: string, 
    handler: WidgetEventHandler<T>,
    options?: { target?: string }
  ): void {
    const key = options?.target 
      ? this.createTargetKey(eventType, options.target)
      : eventType;
      
    const handlers = this.subscribers.get(key);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(key);
      }
    }
  }
  
  /**
   * 특정 이벤트 타입의 모든 구독을 해제합니다
   */
  unsubscribeAll(eventType?: string): void {
    if (eventType) {
      // 특정 이벤트 타입과 관련된 모든 키 제거
      const keysToDelete = Array.from(this.subscribers.keys())
        .filter(key => key === eventType || key.startsWith(`${eventType}:`));
      
      keysToDelete.forEach(key => this.subscribers.delete(key));
    } else {
      // 모든 구독 해제
      this.subscribers.clear();
    }
  }
  
  /**
   * 이벤트 히스토리를 반환합니다
   */
  getHistory(filter?: { 
    type?: string; 
    source?: string; 
    target?: string;
    limit?: number;
  }): WidgetEvent[] {
    let history = [...this.eventHistory];
    
    if (filter?.type) {
      history = history.filter(e => e.type === filter.type);
    }
    
    if (filter?.source) {
      history = history.filter(e => e.source === filter.source);
    }
    
    if (filter?.target) {
      history = history.filter(e => e.target === filter.target);
    }
    
    if (filter?.limit) {
      history = history.slice(-filter.limit);
    }
    
    return history;
  }
  
  /**
   * 이벤트 히스토리를 초기화합니다
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
  
  /**
   * 디버그 정보를 반환합니다
   */
  getDebugInfo() {
    return {
      subscriberCount: this.subscribers.size,
      subscribers: Array.from(this.subscribers.entries()).map(([key, handlers]) => ({
        key,
        handlerCount: handlers.size
      })),
      historySize: this.eventHistory.length
    };
  }
  
  private notifySubscribers(key: string, event: WidgetEvent): void {
    const handlers = this.subscribers.get(key);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event.data);
        } catch (error) {
          console.error(`Error in event handler for ${key}:`, error);
        }
      });
    }
  }
  
  private createTargetKey(eventType: string, target: string): string {
    return `${eventType}:${target}`;
  }
  
  private addToHistory(event: WidgetEvent): void {
    this.eventHistory.push(event);
    
    // 히스토리 크기 제한
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}

// 싱글톤 인스턴스
export const widgetEventBus = new WidgetEventBus();

// 일반적인 이벤트 타입 정의
export const WidgetEventTypes = {
  // 데이터 이벤트
  DATA_UPDATE: 'widget:data:update',
  DATA_REQUEST: 'widget:data:request',
  DATA_RESPONSE: 'widget:data:response',
  
  // 상태 이벤트
  STATE_CHANGE: 'widget:state:change',
  VISIBILITY_CHANGE: 'widget:visibility:change',
  
  // 레이아웃 이벤트
  LAYOUT_CHANGE: 'widget:layout:change',
  RESIZE: 'widget:resize',
  REORDER: 'widget:reorder',
  
  // 사용자 인터랙션
  USER_ACTION: 'widget:user:action',
  FOCUS: 'widget:focus',
  BLUR: 'widget:blur',
  
  // 시스템 이벤트
  READY: 'widget:ready',
  ERROR: 'widget:error',
  DESTROY: 'widget:destroy',
  
  // 통신 이벤트
  MESSAGE: 'widget:message',
  BROADCAST: 'widget:broadcast',
  REQUEST: 'widget:request',
  RESPONSE: 'widget:response'
} as const;

export type WidgetEventType = typeof WidgetEventTypes[keyof typeof WidgetEventTypes];

// 타입 안전한 이벤트 페이로드 정의
export interface WidgetEventPayloads {
  [WidgetEventTypes.DATA_UPDATE]: {
    widgetId: string;
    data: any;
    changes?: string[];
  };
  [WidgetEventTypes.DATA_REQUEST]: {
    widgetId: string;
    requestId: string;
    query?: any;
  };
  [WidgetEventTypes.DATA_RESPONSE]: {
    widgetId: string;
    requestId: string;
    data: any;
    error?: any;
  };
  [WidgetEventTypes.STATE_CHANGE]: {
    widgetId: string;
    oldState: any;
    newState: any;
  };
  [WidgetEventTypes.VISIBILITY_CHANGE]: {
    widgetId: string;
    visible: boolean;
  };
  [WidgetEventTypes.LAYOUT_CHANGE]: {
    widgetId: string;
    layout: any;
  };
  [WidgetEventTypes.RESIZE]: {
    widgetId: string;
    oldSize: { width: number; height: number };
    newSize: { width: number; height: number };
  };
  [WidgetEventTypes.USER_ACTION]: {
    widgetId: string;
    action: string;
    payload?: any;
  };
  [WidgetEventTypes.ERROR]: {
    widgetId: string;
    error: Error;
    context?: any;
  };
  [WidgetEventTypes.MESSAGE]: {
    from: string;
    to: string;
    message: any;
  };
}

// 타입 안전한 이벤트 발행 헬퍼
export function emitWidgetEvent<K extends keyof WidgetEventPayloads>(
  type: K,
  source: string,
  data: WidgetEventPayloads[K],
  target?: string
): void {
  widgetEventBus.emit({
    type,
    source,
    target,
    data
  });
}

// 타입 안전한 이벤트 구독 헬퍼
export function subscribeToWidgetEvent<K extends keyof WidgetEventPayloads>(
  type: K,
  handler: (data: WidgetEventPayloads[K]) => void,
  options?: { target?: string }
): EventSubscription {
  return widgetEventBus.subscribe(type, handler, options);
}

export default widgetEventBus;