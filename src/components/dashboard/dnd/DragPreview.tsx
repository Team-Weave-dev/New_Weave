'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import Typography from '@/components/ui/Typography'
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
        'bg-gradient-to-br from-[var(--color-blue-50)]/90 to-[var(--color-indigo-50)]/90',
        'dark:from-[var(--color-blue-900)]/20 dark:to-[var(--color-indigo-900)]/20',
        'backdrop-blur-sm shadow-2xl',
        {
          'border-[var(--color-blue-400)] dark:border-[var(--color-blue-500)]': isDragging,
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
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-blue-500)]/20 dark:bg-[var(--color-blue-400)]/20">
              <span className="text-2xl">📦</span>
            </div>
          </div>
          
          {/* 위젯 정보 */}
          <Typography variant="h3" className="text-sm font-semibold text-[var(--color-gray-700)] dark:text-[var(--color-gray-300)]">
            {widget.type}
          </Typography>
          <Typography variant="body2" className="mt-1 text-xs text-[var(--color-gray-500)] dark:text-[var(--color-gray-400)]">
            이동 중...
          </Typography>
        </div>
      </div>

      {/* 코너 인디케이터 */}
      <div className="absolute top-2 left-2 h-2 w-2 rounded-full bg-[var(--color-blue-500)] animate-pulse" />
      <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--color-blue-500)] animate-pulse" />
      <div className="absolute bottom-2 left-2 h-2 w-2 rounded-full bg-[var(--color-blue-500)] animate-pulse" />
      <div className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-[var(--color-blue-500)] animate-pulse" />

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
                className="text-[var(--color-blue-300)]/30 dark:text-[var(--color-blue-500)]/30"
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
          'border-[var(--color-green-400)] bg-[var(--color-green-50)]/50 dark:bg-[var(--color-green-900)]/20': isValid,
          'border-[var(--color-red-400)] bg-[var(--color-red-50)]/50 dark:bg-[var(--color-red-900)]/20': !isValid,
          'animate-pulse': isActive,
        },
        className
      )}
    >
      {/* 중앙 아이콘 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isValid ? (
          <div className="rounded-full bg-[var(--color-green-500)]/20 p-3">
            <svg className="h-6 w-6 text-[var(--color-green-600)] dark:text-[var(--color-green-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="rounded-full bg-[var(--color-red-500)]/20 p-3">
            <svg className="h-6 w-6 text-[var(--color-red-600)] dark:text-[var(--color-red-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        'rounded-lg border-2 border-dashed border-[var(--color-gray-300)] dark:border-[var(--color-gray-600)]',
        'bg-[var(--color-gray-100)]/50 dark:bg-[var(--color-gray-800)]/50',
        'transition-all duration-300',
        className
      )}
      style={{
        gridColumn: `span ${width}`,
        gridRow: `span ${height}`,
      }}
    >
      <div className="flex h-full items-center justify-center">
        <Typography variant="body2" className="text-sm text-[var(--color-gray-400)]">빈 공간</Typography>
      </div>
    </div>
  )
}