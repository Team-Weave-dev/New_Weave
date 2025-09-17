'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

// 제스처 타입
export type GestureType = 'tap' | 'longpress' | 'swipe' | 'pinch' | 'drag'

// 인터랙션 이벤트 타입
export interface UnifiedInteractionEvent {
  type: 'start' | 'move' | 'end' | 'cancel'
  gesture: GestureType
  x: number
  y: number
  deltaX?: number
  deltaY?: number
  scale?: number
  rotation?: number
  touches?: number
  velocity?: { x: number; y: number }
  timestamp: number
}

// 제스처 인식 옵션
export interface GestureOptions {
  longPressThreshold?: number // 롱프레스 임계값 (ms)
  swipeThreshold?: number // 스와이프 임계값 (px)
  swipeVelocityThreshold?: number // 스와이프 속도 임계값
  enableHaptic?: boolean // 햅틱 피드백 활성화
  enablePinch?: boolean // 핀치 제스처 활성화
  enableSwipe?: boolean // 스와이프 제스처 활성화
}

// 통합 인터랙션 훅 옵션
export interface UseUnifiedInteractionOptions extends GestureOptions {
  onInteraction?: (event: UnifiedInteractionEvent) => void
  onGestureStart?: (gesture: GestureType) => void
  onGestureEnd?: (gesture: GestureType) => void
  disabled?: boolean
}

// 햅틱 피드백 유틸리티
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const durations = {
      light: 10,
      medium: 20,
      heavy: 30
    }
    navigator.vibrate(durations[type])
  }
}

// 벡터 계산 유틸리티
const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

const calculateVelocity = (deltaX: number, deltaY: number, deltaTime: number) => {
  if (deltaTime === 0) return { x: 0, y: 0 }
  return {
    x: deltaX / deltaTime,
    y: deltaY / deltaTime
  }
}

