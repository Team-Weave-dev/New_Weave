/**
 * Feature Flag Hook
 * Feature Flag 사용을 위한 React Hook
 */

import { useState, useEffect } from 'react';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rollout?: {
    strategy: 'percentage' | 'userGroup' | 'all';
    percentage?: number;
    userGroups?: string[];
  };
}

/**
 * Feature Flag 사용 훅
 */
export function useFeatureFlag(flagName: string): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // 환경 변수 체크
    if (flagName === 'ios_style_dashboard') {
      const envEnabled = process.env.NEXT_PUBLIC_IOS_STYLE_ENABLED === 'true';
      const localOverride = localStorage.getItem('weave-ios-override');
      
      if (localOverride !== null) {
        setIsEnabled(localOverride === 'true');
      } else {
        setIsEnabled(envEnabled);
      }
    } else {
      // 다른 Feature Flag들
      const flagValue = localStorage.getItem(`feature_${flagName}`);
      setIsEnabled(flagValue === 'true');
    }
  }, [flagName]);

  return isEnabled;
}

/**
 * Feature Flag 설정
 */
export function setFeatureFlag(flagName: string, enabled: boolean): void {
  if (flagName === 'ios_style_dashboard') {
    localStorage.setItem('weave-ios-override', enabled.toString());
  } else {
    localStorage.setItem(`feature_${flagName}`, enabled.toString());
  }
  
  // 페이지 새로고침 이벤트 발생
  window.dispatchEvent(new Event('featureFlagChanged'));
}

/**
 * 모든 Feature Flag 가져오기 (Non-React 함수)
 */
export function getAllFeatureFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  
  // iOS 스타일 대시보드 - Hook을 사용하지 않고 직접 확인
  if (typeof window !== 'undefined') {
    const envEnabled = process.env.NEXT_PUBLIC_IOS_STYLE_ENABLED === 'true';
    const localOverride = localStorage.getItem('weave-ios-override');
    flags['ios_style_dashboard'] = localOverride !== null ? localOverride === 'true' : envEnabled;
    
    // localStorage에서 다른 플래그들 확인
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('feature_')) {
        const flagName = key.replace('feature_', '');
        flags[flagName] = localStorage.getItem(key) === 'true';
      }
    }
  }
  
  return flags;
}