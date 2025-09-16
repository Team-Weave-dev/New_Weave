'use client'

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { GridSize } from '@/types/dashboard'

// Re-export for backward compatibility
export type { GridSize }

interface GridLayoutProps {
  children: ReactNode
  gridSize?: GridSize
  gap?: number
  padding?: number
  className?: string
}

export function GridLayout({
  children,
  gridSize = '3x3',
  gap = 16,
  padding = 16,
  className
}: GridLayoutProps) {
  const getGridCols = (size: GridSize) => {
    const sizeMap = {
      '2x2': 2,
      '3x3': 3,
      '4x4': 4,
      '5x5': 5,
    }
    return sizeMap[size] || 3
  }
  
  const gridCols = getGridCols(gridSize)
  
  const gridStyles = {
    '--grid-cols': gridCols,
    '--grid-gap': `${gap}px`,
    '--grid-padding': `${padding}px`,
  } as React.CSSProperties

  const getGridClassName = (size: GridSize) => {
    const classMap = {
      '2x2': 'grid-cols-2',  // 모바일에서도 2x2 유지
      '3x3': 'grid-cols-2 sm:grid-cols-3',  // 모바일 2열, 태블릿부터 3열
      '4x4': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',  // 모바일 2열, 태블릿 3열, 데스크톱 4열
      '5x5': 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5',  // 점진적 증가
    }
    return classMap[size] || 'grid-cols-2 sm:grid-cols-3'  // 기본값도 모바일 2열
  }

  return (
    <div
      className={cn(
        'dashboard-grid dashboard-grid-container grid w-full h-full auto-rows-fr',
        getGridClassName(gridSize),
        className
      )}
      style={{
        ...gridStyles,
        gap: `var(--grid-gap)`,
        padding: `var(--grid-padding)`,
      }}
    >
      {children}
    </div>
  )
}

// 반응형 그리드 레이아웃 컴포넌트
export function ResponsiveGridLayout({
  children,
  gap = 16,
  padding = 16,
  className
}: Omit<GridLayoutProps, 'gridSize'>) {
  return (
    <div
      className={cn(
        'grid w-full h-full',
        'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        className
      )}
      style={{
        gap: `${gap}px`,
        padding: `${padding}px`,
      }}
    >
      {children}
    </div>
  )
}

// 그리드 아이템 컴포넌트
interface GridItemProps {
  children: ReactNode
  colSpan?: number
  rowSpan?: number
  className?: string
}

export function GridItem({
  children,
  colSpan = 1,
  rowSpan = 1,
  className
}: GridItemProps) {
  return (
    <div
      className={cn(
        'relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
        className
      )}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
    >
      {children}
    </div>
  )
}