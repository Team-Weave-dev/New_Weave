/**
 * Store Bridge
 * 
 * 레거시 대시보드 Store와 iOS 대시보드 Store 간의 동기화를 담당
 * - 무한 루프 방지 메커니즘
 * - 단방향/양방향 동기화 옵션
 * - 데이터 일관성 보장
 */

import { useIOSDashboardStore } from './useIOSDashboardStore';
import { useDashboardStore } from './useDashboardStore';
import { IOSStyleWidget } from '@/types/ios-dashboard';
import { Widget, DashboardLayout } from '@/types/dashboard';
import { iosWidgetRegistry } from '@/lib/dashboard/ios-widget-registry';

export type SyncDirection = 'toIOS' | 'toLegacy' | 'bidirectional';

interface SyncOptions {
  direction: SyncDirection;
  preserveExisting?: boolean;
  debounceMs?: number;
}

export class StoreBridge {
  private static instance: StoreBridge;
  
  private isSyncing = false;
  private syncDirection: SyncDirection = 'bidirectional';
  private lastSyncTimestamp: number = 0;
  private syncDebounceMs: number = 100;
  private syncQueue: Array<() => void> = [];
  private unsubscribers: Array<() => void> = [];
  
  private constructor() {
    // 초기화 시 동기화 설정
    this.setupSyncListeners();
  }
  
  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): StoreBridge {
    if (!StoreBridge.instance) {
      StoreBridge.instance = new StoreBridge();
    }
    return StoreBridge.instance;
  }
  
  /**
   * 동기화 리스너 설정
   */
  private setupSyncListeners(): void {
    console.log('[StoreBridge] Setting up sync listeners...');
    
    // 레거시 → iOS 동기화
    const legacyUnsubscriber = useDashboardStore.subscribe(
      (state) => state,
      (state) => {
        if (this.shouldSync('toIOS')) {
          this.queueSync(() => this.syncToIOS(state));
        }
      }
    );
    
    // iOS → 레거시 동기화
    const iosUnsubscriber = useIOSDashboardStore.subscribe(
      (state) => state,
      (state) => {
        if (this.shouldSync('toLegacy')) {
          this.queueSync(() => this.syncToLegacy(state));
        }
      }
    );
    
    this.unsubscribers.push(legacyUnsubscriber, iosUnsubscriber);
  }
  
  /**
   * 동기화 필요 여부 확인
   */
  private shouldSync(direction: 'toIOS' | 'toLegacy'): boolean {
    // 이미 동기화 중이면 스킵 (무한 루프 방지)
    if (this.isSyncing) {
      return false;
    }
    
    // 동기화 방향 확인
    if (this.syncDirection === 'bidirectional') {
      return true;
    }
    
    return this.syncDirection === direction;
  }
  
  /**
   * 동기화 작업 큐에 추가 (디바운싱)
   */
  private queueSync(syncFn: () => void): void {
    this.syncQueue.push(syncFn);
    
    // 디바운싱 처리
    const now = Date.now();
    if (now - this.lastSyncTimestamp > this.syncDebounceMs) {
      this.processSyncQueue();
      this.lastSyncTimestamp = now;
    } else {
      setTimeout(() => this.processSyncQueue(), this.syncDebounceMs);
    }
  }
  
  /**
   * 동기화 큐 처리
   */
  private processSyncQueue(): void {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }
    
    this.isSyncing = true;
    
    try {
      // 큐의 모든 동기화 작업 실행
      while (this.syncQueue.length > 0) {
        const syncFn = this.syncQueue.shift();
        if (syncFn) {
          syncFn();
        }
      }
    } catch (error) {
      console.error('[StoreBridge] Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * 레거시 → iOS 동기화
   */
  private syncToIOS(legacyState: any): void {
    console.log('[StoreBridge] Syncing to iOS...');
    
    const iosStore = useIOSDashboardStore.getState();
    
    try {
      // 레이아웃 변환 및 동기화
      if (legacyState.layouts && Array.isArray(legacyState.layouts)) {
        const iosLayouts = this.convertLayoutsToIOS(legacyState.layouts);
        iosStore.setLayouts(iosLayouts);
      }
      
      // 위젯 변환 및 동기화
      if (legacyState.widgets && Array.isArray(legacyState.widgets)) {
        const iosWidgets = legacyState.widgets.map((widget: WidgetDefinition) =>
          iosWidgetRegistry.convertLegacyToIOS(widget)
        );
        iosStore.setWidgets(iosWidgets);
      }
      
      // 활성 레이아웃 동기화
      if (legacyState.activeLayoutId) {
        const activeLayout = iosStore.layouts.find(
          (layout: IOSDashboardLayout) => layout.id === legacyState.activeLayoutId
        );
        if (activeLayout) {
          iosStore.setActiveLayout(activeLayout);
        }
      }
    } catch (error) {
      console.error('[StoreBridge] Error syncing to iOS:', error);
    }
  }
  
  /**
   * iOS → 레거시 동기화
   */
  private syncToLegacy(iosState: any): void {
    console.log('[StoreBridge] Syncing to Legacy...');
    
    const legacyStore = useDashboardStore.getState();
    
    try {
      // 레이아웃 변환 및 동기화
      if (iosState.layouts && Array.isArray(iosState.layouts)) {
        const legacyLayouts = this.convertLayoutsToLegacy(iosState.layouts);
        
        // 기존 레이아웃 클리어 후 추가
        legacyStore.clearLayouts();
        legacyLayouts.forEach((layout: Layout) => {
          legacyStore.addLayout(layout);
        });
      }
      
      // 활성 레이아웃 동기화
      if (iosState.activeLayout) {
        legacyStore.setActiveLayout(iosState.activeLayout.id);
      }
    } catch (error) {
      console.error('[StoreBridge] Error syncing to Legacy:', error);
    }
  }
  
  /**
   * 레거시 레이아웃을 iOS 레이아웃으로 변환
   */
  private convertLayoutsToIOS(layouts: Layout[]): IOSDashboardLayout[] {
    return layouts.map(layout => ({
      id: layout.id,
      name: layout.name,
      widgets: layout.widgets?.map((widget: WidgetDefinition) =>
        iosWidgetRegistry.convertLegacyToIOS(widget)
      ) || [],
      isLocked: false,
      createdAt: layout.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }
  
  /**
   * iOS 레이아웃을 레거시 레이아웃으로 변환
   */
  private convertLayoutsToLegacy(layouts: IOSDashboardLayout[]): Layout[] {
    return layouts.map(layout => ({
      id: layout.id,
      name: layout.name,
      gridSize: '3x3', // 기본값
      widgets: layout.widgets.map((widget: IOSStyleWidget) =>
        iosWidgetRegistry.convertIOSToLegacy(widget)
      ),
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
    }));
  }
  
  /**
   * 동기화 방향 설정
   */
  public setSyncDirection(direction: SyncDirection): void {
    this.syncDirection = direction;
    console.log(`[StoreBridge] Sync direction set to: ${direction}`);
  }
  
  /**
   * 단방향 동기화 활성화 (마이그레이션 중)
   */
  public enableOneWaySync(direction: 'toIOS' | 'toLegacy'): void {
    this.syncDirection = direction;
    console.log(`[StoreBridge] One-way sync enabled: ${direction}`);
  }
  
  /**
   * 양방향 동기화 활성화
   */
  public enableBidirectionalSync(): void {
    this.syncDirection = 'bidirectional';
    console.log('[StoreBridge] Bidirectional sync enabled');
  }
  
  /**
   * 동기화 비활성화
   */
  public disableSync(): void {
    this.syncDirection = 'bidirectional'; // 리셋을 위해
    this.isSyncing = true; // 동기화 차단
    console.log('[StoreBridge] Sync disabled');
  }
  
  /**
   * 동기화 재활성화
   */
  public enableSync(): void {
    this.isSyncing = false;
    console.log('[StoreBridge] Sync re-enabled');
  }
  
  /**
   * 강제 동기화 실행
   */
  public forceSync(direction: 'toIOS' | 'toLegacy'): void {
    const wassyncing = this.isSyncing;
    this.isSyncing = false; // 일시적으로 동기화 허용
    
    try {
      if (direction === 'toIOS') {
        const legacyState = useDashboardStore.getState();
        this.syncToIOS(legacyState);
      } else {
        const iosState = useIOSDashboardStore.getState();
        this.syncToLegacy(iosState);
      }
    } finally {
      this.isSyncing = wassyncing;
    }
  }
  
  /**
   * 초기 데이터 마이그레이션
   */
  public async migrateData(direction: 'toIOS' | 'toLegacy'): Promise<void> {
    console.log(`[StoreBridge] Starting migration: ${direction}`);
    
    // 동기화 일시 중지
    this.disableSync();
    
    try {
      if (direction === 'toIOS') {
        // 레거시 → iOS 마이그레이션
        const legacyState = useDashboardStore.getState();
        const iosStore = useIOSDashboardStore.getState();
        
        // 레이아웃 마이그레이션
        const iosLayouts = this.convertLayoutsToIOS(legacyState.layouts);
        iosStore.setLayouts(iosLayouts);
        
        // 위젯 마이그레이션
        const allWidgets: IOSStyleWidget[] = [];
        iosLayouts.forEach(layout => {
          allWidgets.push(...layout.widgets);
        });
        iosStore.setWidgets(allWidgets);
        
        // 활성 레이아웃 설정
        if (legacyState.activeLayoutId && iosLayouts.length > 0) {
          const activeLayout = iosLayouts.find(
            layout => layout.id === legacyState.activeLayoutId
          );
          if (activeLayout) {
            iosStore.setActiveLayout(activeLayout);
          }
        }
      } else {
        // iOS → 레거시 마이그레이션
        const iosState = useIOSDashboardStore.getState();
        const legacyStore = useDashboardStore.getState();
        
        // 레이아웃 마이그레이션
        const legacyLayouts = this.convertLayoutsToLegacy(iosState.layouts);
        legacyStore.clearLayouts();
        legacyLayouts.forEach(layout => {
          legacyStore.addLayout(layout);
        });
        
        // 활성 레이아웃 설정
        if (iosState.activeLayout) {
          legacyStore.setActiveLayout(iosState.activeLayout.id);
        }
      }
      
      console.log(`[StoreBridge] Migration completed: ${direction}`);
    } catch (error) {
      console.error('[StoreBridge] Migration error:', error);
      throw error;
    } finally {
      // 동기화 재활성화
      this.enableSync();
    }
  }
  
  /**
   * 디바운스 시간 설정
   */
  public setDebounceMs(ms: number): void {
    this.syncDebounceMs = ms;
  }
  
  /**
   * 정리
   */
  public destroy(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
    this.syncQueue = [];
    this.isSyncing = false;
  }
}

// 싱글톤 인스턴스 export
export const storeBridge = StoreBridge.getInstance();

// 헬퍼 함수들
export const migrateToIOS = async () => {
  return storeBridge.migrateData('toIOS');
};

export const migrateToLegacy = async () => {
  return storeBridge.migrateData('toLegacy');
};

export const enableIOSSync = () => {
  storeBridge.enableOneWaySync('toIOS');
};

export const enableLegacySync = () => {
  storeBridge.enableOneWaySync('toLegacy');
};

export const enableBidirectionalSync = () => {
  storeBridge.enableBidirectionalSync();
};