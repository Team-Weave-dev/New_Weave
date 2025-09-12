'use client'

import React, { useState, useMemo } from 'react'
import { X, Search, Plus, Grid3x3, Briefcase, Calculator, TrendingUp, CheckSquare, Package } from 'lucide-react'
import { Card } from '@/components/ui/Card'
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

// 임시 위젯 데이터 (실제 위젯이 구현되면 레지스트리에서 가져옴)
const mockWidgets = [
  {
    type: 'project-summary' as WidgetType,
    metadata: {
      name: '프로젝트 요약',
      description: '진행 중인 프로젝트 현황을 한눈에 확인',
      icon: 'folder',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 1, height: 1 },
      maxSize: { width: 4, height: 4 },
      tags: ['프로젝트', '요약', '현황']
    },
    category: 'project' as WidgetCategory
  },
  {
    type: 'tax-deadline' as WidgetType,
    metadata: {
      name: '세무 캘린더',
      description: '세무 관련 마감일과 일정을 표시',
      icon: 'calendar',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 2 },
      maxSize: { width: 4, height: 4 },
      tags: ['세무', '캘린더', '마감일']
    },
    category: 'tax' as WidgetCategory
  },
  {
    type: 'revenue-chart' as WidgetType,
    metadata: {
      name: '수익 차트',
      description: '월별/분기별 수익을 차트로 표시',
      icon: 'chart',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 2, height: 1 },
      maxSize: { width: 4, height: 3 },
      tags: ['수익', '차트', '분석']
    },
    category: 'analytics' as WidgetCategory
  },
  {
    type: 'task-tracker' as WidgetType,
    metadata: {
      name: '작업 추적기',
      description: '프로젝트별 작업을 추적하고 관리',
      icon: 'tasks',
      defaultSize: { width: 2, height: 3 },
      minSize: { width: 1, height: 2 },
      maxSize: { width: 3, height: 4 },
      tags: ['작업', '할일', '추적']
    },
    category: 'productivity' as WidgetCategory
  },
  {
    type: 'kpi-metrics' as WidgetType,
    metadata: {
      name: 'KPI 메트릭',
      description: '핵심 성과 지표를 한눈에 확인',
      icon: 'gauge',
      defaultSize: { width: 3, height: 1 },
      minSize: { width: 2, height: 1 },
      maxSize: { width: 4, height: 2 },
      tags: ['KPI', '지표', '성과']
    },
    category: 'analytics' as WidgetCategory
  },
  {
    type: 'tax-calculator' as WidgetType,
    metadata: {
      name: '세금 계산기',
      description: '부가세, 소득세 등을 간편하게 계산',
      icon: 'calculator',
      defaultSize: { width: 2, height: 2 },
      minSize: { width: 1, height: 1 },
      maxSize: { width: 3, height: 3 },
      tags: ['세금', '계산기', '부가세']
    },
    category: 'tax' as WidgetCategory
  }
]

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  isOpen,
  onClose,
  onAddWidget
}) => {
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { currentLayout } = useDashboardStore()
  const currentWidgets = currentLayout?.widgets || []

  // 카테고리별 위젯 필터링
  const filteredWidgets = useMemo(() => {
    let widgets = mockWidgets

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      widgets = widgets.filter(w => w.category === selectedCategory)
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      widgets = widgets.filter(w => {
        return (
          w.metadata.name.toLowerCase().includes(query) ||
          w.metadata.description.toLowerCase().includes(query) ||
          w.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
        )
      })
    }

    return widgets
  }, [selectedCategory, searchQuery])

  // 위젯이 이미 대시보드에 있는지 확인
  const isWidgetAdded = (type: WidgetType) => {
    return currentWidgets.some(w => w.type === type)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-bg-primary border-l border-border-primary shadow-xl z-50 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-txt-secondary" />
          <h3 className="text-lg font-semibold">위젯 라이브러리</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <X className="w-5 h-5" />
        </button>
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
            className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          />
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex items-center gap-2 p-4 border-b border-border-primary overflow-x-auto">
        <button
          className={cn(
            "px-3 py-1 rounded text-sm font-medium transition-colors",
            selectedCategory === 'all' 
              ? "bg-blue-500 text-white" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
          onClick={() => setSelectedCategory('all')}
        >
          전체
        </button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            className={cn(
              "px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1",
              selectedCategory === key 
                ? "bg-blue-500 text-white" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            onClick={() => setSelectedCategory(key as WidgetCategory)}
          >
            {categoryIcons[key as WidgetCategory]}
            {label}
          </button>
        ))}
      </div>

      {/* 위젯 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredWidgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="w-12 h-12 text-txt-tertiary mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? '검색 결과가 없습니다' : '이 카테고리에 위젯이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWidgets.map((widget) => (
              <WidgetCard
                key={widget.type}
                type={widget.type}
                metadata={widget.metadata}
                category={widget.category}
                isAdded={isWidgetAdded(widget.type)}
                onAdd={() => onAddWidget(widget.type, widget.metadata)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="p-4 border-t border-border-primary bg-bg-secondary">
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
          위젯을 드래그하거나 + 버튼을 클릭하여 추가하세요
        </p>
      </div>
    </div>
  )
}

// 위젯 카드 컴포넌트
interface WidgetCardProps {
  type: WidgetType
  metadata: WidgetMetadata
  category: WidgetCategory
  isAdded: boolean
  onAdd: () => void
}

const WidgetCard: React.FC<WidgetCardProps> = ({
  type,
  metadata,
  category,
  isAdded,
  onAdd
}) => {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all",
        "hover:shadow-md hover:border-border-hover",
        isAdded && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {categoryIcons[category]}
            <h4 className="text-sm font-medium">
              {metadata.name}
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {metadata.description}
          </p>
          {metadata.tags && (
            <div className="flex flex-wrap gap-1">
              {metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-bg-tertiary text-txt-secondary rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onAdd}
          disabled={isAdded}
          className={cn(
            "ml-4 px-3 py-1 rounded text-sm font-medium transition-colors",
            isAdded 
              ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50" 
              : "bg-blue-500 text-white hover:bg-blue-600"
          )}
        >
          {isAdded ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* 크기 정보 */}
      <div className="mt-3 pt-3 border-t border-border-primary flex items-center gap-4 text-xs text-txt-tertiary">
        <span>기본 크기: {metadata.defaultSize.width}×{metadata.defaultSize.height}</span>
        {metadata.minSize && (
          <span>최소: {metadata.minSize.width}×{metadata.minSize.height}</span>
        )}
        {metadata.maxSize && (
          <span>최대: {metadata.maxSize.width}×{metadata.maxSize.height}</span>
        )}
      </div>
    </Card>
  )
}

export default WidgetLibrary