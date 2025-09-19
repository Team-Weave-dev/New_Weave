'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * iOS 스타일 대시보드 Feature Flags
 */
export interface IOSFeatureFlags {
  isVirtualizationEnabled: boolean;  // 가상화 (대규모 위젯 최적화)
  isLongPressEnabled: boolean;       // Long Press 제스처
  isWiggleAnimationEnabled: boolean; // Wiggle 애니메이션
  isAutoReflowEnabled: boolean;      // 자동 재배치
  isSmartPlacementEnabled: boolean;  // 스마트 배치
  isKeyboardShortcutsEnabled: boolean; // 키보드 단축키
  isHapticFeedbackEnabled: boolean;  // 햅틱 피드백
}

/**
 * iOS Feature Flags를 관리하는 React Hook
 */
export function useIOSFeatureFlags(): IOSFeatureFlags {
  const [flags, setFlags] = useState<IOSFeatureFlags>({
    isVirtualizationEnabled: false,  // 기본값: 비활성 (IOSE-017 구현 중)
    isLongPressEnabled: true,
    isWiggleAnimationEnabled: true,
    isAutoReflowEnabled: true,
    isSmartPlacementEnabled: true,
    isKeyboardShortcutsEnabled: true,
    isHapticFeedbackEnabled: true,
  });

  useEffect(() => {
    // 환경 변수에서 Feature Flags 읽기
    const envFlags = {
      isVirtualizationEnabled: process.env.NEXT_PUBLIC_IOS_VIRTUALIZATION === 'true',
      isLongPressEnabled: process.env.NEXT_PUBLIC_IOS_LONG_PRESS !== 'false',
      isWiggleAnimationEnabled: process.env.NEXT_PUBLIC_IOS_WIGGLE_ANIMATION !== 'false',
      isAutoReflowEnabled: process.env.NEXT_PUBLIC_IOS_AUTO_REFLOW !== 'false',
      isSmartPlacementEnabled: process.env.NEXT_PUBLIC_IOS_SMART_PLACEMENT !== 'false',
      isKeyboardShortcutsEnabled: process.env.NEXT_PUBLIC_IOS_KEYBOARD_SHORTCUTS !== 'false',
      isHapticFeedbackEnabled: process.env.NEXT_PUBLIC_IOS_HAPTIC_FEEDBACK !== 'false',
    };

    // LocalStorage에서 사용자 설정 읽기
    if (typeof window !== 'undefined') {
      const storedFlags = localStorage.getItem('ios_feature_flags');
      if (storedFlags) {
        try {
          const parsedFlags = JSON.parse(storedFlags);
          setFlags({ ...envFlags, ...parsedFlags });
        } catch (error) {
          console.error('Failed to parse stored feature flags:', error);
          setFlags(envFlags);
        }
      } else {
        setFlags(envFlags);
      }
    }
  }, []);

  // Feature Flag 업데이트 함수
  const updateFlag = useCallback((flagName: keyof IOSFeatureFlags, value: boolean) => {
    setFlags(prev => {
      const newFlags = { ...prev, [flagName]: value };
      
      // LocalStorage에 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('ios_feature_flags', JSON.stringify(newFlags));
      }
      
      return newFlags;
    });
  }, []);

  // 개발 모드에서 디버그 정보 표시
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[iOS Feature Flags]', flags);
    }
  }, [flags]);

  return flags;
}

/**
 * 특정 iOS Feature Flag를 확인하는 유틸리티 함수
 */
export function useIOSFeatureFlag(flagName: keyof IOSFeatureFlags): boolean {
  const flags = useIOSFeatureFlags();
  return flags[flagName];
}

/**
 * Feature Flag 디버그 패널 컴포넌트는 별도 tsx 파일에서 구현
 * hooks/useIOSFeatureFlags.tsx 참조
 */