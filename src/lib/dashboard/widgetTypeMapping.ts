/**
 * 위젯 타입 매핑 유틸리티
 * 한글 위젯 이름과 영문 위젯 타입 간의 매핑을 관리
 */

// 실제 구현된 위젯 타입 (kebab-case)
export type WidgetType = 
  | 'project-summary'
  | 'task-tracker'
  | 'tax-deadline'
  | 'tax-calculator'
  | 'revenue-chart'
  | 'kpi-metrics'
  | 'todo-list'
  | 'calendar'
  | 'recent-activity'
  | 'time-tracker'
  | 'pomodoro'
  | 'custom';

// 한글 이름 -> 영문 타입 매핑
const WIDGET_TYPE_MAP: Record<string, WidgetType> = {
  // 프로젝트 관련
  '프로젝트 요약': 'project-summary',
  '작업 추적기': 'task-tracker',
  
  // 세무 관련
  '세무 캘린더': 'tax-deadline',
  '세금 계산기': 'tax-calculator',
  
  // 분석 관련
  '매출 차트': 'revenue-chart',
  '수익 차트': 'revenue-chart', // 별칭
  'KPI 지표': 'kpi-metrics',
  
  // 생산성 관련
  '캘린더': 'calendar',
  '할 일 목록': 'todo-list',
  '할 일': 'todo-list', // 별칭
  '최근 활동': 'recent-activity',
  '시간 추적기': 'time-tracker',
  '뽀모도로 타이머': 'pomodoro',
  '뽀모도로': 'pomodoro', // 별칭
  
  // 커스텀
  '커스텀': 'custom',
  '사용자 정의': 'custom', // 별칭
};

// 영문 타입 -> 한글 이름 역매핑
const REVERSE_TYPE_MAP: Record<WidgetType, string> = {
  'project-summary': '프로젝트 요약',
  'task-tracker': '작업 추적기',
  'tax-deadline': '세무 캘린더',
  'tax-calculator': '세금 계산기',
  'revenue-chart': '매출 차트',
  'kpi-metrics': 'KPI 지표',
  'todo-list': '할 일 목록',
  'calendar': '캘린더',
  'recent-activity': '최근 활동',
  'time-tracker': '시간 추적기',
  'pomodoro': '뽀모도로 타이머',
  'custom': '커스텀',
} as const;

// PascalCase -> kebab-case 변환을 위한 매핑 (하위 호환성)
const PASCAL_TO_KEBAB_MAP: Record<string, WidgetType> = {
  'ProjectSummary': 'project-summary',
  'TaskTracker': 'task-tracker',
  'TaxDeadline': 'tax-deadline',
  'TaxCalculator': 'tax-calculator',
  'RevenueChart': 'revenue-chart',
  'KPIMetrics': 'kpi-metrics',
  'TodoList': 'todo-list',
  'Calendar': 'calendar',
  'RecentActivity': 'recent-activity',
  'TimeTracker': 'time-tracker',
  'Pomodoro': 'pomodoro',
  'PomodoroWidget': 'pomodoro',
  'Custom': 'custom',
};

/**
 * 한글 위젯 이름을 영문 타입으로 변환
 */
export function normalizeWidgetType(nameOrType: string): WidgetType | string {
  // 이미 kebab-case 타입인 경우 그대로 반환
  if (isValidWidgetType(nameOrType)) {
    return nameOrType as WidgetType;
  }
  
  // PascalCase를 kebab-case로 변환 (하위 호환성)
  if (nameOrType in PASCAL_TO_KEBAB_MAP) {
    return PASCAL_TO_KEBAB_MAP[nameOrType];
  }
  
  // 한글 이름인 경우 매핑
  const mappedType = WIDGET_TYPE_MAP[nameOrType];
  if (mappedType) {
    return mappedType;
  }
  
  // 매핑되지 않은 경우 원본 반환 (하위 호환성)
  console.warn(`Unknown widget type: ${nameOrType}`);
  return nameOrType;
}

/**
 * 영문 타입을 한글 이름으로 변환
 */
export function getWidgetDisplayName(type: WidgetType | string): string {
  if (type in REVERSE_TYPE_MAP) {
    return REVERSE_TYPE_MAP[type as WidgetType];
  }
  
  // 매핑되지 않은 경우 타입 그대로 반환
  return type;
}

/**
 * 유효한 위젯 타입인지 확인
 */
export function isValidWidgetType(type: string): boolean {
  const validTypes: WidgetType[] = [
    'project-summary',
    'task-tracker', 
    'tax-deadline',
    'tax-calculator',
    'revenue-chart',
    'kpi-metrics',
    'todo-list',
    'calendar',
    'recent-activity',
    'time-tracker',
    'pomodoro',
    'custom',
  ];
  
  return validTypes.includes(type as WidgetType);
}

/**
 * localStorage의 위젯 데이터를 마이그레이션
 * 한글 타입을 영문 타입으로 변환
 */
export function migrateWidgetTypes(widgets: any[]): any[] {
  return widgets.map(widget => ({
    ...widget,
    type: normalizeWidgetType(widget.type)
  }));
}