'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface WidgetSkeletonProps {
  className?: string
  height?: string
}

export function WidgetSkeleton({ className, height = 'h-full' }: WidgetSkeletonProps) {
  return (
    <div 
      className={cn(
        'animate-pulse bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        height,
        className
      )}
    >
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="flex gap-2">
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* 콘텐츠 스켈레톤 */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        
        {/* 차트/그래프 영역 스켈레톤 */}
        <div className="mt-4 h-32 bg-gray-100 dark:bg-gray-700/50 rounded-md"></div>
        
        {/* 버튼/액션 영역 스켈레톤 */}
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  )
}

// 작은 위젯용 스켈레톤
export function SmallWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        'animate-pulse bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3',
        className
      )}
    >
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  )
}

// 리스트 위젯용 스켈레톤
export function ListWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        'animate-pulse bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        className
      )}
    >
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 차트 위젯용 스켈레톤
export function ChartWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        'animate-pulse bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        className
      )}
    >
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
      <div className="h-48 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-md relative">
        {/* 차트 막대 시뮬레이션 */}
        <div className="absolute bottom-0 left-4 w-8 h-1/3 bg-gray-300 dark:bg-gray-600 rounded-t"></div>
        <div className="absolute bottom-0 left-16 w-8 h-1/2 bg-gray-300 dark:bg-gray-600 rounded-t"></div>
        <div className="absolute bottom-0 left-28 w-8 h-2/3 bg-gray-300 dark:bg-gray-600 rounded-t"></div>
        <div className="absolute bottom-0 left-40 w-8 h-1/4 bg-gray-300 dark:bg-gray-600 rounded-t"></div>
      </div>
    </div>
  )
}