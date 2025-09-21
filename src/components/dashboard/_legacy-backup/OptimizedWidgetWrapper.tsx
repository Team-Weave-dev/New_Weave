'use client'

import React, { memo } from 'react'
import { WidgetWrapper } from './WidgetWrapper'
import type { WidgetProps } from '@/types/dashboard'

/**
 * 최적화된 위젯 래퍼 컴포넌트
 * React.memo를 사용하여 불필요한 리렌더링 방지
 */
export const OptimizedWidgetWrapper = memo(WidgetWrapper, (prevProps, nextProps) => {
  // 다음 조건이 모두 같으면 리렌더링 스킵
  return (
    prevProps.id === nextProps.id &&
    prevProps.type === nextProps.type &&
    prevProps.title === nextProps.title &&
    prevProps.locked === nextProps.locked &&
    JSON.stringify(prevProps.position) === JSON.stringify(nextProps.position) &&
    prevProps.children === nextProps.children
  )
})

OptimizedWidgetWrapper.displayName = 'OptimizedWidgetWrapper'