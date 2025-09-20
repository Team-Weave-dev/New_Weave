/**
 * PerformanceMonitor - iOS 스타일 대시보드 성능 모니터링 서비스
 * 
 * Features:
 * - 실시간 메트릭 수집 (FPS, 메모리, CPU)
 * - 임계값 기반 자동 최적화
 * - 성능 프로파일링 및 리포팅
 * - 위젯별 성능 추적
 */

import { performanceProfiler } from '@/lib/dashboard/ios-animations/performance-optimizer';

export interface PerformanceMetrics {
  // 기본 메트릭
  fps: number;
  frameTime: number;
  droppedFrames: number;
  jank: number;
  
  // 메모리 메트릭
  memoryUsage: number;
  memoryLimit: number;
  memoryPercentage: number;
  
  // 위젯 메트릭
  totalWidgets: number;
  visibleWidgets: number;
  virtualizedWidgets: number;
  
  // 렌더링 메트릭
  renderTime: number;
  layoutTime: number;
  paintTime: number;
  
  // 시스템 메트릭
  cpuUsage: number;
  networkLatency: number;
  
  // 성능 레벨
  performanceLevel: 'high' | 'medium' | 'low' | 'critical';
  
  // 타임스탬프
  timestamp: number;
}

export interface PerformanceThresholds {
  fps: { high: number; medium: number; low: number };
  memory: { high: number; medium: number; low: number };
  cpu: { high: number; medium: number; low: number };
  renderTime: { high: number; medium: number; low: number };
}

export interface WidgetPerformanceData {
  widgetId: string;
  widgetType: string;
  renderTime: number;
  memoryUsage: number;
  interactionTime: number;
  errorCount: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private widgetMetrics: Map<string, WidgetPerformanceData>;
  private metricsHistory: PerformanceMetrics[];
  private observers: Set<(metrics: PerformanceMetrics) => void>;
  private animationFrame: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private droppedFrameCount: number = 0;
  
  // 임계값 설정
  private thresholds: PerformanceThresholds = {
    fps: { high: 55, medium: 30, low: 20 },
    memory: { high: 100, medium: 200, low: 300 }, // MB
    cpu: { high: 30, medium: 50, low: 70 }, // percentage
    renderTime: { high: 16, medium: 33, low: 50 }, // ms
  };
  
  // 가상화 임계값 (계획서에 따라 조정)
  private virtualizationThresholds = {
    desktop: 50,  // 데스크탑: 50개 이상 위젯
    mobile: 20,   // 모바일: 20개 이상 위젯
  };
  
