'use client'

import React, { ReactNode, useCallback, useMemo, useRef, memo, CSSProperties, useState, useEffect } from 'react'
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window'
import { cn } from '@/lib/utils'
import { EnhancedWidgetErrorBoundary } from './EnhancedWidgetErrorBoundary'

// 가상화 그리드 설정
interface VirtualizedGridConfig {
  columns: number
  rowHeight: number
  gap: number
  padding: number
  threshold?: number // 가상화 시작 임계값 (기본: 20개)
}

interface VirtualizedGridLayoutProps {
  widgets: Array<{
    id: string
    type: string
    content: ReactNode
    colSpan?: number
    rowSpan?: number
  }>
  config?: Partial<VirtualizedGridConfig>
  className?: string
  onWidgetSelect?: (widgetId: string, index: number) => void
  renderWidget?: (widget: any) => ReactNode
}

// 기본 설정
const DEFAULT_CONFIG: VirtualizedGridConfig = {
  columns: 3,
  rowHeight: 300,
  gap: 16,
  padding: 16,
  threshold: 20
}

// 위젯 셀 컴포넌트 (메모이제이션)
const WidgetCell = memo(({ 
  columnIndex, 
  rowIndex, 
  style,
  data 
}: GridChildComponentProps<{
  widgets: any[]
  columns: number
  gap: number
  onWidgetSelect?: (widgetId: string, index: number) => void
  renderWidget?: (widget: any) => ReactNode
}>) => {
  const { widgets, columns, gap, onWidgetSelect, renderWidget } = data
  const index = rowIndex * columns + columnIndex
  const widget = widgets[index]

  // 빈 셀 처리
  if (!widget) {
    return <div style={style} />
  }

  // 스타일 조정 (갭 적용)
  const adjustedStyle: CSSProperties = {
    ...style,
    left: Number(style.left) + gap / 2,
    top: Number(style.top) + gap / 2,
    width: Number(style.width) - gap,
    height: Number(style.height) - gap,
  }

  return (
    <div 
      style={adjustedStyle}
      className="widget-cell"
      onClick={() => onWidgetSelect?.(widget.id, index)}
    >
      <EnhancedWidgetErrorBoundary
        widgetId={widget.id}
        widgetType={widget.type}
        className="h-full"
      >
        <div className={cn(
          "h-full bg-white rounded-lg shadow-sm border border-gray-200",
          "transition-all duration-200 hover:shadow-md",
          "focus-within:ring-2 focus-within:ring-[var(--color-brand-primary-start)]"
        )}>
          {renderWidget ? renderWidget(widget) : widget.content}
        </div>
      </EnhancedWidgetErrorBoundary>
    </div>
  )
})

WidgetCell.displayName = 'WidgetCell'

// 가상화 성능 모니터
class VirtualizationMonitor {
  private renderCount = 0
  private lastResetTime = Date.now()
  private performanceData: {
    fps: number
    renderTime: number
    visibleItems: number
  } = {
    fps: 60,
    renderTime: 0,
    visibleItems: 0
  }

  logRender(visibleItems: number) {
    this.renderCount++
    const now = Date.now()
    const elapsed = now - this.lastResetTime

    if (elapsed > 1000) { // 1초마다 FPS 계산
      this.performanceData.fps = Math.round((this.renderCount * 1000) / elapsed)
      this.performanceData.visibleItems = visibleItems
      this.renderCount = 0
      this.lastResetTime = now

      // 성능 저하 감지
      if (this.performanceData.fps < 30) {
        console.warn('⚠️ 가상화 그리드 성능 저하 감지:', {
          fps: this.performanceData.fps,
          visibleItems: this.performanceData.visibleItems
        })
      }
    }
  }

  getPerformanceData() {
    return { ...this.performanceData }
  }
}

