/**
 * Feature Flag React Hook
 * Feature Flag 상태를 React 컴포넌트에서 사용하기 위한 훅
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  featureFlagService,
  isFeatureEnabled,
  getIOSFeatures,
} from '@/lib/features/ios-style-flag';
import {
  FeatureFlagContext,
  FeatureFlagEvaluation,
  IOSFeatureFlags,
} from '@/lib/features/types';

/**
 * 단일 Feature Flag 사용 훅
 */
export function useFeatureFlag(
  flagId: string,
  context?: Partial<FeatureFlagContext>
): {
  enabled: boolean;
  evaluation: FeatureFlagEvaluation | null;
  loading: boolean;
  refresh: () => void;
} {
  const [evaluation, setEvaluation] = useState<FeatureFlagEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  const evaluateFlag = useCallback(() => {
    try {
      const result = featureFlagService.evaluate(flagId, context);
      setEvaluation(result);
    } catch (error) {
      console.error(`Failed to evaluate feature flag ${flagId}:`, error);
      setEvaluation({
        enabled: false,
        flag: {
          id: flagId,
          name: 'Error',
          description: 'Evaluation failed',
          status: 'disabled',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          rollout: { strategy: 'percentage', percentage: 0 },
        },
        reason: 'Evaluation error',
      });
    } finally {
      setLoading(false);
    }
  }, [flagId, context]);

  useEffect(() => {
    evaluateFlag();
  }, [evaluateFlag]);

  const refresh = useCallback(() => {
    setLoading(true);
    featureFlagService.clearCache();
    evaluateFlag();
  }, [evaluateFlag]);

  return {
    enabled: evaluation?.enabled ?? false,
    evaluation,
    loading,
    refresh,
  };
}

/**
 * 여러 Feature Flag 사용 훅
 */
export function useFeatureFlags(
  flagIds: string[],
  context?: Partial<FeatureFlagContext>
): {
  flags: Record<string, boolean>;
  evaluations: Record<string, FeatureFlagEvaluation>;
  loading: boolean;
  refresh: () => void;
} {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [evaluations, setEvaluations] = useState<Record<string, FeatureFlagEvaluation>>({});
  const [loading, setLoading] = useState(true);

  const evaluateFlags = useCallback(() => {
    try {
      const flagResults: Record<string, boolean> = {};
      const evalResults: Record<string, FeatureFlagEvaluation> = {};

      flagIds.forEach((flagId) => {
        const evaluation = featureFlagService.evaluate(flagId, context);
        flagResults[flagId] = evaluation.enabled;
        evalResults[flagId] = evaluation;
      });

      setFlags(flagResults);
      setEvaluations(evalResults);
    } catch (error) {
      console.error('Failed to evaluate feature flags:', error);
    } finally {
      setLoading(false);
    }
  }, [flagIds, context]);

  useEffect(() => {
    evaluateFlags();
  }, [evaluateFlags]);

  const refresh = useCallback(() => {
    setLoading(true);
    featureFlagService.clearCache();
    evaluateFlags();
  }, [evaluateFlags]);

  return {
    flags,
    evaluations,
    loading,
    refresh,
  };
}

/**
 * iOS 기능 플래그 전용 훅
 */