// 통합 인터랙션 훅
export function useUnifiedInteraction(
  elementRef: React.RefObject<HTMLElement>,
  options: UseUnifiedInteractionOptions = {}
) {
  const {
    longPressThreshold = 500,
    swipeThreshold = 50,
    swipeVelocityThreshold = 0.5,
    enableHaptic = true,
    enablePinch = true,
    enableSwipe = true,
    onInteraction,
    onGestureStart,
    onGestureEnd,
    disabled = false
  } = options

  // 상태 관리
  const [isInteracting, setIsInteracting] = useState(false)
  const [currentGesture, setCurrentGesture] = useState<GestureType | null>(null)

  // 제스처 상태
  const gestureStateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    initialDistance: 0,
    initialScale: 1,
    longPressTimer: null as NodeJS.Timeout | null,
    gestureDetected: false,
    touchCount: 0
  })

  // 제스처 감지
  const detectGesture = useCallback((
    deltaX: number,
    deltaY: number,
    deltaTime: number,
    touchCount: number
  ): GestureType | null => {
    const distance = calculateDistance(0, 0, deltaX, deltaY)
    const velocity = calculateVelocity(deltaX, deltaY, deltaTime)

    // 핀치 제스처 (멀티터치)
    if (touchCount > 1 && enablePinch) {
      return 'pinch'
    }

    // 스와이프 제스처
    if (enableSwipe && distance > swipeThreshold) {
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
      if (speed > swipeVelocityThreshold) {
        return 'swipe'
      }
    }

    // 드래그 제스처
    if (distance > 8) {
      return 'drag'
    }

    // 롱프레스 체크는 타이머로 처리
    // 탭은 종료 시점에 판단

    return null
  }, [enablePinch, enableSwipe, swipeThreshold, swipeVelocityThreshold])

  // 인터랙션 이벤트 생성
  const createEvent = useCallback((
    type: 'start' | 'move' | 'end' | 'cancel',
    e: PointerEvent | TouchEvent,
    gesture: GestureType
  ): UnifiedInteractionEvent => {
    const state = gestureStateRef.current
    const now = Date.now()

    let x = 0, y = 0
    let touches = 1

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      x = touch?.clientX || 0
      y = touch?.clientY || 0
      touches = e.touches.length
    } else {
      x = e.clientX
      y = e.clientY
    }

    const deltaX = x - state.startX
    const deltaY = y - state.startY
    const deltaTime = now - state.lastTime || 1

    const event: UnifiedInteractionEvent = {
      type,
      gesture,
      x,
      y,
      deltaX,
      deltaY,
      touches,
      timestamp: now
    }

    // 속도 계산
    if (type === 'move' || type === 'end') {
      event.velocity = calculateVelocity(
        x - state.lastX,
        y - state.lastY,
        deltaTime
      )
    }

    // 핀치 제스처의 경우 스케일 계산
    if (gesture === 'pinch' && 'touches' in e && e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = calculateDistance(
        touch1.clientX,
        touch1.clientY,
        touch2.clientX,
        touch2.clientY
      )

      if (type === 'start') {
        state.initialDistance = distance
      } else if (state.initialDistance > 0) {
        event.scale = distance / state.initialDistance
      }
    }

    // 상태 업데이트
    state.lastX = x
    state.lastY = y
    state.lastTime = now

    return event
  }, [])

  // 롱프레스 타이머 시작
  const startLongPressTimer = useCallback(() => {
    const state = gestureStateRef.current
    
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer)
    }

    state.longPressTimer = setTimeout(() => {
      if (!state.gestureDetected) {
        state.gestureDetected = true
        setCurrentGesture('longpress')
        onGestureStart?.('longpress')
        
        if (enableHaptic) {
          triggerHaptic('medium')
        }

        const event = createEvent('start', {
          clientX: state.lastX,
          clientY: state.lastY
        } as PointerEvent, 'longpress')
        
        onInteraction?.(event)
      }
    }, longPressThreshold)
  }, [longPressThreshold, enableHaptic, onGestureStart, onInteraction, createEvent])

  // 롱프레스 타이머 정리
  const clearLongPressTimer = useCallback(() => {
    const state = gestureStateRef.current
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer)
      state.longPressTimer = null
    }
  }, [])

  // 포인터 이벤트 핸들러
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (disabled) return

    const state = gestureStateRef.current
    state.startX = e.clientX
    state.startY = e.clientY
    state.lastX = e.clientX
    state.lastY = e.clientY
    state.startTime = Date.now()
    state.lastTime = Date.now()
    state.gestureDetected = false
    state.touchCount = 1

    setIsInteracting(true)
    
    // 롱프레스 타이머 시작
    startLongPressTimer()

    // 캡처 시작
    const element = elementRef.current
    if (element) {
      element.setPointerCapture(e.pointerId)
    }
  }, [disabled, startLongPressTimer, elementRef])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (disabled || !isInteracting) return

    const state = gestureStateRef.current
    const now = Date.now()
    const deltaX = e.clientX - state.startX
    const deltaY = e.clientY - state.startY
    const deltaTime = now - state.startTime

    // 제스처 감지
    if (!state.gestureDetected) {
      const gesture = detectGesture(deltaX, deltaY, deltaTime, state.touchCount)
      
      if (gesture) {
        clearLongPressTimer()
        state.gestureDetected = true
        setCurrentGesture(gesture)
        onGestureStart?.(gesture)

        if (enableHaptic && gesture === 'drag') {
          triggerHaptic('light')
        }
      }
    }

    // 현재 제스처에 따른 이벤트 생성
    if (state.gestureDetected && currentGesture) {
      const event = createEvent('move', e, currentGesture)
      onInteraction?.(event)
    }
  }, [disabled, isInteracting, detectGesture, clearLongPressTimer, currentGesture, enableHaptic, onGestureStart, onInteraction, createEvent])

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (disabled) return

    const state = gestureStateRef.current
    clearLongPressTimer()

    // 제스처가 감지되지 않았으면 탭으로 처리
    if (!state.gestureDetected) {
      const now = Date.now()
      const duration = now - state.startTime
      const deltaX = e.clientX - state.startX
      const deltaY = e.clientY - state.startY
      const distance = calculateDistance(0, 0, deltaX, deltaY)

      if (duration < 300 && distance < 10) {
        const event = createEvent('end', e, 'tap')
        onInteraction?.(event)
        
        if (enableHaptic) {
          triggerHaptic('light')
        }
      }
    } else if (currentGesture) {
      // 진행 중인 제스처 종료
      const event = createEvent('end', e, currentGesture)
      onInteraction?.(event)
      onGestureEnd?.(currentGesture)
    }

    // 상태 리셋
    setIsInteracting(false)
    setCurrentGesture(null)
    state.gestureDetected = false

    // 캡처 해제
    const element = elementRef.current
    if (element) {
      element.releasePointerCapture(e.pointerId)
    }
  }, [disabled, clearLongPressTimer, currentGesture, enableHaptic, onInteraction, onGestureEnd, createEvent, elementRef])

  const handlePointerCancel = useCallback((e: PointerEvent) => {
    if (disabled) return

    clearLongPressTimer()

    if (currentGesture) {
      const event = createEvent('cancel', e, currentGesture)
      onInteraction?.(event)
      onGestureEnd?.(currentGesture)
    }

    // 상태 리셋
    setIsInteracting(false)
    setCurrentGesture(null)
    gestureStateRef.current.gestureDetected = false
  }, [disabled, clearLongPressTimer, currentGesture, onInteraction, onGestureEnd, createEvent])

  // 터치 이벤트 핸들러 (멀티터치 지원)
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return

    const state = gestureStateRef.current
    state.touchCount = e.touches.length

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      state.startX = touch.clientX
      state.startY = touch.clientY
      state.lastX = touch.clientX
      state.lastY = touch.clientY
      state.startTime = Date.now()
      state.lastTime = Date.now()
      
      startLongPressTimer()
    } else if (e.touches.length === 2 && enablePinch) {
      // 핀치 제스처 시작
      clearLongPressTimer()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      state.initialDistance = calculateDistance(
        touch1.clientX,
        touch1.clientY,
        touch2.clientX,
        touch2.clientY
      )
      state.gestureDetected = true
      setCurrentGesture('pinch')
      onGestureStart?.('pinch')
    }

    setIsInteracting(true)
  }, [disabled, enablePinch, startLongPressTimer, clearLongPressTimer, onGestureStart])

  // 이벤트 리스너 등록
  useEffect(() => {
    const element = elementRef.current
    if (!element || disabled) return

    // PointerEvents 지원 확인
    const supportsPointerEvents = 'onpointerdown' in window

    if (supportsPointerEvents) {
      // PointerEvents 사용
      element.addEventListener('pointerdown', handlePointerDown)
      element.addEventListener('pointermove', handlePointerMove)
      element.addEventListener('pointerup', handlePointerUp)
      element.addEventListener('pointercancel', handlePointerCancel)
    } else {
      // TouchEvents 폴백
      element.addEventListener('touchstart', handleTouchStart as any)
      // 마우스 이벤트도 폴백으로 추가
      element.addEventListener('mousedown', handlePointerDown as any)
      element.addEventListener('mousemove', handlePointerMove as any)
      element.addEventListener('mouseup', handlePointerUp as any)
    }

    return () => {
      // cleanup 함수에서 element가 null일 수 있으므로 재확인
      const el = elementRef.current
      if (!el) return
      
      if (supportsPointerEvents) {
        el.removeEventListener('pointerdown', handlePointerDown)
        el.removeEventListener('pointermove', handlePointerMove)
        el.removeEventListener('pointerup', handlePointerUp)
        el.removeEventListener('pointercancel', handlePointerCancel)
      } else {
        el.removeEventListener('touchstart', handleTouchStart as any)
        el.removeEventListener('mousedown', handlePointerDown as any)
        el.removeEventListener('mousemove', handlePointerMove as any)
        el.removeEventListener('mouseup', handlePointerUp as any)
      }
    }
  }, [elementRef, disabled, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel, handleTouchStart])

  return {
    isInteracting,
    currentGesture,
    triggerHaptic: enableHaptic ? triggerHaptic : undefined
  }
}

