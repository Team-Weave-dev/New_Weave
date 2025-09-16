'use client'

import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react'
import { X, Search, Plus, Grid3x3, Briefcase, Calculator, TrendingUp, CheckSquare, Package, Folder, Calendar, BarChart3, Box, Eye, EyeOff, Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { WidgetRegistry } from '@/lib/dashboard/WidgetRegistry'
import type { WidgetCategory, WidgetMetadata, WidgetType } from '@/types/dashboard'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'

interface WidgetLibraryProps {
  isOpen: boolean
  onClose: () => void
  onAddWidget: (type: WidgetType, metadata: WidgetMetadata) => void
}

// 카테고리 아이콘 매핑
const categoryIcons: Record<WidgetCategory, React.ReactNode> = {
  project: <Briefcase className="w-4 h-4" />,
  tax: <Calculator className="w-4 h-4" />,
  analytics: <TrendingUp className="w-4 h-4" />,
  productivity: <CheckSquare className="w-4 h-4" />,
  custom: <Package className="w-4 h-4" />
}

// 카테고리 레이블
const categoryLabels: Record<WidgetCategory, string> = {
  project: '프로젝트',
  tax: '세무',
  analytics: '분석',
  productivity: '생산성',
  custom: '커스텀'
}

// 위젯 아이콘 매핑
const widgetIcons: Record<string, React.ReactNode> = {
  folder: <Folder className="w-8 h-8" />,
  calendar: <Calendar className="w-8 h-8" />,
  chart: <TrendingUp className="w-8 h-8" />,
  'chart-bar': <BarChart3 className="w-8 h-8" />,
  tasks: <CheckSquare className="w-8 h-8" />,
  calculator: <Calculator className="w-8 h-8" />,
  box: <Box className="w-8 h-8" />
}

export function WidgetLibrary({ isOpen, onClose, onAddWidget }: WidgetLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewWidget, setPreviewWidget] = useState<WidgetType | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [availableWidgets, setAvailableWidgets] = useState<Array<{
    type: WidgetType
    metadata: WidgetMetadata
    category: WidgetCategory
  }>>([])

  // WidgetRegistry에서 위젯 데이터 가져오기
  useEffect(() => {
    const loadWidgets = () => {
      const widgets: typeof availableWidgets = []
      
      // 모든 카테고리 순회
      const categories = WidgetRegistry.getCategories()
      categories.forEach(category => {
        const categoryWidgets = WidgetRegistry.getWidgetsByCategory(category)
        categoryWidgets.forEach(widget => {
          // WidgetType 찾기 - Registry의 모든 위젯을 순회하여 매칭
          const allStats = WidgetRegistry.getStatistics()
          
          // 간단한 방법: metadata의 name으로 type 추론
          let widgetType: WidgetType = 'custom'
          
          if (widget.metadata.name === '프로젝트 요약') widgetType = 'project-summary'
          else if (widget.metadata.name === '세무 캘린더') widgetType = 'tax-deadline'
          else if (widget.metadata.name === '수익 차트') widgetType = 'revenue-chart'
          else if (widget.metadata.name === '작업 추적기') widgetType = 'task-tracker'
          else if (widget.metadata.name === 'KPI 지표') widgetType = 'kpi-metrics'
          else if (widget.metadata.name === '세금 계산기') widgetType = 'tax-calculator'
          
          widgets.push({
            type: widgetType,
            metadata: widget.metadata,
            category: widget.category
          })
        })
      })
      
      setAvailableWidgets(widgets)
    }
    
    loadWidgets()
  }, [])

  // 필터링된 위젯 목록
  const filteredWidgets = useMemo(() => {
    let widgets = availableWidgets

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      widgets = widgets.filter(w => w.category === selectedCategory)
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      widgets = widgets.filter(w => 
        w.metadata.name.toLowerCase().includes(query) ||
        w.metadata.description.toLowerCase().includes(query) ||
        w.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return widgets
  }, [availableWidgets, selectedCategory, searchQuery])

  // 현재 레이아웃에 이미 있는 위젯 체크
  const currentLayout = useDashboardStore(state => state.currentLayout)
  const isWidgetInLayout = (type: WidgetType) => {
    return currentLayout?.widgets.some(w => w.type === type) || false
  }

  if (!isOpen) return null

  // 동적 위젯 로드 (미리보기용)
  const loadPreviewWidget = (type: WidgetType) => {
    const Component = WidgetRegistry.getComponent(type)
    return Component
  }

  return (
    <div className="fixed inset-0 lg:inset-y-0 lg:right-0 lg:left-auto lg:w-96 bg-bg-primary lg:border-l border-border-primary shadow-xl z-50 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-txt-secondary" />
          <Typography variant="h3" className="text-lg font-semibold">
            위젯 라이브러리
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 hover:bg-gray-100 rounded"
            title={showPreview ? '미리보기 끄기' : '미리보기 보기'}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-gray-100)] dark:hover:bg-[var(--color-gray-800)] rounded h-auto"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="p-4 border-b border-border-primary">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
          <input
            type="text"
            placeholder="위젯 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-[var(--color-gray-300)] dark:border-[var(--color-gray-700)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-500)] dark:bg-[var(--color-gray-800)]"
          />
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex items-center gap-2 p-4 border-b border-border-primary overflow-x-auto">
        <Button
          variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
          size="sm"
          className={cn(
            "px-3 py-1 rounded text-sm font-medium transition-colors",
            selectedCategory === 'all' 
              ? "bg-[var(--color-blue-500)] text-white" 
              : "hover:bg-[var(--color-gray-100)] dark:hover:bg-[var(--color-gray-800)]"
          )}
          onClick={() => setSelectedCategory('all')}
        >
          전체
        </Button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? 'primary' : 'ghost'}
            size="sm"
            className={cn(
              "px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1",
              selectedCategory === key 
                ? "bg-[var(--color-blue-500)] text-white" 
                : "hover:bg-[var(--color-gray-100)] dark:hover:bg-[var(--color-gray-800)]"
            )}
            onClick={() => setSelectedCategory(key as WidgetCategory)}
          >
            {categoryIcons[key as WidgetCategory]}
            {label}
          </Button>
        ))}
      </div>

      {/* 위젯 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredWidgets.length === 0 ? (
          <div className="text-center py-8 text-txt-secondary">
            {searchQuery ? '검색 결과가 없습니다.' : '위젯이 없습니다.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWidgets.map((widget) => {
              const isAdded = isWidgetInLayout(widget.type)
              
              return (
                <Card
                  key={widget.type}
                  className={cn(
                    "p-4 cursor-pointer transition-all relative",
                    isAdded 
                      ? "bg-[var(--color-gray-100)] dark:bg-[var(--color-gray-800)] opacity-60" 
                      : "hover:shadow-lg hover:border-[var(--color-blue-300)] dark:hover:border-[var(--color-blue-700)]",
                    previewWidget === widget.type && showPreview ? "ring-2 ring-blue-500" : ""
                  )}
                  onClick={() => {
                    if (!isAdded) {
                      setPreviewWidget(widget.type)
                    }
                  }}
                  onMouseEnter={() => setPreviewWidget(widget.type)}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[var(--color-gray-100)] dark:bg-[var(--color-gray-800)] rounded-lg">
                      {widgetIcons[widget.metadata.icon || 'box'] || <Box className="w-8 h-8" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <Typography variant="h4" className="font-medium text-txt-primary">
                          {widget.metadata.name}
                        </Typography>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Info className="w-3 h-3" />
                          <span>{widget.metadata.defaultSize.width}×{widget.metadata.defaultSize.height}</span>
                        </div>
                      </div>
                      <Typography variant="body2" className="text-txt-secondary mb-2">
                        {widget.metadata.description}
                      </Typography>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {widget.metadata.tags?.slice(0, 2).map(tag => (
                            <span 
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-[var(--color-gray-200)] dark:bg-[var(--color-gray-700)] rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <Button
                          variant={isAdded ? "ghost" : "primary"}
                          size="sm"
                          className={cn(
                            "min-h-[40px] min-w-[40px] px-3 py-2 text-sm rounded transition-colors flex items-center gap-1",
                            isAdded
                              ? "bg-[var(--color-gray-300)] dark:bg-[var(--color-gray-600)] text-[var(--color-gray-500)] cursor-not-allowed"
                              : "bg-[var(--color-blue-500)] text-white hover:bg-[var(--color-blue-600)]"
                          )}
                          disabled={isAdded}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isAdded) {
                              onAddWidget(widget.type, widget.metadata)
                              onClose()
                            }
                          }}
                        >
                          <Plus className="w-3 h-3" />
                          {isAdded ? '추가됨' : '추가'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="p-4 border-t border-border-primary">
        <div className="text-center text-sm text-txt-secondary mb-2">
          {availableWidgets.length}개 위젯 사용 가능
        </div>
        {showPreview && previewWidget && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-2 font-semibold">미리보기</div>
            <div className="bg-white rounded border border-gray-200 p-2 h-32 overflow-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              }>
                {/* 미리보기 컨텐츠 */}
                <div className="text-xs text-gray-500 text-center">
                  {availableWidgets.find(w => w.type === previewWidget)?.metadata.name}
                </div>
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}