'use client'

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import { AdaptiveWidget } from './AdaptiveWidget'
import type { Widget } from '@/types/dashboard'

interface VirtualizedWidgetListProps {
  widgets: Widget[]
  isEditMode: boolean
  itemsPerPage?: number
}

/**
 * 최적화된 위젯 리스트
 * 가상 스크롤링 없이 성능 최적화 기법 적용
 */
export function VirtualizedWidgetList({
  widgets,
  isEditMode,
  itemsPerPage = 10
}: VirtualizedWidgetListProps) {
  const [visibleWidgets, setVisibleWidgets] = useState<Widget[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 표시할 위젯 계산
  useEffect(() => {
    const endIndex = page * itemsPerPage
    setVisibleWidgets(widgets.slice(0, endIndex))
  }, [widgets, page, itemsPerPage])

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          const hasMore = visibleWidgets.length < widgets.length
          if (hasMore) {
            setIsLoading(true)
            // 로딩 시뮬레이션
            setTimeout(() => {
              setPage(prev => prev + 1)
              setIsLoading(false)
            }, 300)
          }
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [visibleWidgets, widgets, isLoading])

  return (
    <div className="space-y-3">
      {visibleWidgets.map((widget) => (
        <div key={widget.id} className="animate-fade-in">
          <AdaptiveWidget
            widget={widget}
            isEditMode={isEditMode}
          />
        </div>
      ))}
      
      {/* 로드 모어 트리거 */}
      {visibleWidgets.length < widgets.length && (
        <div 
          ref={loadMoreRef}
          className="h-20 flex items-center justify-center"
        >
          {isLoading && (
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 최적화된 그리드 레이아웃
 * CSS Grid와 lazy loading으로 성능 최적화
 */
interface OptimizedWidgetGridProps {
  widgets: Widget[]
  isEditMode: boolean
  columns?: number
}

export function OptimizedWidgetGrid({
  widgets,
  isEditMode,
  columns = 2
}: OptimizedWidgetGridProps) {
  const [visibleWidgets, setVisibleWidgets] = useState<Set<string>>(new Set())
  const widgetRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Intersection Observer로 보이는 위젯만 렌더링
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const widgetId = entry.target.getAttribute('data-widget-id')
          if (widgetId) {
            setVisibleWidgets(prev => {
              const next = new Set(prev)
              if (entry.isIntersecting) {
                next.add(widgetId)
              }
              return next
            })
          }
        })
      },
      { rootMargin: '50px' }
    )

    widgetRefs.current.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [widgets])

  return (
    <div className={`grid grid-cols-${columns} gap-3`}>
      {widgets.map((widget) => (
        <div
          key={widget.id}
          ref={(el) => {
            if (el) widgetRefs.current.set(widget.id, el)
          }}
          data-widget-id={widget.id}
          className="min-h-[200px]"
        >
          {visibleWidgets.has(widget.id) ? (
            <AdaptiveWidget
              widget={widget}
              isEditMode={isEditMode}
            />
          ) : (
            <div className="h-full bg-gray-100 rounded-lg animate-pulse" />
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * 메모리 최적화된 위젯 리스트
 * React.memo와 useMemo로 불필요한 리렌더링 방지
 */
const MemoizedWidget = React.memo(({ widget, isEditMode }: { widget: Widget; isEditMode: boolean }) => {
  return <AdaptiveWidget widget={widget} isEditMode={isEditMode} />
}, (prevProps, nextProps) => {
  return (
    prevProps.widget.id === nextProps.widget.id &&
    prevProps.widget.type === nextProps.widget.type &&
    prevProps.widget.position === nextProps.widget.position &&
    prevProps.isEditMode === nextProps.isEditMode
  )
})

MemoizedWidget.displayName = 'MemoizedWidget'

export function MemoryOptimizedWidgetList({
  widgets,
  isEditMode
}: {
  widgets: Widget[]
  isEditMode: boolean
}) {
  // 위젯 ID 목록만 메모이제이션
  const widgetIds = useMemo(() => widgets.map(w => w.id), [widgets])
  
  // 위젯 맵 생성
  const widgetMap = useMemo(() => {
    const map = new Map<string, Widget>()
    widgets.forEach(w => map.set(w.id, w))
    return map
  }, [widgets])

  return (
    <div className="space-y-3">
      {widgetIds.map((id) => {
        const widget = widgetMap.get(id)
        if (!widget) return null
        
        return (
          <MemoizedWidget
            key={id}
            widget={widget}
            isEditMode={isEditMode}
          />
        )
      })}
    </div>
  )
}