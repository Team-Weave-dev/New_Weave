/**
 * Weave Debug Tools
 * 브라우저 콘솔에서 사용할 수 있는 개발자 도구
 */

import { featureFlagService, IOSFeatureFlags } from '@/lib/features/ios-style-flag';
import { useIOSDashboardStore } from '@/lib/stores/useIOSDashboardStore';
import { useDashboardStore } from '@/lib/stores/useDashboardStore';
import { BatchMigrator } from '@/lib/dashboard/migration/WidgetMigrationWrapper';
import { abTestService } from '@/lib/features/ab-test-config';
import { rollbackMonitor } from '@/lib/features/rollback-monitor';

export interface WeaveDebugTools {
  // iOS 스타일 관련
  enableIOS: () => void;
  disableIOS: () => void;
  toggleIOS: () => void;
  showStatus: () => void;
  
  // 데이터 관련
  exportData: () => any;
  importData: (data: any) => void;
  migrateData: () => Promise<void>;
  
  // Feature Flag 관련
  showFlags: () => void;
  setFlag: (flagId: string, enabled: boolean) => void;
  resetFlags: () => void;
  
  // 성능 관련
  showMetrics: () => void;
  clearCache: () => void;
  
  // 스토어 관련
  showIOSStore: () => void;
  showLegacyStore: () => void;
  resetStores: () => void;
  
  // 마이그레이션 관련 (Phase 2.1)
  startMigration: () => Promise<void>;
  migrationStatus: () => any;
  migrateWidget: (widgetType: string) => Promise<boolean>;
  
  // A/B 테스트 관련 (Phase 2.2)
  assignToABGroup: (group: 'control' | 'treatment') => void;
  showABTestResults: () => void;
  trackABMetric: (metric: string, value: any) => void;
  
  // 롤백 모니터 관련 (Phase 2.3)
  startMonitoring: () => void;
  stopMonitoring: () => void;
  showMonitorStatus: () => void;
  triggerManualRollback: (reason?: string) => void;
}

class WeaveDebugService {
  private static instance: WeaveDebugService;
  
  private constructor() {
    this.initializeDebugTools();
  }
  
  static getInstance(): WeaveDebugService {
    if (!WeaveDebugService.instance) {
      WeaveDebugService.instance = new WeaveDebugService();
    }
    return WeaveDebugService.instance;
  }
  
