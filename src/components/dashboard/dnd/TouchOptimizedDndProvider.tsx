'use client'

import React, { useRef, useCallback, useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

// 터치 제스처 감지 설정
interface TouchGestureConfig {
  dragThreshold: number        // 드래그 시작 임계값 (픽셀)
  longPressDelay: number      // 롱프레스 지연 시간 (ms)
  scrollThreshold: number     // 스크롤 임계값 (픽셀)
  velocityThreshold: number   // 속도 임계값
  preventScrollOnDrag: boolean // 드래그 중 스크롤 방지
}

const DEFAULT_TOUCH_CONFIG: TouchGestureConfig = {
  dragThreshold: 10,
  longPressDelay: 200,
  scrollThreshold: 5,
  velocityThreshold: 0.5,
  preventScrollOnDrag: true
}

// 개선된 터치 센서
class OptimizedTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: 'onTouchStart' as const,
      handler: ({ nativeEvent: event }: any, { onActivation }: any) => {
        // 멀티터치 무시
        if (event.touches.length > 1) return false

        const touch = event.touches[0]
        const startTime = Date.now()
        const startX = touch.clientX
        const startY = touch.clientY
        
        let isLongPress = false
        let isDragging = false
        let scrollDirection: 'horizontal' | 'vertical' | null = null

        // 롱프레스 타이머
        const longPressTimer = setTimeout(() => {
          isLongPress = true
          // 햅틱 피드백 (지원되는 경우)
          if ('vibrate' in navigator) {
            navigator.vibrate(10)
          }
        }, DEFAULT_TOUCH_CONFIG.longPressDelay)

        const handleTouchMove = (e: TouchEvent) => {
          const touch = e.touches[0]
          const deltaX = Math.abs(touch.clientX - startX)
          const deltaY = Math.abs(touch.clientY - startY)

          // 스크롤 방향 감지
          if (!scrollDirection && (deltaX > DEFAULT_TOUCH_CONFIG.scrollThreshold || deltaY > DEFAULT_TOUCH_CONFIG.scrollThreshold)) {
            scrollDirection = deltaX > deltaY ? 'horizontal' : 'vertical'
          }

          // 수직 스크롤은 허용, 수평 움직임은 드래그로 처리
          if (scrollDirection === 'vertical' && deltaY > deltaX * 1.5) {
            clearTimeout(longPressTimer)
            cleanup()
            return
          }

          // 드래그 임계값 초과 또는 롱프레스 후 움직임
          if ((deltaX > DEFAULT_TOUCH_CONFIG.dragThreshold || deltaY > DEFAULT_TOUCH_CONFIG.dragThreshold) || isLongPress) {
            if (!isDragging) {
              isDragging = true
              clearTimeout(longPressTimer)
              
              // 드래그 시작
              onActivation({
                x: startX,
                y: startY
              })

              // 스크롤 방지
              if (DEFAULT_TOUCH_CONFIG.preventScrollOnDrag) {
                e.preventDefault()
                e.stopPropagation()
              }
            }
          }
        }

        const handleTouchEnd = () => {
          clearTimeout(longPressTimer)
          cleanup()
        }

        const cleanup = () => {
          document.removeEventListener('touchmove', handleTouchMove)
          document.removeEventListener('touchend', handleTouchEnd)
          document.removeEventListener('touchcancel', handleTouchEnd)
        }

        document.addEventListener('touchmove', handleTouchMove, { passive: false })
        document.addEventListener('touchend', handleTouchEnd)
        document.addEventListener('touchcancel', handleTouchEnd)

        return false
      }
    }
  ]
}

// 개선된 포인터 센서 (마우스용)
class OptimizedPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: any, { onActivation }: any) => {
        // 터치 이벤트는 TouchSensor가 처리
        if (event.pointerType === 'touch') return false
        
        // 마우스 왼쪽 버튼만 처리
        if (event.button !== 0) return false

        onActivation({
          x: event.clientX,
          y: event.clientY
        })

        return true
      }
    }
  ]
}

// 터치 최적화 DND Provider Props
interface TouchOptimizedDndProviderProps {
  children: React.ReactNode
  onDragStart?: (event: DragStartEvent) => void
  onDragMove?: (event: DragMoveEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
  config?: Partial<TouchGestureConfig>
  dragOverlay?: React.ReactNode
}

// 스크롤 관리자
class ScrollManager {
  private scrollContainers = new Set<HTMLElement>()
  private originalStyles = new Map<HTMLElement, string>()

  registerContainer(element: HTMLElement) {
    this.scrollContainers.add(element)
  }

  unregisterContainer(element: HTMLElement) {
    this.scrollContainers.delete(element)
    this.restoreScroll(element)
  }

