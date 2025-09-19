/**
 * 애니메이션 컨트롤러
 * 중앙화된 애니메이션 관리 및 조정
 */

// framer-motion types

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  ease?: string | number[];
  stiffness?: number;
  damping?: number;
  mass?: number;
  type?: 'spring' | 'tween' | 'inertia';
}

export interface AnimationSequence {
  name: string;
  target: any;
  config?: AnimationConfig;
  wait?: number;
}

/**
 * 애니메이션 컨트롤러 클래스
 */
export class AnimationController {
  private activeAnimations: Map<string, any>;
  private animationQueue: AnimationSequence[];
  private isProcessingQueue: boolean;

  constructor() {
    this.activeAnimations = new Map();
    this.animationQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * 애니메이션 등록
   */
  register(id: string, controls: any): void {
    this.activeAnimations.set(id, controls);
  }

  /**
   * 애니메이션 등록 해제
   */
  unregister(id: string): void {
    this.activeAnimations.delete(id);
  }

  /**
   * 단일 애니메이션 실행
   */
  async animate(
    id: string,
    animation: any,
    config?: AnimationConfig
  ): Promise<void> {
    const controls = this.activeAnimations.get(id);
    if (!controls) {
      console.warn(`Animation controls not found for id: ${id}`);
      return;
    }

    const animationConfig = {
      ...animation,
      transition: config ? this.buildTransition(config) : undefined,
    };

    await controls.start(animationConfig);
  }

  /**
   * 여러 애니메이션 동시 실행
   */
  async animateMultiple(
    animations: Array<{ id: string; animation: any; config?: AnimationConfig }>
  ): Promise<void> {
    const promises = animations.map(({ id, animation, config }) =>
      this.animate(id, animation, config)
    );

    await Promise.all(promises);
  }

  /**
   * 애니메이션 시퀀스 실행
   */
  async animateSequence(sequence: AnimationSequence[]): Promise<void> {
    for (const step of sequence) {
      if (step.wait) {
        await this.wait(step.wait);
      }

      await this.animate(step.name, step.target, step.config);
    }
  }

  /**
   * 애니메이션 큐에 추가
   */
  queue(sequence: AnimationSequence[]): void {
    this.animationQueue.push(...sequence);
    
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * 애니메이션 큐 처리
   */
  private async processQueue(): Promise<void> {
    if (this.animationQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;

    while (this.animationQueue.length > 0) {
      const sequence = this.animationQueue.shift();
      if (sequence) {
        await this.animateSequence([sequence]);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * 모든 애니메이션 정지
   */
  stopAll(): void {
    this.activeAnimations.forEach(controls => {
      controls.stop();
    });
    this.animationQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * 특정 애니메이션 정지
   */
  stop(id: string): void {
    const controls = this.activeAnimations.get(id);
    if (controls) {
      controls.stop();
    }
  }

  /**
   * 애니메이션 초기화
   */
  reset(id: string): void {
    const controls = this.activeAnimations.get(id);
    if (controls) {
      controls.start('initial');
    }
  }

  /**
   * 모든 애니메이션 초기화
   */
  resetAll(): void {
    this.activeAnimations.forEach(controls => {
      controls.start('initial');
    });
  }

  /**
   * 트랜지션 설정 생성
   */
  private buildTransition(config: AnimationConfig): any {
    if (config.type === 'spring') {
      return {
        type: 'spring',
        stiffness: config.stiffness ?? 300,
        damping: config.damping ?? 20,
        mass: config.mass ?? 1,
        delay: config.delay,
      };
    }

    if (config.type === 'tween') {
      return {
        type: 'tween',
        duration: config.duration ?? 0.3,
        ease: config.ease ?? 'easeInOut',
        delay: config.delay,
      };
    }

    return {
      duration: config.duration ?? 0.3,
      ease: config.ease ?? 'easeInOut',
      delay: config.delay,
    };
  }

  /**
   * 대기 시간
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 스태거 애니메이션 생성
   */
  createStagger(
    ids: string[],
    animation: any,
    staggerDelay: number = 0.1,
    config?: AnimationConfig
  ): Promise<void>[] {
    return ids.map((id, index) =>
      this.animate(id, animation, {
        ...config,
        delay: (config?.delay ?? 0) + index * staggerDelay,
      })
    );
  }

  /**
   * 페이드 인 애니메이션
   */
  async fadeIn(id: string, duration: number = 0.3): Promise<void> {
    await this.animate(
      id,
      { opacity: 1 },
      { duration, ease: 'easeOut' }
    );
  }

  /**
   * 페이드 아웃 애니메이션
   */
  async fadeOut(id: string, duration: number = 0.3): Promise<void> {
    await this.animate(
      id,
      { opacity: 0 },
      { duration, ease: 'easeIn' }
    );
  }

  /**
   * 스케일 애니메이션
   */
  async scale(
    id: string,
    scale: number,
    config?: AnimationConfig
  ): Promise<void> {
    await this.animate(id, { scale }, config);
  }

  /**
   * 회전 애니메이션
   */
  async rotate(
    id: string,
    rotation: number,
    config?: AnimationConfig
  ): Promise<void> {
    await this.animate(id, { rotate: rotation }, config);
  }

  /**
   * 슬라이드 인 애니메이션
   */
  async slideIn(
    id: string,
    direction: 'left' | 'right' | 'top' | 'bottom',
    distance: number = 100
  ): Promise<void> {
    const initialPosition = {
      left: { x: -distance },
      right: { x: distance },
      top: { y: -distance },
      bottom: { y: distance },
    };

    await this.animate(
      id,
      { ...initialPosition[direction], opacity: 1 },
      { type: 'spring', stiffness: 300, damping: 25 }
    );
  }

  /**
   * 슬라이드 아웃 애니메이션
   */
  async slideOut(
    id: string,
    direction: 'left' | 'right' | 'top' | 'bottom',
    distance: number = 100
  ): Promise<void> {
    const exitPosition = {
      left: { x: -distance },
      right: { x: distance },
      top: { y: -distance },
      bottom: { y: distance },
    };

    await this.animate(
      id,
      { ...exitPosition[direction], opacity: 0 },
      { duration: 0.3, ease: 'easeIn' }
    );
  }

  /**
   * 바운스 애니메이션
   */
  async bounce(id: string, height: number = 20): Promise<void> {
    await this.animate(
      id,
      {
        y: [0, -height, 0],
        transition: {
          duration: 0.5,
          times: [0, 0.5, 1],
          ease: ['easeOut', 'easeIn'],
        },
      }
    );
  }

  /**
   * 흔들기 애니메이션
   */
  async shake(id: string, intensity: number = 10): Promise<void> {
    await this.animate(
      id,
      {
        x: [-intensity, intensity, -intensity, intensity, 0],
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      }
    );
  }

  /**
   * 펄스 애니메이션
   */
  async pulse(id: string, scale: number = 1.05): Promise<void> {
    await this.animate(
      id,
      {
        scale: [1, scale, 1],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
          repeat: 2,
        },
      }
    );
  }
}

// 싱글톤 인스턴스
export const animationController = new AnimationController();