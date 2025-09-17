import { useState, useEffect, useRef, useCallback } from 'react'
import { GridSize } from '@/types/dashboard'
import { calculateCellSize } from '@/lib/dashboard/gridCalculations'

interface UseGridCellSizeOptions {
  gridSize: GridSize
  gap?: number
  padding?: number
}

interface UseGridCellSizeReturn {
  cellSize: number
  containerRef: React.RefObject<HTMLDivElement>
  recalculate: () => void
}

/**
 * 컨테이너 크기에 따른 동적 그리드 셀 크기 계산 훅
 * ResizeObserver를 사용하여 실시간으로 셀 크기를 재계산합니다.
 */
export function useGridCellSize({
  gridSize,
  gap = 16,
  padding = 16
}: UseGridCellSizeOptions): UseGridCellSizeReturn {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(150) // 기본값
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const recalculate = useCallback(() => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.clientWidth
    if (containerWidth > 0) {
      const newCellSize = calculateCellSize(containerWidth, gridSize, gap, padding)
      setCellSize(newCellSize)
    }
  }, [gridSize, gap, padding])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 초기 계산
    recalculate()

    // ResizeObserver 설정
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === container) {
            const width = entry.contentBoxSize?.[0]?.inlineSize || entry.contentRect.width
            if (width > 0) {
              const newCellSize = calculateCellSize(width, gridSize, gap, padding)
              setCellSize(newCellSize)
            }
          }
        }
      })
    }

    resizeObserverRef.current.observe(container)

    // Cleanup
    return () => {
      if (resizeObserverRef.current && container) {
        resizeObserverRef.current.unobserve(container)
      }
    }
  }, [gridSize, gap, padding, recalculate])

  // 윈도우 리사이즈 이벤트에도 대응
  useEffect(() => {
    const handleResize = () => {
      recalculate()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [recalculate])

  return {
    cellSize,
    containerRef,
    recalculate
  }
}