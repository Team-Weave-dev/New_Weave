/**
 * Feature Flag 메트릭 수집기
 * 사용자 행동 및 성능 데이터 수집
 */

import { 
  FeatureFlagEvent, 
  MetricType,
  FeatureFlag,
  FeatureFlagContext 
} from './types';

interface MetricBuffer {
  events: FeatureFlagEvent[];
  lastFlush: number;
}

interface PerformanceMetric {
  flagId: string;
  evaluationTime: number;
  cacheHit: boolean;
}

export class MetricsCollector {
  private buffer: MetricBuffer = {
    events: [],
    lastFlush: Date.now(),
  };

  private performanceMetrics: PerformanceMetric[] = [];
  private flushInterval: number = 30000; // 30초
  private maxBufferSize: number = 100;
  private endpoint: string = '/api/feature-flags/metrics';
  private enabled: boolean = true;
  private sampleRate: number = 1.0; // 100% 샘플링
  private flushTimer?: NodeJS.Timeout;

  constructor(config?: {
    endpoint?: string;
    flushInterval?: number;
    maxBufferSize?: number;
    enabled?: boolean;
    sampleRate?: number;
  }) {
    if (config) {
      this.endpoint = config.endpoint || this.endpoint;
      this.flushInterval = config.flushInterval || this.flushInterval;
      this.maxBufferSize = config.maxBufferSize || this.maxBufferSize;
      this.enabled = config.enabled !== undefined ? config.enabled : this.enabled;
      this.sampleRate = config.sampleRate || this.sampleRate;
    }

    if (this.enabled) {
      this.startAutoFlush();
    }
  }

