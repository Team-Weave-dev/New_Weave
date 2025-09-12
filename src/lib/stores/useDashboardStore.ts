import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GridSize, WidgetPosition, Widget, DashboardLayout } from '@/types/dashboard'

// Re-export types for backward compatibility
export type { GridSize, WidgetPosition, Widget, DashboardLayout }

interface DashboardStore {
  // State
  currentLayout: DashboardLayout | null
  layouts: DashboardLayout[]
  isEditMode: boolean
  selectedWidgetId: string | null
  
  // Layout Actions
  setCurrentLayout: (layout: DashboardLayout) => void
  createLayout: (name: string, gridSize?: GridSize) => DashboardLayout
  updateLayout: (layoutId: string, updates: Partial<DashboardLayout>) => void
  deleteLayout: (layoutId: string) => void
  
  // Widget Actions
  addWidget: (widget: Omit<Widget, 'id'>) => void
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void
  updateWidgetConfig: (widgetId: string, config: Record<string, any>) => void
  removeWidget: (widgetId: string) => void
  moveWidget: (widgetId: string, newPosition: WidgetPosition) => void
  lockWidget: (widgetId: string, locked: boolean) => void
  reflowWidgets: () => void
  swapWidgets: (widgetId1: string, widgetId2: string) => void
  
  // Edit Mode Actions
  setEditMode: (editMode: boolean) => void
  selectWidget: (widgetId: string | null) => void
  
  // Grid Actions
  setGridSize: (gridSize: GridSize) => void
  
  // Utility Actions
  reset: () => void
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => void
}

