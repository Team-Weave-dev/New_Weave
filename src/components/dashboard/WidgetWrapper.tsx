'use client'

import React, { ReactNode, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { 
  X, 
  Lock, 
  Unlock, 
  Settings, 
  Move,
  Maximize2,
  Minimize2 
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { ResizeHandle } from './ResizeHandle'
import { WidgetRegistry } from '@/lib/dashboard/WidgetRegistry'

interface WidgetWrapperProps {
  id: string
  type?: string
  children: ReactNode
  title?: string
  description?: string
  className?: string
  locked?: boolean
  onRemove?: () => void
  onConfigure?: () => void
  isDragging?: boolean
  position?: { width: number; height: number }
}

export function WidgetWrapper({
  id,
  type,
  children,
  title,
  description,
  className,
  locked = false,
  onRemove,
  onConfigure,
  isDragging = false,
  position,
}: WidgetWrapperProps) {
  const { 
    isEditMode, 
    selectedWidgetId, 
    selectWidget,
    removeWidget,
    lockWidget,
    resizeWidget,
    currentLayout
  } = useDashboardStore()
  
  const [isHovered, setIsHovered] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [tempSize, setTempSize] = useState<{ width: number; height: number } | null>(null)
  
  const isSelected = selectedWidgetId === id
  
  // 위젯 메타데이터 가져오기
  const widgetMetadata = type ? WidgetRegistry.getMetadata(type as any) : null
  const minSize = widgetMetadata?.minSize || { width: 1, height: 1 }
  const maxSize = widgetMetadata?.maxSize || { width: 4, height: 4 }
  
  // 그리드 컬럼 수 계산
  const gridColumns = currentLayout?.gridSize === '2x2' ? 2 :
                     currentLayout?.gridSize === '3x3' ? 3 :
                     currentLayout?.gridSize === '4x4' ? 4 : 5
  
  // 현재 위젯 크기
  const currentWidget = currentLayout?.widgets.find(w => w.id === id)
  const currentSize = currentWidget?.position || { width: 1, height: 1 }

  const handleRemove = () => {
    if (onRemove) {
      onRemove()
    } else {
      removeWidget(id)
    }
  }

  const handleLockToggle = () => {
    lockWidget(id, !locked)
  }

  const handleSelect = () => {
    if (isEditMode && !locked) {
      selectWidget(isSelected ? null : id)
    }
  }

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen)
  }

  // 리사이즈 핸들러
  const handleResize = useCallback((position: string) => (deltaX: number, deltaY: number) => {
    if (!currentWidget) return
    
    const gridCellWidth = 100 / gridColumns // 그리드 셀 너비 (퍼센트)
    const gridCellHeight = 100 / gridColumns // 그리드 셀 높이 (퍼센트)
    
    // 픽셀을 그리드 단위로 변환
    const deltaGridX = Math.round(deltaX / (window.innerWidth * gridCellWidth / 100))
    const deltaGridY = Math.round(deltaY / (window.innerHeight * gridCellHeight / 100))
    
    if (deltaGridX === 0 && deltaGridY === 0) return
    
    let newWidth = currentSize.width
    let newHeight = currentSize.height
    
    // 위치에 따라 크기 조정
    if (position.includes('right')) {
      newWidth = Math.max(minSize.width, Math.min(currentSize.width + deltaGridX, maxSize.width))
    }
    if (position.includes('left')) {
      newWidth = Math.max(minSize.width, Math.min(currentSize.width + deltaGridX, maxSize.width))
    }
    if (position.includes('bottom')) {
      newHeight = Math.max(minSize.height, Math.min(currentSize.height + deltaGridY, maxSize.height))
    }
    if (position.includes('top')) {
      newHeight = Math.max(minSize.height, Math.min(currentSize.height + deltaGridY, maxSize.height))
    }
    
    // 그리드 경계 체크
    const maxAllowedWidth = gridColumns - currentWidget.position.x
    const maxAllowedHeight = gridColumns - currentWidget.position.y
    newWidth = Math.min(newWidth, maxAllowedWidth)
    newHeight = Math.min(newHeight, maxAllowedHeight)
    
    setTempSize({ width: newWidth, height: newHeight })
    setIsResizing(true)
  }, [currentWidget, currentSize, gridColumns, minSize, maxSize])

  const handleResizeEnd = useCallback(() => {
    if (tempSize && currentWidget) {
      resizeWidget(id, tempSize)
    }
    setTempSize(null)
    setIsResizing(false)
  }, [id, tempSize, currentWidget, resizeWidget])

  const displaySize = tempSize || currentSize

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden rounded-lg border bg-white transition-all duration-200',
        {
          'border-blue-500 shadow-lg': isSelected && isEditMode,
          'border-gray-200': !isSelected || !isEditMode,
          'opacity-50': isDragging,
          'hover:shadow-md': isEditMode && !locked,
          'cursor-move': isEditMode && !locked,
          'fixed inset-4 z-50': isFullscreen,
        },
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
    >
      {/* 편집 모드 오버레이 */}
      {isEditMode && (
        <div
          className={cn(
            'absolute inset-0 z-10 pointer-events-none transition-opacity duration-200',
            {
              'bg-blue-500/10': isSelected,
              'bg-gray-500/5': !isSelected && isHovered,
            }
          )}
        />
      )}

      {/* 헤더 (편집 모드에서만 표시) */}
      {isEditMode && (isHovered || isSelected) && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between bg-white/90 backdrop-blur-sm p-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {/* 드래그 핸들 */}
            {!locked && (
              <div className="cursor-move p-1 hover:bg-gray-100 rounded">
                <Move className="h-4 w-4 text-gray-500" />
              </div>
            )}
            
            {/* 위젯 제목 */}
            {title && (
              <span className="text-sm font-medium text-gray-700">
                {title}
              </span>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-1">
            {/* 전체화면 토글 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleFullscreenToggle()
              }}
              className="h-6 w-6 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>

            {/* 설정 버튼 */}
            {onConfigure && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onConfigure()
                }}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}

            {/* 잠금 토글 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleLockToggle()
              }}
              className="h-6 w-6 p-0"
            >
              {locked ? (
                <Lock className="h-3 w-3 text-yellow-600" />
              ) : (
                <Unlock className="h-3 w-3" />
              )}
            </Button>

            {/* 삭제 버튼 */}
            {!locked && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                className="h-6 w-6 p-0 hover:bg-[var(--color-status-error)]/10"
              >
                <X className="h-3 w-3 text-[var(--color-status-error)]" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 위젯 콘텐츠 */}
      <div 
        className={cn(
          'h-full w-full overflow-auto',
          {
            'pt-10': isEditMode && (isHovered || isSelected), // 헤더 공간 확보
            'pointer-events-none': isEditMode && !isSelected,
          }
        )}
      >
        {children}
      </div>

      {/* 선택 인디케이터 */}
      {isSelected && isEditMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-2 h-2 bg-blue-500" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500" />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-blue-500" />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500" />
        </div>
      )}

      {/* 잠금 상태 표시 */}
      {locked && !isEditMode && (
        <div className="absolute top-2 right-2">
          <Lock className="h-3 w-3 text-gray-400" />
        </div>
      )}

      {/* 리사이즈 핸들 (편집 모드에서만 표시) */}
      {isEditMode && isSelected && !locked && !isFullscreen && (
        <>
          <ResizeHandle
            position="right"
            onResize={handleResize('right')}
            onResizeEnd={handleResizeEnd}
            disabled={locked}
          />
          <ResizeHandle
            position="bottom"
            onResize={handleResize('bottom')}
            onResizeEnd={handleResizeEnd}
            disabled={locked}
          />
          <ResizeHandle
            position="bottom-right"
            onResize={handleResize('bottom-right')}
            onResizeEnd={handleResizeEnd}
            disabled={locked}
          />
        </>
      )}

      {/* 크기 조정 중 프리뷰 */}
      {isResizing && tempSize && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 bg-black/75 text-white px-2 py-1 rounded text-xs">
          {displaySize.width} × {displaySize.height}
        </div>
      )}
    </div>
  )
}