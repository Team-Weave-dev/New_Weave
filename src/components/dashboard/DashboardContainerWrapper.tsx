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
  const [useIOSStyle, setUseIOSStyle] = useState(false);

  // Feature flag 체크 (개발 환경에서는 URL 파라미터로 제어)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const enableIOS = urlParams.get('ios') === 'true';
      
      // 개발 환경에서는 URL 파라미터 또는 localStorage로 제어
      if (process.env.NODE_ENV === 'development') {
        const savedPreference = localStorage.getItem('weave-ios-style');
        setUseIOSStyle(enableIOS || savedPreference === 'true');
        
        // URL 파라미터가 있으면 localStorage에 저장
        if (enableIOS) {
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
      };
    }
  }, [useIOSStyle]);

  if (useIOSStyle) {
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