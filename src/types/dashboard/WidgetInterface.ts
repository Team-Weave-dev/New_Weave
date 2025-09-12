import { ReactElement } from 'react'

// 위젯 타입 정의
export type WidgetType = 
  | 'project-summary'
  | 'tax-deadline'
  | 'revenue-chart'
  | 'task-tracker'
  | 'kpi-metrics'
  | 'tax-calculator'
  | 'custom'

// 위젯 크기 정의
export interface WidgetSize {
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  defaultWidth: number
  defaultHeight: number
}

// 위젯 설정 스키마
export interface WidgetConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'select' | 'date' | 'color'
    label: string
    defaultValue: any
    options?: { value: string; label: string }[]
    min?: number
    max?: number
    required?: boolean
  }
}

// 위젯 메타데이터
export interface WidgetMetadata {
  id: string
  type: WidgetType
  name: string
  description: string
  category: 'project' | 'finance' | 'task' | 'analytics' | 'utility'
  icon?: string
  version: string
  author?: string
  size: WidgetSize
  configSchema?: WidgetConfigSchema
}

// 위젯 Props 인터페이스
export interface WidgetProps<T = any> {
  id: string
  config?: T
  isEditMode?: boolean
  onConfigChange?: (config: T) => void
  className?: string
}

// 위젯 컴포넌트 타입
export type WidgetComponent<T = any> = (props: WidgetProps<T>) => ReactElement

// 위젯 정의 인터페이스
export interface WidgetDefinition<T = any> {
  metadata: WidgetMetadata
  component: WidgetComponent<T>
  defaultConfig?: T
  validate?: (config: T) => boolean | string
}

// 위젯 인스턴스 인터페이스
export interface WidgetInstance {
  id: string
  type: WidgetType
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  config?: any
  locked?: boolean
}

// 위젯 상태 인터페이스
export interface WidgetState {
  loading?: boolean
  error?: string | null
  data?: any
  lastUpdated?: Date
}

// 위젯 이벤트 핸들러
export interface WidgetEventHandlers {
  onMount?: () => void
  onUnmount?: () => void
  onResize?: (size: { width: number; height: number }) => void
  onMove?: (position: { x: number; y: number }) => void
  onFocus?: () => void
  onBlur?: () => void
  onError?: (error: Error) => void
  onRefresh?: () => Promise<void>
}

// 위젯 컨텍스트
export interface WidgetContext {
  userId?: string
  theme?: 'light' | 'dark'
  locale?: string
  apiClient?: any
  permissions?: string[]
}

// 베이스 위젯 추상 클래스 타입
export abstract class BaseWidget<T = any> {
  abstract metadata: WidgetMetadata
  abstract defaultConfig: T
  
  abstract render(props: WidgetProps<T>): ReactElement
  
  validate?(config: T): boolean | string
  
  beforeMount?(context: WidgetContext): void | Promise<void>
  afterMount?(context: WidgetContext): void | Promise<void>
  beforeUnmount?(context: WidgetContext): void | Promise<void>
  
  onConfigChange?(newConfig: T, oldConfig: T): void
  onError?(error: Error): void
}

// 위젯 레지스트리 타입
export interface WidgetRegistry {
  [key: string]: WidgetDefinition
}

// 위젯 카테고리 정의
export const WIDGET_CATEGORIES = {
  project: {
    label: '프로젝트',
    icon: '📁',
    description: '프로젝트 관리 관련 위젯',
  },
  finance: {
    label: '재무',
    icon: '💰',
    description: '재무 및 회계 관련 위젯',
  },
  task: {
    label: '작업',
    icon: '✅',
    description: '작업 및 할 일 관리 위젯',
  },
  analytics: {
    label: '분석',
    icon: '📊',
    description: '데이터 분석 및 통계 위젯',
  },
  utility: {
    label: '유틸리티',
    icon: '🔧',
    description: '유용한 도구 위젯',
  },
} as const

// 위젯 크기 프리셋
export const WIDGET_SIZE_PRESETS = {
  small: {
    minWidth: 1,
    minHeight: 1,
    maxWidth: 2,
    maxHeight: 2,
    defaultWidth: 1,
    defaultHeight: 1,
  },
  medium: {
    minWidth: 2,
    minHeight: 2,
    maxWidth: 3,
    maxHeight: 3,
    defaultWidth: 2,
    defaultHeight: 2,
  },
  large: {
    minWidth: 3,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 4,
    defaultWidth: 3,
    defaultHeight: 3,
  },
  full: {
    minWidth: 4,
    minHeight: 4,
    maxWidth: 4,
    maxHeight: 4,
    defaultWidth: 4,
    defaultHeight: 4,
  },
} as const