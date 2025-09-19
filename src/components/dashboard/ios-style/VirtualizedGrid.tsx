'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSStyleWidget } from '@/types/ios-dashboard';

interface VirtualizedGridProps {
  widgets: IOSStyleWidget[];
  columns: number;
  rowHeight: number;
  gap?: number;
  overscan?: number;
  renderWidget: (widget: IOSStyleWidget, isVisible: boolean) => React.ReactNode;
  className?: string;
  onVisibilityChange?: (visibleWidgetIds: Set<string>) => void;
}

interface VirtualizedWidget extends IOSStyleWidget {
  virtualTop: number;
  virtualHeight: number;
  isVisible: boolean;
}

/**
 * VirtualizedGrid - 대규모 위젯 렌더링을 위한 가상화 컴포넌트
 * 
 * Features:
 * - Intersection Observer를 활용한 뷰포트 감지
 * - 뷰포트 밖 위젯 언마운트로 메모리 최적화
 * - 스크롤 성능 최적화 (60fps 보장)
 * - Overscan으로 스크롤 시 버퍼 영역 제공
 */
export function VirtualizedGrid({
  widgets,
  columns,
  rowHeight,
  gap = 16,
  overscan = 2,
  renderWidget,
  className = '',
  onVisibilityChange,
}: VirtualizedGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const widgetRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const [visibleWidgets, setVisibleWidgets] = useState<Set<string>>(new Set());
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // 위젯의 가상 위치 계산
  const virtualizedWidgets = useMemo((): VirtualizedWidget[] => {
    const result: VirtualizedWidget[] = [];
    
    widgets.forEach((widget) => {
      const row = Math.floor((widget.position?.gridRow || 1) - 1);
      const virtualTop = row * (rowHeight + gap);
      const virtualHeight = (widget.position?.rows || 2) * rowHeight + 
                          ((widget.position?.rows || 2) - 1) * gap;
      
      // 뷰포트 내에 있는지 확인 (overscan 포함)
      const overscanPixels = overscan * rowHeight;
      const isInViewport = 
        virtualTop + virtualHeight >= scrollTop - overscanPixels &&
        virtualTop <= scrollTop + viewportHeight + overscanPixels;
      
      result.push({
        ...widget,
        virtualTop,
        virtualHeight,
        isVisible: isInViewport,
      });
    });
    
    return result;
  }, [widgets, rowHeight, gap, scrollTop, viewportHeight, overscan]);

  // 전체 그리드 높이 계산
  const totalHeight = useMemo(() => {
    if (widgets.length === 0) return 0;
    
    const maxRow = Math.max(
      ...widgets.map(w => (w.position?.gridRow || 1) + (w.position?.rows || 2) - 1)
    );
    
    return maxRow * (rowHeight + gap) - gap;
  }, [widgets, rowHeight, gap]);

  // Intersection Observer 설정
  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      root: containerRef.current,
      rootMargin: `${overscan * rowHeight}px 0px`,
      threshold: [0, 0.1, 0.9, 1.0],
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const updates = new Map<string, boolean>();
      
      entries.forEach((entry) => {
        const widgetId = entry.target.getAttribute('data-widget-id');
        if (widgetId) {
          updates.set(widgetId, entry.isIntersecting);
        }
      });
      
      setVisibleWidgets(prev => {
        const next = new Set(prev);
        updates.forEach((isVisible, widgetId) => {
          if (isVisible) {
            next.add(widgetId);
          } else {
            next.delete(widgetId);
          }
        });
        return next;
      });
    }, options);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [overscan, rowHeight]);

  // 위젯 관찰 시작/중지
  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;

    // 기존 관찰 중지
    widgetRefs.current.forEach(element => {
      observer.unobserve(element);
    });
    widgetRefs.current.clear();

    // 새로운 위젯 관찰 시작
    virtualizedWidgets.forEach(widget => {
      const element = document.querySelector(
        `[data-widget-id="${widget.id}"]`
      ) as HTMLDivElement;
      
      if (element) {
        observer.observe(element);
        widgetRefs.current.set(widget.id, element);
      }
    });

    return () => {
      widgetRefs.current.forEach(element => {
        observer.unobserve(element);
      });
    };
  }, [virtualizedWidgets]);

  // 스크롤 이벤트 처리 (throttled)
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    requestAnimationFrame(() => {
      setScrollTop(containerRef.current?.scrollTop || 0);
    });
  }, []);

  // 뷰포트 크기 감지
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        setViewportHeight(containerRef.current.clientHeight);
        setContainerHeight(containerRef.current.scrollHeight);
      }
    };

    updateViewport();
    
    const resizeObserver = new ResizeObserver(updateViewport);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 가시성 변경 콜백
  useEffect(() => {
    onVisibilityChange?.(visibleWidgets);
  }, [visibleWidgets, onVisibilityChange]);

  // 렌더링할 위젯 필터링
  const widgetsToRender = virtualizedWidgets.filter(w => w.isVisible);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onScroll={handleScroll}
      style={{
        height: '100%',
        willChange: 'scroll-position',
      }}
    >
      {/* 스크롤 높이 유지를 위한 스페이서 */}
      <div
        style={{
          height: totalHeight,
          position: 'relative',
          willChange: 'transform',
        }}
      >
        {/* 가상화된 위젯 렌더링 */}
        <AnimatePresence mode="popLayout">
          {widgetsToRender.map((widget) => (
            <motion.div
              key={widget.id}
              data-widget-id={widget.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.2,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                top: widget.virtualTop,
                left: `calc(${((widget.position?.gridColumn || 1) - 1) / columns * 100}% + ${
                  ((widget.position?.gridColumn || 1) - 1) * gap / columns
                }px)`,
                width: `calc(${(widget.position?.columns || 2) / columns * 100}% - ${
                  gap * (1 - (widget.position?.columns || 2) / columns)
                }px)`,
                height: widget.virtualHeight,
                willChange: 'transform',
                contain: 'layout style paint',
              }}
            >
              {renderWidget(widget, visibleWidgets.has(widget.id))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 디버그 정보 (개발 모드) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-md font-mono z-50">
          <div>Total: {widgets.length}</div>
          <div>Visible: {widgetsToRender.length}</div>
          <div>Cached: {visibleWidgets.size}</div>
          <div>Scroll: {Math.round(scrollTop)}px</div>
          <div>Height: {Math.round(totalHeight)}px</div>
        </div>
      )}
    </div>
  );
}

