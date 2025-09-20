'use client'

import React, { Suspense, useEffect } from 'react'
import { IOSStyleDashboardFixed } from './ios-style/IOSStyleDashboardFixed'
import { Loader2 } from 'lucide-react'
import { FeatureFlagDebugPanel } from '@/hooks/useFeatureFlag'

interface DashboardContainerWrapperProps {
  className?: string
  showToolbar?: boolean
  initialLayoutId?: string
}

export function DashboardContainerWrapper(props: DashboardContainerWrapperProps) {
  // iOS 대시보드 시스템 기본 활성화 알림
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('%c✅ iOS 대시보드 시스템 활성화', 'color: #007AFF; font-weight: bold');
      console.log('📝 기존 대시보드 시스템은 비활성화되었습니다.');
      console.log('🎯 기존 위젯들은 추후 iOS 스타일로 재디자인되어 적용될 예정입니다.');
    }
  }, []);
  
  return (
    <>
      {/* 개발 환경에서 Feature Flag 디버그 패널 표시 */}
      {process.env.NODE_ENV === 'development' && <FeatureFlagDebugPanel />}
      
      {/* iOS 대시보드만 렌더링 */}
      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-secondary)]" />
          </div>
        }
      >
        <IOSStyleDashboardFixed />
      </Suspense>
    </>
  )
}