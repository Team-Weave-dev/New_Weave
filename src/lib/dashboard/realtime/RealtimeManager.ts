/**
 * RealtimeManager - 실시간 업데이트 관리 시스템
 * 
 * Mock 모드와 Supabase 모드를 지원하는 실시간 업데이트 관리자
 * 현재는 Mock 모드로 동작하며, 향후 Supabase Realtime으로 전환 가능
 */

import { EventEmitter } from 'events';

// 채널 타입 정의
export type ChannelType = 
  | 'widget:updates'
  | 'calendar:events'
  | 'notifications'
  | 'projects'
  | 'tasks'
  | 'analytics';

// 실시간 이벤트 페이로드 타입
export interface RealtimeEvent<T = any> {
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'BROADCAST';
  table?: string;
  schema?: string;
  payload: T;
  timestamp: number;
}

// 채널 구독 옵션
export interface SubscribeOptions {
  table?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

// 연결 상태
export enum ConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

// 채널 클래스
class RealtimeChannel {
  private emitter = new EventEmitter();
  private subscriptions = new Map<string, Function>();
  
  constructor(
    public name: string,
    private manager: RealtimeManager
  ) {}

  // 이벤트 구독
  on(event: string, callback: Function): this {
    this.subscriptions.set(event, callback);
    this.emitter.on(event, callback as any);
    return this;
  }

  // 구독 해제
  off(event: string): this {
    const callback = this.subscriptions.get(event);
    if (callback) {
      this.emitter.off(event, callback as any);
      this.subscriptions.delete(event);
    }
    return this;
  }

  // 이벤트 발행 (내부용)
  emit(event: string, data: any): void {
    this.emitter.emit(event, data);
  }

  // 채널 구독 시작
  subscribe(callback?: (status: string) => void): this {
    // Mock 모드: 즉시 성공 콜백 호출
    setTimeout(() => {
      callback?.('SUBSCRIBED');
      this.manager.onChannelSubscribed(this.name);
    }, 100);
    return this;
  }

  // 채널 구독 해제
  unsubscribe(): this {
    this.subscriptions.clear();
    this.emitter.removeAllListeners();
    this.manager.onChannelUnsubscribed(this.name);
    return this;
  }
}

// RealtimeManager 클래스
export class RealtimeManager {
  private static instance: RealtimeManager | null = null;
  private channels = new Map<string, RealtimeChannel>();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private emitter = new EventEmitter();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private mockDataInterval: NodeJS.Timeout | null = null;
  private isMockMode = true; // 현재 Mock 모드로 동작

  // 싱글톤 인스턴스 가져오기
  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  private constructor() {
    // Mock 모드에서는 자동으로 연결 시작
    if (this.isMockMode) {
      this.connect();
    }
  }

  // 연결 시작
  public connect(): void {
    if (this.connectionState === ConnectionState.CONNECTED) {
      return;
    }

    this.setConnectionState(ConnectionState.CONNECTING);

    if (this.isMockMode) {
      // Mock 모드: 연결 시뮬레이션
      setTimeout(() => {
        this.setConnectionState(ConnectionState.CONNECTED);
        this.startMockDataGeneration();
      }, 500);
    } else {
      // TODO: Supabase Realtime 연결
      // const supabase = createClient(...)
      // supabase.realtime.connect()
    }
  }

  // 연결 종료
  public disconnect(): void {
    if (this.mockDataInterval) {
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
    
    this.setConnectionState(ConnectionState.DISCONNECTED);
  }

  // 자동 재연결
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setConnectionState(ConnectionState.ERROR);
      console.error('Max reconnection attempts reached');
      return;
    }

    this.setConnectionState(ConnectionState.RECONNECTING);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // 채널 가져오기 또는 생성
  public channel(name: ChannelType): RealtimeChannel {
    if (!this.channels.has(name)) {
      const channel = new RealtimeChannel(name, this);
      this.channels.set(name, channel);
    }
    return this.channels.get(name)!;
  }

