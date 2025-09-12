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