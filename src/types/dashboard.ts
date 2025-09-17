// Dashboard types - extracted from useDashboardStore for better organization
export type GridSize = '2x2' | '3x3' | '4x4' | '5x5'

export interface WidgetPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface Widget {
  id: string
  type: string
  position: WidgetPosition
  config?: Record<string, any>
  locked?: boolean
}

export interface DashboardLayout {
  id: string
  name: string
  gridSize: GridSize
  widgets: Widget[]
  createdAt: Date
  updatedAt: Date
}

export interface DashboardTemplate {
  id: string
  name: string
  description: string
  gridSize: GridSize
  widgets: Omit<Widget, 'id'>[]
  category: 'project' | 'tax' | 'custom'
}

// 위젯 타입 정의
export type WidgetType = 
  | 'project-summary'
  | 'tax-deadline'
  | 'revenue-chart'
  | 'task-tracker'
  | 'kpi-metrics'
  | 'tax-calculator'
  | 'todo-list'
  | 'calendar'
  | 'calendar-view'
  | 'event-list'
  | 'recent-activity'
  | 'time-tracker'
  | 'pomodoro'
  | 'quick-notes'
  | 'weather'
  | 'expense-tracker'
  | 'cash-flow'
  | 'client-overview'
  | 'invoice-status'
  | 'notification-center'
  | 'team-status'
  | 'quick-links'
  | 'announcements'
  | 'realtime-test'
  | 'custom'

// 위젯 카테고리
export type WidgetCategory = 'project' | 'tax' | 'analytics' | 'productivity' | 'custom'

// 위젯 메타데이터
export interface WidgetMetadata {
  type?: WidgetType  // 위젯 타입 (선택적, 테스트용)
  name: string
  description: string
  icon?: string
  category?: WidgetCategory  // 위젯 카테고리 (모바일 그룹화용)
  defaultSize: { width: number; height: number }
  minSize?: { width: number; height: number }
  maxSize?: { width: number; height: number }
  tags?: string[]
  configurable?: boolean
  version?: string
}

// 위젯 Props 인터페이스
export interface WidgetProps {
  id: string
  type: WidgetType
  config?: any
  isEditMode: boolean
  onConfigChange?: (config: any) => void
  onRemove?: () => void
  className?: string
}