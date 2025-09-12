import { lazy } from 'react'

// 모든 위젯을 lazy loading으로 임포트
export const ProjectSummaryWidget = lazy(() => 
  import('./ProjectSummaryWidget').then(module => ({
    default: module.ProjectSummaryWidget
  }))
)

export const TaxDeadlineWidget = lazy(() => 
  import('./TaxDeadlineWidget').then(module => ({
    default: module.TaxDeadlineWidget
  }))
)

export const RevenueChartWidget = lazy(() => 
  import('./RevenueChartWidget').then(module => ({
    default: module.RevenueChartWidget
  }))
)

export const TodoListWidget = lazy(() => 
  import('./TodoListWidget').then(module => ({
    default: module.TodoListWidget
  }))
)

export const TaskTrackerWidget = lazy(() => 
  import('./TaskTrackerWidget').then(module => ({
    default: module.TaskTrackerWidget
  }))
)

export const KPIWidget = lazy(() => 
  import('./KPIWidget').then(module => ({
    default: module.KPIWidget
  }))
)

export const TaxCalculatorWidget = lazy(() => 
  import('./TaxCalculatorWidget').then(module => ({
    default: module.TaxCalculatorWidget
  }))
)

export const CalendarWidget = lazy(() => 
  import('./CalendarWidget').then(module => ({
    default: module.CalendarWidget
  }))
)

export const RecentActivityWidget = lazy(() => 
  import('./RecentActivityWidget').then(module => ({
    default: module.RecentActivityWidget
  }))
)