/**
 * iOS 애니메이션 훅
 * 애니메이션 상태 관리 및 제어를 위한 커스텀 훅
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAnimation } from 'framer-motion';

export interface AnimationState {
  isWiggling: boolean;
  isDragging: boolean;
  isResizing: boolean;
  isEditMode: boolean;
  isDeleting: boolean;
  isAdding: boolean;
}

export interface AnimationActions {
  startWiggle: () => void;
  stopWiggle: () => void;
  startDrag: () => void;
  endDrag: () => void;
  startResize: () => void;
  endResize: () => void;
  enterEditMode: () => void;
  exitEditMode: () => void;
  triggerHaptic: () => void;
  animateDelete: () => Promise<void>;
  animateAdd: () => Promise<void>;
}

/**
 * iOS 애니메이션 관리 훅
 */
export function useIOSAnimations(): [AnimationState, AnimationActions, any] {
  const controls = useAnimation();
  const [state, setState] = useState<AnimationState>({
    isWiggling: false,
    isDragging: false,
    isResizing: false,
    isEditMode: false,
    isDeleting: false,
    isAdding: false,
  });

  // 애니메이션 타이머 참조
  const wiggleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hapticTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Wiggle 애니메이션 시작
   */
  const startWiggle = useCallback(() => {
    setState(prev => ({ ...prev, isWiggling: true }));
    controls.start('wiggle');

    // 자동 정지 (30초 후)
    if (wiggleTimerRef.current) {
      clearTimeout(wiggleTimerRef.current);
    }
    wiggleTimerRef.current = setTimeout(() => {
      stopWiggle();
    }, 30000);
  }, [controls]);

  /**
   * Wiggle 애니메이션 정지
   */
  const stopWiggle = useCallback(() => {
    setState(prev => ({ ...prev, isWiggling: false }));
    controls.start('initial');

    if (wiggleTimerRef.current) {
      clearTimeout(wiggleTimerRef.current);
      wiggleTimerRef.current = null;
    }
  }, [controls]);

  /**
   * 드래그 시작
   */
  const startDrag = useCallback(() => {
    setState(prev => ({ ...prev, isDragging: true }));
    controls.start({
      scale: 1.1,
      opacity: 0.8,
      zIndex: 1000,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    });
  }, [controls]);

  /**
   * 드래그 종료
   */
  const endDrag = useCallback(() => {
    setState(prev => ({ ...prev, isDragging: false }));
    controls.start({
      scale: 1,
      opacity: 1,
      zIndex: 'auto',
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    });
  }, [controls]);

  /**
   * 크기 조절 시작
   */
  const startResize = useCallback(() => {
    setState(prev => ({ ...prev, isResizing: true }));
    controls.start({
      opacity: 0.7,
      transition: {
        duration: 0.2,
      },
    });
  }, [controls]);

  /**
   * 크기 조절 종료
   */
  const endResize = useCallback(() => {
    setState(prev => ({ ...prev, isResizing: false }));
    controls.start({
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    });
  }, [controls]);

  /**
   * 편집 모드 진입
   */
  const enterEditMode = useCallback(() => {
    setState(prev => ({ ...prev, isEditMode: true }));
    controls.start('edit');
    startWiggle();
  }, [controls, startWiggle]);

  /**
   * 편집 모드 종료
   */
  const exitEditMode = useCallback(() => {
    setState(prev => ({ ...prev, isEditMode: false }));
    controls.start('normal');
    stopWiggle();
  }, [controls, stopWiggle]);

  /**
   * 햅틱 피드백 시뮬레이션
   */
  const triggerHaptic = useCallback(() => {
    controls.start({
      scale: [1, 0.96, 1],
      transition: {
        duration: 0.1,
        ease: 'easeInOut',
      },
    });

    // 브라우저 진동 API 사용 (지원되는 경우)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [controls]);

  /**
   * 삭제 애니메이션
   */
  const animateDelete = useCallback(async () => {
    setState(prev => ({ ...prev, isDeleting: true }));
    
    await controls.start({
      scale: 0,
      opacity: 0,
      rotate: 90,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    });

    setState(prev => ({ ...prev, isDeleting: false }));
  }, [controls]);

  /**
   * 추가 애니메이션
   */
  const animateAdd = useCallback(async () => {
    setState(prev => ({ ...prev, isAdding: true }));
    
    await controls.start({
      scale: [0, 1.1, 1],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    });

    setState(prev => ({ ...prev, isAdding: false }));
  }, [controls]);

  /**
   * 컴포넌트 언마운트 시 타이머 정리
   */
  useEffect(() => {
    return () => {
      if (wiggleTimerRef.current) {
        clearTimeout(wiggleTimerRef.current);
      }
      if (hapticTimerRef.current) {
        clearTimeout(hapticTimerRef.current);
      }
    };
  }, []);

  const actions: AnimationActions = {
    startWiggle,
    stopWiggle,
    startDrag,
    endDrag,
    startResize,
    endResize,
    enterEditMode,
    exitEditMode,
    triggerHaptic,
    animateDelete,
    animateAdd,
  };

  return [state, actions, controls];
}