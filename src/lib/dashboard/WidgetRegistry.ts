import React, { lazy, ComponentType } from 'react'
import type { WidgetType, WidgetMetadata, WidgetCategory, WidgetProps } from '@/types/dashboard'

// 위젯 컴포넌트 타입
type WidgetComponent = ComponentType<WidgetProps>
type LazyWidgetComponent = React.LazyExoticComponent<WidgetComponent>

// 위젯 등록 정보
interface WidgetRegistration {
  component: WidgetComponent | LazyWidgetComponent
  metadata: WidgetMetadata
  category: WidgetCategory
  loadPriority?: 'high' | 'medium' | 'low'
}

// 위젯 레지스트리 클래스
class WidgetRegistryClass {
  private widgets: Map<WidgetType, WidgetRegistration> = new Map()
  private categories: Map<WidgetCategory, Set<WidgetType>> = new Map()

  constructor() {
    // 카테고리 초기화
    const categories: WidgetCategory[] = ['project', 'tax', 'analytics', 'productivity', 'custom']
    categories.forEach(category => {
      this.categories.set(category, new Set())
    })
  }

  // 위젯 등록
  register(
    type: WidgetType,
    component: WidgetComponent | LazyWidgetComponent,
    metadata: WidgetMetadata,
    category: WidgetCategory = 'custom',
    loadPriority: 'high' | 'medium' | 'low' = 'medium'
  ): void {
    if (this.widgets.has(type)) {
      console.warn(`Widget type "${type}" is already registered. Overwriting...`)
    }

    // 위젯 등록
    this.widgets.set(type, {
      component,
      metadata,
      category,
      loadPriority
    })

    // 카테고리에 추가
    const categorySet = this.categories.get(category)
    if (categorySet) {
      categorySet.add(type)
    } else {
      this.categories.set(category, new Set([type]))
    }

    console.log(`Widget "${type}" registered in category "${category}"`)
  }

  // 위젯 등록 해제
  unregister(type: WidgetType): boolean {
    const widget = this.widgets.get(type)
    if (!widget) {
      console.warn(`Widget type "${type}" not found`)
      return false
    }

    // 카테고리에서 제거
    const categorySet = this.categories.get(widget.category)
    if (categorySet) {
      categorySet.delete(type)
    }

    // 위젯 맵에서 제거
    this.widgets.delete(type)
    console.log(`Widget "${type}" unregistered`)
    return true
  }

  // 위젯 컴포넌트 가져오기
  getComponent(type: WidgetType): WidgetComponent | LazyWidgetComponent | null {
    const widget = this.widgets.get(type)
    return widget ? widget.component : null
  }

  // 위젯 가져오기 (get 메서드 - getComponent의 별칭)
  get(type: WidgetType): WidgetComponent | LazyWidgetComponent | null {
    return this.getComponent(type)
  }

  // 위젯 메타데이터 가져오기
  getMetadata(type: WidgetType): WidgetMetadata | null {
    const widget = this.widgets.get(type)
    if (!widget) return null
    
    // category를 metadata에 포함시켜 반환
    return {
      ...widget.metadata,
      category: widget.category
    }
  }

  // 위젯 전체 정보 가져오기
  getWidget(type: WidgetType): WidgetRegistration | null {
    return this.widgets.get(type) || null
  }

  // 모든 위젯 목록 가져오기
  getAllWidgets(): WidgetRegistration[] {
    return Array.from(this.widgets.values())
  }

  // 카테고리별 위젯 가져오기
  getWidgetsByCategory(category: WidgetCategory): WidgetRegistration[] {
    const types = this.categories.get(category)
    if (!types) return []

    const widgets: WidgetRegistration[] = []
    types.forEach(type => {
      const widget = this.widgets.get(type)
      if (widget) {
        widgets.push(widget)
      }
    })

    return widgets
  }

  // 카테고리별 위젯 가져오기 (getByCategory 별칭)
  getByCategory(category: WidgetCategory): WidgetRegistration[] {
    return this.getWidgetsByCategory(category)
  }

  // 모든 카테고리 가져오기
  getCategories(): WidgetCategory[] {
    return Array.from(this.categories.keys())
  }

  // 카테고리별 위젯 개수
  getCategoryCount(category: WidgetCategory): number {
    const types = this.categories.get(category)
    return types ? types.size : 0
  }

