/**
 * 애니메이션 성능 최적화 훅
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  AnimationPerformanceOptimizer, 
  animationOptimizer,
  AnimationPresets,
  performanceProfiler
} from '@/lib/dashboard/ios-animations/performance-optimizer';

interface AnimationPerformanceOptions {
  enabled?: boolean;
  monitorFPS?: boolean;
  targetFPS?: number;
  autoOptimize?: boolean;
  profileAnimations?: boolean;
}

interface AnimationPerformanceState {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  jank: number;
  isOptimized: boolean;
  performanceLevel: 'high' | 'medium' | 'low';
}

export function useAnimationPerformance(options: AnimationPerformanceOptions = {}) {
  const {
    enabled = true,
    monitorFPS = process.env.NODE_ENV === 'development',
    targetFPS = 60,
    autoOptimize = true,
    profileAnimations = false
  } = options;

  const [state, setState] = useState<AnimationPerformanceState>({
    fps: 60,
    frameTime: 16.67,
    droppedFrames: 0,
    jank: 0,
    isOptimized: false,
    performanceLevel: 'high'
  });

  const animationQueueRef = useRef<Map<string, () => void>>(new Map());
  const optimizerRef = useRef(animationOptimizer);

  // 성능 레벨 결정
  const determinePerformanceLevel = useCallback((fps: number): 'high' | 'medium' | 'low' => {
    if (fps >= 55) return 'high';
    if (fps >= 30) return 'medium';
    return 'low';
  }, []);

  // 애니메이션 스케줄링
  const scheduleAnimation = useCallback((id: string, callback: () => void) => {
    if (!enabled) {
      callback();
      return;
    }

    if (profileAnimations) {
      performanceProfiler.mark(`animation-${id}-start`);
    }

    optimizerRef.current.scheduleAnimation(id, () => {
      callback();
      
      if (profileAnimations) {
        const duration = performanceProfiler.measure(`animation-${id}`, `animation-${id}-start`);
        if (duration > 16.67) {
          console.warn(`Animation ${id} took ${duration.toFixed(2)}ms (target: 16.67ms)`);
        }
      }
    });
  }, [enabled, profileAnimations]);

  // 배치 애니메이션 실행
  const batchAnimations = useCallback((animations: (() => void)[]) => {
    if (!enabled) {
      animations.forEach(fn => fn());
      return;
    }

    AnimationPerformanceOptimizer.batchAnimations(animations);
  }, [enabled]);

  // GPU 가속 스타일 생성
  const getGPUStyles = useCallback((willChange: string[] = []) => {
    if (!enabled) {
      return {};
    }

    return AnimationPerformanceOptimizer.getGPUAcceleratedStyles({
      useGPU: state.performanceLevel !== 'low',
      willChange: state.performanceLevel === 'high' ? willChange : [],
      transform3d: state.performanceLevel !== 'low',
      containment: true
    });
  }, [enabled, state.performanceLevel]);

  // 위젯 애니메이션 스타일
  const getWidgetStyles = useCallback((isAnimating: boolean = false) => {
    if (!enabled) {
      return {};
    }

    // 성능 레벨에 따른 스타일 조정
    if (state.performanceLevel === 'low') {
      // 낮은 성능: 애니메이션 비활성화
      return {
        transition: 'none',
        animation: 'none'
      };
    }

    return AnimationPerformanceOptimizer.getOptimizedWidgetStyles(isAnimating);
  }, [enabled, state.performanceLevel]);

  // 애니메이션 프리셋 가져오기
  const getAnimationPreset = useCallback((preset: keyof typeof AnimationPresets) => {
    if (!enabled || state.performanceLevel === 'low') {
      // 낮은 성능: 간단한 애니메이션만
      return {
        animate: {},
        transition: { duration: 0 }
      };
    }

    if (state.performanceLevel === 'medium') {
      // 중간 성능: 단순화된 애니메이션
      const original = AnimationPresets[preset];
      return {
        ...original,
        transition: {
          ...original.transition,
          duration: (original.transition?.duration || 0.3) * 0.7
        }
      };
    }

    return AnimationPresets[preset];
  }, [enabled, state.performanceLevel]);

  // 스크롤 최적화
  const optimizeScroll = useCallback((element: HTMLElement | null) => {
    if (!element || !enabled) return;

    AnimationPerformanceOptimizer.optimizeScroll(element);
  }, [enabled]);

  // 리사이즈 핸들러 최적화
  const createOptimizedResizeHandler = useCallback((
    callback: () => void,
    delay: number = 100
  ) => {
    if (!enabled) return callback;

    return AnimationPerformanceOptimizer.createOptimizedResizeHandler(callback, delay);
  }, [enabled]);

  // DOM 업데이트 배치
  const batchDOMUpdates = useCallback((updates: (() => void)[]) => {
    if (!enabled) {
      updates.forEach(fn => fn());
      return;
    }

    AnimationPerformanceOptimizer.batchDOMUpdates(updates);
  }, [enabled]);

  // 성능 모니터링
  useEffect(() => {
    if (!enabled || !monitorFPS) return;

    const updateMetrics = (metrics: any) => {
      setState(prev => ({
        ...prev,
        fps: metrics.fps,
        frameTime: metrics.frameTime,
        droppedFrames: metrics.droppedFrames,
        jank: metrics.jank,
        performanceLevel: determinePerformanceLevel(metrics.fps)
      }));

      // 자동 최적화
      if (autoOptimize && metrics.fps < targetFPS * 0.9) {
        setState(prev => ({
          ...prev,
          isOptimized: true
        }));
      }
    };

    optimizerRef.current.startMonitoring(updateMetrics);

    return () => {
      optimizerRef.current.cleanup();
    };
  }, [enabled, monitorFPS, autoOptimize, targetFPS, determinePerformanceLevel]);

  // 성능 프로파일 리포트
  const getPerformanceReport = useCallback(() => {
    if (!profileAnimations) {
      return null;
    }

    return performanceProfiler.getReport();
  }, [profileAnimations]);

  // 성능 프로파일 초기화
  const clearPerformanceProfile = useCallback(() => {
    performanceProfiler.clear();
  }, []);

  return {
    // 상태
    ...state,
    
    // 애니메이션 스케줄링
    scheduleAnimation,
    batchAnimations,
    
    // 스타일 헬퍼
    getGPUStyles,
    getWidgetStyles,
    getAnimationPreset,
    
    // 최적화 유틸리티
    optimizeScroll,
    createOptimizedResizeHandler,
    batchDOMUpdates,
    
    // 성능 분석
    getPerformanceReport,
    clearPerformanceProfile
  };
}

// 개발 모드용 성능 모니터 컴포넌트
export function AnimationPerformanceMonitor() {
  const { fps, frameTime, droppedFrames, jank, performanceLevel } = useAnimationPerformance({
    monitorFPS: true
  });

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getPerformanceColor = () => {
    if (performanceLevel === 'high') return '#10b981';
    if (performanceLevel === 'medium') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <div style={{ color: getPerformanceColor(), fontWeight: 'bold' }}>
        FPS: {fps.toFixed(1)}
      </div>
      <div>Frame: {frameTime.toFixed(2)}ms</div>
      <div>Dropped: {droppedFrames}</div>
      <div>Jank: {jank}</div>
      <div>Level: {performanceLevel}</div>
    </div>
  );
}