// 메인 가상화 그리드 레이아웃 컴포넌트
export function VirtualizedGridLayout({
  widgets,
  config: userConfig,
  className,
  onWidgetSelect,
  renderWidget
}: VirtualizedGridLayoutProps) {
  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...userConfig
  }), [userConfig])

  const monitor = useRef(new VirtualizationMonitor())
  const gridRef = useRef<Grid>(null)

  // 위젯 수가 임계값 이하면 일반 렌더링
  const shouldVirtualize = widgets.length > (config.threshold || DEFAULT_CONFIG.threshold)

  // 그리드 아이템 데이터
  const itemData = useMemo(() => ({
    widgets,
    columns: config.columns,
    gap: config.gap,
    onWidgetSelect,
    renderWidget
  }), [widgets, config.columns, config.gap, onWidgetSelect, renderWidget])

  // 행 수 계산
  const rowCount = Math.ceil(widgets.length / config.columns)

  // 컨테이너 크기 감지를 위한 state (조건문 밖으로 이동)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // 스크롤 최적화
  const handleScroll = useCallback(({ scrollTop }: { scrollTop: number }) => {
    // 스크롤 위치에 따른 추가 최적화 로직
    // 예: 스크롤 속도 감지, 프리로딩 등
    const scrollSpeed = Math.abs(scrollTop - (handleScroll.lastScrollTop || 0))
    handleScroll.lastScrollTop = scrollTop

    if (scrollSpeed > 1000) {
      // 빠른 스크롤 중 - 렌더링 최적화
      if (gridRef.current) {
        // react-window의 overscanCount 동적 조정
        // (실제로는 react-window API에서 지원하지 않으므로 주석 처리)
        // gridRef.current.props.overscanRowCount = 1
      }
    }
  }, [])

  handleScroll.lastScrollTop = 0

  // ResizeObserver로 컨테이너 크기 감지
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const { width, height } = entry.contentRect
        setContainerSize({ width, height })
      }
    })

    resizeObserver.observe(container)
    
    // 초기 크기 설정
    const rect = container.getBoundingClientRect()
    setContainerSize({ width: rect.width, height: rect.height })

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // 일반 렌더링 (가상화 없이)
  if (!shouldVirtualize) {
    return (
      <div 
        className={cn(
          "grid w-full h-full",
          `grid-cols-${config.columns}`,
          className
        )}
        style={{
          gap: `${config.gap}px`,
          padding: `${config.padding}px`,
        }}
      >
        {widgets.map((widget, index) => (
          <div 
            key={widget.id}
            onClick={() => onWidgetSelect?.(widget.id, index)}
            className="widget-item"
          >
            <EnhancedWidgetErrorBoundary
              widgetId={widget.id}
              widgetType={widget.type}
              className="h-full"
            >
              <div className={cn(
                "h-full bg-white rounded-lg shadow-sm border border-gray-200",
                "transition-all duration-200 hover:shadow-md",
                "focus-within:ring-2 focus-within:ring-[var(--color-brand-primary-start)]"
              )}>
                {renderWidget ? renderWidget(widget) : widget.content}
              </div>
            </EnhancedWidgetErrorBoundary>
          </div>
        ))}
      </div>
    )
  }

  // 가상화 렌더링
  return (
    <div ref={containerRef} className={cn("w-full h-full", className)}>
      {containerSize.width > 0 && containerSize.height > 0 && (
        <>
          {/* 성능 모니터링 */}
          {(() => {
            const visibleRows = Math.ceil(containerSize.height / config.rowHeight)
            const visibleItems = visibleRows * config.columns
            monitor.current.logRender(visibleItems)
            return null
          })()}
          
          <Grid
            ref={gridRef}
            className="virtualized-grid"
            columnCount={config.columns}
            columnWidth={(containerSize.width - config.padding * 2) / config.columns}
            height={containerSize.height}
            rowCount={rowCount}
            rowHeight={config.rowHeight}
            width={containerSize.width}
            itemData={itemData}
            onScroll={handleScroll}
            overscanRowCount={2} // 뷰포트 외부에 미리 렌더링할 행 수
            style={{
              padding: `${config.padding}px`,
            }}
          >
            {WidgetCell}
          </Grid>
        </>
      )}

      {/* 성능 디버그 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg z-50">
          <div>위젯 수: {widgets.length}</div>
          <div>가상화: {shouldVirtualize ? '활성' : '비활성'}</div>
          <div>FPS: {monitor.current.getPerformanceData().fps}</div>
        </div>
      )}
    </div>
  )
}

// 반응형 가상화 그리드
export function ResponsiveVirtualizedGrid({
  widgets,
  className,
  ...props
}: VirtualizedGridLayoutProps) {
  // 화면 크기에 따라 열 수 조정
  const getResponsiveColumns = useCallback(() => {
    if (typeof window === 'undefined') return 3

    const width = window.innerWidth
    if (width < 640) return 1 // 모바일
    if (width < 768) return 2 // 태블릿
    if (width < 1024) return 3 // 작은 데스크톱
    if (width < 1280) return 4 // 중간 데스크톱
    return 5 // 큰 데스크톱
  }, [])

  const [columns, setColumns] = React.useState(getResponsiveColumns())

  React.useEffect(() => {
    const handleResize = () => {
      setColumns(getResponsiveColumns())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getResponsiveColumns])

  return (
    <VirtualizedGridLayout
      widgets={widgets}
      config={{ columns }}
      className={className}
      {...props}
    />
  )
}

// 무한 스크롤 지원 가상화 그리드
export function InfiniteVirtualizedGrid({
  widgets,
  loadMore,
  hasMore,
  loading,
  ...props
}: VirtualizedGridLayoutProps & {
  loadMore: () => void
  hasMore: boolean
  loading?: boolean
}) {
  const handleScroll = useCallback(({ scrollTop, scrollHeight, clientHeight }: any) => {
    // 스크롤이 바닥에 가까워지면 더 로드
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
    if (scrollPercentage > 0.9 && hasMore && !loading) {
      loadMore()
    }
  }, [hasMore, loading, loadMore])

  return (
    <>
      <VirtualizedGridLayout
        widgets={widgets}
        {...props}
      />
      {loading && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-primary-start)]" />
        </div>
      )}
    </>
  )
}