import { useCallback, useEffect, useRef, useState } from 'react';

interface TouchInteractionConfig {
  longPressDelay?: number;
  enableHapticFeedback?: boolean;
  enableScrollLock?: boolean;
  distinguishFromScroll?: boolean;
}

interface TouchState {
  isLongPressing: boolean;
  isDragging: boolean;
  isScrolling: boolean;
  touchStartPosition: { x: number; y: number } | null;
}

interface TouchHandlers {
  onTouchStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onTouchMove: (e: React.TouchEvent | React.MouseEvent) => void;
  onTouchEnd: (e: React.TouchEvent | React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

/**
 * iOS 스타일 터치 인터랙션 훅
 * Long press, 햅틱 피드백, 스크롤/드래그 구분 등 지원
 */
export function useIOSTouchInteraction(
  onLongPress?: () => void,
  onDragStart?: () => void,
  onDragEnd?: () => void,
  config: TouchInteractionConfig = {}
): [TouchState, TouchHandlers] {
  const {
    longPressDelay = 1000,
    enableHapticFeedback = true,
    enableScrollLock = true,
    distinguishFromScroll = true,
  } = config;

  const [touchState, setTouchState] = useState<TouchState>({
    isLongPressing: false,
    isDragging: false,
    isScrolling: false,
    touchStartPosition: null,
  });

  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const scrollThreshold = 10; // pixels
  const isMouseDown = useRef(false);
  const hasMovedRef = useRef(false);

  // 햅틱 피드백 시뮬레이션
  const triggerHapticFeedback = useCallback(() => {
    if (!enableHapticFeedback) return;

    // 실제 디바이스에서는 Vibration API 사용
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // 시각적 피드백으로 대체 (웹 환경)
    const event = new CustomEvent('haptic-feedback');
    window.dispatchEvent(event);
  }, [enableHapticFeedback]);

  // Long press 타이머 시작
  const startLongPressTimer = useCallback(() => {
    clearTimeout(longPressTimerRef.current);
    
    longPressTimerRef.current = setTimeout(() => {
      if (!hasMovedRef.current) {
        setTouchState(prev => ({ ...prev, isLongPressing: true }));
        triggerHapticFeedback();
        onLongPress?.();
      }
    }, longPressDelay);
  }, [longPressDelay, onLongPress, triggerHapticFeedback]);

  // Long press 타이머 정리
  const clearLongPressTimer = useCallback(() => {
    clearTimeout(longPressTimerRef.current);
  }, []);

  // 터치/마우스 시작
  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    hasMovedRef.current = false;
    
    const position = 'touches' in e
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };

    setTouchState(prev => ({
      ...prev,
      touchStartPosition: position,
      isScrolling: false,
      isDragging: false,
    }));

    // 스크롤 잠금 (모바일)
    if (enableScrollLock && 'touches' in e) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }

