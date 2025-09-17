/**
 * WidgetConfig Types - 위젯 설정 관리 시스템 타입 정의
 */

// 기본 위젯 설정 인터페이스
export interface WidgetConfig {
  id: string;
  type: string;
  title?: string;
  settings: WidgetSettings;
  metadata: WidgetMetadata;
}

// 위젯별 설정 타입
export interface WidgetSettings {
  // 공통 설정
  refreshInterval?: number; // 밀리초 단위
  showHeader?: boolean;
  showFooter?: boolean;
  theme?: 'default' | 'compact' | 'minimal';
  
  // 위젯별 커스텀 설정
  customSettings?: Record<string, any>;
}

// 위젯 메타데이터
export interface WidgetMetadata {
  createdAt: string;
  updatedAt: string;
  version: string;
  author?: string;
  description?: string;
  tags?: string[];
}

// 프리셋 데이터
export interface PresetData {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  layout?: LayoutConfig;
  metadata: PresetMetadata;
}

// 레이아웃 설정
export interface LayoutConfig {
  columns: number;
  rowHeight: number;
  gap: number;
  widgets: WidgetLayoutItem[];
}

// 위젯 레이아웃 아이템
export interface WidgetLayoutItem {
  widgetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// 프리셋 메타데이터
export interface PresetMetadata {
  createdAt: string;
  updatedAt: string;
  author?: string;
  category?: 'default' | 'business' | 'analytics' | 'personal' | 'custom';
  isPublic?: boolean;
  shareCode?: string;
}

// 위젯별 구체적인 설정 타입들
export interface CalendarWidgetSettings extends WidgetSettings {
  customSettings?: {
    viewMode?: 'month' | 'week' | 'day' | 'list';
    showWeekNumbers?: boolean;
    firstDayOfWeek?: 0 | 1 | 6; // 0: Sunday, 1: Monday, 6: Saturday
    eventTypes?: string[];
    colorScheme?: Record<string, string>;
  };
}

export interface ChartWidgetSettings extends WidgetSettings {
  customSettings?: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    timeRange?: '7d' | '30d' | '90d' | '1y' | 'custom';
    dataSource?: string;
    showLegend?: boolean;
    showGrid?: boolean;
    animation?: boolean;
  };
}

export interface TaskWidgetSettings extends WidgetSettings {
  customSettings?: {
    viewMode?: 'list' | 'kanban' | 'calendar';
    sortBy?: 'priority' | 'dueDate' | 'created' | 'title';
    filterBy?: {
      status?: string[];
      priority?: string[];
      assignee?: string[];
    };
    showCompleted?: boolean;
    maxItems?: number;
  };
}

export interface NotificationWidgetSettings extends WidgetSettings {
  customSettings?: {
    notificationTypes?: string[];
    soundEnabled?: boolean;
    desktopNotifications?: boolean;
    groupBy?: 'type' | 'date' | 'priority';
    maxNotifications?: number;
    autoMarkAsRead?: number; // 초 단위
  };
}

export interface KPIWidgetSettings extends WidgetSettings {
  customSettings?: {
    kpiType?: string;
    targetValue?: number;
    comparisonPeriod?: 'previous' | 'yearAgo' | 'custom';
    displayFormat?: 'number' | 'percentage' | 'currency';
    showTrend?: boolean;
    showSparkline?: boolean;
    thresholds?: {
      warning?: number;
      danger?: number;
      success?: number;
    };
  };
}

// 설정 유효성 검증 인터페이스
export interface ConfigValidationResult {
  isValid: boolean;
  errors?: ConfigValidationError[];
  warnings?: ConfigValidationWarning[];
}

export interface ConfigValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ConfigValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// 설정 변경 이벤트
export interface ConfigChangeEvent {
  widgetId: string;
  changes: Partial<WidgetConfig>;
  previousConfig: WidgetConfig;
  timestamp: number;
  source: 'user' | 'system' | 'preset';
}

// 설정 내보내기/가져오기 옵션
export interface ExportOptions {
  includeLayout?: boolean;
  includeData?: boolean;
  includeCredentials?: boolean;
  format?: 'json' | 'yaml';
  compress?: boolean;
}

export interface ImportOptions {
  overwrite?: boolean;
  merge?: boolean;
  validateBeforeImport?: boolean;
  preserveIds?: boolean;
}

// 위젯 설정 스키마 정의 (런타임 유효성 검증용)
export const WidgetSettingsSchema = {
  common: {
    refreshInterval: { type: 'number', min: 1000, max: 3600000 },
    showHeader: { type: 'boolean' },
    showFooter: { type: 'boolean' },
    theme: { type: 'enum', values: ['default', 'compact', 'minimal'] }
  },
  
  calendar: {
    viewMode: { type: 'enum', values: ['month', 'week', 'day', 'list'] },
    showWeekNumbers: { type: 'boolean' },
    firstDayOfWeek: { type: 'enum', values: [0, 1, 6] }
  },
  
  chart: {
    chartType: { type: 'enum', values: ['line', 'bar', 'pie', 'area', 'scatter'] },
    timeRange: { type: 'enum', values: ['7d', '30d', '90d', '1y', 'custom'] },
    showLegend: { type: 'boolean' },
    showGrid: { type: 'boolean' },
    animation: { type: 'boolean' }
  },
  
  task: {
    viewMode: { type: 'enum', values: ['list', 'kanban', 'calendar'] },
    sortBy: { type: 'enum', values: ['priority', 'dueDate', 'created', 'title'] },
    showCompleted: { type: 'boolean' },
    maxItems: { type: 'number', min: 1, max: 100 }
  },
  
  notification: {
    soundEnabled: { type: 'boolean' },
    desktopNotifications: { type: 'boolean' },
    groupBy: { type: 'enum', values: ['type', 'date', 'priority'] },
    maxNotifications: { type: 'number', min: 1, max: 100 },
    autoMarkAsRead: { type: 'number', min: 0, max: 300 }
  },
  
  kpi: {
    displayFormat: { type: 'enum', values: ['number', 'percentage', 'currency'] },
    showTrend: { type: 'boolean' },
    showSparkline: { type: 'boolean' }
  }
} as const;

// 타입 가드 함수들
export function isCalendarWidgetSettings(settings: WidgetSettings): settings is CalendarWidgetSettings {
  return settings.customSettings?.hasOwnProperty('viewMode') || 
         settings.customSettings?.hasOwnProperty('showWeekNumbers');
}

export function isChartWidgetSettings(settings: WidgetSettings): settings is ChartWidgetSettings {
  return settings.customSettings?.hasOwnProperty('chartType') || 
         settings.customSettings?.hasOwnProperty('timeRange');
}

export function isTaskWidgetSettings(settings: WidgetSettings): settings is TaskWidgetSettings {
  return settings.customSettings?.hasOwnProperty('sortBy') || 
         settings.customSettings?.hasOwnProperty('filterBy');
}

export function isNotificationWidgetSettings(settings: WidgetSettings): settings is NotificationWidgetSettings {
  return settings.customSettings?.hasOwnProperty('notificationTypes') || 
         settings.customSettings?.hasOwnProperty('soundEnabled');
}

export function isKPIWidgetSettings(settings: WidgetSettings): settings is KPIWidgetSettings {
  return settings.customSettings?.hasOwnProperty('kpiType') || 
         settings.customSettings?.hasOwnProperty('targetValue');
}