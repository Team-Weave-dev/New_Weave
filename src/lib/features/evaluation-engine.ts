/**
 * Feature Flag 평가 엔진
 * 조건에 따라 Feature Flag의 활성화 여부를 결정
 */

import {
  FeatureFlag,
  FeatureFlagContext,
  FeatureFlagEvaluation,
  ABTestGroup,
  CustomRule,
} from './types';

export class FeatureFlagEvaluationEngine {
  private userHashCache = new Map<string, number>();

  /**
   * Feature Flag 평가
   */
  evaluate(
    flag: FeatureFlag,
    context: FeatureFlagContext
  ): FeatureFlagEvaluation {
    // 비활성 상태면 즉시 false 반환
    if (flag.status === 'disabled') {
      return {
        enabled: false,
        flag,
        reason: 'Flag is disabled',
      };
    }

    // 활성 상태면 조건 없이 true
    if (flag.status === 'enabled' && !flag.conditions) {
      return {
        enabled: true,
        flag,
        reason: 'Flag is enabled globally',
      };
    }

    // 조건부 평가
    if (flag.status === 'conditional' || flag.conditions) {
      const conditionResult = this.evaluateConditions(flag, context);
      if (!conditionResult.passed) {
        return {
          enabled: false,
          flag,
          reason: conditionResult.reason,
        };
      }
    }

    // 롤아웃 전략 평가
    return this.evaluateRollout(flag, context);
  }

  /**
   * 조건 평가
   */
  private evaluateConditions(
    flag: FeatureFlag,
    context: FeatureFlagContext
  ): { passed: boolean; reason: string } {
    if (!flag.conditions) {
      return { passed: true, reason: 'No conditions' };
    }

    const { conditions } = flag;

    // 환경 체크
    if (conditions.environment && conditions.environment !== context.environment) {
      return {
        passed: false,
        reason: `Environment mismatch: ${context.environment} not in ${conditions.environment}`,
      };
    }

    // 사용자 역할 체크
    if (conditions.userRole && context.userRole) {
      if (!conditions.userRole.includes(context.userRole)) {
        return {
          passed: false,
          reason: `User role ${context.userRole} not allowed`,
        };
      }
    }

    // 디바이스 타입 체크
    if (conditions.deviceType && context.deviceType) {
      if (conditions.deviceType !== context.deviceType) {
        return {
          passed: false,
          reason: `Device type ${context.deviceType} not allowed`,
        };
      }
    }

    // 브라우저 체크
    if (conditions.browser && context.browser) {
      if (!conditions.browser.includes(context.browser)) {
        return {
          passed: false,
          reason: `Browser ${context.browser} not allowed`,
        };
      }
    }

    // 지역 체크
    if (conditions.region && context.region) {
      if (!conditions.region.includes(context.region)) {
        return {
          passed: false,
          reason: `Region ${context.region} not allowed`,
        };
      }
    }

    // 커스텀 규칙 평가
    if (conditions.customRules) {
      for (const rule of conditions.customRules) {
        if (!this.evaluateCustomRule(rule, context)) {
          return {
            passed: false,
            reason: `Custom rule failed: ${rule.description || rule.id}`,
          };
        }
      }
    }

    return { passed: true, reason: 'All conditions met' };
  }

  /**
   * 롤아웃 전략 평가
   */
  private evaluateRollout(
    flag: FeatureFlag,
    context: FeatureFlagContext
  ): FeatureFlagEvaluation {
    const { rollout } = flag;

    if (!rollout) {
      return {
        enabled: true,
        flag,
        reason: 'No rollout strategy',
      };
    }

    switch (rollout.strategy) {
      case 'percentage':
        return this.evaluatePercentageRollout(flag, context);

      case 'whitelist':
        return this.evaluateWhitelist(flag, context);

      case 'blacklist':
        return this.evaluateBlacklist(flag, context);

      case 'gradual':
        return this.evaluateGradualRollout(flag, context);

      case 'ab_test':
        return this.evaluateABTest(flag, context);

      default:
        return {
          enabled: false,
          flag,
          reason: `Unknown rollout strategy: ${rollout.strategy}`,
        };
    }
  }

