import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { AnimationPerformanceOptimizer } from '../../lib/dashboard/ios-animations/performance-optimizer';

describe('AnimationPerformanceOptimizer', () => {
  let optimizer: AnimationPerformanceOptimizer;
  let rafMock: jest.SpyInstance;
  let originalRAF: typeof window.requestAnimationFrame;

  beforeEach(() => {
    optimizer = new AnimationPerformanceOptimizer();
    
    // Mock requestAnimationFrame
    originalRAF = global.requestAnimationFrame;
    let frameId = 0;
    rafMock = jest.spyOn(global, 'requestAnimationFrame' as any).mockImplementation((callback: FrameRequestCallback) => {
      frameId++;
      setTimeout(() => callback(performance.now()), 16); // 약 60fps 시뮬레이션
      return frameId;
    });

    // Mock performance.now
    jest.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.requestAnimationFrame = originalRAF;
  });

  describe('초기화', () => {
    it('기본 설정으로 초기화되어야 함', () => {
      expect(optimizer).toBeDefined();
      const metrics = optimizer.getMetrics();
      expect(metrics.fps).toBe(60);
      expect(metrics.frameTime).toBe(0);
      expect(metrics.droppedFrames).toBe(0);
    });
  });

  describe('GPU 가속 CSS', () => {
    it('기본 GPU 가속 스타일을 생성해야 함', () => {
      const styles = optimizer.getGPUAcceleratedStyles();
      
      expect(styles).toHaveProperty('transform');
      expect(styles).toHaveProperty('backfaceVisibility');
      expect(styles.backfaceVisibility).toBe('hidden');
      expect(styles.transform).toContain('translateZ(0)');
    });

    it('변환과 함께 GPU 가속 스타일을 생성해야 함', () => {
      const styles = optimizer.getGPUAcceleratedStyles({
        x: 100,
        y: 50,
        scale: 1.2,
        rotate: 45,
      });
      
      expect(styles.transform).toContain('translate3d(100px, 50px, 0)');
      expect(styles.transform).toContain('scale(1.2)');
      expect(styles.transform).toContain('rotate(45deg)');
    });

    it('will-change 속성을 포함해야 함', () => {
      const styles = optimizer.getGPUAcceleratedStyles({}, true);
      
      expect(styles).toHaveProperty('willChange');
      expect(styles.willChange).toBe('transform');
    });
  });

  describe('애니메이션 스케줄링', () => {
    it('애니메이션을 스케줄링해야 함', (done) => {
      const callback = jest.fn();
      
      optimizer.scheduleAnimation('test-animation', callback);
      
      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
        done();
      }, 20);
    });

    it('동일한 ID의 애니메이션은 덮어써야 함', (done) => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      optimizer.scheduleAnimation('test-animation', callback1);
      optimizer.scheduleAnimation('test-animation', callback2);
      
      setTimeout(() => {
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
        done();
      }, 20);
    });

    it('애니메이션을 취소할 수 있어야 함', (done) => {
      const callback = jest.fn();
      
      optimizer.scheduleAnimation('test-animation', callback);
      optimizer.cancelAnimation('test-animation');
      
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      }, 20);
    });
  });

  describe('애니메이션 배칭', () => {
    it('애니메이션을 배치로 실행해야 함', (done) => {
      const animations = [
        jest.fn(),
        jest.fn(),
        jest.fn(),
      ];
      
      optimizer.batchAnimations(animations);
      
      setTimeout(() => {
        animations.forEach(animation => {
          expect(animation).toHaveBeenCalled();
        });
        done();
      }, 20);
    });

    it('비동기 애니메이션을 순차적으로 실행해야 함', async () => {
      const results: number[] = [];
      
      const animations = [
        async () => { results.push(1); },
        async () => { results.push(2); },
        async () => { results.push(3); },
      ];
      
      await optimizer.batchAnimations(animations);
      
      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('DOM 업데이트 배칭', () => {
    it('DOM 업데이트를 배치로 실행해야 함', (done) => {
      const updates = [
        jest.fn(),
        jest.fn(),
        jest.fn(),
      ];
      
      optimizer.batchDOMUpdates(updates);
      
      setTimeout(() => {
        updates.forEach(update => {
          expect(update).toHaveBeenCalled();
        });
        done();
      }, 20);
    });

    it('우선순위에 따라 업데이트를 정렬해야 함', (done) => {
      const results: number[] = [];
      
      optimizer.batchDOMUpdates([
        { update: () => results.push(2), priority: 2 },
        { update: () => results.push(1), priority: 1 },
        { update: () => results.push(3), priority: 3 },
      ]);
      
      setTimeout(() => {
        expect(results).toEqual([1, 2, 3]);
        done();
      }, 20);
    });
  });

  describe('성능 모니터링', () => {
    it('FPS를 측정해야 함', () => {
      optimizer.startMonitoring();
      
      // 몇 프레임 시뮬레이션
      for (let i = 0; i < 10; i++) {
        jest.spyOn(performance, 'now').mockReturnValue(i * 16.67); // 60fps
        optimizer.measureFrame();
      }
      
      const metrics = optimizer.getMetrics();
      expect(metrics.fps).toBeCloseTo(60, 0);
      
      optimizer.stopMonitoring();
    });

    it('프레임 드롭을 감지해야 함', () => {
      optimizer.startMonitoring();
      
      // 정상 프레임
      jest.spyOn(performance, 'now').mockReturnValue(0);
      optimizer.measureFrame();
      
      // 프레임 드롭 (33ms = 2프레임 시간)
      jest.spyOn(performance, 'now').mockReturnValue(33);
      optimizer.measureFrame();
      
      const metrics = optimizer.getMetrics();
      expect(metrics.droppedFrames).toBeGreaterThan(0);
      
      optimizer.stopMonitoring();
    });

    it('Jank를 감지해야 함', () => {
      optimizer.startMonitoring();
      
      // 정상 프레임
      jest.spyOn(performance, 'now').mockReturnValue(0);
      optimizer.measureFrame();
      
      // Jank (100ms 지연)
      jest.spyOn(performance, 'now').mockReturnValue(100);
      optimizer.measureFrame();
      
      const metrics = optimizer.getMetrics();
      expect(metrics.jankCount).toBeGreaterThan(0);
      
      optimizer.stopMonitoring();
    });
  });

  describe('성능 레벨', () => {
    it('성능 레벨을 자동으로 조정해야 함', () => {
      optimizer.startMonitoring();
      
      // 낮은 FPS 시뮬레이션
      for (let i = 0; i < 10; i++) {
        jest.spyOn(performance, 'now').mockReturnValue(i * 33); // 30fps
        optimizer.measureFrame();
      }
      
      const level = optimizer.getPerformanceLevel();
      expect(level).toBe('low');
      
      optimizer.stopMonitoring();
    });

    it('수동으로 성능 레벨을 설정할 수 있어야 함', () => {
      optimizer.setPerformanceLevel('medium');
      expect(optimizer.getPerformanceLevel()).toBe('medium');
    });

    it('성능 레벨에 따라 최적화를 조정해야 함', () => {
      optimizer.setPerformanceLevel('low');
      const lowConfig = optimizer.getOptimizationConfig();
      
      optimizer.setPerformanceLevel('high');
      const highConfig = optimizer.getOptimizationConfig();
      
      // 낮은 성능에서는 더 많은 최적화
      expect(lowConfig.reduceMotion).toBe(true);
      expect(highConfig.reduceMotion).toBe(false);
    });
  });

  describe('애니메이션 정리', () => {
    it('모든 애니메이션을 정리해야 함', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      optimizer.scheduleAnimation('animation-1', callback1);
      optimizer.scheduleAnimation('animation-2', callback2);
      
      optimizer.cleanup();
      
      // cleanup 후에는 애니메이션이 실행되지 않아야 함
      setTimeout(() => {
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
      }, 20);
    });

    it('모니터링을 중지해야 함', () => {
      optimizer.startMonitoring();
      optimizer.cleanup();
      
      const isMonitoring = optimizer.isMonitoring();
      expect(isMonitoring).toBe(false);
    });
  });

  describe('최적화 제안', () => {
    it('성능에 따른 최적화 제안을 생성해야 함', () => {
      optimizer.startMonitoring();
      
      // 낮은 FPS 시뮬레이션
      for (let i = 0; i < 10; i++) {
        jest.spyOn(performance, 'now').mockReturnValue(i * 50); // 20fps
        optimizer.measureFrame();
      }
      
      const suggestions = optimizer.getOptimizationSuggestions();
      
      expect(suggestions).toContain('reduceAnimations');
      expect(suggestions).toContain('enableGPUAcceleration');
      
      optimizer.stopMonitoring();
    });

    it('정상 성능에서는 제안이 없어야 함', () => {
      optimizer.startMonitoring();
      
      // 정상 FPS 시뮬레이션
      for (let i = 0; i < 10; i++) {
        jest.spyOn(performance, 'now').mockReturnValue(i * 16.67); // 60fps
        optimizer.measureFrame();
      }
      
      const suggestions = optimizer.getOptimizationSuggestions();
      
      expect(suggestions).toHaveLength(0);
      
      optimizer.stopMonitoring();
    });
  });

  describe('스크롤 최적화', () => {
    it('스크롤 이벤트를 최적화해야 함', () => {
      const scrollHandler = jest.fn();
      const optimizedHandler = optimizer.optimizeScrollHandler(scrollHandler);
      
      // 여러 번 호출해도 한 번만 실행되어야 함
      optimizedHandler();
      optimizedHandler();
      optimizedHandler();
      
      expect(scrollHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('리사이즈 최적화', () => {
    it('리사이즈 이벤트를 디바운스해야 함', (done) => {
      const resizeHandler = jest.fn();
      const optimizedHandler = optimizer.optimizeResizeHandler(resizeHandler, 100);
      
      // 여러 번 호출
      optimizedHandler();
      optimizedHandler();
      optimizedHandler();
      
      // 즉시는 호출되지 않음
      expect(resizeHandler).not.toHaveBeenCalled();
      
      // 디바운스 시간 후 한 번만 호출
      setTimeout(() => {
        expect(resizeHandler).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });
  });
});