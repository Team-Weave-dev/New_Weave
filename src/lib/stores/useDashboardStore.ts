import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GridSize, WidgetPosition, Widget, DashboardLayout } from '@/types/dashboard'
import { migrateWidgetTypes } from '@/lib/dashboard/widgetTypeMapping'
import { WidgetNormalizer } from '@/lib/dashboard/widgetNormalizer'

// Re-export types for backward compatibility
export type { GridSize, WidgetPosition, Widget, DashboardLayout }

// 드래그 상태 인터페이스
interface DragState {
  isDragging: boolean
  draggedWidgetId: string | null
  dragStartPosition: WidgetPosition | null
  dragCurrentPosition: { x: number; y: number } | null
  dropTargetPosition: WidgetPosition | null
  isValidDrop: boolean
  collisionInfo: {
    hasCollision: boolean
    collidingWidgetIds: string[]
    suggestedPosition?: WidgetPosition
  } | null
}

// 드래그 히스토리 인터페이스
interface DragHistoryItem {
  timestamp: number
  widgetId: string
  from: WidgetPosition
  to: WidgetPosition
  success: boolean
  rollbackData?: Widget[]
}

interface DashboardStore {
  // State
  currentLayout: DashboardLayout | null
  layouts: DashboardLayout[]
  isEditMode: boolean
  selectedWidgetId: string | null
  
  // 드래그 상태
  dragState: DragState
  dragHistory: DragHistoryItem[]
  maxDragHistory: number
  
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
  resizeWidget: (widgetId: string, newSize: { width: number; height: number }) => void
  lockWidget: (widgetId: string, locked: boolean) => void
  reflowWidgets: (updatedWidgets?: Widget[]) => void
  swapWidgets: (widgetId1: string, widgetId2: string) => void
  pushAndReflowWidgets: (movedWidget: Widget, newPosition: WidgetPosition) => void
  optimizeLayout: () => void
  normalizeWidgetPositions: () => void
  
  // History Actions
  undoLastAction: () => void
  redoAction: () => void
  canUndo: boolean
  canRedo: boolean
  actionHistory: Array<{ type: string; data: any; timestamp: number }>
  redoHistory: Array<{ type: string; data: any; timestamp: number }>
  
  // Edit Mode Actions
  setEditMode: (editMode: boolean) => void
  selectWidget: (widgetId: string | null) => void
  
  // Grid Actions
  setGridSize: (gridSize: GridSize) => void
  
  // Utility Actions
  reset: () => void
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => void
  
  // 드래그 액션
  startDrag: (widgetId: string, startPosition: WidgetPosition) => void
  updateDrag: (currentPosition: { x: number; y: number }) => void
  validateDropTarget: (targetPosition: WidgetPosition) => boolean
  endDrag: (targetPosition?: WidgetPosition) => void
  cancelDrag: () => void
  rollbackDrag: () => void
  clearDragHistory: () => void
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
      actionHistory: [],
      redoHistory: [],
      canUndo: false,
      canRedo: false,
      
