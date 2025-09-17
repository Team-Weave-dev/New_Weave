'use client'

import React, { ReactNode, useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
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
import { EnhancedCollisionDetector, CollisionOptions } from '@/lib/dashboard/enhancedCollisionDetection'
import { DragPreview } from './DragPreview'
import { GridDropZones } from './GridDropZones'
import { AnimatedDragOverlay, SpringDragPreview } from './AnimatedDragOverlay'
import { SwapAnimation, WidgetTransition } from './SwapAnimation'
import { cn } from '@/lib/utils'
import { useLazyLoad } from '@/hooks/useIntersectionObserver'
import { useGridContext } from '@/contexts/GridContext'
import { 
  deltaToGridUnits, 
  constrainToGrid, 
  calculateWidgetSize,
  getGridColumns 
} from '@/lib/dashboard/gridCalculations'
import {
  pixelToGridPrecise,
  gridToPixelPrecise,
  type GridConfig
} from '@/lib/dashboard/gridCoordinates'

interface DndProviderProps {
  children: ReactNode
}

export function DndProvider({ children }: DndProviderProps) {
  const { 
    currentLayout, 
    moveWidget,
    swapWidgets,
    reflowWidgets,
    selectWidget,
    selectedWidgetId,
    isEditMode,
    // 드래그 상태 관리
    dragState,
    startDrag,
    updateDrag,
    validateDropTarget,
    endDrag,
    cancelDrag,
    rollbackDrag
  } = useDashboardStore()
  
  // GridContext에서 그리드 정보 가져오기 (optional)
  const gridContextData = useGridContext()
  const fallbackContainerRef = useRef<HTMLDivElement>(null)
  
  // GridContext가 없는 경우 기본값 사용
  const cellSize = gridContextData?.cellSize || 150
  const gap = gridContextData?.gap || 16
  const padding = gridContextData?.padding || 16
  const containerRef = gridContextData?.containerRef || fallbackContainerRef
  const gridSize = gridContextData?.gridSize || currentLayout?.gridSize || '3x3'
  
  // 향상된 충돌 감지기 인스턴스
  const [collisionDetector, setCollisionDetector] = useState<EnhancedCollisionDetector | null>(null)
  
  // 충돌 감지기 초기화/업데이트
  useEffect(() => {
    if (currentLayout) {
      const options: CollisionOptions = {
        allowPartialOverlap: false,
        maxOverlapRatio: 0,
        allowSwap: true,
        allowPush: true,
      }
      const detector = new EnhancedCollisionDetector(
        currentLayout.widgets,
        currentLayout.gridSize,
        options
      )
      setCollisionDetector(detector)
    }
  }, [currentLayout?.widgets, currentLayout?.gridSize])
  
  // 그리드 설정
  const gridConfig: GridConfig = {
    cellSize,
    gap,
    padding,
    gridSize: gridSize
  }
  
  const isVisible = useLazyLoad(containerRef)
  
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [draggedWidget, setDraggedWidget] = useState<any>(null)
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{x: number, y: number, width: number, height: number} | null>(null)
  const [isValidDropPosition, setIsValidDropPosition] = useState(true)
  const [swapAnimation, setSwapAnimation] = useState<{source: string, target: string} | null>(null)
  const [pushedWidgets, setPushedWidgets] = useState<string[]>([])

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
      // 새로운 드래그 상태 관리 시작
      startDrag(widget.id, widget.position)
    }
  }, [currentLayout, isEditMode, selectWidget, startDrag])

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
    if (!currentLayout || !active || !collisionDetector) return
    
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
    
    const testPosition = {
      x: newPosition.x,
      y: newPosition.y,
      width: activeWidget.position.width,
      height: activeWidget.position.height
    }
    
    // 향상된 충돌 감지 사용
    const collisionResult = collisionDetector.detectCollision(
      testPosition,
      activeWidget.id
    )
    
    setDragPreviewPosition(testPosition)
    setIsValidDropPosition(!collisionResult.hasCollision)
    
    // 새로운 드래그 상태 업데이트
    updateDrag({ x: newPosition.x, y: newPosition.y })
    
    // 스왑 가능한 위젯이 있으면 시각적 힌트 제공 가능
    if (collisionResult.swappableWidget) {
      // 스왑 가능 시각화 (추후 구현)
    }
  }, [currentLayout, cellSize, gap, collisionDetector, updateDrag])

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event
    
    if (!active || !currentLayout || !collisionDetector) {
      setActiveId(null)
      setDraggedWidget(null)
      cancelDrag()
      return
    }

    const activeWidget = currentLayout.widgets.find(w => w.id === active.id)
    if (!activeWidget) {
      setActiveId(null)
      setDraggedWidget(null)
      cancelDrag()
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

    // 향상된 충돌 감지 사용
    const collisionResult = collisionDetector.detectCollision(
      newPosition,
      activeWidget.id
    )

    try {
      if (!collisionResult.hasCollision) {
        // 충돌이 없으면 이동
        moveWidget(activeWidget.id, newPosition)
        endDrag(newPosition)
      } else if (collisionResult.swappableWidget) {
        // 스왑 가능한 위젯이 있으면 교환 애니메이션 실행
        setSwapAnimation({
          source: activeWidget.id,
          target: collisionResult.swappableWidget.id
        })
        // 애니메이션 후 실제 스왑 실행
        setTimeout(() => {
          swapWidgets(activeWidget.id, collisionResult.swappableWidget.id)
          setSwapAnimation(null)
          endDrag()
        }, 400)
      } else if (collisionResult.suggestedPosition) {
        // 제안된 대체 위치로 이동
        moveWidget(activeWidget.id, collisionResult.suggestedPosition)
        endDrag(collisionResult.suggestedPosition)
      } else if (over && over.id !== active.id) {
        // over 위젯과 스왑 시도
        const targetWidget = currentLayout.widgets.find(w => w.id === over.id)
        if (targetWidget && !targetWidget.locked) {
          swapWidgets(activeWidget.id, targetWidget.id)
          endDrag()
        } else {
          // 스왑 실패 시 원래 위치로
          cancelDrag()
        }
      } else {
        // 밀어내기 시도
        const updatedWidgets = collisionDetector.pushWidgets(activeWidget, newPosition)
        if (updatedWidgets.length > 0) {
          // 밀어내기 애니메이션 실행
          setPushedWidgets(updatedWidgets.map(w => w.id))
          // 애니메이션 후 실제 재배치
          setTimeout(() => {
            reflowWidgets()
            setPushedWidgets([])
            endDrag()
          }, 350)
        } else {
          // 모든 시도 실패 시 원래 위치로
          cancelDrag()
        }
      }
    } catch (error) {
      // 오류 발생 시 롤백
      console.error('Drag operation failed:', error)
      rollbackDrag()
    }
    
    setActiveId(null)
    setDraggedWidget(null)
    setDragPreviewPosition(null)
    setIsValidDropPosition(true)
  }, [currentLayout, moveWidget, swapWidgets, reflowWidgets, cellSize, gap, collisionDetector, endDrag, cancelDrag, rollbackDrag])

  // 드래그 취소 핸들러
  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setDraggedWidget(null)
    setDragPreviewPosition(null)
    setIsValidDropPosition(true)
    cancelDrag()
  }, [cancelDrag])

  // 편집 모드가 아니거나 아직 보이지 않으면 DnD 비활성화
  if (!isEditMode || !isVisible) {
    return <>{children}</>
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
        <div className="relative w-full h-full">
          {/* 드롭 가능 영역 시각화 */}
          {activeId && currentLayout && (
            <GridDropZones
              widgets={currentLayout.widgets}
              activeWidgetId={activeId as string}
              dragPreviewPosition={dragPreviewPosition}
              gridSize={currentLayout.gridSize}
              cellSize={cellSize}
              gap={gap}
            />
          )}
          {children}
        </div>
      </SortableContext>
      
      {/* 스왑 애니메이션 */}
      {swapAnimation && (
        <SwapAnimation
          sourceId={swapAnimation.source}
          targetId={swapAnimation.target}
          onSwapComplete={() => setSwapAnimation(null)}
        />
      )}
      
      {/* 드래그 오버레이 */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatedDragOverlay
          isDragging={!!activeId}
          isValidDrop={isValidDropPosition}
        >
          {activeId && draggedWidget ? (
            <div 
              style={{
                width: `${calculateWidgetSize(draggedWidget.position.width, 1, cellSize, gap).width}px`,
                height: `${calculateWidgetSize(1, draggedWidget.position.height, cellSize, gap).height}px`,
              }}
              className="gpu-accelerated"
            >
              <SpringDragPreview 
                widget={draggedWidget}
                isValidDrop={isValidDropPosition}
                showDropIndicator={true}
              />
            </div>
          ) : null}
        </AnimatedDragOverlay>,
        document.body
      )}
    </DndContext>
  )
}