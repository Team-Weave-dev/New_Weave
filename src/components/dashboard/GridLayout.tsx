'use client'

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type GridSize = '3x3' | '4x4'

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
  const gridCols = gridSize === '3x3' ? 3 : 4
  
  const gridStyles = {
    '--grid-cols': gridCols,
    '--grid-gap': `${gap}px`,
    '--grid-padding': `${padding}px`,
  } as React.CSSProperties

  return (
    <div
      className={cn(
        'grid w-full h-full',
        gridSize === '3x3' ? 'grid-cols-3' : 'grid-cols-4',
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