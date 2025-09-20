'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { DashboardContainer } from './DashboardContainer'
// import { IOSStyleDashboard } from './ios-style/IOSStyleDashboard' // 임시 비활성화 (무한 루프 디버깅)
// import { IOSStyleDashboardMinimal } from './ios-style/IOSStyleDashboardMinimal' // 임시 최소 버전
import { IOSStyleDashboardFixed } from './ios-style/IOSStyleDashboardFixed' // 수정된 버전
import { Loader2 } from 'lucide-react'
import { useIOSFeatureFlags, FeatureFlagDebugPanel } from '@/hooks/useFeatureFlag'
import { IOSFeatureFlags } from '@/lib/features/types'

interface DashboardContainerWrapperProps {
  className?: string
  showToolbar?: boolean
  initialLayoutId?: string
}

export function DashboardContainerWrapper(props: DashboardContainerWrapperProps) {
  // Feature Flag 시스템 사용
  const { features, loading } = useIOSFeatureFlags();
  const [useIOSStyle, setUseIOSStyle] = useState(false);
  const [overrideFlag, setOverrideFlag] = useState<boolean | null>(null);

  // Feature Flag 및 개발 환경 오버라이드 처리
  useEffect(() => {
    if (loading) return;
    
    // Feature Flag 기반 활성화
    let shouldUseIOS = features.dashboard;
    
    // 개발 환경에서 URL 파라미터 및 localStorage 오버라이드 지원
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const iosParam = urlParams.get('ios');
      
      if (process.env.NODE_ENV === 'development') {
        // URL 파라미터 우선
        if (iosParam === 'true') {
          shouldUseIOS = true;
          setOverrideFlag(true);
          localStorage.setItem('weave-ios-override', 'true');
        } else if (iosParam === 'false') {
          shouldUseIOS = false;
          setOverrideFlag(false);
          localStorage.setItem('weave-ios-override', 'false');
        } else {
          // localStorage 오버라이드 체크
          const savedOverride = localStorage.getItem('weave-ios-override');
          if (savedOverride === 'true') {
            shouldUseIOS = true;
            setOverrideFlag(true);
          } else if (savedOverride === 'false') {
            shouldUseIOS = false;
            setOverrideFlag(false);
          }
        }
        
        console.log('[DashboardContainerWrapper] Feature Flag:', features.dashboard);
        console.log('[DashboardContainerWrapper] Override:', overrideFlag);
        console.log('[DashboardContainerWrapper] Final Decision:', shouldUseIOS);
      }
    }
    
    setUseIOSStyle(shouldUseIOS);
  }, [features.dashboard, loading]); // overrideFlag 의존성 제거 (무한 루프 방지)

  // 개발 환경에서 iOS 스타일 토글 함수 (콘솔에서 사용 가능)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !loading) {
      (window as any).toggleIOSStyle = () => {
        const newValue = !useIOSStyle;
        const newOverride = newValue ? true : false;
        setOverrideFlag(newOverride);
        localStorage.setItem('weave-ios-override', newOverride.toString());
        console.log(`iOS 스타일 오버라이드: ${newOverride ? '활성화' : '비활성화'}`);
        console.log(`Feature Flag 상태: ${features.dashboard ? '활성' : '비활성'}`);
        window.location.reload(); // 새로운 설정 적용을 위해 리로드
      };

      (window as any).clearIOSOverride = () => {
        localStorage.removeItem('weave-ios-override');
        setOverrideFlag(null);
        console.log('iOS 스타일 오버라이드 제거 - Feature Flag 설정 사용');
        window.location.reload();
      };
      
      // 개발자 콘솔에 안내 메시지 출력
      const statusEmoji = useIOSStyle ? '✅' : '❌';
      const flagEmoji = features.dashboard ? '🚩' : '🏳️';
      const overrideEmoji = overrideFlag !== null ? '🔧' : '🔨';
      
      console.log(`%c${statusEmoji} iOS 스타일 대시보드: ${useIOSStyle ? '활성' : '비활성'}`, 'color: #007AFF; font-weight: bold');
      console.log(`${flagEmoji} Feature Flag: ${features.dashboard ? '활성' : '비활성'}`);
      console.log(`${overrideEmoji} Override: ${overrideFlag !== null ? overrideFlag : '없음'}`);
      console.log('📝 가용 명령어:');
      console.log('  - toggleIOSStyle(): iOS 스타일 토글');
      console.log('  - clearIOSOverride(): 오버라이드 제거 (Feature Flag 사용)');
      console.log('  - URL 파라미터: ?ios=true 또는 ?ios=false');
    }
  }, [useIOSStyle, features.dashboard, loading]); // overrideFlag 의존성 제거

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-secondary)]" />
      </div>
    );
  }
  
  return (
    <>
      {/* 개발 환경에서 Feature Flag 디버그 패널 표시 */}
      {process.env.NODE_ENV === 'development' && <FeatureFlagDebugPanel />}
      
      {useIOSStyle ? (
        <Suspense 
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-secondary)]" />
            </div>
          }
        >
          <IOSStyleDashboardFixed />
        </Suspense>
      ) : (
        <Suspense 
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-secondary)]" />
            </div>
          }
        >
          <DashboardContainer {...props} />
        </Suspense>
      )}
    </>
  )
}