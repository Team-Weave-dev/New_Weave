/**
 * 대시보드 통합 테스트
 * 여러 컴포넌트와 스토어의 상호작용을 테스트
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DashboardContainer } from '@/components/dashboard/DashboardContainer'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}))

// Mock the widget registry
jest.mock('@/lib/dashboard/initializeWidgets', () => ({
  initializeWidgetRegistry: jest.fn(),
}))

// Mock lazy loaded components
jest.mock('@/components/dashboard/widgets/ProjectSummaryWidget', () => ({
  ProjectSummaryWidget: () => <div>Project Summary Widget</div>,
}))

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useDashboardStore.getState()
    store.reset()
  })

  describe('Dashboard Container', () => {
    it('should render empty state when no layout exists', () => {
      render(<DashboardContainer />)
      
      expect(screen.getByText(/대시보드 레이아웃이 없습니다/)).toBeInTheDocument()
      expect(screen.getByText('대시보드 만들기')).toBeInTheDocument()
    })

    it('should create a new layout when button is clicked', async () => {
      render(<DashboardContainer />)
      
      const createButton = screen.getByText('대시보드 만들기')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        const store = useDashboardStore.getState()
        expect(store.currentLayout).not.toBeNull()
        expect(store.currentLayout?.name).toBe('새 대시보드')
      })
    })

    it('should toggle edit mode', async () => {
      // Create a layout first
      const store = useDashboardStore.getState()
      store.createLayout('Test Layout', '3x3')
      
      const { container } = render(<DashboardContainer showToolbar={true} />)
      
      // Find edit mode button
      const editButton = container.querySelector('button')
      if (editButton) {
        fireEvent.click(editButton)
        
        await waitFor(() => {
          expect(store.isEditMode).toBe(true)
        })
      }
    })
  })

  describe('Widget Management', () => {
    beforeEach(() => {
      // Setup a layout with widgets
      const store = useDashboardStore.getState()
      const layout = store.createLayout('Test Layout', '3x3')
      store.addWidget({
        type: 'project-summary',
        position: { x: 0, y: 0, width: 2, height: 1 },
        config: {},
      })
    })

    it('should render widgets in the layout', () => {
      render(<DashboardContainer />)
      
      // Widget should be rendered
      expect(screen.getByText('Project Summary Widget')).toBeInTheDocument()
    })

    it('should handle widget configuration', async () => {
      const store = useDashboardStore.getState()
      const widgetId = store.currentLayout?.widgets[0].id
      
      if (widgetId) {
        // Update widget config
        store.updateWidgetConfig(widgetId, { showChart: false })
        
        await waitFor(() => {
          const updatedWidget = store.currentLayout?.widgets.find(w => w.id === widgetId)
          expect(updatedWidget?.config.showChart).toBe(false)
        })
      }
    })

    it('should handle widget removal', async () => {
      const store = useDashboardStore.getState()
      const widgetId = store.currentLayout?.widgets[0].id
      
      if (widgetId) {
        const initialCount = store.currentLayout?.widgets.length || 0
        
        // Remove widget
        store.removeWidget(widgetId)
        
        await waitFor(() => {
          expect(store.currentLayout?.widgets.length).toBe(initialCount - 1)
        })
      }
    })
  })

  describe('Layout Persistence', () => {
    it('should save layout to localStorage', () => {
      const store = useDashboardStore.getState()
      store.createLayout('Persistent Layout', '4x4')
      store.addWidget({
        type: 'tax-calculator',
        position: { x: 0, y: 0, width: 1, height: 1 },
        config: {},
      })
      
      // Save to localStorage
      store.saveToLocalStorage()
      
      // Reset store
      store.reset()
      
      // Load from localStorage
      store.loadFromLocalStorage()
      
      expect(store.currentLayout?.name).toBe('Persistent Layout')
      expect(store.currentLayout?.gridSize).toBe('4x4')
      expect(store.currentLayout?.widgets).toHaveLength(1)
    })
  })

  describe('Grid Size Changes', () => {
    it('should change grid size', async () => {
      const store = useDashboardStore.getState()
      store.createLayout('Grid Test', '3x3')
      
      // Change grid size
      store.setGridSize('4x4')
      
      await waitFor(() => {
        expect(store.currentLayout?.gridSize).toBe('4x4')
      })
    })

    it('should constrain widget positions when grid size changes', async () => {
      const store = useDashboardStore.getState()
      store.createLayout('Constraint Test', '4x4')
      store.addWidget({
        type: 'project-summary',
        position: { x: 3, y: 3, width: 1, height: 1 },
        config: {},
      })
      
      // Change to smaller grid
      store.setGridSize('3x3')
      
      // Widget should be repositioned within bounds
      await waitFor(() => {
        const widget = store.currentLayout?.widgets[0]
        expect(widget?.position.x).toBeLessThanOrEqual(2)
        expect(widget?.position.y).toBeLessThanOrEqual(2)
      })
    })
  })
})