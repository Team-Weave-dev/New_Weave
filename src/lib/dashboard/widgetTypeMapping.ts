/**
 * 위젯 타입 매핑 유틸리티
 * 한글 위젯 이름과 영문 위젯 타입 간의 매핑을 관리
 */

// 실제 구현된 위젯 타입
export type WidgetType = 
  | 'ProjectSummary'
  | 'TaskTracker'
  | 'TaxDeadline'
  | 'TaxCalculator'
  | 'RevenueChart'
  | 'KPIMetrics';

// 한글 이름 -> 영문 타입 매핑
const WIDGET_TYPE_MAP: Record<string, WidgetType> = {
  // 프로젝트 관련
  '프로젝트 요약': 'ProjectSummary',
  '작업 추적기': 'TaskTracker',
  
  // 세무 관련
  '세무 캘린더': 'TaxDeadline',
  '세금 계산기': 'TaxCalculator',
  
  // 분석 관련
  '매출 차트': 'RevenueChart',
  '수익 차트': 'RevenueChart', // 별칭
  'KPI 지표': 'KPIMetrics',
  
  // 일반 (실제 위젯으로 매핑)
  '캘린더': 'TaxDeadline',
  '할 일 목록': 'TaskTracker',
  '할 일': 'TaskTracker', // 별칭
  '최근 활동': 'TaskTracker',
};

// 영문 타입 -> 한글 이름 역매핑
const REVERSE_TYPE_MAP: Record<WidgetType, string> = {
  'ProjectSummary': '프로젝트 요약',
  'TaskTracker': '작업 추적기',
  'TaxDeadline': '세무 캘린더',
  'TaxCalculator': '세금 계산기',
  'RevenueChart': '매출 차트',
  'KPIMetrics': 'KPI 지표',
} as const;

/**
 * 한글 위젯 이름을 영문 타입으로 변환
 */
export function normalizeWidgetType(nameOrType: string): WidgetType | string {
  // 이미 영문 타입인 경우 그대로 반환
  if (isValidWidgetType(nameOrType)) {
    return nameOrType as WidgetType;
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
    'ProjectSummary',
    'TaskTracker', 
    'TaxDeadline',
    'TaxCalculator',
    'RevenueChart',
    'KPIMetrics',
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