  // 위젯 존재 확인
  hasWidget(type: WidgetType): boolean {
    return this.widgets.has(type)
  }

  // 위젯 검색 (메타데이터 기반)
  searchWidgets(query: string): WidgetRegistration[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.widgets.values()).filter(widget => {
      const metadata = widget.metadata
      return (
        metadata.name.toLowerCase().includes(lowerQuery) ||
        metadata.description.toLowerCase().includes(lowerQuery) ||
        metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    })
  }

  // 위젯 검색 (search 별칭)
  search(query: string): WidgetRegistration[] {
    return this.searchWidgets(query)
  }

  // 우선순위별 위젯 가져오기
  getWidgetsByPriority(priority: 'high' | 'medium' | 'low'): WidgetRegistration[] {
    return Array.from(this.widgets.values()).filter(
      widget => widget.loadPriority === priority
    )
  }

  // 레지스트리 초기화
  clear(): void {
    this.widgets.clear()
    this.categories.forEach(category => category.clear())
    console.log('Widget registry cleared')
  }

  // 레지스트리 상태 출력 (디버깅용)
  debug(): void {
    console.group('Widget Registry Status')
    console.log(`Total widgets: ${this.widgets.size}`)
    
    this.categories.forEach((types, category) => {
      console.log(`Category "${category}": ${types.size} widgets`)
      types.forEach(type => {
        const widget = this.widgets.get(type)
        if (widget) {
          console.log(`  - ${type}: ${widget.metadata.name}`)
        }
      })
    })
    
    console.groupEnd()
  }

  // 일괄 등록
  registerBatch(registrations: Array<{
    type: WidgetType
    component: WidgetComponent | LazyWidgetComponent
    metadata: WidgetMetadata
    category?: WidgetCategory
    loadPriority?: 'high' | 'medium' | 'low'
  }>): void {
    registrations.forEach(({ type, component, metadata, category, loadPriority }) => {
      this.register(type, component, metadata, category, loadPriority)
    })
  }

  // 위젯 통계
  getStatistics() {
    const stats = {
      total: this.widgets.size,
      byCategory: {} as Record<WidgetCategory, number>,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      }
    }

    this.categories.forEach((types, category) => {
      stats.byCategory[category] = types.size
    })

    this.widgets.forEach(widget => {
      if (widget.loadPriority) {
        stats.byPriority[widget.loadPriority]++
      }
    })

    return stats
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const WidgetRegistry = new WidgetRegistryClass()

// 위젯 자동 등록을 위한 데코레이터 (선택적)
export function registerWidget(
  type: WidgetType,
  metadata: WidgetMetadata,
  category: WidgetCategory = 'custom',
  loadPriority?: 'high' | 'medium' | 'low'
) {
  return function (target: any) {
    WidgetRegistry.register(type, target, metadata, category, loadPriority)
    return target
  }
}

// 기본 위젯 등록 함수 (나중에 실제 위젯 컴포넌트가 만들어지면 사용)
export function registerDefaultWidgets() {
  // 프로젝트 관리 위젯들
  WidgetRegistry.register(
    'project-summary',
    lazy(() => import('@/components/dashboard/widgets/ProjectSummaryWidget').then(m => ({ default: m.ProjectSummaryWidget }))),
    {
      name: '프로젝트 요약',
      description: '진행 중인 프로젝트 현황을 한눈에 확인',
      icon: 'folder',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 4, height: 3 },
      tags: ['프로젝트', '요약', '현황'],
      category: 'project'
    },
    'project',
    'high'
  )
  
  WidgetRegistry.register(
    'task-tracker',
    lazy(() => import('@/components/dashboard/widgets/TaskTrackerWidget').then(m => ({ default: m.TaskTrackerWidget }))),
    {
      name: '작업 추적기',
      description: '할 일을 추가하고 진행 상황을 관리하세요',
      icon: 'check-square',
      defaultSize: { width: 2, height: 3 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 3, height: 4 },
      tags: ['작업', '할일', '태스크'],
      category: 'project'
    },
    'project',
    'high'
  )
  
  WidgetRegistry.register(
    'todo-list',
    lazy(() => import('@/components/dashboard/widgets/TodoListWidget')),
    {
      name: '할 일 목록',
      description: '간단한 할 일 목록 관리',
      icon: 'list-todo',
      defaultSize: { width: 1, height: 2 },
      minSize: { width: 1, height: 2 },
      maxSize: { width: 2, height: 4 },
      tags: ['할일', '메모', '체크리스트'],
      category: 'productivity'
    },
    'productivity',
    'medium'
  )
  
