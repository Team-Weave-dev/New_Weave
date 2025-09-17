'use client'

import React, { ReactNode, useState, useCallback, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  DragMoveEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { WidgetWrapper } from '../WidgetWrapper'
import { restrictToWindowEdges, restrictToParentElement } from '@dnd-kit/modifiers'
import { createPortal } from 'react-dom'
import { createGridCollisionDetection } from './customCollisionDetection'
import { findNearestValidPosition, reflowWidgets } from '@/lib/dashboard/collisionDetection'
import { DragPreview } from './DragPreview'
import { cn } from '@/lib/utils'
import { useLazyLoad } from '@/hooks/useIntersectionObserver'
import { useGridCellSize } from '@/hooks/useGridCellSize'
import { 
  deltaToGridUnits, 
  constrainToGrid, 
  calculateWidgetSize,
  getGridColumns 
} from '@/lib/dashboard/gridCalculations'

interface DndProviderProps {
  children: ReactNode
}

export function DndProvider({ children }: DndProviderProps) {
  const { 
    currentLayout, 
    moveWidget,
    swapWidgets,
    reflowWidgets,
    isEditMode,
    selectWidget,
    selectedWidgetId 
  } = useDashboardStore()
  
  // 동적 셀 크기 계산
  const gap = 16
  const padding = 16
  const { cellSize, containerRef } = useGridCellSize({
    gridSize: currentLayout?.gridSize || '3x3',
    gap,
    padding
  })
  
  const isVisible = useLazyLoad(containerRef)
  
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [draggedWidget, setDraggedWidget] = useState<any>(null)
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{x: number, y: number} | null>(null)
  const [isValidDropPosition, setIsValidDropPosition] = useState(true)

  // 센서 설정 - 포인터와 키보드 지원
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 드래그 시작 핸들러
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const widget = currentLayout?.widgets.find(w => w.id === active.id)
    
    if (widget && !widget.locked && isEditMode) {
      setActiveId(active.id)
      setDraggedWidget(widget)
      selectWidget(active.id as string)
    }
  }, [currentLayout, isEditMode, selectWidget])

  // 드래그 중 핸들러 (드롭 가능 영역 하이라이트)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      // 드롭 가능 영역 시각적 피드백
      // 충돌 감지 로직은 P2-02에서 구현
    }
  }, [])

  // 드래그 이동 핸들러 (실시간 프리뷰)
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { delta, active } = event
    if (!currentLayout || !active) return
    
    const activeWidget = currentLayout.widgets.find(w => w.id === active.id)
    if (!activeWidget) return
    
    // 픽셀을 그리드 좌표로 변환 (동적 셀 크기 사용)
    const { gridDeltaX, gridDeltaY } = deltaToGridUnits(delta.x, delta.y, cellSize, gap)
    
    // 새 위치 계산
    const gridColumns = getGridColumns(currentLayout.gridSize)
    const newPosition = constrainToGrid(
      activeWidget.position.x + gridDeltaX,
      activeWidget.position.y + gridDeltaY,
      activeWidget.position.width,
      activeWidget.position.height,
      gridColumns
    )
    
    setDragPreviewPosition(newPosition)
    
    // 충돌 검사
    const otherWidgets = currentLayout.widgets.filter(w => w.id !== active.id)
    const hasCollision = otherWidgets.some(w => {
      return !(newPosition.x + activeWidget.position.width <= w.position.x ||
               w.position.x + w.position.width <= newPosition.x ||
               newPosition.y + activeWidget.position.height <= w.position.y ||
               w.position.y + w.position.height <= newPosition.y)
    })
    
    setIsValidDropPosition(!hasCollision)
  }, [currentLayout, cellSize, gap])

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event
    
    if (!active || !currentLayout) {
      setActiveId(null)
      setDraggedWidget(null)
      return
    }

    const activeWidget = currentLayout.widgets.find(w => w.id === active.id)
    if (!activeWidget) {
      setActiveId(null)
      setDraggedWidget(null)
      return
    }

    // 픽셀을 그리드 좌표로 변환 (동적 셀 크기 사용)
    const { gridDeltaX, gridDeltaY } = deltaToGridUnits(delta.x, delta.y, cellSize, gap)

    // 새 위치 계산
    const gridColumns = getGridColumns(currentLayout.gridSize)
    const constrainedPosition = constrainToGrid(
      activeWidget.position.x + gridDeltaX,
      activeWidget.position.y + gridDeltaY,
      activeWidget.position.width,
      activeWidget.position.height,
      gridColumns
    )
    
    const newPosition = {
      ...constrainedPosition,
      width: activeWidget.position.width,
      height: activeWidget.position.height,
    }

    // 충돌 확인
    const otherWidgets = currentLayout.widgets.filter(w => w.id !== active.id)
    const hasCollision = otherWidgets.some(w => {
      return !(newPosition.x + newPosition.width <= w.position.x ||
               w.position.x + w.position.width <= newPosition.x ||
               newPosition.y + newPosition.height <= w.position.y ||
               w.position.y + w.position.height <= newPosition.y)
    })

    if (!hasCollision) {
      // 충돌이 없으면 이동
      moveWidget(activeWidget.id, newPosition)
    } else if (over && over.id !== active.id) {
      // 충돌이 있고 다른 위젯 위에 드롭한 경우 위치 교환
      const targetWidget = currentLayout.widgets.find(w => w.id === over.id)
      if (targetWidget && !targetWidget.locked) {
        // 두 위젯의 위치를 교환
        swapWidgets(activeWidget.id, targetWidget.id)
      }
    } else {
      // 유효한 가장 가까운 위치 찾기
      const validPosition = findNearestValidPosition(
        newPosition,
        otherWidgets,
        currentLayout.gridSize,
        activeWidget.id
      )
      if (validPosition) {
        moveWidget(activeWidget.id, validPosition)
      }
    }
    
    setActiveId(null)
    setDraggedWidget(null)
    setDragPreviewPosition(null)
    setIsValidDropPosition(true)
  }, [currentLayout, moveWidget, swapWidgets, cellSize, gap])

  // 드래그 취소 핸들러
  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setDraggedWidget(null)
    setDragPreviewPosition(null)
    setIsValidDropPosition(true)
  }, [])

  // 편집 모드가 아니거나 아직 보이지 않으면 DnD 비활성화
  if (!isEditMode || !isVisible) {
    return <div ref={containerRef}>{children}</div>
  }

  const widgetIds = currentLayout?.widgets
    .filter(w => !w.locked)
    .map(w => w.id) || []

  // 커스텀 충돌 감지 전략 생성 (동적 셀 크기 사용)
  const collisionDetection = currentLayout 
    ? createGridCollisionDetection({
        widgets: currentLayout.widgets,
        gridSize: currentLayout.gridSize,
        cellSize: cellSize,
        gap: gap,
      })
    : closestCenter

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToWindowEdges]}
    >
      <SortableContext 
        items={widgetIds}
        strategy={rectSortingStrategy}
      >
        {children}
      </SortableContext>
      
      {/* 드래그 오버레이 */}
      {typeof window !== 'undefined' && createPortal(
        <DragOverlay
          dropAnimation={{
            duration: 300,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeId && draggedWidget ? (
            <div 
              style={{
                width: `${calculateWidgetSize(draggedWidget.position.width, 1, cellSize, gap).width}px`,
                height: `${calculateWidgetSize(1, draggedWidget.position.height, cellSize, gap).height}px`,
              }}
              className={cn(
                'transition-all duration-200',
                isValidDropPosition ? 'opacity-90' : 'opacity-50'
              )}
            >
              <DragPreview widget={draggedWidget} />
              {/* 드롭 가능 여부 표시 */}
              {!isValidDropPosition && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                    이 위치에 놓을 수 없습니다
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  )
}