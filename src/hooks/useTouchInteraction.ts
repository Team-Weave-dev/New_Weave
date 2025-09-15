import { useState, useCallback, useEffect } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { isTouchDevice, isMobileDevice } from '@/lib/dashboard/responsive-grid'

interface TouchInteractionState {
  selectedWidgetId: string | null
  targetPosition: { x: number; y: number } | null
  isSelectionMode: boolean
  dragStartTime: number | null
}

/**
 * 터치 친화적 인터랙션 훅
 * 드래그 대신 탭 & 선택 방식 제공
 */
export function useTouchInteraction() {
  const [state, setState] = useState<TouchInteractionState>({
    selectedWidgetId: null,
    targetPosition: null,
    isSelectionMode: false,
    dragStartTime: null
  })

  const { moveWidget, currentLayout, isEditMode } = useDashboardStore()
  const isTouch = isTouchDevice()
  const isMobile = isMobileDevice()

  // 위젯 선택
  const selectWidgetForMove = useCallback((widgetId: string) => {
    setState(prev => ({
      ...prev,
      selectedWidgetId: widgetId,
      isSelectionMode: true,
      targetPosition: null
    }))
  }, [])

  // 목표 위치 선택
  const selectTargetPosition = useCallback((x: number, y: number) => {
    if (!state.selectedWidgetId || !isEditMode) return

    setState(prev => ({
      ...prev,
      targetPosition: { x, y }
    }))

    // 위젯 이동 실행
    moveWidget(state.selectedWidgetId, {
      x,
      y,
      width: currentLayout?.widgets.find(w => w.id === state.selectedWidgetId)?.position.width || 1,
      height: currentLayout?.widgets.find(w => w.id === state.selectedWidgetId)?.position.height || 1
    })

    // 선택 모드 해제
    setTimeout(() => {
      setState({
        selectedWidgetId: null,
        targetPosition: null,
        isSelectionMode: false,
        dragStartTime: null
      })
    }, 300)
  }, [state.selectedWidgetId, isEditMode, moveWidget, currentLayout])

  // 선택 모드 취소
  const cancelSelection = useCallback(() => {
    setState({
      selectedWidgetId: null,
      targetPosition: null,
      isSelectionMode: false,
      dragStartTime: null
    })
  }, [])

  // 길게 누르기 감지
  const handleLongPress = useCallback((widgetId: string, callback?: () => void) => {
    let pressTimer: NodeJS.Timeout | null = null
    let startTime: number

    const startPress = () => {
      startTime = Date.now()
      pressTimer = setTimeout(() => {
        // 진동 피드백 (지원하는 경우)
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
        
        if (callback) {
          callback()
        } else {
          selectWidgetForMove(widgetId)
        }
      }, 500) // 500ms 길게 누르기
    }

    const endPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }

    return {
      onTouchStart: startPress,
      onTouchEnd: endPress,
      onTouchCancel: endPress,
      onMouseDown: isTouch ? undefined : startPress,
      onMouseUp: isTouch ? undefined : endPress,
      onMouseLeave: isTouch ? undefined : endPress
    }
  }, [isTouch, selectWidgetForMove])

  // ESC 키로 취소
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isSelectionMode) {
        cancelSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.isSelectionMode, cancelSelection])

  return {
    // 상태
    selectedWidgetId: state.selectedWidgetId,
    targetPosition: state.targetPosition,
    isSelectionMode: state.isSelectionMode,
    isTouch,
    isMobile,
    
    // 액션
    selectWidgetForMove,
    selectTargetPosition,
    cancelSelection,
    handleLongPress,
    
    // 유틸리티
    isWidgetSelected: (widgetId: string) => state.selectedWidgetId === widgetId,
    isPositionTarget: (x: number, y: number) => 
      state.targetPosition?.x === x && state.targetPosition?.y === y
  }
}

/**
 * 스와이프 제스처 훅
 */
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold = 50
) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)

    if (isHorizontalSwipe) {
      // 좌우 스와이프
      if (Math.abs(distanceX) > threshold) {
        if (distanceX > 0) {
          onSwipeLeft?.()
        } else {
          onSwipeRight?.()
        }
      }
    } else {
      // 상하 스와이프
      if (Math.abs(distanceY) > threshold) {
        if (distanceY > 0) {
          onSwipeUp?.()
        } else {
          onSwipeDown?.()
        }
      }
    }
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}

/**
 * 핀치 줌 제스처 훅
 */
export function usePinchZoom(
  onZoomIn?: () => void,
  onZoomOut?: () => void,
  threshold = 50
) {
  const [initialDistance, setInitialDistance] = useState<number | null>(null)

  const getDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null
    
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches)
      if (distance) {
        setInitialDistance(distance)
      }
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance) {
      const currentDistance = getDistance(e.touches)
      if (currentDistance) {
        const diff = currentDistance - initialDistance
        
        if (Math.abs(diff) > threshold) {
          if (diff > 0) {
            onZoomIn?.()
          } else {
            onZoomOut?.()
          }
          setInitialDistance(currentDistance)
        }
      }
    }
  }, [initialDistance, threshold, onZoomIn, onZoomOut])

  const handleTouchEnd = useCallback(() => {
    setInitialDistance(null)
  }, [])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}