// 메모리 최적화를 위한 플레이스홀더 위젯
export function VirtualizedWidgetPlaceholder({
  widget,
  height,
}: {
  widget: IOSStyleWidget;
  height: number;
}) {
  return (
    <div
      className="bg-muted/10 border border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-muted-foreground/40 text-sm">
        {widget.type} (Loading...)
      </div>
    </div>
  );
}

// 성능 최적화 훅
export function useVirtualizedGrid({
  widgets,
  containerHeight,
  rowHeight,
  gap = 16,
}: {
  widgets: IOSStyleWidget[];
  containerHeight: number;
  rowHeight: number;
  gap?: number;
}) {
  // 보이는 행 수 계산
  const visibleRows = Math.ceil(containerHeight / (rowHeight + gap));
  
  // 최적 overscan 계산 (보이는 행의 25%)
  const optimalOverscan = Math.max(2, Math.floor(visibleRows * 0.25));
  
  // 메모리 임계값 (100개 이상일 때 가상화 필요)
  const needsVirtualization = widgets.length > 100;
  
  // 성능 메트릭
  const metrics = {
    totalWidgets: widgets.length,
    visibleRows,
    optimalOverscan,
    needsVirtualization,
    estimatedMemorySaving: needsVirtualization 
      ? `~${Math.round((1 - visibleRows / Math.ceil(widgets.length / 4)) * 100)}%`
      : '0%',
  };
  
  return {
    needsVirtualization,
    optimalOverscan,
    metrics,
  };
}