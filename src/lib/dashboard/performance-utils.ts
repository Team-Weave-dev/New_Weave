/**
 * Performance optimization utilities for Dashboard Widget System
 * Provides React.memo, useMemo patterns and performance monitoring
 */

import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react';
// WidgetPosition 타입 정의
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 위젯 위치 비교 함수 (React.memo용)
 */
export const areWidgetPositionsEqual = (
  prevPos: WidgetPosition,
  nextPos: WidgetPosition
): boolean => {
  return (
    prevPos.x === nextPos.x &&
    prevPos.y === nextPos.y &&
    prevPos.width === nextPos.width &&
    prevPos.height === nextPos.height
  );
};

/**
 * 위젯 props 얕은 비교 함수
 */
export const areWidgetPropsEqual = (prevProps: any, nextProps: any): boolean => {
  // ID가 다르면 다른 위젯
  if (prevProps.id !== nextProps.id) return false;
  
  // 위치 비교
  if (!areWidgetPositionsEqual(prevProps.position, nextProps.position)) return false;
  
  // 편집 모드 비교
  if (prevProps.isEditMode !== nextProps.isEditMode) return false;
  
  // 잠금 상태 비교
  if (prevProps.isLocked !== nextProps.isLocked) return false;
  
  // config 얕은 비교
  const prevConfig = prevProps.config || {};
  const nextConfig = nextProps.config || {};
  const configKeys = new Set([...Object.keys(prevConfig), ...Object.keys(nextConfig)]);
  
  for (const key of configKeys) {
    if (prevConfig[key] !== nextConfig[key]) return false;
  }
  
  return true;
};

/**
 * 대시보드 레이아웃 props 비교 함수
 */
export const areDashboardPropsEqual = (prevProps: any, nextProps: any): boolean => {
  // 그리드 크기 비교
  if (prevProps.gridSize !== nextProps.gridSize) return false;
  
  // 편집 모드 비교
  if (prevProps.isEditMode !== nextProps.isEditMode) return false;
  
  // 위젯 배열 길이 비교
  if (prevProps.widgets?.length !== nextProps.widgets?.length) return false;
  
  // 위젯 ID 목록 비교 (순서 중요)
  if (prevProps.widgets && nextProps.widgets) {
    for (let i = 0; i < prevProps.widgets.length; i++) {
      if (prevProps.widgets[i].id !== nextProps.widgets[i].id) return false;
    }
  }
  
  return true;
};

/**
 * 디바운스 훅
 */
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * 쓰로틀 훅
 */