const initialLayout: DashboardLayout = {
  id: 'default',
  name: 'Default Dashboard',
  gridSize: '3x3',
  widgets: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentLayout: null,
      layouts: [],
      isEditMode: false,
      selectedWidgetId: null,
      
      // Layout Actions
      setCurrentLayout: (layout) => {
        set({ currentLayout: layout })
      },
      
      createLayout: (name, gridSize: GridSize = '3x3') => {
        const newLayout: DashboardLayout = {
          id: `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          gridSize,
          widgets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        set((state) => ({
          layouts: [...state.layouts, newLayout],
          currentLayout: newLayout,
        }))
        
        return newLayout
      },
      
      updateLayout: (layoutId, updates) => {
        set((state) => ({
          layouts: state.layouts.map((layout) =>
            layout.id === layoutId
              ? { ...layout, ...updates, updatedAt: new Date() }
              : layout
          ),
          currentLayout:
            state.currentLayout?.id === layoutId
              ? { ...state.currentLayout, ...updates, updatedAt: new Date() }
              : state.currentLayout,
        }))
      },
      
      deleteLayout: (layoutId) => {
        set((state) => {
          const newLayouts = state.layouts.filter((l) => l.id !== layoutId)
          const isCurrentLayout = state.currentLayout?.id === layoutId
          
          return {
            layouts: newLayouts,
            currentLayout: isCurrentLayout
              ? newLayouts.length > 0
                ? newLayouts[0]
                : null
              : state.currentLayout,
          }
        })
      },
      
      // Widget Actions
      addWidget: (widgetData) => {
        const widget: Widget = {
          ...widgetData,
          id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }
        
        set((state) => {
          if (!state.currentLayout) return state
          
          // 중복 ID 체크
          const existingWidget = state.currentLayout.widgets.find(w => w.id === widget.id)
          if (existingWidget) {
            console.warn('Widget with same ID already exists, skipping:', widget.id)
            return state
          }
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: [...state.currentLayout.widgets, widget],
              updatedAt: new Date(),
            },
          }
        })
      },
      
      updateWidget: (widgetId, updates) => {
        set((state) => {
          if (!state.currentLayout) return state
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: state.currentLayout.widgets.map((widget) =>
                widget.id === widgetId
                  ? { ...widget, ...updates }
                  : widget
              ),
              updatedAt: new Date(),
            },
          }
        })
      },
      
      updateWidgetConfig: (widgetId, config) => {
        set((state) => {
          if (!state.currentLayout) return state
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: state.currentLayout.widgets.map((widget) =>
                widget.id === widgetId
                  ? { ...widget, config }
                  : widget
              ),
              updatedAt: new Date(),
            },
          }
        })
      },
      
      removeWidget: (widgetId) => {
        set((state) => {
          if (!state.currentLayout) return state
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: state.currentLayout.widgets.filter(
                (widget) => widget.id !== widgetId
              ),
              updatedAt: new Date(),
            },
            selectedWidgetId:
              state.selectedWidgetId === widgetId
                ? null
                : state.selectedWidgetId,
          }
        })
      },
      
      moveWidget: (widgetId, newPosition) => {
        set((state) => {
          if (!state.currentLayout) return state
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: state.currentLayout.widgets.map((widget) =>
                widget.id === widgetId
                  ? { ...widget, position: newPosition }
                  : widget
              ),
              updatedAt: new Date(),
            },
          }
        })
      },
      
      lockWidget: (widgetId, locked) => {
        set((state) => {
          if (!state.currentLayout) return state
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: state.currentLayout.widgets.map((widget) =>
                widget.id === widgetId
                  ? { ...widget, locked }
                  : widget
              ),
              updatedAt: new Date(),
            },
          }
        })
      },
      
      reflowWidgets: () => {
        set((state) => {
          if (!state.currentLayout) return state
          
          const { widgets, gridSize } = state.currentLayout
          const columns = gridSize === '2x2' ? 2 :
                         gridSize === '3x3' ? 3 :
                         gridSize === '4x4' ? 4 : 5
          
          // 위젯을 y, x 순으로 정렬
          const sortedWidgets = [...widgets].sort((a, b) => {
            if (a.position.y !== b.position.y) {
              return a.position.y - b.position.y
            }
            return a.position.x - b.position.x
          })
          
          // 그리드를 빈 공간으로 초기화
          const grid: boolean[][] = Array(columns).fill(null).map(() => Array(columns).fill(false))
          
          // 재배치된 위젯 배열
          const reflowedWidgets = sortedWidgets.map(widget => {
            // 현재 위치가 유효한지 확인
            let { x, y, width, height } = widget.position
            let placed = false
            
            // 그리드 전체를 스캔하여 빈 공간 찾기
            for (let row = 0; row <= columns - height && !placed; row++) {
              for (let col = 0; col <= columns - width && !placed; col++) {
                // 해당 위치에 배치 가능한지 확인
                let canPlace = true
                for (let h = 0; h < height && canPlace; h++) {
                  for (let w = 0; w < width && canPlace; w++) {
                    if (grid[row + h]?.[col + w]) {
                      canPlace = false
                    }
                  }
                }
                
                if (canPlace) {
                  // 위치 업데이트
                  x = col
                  y = row
                  
                  // 그리드에 표시
                  for (let h = 0; h < height; h++) {
                    for (let w = 0; w < width; w++) {
                      if (grid[row + h] && grid[row + h][col + w] !== undefined) {
                        grid[row + h][col + w] = true
                      }
                    }
                  }
                  placed = true
                }
              }
            }
            
            return {
              ...widget,
              position: { x, y, width, height }
            }
          })
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: reflowedWidgets,
              updatedAt: new Date(),
            },
          }
        })
      },
      
      swapWidgets: (widgetId1, widgetId2) => {
        set((state) => {
          if (!state.currentLayout) return state
          
          const widget1 = state.currentLayout.widgets.find(w => w.id === widgetId1)
          const widget2 = state.currentLayout.widgets.find(w => w.id === widgetId2)
          
          if (!widget1 || !widget2) return state
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: state.currentLayout.widgets.map((widget) => {
                if (widget.id === widgetId1) {
                  return { ...widget, position: widget2.position }
                }
                if (widget.id === widgetId2) {
                  return { ...widget, position: widget1.position }
                }
                return widget
              }),
              updatedAt: new Date(),
            },
          }
        })
      },
      
      // Edit Mode Actions
      setEditMode: (editMode) => {
        set({ isEditMode: editMode, selectedWidgetId: null })
      },
      
      selectWidget: (widgetId) => {
        set({ selectedWidgetId: widgetId })
      },
      
      // Grid Actions
      setGridSize: (gridSize) => {
        set((state) => {
          if (!state.currentLayout) return state
          
          return {
            currentLayout: {
              ...state.currentLayout,
              gridSize,
              updatedAt: new Date(),
            },
          }
        })
      },
      
      // Utility Actions
      reset: () => {
        set({
          currentLayout: null,
          layouts: [],
          isEditMode: false,
          selectedWidgetId: null,
        })
      },
      
      saveToLocalStorage: () => {
        const state = get()
        if (state.currentLayout) {
          localStorage.setItem(
            'dashboard-layout',
            JSON.stringify(state.currentLayout)
          )
        }
      },
      
      loadFromLocalStorage: () => {
        const saved = localStorage.getItem('dashboard-layout')
        if (saved) {
          try {
            const layout = JSON.parse(saved)
            set({ currentLayout: layout })
          } catch (error) {
            console.error('Failed to load layout from localStorage:', error)
          }
        }
      },
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        currentLayout: state.currentLayout,
        layouts: state.layouts,
      }),
    }
  )
)