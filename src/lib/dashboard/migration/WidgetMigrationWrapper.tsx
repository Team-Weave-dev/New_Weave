import React, { Suspense, useEffect, useState } from 'react';
import { WidgetRegistry } from '@/lib/dashboard/WidgetRegistry';
import { IOSWidgetRegistry } from '@/lib/dashboard/ios-widget-registry';
import { WidgetSkeleton } from '@/components/dashboard/WidgetSkeleton';
import type { IOSStyleWidget } from '@/types/ios-dashboard';
import type { WidgetDefinition } from '@/types/dashboard';
import { useFeatureFlag } from '@/lib/features/useFeatureFlag';

interface WidgetMigrationWrapperProps {
  widgetType: string;
  widgetData: WidgetDefinition | IOSStyleWidget;
  isIOS?: boolean;
  forceLegacy?: boolean;
  forceIOS?: boolean;
}

/**
 * 위젯 마이그레이션 래퍼
 * 기존 위젯과 iOS 스타일 위젯 사이를 전환하는 중간 레이어
 */
export const WidgetMigrationWrapper: React.FC<WidgetMigrationWrapperProps> = ({
  widgetType,
  widgetData,
  isIOS: isIOSProp,
  forceLegacy = false,
  forceIOS = false,
}) => {
  const [isReady, setIsReady] = useState(false);
  const isIOSEnabled = useFeatureFlag('ios_style_dashboard');
  
  // 최종 렌더링 모드 결정
  const renderMode = forceLegacy ? 'legacy' : 
                     forceIOS ? 'ios' : 
                     (isIOSProp ?? isIOSEnabled) ? 'ios' : 'legacy';

  useEffect(() => {
    // 마이그레이션 준비 작업
    const prepareWidget = async () => {
      try {
        if (renderMode === 'ios') {
          // iOS 레지스트리 동기화
          const iosRegistry = IOSWidgetRegistry.getInstance();
          await iosRegistry.syncWithLegacyRegistry();
        }
        setIsReady(true);
      } catch (error) {
        console.error('Widget migration preparation failed:', error);
        setIsReady(true); // 실패해도 렌더링은 시도
      }
    };

    prepareWidget();
  }, [renderMode, widgetType]);

  // 위젯 데이터 변환
  const convertWidgetData = (data: any, targetMode: string): any => {
    if (targetMode === 'ios') {
      // Legacy → iOS 변환
      return {
        id: data.id || data.widgetId,
        type: data.type || widgetType,
        title: data.title || data.name || 'Untitled Widget',
        position: {
          x: data.position?.x || 0,
          y: data.position?.y || 0,
        },
        size: {
          width: data.size?.width || data.width || 2,
          height: data.size?.height || data.height || 2,
        },
        config: data.config || {},
        data: data.data || {},
        isEditing: false,
        isFlexible: true,
      };
    } else {
      // iOS → Legacy 변환
      return {
        id: data.id || data.widgetId,
        type: data.type || widgetType,
        title: data.title || 'Untitled Widget',
        position: {
          x: data.position?.x || 0,
          y: data.position?.y || 0,
          width: data.size?.width || 2,
          height: data.size?.height || 2,
        },
        config: data.config || {},
        data: data.data || {},
      };
    }
  };

  // 렌더링
  const renderWidget = () => {
    if (!isReady) {
      return <WidgetSkeleton />;
    }

    try {
      const convertedData = convertWidgetData(widgetData, renderMode);

      if (renderMode === 'ios') {
        // iOS 스타일 렌더링
        const IOSWidget = IOSWidgetRegistry.getInstance().getWidget(widgetType);
        if (IOSWidget) {
          return (
            <Suspense fallback={<WidgetSkeleton />}>
              <IOSWidget {...convertedData} />
            </Suspense>
          );
        }
      }

      // Legacy 스타일 렌더링 (폴백)
      const LegacyWidget = WidgetRegistry.getComponent(widgetType);
      if (LegacyWidget) {
        return (
          <Suspense fallback={<WidgetSkeleton />}>
            <LegacyWidget {...convertedData} />
          </Suspense>
        );
      }

      // 위젯을 찾을 수 없는 경우
      return (
        <div className="widget-error p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Widget not found: {widgetType}
          </p>
        </div>
      );
    } catch (error) {
      console.error('Widget rendering error:', error);
      return (
        <div className="widget-error p-4 text-center">
          <p className="text-sm text-destructive">
            Error rendering widget
          </p>
        </div>
      );
    }
  };

  return (
    <div className="widget-migration-wrapper" data-widget-type={widgetType} data-render-mode={renderMode}>
      {renderWidget()}
    </div>
  );
};

/**
 * 배치 마이그레이션을 위한 유틸리티
 */
export class BatchMigrator {
  private static migrationQueue: string[] = [];
  private static migrationStatus: Map<string, 'pending' | 'migrating' | 'completed' | 'failed'> = new Map();

  static addToQueue(widgetTypes: string[]) {
    widgetTypes.forEach(type => {
      if (!this.migrationQueue.includes(type)) {
        this.migrationQueue.push(type);
        this.migrationStatus.set(type, 'pending');
      }
    });
  }

  static async migrateNext(): Promise<boolean> {
    const nextWidget = this.migrationQueue.find(
      type => this.migrationStatus.get(type) === 'pending'
    );

    if (!nextWidget) {
      return false; // 더 이상 마이그레이션할 위젯이 없음
    }

    try {
      this.migrationStatus.set(nextWidget, 'migrating');
      
      // 위젯 마이그레이션 로직
      const legacyWidget = WidgetRegistry.getComponent(nextWidget);
      if (legacyWidget) {
        await IOSWidgetRegistry.getInstance().registerFromLegacy(nextWidget, legacyWidget);
      }

      this.migrationStatus.set(nextWidget, 'completed');
      console.log(`✅ Widget migrated: ${nextWidget}`);
      return true;
    } catch (error) {
      this.migrationStatus.set(nextWidget, 'failed');
      console.error(`❌ Widget migration failed: ${nextWidget}`, error);
      return false;
    }
  }

  static async migrateAll(): Promise<void> {
    while (await this.migrateNext()) {
      // 각 마이그레이션 사이에 짧은 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  static getStatus() {
    return {
      queue: this.migrationQueue,
      status: Object.fromEntries(this.migrationStatus),
      progress: {
        total: this.migrationQueue.length,
        completed: Array.from(this.migrationStatus.values()).filter(s => s === 'completed').length,
        failed: Array.from(this.migrationStatus.values()).filter(s => s === 'failed').length,
      }
    };
  }

  static reset() {
    this.migrationQueue = [];
    this.migrationStatus.clear();
  }
}

// Batch 1 위젯 자동 등록
export function initializeBatch1Migration() {
  BatchMigrator.addToQueue([
    'calendar-view',
    'todo-list',
    'kpi-metrics',
    'revenue-chart'
  ]);
}