export const useThrottle = <T,>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= limit) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, limit - (Date.now() - lastRun.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * 성능 모니터링 훅
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const renderStartTime = useRef<number>();
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    renderCount.current++;
    
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      renderTimes.current.push(renderTime);
      
      // 최근 10개 렌더링 시간만 유지
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }
      
      // 평균 렌더링 시간이 높으면 경고
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      
      if (avgRenderTime > 16.67) { // 60fps 기준 (1000ms / 60)
        console.warn(
          `[Performance] ${componentName} average render time: ${avgRenderTime.toFixed(2)}ms (target: <16.67ms)`
        );
      }
    }
    
    renderStartTime.current = performance.now();
    
    // 개발 모드에서만 로그
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Performance] ${componentName} rendered ${renderCount.current} times`);
    }
  });

  return {
    renderCount: renderCount.current,
    getAverageRenderTime: () => {
      if (renderTimes.current.length === 0) return 0;
      return renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
    }
  };
};

/**
 * 레이지 로딩 컴포넌트 래퍼
 */
export function withLazyLoad<P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
): React.ComponentType<P> {
  const LazyComponent = React.lazy(importFunc);

  const LazyLoadWrapper = (props: P) => {
    return React.createElement(
      React.Suspense,
      {
        fallback: fallback || React.createElement('div', {
          className: 'animate-pulse bg-gray-200 rounded h-full'
        })
      },
      React.createElement(LazyComponent as any, props as any)
    );
  };
  
  LazyLoadWrapper.displayName = 'LazyLoadWrapper';

  return memo(LazyLoadWrapper) as unknown as React.ComponentType<P>;
}

/**
 * 가상 스크롤링을 위한 뷰포트 감지 훅
 */
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
};

/**
 * 메모이제이션된 그리드 레이아웃 계산
 */
export const useGridLayout = (
  gridSize: '3x3' | '4x4',
  containerWidth: number,
  containerHeight: number,
  gap: number = 16
) => {
  return useMemo(() => {
    const size = gridSize === '3x3' ? 3 : 4;
    const cellWidth = (containerWidth - gap * (size - 1)) / size;
    const cellHeight = (containerHeight - gap * (size - 1)) / size;

    return {
      cellWidth,
      cellHeight,
      gap,
      columns: size,
      rows: size,
      totalCells: size * size
    };
  }, [gridSize, containerWidth, containerHeight, gap]);
};

/**
 * 위젯 위치 최적화 함수
 */
export const optimizeWidgetPositions = (
  widgets: Array<{ id: string; position: WidgetPosition }>,
  gridSize: '3x3' | '4x4'
): Array<{ id: string; position: WidgetPosition }> => {
  const size = gridSize === '3x3' ? 3 : 4;
  const grid: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // 현재 위젯 위치 마킹
  widgets.forEach(widget => {
    const { x, y, width, height } = widget.position;
    for (let row = y; row < Math.min(y + height, size); row++) {
      for (let col = x; col < Math.min(x + width, size); col++) {
        grid[row][col] = true;
      }
    }
  });
  
  // 위젯 위치 최적화 (빈 공간 제거)
  const optimizedWidgets = [...widgets];
  let changed = true;
  
  while (changed) {
    changed = false;
    
    for (let i = 0; i < optimizedWidgets.length; i++) {
      const widget = optimizedWidgets[i];
      const { x, y, width, height } = widget.position;
      
      // 위로 이동 가능한지 확인
      if (y > 0) {
        let canMoveUp = true;
        for (let col = x; col < Math.min(x + width, size); col++) {
          if (grid[y - 1][col]) {
            canMoveUp = false;
            break;
          }
        }
        
        if (canMoveUp) {
          // 이전 위치 클리어
          for (let row = y; row < Math.min(y + height, size); row++) {
            for (let col = x; col < Math.min(x + width, size); col++) {
              grid[row][col] = false;
            }
          }
          
          // 새 위치 설정
          widget.position = { ...widget.position, y: y - 1 };
          
          // 새 위치 마킹
          for (let row = y - 1; row < Math.min(y - 1 + height, size); row++) {
            for (let col = x; col < Math.min(x + width, size); col++) {
              grid[row][col] = true;
            }
          }
          
          changed = true;
        }
      }
      
      // 왼쪽으로 이동 가능한지 확인
      if (x > 0) {
        let canMoveLeft = true;
        for (let row = y; row < Math.min(y + height, size); row++) {
          if (grid[row][x - 1]) {
            canMoveLeft = false;
            break;
          }
        }
        
        if (canMoveLeft) {
          // 이전 위치 클리어
          for (let row = y; row < Math.min(y + height, size); row++) {
            for (let col = x; col < Math.min(x + width, size); col++) {
              grid[row][col] = false;
            }
          }
          
          // 새 위치 설정
          widget.position = { ...widget.position, x: x - 1 };
          
          // 새 위치 마킹
          for (let row = y; row < Math.min(y + height, size); row++) {
            for (let col = x - 1; col < Math.min(x - 1 + width, size); col++) {
              grid[row][col] = true;
            }
          }
          
          changed = true;
        }
      }
    }
  }
  
  return optimizedWidgets;
};

/**
 * 배치 업데이트 최적화
 */
export const useBatchedUpdates = () => {
  const pendingUpdates = useRef<Array<() => void>>([]);
  const rafId = useRef<number>();

  const batchUpdate = useCallback((updateFn: () => void) => {
    pendingUpdates.current.push(updateFn);

    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        const updates = pendingUpdates.current;
        pendingUpdates.current = [];
        rafId.current = undefined;

        updates.forEach(fn => fn());
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return batchUpdate;
};

/**
 * 렌더링 최적화 플래그
 */
export const PERFORMANCE_FLAGS = {
  ENABLE_WIDGET_MEMOIZATION: true,
  ENABLE_LAZY_LOADING: true,
  ENABLE_VIRTUAL_SCROLLING: false, // 위젯이 많을 때만 활성화
  ENABLE_BATCH_UPDATES: true,
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  MAX_RENDER_TIME_MS: 16.67, // 60fps
  DEBOUNCE_DELAY_MS: 300,
  THROTTLE_LIMIT_MS: 100
} as const;