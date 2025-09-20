/**
 * iOS 스타일 위젯 컴포넌트 인덱스
 */

export { StatsWidget } from './StatsWidget';
export { ChartWidget } from './ChartWidget';
export { QuickActionWidget } from './QuickActionWidget';

// CalendarWidget은 기존 컴포넌트 재사용
export { default as CalendarWidget } from '@/components/dashboard/widgets/CalendarWidget';

// 위젯 레지스트리 등록을 위한 맵
export const iosWidgets = {
  'stats': () => import('./StatsWidget').then(m => m.StatsWidget),
  'chart': () => import('./ChartWidget').then(m => m.ChartWidget),
  'quick-action': () => import('./QuickActionWidget').then(m => m.QuickActionWidget),
  'calendar': () => import('@/components/dashboard/widgets/CalendarWidget'),
};

// 위젯 메타데이터
export const iosWidgetMetadata = {
  'stats': {
    name: '통계 대시보드',
    description: '주요 지표를 한눈에 확인',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 3 },
  },
  'chart': {
    name: '차트',
    description: '데이터 시각화 차트',
    defaultSize: { width: 4, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 6, height: 4 },
  },
  'quick-action': {
    name: '빠른 작업',
    description: '자주 사용하는 기능 바로가기',
    defaultSize: { width: 2, height: 1 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 2 },
  },
  'calendar': {
    name: '캘린더',
    description: '일정 관리',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 4 },
  },
};