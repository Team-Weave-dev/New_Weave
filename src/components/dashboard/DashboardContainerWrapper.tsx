'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { DashboardContainer } from './DashboardContainer'
import { IOSStyleDashboard } from './ios-style/IOSStyleDashboard'
import { Loader2 } from 'lucide-react'

interface DashboardContainerWrapperProps {
  className?: string
  showToolbar?: boolean
  initialLayoutId?: string
}

export function DashboardContainerWrapper(props: DashboardContainerWrapperProps) {
  // iOS 스타일을 기본값으로 설정
  const [useIOSStyle, setUseIOSStyle] = useState(true);

  // Feature flag 체크 (개발 환경에서 일반 대시보드로 전환 가능)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const disableIOS = urlParams.get('ios') === 'false';
      
      console.log('[DashboardContainerWrapper] URL params:', window.location.search);
      console.log('[DashboardContainerWrapper] disableIOS from URL:', disableIOS);
      
      // 개발 환경에서는 URL 파라미터로 일반 대시보드로 전환 가능
      if (process.env.NODE_ENV === 'development') {
        const savedPreference = localStorage.getItem('weave-ios-style');
        console.log('[DashboardContainerWrapper] savedPreference:', savedPreference);
        
        // 기본값은 true (iOS 스타일), false로 명시한 경우만 일반 대시보드 사용
        const shouldUseIOS = !disableIOS && savedPreference !== 'false';
        console.log('[DashboardContainerWrapper] shouldUseIOS:', shouldUseIOS);
        
        setUseIOSStyle(shouldUseIOS);
        
        // URL 파라미터가 있으면 localStorage에 저장
        if (disableIOS) {
          localStorage.setItem('weave-ios-style', 'false');
        } else if (urlParams.get('ios') === 'true') {
          localStorage.setItem('weave-ios-style', 'true');
        }
      }
    }
  }, []);

  // 개발 환경에서 iOS 스타일 토글 함수 (콘솔에서 사용 가능)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).toggleIOSStyle = () => {
        const newValue = !useIOSStyle;
        setUseIOSStyle(newValue);
        localStorage.setItem('weave-ios-style', newValue.toString());
        console.log(`iOS 스타일: ${newValue ? '활성화' : '비활성화'}`);
        console.log(`일반 대시보드로 전환하려면 URL에 ?ios=false 추가 또는 toggleIOSStyle() 실행`);
      };
      
      // 개발자 콘솔에 안내 메시지 출력
      console.log('%c🎨 iOS 스타일 대시보드가 기본으로 활성화되었습니다', 'color: #007AFF; font-weight: bold');
      console.log('일반 대시보드로 전환: ?ios=false 또는 콘솔에서 toggleIOSStyle() 실행');
    }
  }, [useIOSStyle]);

  console.log('[DashboardContainerWrapper] Rendering with useIOSStyle:', useIOSStyle);
  
  if (useIOSStyle) {
    console.log('[DashboardContainerWrapper] Rendering IOSStyleDashboard');
    return (
      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-secondary)]" />
          </div>
        }
      >
        <IOSStyleDashboard enableFeatureFlag={true} />
      </Suspense>
    );
  }

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-secondary)]" />
        </div>
      }
    >
      <DashboardContainer {...props} />
    </Suspense>
  )
}