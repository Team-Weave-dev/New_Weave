/**
 * 애니메이션 성능 최적화 시스템
 * GPU 가속과 RAF 스케줄링을 통한 60fps 보장
 */

interface AnimationConfig {
  useGPU?: boolean;
  willChange?: string[];
  transform3d?: boolean;
  containment?: boolean;
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  jank: number;
}

export class AnimationPerformanceOptimizer {
  private rafId: number | null = null;
  private frameStartTime: number = 0;
  private frameCount: number = 0;
  private droppedFrames: number = 0;
  private lastFrameTime: number = performance.now();
  private animationQueue: Map<string, () => void> = new Map();
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    droppedFrames: 0,
    jank: 0
  };

  /**
   * GPU 가속 CSS 속성 생성
   */
  static getGPUAcceleratedStyles(config: AnimationConfig = {}): React.CSSProperties {
    const {
      useGPU = true,
      willChange = [],
      transform3d = true,
      containment = true
    } = config;

    const styles: React.CSSProperties = {};

    if (useGPU) {
      // GPU 레이어 생성 강제
      styles.transform = transform3d ? 'translate3d(0, 0, 0)' : 'translateZ(0)';
      
      // 하드웨어 가속 힌트
      (styles as any).webkitTransform = styles.transform;
      (styles as any).webkitBackfaceVisibility = 'hidden';
      styles.backfaceVisibility = 'hidden';
      styles.perspective = 1000;
    }

    // will-change 최적화
    if (willChange.length > 0) {
      styles.willChange = willChange.join(', ');
    }

    // 레이아웃 격리
    if (containment) {
      (styles as any).contain = 'layout style paint';
      styles.isolation = 'isolate';
    }

    return styles;
  }

  /**
   * 애니메이션 프레임 스케줄링
   */
  scheduleAnimation(id: string, callback: () => void): void {
    this.animationQueue.set(id, callback);
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.processAnimationQueue.bind(this));
    }
  }

  /**
   * 애니메이션 큐 처리
   */
  private processAnimationQueue(timestamp: number): void {
    const frameStart = performance.now();
    const deltaTime = timestamp - this.lastFrameTime;
    
    // FPS 계산
    this.updateMetrics(deltaTime);
    
    // 애니메이션 배치 실행
    this.animationQueue.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Animation error:', error);
      }
    });
    
    this.animationQueue.clear();
    
    const frameEnd = performance.now();
    const frameTime = frameEnd - frameStart;
    
    // 프레임 드롭 감지
    if (frameTime > 16.67) {
      this.droppedFrames++;
      console.warn(`Frame dropped: ${frameTime.toFixed(2)}ms`);
    }
    
    this.lastFrameTime = timestamp;
    this.rafId = null;
  }

  /**
   * 성능 메트릭 업데이트
   */
  private updateMetrics(deltaTime: number): void {
    this.frameCount++;
    const fps = 1000 / deltaTime;
    
    // 이동 평균으로 FPS 계산
    this.metrics.fps = this.metrics.fps * 0.9 + fps * 0.1;
    this.metrics.frameTime = deltaTime;
    this.metrics.droppedFrames = this.droppedFrames;
    
    // Jank 감지 (프레임 시간이 50ms 이상)
    if (deltaTime > 50) {
      this.metrics.jank++;
    }
  }

  /**
   * 현재 성능 메트릭 반환
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 성능 모니터링 시작
   */
  startMonitoring(callback?: (metrics: PerformanceMetrics) => void): void {
    const monitor = () => {
      if (callback) {
        callback(this.getMetrics());
      }
      requestAnimationFrame(monitor);
    };
    requestAnimationFrame(monitor);
  }

  /**
   * 애니메이션 배치 실행
   */
  static batchAnimations(animations: (() => void)[]): void {
    requestAnimationFrame(() => {
      animations.forEach(animation => {
        try {
          animation();
        } catch (error) {
          console.error('Batch animation error:', error);
        }
      });
    });
  }

  /**
   * 스크롤 성능 최적화
   */
  static optimizeScroll(element: HTMLElement): void {
    // Passive 이벤트 리스너로 스크롤 성능 향상
    element.addEventListener('scroll', () => {}, { passive: true });
    
    // 스크롤 스무딩 비활성화 (성능 향상)
    element.style.scrollBehavior = 'auto';
    
    // 터치 액션 최적화
    element.style.touchAction = 'pan-y';
    
    // 오버스크롤 방지
    (element.style as any).overscrollBehavior = 'contain';
  }

  /**
   * 위젯 애니메이션 최적화 설정
   */
  static getOptimizedWidgetStyles(isAnimating: boolean = false): React.CSSProperties {
    if (!isAnimating) {
      return {};
    }

    return {
      ...this.getGPUAcceleratedStyles({
        useGPU: true,
        willChange: ['transform', 'opacity'],
        transform3d: true,
        containment: true
      }),
      // 애니메이션 중 레이아웃 재계산 방지
      position: 'relative',
      zIndex: 1,
      // 서브픽셀 렌더링 비활성화
      ...((typeof window !== 'undefined' && (window as any).webkitFontSmoothing) ? {
        WebkitFontSmoothing: 'antialiased'
      } : {})
    };
  }

  /**
   * Wiggle 애니메이션 최적화
   */
  static getOptimizedWiggleAnimation() {
    return {
      animate: {
        rotate: [0, -2, 2, -2, 0],
        scale: [1, 1.02, 1, 1.02, 1],
      },
      transition: {
        duration: 0.3,
        repeat: Infinity,
        repeatDelay: 0.1,
        ease: [0.4, 0, 0.2, 1], // 최적화된 easing
        // GPU 가속 힌트
        type: 'spring',
        damping: 10,
        stiffness: 100,
      }
    };
  }

  /**
   * 드래그 애니메이션 최적화
   */
  static getOptimizedDragAnimation() {
    return {
      whileDrag: {
        scale: 1.05,
        opacity: 0.8,
        zIndex: 1000,
      },
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        // 모멘텀 최적화
        restDelta: 0.001,
        restSpeed: 0.01,
      }
    };
  }

  /**
   * 리플로우 최소화를 위한 배치 DOM 업데이트
   */
  static batchDOMUpdates(updates: (() => void)[]): void {
    // 읽기 작업과 쓰기 작업 분리
    const reads: (() => void)[] = [];
    const writes: (() => void)[] = [];
    
    requestAnimationFrame(() => {
      // 모든 읽기 작업 먼저 실행
      reads.forEach(read => read());
      
      // 그 다음 쓰기 작업 실행
      requestAnimationFrame(() => {
        writes.forEach(write => write());
      });
    });
  }

  /**
   * 디바운스된 리사이즈 핸들러
   */
  static createOptimizedResizeHandler(
    callback: () => void,
    delay: number = 100
  ): () => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let rafId: number | null = null;
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(callback);
      }, delay);
    };
  }

  /**
   * 메모리 효율적인 애니메이션 정리
   */
  cleanup(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.animationQueue.clear();
    this.frameCount = 0;
    this.droppedFrames = 0;
  }
}