// 드래그 앤 드롭용 특화 훅
export function useUnifiedDrag(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    onDragStart?: (x: number, y: number) => void
    onDragMove?: (deltaX: number, deltaY: number, velocity: { x: number; y: number }) => void
    onDragEnd?: (x: number, y: number) => void
    onLongPress?: (x: number, y: number) => void
    disabled?: boolean
    enableHaptic?: boolean
  } = {}
) {
  const handleInteraction = useCallback((event: UnifiedInteractionEvent) => {
    switch (event.gesture) {
      case 'drag':
        if (event.type === 'start') {
          options.onDragStart?.(event.x, event.y)
        } else if (event.type === 'move' && event.deltaX !== undefined && event.deltaY !== undefined && event.velocity) {
          options.onDragMove?.(event.deltaX, event.deltaY, event.velocity)
        } else if (event.type === 'end') {
          options.onDragEnd?.(event.x, event.y)
        }
        break
      
      case 'longpress':
        if (event.type === 'start') {
          options.onLongPress?.(event.x, event.y)
        }
        break
    }
  }, [options])

  return useUnifiedInteraction(elementRef, {
    onInteraction: handleInteraction,
    disabled: options.disabled,
    enableHaptic: options.enableHaptic,
    enableSwipe: false, // 드래그에서는 스와이프 비활성화
    longPressThreshold: 500
  })
}