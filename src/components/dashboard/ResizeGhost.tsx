'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ResizeGhostProps {
  position: { x: number; y: number }
  size: { width: number; height: number }
  cellSize: number
  isColliding?: boolean
  className?: string
}

export function ResizeGhost({ 
  position,
  size,
  cellSize,
  isColliding = false,
  className
}: ResizeGhostProps) {
  const pixelWidth = size.width * cellSize + (size.width - 1) * 16 // 16px gap
  const pixelHeight = size.height * cellSize + (size.height - 1) * 16
  const pixelX = position.x * (cellSize + 16)
  const pixelY = position.y * (cellSize + 16)

  return (
    <div
      className={cn(
        'absolute pointer-events-none z-40 transition-all duration-150',
        className
      )}
      style={{
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
        transform: `translate(${pixelX}px, ${pixelY}px)`,
      }}
    >
      {/* 고스트 본체 */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg border-2 transition-colors duration-150',
          isColliding 
            ? 'bg-red-100/30 border-red-400 border-dashed' 
            : 'bg-blue-100/30 border-blue-400 border-dashed'
        )}
      >
        {/* 그리드 라인 표시 */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          {/* 수직선 */}
          {Array.from({ length: size.width - 1 }, (_, i) => (
            <div
              key={`v-${i}`}
              className={cn(
                'absolute top-0 bottom-0 w-px',
                isColliding ? 'bg-red-300/50' : 'bg-blue-300/50'
              )}
              style={{
                left: `${((i + 1) * cellSize + i * 16) / pixelWidth * 100}%`
              }}
            />
          ))}
          
          {/* 수평선 */}
          {Array.from({ length: size.height - 1 }, (_, i) => (
            <div
              key={`h-${i}`}
              className={cn(
                'absolute left-0 right-0 h-px',
                isColliding ? 'bg-red-300/50' : 'bg-blue-300/50'
              )}
              style={{
                top: `${((i + 1) * cellSize + i * 16) / pixelHeight * 100}%`
              }}
            />
          ))}
        </div>
        
        {/* 크기 라벨 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm backdrop-blur-sm',
              isColliding
                ? 'bg-red-500/90 text-white'
                : 'bg-blue-500/90 text-white'
            )}
          >
            {size.width} × {size.height}
          </div>
        </div>
        
        {/* 충돌 경고 */}
        {isColliding && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg animate-pulse">
              ⚠️ 충돌 감지됨
            </div>
          </div>
        )}
      </div>
      
      {/* 코너 인디케이터 */}
      <div className="absolute -top-1 -left-1 w-3 h-3 border-2 border-blue-500 bg-white rounded-full" />
      <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-blue-500 bg-white rounded-full" />
      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-2 border-blue-500 bg-white rounded-full" />
      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-2 border-blue-500 bg-white rounded-full" />
    </div>
  )
}