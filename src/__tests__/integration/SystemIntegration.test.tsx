/**
 * P6-08: 전체 시스템 통합 테스트
 * 대시보드 위젯 시스템의 모든 구성 요소가 통합적으로 작동하는지 검증
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { DashboardContainer } from '@/components/dashboard/DashboardContainer'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { WidgetRegistry } from '@/lib/dashboard/WidgetRegistry'
import { templateService } from '@/lib/dashboard/templateService'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}))

// Mock initializeWidgets
jest.mock('@/lib/dashboard/initializeWidgets', () => ({
  initializeWidgetRegistry: jest.fn(),
}))

describe('P6-08: 전체 시스템 통합 테스트', () => {
  beforeEach(() => {
    // 스토어 초기화
    const store = useDashboardStore.getState()
    store.reset()
    
    // 위젯 레지스트리 초기화
    jest.clearAllMocks()
  })

  describe('Phase 1: 위젯 시스템 기본 인프라', () => {
    test('위젯 레지스트리가 올바르게 초기화되는지 확인', () => {
      const registry = WidgetRegistry
      expect(registry).toBeDefined()
      expect(typeof registry.register).toBe('function')
      expect(typeof registry.get).toBe('function')
    })

    test('기본 위젯 타입이 모두 등록되어 있는지 확인', () => {
      const widgetTypes = [
        'project-summary',
        'tax-deadline',
        'revenue-chart',
        'task-tracker',
        'kpi-metrics',
        'tax-calculator',
        'todo-list',
        'calendar',
        'recent-activity',
        'custom'
      ]

      widgetTypes.forEach(type => {
        const metadata = WidgetRegistry.getMetadata(type)
        expect(metadata).toBeDefined()
        expect(metadata?.type).toBe(type)
      })
    })
  })

  describe('Phase 2: 상태 관리 시스템', () => {
    test('Zustand 스토어가 정상적으로 동작하는지 확인', () => {
      const store = useDashboardStore.getState()
      
      // 레이아웃 생성
      const layout = store.createLayout('테스트 레이아웃', '3x3')
      expect(layout).toBeDefined()
      expect(layout.name).toBe('테스트 레이아웃')
      expect(layout.gridSize).toBe('3x3')
      
      // 위젯 추가
      store.addWidget({
        type: 'project-summary',
        position: { x: 0, y: 0, width: 2, height: 1 },
        config: {}
      })
      
      expect(store.currentLayout?.widgets).toHaveLength(1)
    })

    test('상태 영속성이 작동하는지 확인', () => {
      const store = useDashboardStore.getState()
      
      // 레이아웃 생성 및 저장
      store.createLayout('영속성 테스트', '4x4')
      store.addWidget({
        type: 'tax-calculator',
        position: { x: 0, y: 0, width: 1, height: 1 },
        config: {}
      })
      store.saveToLocalStorage()
      
      // 스토어 리셋
      store.reset()
      expect(store.currentLayout).toBeNull()
      
      // 로컬 스토리지에서 로드
      store.loadFromLocalStorage()
      expect(store.currentLayout?.name).toBe('영속성 테스트')
      expect(store.currentLayout?.widgets).toHaveLength(1)
    })
  })

  describe('Phase 3: 드래그 앤 드롭', () => {
    test('위젯 위치 업데이트가 정상적으로 작동하는지 확인', () => {
      const store = useDashboardStore.getState()
      store.createLayout('드래그 테스트', '3x3')
      
      // 위젯 추가
      store.addWidget({
        type: 'project-summary',
        position: { x: 0, y: 0, width: 1, height: 1 },
        config: {}
      })
      
      const widgetId = store.currentLayout?.widgets[0].id
      
      // 위치 업데이트
      if (widgetId) {
        store.updateWidgetPosition(widgetId, { x: 1, y: 1, width: 2, height: 2 })
        const updatedWidget = store.currentLayout?.widgets.find(w => w.id === widgetId)
        
        expect(updatedWidget?.position.x).toBe(1)
        expect(updatedWidget?.position.y).toBe(1)
        expect(updatedWidget?.position.width).toBe(2)
        expect(updatedWidget?.position.height).toBe(2)
      }
    })

    test('충돌 감지가 작동하는지 확인', () => {
      const store = useDashboardStore.getState()
      store.createLayout('충돌 테스트', '3x3')
      
      // 첫 번째 위젯
      store.addWidget({
        type: 'project-summary',
        position: { x: 0, y: 0, width: 2, height: 2 },
        config: {}
      })
      
      // 겹치는 위치에 두 번째 위젯 추가 시도
      store.addWidget({
        type: 'tax-calculator',
        position: { x: 1, y: 1, width: 2, height: 2 },
        config: {}
      })
      
      // 자동 리플로우로 충돌이 해결되어야 함
      const widgets = store.currentLayout?.widgets || []
      expect(widgets).toHaveLength(2)
      
      // 두 위젯이 겹치지 않아야 함
      if (widgets.length === 2) {
        const [widget1, widget2] = widgets
        const overlap = 
          widget1.position.x < widget2.position.x + widget2.position.width &&
          widget1.position.x + widget1.position.width > widget2.position.x &&
          widget1.position.y < widget2.position.y + widget2.position.height &&
          widget1.position.y + widget1.position.height > widget2.position.y
        
        expect(overlap).toBe(false)
      }
    })
  })

  describe('Phase 4: 위젯 라이브러리', () => {
    test('위젯 카테고리별 필터링이 작동하는지 확인', () => {
      const analyticsWidgets = WidgetRegistry.getByCategory('analytics')
      expect(analyticsWidgets.length).toBeGreaterThan(0)
      expect(analyticsWidgets.every(w => w.metadata.category === 'analytics')).toBe(true)
      
      const productivityWidgets = WidgetRegistry.getByCategory('productivity')
      expect(productivityWidgets.length).toBeGreaterThan(0)
      expect(productivityWidgets.every(w => w.metadata.category === 'productivity')).toBe(true)
    })

    test('위젯 검색이 작동하는지 확인', () => {
      const searchResults = WidgetRegistry.search('프로젝트')
      expect(searchResults.length).toBeGreaterThan(0)
      expect(searchResults.some(w => w.metadata.title.includes('프로젝트'))).toBe(true)
    })
  })

  describe('Phase 5: 템플릿 시스템', () => {
    test('템플릿 적용이 작동하는지 확인', async () => {
      const store = useDashboardStore.getState()
      store.createLayout('템플릿 테스트', '3x3')
      
      // 기본 템플릿 적용
      await act(async () => {
        await templateService.applyTemplate('minimal', {
          preserveExisting: false,
          merge: false,
          backup: false
        })
      })
      
      // 위젯이 추가되었는지 확인
      expect(store.currentLayout?.widgets.length).toBeGreaterThan(0)
    })

    test('템플릿 병합이 작동하는지 확인', async () => {
      const store = useDashboardStore.getState()
      store.createLayout('병합 테스트', '3x3')
      
      // 기존 위젯 추가
      store.addWidget({
        type: 'project-summary',
        position: { x: 0, y: 0, width: 1, height: 1 },
        config: {}
      })
      
      const initialCount = store.currentLayout?.widgets.length || 0
      
      // 템플릿 병합
      await act(async () => {
        await templateService.applyTemplate('productivity', {
          preserveExisting: true,
          merge: true,
          backup: false
        })
      })
      
      // 위젯이 추가되었는지 확인
      const finalCount = store.currentLayout?.widgets.length || 0
      expect(finalCount).toBeGreaterThan(initialCount)
    })
  })

  describe('Phase 6: 종합 테스트', () => {
    test('전체 워크플로우가 정상적으로 작동하는지 확인', async () => {
      const store = useDashboardStore.getState()
      
      // 1. 새 레이아웃 생성
      const layout = store.createLayout('종합 테스트', '4x4')
      expect(layout).toBeDefined()
      
      // 2. 템플릿 적용
      await act(async () => {
        await templateService.applyTemplate('business', {
          preserveExisting: false,
          merge: false,
          backup: false
        })
      })
      
      // 3. 편집 모드 활성화
      store.setEditMode(true)
      expect(store.isEditMode).toBe(true)
      
      // 4. 위젯 추가
      const widgetsBefore = store.currentLayout?.widgets.length || 0
      store.addWidget({
        type: 'custom',
        position: { x: 0, y: 0, width: 1, height: 1 },
        config: { title: '커스텀 위젯' }
      })
      expect(store.currentLayout?.widgets.length).toBe(widgetsBefore + 1)
      
      // 5. 위젯 설정 변경
      const customWidget = store.currentLayout?.widgets.find(w => w.type === 'custom')
      if (customWidget) {
        store.updateWidgetConfig(customWidget.id, { 
          title: '업데이트된 커스텀 위젯' 
        })
        const updated = store.currentLayout?.widgets.find(w => w.id === customWidget.id)
        expect(updated?.config.title).toBe('업데이트된 커스텀 위젯')
      }
      
      // 6. 그리드 크기 변경
      store.setGridSize('5x5')
      expect(store.currentLayout?.gridSize).toBe('5x5')
      
      // 7. 레이아웃 저장
      store.saveToLocalStorage()
      
      // 8. 편집 모드 종료
      store.setEditMode(false)
      expect(store.isEditMode).toBe(false)
      
      // 9. 영속성 확인
      store.reset()
      store.loadFromLocalStorage()
      expect(store.currentLayout?.name).toBe('종합 테스트')
      expect(store.currentLayout?.gridSize).toBe('5x5')
    })

    test('성능 최적화가 적용되었는지 확인', () => {
      const store = useDashboardStore.getState()
      store.createLayout('성능 테스트', '5x5')
      
      // 많은 위젯 추가
      const startTime = performance.now()
      for (let i = 0; i < 25; i++) {
        store.addWidget({
          type: 'custom',
          position: { x: i % 5, y: Math.floor(i / 5), width: 1, height: 1 },
          config: { title: `위젯 ${i + 1}` }
        })
      }
      const endTime = performance.now()
      
      // 25개 위젯 추가 시간이 1초 미만이어야 함
      expect(endTime - startTime).toBeLessThan(1000)
      expect(store.currentLayout?.widgets.length).toBe(25)
    })

    test('에러 핸들링이 작동하는지 확인', () => {
      const store = useDashboardStore.getState()
      
      // 잘못된 그리드 크기 설정 시도
      expect(() => {
        store.setGridSize('invalid' as any)
      }).not.toThrow()
      
      // 존재하지 않는 위젯 업데이트 시도
      expect(() => {
        store.updateWidgetConfig('non-existent-id', {})
      }).not.toThrow()
      
      // 범위를 벗어난 위치에 위젯 추가 시도
      store.createLayout('에러 테스트', '3x3')
      store.addWidget({
        type: 'project-summary',
        position: { x: 10, y: 10, width: 1, height: 1 },
        config: {}
      })
      
      // 자동으로 범위 내로 조정되어야 함
      const widget = store.currentLayout?.widgets[0]
      expect(widget?.position.x).toBeLessThan(3)
      expect(widget?.position.y).toBeLessThan(3)
    })
  })
})