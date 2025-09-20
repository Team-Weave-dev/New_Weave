/**
 * 자동 롤백 모니터링 시스템
 * iOS 스타일 대시보드의 안정성을 모니터링하고 문제 발생 시 자동 롤백
 */

import { featureFlagService } from './featureFlag';
import { abTestService } from './ab-test-config';

interface PerformanceMetrics {
  errorRate: number;
  p95Latency: number;
  memoryUsage: number;
  cpuUsage: number;
  crashRate: number;
}

interface RollbackConfig {
  errorThreshold: number;
  performanceThreshold: number;
  memoryThreshold: number;
  cpuThreshold: number;
  crashThreshold: number;
  checkInterval: number; // milliseconds
  cooldownPeriod: number; // milliseconds after rollback
}

export class RollbackMonitor {
  private static instance: RollbackMonitor;
  private config: RollbackConfig;
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private metrics: PerformanceMetrics[] = [];
  private rollbackHistory: Array<{
    timestamp: number;
    reason: string;
    metrics: PerformanceMetrics;
  }> = [];
  private lastRollbackTime: number = 0;

  private constructor() {
    this.config = {
      errorThreshold: 0.05, // 5%
      performanceThreshold: 100, // 100ms
      memoryThreshold: 500, // 500MB
      cpuThreshold: 80, // 80%
      crashThreshold: 0.01, // 1%
      checkInterval: 10000, // 10 seconds
      cooldownPeriod: 300000, // 5 minutes
    };
  }

  public static getInstance(): RollbackMonitor {
    if (!RollbackMonitor.instance) {
      RollbackMonitor.instance = new RollbackMonitor();
    }
    return RollbackMonitor.instance;
  }

  /**
   * 모니터링 시작
   */
  public start(): void {
    if (this.isMonitoring) {
      console.log('[RollbackMonitor] Already monitoring');
      return;
    }

    console.log('[RollbackMonitor] Starting monitoring...');
    this.isMonitoring = true;

    // 초기 메트릭 수집
    this.collectMetrics();

    // 정기적 체크
    this.monitoringInterval = setInterval(() => {
      this.monitor();
    }, this.config.checkInterval);

    // 브라우저 이벤트 리스너
    this.setupEventListeners();
  }

