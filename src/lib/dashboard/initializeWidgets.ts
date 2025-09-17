import { lazy } from 'react';
import { WidgetRegistry } from './WidgetRegistry';
import type { WidgetType, WidgetMetadata } from '@/types/dashboard';

// 초기화 상태 추적
let isInitialized = false;

// 위젯 메타데이터 정의
const widgetMetadata: Record<WidgetType, WidgetMetadata> = {
  'project-summary': {
    type: 'project-summary',
    name: '프로젝트 요약',
    description: '진행 중인 프로젝트 현황을 한눈에 확인',
    icon: 'folder',
    defaultSize: { width: 2, height: 1 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 4, height: 2 },
    tags: ['프로젝트', '요약', '현황'],
  },
  'tax-deadline': {
    type: 'tax-deadline',
    name: '세무 캘린더',
    description: '세무 관련 마감일과 일정을 표시',
    icon: 'calendar',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 3 },
    tags: ['세무', '캘린더', '일정'],
  },
  'revenue-chart': {
    type: 'revenue-chart',
    name: '수익 차트',
    description: '월별/분기별 수익을 차트로 표시',
    icon: 'chart',
    defaultSize: { width: 2, height: 1 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 2 },
    tags: ['차트', '수익', '매출'],
  },
  'task-tracker': {
    type: 'task-tracker',
    name: '작업 추적기',
    description: '프로젝트별 작업을 추적하고 관리',
    icon: 'tasks',
    defaultSize: { width: 1, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 3, height: 3 },
    tags: ['작업', '할일', '추적'],
  },
  'kpi-metrics': {
    type: 'kpi-metrics',
    name: 'KPI 지표',
    description: '핵심 성과 지표를 한눈에',
    icon: 'chart-bar',
    defaultSize: { width: 3, height: 1 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 2 },
    tags: ['KPI', '지표', '성과'],
  },
  'tax-calculator': {
    type: 'tax-calculator',
    name: '세금 계산기',
    description: '부가세, 소득세 등을 간편하게 계산',
    icon: 'calculator',
    defaultSize: { width: 1, height: 1 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 2, height: 2 },
    tags: ['세금', '계산기', '부가세'],
  },
  'todo-list': {
    type: 'todo-list',
    name: '할 일 목록',
    description: '개인 할 일을 관리하고 추적',
    icon: 'list-check',
    defaultSize: { width: 1, height: 1 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 2, height: 3 },
    tags: ['할일', '목록', '관리'],
  },
  'calendar': {
    type: 'calendar',
    name: '캘린더',
    description: '일정과 이벤트를 캘린더 형태로 표시',
    icon: 'calendar-days',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 3 },
    tags: ['캘린더', '일정', '이벤트'],
  },
  'calendar-view': {
    type: 'calendar-view',
    name: '캘린더 뷰',
    description: '일정과 이벤트를 캘린더 뷰로 표시',
    icon: 'calendar-days',
    defaultSize: { width: 3, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 4 },
    tags: ['캘린더', '일정', '뷰'],
  },
  'recent-activity': {
    type: 'recent-activity',
    name: '최근 활동',
    description: '최근 활동 내역을 시간순으로 표시',
    icon: 'activity',
    defaultSize: { width: 1, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 2, height: 3 },
    tags: ['활동', '히스토리', '로그'],
  },
  'event-list': {
    type: 'event-list',
    name: '이벤트 목록',
    description: '일정과 이벤트를 목록 형태로 표시',
    icon: 'list',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 3 },
    tags: ['일정', '이벤트', '목록'],
  },
  'time-tracker': {
    type: 'time-tracker',
    name: '시간 추적기',
    description: '프로젝트별 시간 추적 및 리포트',
    icon: 'clock',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 3 },
    tags: ['시간', '추적', '프로젝트', '타이머'],
  },
  'pomodoro': {
    type: 'pomodoro',
    name: '뽀모도로 타이머',
    description: '집중력 향상을 위한 뽀모도로 기법 타이머',
    icon: 'target',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 2 },
    maxSize: { width: 3, height: 3 },
    tags: ['뽀모도로', '타이머', '집중', '생산성'],
  },
  'quick-notes': {
    type: 'quick-notes',
    name: '빠른 메모',
    description: '간단한 메모와 아이디어 저장',
    icon: 'file-text',
    defaultSize: { width: 1, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 2, height: 3 },
    tags: ['메모', '노트', '아이디어', '태그'],
  },
  'weather': {
    type: 'weather',
    name: '날씨 정보',
    description: '현재 위치 날씨 및 5일 예보',
    icon: 'cloud',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 3 },
    tags: ['날씨', '예보', '기온', '습도'],
  },
  'expense-tracker': {
    type: 'expense-tracker',
    name: '지출 추적기',
    description: '카테고리별 지출 관리 및 예산 설정',
    icon: 'wallet',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 3 },
    tags: ['지출', '예산', '금융', '차트'],
  },
  'cash-flow': {
    type: 'cash-flow',
    name: '현금 흐름',
    description: '수입/지출 현금 흐름 시각화',
    icon: 'trending-up',
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 3 },
    tags: ['현금', '흐름', '수입', '지출', '예측'],
  },
  'client-overview': {
    type: 'client-overview',
    name: '고객 현황',
    description: '고객별 프로젝트 및 매출 현황',
    icon: 'users',
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 3 },
    tags: ['고객', '매출', '프로젝트', '현황'],
  },
  'invoice-status': {
    type: 'invoice-status',
    name: '청구서 현황',
    description: '청구서 및 미수금 관리',
    icon: 'file-text',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 3 },
    tags: ['청구서', '미수금', '결제', '관리'],
  },
  'custom': {
    type: 'custom',
    name: '커스텀 위젯',
    description: '사용자 정의 위젯',
    icon: 'box',
    defaultSize: { width: 1, height: 1 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 4, height: 4 },
    tags: ['커스텀'],
  },
  'realtime-test': {
    type: 'realtime-test',
    name: '실시간 테스트',
    description: '실시간 업데이트 시스템 테스트',
    icon: 'activity',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 2 },
    maxSize: { width: 3, height: 3 },
    tags: ['실시간', '테스트', '개발'],
  },
  'notification-center': {
    type: 'notification-center',
    name: '알림 센터',
    description: '통합 알림 센터로 모든 알림을 관리',
    icon: 'bell',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 4 },
    tags: ['알림', '통지', '커뮤니케이션'],
  },
  'team-status': {
    type: 'team-status',
    name: '팀원 상태',
    description: '팀원의 온라인 상태, 작업 현황 및 일정',
    icon: 'users',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 3 },
    tags: ['팀', '협업', '상태', '커뮤니케이션'],
  },
  'quick-links': {
    type: 'quick-links',
    name: '바로가기',
    description: '자주 사용하는 링크를 추가하고 관리',
    icon: 'link',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 2 },
    maxSize: { width: 3, height: 3 },
    tags: ['바로가기', '링크', '즐겨찾기', '커뮤니케이션'],
  },
  'announcements': {
    type: 'announcements',
    name: '공지사항',
    description: '중요한 공지사항을 확인하고 관리',
    icon: 'megaphone',
    defaultSize: { width: 2, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 4 },
    tags: ['공지', '알림', '안내'],
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
    lazy(() => import('@/components/dashboard/widgets/TodoListWidget')),
    widgetMetadata['todo-list'],
    'productivity',
    'medium'
  );

  WidgetRegistry.register(
    'calendar',
    lazy(() => import('@/components/dashboard/widgets/CalendarViewWidget')),
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

  // 이벤트 목록 위젯
  WidgetRegistry.register(
    'event-list',
    lazy(() => import('@/components/dashboard/widgets/EventListWidget')),
    {
      type: 'event-list',
      name: '이벤트 목록',
      description: '일정과 이벤트를 목록 형태로 표시',
      icon: 'list',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 1 },
      maxSize: { width: 4, height: 3 },
      tags: ['일정', '이벤트', '목록'],
    },
    'productivity',
    'medium'
  );

  // 시간 추적기 위젯
  WidgetRegistry.register(
    'time-tracker',
    lazy(() => import('@/components/dashboard/widgets/TimeTrackerWidget').then(m => ({ default: m.TimeTrackerWidget }))),
    widgetMetadata['time-tracker'],
    'productivity',
    'high'
  );

  // 뽀모도로 타이머 위젯
  WidgetRegistry.register(
    'pomodoro',
    lazy(() => import('@/components/dashboard/widgets/PomodoroWidget').then(m => ({ default: m.PomodoroWidget }))),
    widgetMetadata['pomodoro'],
    'productivity',
    'high'
  );

  // 빠른 메모 위젯
  WidgetRegistry.register(
    'quick-notes',
    lazy(() => import('@/components/dashboard/widgets/QuickNotesWidget').then(m => ({ default: m.QuickNotesWidget }))),
    widgetMetadata['quick-notes'],
    'productivity',
    'medium'
  );

  // 날씨 위젯
  WidgetRegistry.register(
    'weather',
    lazy(() => import('@/components/dashboard/widgets/WeatherWidget').then(m => ({ default: m.WeatherWidget }))),
    widgetMetadata['weather'],
    'productivity',
    'low'
  );

  // 지출 추적기 위젯
  WidgetRegistry.register(
    'expense-tracker',
    lazy(() => import('@/components/dashboard/widgets/ExpenseTrackerWidget').then(m => ({ default: m.ExpenseTrackerWidget }))),
    widgetMetadata['expense-tracker'],
    'analytics',
    'high'
  );

  // 현금 흐름 위젯
  WidgetRegistry.register(
    'cash-flow',
    lazy(() => import('@/components/dashboard/widgets/analytics/CashFlowWidget').then(m => ({ default: m.CashFlowWidget }))),
    widgetMetadata['cash-flow'],
    'analytics',
    'high'
  );

  // 고객 현황 위젯
  WidgetRegistry.register(
    'client-overview',
    lazy(() => import('@/components/dashboard/widgets/ClientOverviewWidget')),
    widgetMetadata['client-overview'],
    'analytics',
    'high'
  );

  // 청구서 현황 위젯
  WidgetRegistry.register(
    'invoice-status',
    lazy(() => import('@/components/dashboard/widgets/InvoiceStatusWidget').then(m => ({ default: m.InvoiceStatusWidget }))),
    widgetMetadata['invoice-status'],
    'analytics',
    'high'
  );

  // 커스텀 위젯
  WidgetRegistry.register(
    'custom',
    lazy(() => import('@/components/dashboard/widgets/CustomWidget').then(m => ({ default: m.CustomWidget }))),
    widgetMetadata['custom'],
    'custom',
    'low'
  );

  // 실시간 테스트 위젯
  WidgetRegistry.register(
    'realtime-test',
    lazy(() => import('@/components/dashboard/widgets/RealtimeTestWidget').then(m => ({ default: m.RealtimeTestWidget }))),
    widgetMetadata['realtime-test'],
    'custom',
    'low'
  );

  // 알림 센터 위젯
  WidgetRegistry.register(
    'notification-center',
    lazy(() => import('@/components/dashboard/widgets/NotificationCenterWidget')),
    widgetMetadata['notification-center'],
    'productivity',
    'high'
  );

  // 팀원 상태 위젯
  WidgetRegistry.register(
    'team-status',
    lazy(() => import('@/components/dashboard/widgets/TeamStatusWidget')),
    widgetMetadata['team-status'],
    'productivity',
    'high'
  );

  // 바로가기 위젯
  WidgetRegistry.register(
    'quick-links',
    lazy(() => import('@/components/dashboard/widgets/QuickLinksWidget').then(m => ({ default: m.QuickLinksWidget }))),
    widgetMetadata['quick-links'],
    'productivity',
    'medium'
  );

  // 공지사항 위젯
  WidgetRegistry.register(
    'announcements',
    lazy(() => import('@/components/dashboard/widgets/AnnouncementsWidget')),
    widgetMetadata['announcements'],
    'custom',
    'medium'
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
export const widgetIcons: Record<string, string> = {
  'project-summary': 'Folder',
  'tax-deadline': 'Calendar',
  'revenue-chart': 'TrendingUp',
  'task-tracker': 'CheckSquare',
  'kpi-metrics': 'BarChart3',
  'tax-calculator': 'Calculator',
  'todo-list': 'ListChecks',
  'calendar': 'CalendarDays',
  'event-list': 'List',
  'recent-activity': 'Activity',
  'time-tracker': 'Clock',
  'pomodoro': 'Target',
  'quick-notes': 'FileText',
  'weather': 'Cloud',
  'expense-tracker': 'Wallet',
  'cash-flow': 'TrendingUp',
  'client-overview': 'Users',
  'invoice-status': 'FileText',
  'custom': 'Box',
  'realtime-test': 'Activity',
  'notification-center': 'Bell',
  'team-status': 'Users',
  'quick-links': 'Link2',
  'announcements': 'Megaphone',
};

// 카테고리별 색상 매핑
export const categoryColors = {
  project: 'blue',
  tax: 'green',
  analytics: 'purple',
  productivity: 'orange',
  custom: 'gray',
} as const;