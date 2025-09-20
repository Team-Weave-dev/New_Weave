/**
 * LazyWidgetLoader - 위젯 지연 로딩 및 언로드 관리
 * 
 * Phase 3.1 성능 최적화의 일부로 구현
 * - 뷰포트 기반 지연 로딩
 * - 미리 로드 오프셋 설정
 * - 보이지 않는 위젯 자동 언로드
 */

import { IOSStyleWidget } from '@/types/ios-dashboard';

export interface LazyLoadConfig {
  preloadVisible: boolean;      // 보이는 위젯 미리 로드
  preloadOffset: string;        // 미리 로드 오프셋 (예: '200px')
  unloadInvisible: boolean;     // 보이지 않는 위젯 언로드
  unloadDelay: number;          // 언로드 지연 시간 (ms)
  enablePrefetch: boolean;      // 데이터 프리페치 활성화
  maxConcurrentLoads: number;   // 동시 로드 최대 개수
}

export interface WidgetLoadState {
  widgetId: string;
  isLoaded: boolean;
  isLoading: boolean;
  isVisible: boolean;
  lastVisibleTime: number;
  loadTime: number;
  data?: any;
  error?: Error;
}

export class LazyWidgetLoader {
  private static instance: LazyWidgetLoader;
  private config: LazyLoadConfig;
  private loadStates: Map<string, WidgetLoadState>;
  private loadQueue: Set<string>;
  private unloadTimers: Map<string, NodeJS.Timeout>;
  private observers: Map<string, IntersectionObserver>;
  private loadCallbacks: Map<string, (widget: IOSStyleWidget) => Promise<any>>;
  
  // 기본 설정 (계획서에 따라 설정)
  private static readonly DEFAULT_CONFIG: LazyLoadConfig = {
    preloadVisible: true,
    preloadOffset: '200px',
    unloadInvisible: true,
    unloadDelay: 30000, // 30초
    enablePrefetch: true,
    maxConcurrentLoads: 3,
  };
  
  private constructor(config?: Partial<LazyLoadConfig>) {
    this.config = { ...LazyWidgetLoader.DEFAULT_CONFIG, ...config };
    this.loadStates = new Map();
    this.loadQueue = new Set();
    this.unloadTimers = new Map();
    this.observers = new Map();
    this.loadCallbacks = new Map();
  }
  
  static getInstance(config?: Partial<LazyLoadConfig>): LazyWidgetLoader {
    if (!LazyWidgetLoader.instance) {
      LazyWidgetLoader.instance = new LazyWidgetLoader(config);
    }
    return LazyWidgetLoader.instance;
  }
  
  /**
   * 위젯 로더 등록
   */
  registerLoader(widgetType: string, loader: (widget: IOSStyleWidget) => Promise<any>): void {
    this.loadCallbacks.set(widgetType, loader);
  }
  