    startLongPressTimer();
  }, [startLongPressTimer, enableScrollLock]);

  // 터치/마우스 이동
  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!touchState.touchStartPosition) return;

    const currentPosition = 'touches' in e
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };

    const deltaX = Math.abs(currentPosition.x - touchState.touchStartPosition.x);
    const deltaY = Math.abs(currentPosition.y - touchState.touchStartPosition.y);
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 스크롤 임계값 초과 시 이동으로 판단
    if (totalMovement > scrollThreshold) {
      hasMovedRef.current = true;
      clearLongPressTimer();

      if (distinguishFromScroll) {
        // 수직 이동이 더 크면 스크롤로 판단
        if (deltaY > deltaX && !touchState.isDragging) {
          setTouchState(prev => ({
            ...prev,
            isScrolling: true,
            isLongPressing: false,
          }));
        } else if (!touchState.isScrolling) {
          // 수평 이동이 더 크거나 이미 드래그 중이면 드래그로 판단
          if (!touchState.isDragging) {
            setTouchState(prev => ({
              ...prev,
              isDragging: true,
              isLongPressing: false,
            }));
            onDragStart?.();
          }
        }
      } else if (!touchState.isDragging) {
        setTouchState(prev => ({
          ...prev,
          isDragging: true,
          isLongPressing: false,
        }));
        onDragStart?.();
      }
    }
  }, [
    touchState.touchStartPosition,
    touchState.isDragging,
    touchState.isScrolling,
    clearLongPressTimer,
    distinguishFromScroll,
    scrollThreshold,
    onDragStart,
  ]);

  // 터치/마우스 종료
  const handleEnd = useCallback(() => {
    clearLongPressTimer();
    
    // 스크롤 잠금 해제
    if (enableScrollLock) {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    if (touchState.isDragging) {
      onDragEnd?.();
    }

    setTouchState({
      isLongPressing: false,
      isDragging: false,
      isScrolling: false,
      touchStartPosition: null,
    });

    hasMovedRef.current = false;
    isMouseDown.current = false;
  }, [
    clearLongPressTimer,
    enableScrollLock,
    touchState.isDragging,
    onDragEnd,
  ]);

  // 마우스 전용 이벤트 핸들러
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isMouseDown.current = true;
    handleStart(e);
  }, [handleStart]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    handleMove(e);
  }, [handleMove]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    handleEnd();
  }, [handleEnd]);

  const onMouseLeave = useCallback((e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    handleEnd();
  }, [handleEnd]);

  // 터치 이벤트 핸들러
  const onTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    handleStart(e);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    handleMove(e);
  }, [handleMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    handleEnd();
  }, [handleEnd]);

  // 클린업
  useEffect(() => {
    return () => {
      clearLongPressTimer();
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [clearLongPressTimer]);

  return [
    touchState,
    {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
  ];
}

/**
 * 제스처 인식을 위한 유틸리티 훅
 */
export function useGestureRecognition() {
  const [gesture, setGesture] = useState<string | null>(null);
  const gestureStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gesturePathRef = useRef<Array<{ x: number; y: number; time: number }>>([]);

  const startGesture = useCallback((x: number, y: number) => {
    gestureStartRef.current = { x, y, time: Date.now() };
    gesturePathRef.current = [{ x, y, time: Date.now() }];
    setGesture(null);
  }, []);

  const updateGesture = useCallback((x: number, y: number) => {
    if (!gestureStartRef.current) return;
    
    gesturePathRef.current.push({ x, y, time: Date.now() });
    
    // 간단한 제스처 인식 (스와이프)
    const deltaX = x - gestureStartRef.current.x;
    const deltaY = y - gestureStartRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const minDistance = 50;

    if (absX > minDistance || absY > minDistance) {
      if (absX > absY) {
        setGesture(deltaX > 0 ? 'swipe-right' : 'swipe-left');
      } else {
        setGesture(deltaY > 0 ? 'swipe-down' : 'swipe-up');
      }
    }
  }, []);

  const endGesture = useCallback(() => {
    if (!gestureStartRef.current) return;
    
    const duration = Date.now() - gestureStartRef.current.time;
    const path = gesturePathRef.current;
    
    // 빠른 탭 감지
    if (duration < 200 && path.length < 3) {
      setGesture('tap');
    }
    
    // 더블 탭 감지 로직 추가 가능
    
    gestureStartRef.current = null;
    gesturePathRef.current = [];
  }, []);

  return {
    gesture,
    startGesture,
    updateGesture,
    endGesture,
  };
}

/**
 * 스크롤과 드래그를 구분하는 유틸리티 훅
 */
export function useScrollDragDistinction() {
  const [isVerticalScroll, setIsVerticalScroll] = useState(false);
  const [isHorizontalDrag, setIsHorizontalDrag] = useState(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const angleThreshold = 30; // degrees

  const handleStart = useCallback((x: number, y: number) => {
    startPosRef.current = { x, y };
    setIsVerticalScroll(false);
    setIsHorizontalDrag(false);
  }, []);

  const handleMove = useCallback((x: number, y: number) => {
    if (!startPosRef.current) return;

    const deltaX = x - startPosRef.current.x;
    const deltaY = y - startPosRef.current.y;
    
    // 각도 계산
    const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
    
    // 수직에 가까운 움직임 (위/아래)
    if (angle > 90 - angleThreshold || angle < angleThreshold) {
      setIsVerticalScroll(true);
      setIsHorizontalDrag(false);
    }
    // 수평에 가까운 움직임 (좌/우)
    else if (angle > angleThreshold && angle < 90 - angleThreshold) {
      setIsHorizontalDrag(true);
      setIsVerticalScroll(false);
    }
  }, [angleThreshold]);

  const handleEnd = useCallback(() => {
    startPosRef.current = null;
    setIsVerticalScroll(false);
    setIsHorizontalDrag(false);
  }, []);

  return {
    isVerticalScroll,
    isHorizontalDrag,
    handleStart,
    handleMove,
    handleEnd,
  };
}