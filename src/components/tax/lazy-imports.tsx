/**
 * 세무 관리 컴포넌트 동적 임포트
 * 번들 크기 최적화를 위한 lazy loading
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// 로딩 컴포넌트
const LoadingComponent = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weave-primary"></div>
  </div>
);

// 엑셀 관련 컴포넌트 (무거운 라이브러리 포함)
export const ExcelImportModal = dynamic(
  () => import('./import/ExcelImportModal'),
  {
    loading: LoadingComponent,
    ssr: false, // 클라이언트 사이드에서만 로드
  }
);

// 보고서 컴포넌트 (PDF 생성 라이브러리 포함)
export const MonthlyTaxReport = dynamic(
  () => import('./reports/MonthlyTaxReport'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

export const QuarterlyVATReport = dynamic(
  () => import('./reports/QuarterlyVATReport'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

// 알림 센터 (복잡한 로직 포함)
export const TaxNotificationCenter = dynamic(
  () => import('./notifications/TaxNotificationCenter'),
  {
    loading: LoadingComponent,
  }
);

// 대시보드 위젯
export const TaxDashboardWidget = dynamic(
  () => import('./widgets/TaxDashboardWidget'),
  {
    loading: LoadingComponent,
  }
);

export const TaxMiniWidget = dynamic(
  () => import('./widgets/TaxDashboardWidget').then(mod => ({ 
    default: mod.TaxMiniWidget 
  })),
  {
    loading: LoadingComponent,
  }
);

export const TaxNotificationBadge = dynamic(
  () => import('./widgets/TaxDashboardWidget').then(mod => ({ 
    default: mod.TaxNotificationBadge 
  })),
  {
    loading: LoadingComponent,
  }
);

// 차트 컴포넌트 (recharts 라이브러리)
export const TaxAnalyticsChart = dynamic(
  () => import('./charts/TaxAnalyticsChart'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

export const VATTrendChart = dynamic(
  () => import('./charts/VATTrendChart'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

// 테스트 컴포넌트 (개발/테스트 환경에서만 로드)
export const AdvancedFeaturesTest = dynamic(
  () => import('./tests/AdvancedFeaturesTest'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

export const QueryOptimizationTest = dynamic(
  () => import('./tests/QueryOptimizationTest'),
  {
    loading: LoadingComponent,
    ssr: false,
  }
);

// 프리로드 함수 (중요한 컴포넌트 미리 로드)
export const preloadCriticalComponents = () => {
  // 자주 사용되는 컴포넌트 프리로드
  import('./widgets/TaxDashboardWidget');
  import('./charts/TaxAnalyticsChart');
};

// 조건부 프리로드 (특정 페이지에서만)
export const preloadReportComponents = () => {
  import('./reports/MonthlyTaxReport');
  import('./reports/QuarterlyVATReport');
};

export const preloadImportComponents = () => {
  import('./import/ExcelImportModal');
};

// 타입 정의
export type LazyComponentType<T = any> = ComponentType<T>;

// 유틸리티 함수
export const isComponentLoaded = (componentName: string): boolean => {
  // webpack의 모듈 캐시 확인
  if (typeof window !== 'undefined' && (window as any).__webpack_modules__) {
    return componentName in (window as any).__webpack_modules__;
  }
  return false;
};

// 컴포넌트 로드 상태 추적
export const trackComponentLoad = (componentName: string) => {
  if (typeof window !== 'undefined') {
    const loadedComponents = (window as any).__loaded_components || [];
    loadedComponents.push({
      name: componentName,
      timestamp: Date.now()
    });
    (window as any).__loaded_components = loadedComponents;
  }
};

// 번들 크기 최적화 설정
export const optimizationConfig = {
  // 청크 프리페치 설정
  prefetch: {
    enabled: true,
    priority: {
      critical: ['TaxDashboardWidget', 'TaxAnalyticsChart'],
      high: ['MonthlyTaxReport', 'QuarterlyVATReport'],
      medium: ['ExcelImportModal', 'TaxNotificationCenter'],
      low: ['AdvancedFeaturesTest', 'QueryOptimizationTest']
    }
  },
  
  // 청크 크기 제한
  chunkSizeLimit: {
    vendor: 500 * 1024, // 500KB
    tax: 200 * 1024, // 200KB
    ui: 100 * 1024, // 100KB
    charts: 300 * 1024 // 300KB
  },
  
  // 로딩 전략
  loadingStrategy: {
    intersection: true, // Intersection Observer 사용
    delay: 100, // 로딩 지연 시간 (ms)
    retries: 3 // 로드 실패 시 재시도 횟수
  }
};