  /**
   * 퍼센트 기반 롤아웃
   */
  private evaluatePercentageRollout(
    flag: FeatureFlag,
    context: FeatureFlagContext
  ): FeatureFlagEvaluation {
    const percentage = flag.rollout.percentage || 0;
    const hash = this.getUserHash(context.userId || context.sessionId || '');
    const enabled = (hash % 100) < percentage;

    return {
      enabled,
      flag,
      reason: `Percentage rollout: ${percentage}%`,
    };
  }

  /**
   * 화이트리스트 평가
   */
  private evaluateWhitelist(
    flag: FeatureFlag,
    context: FeatureFlagContext
  ): FeatureFlagEvaluation {
    const userIds = flag.rollout.userIds || [];
    const enabled = context.userId ? userIds.includes(context.userId) : false;

    return {
      enabled,
      flag,
      reason: enabled ? 'User in whitelist' : 'User not in whitelist',
    };
  }

  /**
   * 블랙리스트 평가
   */
  private evaluateBlacklist(
    flag: FeatureFlag,
    context: FeatureFlagContext
  ): FeatureFlagEvaluation {
    const userIds = flag.rollout.userIds || [];
    const enabled = context.userId ? !userIds.includes(context.userId) : true;

    return {
      enabled,
      flag,
      reason: enabled ? 'User not in blacklist' : 'User in blacklist',
    };
  }

  /**
   * 점진적 롤아웃 평가
   */
  private evaluateGradualRollout(
    flag: FeatureFlag,
    context: FeatureFlagContext
  ): FeatureFlagEvaluation {
    const { startDate, endDate, percentage = 100 } = flag.rollout;
    const now = new Date();

    // 날짜 체크
    if (startDate && now < startDate) {
      return {
        enabled: false,
        flag,
        reason: 'Rollout not started',
      };
    }

    if (endDate && now > endDate) {
      return {
        enabled: false,
        flag,
        reason: 'Rollout ended',
      };
    }

    // 점진적 퍼센트 계산
    if (startDate && endDate) {
      const totalMs = endDate.getTime() - startDate.getTime();
      const elapsedMs = now.getTime() - startDate.getTime();
      const progress = Math.min(elapsedMs / totalMs, 1);
      const currentPercentage = progress * percentage;
      
      const hash = this.getUserHash(context.userId || context.sessionId || '');
      const enabled = (hash % 100) < currentPercentage;

      return {
        enabled,
        flag,
        reason: `Gradual rollout: ${currentPercentage.toFixed(1)}%`,
      };
    }

    return this.evaluatePercentageRollout(flag, context);
  }

  /**
   * A/B 테스트 평가
   */
  private evaluateABTest(
    flag: FeatureFlag,
    context: FeatureFlagContext
  ): FeatureFlagEvaluation {
    const groups = flag.rollout.groups || [];
    if (groups.length === 0) {
      return {
        enabled: false,
        flag,
        reason: 'No A/B test groups defined',
      };
    }

    const hash = this.getUserHash(context.userId || context.sessionId || '');
    const bucket = hash % 100;
    
    let cumulativePercentage = 0;
    for (const group of groups) {
      cumulativePercentage += group.percentage;
      if (bucket < cumulativePercentage) {
        return {
          enabled: group.variant === 'treatment',
          flag,
          reason: `A/B test group: ${group.name}`,
          variant: group.name,
          metadata: group.metadata,
        };
      }
    }

    return {
      enabled: false,
      flag,
      reason: 'User not in any A/B test group',
    };
  }

  /**
   * 커스텀 규칙 평가
   */
  private evaluateCustomRule(
    rule: CustomRule,
    context: FeatureFlagContext
  ): boolean {
    if (rule.type === 'javascript') {
      try {
        // 보안을 위해 제한된 컨텍스트에서 실행
        const fn = new Function('context', rule.rule as string);
        return fn(context);
      } catch (error) {
        console.error('Custom rule evaluation failed:', error);
        return false;
      }
    }

    // JSON Logic 지원 (추후 구현)
    if (rule.type === 'json_logic') {
      // TODO: json-logic 라이브러리 통합
      return false;
    }

    return false;
  }

  /**
   * 사용자 해시 생성 (일관된 분배를 위해)
   */
  private getUserHash(identifier: string): number {
    if (this.userHashCache.has(identifier)) {
      return this.userHashCache.get(identifier)!;
    }

    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    const result = Math.abs(hash);
    this.userHashCache.set(identifier, result);
    
    return result;
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.userHashCache.clear();
  }
}