  /**
   * 모니터링 중지
   */
  public stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[RollbackMonitor] Stopping monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.removeEventListeners();
  }

  /**
   * 메인 모니터링 로직
   */
  private monitor(): void {
    const metrics = this.collectMetrics();
    const issues = this.checkThresholds(metrics);

    if (issues.length > 0 && this.shouldTriggerRollback()) {
      this.triggerRollback(issues.join(', '), metrics);
    }

    // 메트릭 저장 (최근 100개만 유지)
    this.metrics.push(metrics);
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // A/B 테스트 메트릭 전송
    this.reportToABTest(metrics);
  }

  /**
   * 메트릭 수집
   */
  private collectMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      errorRate: this.getErrorRate(),
      p95Latency: this.getP95Latency(),
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      crashRate: this.getCrashRate(),
    };

    return metrics;
  }

  /**
   * 에러율 계산
   */
  private getErrorRate(): number {
    // 실제 구현에서는 에러 로그를 수집하여 계산
    const errors = this.getRecentErrors();
    const totalRequests = this.getTotalRequests();
    return totalRequests > 0 ? errors / totalRequests : 0;
  }

  /**
   * P95 지연 시간 계산
   */
  private getP95Latency(): number {
    // Performance API를 사용하여 실제 지연 시간 측정
    if (typeof window !== 'undefined' && window.performance) {
      const entries = performance.getEntriesByType('navigation');
      if (entries.length > 0) {
        const nav = entries[0] as PerformanceNavigationTiming;
        return nav.loadEventEnd - nav.fetchStart;
      }
    }
    return 0;
  }

  /**
   * 메모리 사용량 계산
   */
  private getMemoryUsage(): number {
    // Chrome의 메모리 API 사용 (가능한 경우)
    if (typeof window !== 'undefined' && (window.performance as any).memory) {
      const memory = (window.performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // MB로 변환
    }
    return 0;
  }

  /**
   * CPU 사용량 계산 (추정)
   */
  private getCPUUsage(): number {
    // JavaScript에서 직접적인 CPU 사용량 측정은 불가능하므로 추정
    // 실제 구현에서는 서버 메트릭 사용
    return 0;
  }

  /**
   * 크래시율 계산
   */
  private getCrashRate(): number {
    // 세션 스토리지에서 크래시 카운트 확인
    if (typeof window !== 'undefined') {
      const crashes = parseInt(sessionStorage.getItem('crash_count') || '0');
      const sessions = parseInt(sessionStorage.getItem('session_count') || '1');
      return crashes / sessions;
    }
    return 0;
  }

  /**
   * 최근 에러 수 가져오기
   */
  private getRecentErrors(): number {
    if (typeof window !== 'undefined') {
      return parseInt(sessionStorage.getItem('recent_errors') || '0');
    }
    return 0;
  }

  /**
   * 총 요청 수 가져오기
   */
  private getTotalRequests(): number {
    if (typeof window !== 'undefined') {
      return parseInt(sessionStorage.getItem('total_requests') || '100');
    }
    return 100;
  }

  /**
   * 임계값 체크
   */
  private checkThresholds(metrics: PerformanceMetrics): string[] {
    const issues: string[] = [];

    if (metrics.errorRate > this.config.errorThreshold) {
      issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    }

    if (metrics.p95Latency > this.config.performanceThreshold) {
      issues.push(`High latency: ${metrics.p95Latency.toFixed(0)}ms`);
    }

    if (metrics.memoryUsage > this.config.memoryThreshold) {
      issues.push(`High memory usage: ${metrics.memoryUsage.toFixed(0)}MB`);
    }

    if (metrics.cpuUsage > this.config.cpuThreshold) {
      issues.push(`High CPU usage: ${metrics.cpuUsage.toFixed(0)}%`);
    }

    if (metrics.crashRate > this.config.crashThreshold) {
      issues.push(`High crash rate: ${(metrics.crashRate * 100).toFixed(2)}%`);
    }

    return issues;
  }

  /**
   * 롤백 트리거 여부 결정
   */
  private shouldTriggerRollback(): boolean {
    const now = Date.now();
    const timeSinceLastRollback = now - this.lastRollbackTime;
    
    // 쿨다운 기간 확인
    if (timeSinceLastRollback < this.config.cooldownPeriod) {
      console.log('[RollbackMonitor] In cooldown period, skipping rollback');
      return false;
    }

    return true;
  }

  /**
   * 롤백 트리거
   */
  private triggerRollback(reason: string, metrics: PerformanceMetrics): void {
    console.error('[RollbackMonitor] Triggering rollback:', reason);

    // 롤백 히스토리 저장
    this.rollbackHistory.push({
      timestamp: Date.now(),
      reason,
      metrics,
    });

    // Feature Flag 비활성화
    featureFlagService.disable('ios_style_dashboard');

    // 사용자에게 알림
    this.showUserNotification(
      '시스템 안정성을 위해 일시적으로 기존 대시보드로 전환됩니다.'
    );

    // 팀에게 알림
    this.notifyTeam(reason, metrics);

    // 롤백 시간 기록
    this.lastRollbackTime = Date.now();

    // 세션 스토리지에 롤백 정보 저장
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rollback_triggered', 'true');
      sessionStorage.setItem('rollback_reason', reason);
      sessionStorage.setItem('rollback_time', this.lastRollbackTime.toString());
    }

    // 페이지 새로고침 (선택적)
    setTimeout(() => {
      if (typeof window !== 'undefined' && confirm('페이지를 새로고침하시겠습니까?')) {
        window.location.reload();
      }
    }, 1000);
  }

  /**
   * 사용자 알림 표시
   */
  private showUserNotification(message: string): void {
    if (typeof window !== 'undefined') {
      // 실제 구현에서는 토스트나 모달 사용
      const notification = document.createElement('div');
      notification.className = 'rollback-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px;
        background: #ff6b6b;
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 400px;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // 5초 후 제거
      setTimeout(() => {
        notification.remove();
      }, 5000);
    }
  }

  /**
   * 팀 알림
   */
  private async notifyTeam(reason: string, metrics: PerformanceMetrics): Promise<void> {
    try {
      // 실제 구현에서는 Slack, 이메일 등으로 알림
      await fetch('/api/notifications/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          metrics,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('[RollbackMonitor] Failed to notify team:', error);
    }
  }

  /**
   * A/B 테스트 서비스에 메트릭 보고
   */
  private reportToABTest(metrics: PerformanceMetrics): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    // 에러율 보고
    abTestService.trackMetric(userId, 'error_rate', metrics.errorRate);
    
    // 성능 점수 계산 및 보고
    const performanceScore = Math.max(0, 100 - metrics.p95Latency / 10);
    abTestService.trackMetric(userId, 'performance_score', performanceScore);
  }

  /**
   * 현재 사용자 ID 가져오기
   */
  private getCurrentUserId(): string | null {
    // 실제 구현에서는 인증 시스템에서 가져옴
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id') || 'anonymous';
    }
    return null;
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // 에러 이벤트 리스너
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
    
    // 성능 이벤트 리스너
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
            this.handlePerformanceEntry(entry);
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }
  }

  /**
   * 이벤트 리스너 제거
   */
  private removeEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('error', this.handleError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleRejection.bind(this));
  }

  /**
   * 에러 처리
   */
  private handleError(event: ErrorEvent): void {
    const currentErrors = parseInt(sessionStorage.getItem('recent_errors') || '0');
    sessionStorage.setItem('recent_errors', (currentErrors + 1).toString());
    
    console.error('[RollbackMonitor] Error detected:', event.error);
  }

  /**
   * Promise rejection 처리
   */
  private handleRejection(event: PromiseRejectionEvent): void {
    const currentErrors = parseInt(sessionStorage.getItem('recent_errors') || '0');
    sessionStorage.setItem('recent_errors', (currentErrors + 1).toString());
    
    console.error('[RollbackMonitor] Unhandled rejection:', event.reason);
  }

  /**
   * 성능 엔트리 처리
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    // 성능 데이터 수집
    console.log('[RollbackMonitor] Performance entry:', entry.name, entry.duration);
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(config: Partial<RollbackConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[RollbackMonitor] Config updated:', this.config);
  }

  /**
   * 현재 상태 가져오기
   */
  public getStatus(): {
    isMonitoring: boolean;
    config: RollbackConfig;
    recentMetrics: PerformanceMetrics[];
    rollbackHistory: typeof this.rollbackHistory;
  } {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      recentMetrics: this.metrics.slice(-10), // 최근 10개
      rollbackHistory: this.rollbackHistory,
    };
  }

  /**
   * 수동 롤백
   */
  public manualRollback(reason: string = 'Manual rollback triggered'): void {
    const metrics = this.collectMetrics();
    this.triggerRollback(reason, metrics);
  }

  /**
   * 롤백 히스토리 초기화
   */
  public clearHistory(): void {
    this.rollbackHistory = [];
    this.metrics = [];
  }
}

// 싱글톤 인스턴스 export
export const rollbackMonitor = RollbackMonitor.getInstance();

// 자동 시작 (프로덕션 환경에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // 페이지 로드 완료 후 시작
  window.addEventListener('load', () => {
    setTimeout(() => {
      rollbackMonitor.start();
    }, 5000); // 5초 후 시작
  });
}