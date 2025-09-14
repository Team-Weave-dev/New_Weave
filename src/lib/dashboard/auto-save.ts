/**
 * Auto-save functionality for Dashboard Widget System
 * Manages automatic saving of dashboard state changes with debouncing
 */

import { layoutService } from './layout-service';
// WidgetPosition과 WidgetConfig 타입 정의
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  title?: string;
  [key: string]: any;
}

type SaveCallback = () => void;
type ErrorCallback = (error: Error) => void;

interface AutoSaveOptions {
  debounceMs?: number;
  maxRetries?: number;
  onSaveStart?: SaveCallback;
  onSaveSuccess?: SaveCallback;
  onSaveError?: ErrorCallback;
}

interface PendingChange {
  type: 'widget-position' | 'widget-config' | 'widget-delete' | 'layout-update';
  data: any;
  timestamp: number;
}

class AutoSaveManager {
  private static instance: AutoSaveManager;
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingChanges: Map<string, PendingChange> = new Map();
  private isSaving = false;
  private isEnabled = true;
  private options: Required<AutoSaveOptions>;
  private retryCount = 0;
  private saveIndicatorCallback?: (saving: boolean) => void;

  private constructor() {
    this.options = {
      debounceMs: 2000, // 2초 디바운스
      maxRetries: 3,
      onSaveStart: () => {},
      onSaveSuccess: () => {},
      onSaveError: () => {}
    };
  }

  static getInstance(): AutoSaveManager {
    if (!AutoSaveManager.instance) {
      AutoSaveManager.instance = new AutoSaveManager();
    }
    return AutoSaveManager.instance;
  }

