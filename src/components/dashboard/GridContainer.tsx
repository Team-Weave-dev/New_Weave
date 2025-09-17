'use client'

import React, { ReactNode, useRef, useCallback, useMemo, memo } from 'react'
import { cn } from '@/lib/utils'
import { GridSize } from '@/types/dashboard'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { DndProvider } from './dnd/DndProvider'
import { GridProvider } from '@/contexts/GridContext'
import { useGridCellSize } from '@/hooks/useGridCellSize'
import { useGridNavigation, useKeyboardShortcuts } from '@/lib/dashboard/keyboard-navigation'

interface GridContainerProps {
  children: ReactNode
  gridSize?: GridSize
  gap?: number
  padding?: number
  className?: string
  enableKeyboardNavigation?: boolean
  onWidgetSelect?: (index: number) => void
  onWidgetMove?: (from: number, to: number) => void
  enableDnd?: boolean
}

/**
 * GridContainer - 통합된 그리드 컨테이너 컴포넌트
 * GridLayout과 DndProvider의 기능을 통합하여 단일 책임 원칙 적용
 * Context API를 통해 그리드 정보를 하위 컴포넌트에 전달
 */
export const GridContainer = memo(function GridContainer({
  children,
  gridSize = '3x3',
  gap = 16,
  padding = 16,
  className,
  enableKeyboardNavigation = true,
  onWidgetSelect,
  onWidgetMove,
  enableDnd = true
}: GridContainerProps) {
  const { isEditMode, currentLayout } = useDashboardStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLElement[]>([])
  
  // 동적 셀 크기 계산
  const { cellSize } = useGridCellSize({
    gridSize: currentLayout?.gridSize || gridSize,
    gap,
    padding,
    containerElement: containerRef.current
  })
  
  // 그리드 컬럼 수 계산
  const gridColumns = useMemo(() => {
    const sizeMap = {
      '2x2': 2,
      '3x3': 3,
      '4x4': 4,
      '5x5': 5,
    }
    return sizeMap[gridSize] || 3
  }, [gridSize])
  
  // 반응형 그리드 클래스 이름 생성
  const getGridClassName = useCallback((size: GridSize) => {
    const classMap = {
      '2x2': 'grid-cols-2',
      '3x3': 'grid-cols-2 sm:grid-cols-3',
      '4x4': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
      '5x5': 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5',
    }
    return classMap[size] || 'grid-cols-2 sm:grid-cols-3'
  }, [])
  
  // CSS 변수 스타일
  const gridStyles = useMemo(() => ({
    '--grid-cols': gridColumns,
    '--grid-gap': `${gap}px`,
    '--grid-padding': `${padding}px`,
    '--grid-cell-size': `${cellSize}px`,
  } as React.CSSProperties), [gridColumns, gap, padding, cellSize])
  
  // 키보드 네비게이션 설정
  const { currentIndex, setFocus } = useGridNavigation(
    itemsRef,
    gridColumns,
    {
      onSelect: onWidgetSelect,
      onMove: onWidgetMove,
      circular: true
    }
  )
  
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
  
  // 포커스 관리 설정
  React.useEffect(() => {
    if (!containerRef.current || !enableKeyboardNavigation) return
    
    const items = containerRef.current.querySelectorAll<HTMLElement>('.grid-item')
    itemsRef.current = Array.from(items)
    
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1')
      item.setAttribute('role', 'gridcell')
      item.setAttribute('aria-label', `위젯 ${index + 1}`)
      
      const handleFocus = () => {
        items.forEach((el, i) => {
          el.setAttribute('tabindex', i === index ? '0' : '-1')
        })
      }
      
      item.addEventListener('focus', handleFocus)
      return () => item.removeEventListener('focus', handleFocus)
    })
  }, [children, enableKeyboardNavigation])
  
  // 그리드 컨테이너 렌더링
  const renderGridContainer = () => (
    <div
      ref={containerRef}
      className={cn(
        'grid-container',
        'dashboard-grid grid w-full h-full auto-rows-fr',
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
      data-edit-mode={isEditMode}
    >
      {children}
    </div>
  )
  
  // Context Provider로 그리드 정보 제공
  const content = (
    <GridProvider
      gridSize={gridSize}
      gap={gap}
      padding={padding}
      cellSize={cellSize}
      containerRef={containerRef}
      isEditMode={isEditMode}
    >
      {renderGridContainer()}
    </GridProvider>
  )
  
  // DnD 활성화 여부에 따라 래핑
  if (enableDnd && isEditMode) {
    return <DndProvider>{content}</DndProvider>
  }
  
  return content
})

// 그리드 아이템 컴포넌트 (메모이제이션 적용)
interface GridItemProps {
  children: ReactNode
  colSpan?: number
  rowSpan?: number
  className?: string
  widgetId?: string
  widgetName?: string
}

export const GridItem = memo(function GridItem({
  children,
  colSpan = 1,
  rowSpan = 1,
  className,
  widgetId,
  widgetName
}: GridItemProps) {
  return (
    <div
      className={cn(
        'grid-item relative bg-white dark:bg-gray-800 rounded-lg shadow-sm',
        'border border-gray-200 dark:border-gray-700',
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
})

// 반응형 그리드 컨테이너 (자동 크기 조정)
export const ResponsiveGridContainer = memo(function ResponsiveGridContainer({
  children,
  gap = 16,
  padding = 16,
  className,
  enableDnd = true
}: Omit<GridContainerProps, 'gridSize'>) {
  const { isEditMode } = useDashboardStore()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 화면 크기에 따른 자동 그리드 사이즈 결정
  const [autoGridSize, setAutoGridSize] = React.useState<GridSize>('3x3')
  
  React.useEffect(() => {
    const updateGridSize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.offsetWidth
      
      if (width < 640) {
        setAutoGridSize('2x2')
      } else if (width < 1024) {
        setAutoGridSize('3x3')
      } else if (width < 1536) {
        setAutoGridSize('4x4')
      } else {
        setAutoGridSize('5x5')
      }
    }
    
    updateGridSize()
    const resizeObserver = new ResizeObserver(updateGridSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    return () => resizeObserver.disconnect()
  }, [])
  
  return (
    <div ref={containerRef} className="w-full h-full">
      <GridContainer
        gridSize={autoGridSize}
        gap={gap}
        padding={padding}
        className={className}
        enableDnd={enableDnd}
      >
        {children}
      </GridContainer>
    </div>
  )
})

export default GridContainer