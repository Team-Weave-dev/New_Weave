'use client'

import React, { useEffect, useState } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { GridLayout, GridItem } from './GridLayout'
import { WidgetWrapper } from './WidgetWrapper'
import { EditModeToolbar } from './EditModeToolbar'
import { DndProvider } from './dnd/DndProvider'
import { SortableWidget } from './dnd/SortableWidget'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useDashboardKeyboardNavigation } from '@/hooks/useDashboardKeyboardNavigation'
import {
  ProjectSummaryWidget,
  RevenueChartWidget,
  TodoListWidget,
  CalendarWidget,
  RecentActivityWidget,
} from './widgets'

interface DashboardContainerProps {
  className?: string
  showToolbar?: boolean
  initialLayoutId?: string
}

export function DashboardContainer({
  className,
  showToolbar = true,
  initialLayoutId,
}: DashboardContainerProps) {
  const {
    currentLayout,
    layouts,
    isEditMode,
    setCurrentLayout,
    createLayout,
    loadFromLocalStorage,
  } = useDashboardStore()

  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // 키보드 네비게이션 훅 사용
  useDashboardKeyboardNavigation()

  // 초기 레이아웃 로드
  useEffect(() => {
    const initializeLayout = async () => {
      setIsLoading(true)
      
      try {
        // localStorage에서 저장된 레이아웃 로드
        loadFromLocalStorage()
        
        // 로드 후에도 레이아웃이 없거나 위젯이 없으면 처리하지 않음
        // (page.tsx에서 처리)
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!isInitialized) {
      initializeLayout()
    }
  }, [isInitialized, loadFromLocalStorage])

  // 위젯 타입에 따른 컴포넌트 렌더링
  const renderWidgetContent = (widget: any) => {
    switch (widget.type) {
      case '프로젝트 요약':
        return <ProjectSummaryWidget />
      case '매출 차트':
        return <RevenueChartWidget />
      case '할 일 목록':
        return <TodoListWidget />
      case '캘린더':
        return <CalendarWidget />
      case '최근 활동':
        return <RecentActivityWidget />
      default:
        // 기본 위젯 (임시)
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">
              {widget.type}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              위젯 ID: {widget.id}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              위치: {widget.position.x}, {widget.position.y}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              크기: {widget.position.width}x{widget.position.height}
            </p>
          </div>
        )
    }
  }

  // 위젯 추가 핸들러 (임시 - 추후 위젯 라이브러리로 대체)
  const handleAddWidget = () => {
    console.log('위젯 추가 모달 열기')
    // TODO: 위젯 라이브러리 모달 구현
  }

  // 레이아웃 저장 핸들러
  const handleSaveLayout = async () => {
    console.log('레이아웃 저장')
    // TODO: Supabase에 저장 구현
  }

  // 취소 핸들러
  const handleCancel = () => {
    console.log('편집 취소')
    // TODO: 변경사항 되돌리기 구현
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  // 레이아웃이 없는 경우
  if (!currentLayout) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500">대시보드 레이아웃이 없습니다.</p>
        <button
          onClick={() => {
            const newLayout = createLayout('새 대시보드', '3x3')
            setCurrentLayout(newLayout)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          대시보드 만들기
        </button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 툴바 */}
      {showToolbar && (
        <EditModeToolbar
          onAddWidget={handleAddWidget}
          onSave={handleSaveLayout}
          onCancel={handleCancel}
        />
      )}

      {/* 대시보드 그리드 */}
      <div className="flex-1 overflow-auto bg-white">
        <DndProvider>
          <GridLayout
            gridSize={currentLayout.gridSize}
            className="h-full"
            gap={isEditMode ? 20 : 16}
            padding={isEditMode ? 20 : 16}
          >
            {currentLayout.widgets.map((widget) => (
              <GridItem
                key={widget.id}
                colSpan={widget.position.width}
                rowSpan={widget.position.height}
                className={cn({
                  'hover:shadow-lg transition-shadow': isEditMode && !widget.locked,
                })}
              >
                <SortableWidget
                  id={widget.id}
                  disabled={!isEditMode || widget.locked}
                >
                  <WidgetWrapper
                    id={widget.id}
                    title={widget.type}
                    locked={widget.locked}
                  >
                    {renderWidgetContent(widget)}
                  </WidgetWrapper>
                </SortableWidget>
              </GridItem>
            ))}

            {/* 빈 그리드 셀 (편집 모드에서만) */}
            {isEditMode && currentLayout.widgets.length === 0 && (
              <div className="col-span-full row-span-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">
                    위젯을 추가하여 대시보드를 구성하세요
                  </p>
                  <button
                    onClick={handleAddWidget}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    첫 위젯 추가하기
                  </button>
                </div>
              </div>
            )}
          </GridLayout>
        </DndProvider>
      </div>
    </div>
  )
}