'use client'

import React, { useState } from 'react'
import { 
  Briefcase, 
  Calculator, 
  BarChart3, 
  CheckSquare, 
  Grid3x3,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSwipeGesture } from '@/hooks/useTouchInteraction'
import { AdaptiveWidget } from './AdaptiveWidget'
import type { Widget, WidgetCategory } from '@/types/dashboard'
import { WidgetRegistry } from '@/lib/dashboard/WidgetRegistry'
import { normalizeWidgetType } from '@/lib/dashboard/widgetTypeMapping'

interface MobileDashboardTabsProps {
  widgets: Widget[]
  isEditMode: boolean
  className?: string
}

interface TabConfig {
  id: WidgetCategory | 'all'
  label: string
  icon: React.ReactNode
  color: string
}

/**
 * 모바일 대시보드 탭 네비게이션
 * 위젯을 카테고리별로 구분하여 탭으로 표시
 */
export function MobileDashboardTabs({
  widgets,
  isEditMode,
  className
}: MobileDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<WidgetCategory | 'all'>('all')

  // 탭 설정
  const tabs: TabConfig[] = [
    {
      id: 'all',
      label: '전체',
      icon: <Home className="h-4 w-4" />,
      color: 'text-gray-600'
    },
    {
      id: 'project',
      label: '프로젝트',
      icon: <Briefcase className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      id: 'tax',
      label: '세무',
      icon: <Calculator className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      id: 'analytics',
      label: '분석',
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      id: 'productivity',
      label: '생산성',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'text-orange-600'
    },
    {
      id: 'custom',
      label: '사용자',
      icon: <Grid3x3 className="h-4 w-4" />,
      color: 'text-pink-600'
    }
  ]

  // 위젯 필터링
  const filteredWidgets = widgets.filter(widget => {
    if (activeTab === 'all') return true
    
    const normalizedType = normalizeWidgetType(widget.type)
    const metadata = WidgetRegistry.getMetadata(normalizedType as any)
    return metadata?.category === activeTab
  })

  // 스와이프로 탭 전환
  const currentIndex = tabs.findIndex(t => t.id === activeTab)
  
  const swipeHandlers = useSwipeGesture(
    () => {
      // 왼쪽 스와이프: 다음 탭
      const nextIndex = Math.min(currentIndex + 1, tabs.length - 1)
      setActiveTab(tabs[nextIndex].id)
    },
    () => {
      // 오른쪽 스와이프: 이전 탭
      const prevIndex = Math.max(currentIndex - 1, 0)
      setActiveTab(tabs[prevIndex].id)
    }
  )

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 탭 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const widgetCount = tab.id === 'all' 
              ? widgets.length
              : widgets.filter(w => {
                  const type = normalizeWidgetType(w.type)
                  const meta = WidgetRegistry.getMetadata(type as any)
                  return meta?.category === tab.id
                }).length

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 min-w-fit whitespace-nowrap',
                  'border-b-2 transition-all relative',
                  isActive
                    ? `border-blue-500 ${tab.color} bg-blue-50/50`
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <span className={cn(
                  'transition-transform',
                  isActive && 'scale-110'
                )}>
                  {tab.icon}
                </span>
                <span className="text-sm font-medium">
                  {tab.label}
                </span>
                {widgetCount > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    isActive 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  )}>
                    {widgetCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 탭 인디케이터 */}
        <div className="h-0.5 bg-gray-100 relative">
          <div
            className="absolute top-0 h-full bg-blue-500 transition-all duration-300"
            style={{
              left: `${(currentIndex / tabs.length) * 100}%`,
              width: `${100 / tabs.length}%`
            }}
          />
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3"
        {...swipeHandlers}
      >
        {filteredWidgets.length > 0 ? (
          <>
            {/* 카테고리 헤더 (전체 탭이 아닐 때만) */}
            {activeTab !== 'all' && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {tabs.find(t => t.id === activeTab)?.label} 위젯
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredWidgets.length}개의 위젯
                </p>
              </div>
            )}

            {/* 위젯 목록 */}
            <div className="space-y-3">
              {filteredWidgets.map(widget => (
                <AdaptiveWidget
                  key={widget.id}
                  widget={widget}
                  isEditMode={isEditMode}
                />
              ))}
            </div>
          </>
        ) : (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-4xl mb-4 opacity-20">
              {tabs.find(t => t.id === activeTab)?.icon}
            </div>
            <p className="text-gray-500 text-center">
              {activeTab === 'all' 
                ? '위젯이 없습니다'
                : `${tabs.find(t => t.id === activeTab)?.label} 카테고리에 위젯이 없습니다`}
            </p>
            {isEditMode && (
              <button className="mt-4 text-blue-500 text-sm">
                위젯 추가하기
              </button>
            )}
          </div>
        )}
      </div>

      {/* 하단 탭 바 (선택적) */}
      <div className="bg-white border-t border-gray-200 safe-area-bottom lg:hidden">
        <div className="flex justify-around py-2">
          {tabs.slice(0, 5).map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2',
                  'transition-colors',
                  isActive ? tab.color : 'text-gray-400'
                )}
              >
                {tab.icon}
                <span className="text-xs">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * 탭 배지 컴포넌트
 */
interface TabBadgeProps {
  count: number
  active?: boolean
}

function TabBadge({ count, active }: TabBadgeProps) {
  if (count === 0) return null
  
  return (
    <span className={cn(
      'absolute -top-1 -right-1 text-xs w-5 h-5',
      'flex items-center justify-center rounded-full',
      active 
        ? 'bg-blue-500 text-white' 
        : 'bg-gray-300 text-gray-700'
    )}>
      {count > 9 ? '9+' : count}
    </span>
  )
}