/**
 * A/B 테스트 설정
 * iOS 스타일 대시보드의 점진적 롤아웃을 위한 A/B 테스트 구성
 */

import { z } from 'zod';

// A/B 테스트 그룹 타입
export const ABTestGroupSchema = z.object({
  percentage: z.number().min(0).max(100),
  features: z.record(z.boolean()),
  metadata: z.record(z.any()).optional(),
});

export type ABTestGroup = z.infer<typeof ABTestGroupSchema>;

// A/B 테스트 설정 타입
export const ABTestConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  groups: z.object({
    control: ABTestGroupSchema,
    treatment: ABTestGroupSchema,
  }),
  metrics: z.array(z.string()),
  successCriteria: z.record(z.string()),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ABTestConfig = z.infer<typeof ABTestConfigSchema>;

/**
 * iOS 스타일 대시보드 A/B 테스트 설정
 */
export const iosStyleABTest: ABTestConfig = {
  name: 'ios_style_dashboard',
  description: 'iOS 스타일 대시보드 vs 레거시 대시보드 비교 테스트',
  enabled: true,
  groups: {
    control: {
      percentage: 50,
      features: { 
        useIOSStyle: false,
        enableWidgetMigration: false,
        showNewEditMode: false,
      },
      metadata: {
        groupName: 'Legacy Dashboard',
        description: '기존 대시보드 유지'
      }
    },
    treatment: {
      percentage: 50,
      features: { 
        useIOSStyle: true,
        enableWidgetMigration: true,
        showNewEditMode: true,
      },
      metadata: {
        groupName: 'iOS Style Dashboard',
        description: '새로운 iOS 스타일 대시보드'
      }
    }
  },
  metrics: [
    'widget_interaction_rate',
    'edit_mode_usage',
    'error_rate',
    'performance_score',
    'user_satisfaction',
    'task_completion_rate',
    'time_to_complete_task',
    'bounce_rate'
  ],
  successCriteria: {
    error_rate: '< 2%',
    interaction_rate: '> control + 10%',
    performance_score: '> 90',
    user_satisfaction: '> 4.0',
    task_completion_rate: '> 85%'
  },
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2주 후
};

/**
 * A/B 테스트 서비스
 */
export class ABTestService {
  private static instance: ABTestService;
  private userGroups: Map<string, string> = new Map();
  private metrics: Map<string, any[]> = new Map();

  private constructor() {
    this.initializeMetrics();
  }

  public static getInstance(): ABTestService {
    if (!ABTestService.instance) {
      ABTestService.instance = new ABTestService();
    }
    return ABTestService.instance;
  }

  /**
   * 사용자를 A/B 테스트 그룹에 할당
   */
  public assignUserToGroup(userId: string, testName: string = 'ios_style_dashboard'): string {
    // 이미 할당된 그룹이 있으면 반환
    const existingGroup = this.userGroups.get(`${userId}_${testName}`);
    if (existingGroup) {
      return existingGroup;
    }

    // 무작위로 그룹 할당
    const random = Math.random() * 100;
    const group = random < 50 ? 'control' : 'treatment';
    
    this.userGroups.set(`${userId}_${testName}`, group);
    
    // 로컬 스토리지에 저장 (영속성)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ab_test_${testName}_${userId}`, group);
    }