  /**
   * 메트릭 이벤트 기록
   */
  track(
    flag: FeatureFlag,
    eventType: MetricType,
    eventName: string,
    context: FeatureFlagContext,
    properties?: Record<string, any>
  ): void {
    if (!this.enabled) return;
    
    // 샘플링 체크
    if (Math.random() > this.sampleRate) return;

    const event: FeatureFlagEvent = {
      flagId: flag.id,
      userId: context.userId,
      sessionId: context.sessionId || this.generateSessionId(),
      eventType,
      eventName,
      timestamp: new Date(),
      properties,
    };

    this.buffer.events.push(event);

    // 버퍼가 가득 차면 즉시 전송
    if (this.buffer.events.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Feature Flag 평가 성능 기록
   */
  trackPerformance(
    flagId: string,
    evaluationTime: number,
    cacheHit: boolean = false
  ): void {
    if (!this.enabled) return;

    this.performanceMetrics.push({
      flagId,
      evaluationTime,
      cacheHit,
    });

    // 성능 메트릭도 주기적으로 전송
    if (this.performanceMetrics.length >= 50) {
      this.flushPerformanceMetrics();
    }
  }

  /**
   * 클릭 이벤트 추적
   */
  trackClick(
    flag: FeatureFlag,
    elementId: string,
    context: FeatureFlagContext,
    properties?: Record<string, any>
  ): void {
    this.track(flag, 'click', `click_${elementId}`, context, {
      elementId,
      ...properties,
    });
  }

  /**
   * 뷰 이벤트 추적
   */
  trackView(
    flag: FeatureFlag,
    viewName: string,
    context: FeatureFlagContext,
    properties?: Record<string, any>
  ): void {
    this.track(flag, 'view', `view_${viewName}`, context, {
      viewName,
      viewDuration: 0,
      ...properties,
    });
  }

  /**
   * 전환 이벤트 추적
   */
  trackConversion(
    flag: FeatureFlag,
    conversionType: string,
    context: FeatureFlagContext,
    value?: number,
    properties?: Record<string, any>
  ): void {
    this.track(flag, 'conversion', `conversion_${conversionType}`, context, {
      conversionType,
      value,
      ...properties,
    });
  }

  /**
   * 오류 이벤트 추적
   */
  trackError(
    flag: FeatureFlag,
    error: Error,
    context: FeatureFlagContext,
    properties?: Record<string, any>
  ): void {
    this.track(flag, 'error', 'error', context, {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      ...properties,
    });
  }

  /**
   * A/B 테스트 노출 추적
   */
  trackExposure(
    flag: FeatureFlag,
    variant: string,
    context: FeatureFlagContext
  ): void {
    this.track(flag, 'view', 'ab_test_exposure', context, {
      variant,
      flagId: flag.id,
      timestamp: Date.now(),
    });
  }

  /**
   * 버퍼 전송
   */
  async flush(): Promise<void> {
    if (!this.enabled || this.buffer.events.length === 0) return;

    const eventsToSend = [...this.buffer.events];
    this.buffer.events = [];
    this.buffer.lastFlush = Date.now();

    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // 실패한 이벤트 재시도 로직
      this.handleFailedEvents(eventsToSend);
    }
  }

  /**
   * 성능 메트릭 전송
   */
  private async flushPerformanceMetrics(): Promise<void> {
    if (this.performanceMetrics.length === 0) return;

    const metricsToSend = [...this.performanceMetrics];
    this.performanceMetrics = [];

    try {
      await this.sendPerformanceMetrics(metricsToSend);
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  /**
   * 이벤트 전송
   */
  private async sendEvents(events: FeatureFlagEvent[]): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send metrics: ${response.statusText}`);
    }
  }

  /**
   * 성능 메트릭 전송
   */
  private async sendPerformanceMetrics(metrics: PerformanceMetric[]): Promise<void> {
    const aggregated = this.aggregatePerformanceMetrics(metrics);
    
    const response = await fetch(`${this.endpoint}/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: aggregated,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send performance metrics: ${response.statusText}`);
    }
  }

  /**
   * 성능 메트릭 집계
   */
  private aggregatePerformanceMetrics(
    metrics: PerformanceMetric[]
  ): Record<string, any> {
    const grouped: Record<string, PerformanceMetric[]> = {};
    
    // Flag ID별로 그룹화
    metrics.forEach(metric => {
      if (!grouped[metric.flagId]) {
        grouped[metric.flagId] = [];
      }
      grouped[metric.flagId].push(metric);
    });

    // 각 flag에 대한 통계 계산
    const aggregated: Record<string, any> = {};
    
    Object.entries(grouped).forEach(([flagId, flagMetrics]) => {
      const times = flagMetrics.map(m => m.evaluationTime);
      const cacheHits = flagMetrics.filter(m => m.cacheHit).length;
      
      aggregated[flagId] = {
        count: flagMetrics.length,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        p95Time: this.percentile(times, 0.95),
        cacheHitRate: cacheHits / flagMetrics.length,
      };
    });

    return aggregated;
  }

  /**
   * 백분위수 계산
   */
  private percentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index];
  }

  /**
   * 실패한 이벤트 처리
   */
  private handleFailedEvents(events: FeatureFlagEvent[]): void {
    // 로컬 스토리지에 저장하여 나중에 재시도
    if (typeof window !== 'undefined' && window.localStorage) {
      const failedEvents = JSON.parse(
        localStorage.getItem('ff_failed_events') || '[]'
      );
      failedEvents.push(...events);
      
      // 최대 1000개까지만 저장
      if (failedEvents.length > 1000) {
        failedEvents.splice(0, failedEvents.length - 1000);
      }
      
      localStorage.setItem('ff_failed_events', JSON.stringify(failedEvents));
    }
  }

  /**
   * 실패한 이벤트 재시도
   */
  async retryFailedEvents(): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const failedEvents = JSON.parse(
      localStorage.getItem('ff_failed_events') || '[]'
    );
    
    if (failedEvents.length === 0) return;

    try {
      await this.sendEvents(failedEvents);
      localStorage.removeItem('ff_failed_events');
    } catch (error) {
      console.error('Failed to retry events:', error);
    }
  }

  /**
   * 자동 플러시 시작
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
      this.flushPerformanceMetrics();
      this.retryFailedEvents();
    }, this.flushInterval);
  }

  /**
   * 자동 플러시 중지
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 메트릭 수집 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (enabled) {
      this.startAutoFlush();
    } else {
      this.stopAutoFlush();
    }
  }

  /**
   * 샘플링 비율 설정
   */
  setSampleRate(rate: number): void {
    this.sampleRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * 정리
   */
  destroy(): void {
    this.stopAutoFlush();
    this.flush();
    this.flushPerformanceMetrics();
  }
}