  preventScroll() {
    this.scrollContainers.forEach(container => {
      if (!this.originalStyles.has(container)) {
        this.originalStyles.set(container, container.style.overflow || '')
        container.style.overflow = 'hidden'
      }
    })

    // 전체 페이지 스크롤 방지
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  }

  restoreScroll(container?: HTMLElement) {
    if (container) {
      const originalStyle = this.originalStyles.get(container)
      if (originalStyle !== undefined) {
        container.style.overflow = originalStyle
        this.originalStyles.delete(container)
      }
    } else {
      this.scrollContainers.forEach(cont => {
        const originalStyle = this.originalStyles.get(cont)
        if (originalStyle !== undefined) {
          cont.style.overflow = originalStyle
        }
      })
      this.originalStyles.clear()

      // 전체 페이지 스크롤 복원
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }

  clear() {
    this.restoreScroll()
    this.scrollContainers.clear()
  }
}

// 터치 최적화 DND Provider
export function TouchOptimizedDndProvider({
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
  config = {},
  dragOverlay
}: TouchOptimizedDndProviderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const scrollManager = useRef(new ScrollManager())
  const touchConfig = { ...DEFAULT_TOUCH_CONFIG, ...config }

  // 센서 설정
  const sensors = useSensors(
    // 터치 센서 (모바일)
    useSensor(OptimizedTouchSensor, {
      activationConstraint: {
        delay: touchConfig.longPressDelay,
        tolerance: touchConfig.dragThreshold
      }
    }),
    // 포인터 센서 (마우스)
    useSensor(OptimizedPointerSensor, {
      activationConstraint: {
        distance: touchConfig.dragThreshold
      }
    }),
    // 키보드 센서
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // 드래그 시작 핸들러
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true)
    setActiveId(String(event.active.id))

    // 스크롤 방지
    if (touchConfig.preventScrollOnDrag) {
      scrollManager.current.preventScroll()
    }

    // 터치 디바이스에서 햅틱 피드백
    if ('ontouchstart' in window && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }

    onDragStart?.(event)
  }, [onDragStart, touchConfig.preventScrollOnDrag])

  // 드래그 이동 핸들러
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    onDragMove?.(event)
  }, [onDragMove])

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDragging(false)
    setActiveId(null)

    // 스크롤 복원
    scrollManager.current.restoreScroll()

    // 터치 디바이스에서 햅틱 피드백
    if ('ontouchstart' in window && 'vibrate' in navigator && event.over) {
      navigator.vibrate(20)
    }

    onDragEnd?.(event)
  }, [onDragEnd])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      scrollManager.current.clear()
    }
  }, [])

  // iOS 바운스 스크롤 비활성화
  useEffect(() => {
    if (isDragging && 'ontouchstart' in window) {
      const preventDefault = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          e.preventDefault()
        }
      }

      document.addEventListener('touchmove', preventDefault, { passive: false })
      
      return () => {
        document.removeEventListener('touchmove', preventDefault)
      }
    }
  }, [isDragging])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always
        }
      }}
    >
      {children}
      
      {/* 드래그 오버레이 */}
      {isDragging && activeId && (
        <DragOverlay
          style={{
            cursor: 'grabbing',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {dragOverlay || <div className="opacity-50">{activeId}</div>}
        </DragOverlay>
      )}

      {/* 터치 디바이스 디버그 정보 (개발 환경) */}
      {process.env.NODE_ENV === 'development' && 'ontouchstart' in window && (
        <div className="fixed top-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg z-50">
          <div>터치 디바이스 감지됨</div>
          <div>드래그 상태: {isDragging ? '활성' : '비활성'}</div>
          {activeId && <div>활성 ID: {activeId}</div>}
        </div>
      )}
    </DndContext>
  )
}

// 터치 제스처 유틸리티 훅
export function useTouchGesture(
  ref: React.RefObject<HTMLElement>,
  options: {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onSwipeUp?: () => void
    onSwipeDown?: () => void
    onPinch?: (scale: number) => void
    onRotate?: (angle: number) => void
    threshold?: number
  } = {}
) {
  const [gesture, setGesture] = useState<string | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time
      const threshold = options.threshold || 50

      // 스와이프 감지
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        const velocity = Math.sqrt(deltaX ** 2 + deltaY ** 2) / deltaTime

        if (velocity > 0.5) { // 속도 임계값
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 수평 스와이프
            if (deltaX > 0) {
              setGesture('swipe-right')
              options.onSwipeRight?.()
            } else {
              setGesture('swipe-left')
              options.onSwipeLeft?.()
            }
          } else {
            // 수직 스와이프
            if (deltaY > 0) {
              setGesture('swipe-down')
              options.onSwipeDown?.()
            } else {
              setGesture('swipe-up')
              options.onSwipeUp?.()
            }
          }

          // 제스처 상태 리셋
          setTimeout(() => setGesture(null), 500)
        }
      }

      touchStartRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref, options])

  return gesture
}