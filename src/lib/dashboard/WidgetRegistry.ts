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
    return widget ? widget.metadata : null
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
  // 예시: 프로젝트 요약 위젯 (나중에 실제 컴포넌트로 교체)
  // WidgetRegistry.register(
  //   'project-summary',
  //   lazy(() => import('@/components/dashboard/widgets/ProjectSummaryWidget')),
  //   {
  //     name: '프로젝트 요약',
  //     description: '진행 중인 프로젝트 현황을 한눈에 확인',
  //     icon: 'folder',
  //     defaultSize: { width: 2, height: 2 },
  //     minSize: { width: 1, height: 1 },
  //     maxSize: { width: 4, height: 4 },
  //     tags: ['프로젝트', '요약', '현황']
  //   },
  //   'project',
  //   'high'
  // )
}