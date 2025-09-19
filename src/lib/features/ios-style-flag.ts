/**
 * iOS 스타일 대시보드 Feature Flag 서비스
 * 점진적 롤아웃을 위한 플래그 관리 시스템
 */

import { FeatureFlagEvaluationEngine } from './evaluation-engine';
import { MetricsCollector } from './metrics-collector';
import {
  FeatureFlag,
  FeatureFlagContext,
  FeatureFlagEvaluation,
  FeatureFlagConfig,
  FeatureFlagEvent,
  IOSFeatureFlags,
} from './types';

class FeatureFlagService {
  private static instance: FeatureFlagService;
  
  private evaluationEngine: FeatureFlagEvaluationEngine;
  private metricsCollector: MetricsCollector;
  private flags: Map<string, FeatureFlag> = new Map();
  private evaluationCache: Map<string, FeatureFlagEvaluation> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5분
  private lastCacheUpdate: number = 0;
  private pollingInterval?: NodeJS.Timeout;
  private config: FeatureFlagConfig;
  private defaultContext: Partial<FeatureFlagContext> = {};

  private constructor(config?: FeatureFlagConfig) {
    this.config = {
      pollingInterval: 60000, // 1분
      cacheTimeout: 5 * 60 * 1000,
      enableMetrics: true,
      enableRollback: true,
      debug: false,
      ...config,
    };

    this.evaluationEngine = new FeatureFlagEvaluationEngine();
    this.metricsCollector = new MetricsCollector({
      enabled: this.config.enableMetrics,
    });

    this.initializeFlags();
    this.startPolling();
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(config?: FeatureFlagConfig): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService(config);
    }
    return FeatureFlagService.instance;
  }

  /**
   * 기본 Feature Flags 초기화
   */
  private initializeFlags(): void {
    // iOS 스타일 대시보드 메인 플래그
    this.flags.set(IOSFeatureFlags.IOS_STYLE_DASHBOARD, {
      id: IOSFeatureFlags.IOS_STYLE_DASHBOARD,
      name: 'iOS Style Dashboard',
      description: 'iOS/iPadOS 스타일 위젯 편집 시스템',
      status: 'conditional',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      createdBy: 'system',
      rollout: {
        strategy: 'percentage',
        percentage: 10, // 10% 사용자부터 시작
      },
      conditions: {
        environment: 'production',
      },
      metrics: {
        enabled: true,
        events: [
          { type: 'view', name: 'dashboard_view' },
          { type: 'click', name: 'edit_mode_enter' },
          { type: 'conversion', name: 'widget_edited' },
        ],
      },
      rollback: {
        enabled: true,
        triggerConditions: [
          {
            metric: 'error_rate',
            threshold: 0.05, // 5% 이상 에러율
            operator: '>',
            windowMinutes: 5,
          },
        ],
      },
    });

    // Long Press 기능
    this.flags.set(IOSFeatureFlags.IOS_LONG_PRESS, {
      id: IOSFeatureFlags.IOS_LONG_PRESS,
      name: 'iOS Long Press',
      description: '길게 누르기로 편집 모드 진입',
      status: 'enabled',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      createdBy: 'system',
      rollout: {
        strategy: 'percentage',
        percentage: 100,
      },
    });

    // Wiggle 애니메이션
    this.flags.set(IOSFeatureFlags.IOS_WIGGLE_ANIMATION, {
      id: IOSFeatureFlags.IOS_WIGGLE_ANIMATION,
      name: 'iOS Wiggle Animation',
      description: '편집 모드 위젯 흔들림 애니메이션',
      status: 'enabled',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      createdBy: 'system',
      rollout: {
        strategy: 'percentage',
        percentage: 100,
      },
    });

    // 자동 재배치
    this.flags.set(IOSFeatureFlags.IOS_AUTO_REFLOW, {
      id: IOSFeatureFlags.IOS_AUTO_REFLOW,
      name: 'iOS Auto Reflow',
      description: '위젯 자동 재배치 시스템',
      status: 'conditional',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      createdBy: 'system',
      rollout: {
        strategy: 'ab_test',
        groups: [
          {
            id: 'control',
            name: 'Control',
            percentage: 50,
            variant: 'control',
          },
          {
            id: 'treatment',
            name: 'Treatment',
            percentage: 50,
            variant: 'treatment',
          },
        ],
      },
    });

    // 스마트 배치
    this.flags.set(IOSFeatureFlags.IOS_SMART_PLACEMENT, {
      id: IOSFeatureFlags.IOS_SMART_PLACEMENT,
      name: 'iOS Smart Placement',
      description: '지능형 위젯 배치 추천',
      status: 'conditional',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      createdBy: 'system',
      rollout: {
        strategy: 'gradual',
        percentage: 100,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-02-01'),
      },
    });

    // 키보드 단축키
    this.flags.set(IOSFeatureFlags.IOS_KEYBOARD_SHORTCUTS, {
      id: IOSFeatureFlags.IOS_KEYBOARD_SHORTCUTS,
      name: 'iOS Keyboard Shortcuts',
      description: '편집 모드 키보드 단축키',
      status: 'enabled',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      createdBy: 'system',
      rollout: {
        strategy: 'percentage',
        percentage: 100,
      },
    });

    // 햅틱 피드백
    this.flags.set(IOSFeatureFlags.IOS_HAPTIC_FEEDBACK, {
      id: IOSFeatureFlags.IOS_HAPTIC_FEEDBACK,
      name: 'iOS Haptic Feedback',
      description: '터치 햅틱 피드백',
      status: 'conditional',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      createdBy: 'system',
      rollout: {
        strategy: 'percentage',
        percentage: 100,
      },
      conditions: {
        deviceType: 'mobile',
      },
    });

    // 가상화
    this.flags.set(IOSFeatureFlags.IOS_VIRTUALIZATION, {
      id: IOSFeatureFlags.IOS_VIRTUALIZATION,
      name: 'iOS Virtualization',
      description: '대규모 위젯 가상화',
      status: 'disabled', // 아직 미구현
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      createdBy: 'system',
      rollout: {
        strategy: 'percentage',
        percentage: 0,
      },
    });
  }

  /**
   * Feature Flag 평가
   */
  isEnabled(
    flagId: string,
    context?: Partial<FeatureFlagContext>
  ): boolean {
    const evaluation = this.evaluate(flagId, context);
    return evaluation.enabled;
  }

  /**
   * Feature Flag 상세 평가
   */
  evaluate(
    flagId: string,
    context?: Partial<FeatureFlagContext>
  ): FeatureFlagEvaluation {
    const flag = this.flags.get(flagId);
    
    if (!flag) {
      return {
        enabled: false,
        flag: {
          id: flagId,
          name: 'Unknown',
          description: 'Flag not found',
          status: 'disabled',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          rollout: { strategy: 'percentage', percentage: 0 },
        },
        reason: 'Flag not found',
      };
    }

    // 컨텍스트 병합
    const fullContext: FeatureFlagContext = {
      environment: this.getEnvironment(),
      deviceType: this.getDeviceType(),
      browser: this.getBrowserName(),
      sessionId: this.getSessionId(),
      ...this.defaultContext,
      ...context,
    };

    // 캐시 체크
    const cacheKey = `${flagId}_${JSON.stringify(fullContext)}`;
    const cached = this.evaluationCache.get(cacheKey);
    
    if (cached && Date.now() - this.lastCacheUpdate < this.cacheTimeout) {
      this.metricsCollector.trackPerformance(flagId, 0, true);
      return cached;
    }

    // 평가 수행
    const startTime = performance.now();
    const evaluation = this.evaluationEngine.evaluate(flag, fullContext);
    const evaluationTime = performance.now() - startTime;

    // 캐시 저장
    this.evaluationCache.set(cacheKey, evaluation);
    this.lastCacheUpdate = Date.now();

    // 메트릭 수집
    this.metricsCollector.trackPerformance(flagId, evaluationTime, false);
    
    if (flag.metrics?.enabled) {
      this.metricsCollector.trackExposure(flag, evaluation.variant || 'default', fullContext);
    }

    // 디버그 로깅
    if (this.config.debug) {
      console.log(`[FeatureFlag] ${flagId}:`, {
        enabled: evaluation.enabled,
        reason: evaluation.reason,
        variant: evaluation.variant,
        context: fullContext,
      });
    }

    return evaluation;
  }

  /**
   * 모든 플래그 평가
   */
  evaluateAll(context?: Partial<FeatureFlagContext>): Record<string, boolean> {
    const results: Record<string, boolean> = {};
    
    this.flags.forEach((flag) => {
      results[flag.id] = this.isEnabled(flag.id, context);
    });

    return results;
  }

  /**
   * iOS 기능별 활성화 체크
   */
  getIOSFeatures(context?: Partial<FeatureFlagContext>): Record<string, boolean> {
    const results: Record<string, boolean> = {};
    
    Object.values(IOSFeatureFlags).forEach((flagId) => {
      results[flagId] = this.isEnabled(flagId, context);
    });

    return results;
  }

  /**
   * 플래그 업데이트
   */
  updateFlag(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
    this.evaluationCache.clear();
    
    if (this.config.onFlagChange) {
      this.config.onFlagChange(Array.from(this.flags.values()));
    }
  }

  /**
   * 원격 플래그 가져오기
   */
  private async fetchRemoteFlags(): Promise<void> {
    if (!this.config.apiUrl) return;

    try {
      const response = await fetch(this.config.apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flags: ${response.statusText}`);
      }

      const remoteFlags: FeatureFlag[] = await response.json();
      
      remoteFlags.forEach(flag => {
        this.flags.set(flag.id, flag);
      });

      this.evaluationCache.clear();
      
      if (this.config.onFlagChange) {
        this.config.onFlagChange(remoteFlags);
      }
    } catch (error) {
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      console.error('Failed to fetch remote flags:', error);
    }
  }

  /**
   * 주기적 폴링 시작
   */
  private startPolling(): void {
    if (!this.config.pollingInterval || !this.config.apiUrl) return;

    this.pollingInterval = setInterval(() => {
      this.fetchRemoteFlags();
    }, this.config.pollingInterval);
  }

  /**
   * 폴링 중지
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  /**
   * 환경 감지
   */
  private getEnvironment(): 'development' | 'staging' | 'production' {
    if (typeof window === 'undefined') return 'development';
    
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    
    if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging';
    }
    
    return 'production';
  }

  /**
   * 디바이스 타입 감지
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    
    return 'desktop';
  }

  /**
   * 브라우저 이름 감지
   */
  private getBrowserName(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const ua = navigator.userAgent;
    
    if (ua.includes('Chrome')) return 'chrome';
    if (ua.includes('Safari')) return 'safari';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Edge')) return 'edge';
    
    return 'other';
  }

  /**
   * 세션 ID 가져오기
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    let sessionId = sessionStorage.getItem('ff_session_id');
    
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ff_session_id', sessionId);
    }
    
    return sessionId;
  }

  /**
   * 기본 컨텍스트 설정
   */
  setDefaultContext(context: Partial<FeatureFlagContext>): void {
    this.defaultContext = context;
    this.evaluationCache.clear();
  }

  /**
   * 메트릭 수집기 가져오기
   */
  getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.evaluationCache.clear();
    this.evaluationEngine.clearCache();
  }

  /**
   * 정리
   */
  destroy(): void {
    this.stopPolling();
    this.metricsCollector.destroy();
    this.clearCache();
  }
}

// 싱글톤 인스턴스 내보내기
export const featureFlagService = FeatureFlagService.getInstance();

// 편의 함수들
export const isFeatureEnabled = (
  flagId: string,
  context?: Partial<FeatureFlagContext>
): boolean => {
  return featureFlagService.isEnabled(flagId, context);
};

export const getIOSFeatures = (
  context?: Partial<FeatureFlagContext>
): Record<string, boolean> => {
  return featureFlagService.getIOSFeatures(context);
};