'use client'

import React, { ReactNode, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { GridSize } from '@/types/dashboard'
import { LazyWidget } from './LazyWidget'
import { useGridNavigation, useKeyboardShortcuts } from '@/lib/dashboard/keyboard-navigation'

// Re-export for backward compatibility
export type { GridSize }

interface GridLayoutProps {
  children: ReactNode
  gridSize?: GridSize
  gap?: number
  padding?: number
  className?: string
  enableKeyboardNavigation?: boolean
  onWidgetSelect?: (index: number) => void
  onWidgetMove?: (from: number, to: number) => void
}

export function GridLayout({
  children,
  gridSize = '3x3',
  gap = 16,
  padding = 16,
  className,
  enableKeyboardNavigation = true,
  onWidgetSelect,
  onWidgetMove
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
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLElement[]>([])
  
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
  
  // 키보드 네비게이션 설정
  const { currentIndex, setFocus } = useGridNavigation(
    itemsRef,
    gridCols,
    {
      onSelect: onWidgetSelect,
      onMove: onWidgetMove,
      circular: true
    }
  )
  
  // 그리드 아이템에 포커스 가능 속성 추가
  useEffect(() => {
    if (!containerRef.current || !enableKeyboardNavigation) return
    
    const items = containerRef.current.querySelectorAll<HTMLElement>('.grid-item')
    itemsRef.current = Array.from(items)
    
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1')
      item.setAttribute('role', 'gridcell')
      item.setAttribute('aria-label', `위젯 ${index + 1}`)
      
      item.addEventListener('focus', () => {
        items.forEach((el, i) => {
          el.setAttribute('tabindex', i === index ? '0' : '-1')
        })
      })
    })
  }, [children, enableKeyboardNavigation])
  
  // 키보드 단축키 설정
  useKeyboardShortcuts([
    {
      key: 'Home',
      handler: () => setFocus(0)
    },
    {
      key: 'End', 
      handler: () => setFocus(itemsRef.current.length - 1)
    }
  ])

  return (
    <div
      ref={containerRef}
      className={cn(
        'grid-layout-container',
        'dashboard-grid dashboard-grid-container grid w-full h-full auto-rows-fr',
        getGridClassName(gridSize),
        className
      )}
      style={{
        ...gridStyles,
        gap: `var(--grid-gap)`,
        padding: `var(--grid-padding)`,
      }}
      role="grid"
      aria-label="대시보드 위젯 그리드"
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
  lazy?: boolean
  height?: number | string
  widgetId?: string
  widgetName?: string
}

export function GridItem({
  children,
  colSpan = 1,
  rowSpan = 1,
  className,
  lazy = false,
  height = 300,
  widgetId,
  widgetName
}: GridItemProps) {
  const content = (
    <div
      className={cn(
        'grid-item relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
        'focus:ring-2 focus:ring-[var(--color-brand-primary-start)] focus:outline-none',
        'transition-all duration-200',
        className
      )}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
      data-widget-id={widgetId}
      aria-label={widgetName || '위젯'}
    >
      {children}
    </div>
  )

  if (lazy) {
    return <LazyWidget height={height}>{content}</LazyWidget>
  }

  return content
}