  /**
   * 위젯 관찰 시작
   */
  observeWidget(
    widgetId: string, 
    element: HTMLElement,
    widget: IOSStyleWidget,
    container?: HTMLElement
  ): void {
    // 기존 관찰자 정리
    this.unobserveWidget(widgetId);
    
    // IntersectionObserver 옵션
    const options: IntersectionObserverInit = {
      root: container || null,
      rootMargin: this.config.preloadOffset,
      threshold: [0, 0.1, 0.5, 1.0],
    };
    
    // 새 관찰자 생성
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.handleVisibilityChange(widgetId, widget, entry.isIntersecting, entry.intersectionRatio);
      });
    }, options);
    
    // 관찰 시작
    observer.observe(element);
    this.observers.set(widgetId, observer);
    
    // 초기 상태 설정
    if (!this.loadStates.has(widgetId)) {
      this.loadStates.set(widgetId, {
        widgetId,
        isLoaded: false,
        isLoading: false,
        isVisible: false,
        lastVisibleTime: 0,
        loadTime: 0,
      });
    }
  }
  
  /**
   * 위젯 관찰 중지
   */
  unobserveWidget(widgetId: string): void {
    const observer = this.observers.get(widgetId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(widgetId);
    }
    
    // 언로드 타이머 정리
    const timer = this.unloadTimers.get(widgetId);
    if (timer) {
      clearTimeout(timer);
      this.unloadTimers.delete(widgetId);
    }
  }
  
  /**
   * 가시성 변경 처리
   */
  private async handleVisibilityChange(
    widgetId: string,
    widget: IOSStyleWidget,
    isVisible: boolean,
    intersectionRatio: number
  ): Promise<void> {
    const state = this.loadStates.get(widgetId);
    if (!state) return;
    
    state.isVisible = isVisible;
    
    if (isVisible) {
      // 위젯이 보이는 경우
      state.lastVisibleTime = Date.now();
      
      // 언로드 타이머 취소
      const timer = this.unloadTimers.get(widgetId);
      if (timer) {
        clearTimeout(timer);
        this.unloadTimers.delete(widgetId);
      }
      
      // 로드되지 않았으면 로드 시작
      if (!state.isLoaded && !state.isLoading) {
        await this.loadWidget(widgetId, widget);
      }
      
      // 프리페치 활성화 시 주변 위젯 미리 로드
      if (this.config.enablePrefetch && intersectionRatio > 0.5) {
        this.prefetchNearbyWidgets(widgetId);
      }
    } else {
      // 위젯이 보이지 않는 경우
      if (this.config.unloadInvisible && state.isLoaded) {
        // 언로드 타이머 설정
        const timer = setTimeout(() => {
          this.unloadWidget(widgetId);
        }, this.config.unloadDelay);
        
        this.unloadTimers.set(widgetId, timer);
      }
    }
  }
  
  /**
   * 위젯 로드
   */
  private async loadWidget(widgetId: string, widget: IOSStyleWidget): Promise<void> {
    const state = this.loadStates.get(widgetId);
    if (!state || state.isLoaded || state.isLoading) return;
    
    // 로드 큐가 가득 찬 경우 대기
    if (this.loadQueue.size >= this.config.maxConcurrentLoads) {
      // 큐에 추가하고 나중에 처리
      setTimeout(() => this.loadWidget(widgetId, widget), 100);
      return;
    }
    
    state.isLoading = true;
    this.loadQueue.add(widgetId);
    
    const startTime = performance.now();
    
    try {
      // 위젯 타입에 맞는 로더 실행
      const loader = this.loadCallbacks.get(widget.type);
      if (loader) {
        state.data = await loader(widget);
      }
      
      state.isLoaded = true;
      state.loadTime = performance.now() - startTime;
      
      console.log(`[LazyLoader] Widget ${widgetId} loaded in ${state.loadTime.toFixed(2)}ms`);
    } catch (error) {
      state.error = error as Error;
      console.error(`[LazyLoader] Failed to load widget ${widgetId}:`, error);
    } finally {
      state.isLoading = false;
      this.loadQueue.delete(widgetId);
    }
  }
  
  /**
   * 위젯 언로드
   */
  private unloadWidget(widgetId: string): void {
    const state = this.loadStates.get(widgetId);
    if (!state || !state.isLoaded || state.isVisible) return;
    
    // 최근에 본 위젯은 유지
    const timeSinceVisible = Date.now() - state.lastVisibleTime;
    if (timeSinceVisible < this.config.unloadDelay) {
      return;
    }
    
    state.isLoaded = false;
    state.data = undefined;
    
    console.log(`[LazyLoader] Widget ${widgetId} unloaded`);
  }
  
  /**
   * 주변 위젯 프리페치
   */
  private prefetchNearbyWidgets(currentWidgetId: string): void {
    // 현재 위젯 주변의 위젯들을 미리 로드
    // 실제 구현은 그리드 레이아웃에 따라 결정
    console.log(`[LazyLoader] Prefetching widgets near ${currentWidgetId}`);
  }
  
  /**
   * 위젯 데이터 가져오기
   */
  getWidgetData(widgetId: string): any {
    return this.loadStates.get(widgetId)?.data;
  }
  
  /**
   * 위젯 로드 상태 확인
   */
  isWidgetLoaded(widgetId: string): boolean {
    return this.loadStates.get(widgetId)?.isLoaded || false;
  }
  
  /**
   * 위젯 로딩 중 확인
   */
  isWidgetLoading(widgetId: string): boolean {
    return this.loadStates.get(widgetId)?.isLoading || false;
  }
  
  /**
   * 강제 로드
   */
  async forceLoadWidget(widgetId: string, widget: IOSStyleWidget): Promise<void> {
    const state = this.loadStates.get(widgetId);
    if (state) {
      state.isLoaded = false;
      state.isLoading = false;
    } else {
      this.loadStates.set(widgetId, {
        widgetId,
        isLoaded: false,
        isLoading: false,
        isVisible: true,
        lastVisibleTime: Date.now(),
        loadTime: 0,
      });
    }
    
    await this.loadWidget(widgetId, widget);
  }
  
  /**
   * 모든 보이는 위젯 로드
   */
  async loadVisibleWidgets(widgets: IOSStyleWidget[]): Promise<void> {
    const loadPromises = widgets.map(widget => {
      const state = this.loadStates.get(widget.id);
      if (state?.isVisible && !state.isLoaded && !state.isLoading) {
        return this.loadWidget(widget.id, widget);
      }
      return Promise.resolve();
    });
    
    await Promise.all(loadPromises);
  }
  
  /**
   * 성능 통계
   */
  getPerformanceStats(): {
    totalWidgets: number;
    loadedWidgets: number;
    loadingWidgets: number;
    visibleWidgets: number;
    averageLoadTime: number;
    memoryEstimate: number;
  } {
    const states = Array.from(this.loadStates.values());
    const loadedStates = states.filter(s => s.isLoaded);
    const loadTimes = loadedStates.map(s => s.loadTime).filter(t => t > 0);
    
    return {
      totalWidgets: states.length,
      loadedWidgets: loadedStates.length,
      loadingWidgets: states.filter(s => s.isLoading).length,
      visibleWidgets: states.filter(s => s.isVisible).length,
      averageLoadTime: loadTimes.length > 0 
        ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length 
        : 0,
      memoryEstimate: loadedStates.length * 0.5, // 각 위젯당 약 0.5MB 추정
    };
  }
  
  /**
   * 정리
   */
  cleanup(): void {
    // 모든 관찰자 정리
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // 모든 타이머 정리
    this.unloadTimers.forEach(timer => clearTimeout(timer));
    this.unloadTimers.clear();
    
    // 상태 초기화
    this.loadStates.clear();
    this.loadQueue.clear();
  }
}

// 싱글톤 인스턴스 export
export const lazyWidgetLoader = LazyWidgetLoader.getInstance();