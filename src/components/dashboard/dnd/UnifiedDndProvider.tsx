'use client'

import React, { ReactNode, useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCenter,
  KeyboardSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  DragMoveEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { WidgetWrapper } from '../WidgetWrapper'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { createPortal } from 'react-dom'
import { createGridCollisionDetection } from './customCollisionDetection'
import { EnhancedCollisionDetector, CollisionOptions } from '@/lib/dashboard/enhancedCollisionDetection'
import { DragPreview } from './DragPreview'
import { GridDropZones } from './GridDropZones'
import { cn } from '@/lib/utils'
import { useLazyLoad } from '@/hooks/useIntersectionObserver'
import { useGridContext } from '@/contexts/GridContext'
import { 
  deltaToGridUnits, 
  constrainToGrid, 
  calculateWidgetSize,
  getGridColumns 
} from '@/lib/dashboard/gridCalculations'
import { type GridConfig } from '@/lib/dashboard/gridCoordinates'
import { useUnifiedInteraction, type UnifiedInteractionEvent } from '@/hooks/useUnifiedInteraction'

interface UnifiedDndProviderProps {
  children: ReactNode
}

// 카스텀 터치 센서 설정
class CustomTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: 'onTouchStart' as const,
      handler: ({ nativeEvent: event }: React.TouchEvent) => {
        return true
      }
    }
  ]
}

// 카스텀 마우스 센서 설정
class CustomMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown' as const,
      handler: ({ nativeEvent: event }: React.MouseEvent) => {
        // 우클릭 제외
        if (event.button !== 0) return false
        return true
      }
    }
  ]
}

