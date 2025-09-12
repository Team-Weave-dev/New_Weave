'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Widget } from '@/types/dashboard'

interface DragPreviewProps {
  widget: Widget
  isDragging?: boolean
  className?: string
}

export function DragPreview({ widget, isDragging = true, className }: DragPreviewProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-all',
        'bg-gradient-to-br from-blue-50/90 to-indigo-50/90',
        'dark:from-blue-900/20 dark:to-indigo-900/20',
        'backdrop-blur-sm shadow-2xl',
        {
          'border-blue-400 dark:border-blue-500': isDragging,
          'scale-105': isDragging,
          'animate-pulse': isDragging,
        },
        className
      )}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {/* 중앙 정보 표시 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          {/* 위젯 타입 아이콘 */}
          <div className="mb-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 dark:bg-blue-400/20">
              <span className="text-2xl">📦</span>
            </div>
          </div>
          
          {/* 위젯 정보 */}
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {widget.type}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            이동 중...
          </p>
        </div>
      </div>

      {/* 코너 인디케이터 */}
      <div className="absolute top-2 left-2 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
      <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
      <div className="absolute bottom-2 left-2 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
      <div className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />

      {/* 그리드 가이드라인 */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path 
                d="M 20 0 L 0 0 0 20" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="0.5" 
                className="text-blue-300/30 dark:text-blue-500/30"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  )
}

// 드롭 영역 하이라이트 컴포넌트
interface DropZoneHighlightProps {
  isActive: boolean
  isValid: boolean
  className?: string
}

export function DropZoneHighlight({ isActive, isValid, className }: DropZoneHighlightProps) {
  if (!isActive) return null

  return (
    <div
      className={cn(
        'absolute inset-0 rounded-lg border-2 transition-all duration-200 pointer-events-none z-10',
        {
          'border-green-400 bg-green-50/50 dark:bg-green-900/20': isValid,
          'border-red-400 bg-red-50/50 dark:bg-red-900/20': !isValid,
          'animate-pulse': isActive,
        },
        className
      )}
    >
      {/* 중앙 아이콘 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isValid ? (
          <div className="rounded-full bg-green-500/20 p-3">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="rounded-full bg-red-500/20 p-3">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

// 그리드 플레이스홀더 컴포넌트
interface GridPlaceholderProps {
  width: number
  height: number
  className?: string
}

export function GridPlaceholder({ width, height, className }: GridPlaceholderProps) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600',
        'bg-gray-100/50 dark:bg-gray-800/50',
        'transition-all duration-300',
        className
      )}
      style={{
        gridColumn: `span ${width}`,
        gridRow: `span ${height}`,
      }}
    >
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-400">빈 공간</p>
      </div>
    </div>
  )
}