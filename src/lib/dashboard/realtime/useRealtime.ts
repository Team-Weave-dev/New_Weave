/**
 * useRealtime Hook - 위젯에서 실시간 업데이트를 쉽게 사용할 수 있는 React Hook
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import RealtimeManager, { 
  RealtimeEvent, 
  ConnectionState,
  ChannelType 
} from './RealtimeManager';

// Hook 옵션
export interface UseRealtimeOptions {
  channel?: ChannelType;
  widgetId?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

// Hook 반환 타입
export interface UseRealtimeReturn<T = any> {
  isConnected: boolean;
  connectionState: ConnectionState;
  lastUpdate: T | null;
  subscribe: (eventType: string, callback: (data: RealtimeEvent<T>) => void) => () => void;
  broadcast: (data: T) => void;
  connect: () => void;
  disconnect: () => void;
}

/**
 * 실시간 업데이트를 위한 React Hook
 */
export function useRealtime<T = any>(
  options: UseRealtimeOptions = {}
): UseRealtimeReturn<T> {
  const {
    channel = 'widget:updates',
    widgetId,
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [lastUpdate, setLastUpdate] = useState<T | null>(null);
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());
  const managerRef = useRef(RealtimeManager);

  // 연결 상태 변경 처리
  useEffect(() => {
    const unsubscribe = managerRef.current.onConnectionStateChange((state) => {
      setConnectionState(state);
      setIsConnected(state === ConnectionState.CONNECTED);

      if (state === ConnectionState.CONNECTED) {
        onConnect?.();
      } else if (state === ConnectionState.DISCONNECTED) {
        onDisconnect?.();
      } else if (state === ConnectionState.ERROR) {
        onError?.(new Error('Realtime connection error'));
      }
    });

    return unsubscribe;
  }, [onConnect, onDisconnect, onError]);

  // 자동 연결
  useEffect(() => {
    if (autoConnect) {
      managerRef.current.connect();
    }

    return () => {
      // 컴포넌트 언마운트 시 구독 정리
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current.clear();
    };
  }, [autoConnect]);

  // 이벤트 구독
  const subscribe = useCallback(
    (eventType: string, callback: (data: RealtimeEvent<T>) => void) => {
      const realtimeChannel = managerRef.current.channel(channel);
      
      const handler = (event: RealtimeEvent<T>) => {
        // widgetId가 지정된 경우 필터링
        if (widgetId && event.payload) {
          const payload = event.payload as any;
          if (payload.widgetId && payload.widgetId !== widgetId) {
            return;
          }
        }
        
        setLastUpdate(event.payload);
        callback(event);
      };

      realtimeChannel.on(eventType, handler);
      realtimeChannel.subscribe();

      const unsubscribe = () => {
        realtimeChannel.off(eventType);
      };

      // 구독 추적
      const subscriptionKey = `${channel}-${eventType}`;
      subscriptionsRef.current.set(subscriptionKey, unsubscribe);

      return unsubscribe;
    },
    [channel, widgetId]
  );

  // 데이터 브로드캐스트
  const broadcast = useCallback(
    (data: T) => {
      if (widgetId) {
        managerRef.current.broadcastWidgetUpdate(widgetId, data);
      } else {
        const event: RealtimeEvent<T> = {
          type: 'BROADCAST',
          payload: data,
          timestamp: Date.now()
        };
        
        const realtimeChannel = managerRef.current.channel(channel);
        realtimeChannel.emit('broadcast', event);
      }
    },
    [channel, widgetId]
  );

  // 수동 연결
  const connect = useCallback(() => {
    managerRef.current.connect();
  }, []);

  // 수동 연결 해제
  const disconnect = useCallback(() => {
    managerRef.current.disconnect();
  }, []);

  return {
    isConnected,
    connectionState,
    lastUpdate,
    subscribe,
    broadcast,
    connect,
    disconnect
  };
}

/**
 * 위젯 전용 실시간 Hook
 */
export function useWidgetRealtime<T = any>(widgetId: string) {
  return useRealtime<T>({
    channel: 'widget:updates',
    widgetId,
    autoConnect: true
  });
}

/**
 * 캘린더 전용 실시간 Hook
 */
export function useCalendarRealtime() {
  return useRealtime({
    channel: 'calendar:events',
    autoConnect: true
  });
}

/**
 * 알림 전용 실시간 Hook
 */
export function useNotificationRealtime() {
  return useRealtime({
    channel: 'notifications',
    autoConnect: true
  });
}