export function useIOSFeatureFlags(
  context?: Partial<FeatureFlagContext>
): {
  features: {
    dashboard: boolean;
    longPress: boolean;
    wiggleAnimation: boolean;
    autoReflow: boolean;
    smartPlacement: boolean;
    keyboardShortcuts: boolean;
    hapticFeedback: boolean;
    virtualization: boolean;
  };
  raw: Record<string, boolean>;
  loading: boolean;
  refresh: () => void;
} {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const evaluateFeatures = useCallback(() => {
    try {
      const result = getIOSFeatures(context);
      setFeatures(result);
    } catch (error) {
      console.error('Failed to evaluate iOS feature flags:', error);
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    evaluateFeatures();
  }, [evaluateFeatures]);

  const refresh = useCallback(() => {
    setLoading(true);
    featureFlagService.clearCache();
    evaluateFeatures();
  }, [evaluateFeatures]);

  const formattedFeatures = useMemo(() => ({
    dashboard: features[IOSFeatureFlags.IOS_STYLE_DASHBOARD] ?? false,
    longPress: features[IOSFeatureFlags.IOS_LONG_PRESS] ?? false,
    wiggleAnimation: features[IOSFeatureFlags.IOS_WIGGLE_ANIMATION] ?? false,
    autoReflow: features[IOSFeatureFlags.IOS_AUTO_REFLOW] ?? false,
    smartPlacement: features[IOSFeatureFlags.IOS_SMART_PLACEMENT] ?? false,
    keyboardShortcuts: features[IOSFeatureFlags.IOS_KEYBOARD_SHORTCUTS] ?? false,
    hapticFeedback: features[IOSFeatureFlags.IOS_HAPTIC_FEEDBACK] ?? false,
    virtualization: features[IOSFeatureFlags.IOS_VIRTUALIZATION] ?? false,
  }), [features]);

  return {
    features: formattedFeatures,
    raw: features,
    loading,
    refresh,
  };
}

/**
 * A/B 테스트 훅
 */
export function useABTest(
  flagId: string,
  context?: Partial<FeatureFlagContext>
): {
  variant: string;
  enabled: boolean;
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  loading: boolean;
} {
  const { evaluation, loading } = useFeatureFlag(flagId, context);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (!evaluation?.flag) return;

    const metricsCollector = featureFlagService.getMetricsCollector();
    metricsCollector.track(
      evaluation.flag,
      'conversion',
      eventName,
      {
        ...context,
        environment: 'production',
        sessionId: context?.sessionId || '',
      } as FeatureFlagContext,
      properties
    );
  }, [evaluation, context]);

  return {
    variant: evaluation?.variant || 'control',
    enabled: evaluation?.enabled ?? false,
    trackEvent,
    loading,
  };
}

/**
 * Feature Flag Provider 컴포넌트
 */
import React, { createContext, useContext, ReactNode } from 'react';

interface FeatureFlagProviderProps {
  children: ReactNode;
  context?: Partial<FeatureFlagContext>;
  config?: {
    pollingInterval?: number;
    debug?: boolean;
  };
}

const FeatureFlagContext = createContext<{
  context?: Partial<FeatureFlagContext>;
}>({});

export function FeatureFlagProvider({
  children,
  context,
  config,
}: FeatureFlagProviderProps) {
  useEffect(() => {
    if (context) {
      featureFlagService.setDefaultContext(context);
    }
  }, [context]);

  return (
    <FeatureFlagContext.Provider value={{ context }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Feature Flag Gate 컴포넌트
 */
interface FeatureGateProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
  context?: Partial<FeatureFlagContext>;
}

export function FeatureGate({
  flag,
  children,
  fallback = null,
  context,
}: FeatureGateProps) {
  const { enabled, loading } = useFeatureFlag(flag, context);

  if (loading) {
    return null; // 또는 로딩 인디케이터
  }

  return <>{enabled ? children : fallback}</>;
}

/**
 * iOS Feature Gate 컴포넌트
 */
interface IOSFeatureGateProps {
  feature: keyof ReturnType<typeof useIOSFeatureFlags>['features'];
  children: ReactNode;
  fallback?: ReactNode;
  context?: Partial<FeatureFlagContext>;
}

export function IOSFeatureGate({
  feature,
  children,
  fallback = null,
  context,
}: IOSFeatureGateProps) {
  const { features, loading } = useIOSFeatureFlags(context);

  if (loading) {
    return null; // 또는 로딩 인디케이터
  }

  return <>{features[feature] ? children : fallback}</>;
}

/**
 * Feature Flag 디버그 패널
 */
export function FeatureFlagDebugPanel() {
  const { features, raw, refresh } = useIOSFeatureFlags();
  const [visible, setVisible] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setVisible(!visible)}
        className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm"
      >
        🚩 Feature Flags
      </button>

      {visible && (
        <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 w-80">
          <h3 className="font-semibold mb-2">iOS Feature Flags</h3>
          <div className="space-y-1 text-sm">
            {Object.entries(features).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>{key}:</span>
                <span className={value ? 'text-green-500' : 'text-red-500'}>
                  {value ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={refresh}
            className="mt-3 w-full bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded text-sm"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}