  private constructor() {
    this.metrics = this.getDefaultMetrics();
    this.widgetMetrics = new Map();
    this.metricsHistory = [];
    this.observers = new Set();
  }
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      droppedFrames: 0,
      jank: 0,
      memoryUsage: 0,
      memoryLimit: 0,
      memoryPercentage: 0,
      totalWidgets: 0,
      visibleWidgets: 0,
      virtualizedWidgets: 0,
      renderTime: 0,
      layoutTime: 0,
      paintTime: 0,
      cpuUsage: 0,
      networkLatency: 0,
      performanceLevel: 'high',
      timestamp: Date.now(),
    };
  }
  
  /**
   * 모니터링 시작
   */
  startMonitoring(callback?: (metrics: PerformanceMetrics) => void): void {
    if (callback) {
      this.observers.add(callback);
    }
    
    // FPS 모니터링 시작
    this.startFPSMonitoring();
    
    // 메모리 모니터링 시작
    this.startMemoryMonitoring();
    
    // Performance Observer 설정
    this.setupPerformanceObserver();
    
    console.log('[PerformanceMonitor] Monitoring started');
  }
  
  /**
   * 모니터링 중지
   */
  stopMonitoring(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.observers.clear();
    console.log('[PerformanceMonitor] Monitoring stopped');
  }
  
  /**
   * FPS 모니터링
   */
  private startFPSMonitoring(): void {
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = (currentTime: number) => {
      frames++;
      
      if (currentTime >= lastTime + 1000) {
        const fps = (frames * 1000) / (currentTime - lastTime);
        const frameTime = (currentTime - lastTime) / frames;
        
        // 드롭된 프레임 계산
        const expectedFrames = 60;
        const droppedFrames = Math.max(0, expectedFrames - frames);
        this.droppedFrameCount += droppedFrames;
        
        // Jank 계산 (33ms 이상 걸린 프레임)
        const jank = frameTime > 33 ? 1 : 0;
        
        this.updateMetrics({
          fps: Math.round(fps),
          frameTime: frameTime,
          droppedFrames: this.droppedFrameCount,
          jank: jank,
        });
        
        frames = 0;
        lastTime = currentTime;
      }
      
      this.animationFrame = requestAnimationFrame(measureFPS);
    };
    
    this.animationFrame = requestAnimationFrame(measureFPS);
  }
  
  /**
   * 메모리 모니터링
   */
  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) {
      console.warn('[PerformanceMonitor] Memory API not available');
      return;
    }
    
    setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMemory = memory.usedJSHeapSize / (1024 * 1024); // MB로 변환
        const limitMemory = memory.jsHeapSizeLimit / (1024 * 1024);
        const percentage = (usedMemory / limitMemory) * 100;
        
        this.updateMetrics({
          memoryUsage: Math.round(usedMemory),
          memoryLimit: Math.round(limitMemory),
          memoryPercentage: Math.round(percentage),
        });
      }
    }, 2000); // 2초마다 체크
  }
  
  /**
   * Performance Observer 설정
   */
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('[PerformanceMonitor] PerformanceObserver not available');
      return;
    }
    
    try {
      // Layout 시간 측정
      const layoutObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
            this.updateMetrics({
              layoutTime: entry.duration,
            });
          }
        }
      });
      
      layoutObserver.observe({ entryTypes: ['measure', 'navigation'] });
      
      // Paint 시간 측정
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint' || entry.name === 'first-contentful-paint') {
            this.updateMetrics({
              paintTime: entry.startTime,
            });
          }
        }
      });
      
      if (PerformanceObserver.supportedEntryTypes.includes('paint')) {
        paintObserver.observe({ entryTypes: ['paint'] });
      }
    } catch (error) {
      console.error('[PerformanceMonitor] Observer setup failed:', error);
    }
  }
  
  /**
   * 메트릭 업데이트
   */
  private updateMetrics(partialMetrics: Partial<PerformanceMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...partialMetrics,
      timestamp: Date.now(),
    };
    
    // 성능 레벨 결정
    this.metrics.performanceLevel = this.determinePerformanceLevel();
    
    // 히스토리에 추가 (최근 100개만 유지)
    this.metricsHistory.push({ ...this.metrics });
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }
    
    // 옵저버에게 알림
    this.notifyObservers();
  }
  
  /**
   * 성능 레벨 결정
   */
  private determinePerformanceLevel(): 'high' | 'medium' | 'low' | 'critical' {
    const { fps, memoryPercentage, cpuUsage } = this.metrics;
    
    // Critical: 매우 낮은 성능
    if (fps < this.thresholds.fps.low || 
        memoryPercentage > 90 || 
        cpuUsage > 90) {
      return 'critical';
    }
    
    // Low: 낮은 성능
    if (fps < this.thresholds.fps.medium || 
        memoryPercentage > 75 || 
        cpuUsage > this.thresholds.cpu.low) {
      return 'low';
    }
    
    // Medium: 중간 성능
    if (fps < this.thresholds.fps.high || 
        memoryPercentage > 50 || 
        cpuUsage > this.thresholds.cpu.medium) {
      return 'medium';
    }
    
    // High: 높은 성능
    return 'high';
  }
  
  /**
   * 옵저버에게 알림
   */
  private notifyObservers(): void {
    this.observers.forEach(observer => {
      observer(this.metrics);
    });
  }
  
  /**
   * 위젯 성능 기록
   */
  recordWidgetPerformance(data: WidgetPerformanceData): void {
    this.widgetMetrics.set(data.widgetId, data);
    
    // 전체 렌더 시간 계산
    const totalRenderTime = Array.from(this.widgetMetrics.values())
      .reduce((sum, widget) => sum + widget.renderTime, 0);
    
    this.updateMetrics({
      renderTime: totalRenderTime / this.widgetMetrics.size,
    });
  }
  
  /**
   * 위젯 수 업데이트
   */
  updateWidgetCount(total: number, visible: number, virtualized: number): void {
    this.updateMetrics({
      totalWidgets: total,
      visibleWidgets: visible,
      virtualizedWidgets: virtualized,
    });
  }
  
  /**
   * 가상화 필요 여부 판단
   */
  shouldVirtualize(): boolean {
    const isMobile = window.innerWidth < 768;
    const threshold = isMobile 
      ? this.virtualizationThresholds.mobile 
      : this.virtualizationThresholds.desktop;
    
    return this.metrics.totalWidgets > threshold;
  }
  
  /**
   * 성능 최적화 제안
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const { performanceLevel, fps, memoryPercentage, totalWidgets, visibleWidgets } = this.metrics;
    
    if (performanceLevel === 'critical' || performanceLevel === 'low') {
      // FPS 최적화
      if (fps < 30) {
        suggestions.push('애니메이션을 단순화하거나 비활성화하세요');
      }
      
      // 메모리 최적화
      if (memoryPercentage > 75) {
        suggestions.push('사용하지 않는 위젯을 제거하세요');
        suggestions.push('이미지 크기를 최적화하세요');
      }
      
      // 위젯 최적화
      if (totalWidgets > 30 && !this.shouldVirtualize()) {
        suggestions.push('위젯 가상화를 활성화하세요');
      }
      
      if (visibleWidgets > 20) {
        suggestions.push('화면에 표시되는 위젯 수를 줄이세요');
      }
    }
    
    return suggestions;
  }
  
  /**
   * 성능 리포트 생성
   */
  getPerformanceReport(): {
    current: PerformanceMetrics;
    average: Partial<PerformanceMetrics>;
    suggestions: string[];
    widgetPerformance: WidgetPerformanceData[];
  } {
    // 평균 계산
    const average: Partial<PerformanceMetrics> = {};
    if (this.metricsHistory.length > 0) {
      average.fps = Math.round(
        this.metricsHistory.reduce((sum, m) => sum + m.fps, 0) / this.metricsHistory.length
      );
      average.memoryUsage = Math.round(
        this.metricsHistory.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metricsHistory.length
      );
      average.renderTime = Math.round(
        this.metricsHistory.reduce((sum, m) => sum + m.renderTime, 0) / this.metricsHistory.length
      );
    }
    
    // 위젯 성능 데이터 정렬 (렌더 시간 기준)
    const widgetPerformance = Array.from(this.widgetMetrics.values())
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, 10); // Top 10 느린 위젯
    
    return {
      current: this.metrics,
      average,
      suggestions: this.getOptimizationSuggestions(),
      widgetPerformance,
    };
  }
  
  /**
   * 메트릭 초기화
   */
  reset(): void {
    this.metrics = this.getDefaultMetrics();
    this.widgetMetrics.clear();
    this.metricsHistory = [];
    this.droppedFrameCount = 0;
  }
  
  /**
   * 현재 메트릭 가져오기
   */
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * P95 지연 시간 계산
   */
  getP95Latency(): number {
    if (this.metricsHistory.length === 0) {
      return 0;
    }
    
    const renderTimes = this.metricsHistory
      .map(m => m.renderTime)
      .sort((a, b) => a - b);
    
    const p95Index = Math.floor(renderTimes.length * 0.95);
    return renderTimes[p95Index] || 0;
  }
  
  /**
   * 에러율 계산
   */
  getErrorRate(): number {
    const totalErrors = Array.from(this.widgetMetrics.values())
      .reduce((sum, widget) => sum + widget.errorCount, 0);
    
    const totalWidgets = this.widgetMetrics.size || 1;
    return (totalErrors / totalWidgets) * 100;
  }
}

// 싱글톤 인스턴스 export
export const performanceMonitor = PerformanceMonitor.getInstance();