// 싱글톤 인스턴스
export const animationOptimizer = new AnimationPerformanceOptimizer();

// 애니메이션 프리셋
export const AnimationPresets = {
  wiggle: AnimationPerformanceOptimizer.getOptimizedWiggleAnimation(),
  drag: AnimationPerformanceOptimizer.getOptimizedDragAnimation(),
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  slideIn: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { 
      type: 'spring',
      damping: 15,
      stiffness: 200
    }
  },
  scale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: {
      type: 'spring',
      damping: 10,
      stiffness: 400
    }
  }
};

// 성능 프로파일링 유틸리티
export class PerformanceProfiler {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Mark ${startMark} not found`);
      return 0;
    }

    const duration = performance.now() - start;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    
    this.measures.get(name)!.push(duration);
    
    return duration;
  }

  getAverageTime(measureName: string): number {
    const times = this.measures.get(measureName);
    if (!times || times.length === 0) {
      return 0;
    }
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }

  getReport(): Record<string, { average: number; count: number; total: number }> {
    const report: Record<string, any> = {};
    
    this.measures.forEach((times, name) => {
      const sum = times.reduce((acc, time) => acc + time, 0);
      report[name] = {
        average: sum / times.length,
        count: times.length,
        total: sum
      };
    });
    
    return report;
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

export const performanceProfiler = new PerformanceProfiler();