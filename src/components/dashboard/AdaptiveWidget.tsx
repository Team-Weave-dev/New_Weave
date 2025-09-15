'use client'

import React, { Suspense } from 'react'
import { useResponsiveGrid } from '@/lib/dashboard/responsive-grid'
import { MobileWidgetView, MobileMiniWidget } from './MobileWidgetView'
import { WidgetSkeleton } from './WidgetSkeleton'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'
import { normalizeWidgetType } from '@/lib/dashboard/widgetTypeMapping'
import { WidgetRegistry } from '@/lib/dashboard/WidgetRegistry'
import type { Widget } from '@/types/dashboard'

interface AdaptiveWidgetProps {
  widget: Widget
  isEditMode: boolean
}

/**
 * 디바이스에 따라 적응형으로 위젯을 렌더링
 */
export function AdaptiveWidget({ widget, isEditMode }: AdaptiveWidgetProps) {
  const { deviceType } = useResponsiveGrid()
  
  // 위젯 컴포넌트 가져오기
  const normalizedType = normalizeWidgetType(widget.type)
  const WidgetComponent = WidgetRegistry.getComponent(normalizedType as any)
  const metadata = WidgetRegistry.getMetadata(normalizedType as any)
  
  if (!WidgetComponent) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-500">위젯을 찾을 수 없습니다: {widget.type}</p>
      </div>
    )
  }

  const widgetProps = {
    id: widget.id,
    type: widget.type as any, // WidgetType으로 캐스팅
    config: widget.config,
    isEditMode: isEditMode
  }

  // 모바일 컴팩트 컨텐츠 생성
  const getCompactContent = () => {
    switch (normalizedType) {
      case 'project-summary':
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">진행중</span>
            <span className="text-lg font-semibold">5개</span>
          </div>
        )
      
      case 'tax-deadline':
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">다음 마감</span>
            <span className="text-sm font-medium text-red-500">3일 후</span>
          </div>
        )
      
      case 'revenue-chart':
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">이번달</span>
            <span className="text-lg font-semibold">₩45.2M</span>
          </div>
        )
      
      case 'task-tracker':
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">미완료</span>
            <span className="text-lg font-semibold">12개</span>
          </div>
        )
      
      case 'kpi-metrics':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-500">성장률</span>
              <div className="text-sm font-semibold text-green-500">+15%</div>
            </div>
            <div>
              <span className="text-xs text-gray-500">달성률</span>
              <div className="text-sm font-semibold">87%</div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  // 모바일 뷰
  if (deviceType === 'mobile') {
    // 특정 위젯은 미니 위젯으로 표시
    const miniWidgetTypes = ['kpi-metrics', 'task-tracker']
    
    if (miniWidgetTypes.includes(normalizedType)) {
      return (
        <MobileMiniWidget
          title={metadata?.name || widget.type}
          value={widget.config?.value || '0'}
          icon={metadata?.icon ? <span>{metadata.icon}</span> : undefined}
          trend={widget.config?.trend}
        />
      )
    }
    
    // 나머지는 확장/축소 가능한 위젯으로 표시
    return (
      <MobileWidgetView
        widgetId={widget.id}
        title={metadata?.name || widget.type}
        icon={metadata?.icon ? <span>{metadata.icon}</span> : undefined}
        compactContent={getCompactContent()}
      >
        <WidgetErrorBoundary widgetId={widget.id} widgetType={widget.type}>
          <Suspense fallback={<WidgetSkeleton />}>
            <WidgetComponent {...widgetProps} />
          </Suspense>
        </WidgetErrorBoundary>
      </MobileWidgetView>
    )
  }

  // 태블릿/데스크톱 뷰 (기존 위젯 렌더링)
  return (
    <WidgetErrorBoundary widgetId={widget.id} widgetType={widget.type}>
      <Suspense fallback={<WidgetSkeleton />}>
        <WidgetComponent {...widgetProps} />
      </Suspense>
    </WidgetErrorBoundary>
  )
}

/**
 * 모바일 대시보드 레이아웃
 * 카드 스택 형태로 위젯 표시
 */
interface MobileDashboardLayoutProps {
  widgets: Widget[]
  isEditMode: boolean
}

export function MobileDashboardLayout({ widgets, isEditMode }: MobileDashboardLayoutProps) {
  // 위젯을 카테고리별로 그룹화
  const groupedWidgets = widgets.reduce((acc, widget) => {
    const normalizedType = normalizeWidgetType(widget.type)
    const metadata = WidgetRegistry.getMetadata(normalizedType as any)
    const category = metadata?.category || 'other'
    
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(widget)
    
    return acc
  }, {} as Record<string, Widget[]>)

  return (
    <div className="p-4 space-y-6">
      {/* 프로젝트 섹션 */}
      {groupedWidgets.project && (
        <div>
          <h2 className="text-lg font-semibold mb-3">프로젝트</h2>
          <div className="space-y-3">
            {groupedWidgets.project.map(widget => (
              <AdaptiveWidget key={widget.id} widget={widget} isEditMode={isEditMode} />
            ))}
          </div>
        </div>
      )}

      {/* 세무 섹션 */}
      {groupedWidgets.tax && (
        <div>
          <h2 className="text-lg font-semibold mb-3">세무</h2>
          <div className="space-y-3">
            {groupedWidgets.tax.map(widget => (
              <AdaptiveWidget key={widget.id} widget={widget} isEditMode={isEditMode} />
            ))}
          </div>
        </div>
      )}

      {/* 분석 섹션 */}
      {groupedWidgets.analytics && (
        <div>
          <h2 className="text-lg font-semibold mb-3">분석</h2>
          <div className="grid grid-cols-2 gap-3">
            {groupedWidgets.analytics.map(widget => (
              <AdaptiveWidget key={widget.id} widget={widget} isEditMode={isEditMode} />
            ))}
          </div>
        </div>
      )}

      {/* 생산성 섹션 */}
      {groupedWidgets.productivity && (
        <div>
          <h2 className="text-lg font-semibold mb-3">생산성</h2>
          <div className="space-y-3">
            {groupedWidgets.productivity.map(widget => (
              <AdaptiveWidget key={widget.id} widget={widget} isEditMode={isEditMode} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}