/**
 * Feature Flag 시스템 타입 정의
 * iOS 스타일 대시보드 점진적 롤아웃을 위한 타입 시스템
 */

export type FeatureFlagStatus = 'enabled' | 'disabled' | 'conditional';
export type RolloutStrategy = 'percentage' | 'whitelist' | 'blacklist' | 'gradual' | 'ab_test';
export type MetricType = 'click' | 'view' | 'conversion' | 'error' | 'performance';

/**
 * Feature Flag 정의
 */
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  status: FeatureFlagStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // 롤아웃 설정
  rollout: {
    strategy: RolloutStrategy;
    percentage?: number; // 0-100
    userIds?: string[]; // whitelist/blacklist
    startDate?: Date;
    endDate?: Date;
    groups?: ABTestGroup[]; // A/B 테스트 그룹
  };
  
  // 조건부 활성화
  conditions?: {
    environment?: 'development' | 'staging' | 'production';
    userRole?: string[];
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    browser?: string[];
    region?: string[];
    customRules?: CustomRule[];
  };
  
  // 메트릭 수집
  metrics?: {
    enabled: boolean;
    events: MetricEvent[];
    sampleRate?: number; // 0-1
  };
  
  // 롤백 설정
  rollback?: {
    enabled: boolean;
    triggerConditions?: RollbackCondition[];
    fallbackValue?: boolean;
  };
}

/**
 * A/B 테스트 그룹
 */
export interface ABTestGroup {
  id: string;
  name: string;
  percentage: number;
  variant: 'control' | 'treatment';
  metadata?: Record<string, any>;
}

/**
 * 커스텀 규칙
 */
export interface CustomRule {
  id: string;
  type: 'javascript' | 'json_logic';
  rule: string | object;
  description?: string;
}

/**
 * 메트릭 이벤트
 */
export interface MetricEvent {
  type: MetricType;
  name: string;
  properties?: Record<string, any>;
}

/**
 * 롤백 조건
 */
export interface RollbackCondition {
  metric: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  windowMinutes: number;
}

/**
 * Feature Flag 평가 결과
 */
export interface FeatureFlagEvaluation {
  enabled: boolean;
  flag: FeatureFlag;
  reason: string;
  variant?: string;
  metadata?: Record<string, any>;
}

/**
 * Feature Flag 컨텍스트
 */
export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  environment: 'development' | 'staging' | 'production';
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  region?: string;
  sessionId?: string;
  customAttributes?: Record<string, any>;
}

/**
 * Feature Flag 이벤트
 */
export interface FeatureFlagEvent {
  flagId: string;
  userId?: string;
  sessionId: string;
  eventType: MetricType;
  eventName: string;
  timestamp: Date;
  properties?: Record<string, any>;
  variant?: string;
}

/**
 * Feature Flag 설정
 */
export interface FeatureFlagConfig {
  apiUrl?: string;
  pollingInterval?: number; // ms
  cacheTimeout?: number; // ms
  enableMetrics?: boolean;
  enableRollback?: boolean;
  debug?: boolean;
  onError?: (error: Error) => void;
  onFlagChange?: (flags: FeatureFlag[]) => void;
}

/**
 * iOS 스타일 대시보드 특정 Feature Flags
 */
export enum IOSFeatureFlags {
  IOS_STYLE_DASHBOARD = 'ios_style_dashboard',
  IOS_LONG_PRESS = 'ios_long_press',
  IOS_WIGGLE_ANIMATION = 'ios_wiggle_animation',
  IOS_AUTO_REFLOW = 'ios_auto_reflow',
  IOS_SMART_PLACEMENT = 'ios_smart_placement',
  IOS_KEYBOARD_SHORTCUTS = 'ios_keyboard_shortcuts',
  IOS_HAPTIC_FEEDBACK = 'ios_haptic_feedback',
  IOS_VIRTUALIZATION = 'ios_virtualization',
}