      // 드래그 상태 초기값
      dragState: {
        isDragging: false,
        draggedWidgetId: null,
        dragStartPosition: null,
        dragCurrentPosition: null,
        dropTargetPosition: null,
        isValidDrop: false,
        collisionInfo: null,
      },
      dragHistory: [],
      maxDragHistory: 50,
      
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
          if (!state.currentLayout) {
            // currentLayout가 없으면 기본 레이아웃 생성
            const newLayout: DashboardLayout = {
              id: `layout-${Date.now()}`,
              name: 'Default Dashboard',
              gridSize: '3x3',
              widgets: [widget],
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            return {
              currentLayout: newLayout,
              layouts: [...state.layouts, newLayout],
            }
          }
          
          // 중복 ID 체크
          const existingWidget = state.currentLayout.widgets.find(w => w.id === widget.id)
          if (existingWidget) {
            console.warn('Widget with same ID already exists, skipping:', widget.id)
            return state
          }
          
          // 위치 정규화
          const normalizer = new WidgetNormalizer(state.currentLayout.gridSize)
          const normalizedPosition = normalizer.normalizePosition(widget.position)
          const normalizedWidget = { ...widget, position: normalizedPosition }
          
          // 충돌 체크 및 자동 위치 조정
          const allWidgets = [...state.currentLayout.widgets, normalizedWidget]
          const { widgets: adjustedWidgets } = normalizer.normalizeWidgets(allWidgets)
          
          const updatedLayout = {
            ...state.currentLayout,
            widgets: adjustedWidgets,
            updatedAt: new Date(),
          }
          
          return {
            currentLayout: updatedLayout,
            layouts: state.layouts.map(l => 
              l.id === updatedLayout.id ? updatedLayout : l
            ),
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
          
          const before = state.currentLayout.widgets
          const widget = before.find(w => w.id === widgetId)
          if (!widget) return state
          
          // 위치 정규화
          const normalizer = new WidgetNormalizer(state.currentLayout.gridSize)
          const normalizedPosition = normalizer.normalizePosition(newPosition)
          
          // Optimistic update
          const after = state.currentLayout.widgets.map((w) =>
            w.id === widgetId
              ? { ...w, position: normalizedPosition }
              : w
          )
          
          // 히스토리에 액션 저장
          const action = {
            type: 'move',
            data: { before, after, widgetId, position: newPosition },
            timestamp: Date.now(),
          }
          
          // 드래그 히스토리 추가
          const dragHistoryItem: DragHistoryItem = {
            timestamp: Date.now(),
            widgetId,
            from: widget.position,
            to: newPosition,
            success: true,
            rollbackData: before,
          }
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: after,
              updatedAt: new Date(),
            },
            actionHistory: [...state.actionHistory, action].slice(-20),
            redoHistory: [],
            canUndo: true,
            canRedo: false,
            dragHistory: [...state.dragHistory, dragHistoryItem].slice(-state.maxDragHistory),
          }
        })
      },
      
      resizeWidget: (widgetId, newSize) => {
        set((state) => {
          if (!state.currentLayout) return state
          
          const widget = state.currentLayout.widgets.find(w => w.id === widgetId)
          if (!widget) return state
          
          // 그리드 크기 가져오기
          const gridColumns = state.currentLayout.gridSize === '2x2' ? 2 :
                             state.currentLayout.gridSize === '3x3' ? 3 :
                             state.currentLayout.gridSize === '4x4' ? 4 : 5
          
          // 최소/최대 크기 제약
          const constrainedWidth = Math.max(1, Math.min(newSize.width, gridColumns - widget.position.x))
          const constrainedHeight = Math.max(1, Math.min(newSize.height, gridColumns - widget.position.y))
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: state.currentLayout.widgets.map((w) =>
                w.id === widgetId
                  ? { 
                      ...w, 
                      position: { 
                        ...w.position, 
                        width: constrainedWidth, 
                        height: constrainedHeight 
                      } 
                    }
                  : w
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
      
      reflowWidgets: (updatedWidgets?: Widget[]) => {
        set((state) => {
          if (!state.currentLayout) return state
          
          const widgets = updatedWidgets || state.currentLayout.widgets
          const { gridSize } = state.currentLayout
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
          
          // 히스토리에 액션 저장
          const action = {
            type: 'reflow',
            data: { before: state.currentLayout.widgets, after: reflowedWidgets },
            timestamp: Date.now(),
          }
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: reflowedWidgets,
              updatedAt: new Date(),
            },
            actionHistory: [...state.actionHistory, action].slice(-20), // 최대 20개 히스토리 저장
            redoHistory: [], // 새로운 액션이 발생하면 redo 히스토리 초기화
            canUndo: true,
            canRedo: false,
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
        set(() => ({ isEditMode: editMode, selectedWidgetId: null }))
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
            // 위젯 타입 마이그레이션 (한글 -> 영문)
            if (layout.widgets) {
              layout.widgets = migrateWidgetTypes(layout.widgets)
              
              // 위치 정규화
              const normalizer = new WidgetNormalizer(layout.gridSize || '3x3')
              const { widgets } = normalizer.normalizeWidgets(layout.widgets)
              layout.widgets = widgets
            }
            set({ currentLayout: layout })
          } catch (error) {
            console.error('Failed to load layout from localStorage:', error)
          }
        }
      },
      
      // 스마트 위젯 재배치 (밀어내기 포함)
      pushAndReflowWidgets: (movedWidget: Widget, newPosition: WidgetPosition) => {
        set((state) => {
          if (!state.currentLayout) return state
          
          const { widgets, gridSize } = state.currentLayout
          const columns = gridSize === '2x2' ? 2 :
                         gridSize === '3x3' ? 3 :
                         gridSize === '4x4' ? 4 : 5
          
          // EnhancedCollisionDetector 사용
          const { EnhancedCollisionDetector } = require('@/lib/dashboard/enhancedCollisionDetection')
          const detector = new EnhancedCollisionDetector(widgets, gridSize, {
            allowPush: true,
            allowSwap: true,
            allowPartialOverlap: false,
          })
          
          // 위젯 밀어내기 수행
          const updatedWidgets = detector.pushWidgets(movedWidget, newPosition)
          
          // 히스토리에 액션 저장
          const action = {
            type: 'push_reflow',
            data: { before: widgets, after: updatedWidgets },
            timestamp: Date.now(),
          }
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: updatedWidgets,
              updatedAt: new Date(),
            },
            actionHistory: [...state.actionHistory, action].slice(-20),
            redoHistory: [],
            canUndo: true,
            canRedo: false,
          }
        })
      },
      
      // 레이아웃 최적화 (빈 공간 제거)
      optimizeLayout: () => {
        set((state) => {
          if (!state.currentLayout) return state
          
          const { widgets, gridSize } = state.currentLayout
          const columns = gridSize === '2x2' ? 2 :
                         gridSize === '3x3' ? 3 :
                         gridSize === '4x4' ? 4 : 5
          
          // 위젯을 y, x 순으로 정렬
          const sortedWidgets = [...widgets].sort((a, b) => {
            if (a.locked) return 1  // 잠긴 위젯은 나중에 처리
            if (b.locked) return -1
            if (a.position.y !== b.position.y) {
              return a.position.y - b.position.y
            }
            return a.position.x - b.position.x
          })
          
          // 그리드를 빈 공간으로 초기화
          const grid: (string | null)[][] = Array(columns).fill(null).map(() => Array(columns).fill(null))
          
          // 잠긴 위젯 먼저 배치
          sortedWidgets.filter(w => w.locked).forEach(widget => {
            const { x, y, width, height } = widget.position
            for (let h = 0; h < height; h++) {
              for (let w = 0; w < width; w++) {
                if (grid[y + h] && grid[y + h][x + w] !== undefined) {
                  grid[y + h][x + w] = widget.id
                }
              }
            }
          })
          
          // 잠기지 않은 위젯 최적 위치로 재배치
          const optimizedWidgets = sortedWidgets.map(widget => {
            if (widget.locked) return widget
            
            let { width, height } = widget.position
            let bestX = 0, bestY = columns
            
            // 가장 위쪽의 빈 공간 찾기
            for (let row = 0; row <= columns - height; row++) {
              for (let col = 0; col <= columns - width; col++) {
                let canPlace = true
                
                for (let h = 0; h < height && canPlace; h++) {
                  for (let w = 0; w < width && canPlace; w++) {
                    if (grid[row + h]?.[col + w] !== null) {
                      canPlace = false
                    }
                  }
                }
                
                if (canPlace && row < bestY) {
                  bestX = col
                  bestY = row
                }
              }
            }
            
            // 그리드에 배치
            for (let h = 0; h < height; h++) {
              for (let w = 0; w < width; w++) {
                if (grid[bestY + h] && grid[bestY + h][bestX + w] !== undefined) {
                  grid[bestY + h][bestX + w] = widget.id
                }
              }
            }
            
            return {
              ...widget,
              position: { x: bestX, y: bestY, width, height }
            }
          })
          
          // 히스토리에 액션 저장
          const action = {
            type: 'optimize',
            data: { before: widgets, after: optimizedWidgets },
            timestamp: Date.now(),
          }
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: optimizedWidgets,
              updatedAt: new Date(),
            },
            actionHistory: [...state.actionHistory, action].slice(-20),
            redoHistory: [],
            canUndo: true,
            canRedo: false,
          }
        })
      },
      
      // Undo 액션
      undoLastAction: () => {
        set((state) => {
          if (!state.currentLayout || state.actionHistory.length === 0) return state
          
          const lastAction = state.actionHistory[state.actionHistory.length - 1]
          const newHistory = state.actionHistory.slice(0, -1)
          
          // 이전 상태로 복원
          if (lastAction.data.before) {
            return {
              currentLayout: {
                ...state.currentLayout,
                widgets: lastAction.data.before,
                updatedAt: new Date(),
              },
              actionHistory: newHistory,
              redoHistory: [...state.redoHistory, lastAction],
              canUndo: newHistory.length > 0,
              canRedo: true,
            }
          }
          
          return state
        })
      },
      
      // Redo 액션
      redoAction: () => {
        set((state) => {
          if (!state.currentLayout || state.redoHistory.length === 0) return state
          
          const redoAction = state.redoHistory[state.redoHistory.length - 1]
          const newRedoHistory = state.redoHistory.slice(0, -1)
          
          // 다시 실행
          if (redoAction.data.after) {
            return {
              currentLayout: {
                ...state.currentLayout,
                widgets: redoAction.data.after,
                updatedAt: new Date(),
              },
              actionHistory: [...state.actionHistory, redoAction],
              redoHistory: newRedoHistory,
              canUndo: true,
              canRedo: newRedoHistory.length > 0,
            }
          }
          
          return state
        })
      },
      
      // 드래그 액션
      startDrag: (widgetId: string, startPosition: WidgetPosition) => {
        set((state) => ({
          dragState: {
            ...state.dragState,
            isDragging: true,
            draggedWidgetId: widgetId,
            dragStartPosition: startPosition,
            dragCurrentPosition: null,
            dropTargetPosition: null,
            isValidDrop: false,
            collisionInfo: null,
          },
          selectedWidgetId: widgetId,
        }))
      },
      
      updateDrag: (currentPosition: { x: number; y: number }) => {
        set((state) => {
          if (!state.dragState.isDragging || !state.currentLayout) return state
          
          // 그리드 좌표로 변환
          const gridColumns = state.currentLayout.gridSize === '2x2' ? 2 :
                             state.currentLayout.gridSize === '3x3' ? 3 :
                             state.currentLayout.gridSize === '4x4' ? 4 : 5
          
          const gridX = Math.floor(currentPosition.x)
          const gridY = Math.floor(currentPosition.y)
          
          const draggedWidget = state.currentLayout.widgets.find(
            w => w.id === state.dragState.draggedWidgetId
          )
          if (!draggedWidget) return state
          
          const targetPosition: WidgetPosition = {
            x: Math.max(0, Math.min(gridX, gridColumns - draggedWidget.position.width)),
            y: Math.max(0, Math.min(gridY, gridColumns - draggedWidget.position.height)),
            width: draggedWidget.position.width,
            height: draggedWidget.position.height,
          }
          
          // 충돌 감지
          const otherWidgets = state.currentLayout.widgets.filter(
            w => w.id !== state.dragState.draggedWidgetId && !w.locked
          )
          
          const collidingWidgets: string[] = []
          otherWidgets.forEach(widget => {
            const isColliding = 
              targetPosition.x < widget.position.x + widget.position.width &&
              targetPosition.x + targetPosition.width > widget.position.x &&
              targetPosition.y < widget.position.y + widget.position.height &&
              targetPosition.y + targetPosition.height > widget.position.y
            
            if (isColliding) {
              collidingWidgets.push(widget.id)
            }
          })
          
          return {
            dragState: {
              ...state.dragState,
              dragCurrentPosition: currentPosition,
              dropTargetPosition: targetPosition,
              isValidDrop: collidingWidgets.length === 0,
              collisionInfo: {
                hasCollision: collidingWidgets.length > 0,
                collidingWidgetIds: collidingWidgets,
                suggestedPosition: collidingWidgets.length > 0 ? 
                  state.dragState.dragStartPosition : undefined,
              },
            },
          }
        })
      },
      
      validateDropTarget: (targetPosition: WidgetPosition) => {
        const state = get()
        if (!state.currentLayout || !state.dragState.draggedWidgetId) return false
        
        const otherWidgets = state.currentLayout.widgets.filter(
          w => w.id !== state.dragState.draggedWidgetId
        )
        
        // 충돌 검사
        for (const widget of otherWidgets) {
          if (widget.locked) continue
          
          const isColliding = 
            targetPosition.x < widget.position.x + widget.position.width &&
            targetPosition.x + targetPosition.width > widget.position.x &&
            targetPosition.y < widget.position.y + widget.position.height &&
            targetPosition.y + targetPosition.height > widget.position.y
          
          if (isColliding) return false
        }
        
        return true
      },
      
      endDrag: (targetPosition?: WidgetPosition) => {
        const state = get()
        if (!state.dragState.isDragging || !state.dragState.draggedWidgetId) {
          set({ dragState: { ...state.dragState, isDragging: false, draggedWidgetId: null } })
          return
        }
        
        const finalPosition = targetPosition || state.dragState.dropTargetPosition
        
        if (finalPosition && state.dragState.isValidDrop) {
          // 위치 업데이트 (optimistic update)
          get().moveWidget(state.dragState.draggedWidgetId, finalPosition)
        } else if (state.dragState.dragStartPosition) {
          // 원래 위치로 롤백
          get().moveWidget(state.dragState.draggedWidgetId, state.dragState.dragStartPosition)
        }
        
        // 드래그 상태 초기화
        set({
          dragState: {
            isDragging: false,
            draggedWidgetId: null,
            dragStartPosition: null,
            dragCurrentPosition: null,
            dropTargetPosition: null,
            isValidDrop: false,
            collisionInfo: null,
          },
        })
      },
      
      cancelDrag: () => {
        const state = get()
        if (state.dragState.dragStartPosition && state.dragState.draggedWidgetId) {
          // 원래 위치로 롤백
          get().moveWidget(state.dragState.draggedWidgetId, state.dragState.dragStartPosition)
        }
        
        set({
          dragState: {
            isDragging: false,
            draggedWidgetId: null,
            dragStartPosition: null,
            dragCurrentPosition: null,
            dropTargetPosition: null,
            isValidDrop: false,
            collisionInfo: null,
          },
        })
      },
      
      rollbackDrag: () => {
        set((state) => {
          if (state.dragHistory.length === 0 || !state.currentLayout) return state
          
          const lastDrag = state.dragHistory[state.dragHistory.length - 1]
          if (!lastDrag.rollbackData) return state
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets: lastDrag.rollbackData,
              updatedAt: new Date(),
            },
            dragHistory: state.dragHistory.slice(0, -1),
          }
        })
      },
      
      clearDragHistory: () => {
        set({ dragHistory: [] })
      },
      
      // 위젯 위치 정규화
      normalizeWidgetPositions: () => {
        set((state) => {
          if (!state.currentLayout) return state
          
          const normalizer = new WidgetNormalizer(state.currentLayout.gridSize)
          const { widgets, report } = normalizer.normalizeWidgets(state.currentLayout.widgets)
          
          // 정규화 보고서 로깅
          if (report.invalidPositions > 0 || report.duplicates > 0 || report.collisions > 0) {
            console.log('[Widget Normalization Report]', {
              totalWidgets: report.totalWidgets,
              invalidPositions: report.invalidPositions,
              duplicates: report.duplicates,
              collisions: report.collisions,
              normalized: report.normalized,
            })
          }
          
          // 변경사항이 없으면 상태 유지
          const hasChanges = JSON.stringify(widgets) !== JSON.stringify(state.currentLayout.widgets)
          if (!hasChanges) {
            console.log('[Widget Normalization] No changes needed')
            return state
          }
          
          // 히스토리에 액션 저장
          const action = {
            type: 'normalize',
            data: { before: state.currentLayout.widgets, after: widgets },
            timestamp: Date.now(),
          }
          
          return {
            currentLayout: {
              ...state.currentLayout,
              widgets,
              updatedAt: new Date(),
            },
            actionHistory: [...state.actionHistory, action].slice(-20),
            redoHistory: [],
            canUndo: true,
            canRedo: false,
          }
        })
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