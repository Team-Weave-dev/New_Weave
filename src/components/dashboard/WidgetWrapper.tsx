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
  Minimize2,
  Expand,
  Square,
  RectangleHorizontal,
  RectangleVertical
} from 'lucide-react'
import Button from '@/components/ui/Button'
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
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  
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
  
  // 위젯 크기 타입 정의
  const sizeTypes = [
    { width: 1, height: 1, label: '1×1', icon: Square },
    { width: 2, height: 1, label: '2×1', icon: RectangleHorizontal },
    { width: 1, height: 2, label: '1×2', icon: RectangleVertical },
    { width: 2, height: 2, label: '2×2', icon: Expand },
  ]

  // 크기 변경 핸들러
  const handleSizeChange = useCallback((newWidth: number, newHeight: number) => {
    if (!currentWidget) return
    
    // 그리드 경계 체크
    const maxAllowedWidth = gridColumns - currentWidget.position.x
    const maxAllowedHeight = gridColumns - currentWidget.position.y
    
    const finalWidth = Math.min(newWidth, maxAllowedWidth)
    const finalHeight = Math.min(newHeight, maxAllowedHeight)
    
    resizeWidget(id, { width: finalWidth, height: finalHeight })
    setShowSizeMenu(false)
  }, [currentWidget, gridColumns, resizeWidget, id])

  // 현재 크기 타입 찾기
  const currentSizeType = sizeTypes.find(
    type => type.width === currentSize.width && type.height === currentSize.height
  ) || sizeTypes[0]

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

  const displaySize = currentSize

  // 메뉴 외부 클릭 시 닫기
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSizeMenu && !(e.target as Element).closest('.size-menu-container')) {
        setShowSizeMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showSizeMenu])

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
              'bg-blue-500/5': isSelected,
              'bg-gray-500/3': !isSelected && isHovered,
            }
          )}
        />
      )}

      {/* 헤더 (편집 모드에서만 표시) */}
      {isEditMode && (isHovered || isSelected) && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between bg-white/90 backdrop-blur-sm p-1 border-b border-gray-200/50 transition-all duration-200">
          <div className="flex items-center gap-2">
            {/* 드래그 핸들 */}
            {!locked && (
              <div className="cursor-move p-1 hover:bg-gray-100 rounded min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors">
                <Move className="h-3 w-3 text-gray-500" />
              </div>
            )}
            
            {/* 위젯 제목 및 크기 정보 */}
            <div className="flex items-center gap-2">
              {title && (
                <span className="text-xs font-medium text-gray-600">
                  {title}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {currentSizeType.label}
              </span>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-1">
            {/* 크기 변경 버튼 */}
            {!locked && (
              <div className="relative size-menu-container">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSizeMenu(!showSizeMenu)
                  }}
                  className="min-w-[32px] min-h-[32px] p-0 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  title="크기 변경"
                >
                  <Expand className="h-3 w-3" />
                </Button>
                
                {/* 크기 선택 메뉴 */}
                {showSizeMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50 min-w-[120px]">
                    {sizeTypes.map((type) => {
                      const Icon = type.icon
                      const isActive = type.width === currentSize.width && type.height === currentSize.height
                      const isDisabled = currentWidget && (
                        type.width > gridColumns - currentWidget.position.x || 
                        type.height > gridColumns - currentWidget.position.y
                      )
                      
                      return (
                        <button
                          key={type.label}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSizeChange(type.width, type.height)
                          }}
                          disabled={isDisabled}
                          className={cn(
                            "flex items-center gap-2 w-full px-3 py-2 text-xs rounded transition-colors",
                            {
                              "bg-blue-50 text-blue-600": isActive,
                              "hover:bg-gray-100": !isActive && !isDisabled,
                              "opacity-50 cursor-not-allowed": isDisabled,
                            }
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{type.label}</span>
                          {isActive && (
                            <span className="ml-auto text-blue-600">✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* 전체화면 토글 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleFullscreenToggle()
              }}
              className="min-w-[32px] min-h-[32px] p-0 flex items-center justify-center hover:bg-gray-100 transition-colors"
              title={isFullscreen ? '전체화면 종료' : '전체화면'}
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
                className="min-w-[32px] min-h-[32px] p-0 flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="위젯 설정"
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
              className="min-w-[32px] min-h-[32px] p-0 flex items-center justify-center hover:bg-gray-100 transition-colors"
              title={locked ? '잠금 해제' : '위치 잠금'}
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
                  if (window.confirm('이 위젯을 삭제하시겠습니까?')) {
                    handleRemove()
                  }
                }}
                className="min-w-[32px] min-h-[32px] p-0 hover:bg-red-50 transition-colors"
                title="위젯 삭제"
              >
                <X className="h-3 w-3 text-red-500 hover:text-red-600" />
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
            'pt-8': isEditMode && (isHovered || isSelected), // 헤더 공간 확보
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

      {/* 크기 타입 표시 (편집 모드에서만) */}
      {isEditMode && !isHovered && !isSelected && (
        <div className="absolute bottom-2 right-2 z-10">
          <div className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium opacity-50">
            {currentSizeType.label}
          </div>
        </div>
      )}
    </div>
  )
}