  // 특정 위젯의 업데이트 구독
  public subscribeToWidget(
    widgetId: string, 
    callback: (data: RealtimeEvent) => void
  ): () => void {
    const channelName = `widget:${widgetId}` as ChannelType;
    const channel = this.channel('widget:updates');
    
    const handler = (event: RealtimeEvent) => {
      if (event.payload.widgetId === widgetId) {
        callback(event);
      }
    };

    channel.on('update', handler);
    channel.subscribe();

    // 구독 해제 함수 반환
    return () => {
      channel.off('update');
    };
  }

  // 위젯 업데이트 브로드캐스트 (Mock 모드용)
  public broadcastWidgetUpdate(widgetId: string, data: any): void {
    const event: RealtimeEvent = {
      type: 'UPDATE',
      payload: { widgetId, data },
      timestamp: Date.now()
    };

    const channel = this.channels.get('widget:updates');
    channel?.emit('update', event);
  }

  // 연결 상태 변경
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.emitter.emit('connectionStateChange', state);

    if (state === ConnectionState.CONNECTED) {
      this.reconnectAttempts = 0;
    }
  }

  // 연결 상태 구독
  public onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    this.emitter.on('connectionStateChange', callback);
    return () => {
      this.emitter.off('connectionStateChange', callback);
    };
  }

  // 현재 연결 상태 가져오기
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // 채널 구독됨 이벤트
  public onChannelSubscribed(channelName: string): void {
    console.log(`Channel subscribed: ${channelName}`);
  }

  // 채널 구독 해제됨 이벤트
  public onChannelUnsubscribed(channelName: string): void {
    console.log(`Channel unsubscribed: ${channelName}`);
  }

  // Mock 데이터 생성 (개발용)
  private startMockDataGeneration(): void {
    if (!this.isMockMode) return;

    // 5초마다 랜덤 업데이트 생성
    this.mockDataInterval = setInterval(() => {
      this.generateMockUpdate();
    }, 5000);
  }

  // Mock 업데이트 생성
  private generateMockUpdate(): void {
    const mockUpdates = [
      {
        channel: 'widget:updates',
        event: {
          type: 'UPDATE' as const,
          payload: {
            widgetId: `widget-${Math.floor(Math.random() * 10)}`,
            data: {
              value: Math.floor(Math.random() * 100),
              timestamp: Date.now()
            }
          },
          timestamp: Date.now()
        }
      },
      {
        channel: 'calendar:events',
        event: {
          type: 'INSERT' as const,
          payload: {
            id: `event-${Date.now()}`,
            title: `Mock Event ${Math.floor(Math.random() * 100)}`,
            date: new Date().toISOString()
          },
          timestamp: Date.now()
        }
      },
      {
        channel: 'notifications',
        event: {
          type: 'BROADCAST' as const,
          payload: {
            message: `System update at ${new Date().toLocaleTimeString()}`,
            priority: Math.random() > 0.5 ? 'high' : 'normal'
          },
          timestamp: Date.now()
        }
      }
    ];

    // 랜덤하게 하나의 업데이트 선택
    const update = mockUpdates[Math.floor(Math.random() * mockUpdates.length)];
    const channel = this.channels.get(update.channel as ChannelType);
    
    if (channel) {
      channel.emit('update', update.event);
    }
  }

  // Supabase 모드로 전환 (향후 구현용)
  public enableSupabaseMode(supabaseUrl?: string, supabaseKey?: string): void {
    this.isMockMode = false;
    this.disconnect();
    
    // TODO: Supabase 클라이언트 초기화
    // this.supabaseClient = createClient(supabaseUrl, supabaseKey);
    
    console.log('Supabase mode enabled (not implemented yet)');
  }

  // Mock 모드로 전환
  public enableMockMode(): void {
    this.isMockMode = true;
    this.disconnect();
    this.connect();
  }

  // 모든 활성 채널 가져오기
  public getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  // 통계 정보 가져오기
  public getStats(): {
    connectionState: ConnectionState;
    activeChannels: number;
    reconnectAttempts: number;
    mode: 'mock' | 'supabase';
  } {
    return {
      connectionState: this.connectionState,
      activeChannels: this.channels.size,
      reconnectAttempts: this.reconnectAttempts,
      mode: this.isMockMode ? 'mock' : 'supabase'
    };
  }
}

// 기본 내보내기
export default RealtimeManager.getInstance();