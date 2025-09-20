'use client'

import React, { ReactNode, useState, useCallback, useRef, useEffect } from 'react'
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
import { ResizeHandle } from './ResizeHandle'
import { ResizeGhost } from './ResizeGhost'
import { hasCollisionWithWidgets } from '@/lib/dashboard/collisionDetection'
import { HoverEffect } from './animations/HoverEffect'
import { RippleEffect } from './animations/RippleEffect'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { useA11yAnnouncements } from '@/hooks/useA11yAnnouncements'
import { LiveRegion } from './a11y/LiveRegion'

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
    currentLayout,
    focusedWidgetId,
    setFocusedWidget
  } = useDashboardStore()
  
  const [isHovered, setIsHovered] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [tempSize, setTempSize] = useState<{ width: number; height: number } | null>(null)
  const [tempPosition, setTempPosition] = useState<{ x: number; y: number } | null>(null)
  const [isColliding, setIsColliding] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const isSelected = selectedWidgetId === id
  const isFocused = focusedWidgetId === id
  
  // 접근성 알림 훅
  const { announceWidget, announceError, announceHelp } = useA11yAnnouncements()
  const [liveMessage, setLiveMessage] = useState<string | null>(null)
  
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
  const currentSize = tempSize || currentWidget?.position || { width: 1, height: 1 }
  
  // 그리드 셀 크기 계산
  const [cellSize, setCellSize] = useState(0)
  
  useEffect(() => {
    const calculateCellSize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.closest('.grid-layout-container')
        if (parent) {
          const containerWidth = parent.clientWidth
          const gap = 16 // Tailwind gap-4
          const availableWidth = containerWidth - gap * (gridColumns - 1)
          setCellSize(availableWidth / gridColumns)
        }
      }
    }
    
    calculateCellSize()
    window.addEventListener('resize', calculateCellSize)
    return () => window.removeEventListener('resize', calculateCellSize)
  }, [gridColumns])
  
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
    announceWidget('remove', title || type)
  }

  const handleLockToggle = () => {
    lockWidget(id, !locked)
    announceWidget(!locked ? 'lock' : 'unlock', title || type)
  }

  const handleSelect = () => {
    if (isEditMode && !locked && !isResizing) {
      selectWidget(isSelected ? null : id)
      announceWidget(isSelected ? 'deselect' : 'select', title || type)
    }
  }
  
  // 리사이즈 핸들러
  const handleResize = useCallback((position: string) => (deltaX: number, deltaY: number) => {
    if (!currentWidget || locked || !cellSize) return
    
    const gridDeltaX = Math.round(deltaX / (cellSize + 16)) // 16px gap 포함
    const gridDeltaY = Math.round(deltaY / (cellSize + 16))
    
    let newWidth = currentWidget.position.width
    let newHeight = currentWidget.position.height
    let newX = currentWidget.position.x
    let newY = currentWidget.position.y
    
    switch (position) {
      case 'right':
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, currentWidget.position.width + gridDeltaX))
        break
      case 'left':
        const potentialWidthLeft = currentWidget.position.width - gridDeltaX
        if (potentialWidthLeft >= minSize.width && potentialWidthLeft <= maxSize.width) {
          newWidth = potentialWidthLeft
          newX = Math.max(0, currentWidget.position.x + gridDeltaX)
        }
        break
      case 'bottom':
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, currentWidget.position.height + gridDeltaY))
        break
      case 'top':
        const potentialHeightTop = currentWidget.position.height - gridDeltaY
        if (potentialHeightTop >= minSize.height && potentialHeightTop <= maxSize.height) {
          newHeight = potentialHeightTop
          newY = Math.max(0, currentWidget.position.y + gridDeltaY)
        }
        break
      case 'bottom-right':
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, currentWidget.position.width + gridDeltaX))
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, currentWidget.position.height + gridDeltaY))
        break
      case 'bottom-left':
        const potentialWidthBL = currentWidget.position.width - gridDeltaX
        if (potentialWidthBL >= minSize.width && potentialWidthBL <= maxSize.width) {
          newWidth = potentialWidthBL
          newX = Math.max(0, currentWidget.position.x + gridDeltaX)
        }
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, currentWidget.position.height + gridDeltaY))
        break
      case 'top-right':
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, currentWidget.position.width + gridDeltaX))
        const potentialHeightTR = currentWidget.position.height - gridDeltaY
        if (potentialHeightTR >= minSize.height && potentialHeightTR <= maxSize.height) {
          newHeight = potentialHeightTR
          newY = Math.max(0, currentWidget.position.y + gridDeltaY)
        }
        break
      case 'top-left':
        const potentialWidthTL = currentWidget.position.width - gridDeltaX
        const potentialHeightTL = currentWidget.position.height - gridDeltaY
        if (potentialWidthTL >= minSize.width && potentialWidthTL <= maxSize.width) {
          newWidth = potentialWidthTL
          newX = Math.max(0, currentWidget.position.x + gridDeltaX)
        }
        if (potentialHeightTL >= minSize.height && potentialHeightTL <= maxSize.height) {
          newHeight = potentialHeightTL
          newY = Math.max(0, currentWidget.position.y + gridDeltaY)
        }
        break
    }
    
    // 그리드 경계 체크
    newWidth = Math.min(newWidth, gridColumns - newX)
    newHeight = Math.min(newHeight, gridColumns - newY)
    
    // 임시 크기와 위치 업데이트 (실시간 프리뷰)
    setTempSize({ width: newWidth, height: newHeight })
    setTempPosition({ x: newX, y: newY })
    setIsResizing(true)
    
    // 충돌 감지
    const collision = hasCollisionWithWidgets(
      { x: newX, y: newY, width: newWidth, height: newHeight },
      currentLayout?.widgets || [],
      currentWidget.id
    )
    setIsColliding(collision)
    
    // 충돌 시 스크린리더 알림
    if (collision && !isColliding) {
      announceWidget('collision')
    }
    
    // 실제 위젯 크기 업데이트
    if (newX !== currentWidget.position.x || newY !== currentWidget.position.y) {
      // 위치가 변경된 경우 (left, top 리사이즈)
      const updatedWidget = {
        ...currentWidget,
        position: {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        }
      }
      const otherWidgets = currentLayout?.widgets.filter(w => w.id !== id) || []
      const newWidgets = [...otherWidgets, updatedWidget]
      // Store update logic would go here
    } else {
      // 크기만 변경된 경우
      resizeWidget(id, { width: newWidth, height: newHeight })
    }
  }, [currentWidget, locked, cellSize, minSize, maxSize, gridColumns, resizeWidget, id, currentLayout])
  
  const handleResizeEnd = useCallback(() => {
    if (isResizing && tempSize) {
      announceWidget('resize', title || type)
    }
    setIsResizing(false)
    setTempSize(null)
    setTempPosition(null)
    setIsColliding(false)
  }, [isResizing, tempSize, title, type, announceWidget])

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen)
    announceWidget(!isFullscreen ? 'fullscreen-on' : 'fullscreen-off', title || type)
  }

  // 키보드 네비게이션 훅
  const { isFocused: keyboardFocused, handleTabNavigation } = useKeyboardNavigation({
    widgetId: id,
    isLocked: locked,
    isSelected,
    onRemove: handleRemove,
    onConfigure,
    onFullscreen: handleFullscreenToggle,
  })

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

  const widgetContent = (
    <div
      ref={containerRef}
      className={cn(
        'relative h-full w-full overflow-hidden rounded-lg border bg-white transition-all duration-200',
        {
          'border-blue-500 shadow-lg': isSelected && isEditMode,
          'border-gray-200': !isSelected || !isEditMode,
          'opacity-50': isDragging,
          'cursor-move': isEditMode && !locked && !isResizing,
          'fixed inset-4 z-50': isFullscreen,
          'ring-2 ring-blue-400 ring-offset-2': isFocused && isEditMode, // 키보드 포커스 표시
        },
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
      onFocus={() => {
        if (isEditMode) {
          setFocusedWidget(id)
          // 포커스 시 도움말 제공
          announceHelp(`${title || type || '위젯'}. 스페이스바로 선택, Delete로 삭제, 화살표 키로 이동, Shift+화살표로 크기 조정`)
        }
      }}
      onBlur={() => isEditMode && setFocusedWidget(null)}
      tabIndex={isEditMode ? 0 : -1}
      role={isEditMode ? 'application' : 'region'}
      aria-roledescription={isEditMode ? '편집 가능한 위젯' : '대시보드 위젯'}
      aria-label={`${title || type || '위젯'} ${currentSizeType.label} 크기`}
      aria-selected={isEditMode ? isSelected : undefined}
      aria-describedby={isEditMode ? `widget-desc-${id}` : undefined}
      aria-disabled={locked}
      aria-grabbed={isDragging}
      data-widget-id={id}
      data-widget-type={type}
      data-widget-locked={locked}
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
              <div 
                className="cursor-move p-1 hover:bg-gray-100 rounded min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors"
                role="button"
                tabIndex={0}
                aria-label="위젯 드래그 핸들"
                aria-roledescription="드래그하여 위젯 이동"
              >
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
                  aria-label="위젯 크기 변경 메뉴 열기"
                  aria-expanded={showSizeMenu}
                  aria-haspopup="menu"
                >
                  <Expand className="h-3 w-3" />
                </Button>
                
                {/* 크기 선택 메뉴 */}
                {showSizeMenu && (
                  <div 
                    className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50 min-w-[120px]"
                    role="menu"
                    aria-label="위젯 크기 선택">
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
                          role="menuitem"
                          aria-label={`크기 ${type.label}로 변경`}
                          aria-disabled={isDisabled}
                          aria-current={isActive ? 'true' : undefined}
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

      {/* 스크린리더용 설명 및 상태 정보 */}
      {isEditMode && (
        <div id={`widget-desc-${id}`} className="sr-only">
          <div>{description || `${title || type} 위젯`}</div>
          <div>현재 크기: {currentSizeType.label}</div>
          <div>상태: {locked ? '잠김' : '편집 가능'}</div>
          {isSelected && <div>선택됨</div>}
          {isFocused && <div>포커스됨</div>}
          <div role="region" aria-label="키보드 단축키">
            <ul>
              <li>스페이스바: 위젯 선택/선택 해제</li>
              <li>Delete 또는 Backspace: 위젯 삭제</li>
              <li>화살표 키: 위젯 이동</li>
              <li>Shift + 화살표 키: 위젯 크기 조정</li>
              <li>L: 위젯 잠금/잠금 해제</li>
              <li>F: 전체화면 토글</li>
              <li>Escape: 선택 해제</li>
            </ul>
          </div>
        </div>
      )}

      {/* 키보드 포커스 인디케이터 */}
      {isFocused && isEditMode && !isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-lg" />
        </div>
      )}

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
      
      {/* 리사이즈 핸들 (편집 모드에서 선택된 위젯에만 표시) */}
      {isEditMode && isSelected && !locked && (
        <>
          {/* 변 핸들 */}
          <ResizeHandle
            position="top"
            onResize={handleResize('top')}
            onResizeEnd={handleResizeEnd}
            disabled={locked || !isEditMode}
          />
          <ResizeHandle
            position="right"
            onResize={handleResize('right')}
            onResizeEnd={handleResizeEnd}
            disabled={locked || !isEditMode}
          />
          <ResizeHandle
            position="bottom"
            onResize={handleResize('bottom')}
            onResizeEnd={handleResizeEnd}
            disabled={locked || !isEditMode}
          />
          <ResizeHandle
            position="left"
            onResize={handleResize('left')}
            onResizeEnd={handleResizeEnd}
            disabled={locked || !isEditMode}
          />
          
          {/* 모서리 핸들 */}
          <ResizeHandle
            position="top-left"
            onResize={handleResize('top-left')}
            onResizeEnd={handleResizeEnd}
            disabled={locked || !isEditMode}
          />
          <ResizeHandle
            position="top-right"
            onResize={handleResize('top-right')}
            onResizeEnd={handleResizeEnd}
            disabled={locked || !isEditMode}
          />
          <ResizeHandle
            position="bottom-left"
            onResize={handleResize('bottom-left')}
            onResizeEnd={handleResizeEnd}
            disabled={locked || !isEditMode}
          />
          <ResizeHandle
            position="bottom-right"
            onResize={handleResize('bottom-right')}
            onResizeEnd={handleResizeEnd}
            disabled={locked || !isEditMode}
          />
        </>
      )}
      
      {/* 리사이징 중 시각적 피드백 */}
      {isResizing && tempSize && (
        <>
          {/* 리사이즈 오버레이 */}
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
    </div>
  )

  // 편집 모드가 아닐 때만 HoverEffect 적용
  if (!isEditMode && !isDragging) {
    return (
      <HoverEffect 
        scaleAmount={1.01} 
        shadowIntensity="medium"
        disabled={locked}
      >
        <RippleEffect disabled={locked}>
          {widgetContent}
        </RippleEffect>
      </HoverEffect>
    )
  }

  // 편집 모드일 때는 애니메이션 없이 반환
  return (
    <>
      {widgetContent}
      {/* 스크린리더 알림용 라이브 리전 */}
      <LiveRegion 
        message={liveMessage} 
        politeness={isColliding ? 'assertive' : 'polite'}
        clearAfter={3000}
      />
    </>
  )
}