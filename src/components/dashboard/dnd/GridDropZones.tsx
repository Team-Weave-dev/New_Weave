'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Widget, GridSize } from '@/types/dashboard'
import { getGridColumns } from '@/lib/dashboard/gridCalculations'

interface GridDropZonesProps {
  widgets: Widget[]
  activeWidgetId: string | null
  dragPreviewPosition: { x: number; y: number; width: number; height: number } | null
  gridSize: GridSize
  cellSize: number
  gap: number
  containerWidth?: number
  containerHeight?: number
}

interface DropZone {
  id: string
  x: number
  y: number
  width: number
  height: number
  isValid: boolean
  isColliding: boolean
}

export function GridDropZones({
  widgets,
  activeWidgetId,
  dragPreviewPosition,
  gridSize,
  cellSize,
  gap,
  containerWidth,
  containerHeight
}: GridDropZonesProps) {
  // 드롭 존 계산
  const dropZones = useMemo(() => {
    const zones: DropZone[] = []
    
    // activeWidgetId가 없으면 빈 배열 반환
    if (!activeWidgetId) return zones
    
    const activeWidget = widgets.find(w => w.id === activeWidgetId)
    if (!activeWidget) return zones
    
    const gridColumns = getGridColumns(gridSize)
    const gridRows = parseInt(gridSize.split('x')[1])
    
    // 드래그 중인 위젯이 차지할 크기
    const dragWidth = activeWidget.position.width
    const dragHeight = activeWidget.position.height
    
    // 다른 위젯들 (드래그 중인 위젯 제외)
    const otherWidgets = widgets.filter(w => w.id !== activeWidgetId)
    
    // 모든 가능한 그리드 위치를 검사
    for (let y = 0; y <= gridRows - dragHeight; y++) {
      for (let x = 0; x <= gridColumns - dragWidth; x++) {
        // 이 위치에서 충돌 여부 확인
        const hasCollision = otherWidgets.some(widget => {
          const wx = widget.position.x
          const wy = widget.position.y
          const ww = widget.position.width
          const wh = widget.position.height
          
          // 겹침 여부 체크
          return !(x + dragWidth <= wx ||
                  wx + ww <= x ||
                  y + dragHeight <= wy ||
                  wy + wh <= y)
        })
        
        // 현재 드래그 프리뷰 위치와 일치하는지 확인
        const isCurrentPosition = dragPreviewPosition &&
          dragPreviewPosition.x === x &&
          dragPreviewPosition.y === y
        
        zones.push({
          id: `zone-${x}-${y}`,
          x,
          y,
          width: dragWidth,
          height: dragHeight,
          isValid: !hasCollision,
          isColliding: hasCollision
        })
      }
    }
    
    return zones
  }, [widgets, activeWidgetId, gridSize, dragPreviewPosition])

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {dropZones.map(zone => {
        // 드래그 프리뷰와 동일한 위치면 표시하지 않음
        const isPreviewPosition = dragPreviewPosition &&
          zone.x === dragPreviewPosition.x &&
          zone.y === dragPreviewPosition.y
        
        if (isPreviewPosition) return null
        
        // 픽셀 위치 계산
        const pixelX = zone.x * (cellSize + gap)
        const pixelY = zone.y * (cellSize + gap)
        const pixelWidth = zone.width * cellSize + (zone.width - 1) * gap
        const pixelHeight = zone.height * cellSize + (zone.height - 1) * gap
        
        return (
          <div
            key={zone.id}
            className={cn(
              'absolute transition-all duration-200',
              zone.isValid ? 'opacity-30' : 'opacity-20'
            )}
            style={{
              left: `${pixelX}px`,
              top: `${pixelY}px`,
              width: `${pixelWidth}px`,
              height: `${pixelHeight}px`,
            }}
          >
            {/* 유효한 드롭 위치 */}
            {zone.isValid && (
              <div className="w-full h-full relative">
                {/* 파란색 점선 테두리 */}
                <div 
                  className={cn(
                    'absolute inset-0 border-2 border-dashed rounded-lg',
                    'border-blue-500 bg-blue-500/10',
                    'animate-pulse'
                  )}
                />
                {/* 코너 마커 */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
              </div>
            )}
            
            {/* 충돌 영역 */}
            {zone.isColliding && (
              <div className="w-full h-full relative">
                {/* 빨간색 오버레이 */}
                <div 
                  className={cn(
                    'absolute inset-0 rounded-lg',
                    'bg-red-500/20 border border-red-500/30'
                  )}
                />
                {/* 경고 아이콘 중앙에 표시 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-red-500 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )
      })}
      
      {/* 현재 드래그 프리뷰 위치 하이라이트 */}
      {dragPreviewPosition && (
        <div
          className="absolute transition-all duration-300"
          style={{
            left: `${dragPreviewPosition.x * (cellSize + gap)}px`,
            top: `${dragPreviewPosition.y * (cellSize + gap)}px`,
            width: `${dragPreviewPosition.width * cellSize + (dragPreviewPosition.width - 1) * gap}px`,
            height: `${dragPreviewPosition.height * cellSize + (dragPreviewPosition.height - 1) * gap}px`,
          }}
        >
          <div 
            className={cn(
              'w-full h-full rounded-lg border-2',
              'border-green-500 bg-green-500/20',
              'animate-pulse shadow-lg'
            )}
          />
        </div>
      )}
    </div>
  )
}