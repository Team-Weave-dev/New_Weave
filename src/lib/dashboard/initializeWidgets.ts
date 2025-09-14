import { lazy } from 'react';
import { WidgetRegistry } from './WidgetRegistry';
import type { WidgetType, WidgetMetadata } from '@/types/dashboard';

// 초기화 상태 추적
let isInitialized = false;

// 위젯 메타데이터 정의
const widgetMetadata: Record<WidgetType, WidgetMetadata> = {
  'project-summary': {
    name: '프로젝트 요약',
    description: '진행 중인 프로젝트 현황을 한눈에 확인',
    icon: 'folder',
    defaultSize: { width: 2, height: 1 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 4, height: 2 },
    tags: ['프로젝트', '요약', '현황'],
  },
  'tax-deadline': {
    name: '세무 캘린더',
    description: '세무 관련 마감일과 일정을 표시',
    icon: 'calendar',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 3 },
    tags: ['세무', '캘린더', '일정'],
  },
  'revenue-chart': {
    name: '수익 차트',
    description: '월별/분기별 수익을 차트로 표시',
    icon: 'chart',
    defaultSize: { width: 2, height: 1 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 2 },
    tags: ['차트', '수익', '매출'],
  },
  'task-tracker': {
    name: '작업 추적기',
    description: '프로젝트별 작업을 추적하고 관리',
    icon: 'tasks',
    defaultSize: { width: 1, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 3, height: 3 },
    tags: ['작업', '할일', '추적'],
  },
  'kpi-metrics': {
    name: 'KPI 지표',
    description: '핵심 성과 지표를 한눈에',
    icon: 'chart-bar',
    defaultSize: { width: 3, height: 1 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 2 },
    tags: ['KPI', '지표', '성과'],
  },
  'tax-calculator': {
    name: '세금 계산기',
    description: '부가세, 소득세 등을 간편하게 계산',
    icon: 'calculator',
    defaultSize: { width: 1, height: 1 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 2, height: 2 },
    tags: ['세금', '계산기', '부가세'],
  },
  'todo-list': {
    name: '할 일 목록',
    description: '개인 할 일을 관리하고 추적',
    icon: 'list-check',
    defaultSize: { width: 1, height: 1 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 2, height: 3 },
    tags: ['할일', '목록', '관리'],
  },
  'calendar': {
    name: '캘린더',
    description: '일정과 이벤트를 캘린더 형태로 표시',
    icon: 'calendar-days',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 3 },
    tags: ['캘린더', '일정', '이벤트'],
  },
  'recent-activity': {
    name: '최근 활동',
    description: '최근 활동 내역을 시간순으로 표시',
    icon: 'activity',
    defaultSize: { width: 1, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 2, height: 3 },
    tags: ['활동', '히스토리', '로그'],
  },
  'custom': {
    name: '커스텀 위젯',
    description: '사용자 정의 위젯',
    icon: 'box',
    defaultSize: { width: 1, height: 1 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 4, height: 4 },
    tags: ['커스텀'],
  },
};

// 위젯 레지스트리 초기화 함수
export function initializeWidgetRegistry() {
  // 이미 초기화된 경우 스킵
  if (isInitialized) {
    console.log('Widget Registry already initialized, skipping...');
    return WidgetRegistry.getStatistics();
  }
  
  isInitialized = true;
  console.log('Initializing Widget Registry...');

  // 프로젝트 관련 위젯
  WidgetRegistry.register(
    'project-summary',
    lazy(() => import('@/components/dashboard/widgets/ProjectSummaryWidget').then(m => ({ default: m.ProjectSummaryWidget }))),
    widgetMetadata['project-summary'],
    'project',
    'high'
  );

  WidgetRegistry.register(
    'task-tracker',
    lazy(() => import('@/components/dashboard/widgets/TaskTrackerWidget').then(m => ({ default: m.TaskTrackerWidget }))),
    widgetMetadata['task-tracker'],
    'productivity',
    'high'
  );

  // 세무 관련 위젯
  WidgetRegistry.register(
    'tax-deadline',
    lazy(() => import('@/components/dashboard/widgets/TaxDeadlineWidget').then(m => ({ default: m.TaxDeadlineWidget }))),
    widgetMetadata['tax-deadline'],
    'tax',
    'high'
  );

  WidgetRegistry.register(
    'tax-calculator',
    lazy(() => import('@/components/dashboard/widgets/TaxCalculatorWidget').then(m => ({ default: m.TaxCalculatorWidget }))),
    widgetMetadata['tax-calculator'],
    'tax',
    'medium'
  );

  // 분석 관련 위젯
  WidgetRegistry.register(
    'revenue-chart',
    lazy(() => import('@/components/dashboard/widgets/RevenueChartWidget').then(m => ({ default: m.RevenueChartWidget }))),
    widgetMetadata['revenue-chart'],
    'analytics',
    'high'
  );

  WidgetRegistry.register(
    'kpi-metrics',
    lazy(() => import('@/components/dashboard/widgets/KPIWidget').then(m => ({ default: m.KPIWidget }))),
    widgetMetadata['kpi-metrics'],
    'analytics',
    'high'
  );

  // 생산성 관련 위젯
  WidgetRegistry.register(
    'todo-list',
    lazy(() => import('@/components/dashboard/widgets/TodoListWidget').then(m => ({ default: m.TodoListWidget }))),
    widgetMetadata['todo-list'],
    'productivity',
    'medium'
  );

  WidgetRegistry.register(
    'calendar',
    lazy(() => import('@/components/dashboard/widgets/CalendarWidget').then(m => ({ default: m.CalendarWidget }))),
    widgetMetadata['calendar'],
    'productivity',
    'medium'
  );

  WidgetRegistry.register(
    'recent-activity',
    lazy(() => import('@/components/dashboard/widgets/RecentActivityWidget').then(m => ({ default: m.RecentActivityWidget }))),
    widgetMetadata['recent-activity'],
    'productivity',
    'low'
  );

  // 레지스트리 상태 출력 (디버깅)
  if (process.env.NODE_ENV === 'development') {
    WidgetRegistry.debug();
  }

  console.log('Widget Registry initialized successfully');
  
  // 통계 반환
  return WidgetRegistry.getStatistics();
}

// 위젯 타입별 아이콘 매핑 (Lucide 아이콘 이름)
export const widgetIcons: Record<WidgetType, string> = {
  'project-summary': 'Folder',
  'tax-deadline': 'Calendar',
  'revenue-chart': 'TrendingUp',
  'task-tracker': 'CheckSquare',
  'kpi-metrics': 'BarChart3',
  'tax-calculator': 'Calculator',
  'todo-list': 'ListChecks',
  'calendar': 'CalendarDays',
  'recent-activity': 'Activity',
  'custom': 'Box',
};

// 카테고리별 색상 매핑
export const categoryColors = {
  project: 'blue',
  tax: 'green',
  analytics: 'purple',
  productivity: 'orange',
  custom: 'gray',
} as const;