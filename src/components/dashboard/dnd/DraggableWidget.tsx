'use client'

import React, { ReactNode, memo, useState, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { ResizeHandle } from '../ResizeHandle'
import { hasCollisionWithWidgets } from '@/lib/dashboard/collisionDetection'

interface DraggableWidgetProps {
  // 기본 속성
  id: string
  children: ReactNode
  
  // 위치 및 크기
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  
  // 상태
  isEditMode?: boolean
  isLocked?: boolean
  isSelected?: boolean
  
  // 드래그 옵션
  disableDragging?: boolean
  
  // 리사이즈 옵션
  minSize?: { width: number; height: number }
  maxSize?: { width: number; height: number }
  
  // 스타일
  className?: string
  
  // 이벤트 핸들러
  onSelect?: () => void
  onResize?: (size: { width: number; height: number }) => void
  onPositionChange?: (position: { x: number; y: number }) => void
}

export const DraggableWidget = memo(function DraggableWidget({
  id,
  children,
  position,
  isEditMode = false,
  isLocked = false,
  isSelected = false,
  disableDragging = false,
  minSize = { width: 1, height: 1 },
  maxSize = { width: 5, height: 5 },
  className,
  onSelect,
  onResize,
  onPositionChange,
}: DraggableWidgetProps) {
  const { currentLayout, resizeWidget } = useDashboardStore()
  
  // 드래그 상태
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
    isOver,
  } = useSortable({
    id,
    disabled: disableDragging || isLocked || !isEditMode,
    animateLayoutChanges: () => true,
  })
  
  // 리사이즈 상태
  const [isResizing, setIsResizing] = useState(false)
  const [tempSize, setTempSize] = useState<{ width: number; height: number } | null>(null)
  const [isColliding, setIsColliding] = useState(false)
  
  // 그리드 컬럼 수
  const gridColumns = currentLayout?.gridSize === '2x2' ? 2 :
                     currentLayout?.gridSize === '3x3' ? 3 :
                     currentLayout?.gridSize === '4x4' ? 4 : 5
  
  // 드래그 스타일
  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging 
      ? 'none' 
      : transition || 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 200ms ease',
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : (isEditMode && !isLocked) ? 'grab' : 'default',
    willChange: isDragging ? 'transform' : undefined,
  }
  
  // 애니메이션 설정
  const variants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2,
        ease: "easeIn" as const,
      }
    },
    dragging: {
      scale: 1.05,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: {
        duration: 0.15,
      }
    },
    resizing: {
      transition: {
        duration: 0,
      }
    }
  }
  
  // 리사이즈 핸들러
  const handleResize = useCallback((handlePosition: string) => (deltaX: number, deltaY: number) => {
    if (isLocked) return
    
    const cellSize = 150 // TODO: 동적으로 계산
    const gridDeltaX = Math.round(deltaX / cellSize)
    const gridDeltaY = Math.round(deltaY / cellSize)
    
    let newWidth = position.width
    let newHeight = position.height
    let newX = position.x
    let newY = position.y
    
    switch (handlePosition) {
      case 'right':
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, position.width + gridDeltaX))
        break
      case 'left':
        const potentialWidthLeft = position.width - gridDeltaX
        if (potentialWidthLeft >= minSize.width && potentialWidthLeft <= maxSize.width) {
          newWidth = potentialWidthLeft
          newX = Math.max(0, position.x + gridDeltaX)
        }
        break
      case 'bottom':
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, position.height + gridDeltaY))
        break
      case 'top':
        const potentialHeightTop = position.height - gridDeltaY
        if (potentialHeightTop >= minSize.height && potentialHeightTop <= maxSize.height) {
          newHeight = potentialHeightTop
          newY = Math.max(0, position.y + gridDeltaY)
        }
        break
      case 'bottom-right':
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, position.width + gridDeltaX))
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, position.height + gridDeltaY))
        break
      case 'bottom-left':
        const potentialWidthBL = position.width - gridDeltaX
        if (potentialWidthBL >= minSize.width && potentialWidthBL <= maxSize.width) {
          newWidth = potentialWidthBL
          newX = Math.max(0, position.x + gridDeltaX)
        }
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, position.height + gridDeltaY))
        break
      case 'top-right':
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, position.width + gridDeltaX))
        const potentialHeightTR = position.height - gridDeltaY
        if (potentialHeightTR >= minSize.height && potentialHeightTR <= maxSize.height) {
          newHeight = potentialHeightTR
          newY = Math.max(0, position.y + gridDeltaY)
        }
        break
      case 'top-left':
        const potentialWidthTL = position.width - gridDeltaX
        const potentialHeightTL = position.height - gridDeltaY
        if (potentialWidthTL >= minSize.width && potentialWidthTL <= maxSize.width) {
          newWidth = potentialWidthTL
          newX = Math.max(0, position.x + gridDeltaX)
        }
        if (potentialHeightTL >= minSize.height && potentialHeightTL <= maxSize.height) {
          newHeight = potentialHeightTL
          newY = Math.max(0, position.y + gridDeltaY)
        }
        break
    }
    
    // 그리드 경계 체크
    newWidth = Math.min(newWidth, gridColumns - newX)
    newHeight = Math.min(newHeight, gridColumns - newY)
    
    // 임시 크기 업데이트
    setTempSize({ width: newWidth, height: newHeight })
    setIsResizing(true)
    
    // 충돌 감지
    const collision = hasCollisionWithWidgets(
      { x: newX, y: newY, width: newWidth, height: newHeight },
      currentLayout?.widgets || [],
      id
    )
    setIsColliding(collision)
    
    // 실제 크기 업데이트
    if (newX !== position.x || newY !== position.y) {
      onPositionChange?.({ x: newX, y: newY })
    }
    if (newWidth !== position.width || newHeight !== position.height) {
      onResize?.({ width: newWidth, height: newHeight })
      resizeWidget(id, { width: newWidth, height: newHeight })
    }
  }, [position, isLocked, minSize, maxSize, gridColumns, onResize, onPositionChange, resizeWidget, id, currentLayout])
  
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setTempSize(null)
    setIsColliding(false)
  }, [])
  
  const handleClick = useCallback(() => {
    if (isEditMode && !isLocked && !isResizing && !isDragging) {
      onSelect?.()
    }
  }, [isEditMode, isLocked, isResizing, isDragging, onSelect])
  
  // ARIA 속성
  const ariaProps = {
    'role': 'button',
    'aria-roledescription': '드래그 가능한 위젯',
    'aria-describedby': `${id}-description`,
    'aria-disabled': isLocked,
    'aria-grabbed': isDragging ? true : false,
    'aria-live': isDragging ? ('polite' as const) : undefined,
    'aria-label': isDragging ? '위젯 이동 중' : '드래그 가능한 위젯',
    'tabIndex': isLocked ? -1 : 0,
  }
  
  const displaySize = tempSize || position
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={setNodeRef}
        layoutId={`widget-${id}`}
        layout
        initial="initial"
        animate={
          isDragging ? 'dragging' : 
          isResizing ? 'resizing' : 
          'animate'
        }
        exit="exit"
        whileHover={{
          scale: isEditMode && !isDragging && !isLocked ? 1.02 : 1,
          transition: {
            duration: 0.2,
          }
        }}
        variants={variants}
        style={{
          ...dragStyle,
          gridColumn: `span ${position.width}`,
          gridRow: `span ${position.height}`,
        }}
        className={cn(
          'relative h-full w-full focus:outline-none focus:ring-2 focus:ring-blue-500',
          {
            // 드래그 상태
            'widget-dragging shadow-2xl scale-105': isDragging,
            // 드롭 가능 영역
            'widget-drop-zone ring-2 ring-green-500 ring-offset-2 bg-green-50 scale-102': isOver && !isDragging,
            // 호버 상태
            'widget-hoverable hover:shadow-lg hover:scale-101 transition-all duration-300': isEditMode && !isLocked && !isDragging,
            // 정렬 중
            'widget-sorting transition-transform duration-300': isSorting,
            // 선택 상태
            'ring-2 ring-blue-500': isSelected && isEditMode,
          },
          className
        )}
        onClick={handleClick}
        {...ariaProps}
        {...(isLocked || !isEditMode ? {} : { ...attributes, ...listeners })}
      >
        {/* 드래그 중 원본 위젯 표시 */}
        {isDragging && (
          <>
            <div className="absolute inset-0 border-2 border-dashed border-gray-400 rounded-lg pointer-events-none" />
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
              <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                이동 중
              </div>
            </div>
          </>
        )}
        
        {/* 드롭 영역 표시 */}
        {isOver && !isDragging && (
          <div className="absolute inset-0 bg-green-400 bg-opacity-10 rounded-lg pointer-events-none">
            <div className="absolute inset-0 border-2 border-green-500 border-dashed rounded-lg" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                여기에 놓기
              </div>
            </div>
          </div>
        )}
        
        {/* 위젯 콘텐츠 */}
        {children}
        
        {/* 리사이즈 핸들 (편집 모드에서 선택된 위젯에만 표시) */}
        {isEditMode && isSelected && !isLocked && (
          <>
            {/* 변 핸들 */}
            <ResizeHandle position="top" onResize={handleResize('top')} onResizeEnd={handleResizeEnd} disabled={isLocked} />
            <ResizeHandle position="right" onResize={handleResize('right')} onResizeEnd={handleResizeEnd} disabled={isLocked} />
            <ResizeHandle position="bottom" onResize={handleResize('bottom')} onResizeEnd={handleResizeEnd} disabled={isLocked} />
            <ResizeHandle position="left" onResize={handleResize('left')} onResizeEnd={handleResizeEnd} disabled={isLocked} />
            
            {/* 모서리 핸들 */}
            <ResizeHandle position="top-left" onResize={handleResize('top-left')} onResizeEnd={handleResizeEnd} disabled={isLocked} />
            <ResizeHandle position="top-right" onResize={handleResize('top-right')} onResizeEnd={handleResizeEnd} disabled={isLocked} />
            <ResizeHandle position="bottom-left" onResize={handleResize('bottom-left')} onResizeEnd={handleResizeEnd} disabled={isLocked} />
            <ResizeHandle position="bottom-right" onResize={handleResize('bottom-right')} onResizeEnd={handleResizeEnd} disabled={isLocked} />
          </>
        )}
        
        {/* 리사이징 중 시각적 피드백 */}
        {isResizing && tempSize && (
          <>
            <div 
              className={cn(
                "absolute inset-0 border-2 rounded-lg transition-colors duration-150 pointer-events-none z-40",
                isColliding 
                  ? "bg-red-100/30 border-red-400 border-dashed" 
                  : "bg-blue-100/30 border-blue-400 border-dashed"
              )}
            >
              {/* 그리드 라인 표시 */}
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                {/* 수직선 */}
                {Array.from({ length: tempSize.width - 1 }, (_, i) => (
                  <div
                    key={`v-${i}`}
                    className={cn(
                      "absolute top-0 bottom-0 w-px",
                      isColliding ? "bg-red-300/50" : "bg-blue-300/50"
                    )}
                    style={{
                      left: `${((i + 1) / tempSize.width) * 100}%`
                    }}
                  />
                ))}
                
                {/* 수평선 */}
                {Array.from({ length: tempSize.height - 1 }, (_, i) => (
                  <div
                    key={`h-${i}`}
                    className={cn(
                      "absolute left-0 right-0 h-px",
                      isColliding ? "bg-red-300/50" : "bg-blue-300/50"
                    )}
                    style={{
                      top: `${((i + 1) / tempSize.height) * 100}%`
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* 크기 표시 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm",
                  isColliding
                    ? "bg-red-500/90 text-white"
                    : "bg-blue-500/90 text-white"
                )}
              >
                {tempSize.width} × {tempSize.height}
              </div>
            </div>
            
            {/* 충돌 경고 */}
            {isColliding && (
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
                <div className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg animate-pulse flex items-center gap-1">
                  <span>⚠️</span>
                  <span>충돌 감지됨</span>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* 스크린 리더용 설명 */}
        <span 
          id={`${id}-description`}
          className="sr-only"
          aria-live="polite"
        >
          {isDragging 
            ? '위젯을 이동 중입니다. 화살표 키로 위치를 선택하고 스페이스바를 눌러 놓으세요.'
            : '위젯을 이동하려면 스페이스바를 누른 후 화살표 키를 사용하세요. 스페이스바를 다시 눌러 배치를 완료하세요.'
          }
        </span>
      </motion.div>
    </AnimatePresence>
  )
})

// 컴포넌트 export
export default DraggableWidget