  private initializeDebugTools(): void {
    if (typeof window === 'undefined') return;
    
    const debugTools: WeaveDebugTools = {
      // iOS 스타일 관련
      enableIOS: () => {
        localStorage.setItem('weave-ios-override', 'true');
        featureFlagService.updateFlag({
          id: IOSFeatureFlags.IOS_STYLE_DASHBOARD,
          name: 'iOS Style Dashboard',
          description: 'iOS/iPadOS 스타일 위젯 편집 시스템',
          status: 'enabled',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'debug',
          rollout: {
            strategy: 'percentage',
            percentage: 100,
          },
        });
        console.log('✅ iOS 스타일이 활성화되었습니다.');
        window.location.reload();
      },
      
      disableIOS: () => {
        localStorage.setItem('weave-ios-override', 'false');
        featureFlagService.updateFlag({
          id: IOSFeatureFlags.IOS_STYLE_DASHBOARD,
          name: 'iOS Style Dashboard',
          description: 'iOS/iPadOS 스타일 위젯 편집 시스템',
          status: 'disabled',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'debug',
          rollout: {
            strategy: 'percentage',
            percentage: 0,
          },
        });
        console.log('❌ iOS 스타일이 비활성화되었습니다.');
        window.location.reload();
      },
      
      toggleIOS: () => {
        const current = featureFlagService.isEnabled(IOSFeatureFlags.IOS_STYLE_DASHBOARD);
        if (current) {
          debugTools.disableIOS();
        } else {
          debugTools.enableIOS();
        }
      },
      
      showStatus: () => {
        const iosEnabled = featureFlagService.isEnabled(IOSFeatureFlags.IOS_STYLE_DASHBOARD);
        const iosFeatures = featureFlagService.getIOSFeatures();
        
        console.group('📊 Weave Debug Status');
        console.log('iOS Style Dashboard:', iosEnabled ? '✅ 활성' : '❌ 비활성');
        console.log('Environment:', process.env.NODE_ENV);
        console.table(iosFeatures);
        console.groupEnd();
      },
      
      // 데이터 관련
      exportData: () => {
        const iosStore = useIOSDashboardStore.getState();
        const legacyStore = useDashboardStore.getState();
        
        const data = {
          ios: {
            widgets: iosStore.widgets,
            columns: iosStore.columns,
            gap: iosStore.gap,
            padding: iosStore.padding,
            isEditMode: iosStore.isEditMode,
          },
          legacy: {
            layouts: legacyStore.layouts,
            widgets: legacyStore.widgets,
            currentLayout: legacyStore.currentLayout,
          },
          settings: {
            localStorage: {
              ...localStorage
            }
          },
          timestamp: new Date().toISOString(),
        };
        
        console.log('📦 Exported Data:', data);
        
        // 클립보드에 복사
        const json = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(json).then(() => {
          console.log('✅ 데이터가 클립보드에 복사되었습니다.');
        });
        
        return data;
      },
      
      importData: (data: any) => {
        try {
          if (data.ios) {
            const iosStore = useIOSDashboardStore.getState();
            if (data.ios.widgets) {
              iosStore.setWidgets(data.ios.widgets);
            }
            if (data.ios.columns) {
              iosStore.setLayoutConfig({ columns: data.ios.columns });
            }
            if (data.ios.gap) {
              iosStore.setLayoutConfig({ gap: data.ios.gap });
            }
            if (data.ios.padding) {
              iosStore.setLayoutConfig({ padding: data.ios.padding });
            }
          }
          
          if (data.legacy) {
            const legacyStore = useDashboardStore.getState();
            if (data.legacy.currentLayout) {
              legacyStore.setCurrentLayout(data.legacy.currentLayout);
            }
          }
          
          console.log('✅ 데이터를 성공적으로 가져왔습니다.');
        } catch (error) {
          console.error('❌ 데이터 가져오기 실패:', error);
        }
      },
      
      migrateData: async () => {
        console.log('🔄 데이터 마이그레이션 시작...');
        
        const legacyStore = useDashboardStore.getState();
        const iosStore = useIOSDashboardStore.getState();
        
        // 레거시 레이아웃을 iOS 레이아웃으로 변환
        const legacyLayouts = legacyStore.layouts;
        const iosLayouts = legacyLayouts.map((layout: any) => ({
          id: layout.id,
          name: layout.name,
          widgets: layout.widgets?.map((widget: any) => ({
            id: widget.id,
            type: widget.type,
            title: widget.config?.title || widget.type,
            position: {
              x: widget.position?.x || 0,
              y: widget.position?.y || 0,
            },
            size: {
              width: widget.size?.width || 2,
              height: widget.size?.height || 2,
            },
            config: widget.config || {},
            data: widget.data,
          })) || [],
          isLocked: false,
          createdAt: layout.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        // iOS 대시보드는 레이아웃이 아닌 위젯 배열을 관리
        if (iosLayouts.length > 0) {
          iosStore.setWidgets(iosLayouts[0].widgets || []);
        }
        
        console.log('✅ 마이그레이션 완료:', {
          레거시_레이아웃: legacyLayouts.length,
          iOS_레이아웃: iosLayouts.length,
        });
      },
      
      // Feature Flag 관련
      showFlags: () => {
        const allFlags = featureFlagService.evaluateAll();
        console.group('🚩 Feature Flags');
        console.table(allFlags);
        console.groupEnd();
      },
      
      setFlag: (flagId: string, enabled: boolean) => {
        const flag = {
          id: flagId,
          name: flagId,
          description: `Debug override for ${flagId}`,
          status: (enabled ? 'enabled' : 'disabled') as 'enabled' | 'disabled',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'debug',
          rollout: {
            strategy: 'percentage' as const,
            percentage: enabled ? 100 : 0,
          },
        };
        
        featureFlagService.updateFlag(flag as any);
        console.log(`✅ Flag ${flagId} set to ${enabled ? 'enabled' : 'disabled'}`);
      },
      
      resetFlags: () => {
        localStorage.removeItem('weave-ios-override');
        featureFlagService.clearCache();
        console.log('✅ 모든 플래그가 초기화되었습니다.');
        window.location.reload();
      },
      
      // 성능 관련
      showMetrics: () => {
        const metrics = featureFlagService.getMetricsCollector();
        console.group('📈 Performance Metrics');
        console.log('Metrics collector:', metrics);
        console.groupEnd();
      },
      
      clearCache: () => {
        featureFlagService.clearCache();
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ 모든 캐시가 삭제되었습니다.');
      },
      
      // 스토어 관련
      showIOSStore: () => {
        const store = useIOSDashboardStore.getState();
        console.group('📱 iOS Dashboard Store');
        console.log('Widgets:', store.widgets);
        console.log('Columns:', store.columns);
        console.log('Gap:', store.gap);
        console.log('Padding:', store.padding);
        console.log('Edit Mode:', store.isEditMode);
        console.groupEnd();
      },
      
      showLegacyStore: () => {
        const store = useDashboardStore.getState();
        console.group('📦 Legacy Dashboard Store');
        console.log('Layouts:', store.layouts);
        console.log('Widgets:', store.widgets);
        console.log('Current Layout:', store.currentLayout);
        console.log('Edit Mode:', store.isEditMode);
        console.groupEnd();
      },
      
      resetStores: () => {
        const iosStore = useIOSDashboardStore.getState();
        const legacyStore = useDashboardStore.getState();
        
        iosStore.setWidgets([]);
        
        // Legacy store 초기화
        // clearLayouts 메서드가 없을 수 있으므로 수동으로 처리
        
        console.log('✅ 모든 스토어가 초기화되었습니다.');
      },
      
      // 마이그레이션 관련 (Phase 2.1)
      startMigration: async () => {
        console.log('🔄 위젯 마이그레이션 시작...');
        
        // Batch 1 위젯 추가
        BatchMigrator.addToQueue([
          'calendar-view',
          'todo-list',
          'kpi-metrics',
          'revenue-chart'
        ]);
        
        // 마이그레이션 실행
        await BatchMigrator.migrateAll();
        
        const status = BatchMigrator.getStatus();
        console.log('✅ 마이그레이션 완료:', status);
      },
      
      migrationStatus: () => {
        const status = BatchMigrator.getStatus();
        console.group('📊 마이그레이션 상태');
        console.log('대기열:', status.queue);
        console.log('상태:', status.status);
        console.log('진행률:', `${status.progress.completed}/${status.progress.total} (실패: ${status.progress.failed})`);
        console.groupEnd();
        return status;
      },
      
      migrateWidget: async (widgetType: string) => {
        BatchMigrator.addToQueue([widgetType]);
        const result = await BatchMigrator.migrateNext();
        console.log(result ? `✅ ${widgetType} 마이그레이션 성공` : `❌ ${widgetType} 마이그레이션 실패`);
        return result;
      },
      
      // A/B 테스트 관련 (Phase 2.2)
      assignToABGroup: (group: 'control' | 'treatment') => {
        const userId = localStorage.getItem('user_id') || 'test-user';
        localStorage.setItem(`ab_test_ios_style_dashboard_${userId}`, group);
        console.log(`✅ 사용자가 ${group} 그룹에 할당되었습니다.`);
        window.location.reload();
      },
      
      showABTestResults: () => {
        const results = abTestService.getTestResults();
        console.group('📊 A/B 테스트 결과');
        console.log('그룹별 사용자:', results.groups);
        console.log('메트릭별 결과:', results.metrics);
        console.log('성공 기준 달성:', results.successCriteria);
        console.groupEnd();
      },
      
      trackABMetric: (metric: string, value: any) => {
        const userId = localStorage.getItem('user_id') || 'test-user';
        abTestService.trackMetric(userId, metric, value);
        console.log(`✅ 메트릭 기록: ${metric} = ${value}`);
      },
      
      // 롤백 모니터 관련 (Phase 2.3)
      startMonitoring: () => {
        rollbackMonitor.start();
        console.log('✅ 롤백 모니터링이 시작되었습니다.');
      },
      
      stopMonitoring: () => {
        rollbackMonitor.stop();
        console.log('⏹️ 롤백 모니터링이 중지되었습니다.');
      },
      
      showMonitorStatus: () => {
        const status = rollbackMonitor.getStatus();
        console.group('📊 롤백 모니터 상태');
        console.log('모니터링 중:', status.isMonitoring);
        console.log('설정:', status.config);
        console.log('최근 메트릭:', status.recentMetrics);
        console.log('롤백 히스토리:', status.rollbackHistory);
        console.groupEnd();
      },
      
      triggerManualRollback: (reason?: string) => {
        rollbackMonitor.manualRollback(reason || '수동 롤백 테스트');
        console.log('⚠️ 수동 롤백이 실행되었습니다.');
      },
    };
    
    // window 객체에 디버그 도구 추가
    (window as any).weaveDebug = debugTools;
    
    // 개발 환경에서만 자동으로 상태 표시
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Weave Debug Tools loaded. Type `weaveDebug.showStatus()` to see current status.');
      console.log('Available commands:', Object.keys(debugTools));
    }
  }
  
  // 디버그 도구 초기화
  initialize(): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('🚀 Initializing Weave Debug Tools...');
    }
  }
}

// 싱글톤 인스턴스 생성
export const weaveDebugService = WeaveDebugService.getInstance();

// 자동 초기화 (브라우저 환경에서만)
if (typeof window !== 'undefined') {
  weaveDebugService.initialize();
}