  /**
   * 자동 저장 설정 초기화
   */
  initialize(options: AutoSaveOptions = {}): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    // 사용자 설정에서 자동 저장 활성화 여부 확인
    this.checkAutoSaveEnabled();
  }

  /**
   * 사용자 설정에서 자동 저장 활성화 여부 확인
   */
  private async checkAutoSaveEnabled(): Promise<void> {
    try {
      const settings = await layoutService.getUserSettings();
      this.isEnabled = settings.auto_save_enabled;
    } catch (error) {
      console.error('Failed to check auto-save settings:', error);
      this.isEnabled = true; // 기본값은 활성화
    }
  }

  /**
   * 자동 저장 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.pendingChanges.clear();
    }
  }

  /**
   * 저장 상태 표시기 콜백 설정
   */
  setSaveIndicatorCallback(callback: (saving: boolean) => void): void {
    this.saveIndicatorCallback = callback;
  }

  /**
   * 위젯 위치 변경 큐에 추가
   */
  queueWidgetPositionChange(widgetId: string, position: WidgetPosition): void {
    if (!this.isEnabled) return;

    this.pendingChanges.set(`widget-pos-${widgetId}`, {
      type: 'widget-position',
      data: { widgetId, position },
      timestamp: Date.now()
    });

    this.scheduleSave();
  }

  /**
   * 여러 위젯 위치 변경 큐에 추가
   */
  queueMultipleWidgetPositions(updates: Array<{ id: string; position: WidgetPosition }>): void {
    if (!this.isEnabled) return;

    updates.forEach(update => {
      this.pendingChanges.set(`widget-pos-${update.id}`, {
        type: 'widget-position',
        data: { widgetId: update.id, position: update.position },
        timestamp: Date.now()
      });
    });

    this.scheduleSave();
  }

  /**
   * 위젯 설정 변경 큐에 추가
   */
  queueWidgetConfigChange(widgetId: string, config: WidgetConfig): void {
    if (!this.isEnabled) return;

    this.pendingChanges.set(`widget-config-${widgetId}`, {
      type: 'widget-config',
      data: { widgetId, config },
      timestamp: Date.now()
    });

    this.scheduleSave();
  }

  /**
   * 위젯 삭제 큐에 추가
   */
  queueWidgetDelete(widgetId: string): void {
    if (!this.isEnabled) return;

    // 이 위젯에 대한 다른 변경사항 제거
    this.pendingChanges.delete(`widget-pos-${widgetId}`);
    this.pendingChanges.delete(`widget-config-${widgetId}`);

    this.pendingChanges.set(`widget-delete-${widgetId}`, {
      type: 'widget-delete',
      data: { widgetId },
      timestamp: Date.now()
    });

    this.scheduleSave();
  }

  /**
   * 레이아웃 업데이트 큐에 추가
   */
  queueLayoutUpdate(layoutId: string, updates: any): void {
    if (!this.isEnabled) return;

    this.pendingChanges.set(`layout-${layoutId}`, {
      type: 'layout-update',
      data: { layoutId, updates },
      timestamp: Date.now()
    });

    this.scheduleSave();
  }

  /**
   * 저장 스케줄링 (디바운스)
   */
  private scheduleSave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.executeSave();
    }, this.options.debounceMs);
  }

  /**
   * 즉시 저장 실행
   */
  async saveNow(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    await this.executeSave();
  }

  /**
   * 실제 저장 실행
   */
  private async executeSave(): Promise<void> {
    if (this.isSaving || this.pendingChanges.size === 0) {
      return;
    }

    this.isSaving = true;
    this.options.onSaveStart();
    
    if (this.saveIndicatorCallback) {
      this.saveIndicatorCallback(true);
    }

    try {
      // 변경사항을 타입별로 그룹화
      const positionUpdates: Array<{ id: string; position: WidgetPosition }> = [];
      const configUpdates: Array<{ id: string; config: WidgetConfig }> = [];
      const deletions: string[] = [];
      const layoutUpdates: Map<string, any> = new Map();

      this.pendingChanges.forEach((change, key) => {
        switch (change.type) {
          case 'widget-position':
            positionUpdates.push({
              id: change.data.widgetId,
              position: change.data.position
            });
            break;
          case 'widget-config':
            configUpdates.push({
              id: change.data.widgetId,
              config: change.data.config
            });
            break;
          case 'widget-delete':
            deletions.push(change.data.widgetId);
            break;
          case 'layout-update':
            layoutUpdates.set(change.data.layoutId, change.data.updates);
            break;
        }
      });

      // 배치 업데이트 실행
      const promises: Promise<any>[] = [];

      // 위치 업데이트 (배치)
      if (positionUpdates.length > 0) {
        promises.push(layoutService.updateWidgets(positionUpdates));
      }

      // 설정 업데이트 (개별)
      configUpdates.forEach(update => {
        promises.push(
          layoutService.updateWidget(update.id, { config: update.config })
        );
      });

      // 삭제 (개별)
      deletions.forEach(widgetId => {
        promises.push(layoutService.deleteWidget(widgetId));
      });

      // 레이아웃 업데이트 (개별)
      layoutUpdates.forEach((updates, layoutId) => {
        promises.push(layoutService.updateLayout(layoutId, updates));
      });

      // 모든 변경사항 저장
      await Promise.all(promises);

      // 성공 시 큐 클리어
      this.pendingChanges.clear();
      this.retryCount = 0;
      this.options.onSaveSuccess();

      console.log(`Auto-save completed: ${promises.length} operations`);

    } catch (error) {
      console.error('Auto-save failed:', error);
      
      // 재시도 로직
      if (this.retryCount < this.options.maxRetries) {
        this.retryCount++;
        console.log(`Retrying auto-save (${this.retryCount}/${this.options.maxRetries})...`);
        setTimeout(() => this.executeSave(), 1000 * this.retryCount); // 점진적 백오프
      } else {
        this.options.onSaveError(error as Error);
        this.retryCount = 0;
        // 실패한 변경사항은 유지 (다음 시도를 위해)
      }
    } finally {
      this.isSaving = false;
      
      if (this.saveIndicatorCallback) {
        this.saveIndicatorCallback(false);
      }
    }
  }

  /**
   * 대기 중인 변경사항이 있는지 확인
   */
  hasPendingChanges(): boolean {
    return this.pendingChanges.size > 0;
  }

  /**
   * 대기 중인 변경사항 개수
   */
  getPendingChangesCount(): number {
    return this.pendingChanges.size;
  }

  /**
   * 자동 저장 상태 정보
   */
  getStatus(): {
    enabled: boolean;
    saving: boolean;
    pendingChanges: number;
    retryCount: number;
  } {
    return {
      enabled: this.isEnabled,
      saving: this.isSaving,
      pendingChanges: this.pendingChanges.size,
      retryCount: this.retryCount
    };
  }

  /**
   * 정리 (컴포넌트 언마운트 시)
   */
  cleanup(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // 대기 중인 변경사항이 있으면 즉시 저장 시도
    if (this.pendingChanges.size > 0 && this.isEnabled) {
      this.saveNow().catch(console.error);
    }
  }
}

export const autoSaveManager = AutoSaveManager.getInstance();