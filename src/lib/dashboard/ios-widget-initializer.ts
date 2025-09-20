/**
 * iOS 위젯 초기화 모듈
 */

import { iosWidgetRegistry } from './ios-widget-registry';
import { StatsWidget } from '@/components/dashboard/ios-style/widgets/StatsWidget';
import { ChartWidget } from '@/components/dashboard/ios-style/widgets/ChartWidget';
import { QuickActionWidget } from '@/components/dashboard/ios-style/widgets/QuickActionWidget';

let isInitialized = false;

/**
 * iOS 위젯 레지스트리 초기화
 */
export async function initializeIOSWidgets() {
  if (isInitialized) {
    console.log('[IOSWidgetInitializer] Already initialized');
    return;
  }

  try {
    console.log('[IOSWidgetInitializer] Initializing iOS widgets...');

    // iOS 네이티브 위젯 등록
    iosWidgetRegistry.register('stats', StatsWidget);
    iosWidgetRegistry.register('chart', ChartWidget);
    iosWidgetRegistry.register('quick-action', QuickActionWidget);

    // 레거시 위젯과 동기화
    iosWidgetRegistry.syncWithLegacyRegistry();

    isInitialized = true;
    console.log('[IOSWidgetInitializer] iOS widgets initialized successfully');
  } catch (error) {
    console.error('[IOSWidgetInitializer] Failed to initialize iOS widgets:', error);
    throw error;
  }
}

/**
 * 위젯 타입별 기본 데이터 생성
 */
export function getDefaultWidgetData(type: string): any {
  switch (type) {
    case 'stats':
      return {
        revenue: { value: 0, change: 0, trend: 'up' },
        customers: { value: 0, change: 0, trend: 'up' },
        orders: { value: 0, change: 0, trend: 'up' },
        conversion: { value: 0, change: 0, trend: 'up' },
      };
    
    case 'chart':
      return {
        labels: [],
        datasets: [],
      };
    
    case 'quick-action':
      return {
        actions: [],
      };
    
    case 'calendar':
      return {
        events: [],
        currentDate: new Date().toISOString(),
      };
    
    default:
      return {};
  }
}

/**
 * 위젯 타입별 설정 스키마
 */
export function getWidgetConfigSchema(type: string): any {
  switch (type) {
    case 'stats':
      return {
        title: { type: 'string', default: '통계 대시보드' },
        refreshInterval: { type: 'number', default: 60000 }, // 1분
        showTrend: { type: 'boolean', default: true },
      };
    
    case 'chart':
      return {
        title: { type: 'string', default: '차트' },
        chartType: { type: 'select', options: ['bar', 'line', 'pie'], default: 'bar' },
        showLegend: { type: 'boolean', default: true },
        refreshInterval: { type: 'number', default: 60000 },
      };
    
    case 'quick-action':
      return {
        title: { type: 'string', default: '빠른 작업' },
        columns: { type: 'number', min: 2, max: 4, default: 2 },
      };
    
    case 'calendar':
      return {
        title: { type: 'string', default: '캘린더' },
        view: { type: 'select', options: ['month', 'week', 'day'], default: 'month' },
        showWeekends: { type: 'boolean', default: true },
      };
    
    default:
      return {};
  }
}