    console.log(`[ABTest] User ${userId} assigned to ${group} group`);
    return group;
  }

  /**
   * 사용자 그룹 가져오기
   */
  public getUserGroup(userId: string, testName: string = 'ios_style_dashboard'): string | null {
    // 메모리에서 확인
    let group = this.userGroups.get(`${userId}_${testName}`);
    
    // 로컬 스토리지에서 확인
    if (!group && typeof window !== 'undefined') {
      group = localStorage.getItem(`ab_test_${testName}_${userId}`) || null;
      if (group) {
        this.userGroups.set(`${userId}_${testName}`, group);
      }
    }

    return group;
  }

  /**
   * Feature Flag 값 가져오기
   */
  public getFeatureFlags(userId: string, testName: string = 'ios_style_dashboard'): Record<string, boolean> {
    const group = this.getUserGroup(userId, testName) || this.assignUserToGroup(userId, testName);
    
    if (testName === 'ios_style_dashboard') {
      return group === 'treatment' 
        ? iosStyleABTest.groups.treatment.features
        : iosStyleABTest.groups.control.features;
    }

    return {};
  }

  /**
   * 메트릭 초기화
   */
  private initializeMetrics(): void {
    iosStyleABTest.metrics.forEach(metric => {
      this.metrics.set(metric, []);
    });
  }

  /**
   * 메트릭 기록
   */
  public trackMetric(
    userId: string, 
    metricName: string, 
    value: number | boolean | string,
    metadata?: Record<string, any>
  ): void {
    const group = this.getUserGroup(userId);
    if (!group) return;

    const metricData = {
      userId,
      group,
      value,
      timestamp: Date.now(),
      ...metadata
    };

    const metrics = this.metrics.get(metricName) || [];
    metrics.push(metricData);
    this.metrics.set(metricName, metrics);

    // 서버로 전송 (실제 구현 시)
    if (process.env.NODE_ENV === 'production') {
      this.sendMetricToServer(metricName, metricData);
    }
  }

  /**
   * 서버로 메트릭 전송
   */
  private async sendMetricToServer(metricName: string, data: any): Promise<void> {
    try {
      // 실제 구현에서는 API 엔드포인트로 전송
      await fetch('/api/ab-test/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: 'ios_style_dashboard',
          metric: metricName,
          data
        })
      });
    } catch (error) {
      console.error('[ABTest] Failed to send metric:', error);
    }
  }

  /**
   * 성공 기준 평가
   */
  public evaluateSuccessCriteria(): Record<string, boolean> {
    const results: Record<string, boolean> = {};
    
    // 에러율 평가
    const errorRateData = this.metrics.get('error_rate') || [];
    const treatmentErrors = errorRateData.filter(d => d.group === 'treatment');
    const errorRate = treatmentErrors.filter(d => d.value === true).length / treatmentErrors.length;
    results['error_rate'] = errorRate < 0.02; // 2% 미만

    // 상호작용율 평가
    const interactionData = this.metrics.get('widget_interaction_rate') || [];
    const controlInteraction = this.calculateAverage(interactionData.filter(d => d.group === 'control'));
    const treatmentInteraction = this.calculateAverage(interactionData.filter(d => d.group === 'treatment'));
    results['interaction_rate'] = treatmentInteraction > controlInteraction * 1.1; // 10% 증가

    // 성능 점수 평가
    const performanceData = this.metrics.get('performance_score') || [];
    const treatmentPerformance = this.calculateAverage(performanceData.filter(d => d.group === 'treatment'));
    results['performance_score'] = treatmentPerformance > 90;

    return results;
  }

  /**
   * 평균 계산 헬퍼
   */
  private calculateAverage(data: any[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + (typeof d.value === 'number' ? d.value : 0), 0);
    return sum / data.length;
  }

  /**
   * A/B 테스트 결과 가져오기
   */
  public getTestResults(): {
    groups: { control: number; treatment: number };
    metrics: Record<string, { control: number; treatment: number }>;
    successCriteria: Record<string, boolean>;
  } {
    // 그룹별 사용자 수
    const groups = { control: 0, treatment: 0 };
    this.userGroups.forEach(group => {
      if (group === 'control') groups.control++;
      else if (group === 'treatment') groups.treatment++;
    });

    // 메트릭별 결과
    const metrics: Record<string, { control: number; treatment: number }> = {};
    this.metrics.forEach((data, metricName) => {
      const controlData = data.filter(d => d.group === 'control');
      const treatmentData = data.filter(d => d.group === 'treatment');
      
      metrics[metricName] = {
        control: this.calculateAverage(controlData),
        treatment: this.calculateAverage(treatmentData),
      };
    });

    // 성공 기준 평가
    const successCriteria = this.evaluateSuccessCriteria();

    return { groups, metrics, successCriteria };
  }

  /**
   * A/B 테스트 리셋
   */
  public reset(): void {
    this.userGroups.clear();
    this.initializeMetrics();
    
    // 로컬 스토리지 클리어
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('ab_test_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
}

// 싱글톤 인스턴스 export
export const abTestService = ABTestService.getInstance();