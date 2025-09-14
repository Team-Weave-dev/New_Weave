/**
 * useDashboardStore 단위 테스트
 */

import { act, renderHook } from '@testing-library/react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import type { Widget, DashboardLayout } from '@/types/dashboard'

describe('useDashboardStore', () => {
  beforeEach(() => {
    // 각 테스트 전에 스토어 초기화
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.reset()
    })
  })

  describe('Layout Management', () => {
    it('should create a new layout', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        const layout = result.current.createLayout('Test Layout', '3x3')
        expect(layout.name).toBe('Test Layout')
        expect(layout.gridSize).toBe('3x3')
        expect(layout.widgets).toEqual([])
      })
      
      expect(result.current.currentLayout?.name).toBe('Test Layout')
      expect(result.current.layouts).toHaveLength(1)
    })

    it('should update an existing layout', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        const layout = result.current.createLayout('Test Layout', '3x3')
        result.current.updateLayout(layout.id, { name: 'Updated Layout' })
      })
      
      expect(result.current.currentLayout?.name).toBe('Updated Layout')
    })

    it('should delete a layout', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        const layout1 = result.current.createLayout('Layout 1', '3x3')
        const layout2 = result.current.createLayout('Layout 2', '4x4')
        result.current.deleteLayout(layout1.id)
      })
      
      expect(result.current.layouts).toHaveLength(1)
      expect(result.current.currentLayout?.name).toBe('Layout 2')
    })
  })

  describe('Widget Management', () => {
    it('should add a widget to the current layout', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.createLayout('Test Layout', '3x3')
        result.current.addWidget({
          type: 'project-summary',
          position: { x: 0, y: 0, width: 2, height: 1 },
          config: {},
        })
      })
      
      expect(result.current.currentLayout?.widgets).toHaveLength(1)
      expect(result.current.currentLayout?.widgets[0].type).toBe('project-summary')
    })

    it('should update a widget', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.createLayout('Test Layout', '3x3')
        result.current.addWidget({
          type: 'project-summary',
          position: { x: 0, y: 0, width: 2, height: 1 },
          config: {},
        })
        
        const widgetId = result.current.currentLayout?.widgets[0].id
        if (widgetId) {
          result.current.updateWidget(widgetId, { 
            position: { x: 1, y: 1, width: 2, height: 1 } 
          })
        }
      })
      
      expect(result.current.currentLayout?.widgets[0].position.x).toBe(1)
      expect(result.current.currentLayout?.widgets[0].position.y).toBe(1)
    })

    it('should remove a widget', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.createLayout('Test Layout', '3x3')
        result.current.addWidget({
          type: 'project-summary',
          position: { x: 0, y: 0, width: 2, height: 1 },
          config: {},
        })
        
        const widgetId = result.current.currentLayout?.widgets[0].id
        if (widgetId) {
          result.current.removeWidget(widgetId)
        }
      })
      
      expect(result.current.currentLayout?.widgets).toHaveLength(0)
    })

    it('should lock and unlock a widget', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.createLayout('Test Layout', '3x3')
        result.current.addWidget({
          type: 'project-summary',
          position: { x: 0, y: 0, width: 2, height: 1 },
          config: {},
        })
        
        const widgetId = result.current.currentLayout?.widgets[0].id
        if (widgetId) {
          result.current.lockWidget(widgetId, true)
        }
      })
      
      expect(result.current.currentLayout?.widgets[0].locked).toBe(true)
      
      act(() => {
        const widgetId = result.current.currentLayout?.widgets[0].id
        if (widgetId) {
          result.current.lockWidget(widgetId, false)
        }
      })
      
      expect(result.current.currentLayout?.widgets[0].locked).toBe(false)
    })

    it('should resize a widget with constraints', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.createLayout('Test Layout', '3x3')
        result.current.addWidget({
          type: 'project-summary',
          position: { x: 0, y: 0, width: 1, height: 1 },
          config: {},
        })
        
        const widgetId = result.current.currentLayout?.widgets[0].id
        if (widgetId) {
          // 3x3 그리드를 넘어서는 크기로 리사이즈 시도
          result.current.resizeWidget(widgetId, { width: 5, height: 5 })
        }
      })
      
      // 그리드 크기 제약에 의해 최대 3x3으로 제한되어야 함
      expect(result.current.currentLayout?.widgets[0].position.width).toBeLessThanOrEqual(3)
      expect(result.current.currentLayout?.widgets[0].position.height).toBeLessThanOrEqual(3)
    })
  })

  describe('Edit Mode', () => {
    it('should toggle edit mode', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      expect(result.current.isEditMode).toBe(false)
      
      act(() => {
        result.current.setEditMode(true)
      })
      
      expect(result.current.isEditMode).toBe(true)
      
      act(() => {
        result.current.setEditMode(false)
      })
      
      expect(result.current.isEditMode).toBe(false)
    })
  })

  describe('Grid Size', () => {
    it('should change grid size', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.createLayout('Test Layout', '3x3')
        result.current.setGridSize('4x4')
      })
      
      expect(result.current.currentLayout?.gridSize).toBe('4x4')
    })
  })

  describe('Widget Swapping', () => {
    it('should swap two widgets positions', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.createLayout('Test Layout', '3x3')
        result.current.addWidget({
          type: 'project-summary',
          position: { x: 0, y: 0, width: 1, height: 1 },
          config: {},
        })
        result.current.addWidget({
          type: 'tax-deadline',
          position: { x: 1, y: 0, width: 1, height: 1 },
          config: {},
        })
      })
      
      const widget1Id = result.current.currentLayout?.widgets[0].id
      const widget2Id = result.current.currentLayout?.widgets[1].id
      
      act(() => {
        if (widget1Id && widget2Id) {
          result.current.swapWidgets(widget1Id, widget2Id)
        }
      })
      
      expect(result.current.currentLayout?.widgets[0].position.x).toBe(1)
      expect(result.current.currentLayout?.widgets[1].position.x).toBe(0)
    })
  })

  describe('Persistence', () => {
    it('should save to and load from localStorage', () => {
      const { result } = renderHook(() => useDashboardStore())
      
      act(() => {
        result.current.createLayout('Test Layout', '3x3')
        result.current.addWidget({
          type: 'project-summary',
          position: { x: 0, y: 0, width: 2, height: 1 },
          config: { test: true },
        })
        result.current.saveToLocalStorage()
      })
      
      // 새로운 훅 인스턴스 생성
      const { result: newResult } = renderHook(() => useDashboardStore())
      
      act(() => {
        newResult.current.loadFromLocalStorage()
      })
      
      expect(newResult.current.currentLayout?.name).toBe('Test Layout')
      expect(newResult.current.currentLayout?.widgets).toHaveLength(1)
      expect(newResult.current.currentLayout?.widgets[0].type).toBe('project-summary')
    })
  })
})