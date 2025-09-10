/**
 * 성능 모니터링 시스템
 * Phase 4: 실시간 성능 추적 및 최적화
 */

/**
 * 성능 메트릭
 */
export interface PerformanceMetrics {
  responseTime: number; // ms
  tokenUsage: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number; // requests per minute
  memoryUsage: number; // MB
  activeConnections: number;
  queueLength: number;
}

/**
 * 성능 이벤트
 */
export interface PerformanceEvent {
  id: string;
  timestamp: Date;
  type: 'request' | 'response' | 'error' | 'cache_hit' | 'cache_miss';
  duration?: number;
  metadata?: any;
}

/**
 * 성능 임계값
 */
export interface PerformanceThresholds {
  maxResponseTime: number; // ms
  maxTokenUsage: number;
  minCacheHitRate: number;
  maxErrorRate: number;
  maxMemoryUsage: number; // MB
  maxQueueLength: number;
}

/**
 * 성능 알림
 */
export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
}

/**
 * 성능 모니터
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private events: PerformanceEvent[];
  private alerts: PerformanceAlert[];
  private thresholds: PerformanceThresholds;
  private startTime: Date;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.startTime = new Date();
    this.events = [];
    this.alerts = [];
    
    this.metrics = {
      responseTime: 0,
      tokenUsage: 0,
      cacheHitRate: 0,
      errorRate: 0,
      throughput: 0,
      memoryUsage: 0,
      activeConnections: 0,
      queueLength: 0
    };
    
    this.thresholds = {
      maxResponseTime: 3000, // 3초
      maxTokenUsage: 8000,
      minCacheHitRate: 0.7, // 70%
      maxErrorRate: 0.05, // 5%
      maxMemoryUsage: 500, // 500MB
      maxQueueLength: 100,
      ...thresholds
    };
    
    // 실시간 모니터링 시작
    this.startMonitoring();
  }

  /**
   * 요청 시작 기록
   */
  startRequest(requestId: string): void {
    const event: PerformanceEvent = {
      id: requestId,
      timestamp: new Date(),
      type: 'request'
    };
    
    this.events.push(event);
    this.metrics.activeConnections++;
  }

  /**
   * 응답 완료 기록
   */
  endRequest(
    requestId: string, 
    success: boolean,
    metadata?: {
      tokensUsed?: number;
      cacheHit?: boolean;
    }
  ): void {
    const startEvent = this.events.find(e => e.id === requestId && e.type === 'request');
    if (!startEvent) return;
    
    const duration = Date.now() - startEvent.timestamp.getTime();
    
    const event: PerformanceEvent = {
      id: requestId,
      timestamp: new Date(),
      type: success ? 'response' : 'error',
      duration,
      metadata
    };
    
    this.events.push(event);
    this.metrics.activeConnections--;
    
    // 메트릭 업데이트
    this.updateMetrics(duration, success, metadata);
    
    // 임계값 체크
    this.checkThresholds();
  }

  /**
   * 캐시 이벤트 기록
   */
  recordCacheEvent(hit: boolean): void {
    const event: PerformanceEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: hit ? 'cache_hit' : 'cache_miss'
    };
    
    this.events.push(event);
    this.updateCacheMetrics();
  }

  /**
   * 에러 기록
   */
  recordError(error: Error, context?: any): void {
    const event: PerformanceEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'error',
      metadata: {
        error: error.message,
        stack: error.stack,
        context
      }
    };
    
    this.events.push(event);
    this.updateErrorRate();
    
    // 심각한 에러 알림
    this.createAlert(
      'error',
      this.metrics.errorRate,
      'high',
      `에러 발생: ${error.message}`
    );
  }

  /**
   * 메트릭 업데이트
   */
  private updateMetrics(
    duration: number,
    success: boolean,
    metadata?: any
  ): void {
    // 응답 시간 (이동 평균)
    const alpha = 0.3; // 평활 계수
    this.metrics.responseTime = 
      alpha * duration + (1 - alpha) * this.metrics.responseTime;
    
    // 토큰 사용량
    if (metadata?.tokensUsed) {
      this.metrics.tokenUsage = 
        alpha * metadata.tokensUsed + (1 - alpha) * this.metrics.tokenUsage;
    }
    
    // 처리량 계산
    this.updateThroughput();
    
    // 메모리 사용량
    this.updateMemoryUsage();
  }

  /**
   * 캐시 메트릭 업데이트
   */
  private updateCacheMetrics(): void {
    const recentEvents = this.events
      .filter(e => 
        (e.type === 'cache_hit' || e.type === 'cache_miss') &&
        Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // 최근 5분
      );
    
    const hits = recentEvents.filter(e => e.type === 'cache_hit').length;
    const total = recentEvents.length;
    
    this.metrics.cacheHitRate = total > 0 ? hits / total : 0;
  }

  /**
   * 에러율 업데이트
   */
  private updateErrorRate(): void {
    const recentEvents = this.events
      .filter(e => 
        (e.type === 'response' || e.type === 'error') &&
        Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // 최근 5분
      );
    
    const errors = recentEvents.filter(e => e.type === 'error').length;
    const total = recentEvents.length;
    
    this.metrics.errorRate = total > 0 ? errors / total : 0;
  }

  /**
   * 처리량 업데이트
   */
  private updateThroughput(): void {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentRequests = this.events
      .filter(e => 
        e.type === 'response' &&
        e.timestamp.getTime() > oneMinuteAgo
      ).length;
    
    this.metrics.throughput = recentRequests;
  }

  /**
   * 메모리 사용량 업데이트
   */
  private updateMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      this.metrics.memoryUsage = usage.heapUsed / 1024 / 1024; // MB
    }
  }

  /**
   * 임계값 체크
   */
  private checkThresholds(): void {
    // 응답 시간 체크
    if (this.metrics.responseTime > this.thresholds.maxResponseTime) {
      this.createAlert(
        'responseTime',
        this.metrics.responseTime,
        'high',
        `응답 시간이 임계값을 초과했습니다: ${Math.round(this.metrics.responseTime)}ms`
      );
    }
    
    // 토큰 사용량 체크
    if (this.metrics.tokenUsage > this.thresholds.maxTokenUsage) {
      this.createAlert(
        'tokenUsage',
        this.metrics.tokenUsage,
        'medium',
        `토큰 사용량이 임계값을 초과했습니다: ${Math.round(this.metrics.tokenUsage)}`
      );
    }
    
    // 캐시 히트율 체크
    if (this.metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      this.createAlert(
        'cacheHitRate',
        this.metrics.cacheHitRate,
        'low',
        `캐시 히트율이 낮습니다: ${Math.round(this.metrics.cacheHitRate * 100)}%`
      );
    }
    
    // 에러율 체크
    if (this.metrics.errorRate > this.thresholds.maxErrorRate) {
      this.createAlert(
        'errorRate',
        this.metrics.errorRate,
        'critical',
        `에러율이 임계값을 초과했습니다: ${Math.round(this.metrics.errorRate * 100)}%`
      );
    }
    
    // 메모리 사용량 체크
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      this.createAlert(
        'memoryUsage',
        this.metrics.memoryUsage,
        'high',
        `메모리 사용량이 높습니다: ${Math.round(this.metrics.memoryUsage)}MB`
      );
    }
  }

  /**
   * 알림 생성
   */
  private createAlert(
    metric: string,
    value: number,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string
  ): void {
    const alert: PerformanceAlert = {
      id: this.generateEventId(),
      timestamp: new Date(),
      severity,
      metric,
      value,
      threshold: this.thresholds[metric as keyof PerformanceThresholds] as number,
      message
    };
    
    this.alerts.push(alert);
    
    // 최근 100개만 유지
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // 심각한 알림은 콘솔에 출력
    if (severity === 'high' || severity === 'critical') {
      console.warn(`[Performance Alert] ${message}`);
    }
  }

  /**
   * 실시간 모니터링 시작
   */
  private startMonitoring(): void {
    this.intervalId = setInterval(() => {
      this.updateThroughput();
      this.updateMemoryUsage();
      this.checkThresholds();
      this.cleanupOldEvents();
    }, 10000); // 10초마다
  }

  /**
   * 모니터링 중지
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 오래된 이벤트 정리
   */
  private cleanupOldEvents(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.events = this.events.filter(e => 
      e.timestamp.getTime() > oneHourAgo
    );
  }

  /**
   * 이벤트 ID 생성
   */
  private generateEventId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 현재 메트릭 조회
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 최근 알림 조회
   */
  getAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * 통계 요약
   */
  getSummary(): any {
    const uptime = Date.now() - this.startTime.getTime();
    const totalRequests = this.events.filter(e => e.type === 'request').length;
    const totalErrors = this.events.filter(e => e.type === 'error').length;
    
    return {
      uptime: Math.round(uptime / 1000), // seconds
      totalRequests,
      totalErrors,
      metrics: this.getMetrics(),
      recentAlerts: this.alerts.slice(-10),
      health: this.calculateHealthScore()
    };
  }

  /**
   * 건강 점수 계산
   */
  private calculateHealthScore(): number {
    let score = 100;
    
    // 응답 시간
    if (this.metrics.responseTime > this.thresholds.maxResponseTime) {
      score -= 20;
    } else if (this.metrics.responseTime > this.thresholds.maxResponseTime * 0.8) {
      score -= 10;
    }
    
    // 에러율
    if (this.metrics.errorRate > this.thresholds.maxErrorRate) {
      score -= 30;
    } else if (this.metrics.errorRate > this.thresholds.maxErrorRate * 0.5) {
      score -= 15;
    }
    
    // 캐시 히트율
    if (this.metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      score -= 15;
    }
    
    // 메모리 사용량
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      score -= 15;
    }
    
    return Math.max(0, score);
  }

  /**
   * 성능 리포트 생성
   */
  generateReport(): string {
    const summary = this.getSummary();
    
    return `
=== 성능 리포트 ===
가동 시간: ${summary.uptime}초
총 요청: ${summary.totalRequests}
총 에러: ${summary.totalErrors}
건강 점수: ${summary.health}/100

현재 메트릭:
- 응답 시간: ${Math.round(summary.metrics.responseTime)}ms
- 토큰 사용량: ${Math.round(summary.metrics.tokenUsage)}
- 캐시 히트율: ${Math.round(summary.metrics.cacheHitRate * 100)}%
- 에러율: ${(summary.metrics.errorRate * 100).toFixed(2)}%
- 처리량: ${summary.metrics.throughput} req/min
- 메모리: ${Math.round(summary.metrics.memoryUsage)}MB

최근 알림: ${summary.recentAlerts.length}개
    `.trim();
  }
}

/**
 * 전역 성능 모니터 (싱글톤)
 */
export class GlobalPerformanceMonitor {
  private static instance: GlobalPerformanceMonitor;
  private monitor: PerformanceMonitor;

  private constructor() {
    this.monitor = new PerformanceMonitor();
  }

  static getInstance(): GlobalPerformanceMonitor {
    if (!GlobalPerformanceMonitor.instance) {
      GlobalPerformanceMonitor.instance = new GlobalPerformanceMonitor();
    }
    return GlobalPerformanceMonitor.instance;
  }

  getMonitor(): PerformanceMonitor {
    return this.monitor;
  }
}

export default GlobalPerformanceMonitor;