  // 분석 위젯들
  WidgetRegistry.register(
    'kpi-metrics',
    lazy(() => import('@/components/dashboard/widgets/KPIWidget').then(m => ({ default: m.KPIWidget }))),
    {
      name: 'KPI',
      description: '핵심 성과 지표를 한눈에 확인',
      icon: 'trending-up',
      defaultSize: { width: 3, height: 1 },
      minSize: { width: 2, height: 1 },
      maxSize: { width: 4, height: 1 },
      tags: ['KPI', '지표', '성과'],
      category: 'analytics'
    },
    'analytics',
    'high'
  )
  
  WidgetRegistry.register(
    'revenue-chart',
    lazy(() => import('@/components/dashboard/widgets/RevenueChartWidget').then(m => ({ default: m.RevenueChartWidget }))),
    {
      name: '수익 차트',
      description: '월별 수익 추이를 차트로 확인',
      icon: 'bar-chart',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 4, height: 3 },
      tags: ['수익', '차트', '매출'],
      category: 'analytics'
    },
    'analytics',
    'high'
  )
  
  // 캘린더 위젯들
  WidgetRegistry.register(
    'calendar-view',
    lazy(() => import('@/components/dashboard/widgets/CalendarViewWidget')),
    {
      name: '캘린더',
      description: '일정을 캘린더 뷰로 관리하세요',
      icon: 'calendar',
      defaultSize: { width: 3, height: 3 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 4, height: 4 },
      tags: ['캘린더', '일정', '스케줄'],
      category: 'productivity'
    },
    'productivity',
    'high'
  )
  
  WidgetRegistry.register(
    'event-list',
    lazy(() => import('@/components/dashboard/widgets/EventListWidget')),
    {
      name: '이벤트 목록',
      description: '예정된 이벤트를 목록으로 확인',
      icon: 'calendar-days',
      defaultSize: { width: 2, height: 3 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 3, height: 4 },
      tags: ['이벤트', '일정', '목록'],
      category: 'productivity'
    },
    'productivity',
    'medium'
  )
  
  // 생산성 위젯들
  WidgetRegistry.register(
    'time-tracker',
    lazy(() => import('@/components/dashboard/widgets/TimeTrackerWidget').then(m => ({ default: m.TimeTrackerWidget }))),
    {
      name: '시간 추적기',
      description: '프로젝트별 작업 시간을 추적하고 관리하세요',
      icon: 'clock',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 3, height: 3 },
      tags: ['시간', '추적', '타이머'],
      category: 'productivity'
    },
    'productivity',
    'medium'
  )
  
  WidgetRegistry.register(
    'pomodoro',
    lazy(() => import('@/components/dashboard/widgets/PomodoroWidget').then(m => ({ default: m.PomodoroWidget }))),
    {
      name: '뽀모도로 타이머',
      description: '25분 집중 타이머로 생산성을 높이세요',
      icon: 'timer',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 2, height: 2 },
      tags: ['뽀모도로', '타이머', '집중'],
      category: 'productivity'
    },
    'productivity',
    'low'
  )
  
  WidgetRegistry.register(
    'quick-notes',
    lazy(() => import('@/components/dashboard/widgets/QuickNotesWidget').then(m => ({ default: m.QuickNotesWidget }))),
    {
      name: '빠른 메모',
      description: '아이디어와 메모를 빠르게 기록하세요',
      icon: 'sticky-note',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 1, height: 2 },
      maxSize: { width: 3, height: 4 },
      tags: ['메모', '노트', '기록'],
      category: 'productivity'
    },
    'productivity',
    'low'
  )
  
  WidgetRegistry.register(
    'weather',
    lazy(() => import('@/components/dashboard/widgets/WeatherWidget').then(m => ({ default: m.WeatherWidget }))),
    {
      name: '날씨',
      description: '현재 날씨와 예보를 확인하세요',
      icon: 'cloud',
      defaultSize: { width: 2, height: 1 },
      minSize: { width: 2, height: 1 },
      maxSize: { width: 3, height: 2 },
      tags: ['날씨', '기온', '예보'],
      category: 'custom'
    },
    'custom',
    'low'
  )
  
  // 재무 위젯들  
  WidgetRegistry.register(
    'expense-tracker',
    lazy(() => import('@/components/dashboard/widgets/ExpenseTrackerWidget').then(m => ({ default: m.ExpenseTrackerWidget }))),
    {
      name: '지출 추적기',
      description: '카테고리별 지출을 추적하고 예산을 관리하세요',
      icon: 'wallet',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 3, height: 3 },
      tags: ['지출', '예산', '재무'],
      category: 'analytics'
    },
    'analytics',
    'medium'
  )
  
  WidgetRegistry.register(
    'cash-flow',
    lazy(() => import('@/components/dashboard/widgets/analytics/CashFlowWidget').then(m => ({ default: m.CashFlowWidget }))),
    {
      name: '현금 흐름',
      description: '수입과 지출의 흐름을 시각화하여 확인하세요',
      icon: 'trending-up',
      defaultSize: { width: 3, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 4, height: 3 },
      tags: ['현금', '수입', '지출'],
      category: 'analytics'
    },
    'analytics',
    'medium'
  )
  
  WidgetRegistry.register(
    'client-overview',
    lazy(() => import('@/components/dashboard/widgets/ClientOverviewWidget')),
    {
      name: '고객 현황',
      description: '고객별 프로젝트 및 매출 현황을 확인하세요',
      icon: 'users',
      defaultSize: { width: 3, height: 3 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 4, height: 4 },
      tags: ['고객', '클라이언트', '매출'],
      category: 'analytics'
    },
    'analytics',
    'medium'
  )
  
  WidgetRegistry.register(
    'invoice-status',
    lazy(() => import('@/components/dashboard/widgets/InvoiceStatusWidget').then(m => ({ default: m.InvoiceStatusWidget }))),
    {
      name: '청구서 상태',
      description: '청구서 및 미수금 상태를 관리하세요',
      icon: 'file-text',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 3, height: 3 },
      tags: ['청구서', '미수금', '인보이스'],
      category: 'analytics'
    },
    'analytics',
    'low'
  )
  
  // 커뮤니케이션 위젯들
  WidgetRegistry.register(
    'notification-center',
    lazy(() => import('@/components/dashboard/widgets/NotificationCenterWidget')),
    {
      name: '알림 센터',
      description: '모든 알림을 한 곳에서 관리하세요',
      icon: 'bell',
      defaultSize: { width: 2, height: 3 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 3, height: 4 },
      tags: ['알림', '공지', '메시지'],
      category: 'custom'
    },
    'custom',
    'high'
  )
  
  WidgetRegistry.register(
    'team-status',
    lazy(() => import('@/components/dashboard/widgets/TeamStatusWidget')),
    {
      name: '팀 현황',
      description: '팀원들의 상태와 활동을 확인하세요',
      icon: 'users',
      defaultSize: { width: 3, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 4, height: 3 },
      tags: ['팀', '협업', '상태'],
      category: 'custom'
    },
    'custom',
    'medium'
  )
  
  WidgetRegistry.register(
    'quick-links',
    lazy(() => import('@/components/dashboard/widgets/QuickLinksWidget').then(m => ({ default: m.QuickLinksWidget }))),
    {
      name: '바로가기',
      description: '자주 사용하는 링크를 빠르게 접근하세요',
      icon: 'link',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 3, height: 3 },
      tags: ['링크', '바로가기', '북마크'],
      category: 'custom'
    },
    'custom',
    'low'
  )
  
  WidgetRegistry.register(
    'announcements',
    lazy(() => import('@/components/dashboard/widgets/AnnouncementsWidget')),
    {
      name: '공지사항',
      description: '중요한 공지사항을 확인하고 관리하세요',
      icon: 'megaphone',
      defaultSize: { width: 2, height: 3 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 3, height: 4 },
      tags: ['공지', '안내', '알림'],
      category: 'custom'
    },
    'custom',
    'medium'
  )
  
  // 실시간 테스트 위젯
  WidgetRegistry.register(
    'realtime-test',
    lazy(() => import('@/components/dashboard/widgets/RealtimeTestWidget').then(m => ({ default: m.RealtimeTestWidget }))),
    {
      name: '실시간 테스트',
      description: '실시간 업데이트 기능 테스트',
      icon: 'zap',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 3, height: 3 },
      tags: ['테스트', '실시간', '개발'],
      category: 'custom'
    },
    'custom',
    'low'
  )
}