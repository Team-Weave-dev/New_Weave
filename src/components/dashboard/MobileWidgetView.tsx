'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Maximize2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Typography from '@/components/ui/Typography'
import { useSwipeGesture } from '@/hooks/useTouchInteraction'

interface MobileWidgetViewProps {
  widgetId: string
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  isExpanded?: boolean
  onExpand?: () => void
  onCollapse?: () => void
  onSettings?: () => void
  className?: string
  compactContent?: React.ReactNode // 축소 상태에서 보여줄 핵심 정보
}

/**
 * 모바일 전용 위젯 뷰
 * 축소/확장 가능한 카드 형태로 위젯 표시
 */
export function MobileWidgetView({
  widgetId,
  title,
  icon,
  children,
  isExpanded: controlledExpanded,
  onExpand,
  onCollapse,
  onSettings,
  className,
  compactContent
}: MobileWidgetViewProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  const handleToggle = () => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(!internalExpanded)
    }
    
    if (isExpanded) {
      onCollapse?.()
    } else {
      onExpand?.()
    }
  }

  // 스와이프로 확장/축소
  const swipeHandlers = useSwipeGesture(
    undefined,
    undefined,
    () => !isExpanded && handleToggle(), // 위로 스와이프: 확장
    () => isExpanded && handleToggle()    // 아래로 스와이프: 축소
  )

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200',
        'transition-all duration-300 ease-in-out',
        isExpanded ? 'h-auto' : 'h-auto max-h-32',
        className
      )}
      {...swipeHandlers}
    >
      {/* 헤더 */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          {icon && (
            <div className="text-blue-500">
              {icon}
            </div>
          )}
          <Typography variant="h4" className="text-base font-medium">
            {title}
          </Typography>
        </div>
        
        <div className="flex items-center gap-2">
          {onSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSettings()
              }}
              className="p-2"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className={cn(
        'px-4 pb-4 overflow-hidden',
        isExpanded ? 'block' : 'hidden'
      )}>
        {children}
      </div>

      {/* 컴팩트 뷰 (축소 상태) */}
      {!isExpanded && compactContent && (
        <div className="px-4 pb-4 -mt-2">
          {compactContent}
        </div>
      )}
    </div>
  )
}

/**
 * 모바일 위젯 카드 스택
 * 여러 위젯을 카드 형태로 쌓아서 표시
 */
interface MobileWidgetStackProps {
  children: React.ReactNode
  className?: string
}

export function MobileWidgetStack({ children, className }: MobileWidgetStackProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  )
}

/**
 * 모바일 위젯 탭 뷰
 * 위젯을 탭으로 구분하여 표시
 */
interface MobileWidgetTabsProps {
  tabs: Array<{
    id: string
    label: string
    icon?: React.ReactNode
    content: React.ReactNode
  }>
  defaultTab?: string
  className?: string
}

export function MobileWidgetTabs({ tabs, defaultTab, className }: MobileWidgetTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  
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
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* 탭 헤더 */}
      <div className="flex overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 min-w-fit whitespace-nowrap',
              'border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.icon && <span className="text-lg">{tab.icon}</span>}
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-4" {...swipeHandlers}>
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  )
}

/**
 * 모바일 위젯 그리드
 * 작은 위젯들을 2x2 그리드로 표시
 */
interface MobileWidgetGridProps {
  children: React.ReactNode
  columns?: 2 | 3
  className?: string
}

export function MobileWidgetGrid({ 
  children, 
  columns = 2, 
  className 
}: MobileWidgetGridProps) {
  return (
    <div className={cn(
      'grid gap-3',
      columns === 2 ? 'grid-cols-2' : 'grid-cols-3',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * 모바일 미니 위젯
 * 작은 정보 카드 형태의 위젯
 */
interface MobileMiniWidgetProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  onClick?: () => void
  className?: string
}

export function MobileMiniWidget({
  title,
  value,
  icon,
  trend,
  onClick,
  className
}: MobileMiniWidgetProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg p-3 shadow-sm border border-gray-200',
        'hover:shadow-md transition-shadow',
        'text-left w-full',
        className
      )}
    >
      <div className="flex items-start justify-between mb-2">
        {icon && (
          <div className="text-blue-500 text-xl">
            {icon}
          </div>
        )}
        {trend && (
          <div className={cn(
            'text-xs font-medium',
            trend === 'up' ? 'text-green-500' : 
            trend === 'down' ? 'text-red-500' : 
            'text-gray-500'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="text-xs text-gray-500">
          {title}
        </div>
        <div className="text-lg font-semibold text-gray-900">
          {value}
        </div>
      </div>
    </button>
  )
}