export function UnifiedDndProvider({ children }: UnifiedDndProviderProps) {
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
  const dndContainerRef = useRef<HTMLDivElement>(null)
  
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
  const [showLongPressMenu, setShowLongPressMenu] = useState(false)
  const [longPressPosition, setLongPressPosition] = useState<{x: number, y: number} | null>(null)

  // 통합 센서 설정 - 마우스, 터치, 키보드 지원
  const sensors = useSensors(
    useSensor(CustomMouseSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작
      },
    }),
    useSensor(CustomTouchSensor, {
      activationConstraint: {
        delay: 100, // 100ms 딜레이 (롱프레스 방지)
        tolerance: 5, // 5px 허용 오차
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 통합 인터랙션 훅 사용 (롱프레스 메뉴용)
  const { currentGesture, triggerHaptic } = useUnifiedInteraction(dndContainerRef, {
    onInteraction: (event: UnifiedInteractionEvent) => {
      if (event.gesture === 'longpress' && event.type === 'start') {
        // 롱프레스 시 편집 메뉴 표시
        if (isEditMode) {
          setShowLongPressMenu(true)
          setLongPressPosition({ x: event.x, y: event.y })
          triggerHaptic?.('medium')
        }
      } else if (event.type === 'end' || event.type === 'cancel') {
        setShowLongPressMenu(false)
        setLongPressPosition(null)
      }
    },
    disabled: !isEditMode,
    enableHaptic: true,
    longPressThreshold: 500
  })

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
      
      // 모바일에서 햅틱 피드백
      if ('ontouchstart' in window) {
        triggerHaptic?.('light')
      }
    }
  }, [currentLayout, isEditMode, selectWidget, startDrag, triggerHaptic])

  // 드래그 중 핸들러 (드롭 가능 영역 하이라이트)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      // 드롭 가능 영역 시각적 피드백
      // 모바일에서 가벼운 햅틱
      if ('ontouchstart' in window) {
        triggerHaptic?.('light')
      }
    }
  }, [triggerHaptic])

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
        
        // 성공 햅틱
        if ('ontouchstart' in window) {
          triggerHaptic?.('medium')
        }
      } else if (collisionResult.swappableWidget) {
        // 스왑 가능한 위젯이 있으면 교환
        swapWidgets(activeWidget.id, collisionResult.swappableWidget.id)
        endDrag()
        
        // 성공 햅틱
        if ('ontouchstart' in window) {
          triggerHaptic?.('medium')
        }
      } else if (collisionResult.suggestedPosition) {
        // 제안된 대체 위치로 이동
        moveWidget(activeWidget.id, collisionResult.suggestedPosition)
        endDrag(collisionResult.suggestedPosition)
        
        // 성공 햅틱
        if ('ontouchstart' in window) {
          triggerHaptic?.('light')
        }
      } else if (over && over.id !== active.id) {
        // over 위젯과 스왑 시도
        const targetWidget = currentLayout.widgets.find(w => w.id === over.id)
        if (targetWidget && !targetWidget.locked) {
          swapWidgets(activeWidget.id, targetWidget.id)
          endDrag()
          
          // 성공 햅틱
          if ('ontouchstart' in window) {
            triggerHaptic?.('medium')
          }
        } else {
          // 스왑 실패 시 원래 위치로
          cancelDrag()
          
          // 실패 햅틱
          if ('ontouchstart' in window) {
            triggerHaptic?.('heavy')
          }
        }
      } else {
        // 밀어내기 시도
        const updatedWidgets = collisionDetector.pushWidgets(activeWidget, newPosition)
        if (updatedWidgets.length > 0) {
          // 밀어내기 성공 시 위젯 재배치
          reflowWidgets()
          endDrag()
          
          // 성공 햅틱
          if ('ontouchstart' in window) {
            triggerHaptic?.('medium')
          }
        } else {
          // 모든 시도 실패 시 원래 위치로
          cancelDrag()
          
          // 실패 햅틱
          if ('ontouchstart' in window) {
            triggerHaptic?.('heavy')
          }
        }
      }
    } catch (error) {
      // 오류 발생 시 롤백
      console.error('Drag operation failed:', error)
      rollbackDrag()
      
      // 실패 햅틱
      if ('ontouchstart' in window) {
        triggerHaptic?.('heavy')
      }
    }
    
    setActiveId(null)
    setDraggedWidget(null)
    setDragPreviewPosition(null)
    setIsValidDropPosition(true)
  }, [currentLayout, moveWidget, swapWidgets, reflowWidgets, cellSize, gap, collisionDetector, endDrag, cancelDrag, rollbackDrag, triggerHaptic])

  // 드래그 취소 핸들러
  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setDraggedWidget(null)
    setDragPreviewPosition(null)
    setIsValidDropPosition(true)
    cancelDrag()
    
    // 취소 햅틱
    if ('ontouchstart' in window) {
      triggerHaptic?.('light')
    }
  }, [cancelDrag, triggerHaptic])

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
        <div ref={dndContainerRef} className="relative w-full h-full">
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
          
          {/* 롱프레스 메뉴 (모바일) */}
          {showLongPressMenu && longPressPosition && (
            <div
              className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2"
              style={{
                left: `${longPressPosition.x}px`,
                top: `${longPressPosition.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="flex flex-col space-y-1">
                <button 
                  className="px-3 py-2 text-sm hover:bg-gray-100 rounded-md text-left"
                  onClick={() => {
                    // 위젯 편집 로직
                    setShowLongPressMenu(false)
                  }}
                >
                  위젯 편집
                </button>
                <button 
                  className="px-3 py-2 text-sm hover:bg-gray-100 rounded-md text-left"
                  onClick={() => {
                    // 위젯 복제 로직
                    setShowLongPressMenu(false)
                  }}
                >
                  위젯 복제
                </button>
                <button 
                  className="px-3 py-2 text-sm hover:bg-gray-100 rounded-md text-left text-red-600"
                  onClick={() => {
                    // 위젯 삭제 로직
                    setShowLongPressMenu(false)
                  }}
                >
                  위젯 삭제
                </button>
              </div>
            </div>
          )}
          
          {children}
        </div>
      </SortableContext>
      
      {/* 드래그 오버레이 */}
      {typeof window !== 'undefined' && createPortal(
        <DragOverlay
          dropAnimation={{
            duration: 350,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
                isValidDropPosition ? 'opacity-90' : 'opacity-50',
                // 터치 디바이스에서 더 큰 그림자
                'ontouchstart' in window ? 'shadow-2xl' : 'shadow-xl'
              )}
            >
              <DragPreview widget={draggedWidget} />
              {/* 드롭 가능 여부 표시 */}
              {!isValidDropPosition && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={cn(
                    "bg-red-600 text-white px-3 py-2 rounded-lg font-medium shadow-lg",
                    // 터치 디바이스에서 더 큰 텍스트
                    'ontouchstart' in window ? 'text-base' : 'text-sm'
                  )}>
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