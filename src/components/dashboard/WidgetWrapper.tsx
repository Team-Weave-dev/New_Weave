'use client'

import React, { ReactNode, useState } from 'react'
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

interface WidgetWrapperProps {
  id: string
  children: ReactNode
  title?: string
  description?: string
  className?: string
  locked?: boolean
  onRemove?: () => void
  onConfigure?: () => void
  isDragging?: boolean
}

export function WidgetWrapper({
  id,
  children,
  title,
  description,
  className,
  locked = false,
  onRemove,
  onConfigure,
  isDragging = false,
}: WidgetWrapperProps) {
  const { 
    isEditMode, 
    selectedWidgetId, 
    selectWidget,
    removeWidget,
    lockWidget 
  } = useDashboardStore()
  
  const [isHovered, setIsHovered] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const isSelected = selectedWidgetId === id

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
    </div>
  )
}