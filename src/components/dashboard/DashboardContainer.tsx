'use client'

import React, { useEffect, useState } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { GridLayout, GridItem } from './GridLayout'
import { WidgetWrapper } from './WidgetWrapper'
import { EditModeToolbar } from './EditModeToolbar'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

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

  // 초기 레이아웃 로드
  useEffect(() => {
    const initializeLayout = async () => {
      setIsLoading(true)
      
      try {
        // localStorage에서 저장된 레이아웃 로드
        loadFromLocalStorage()
        
        // 현재 레이아웃이 없으면
        if (!currentLayout) {
          // 지정된 레이아웃 ID가 있으면 찾아서 설정
          if (initialLayoutId) {
            const layout = layouts.find(l => l.id === initialLayoutId)
            if (layout) {
              setCurrentLayout(layout)
            }
          }
          
          // 그래도 레이아웃이 없으면 기본 레이아웃 생성
          if (!currentLayout && layouts.length === 0) {
            const defaultLayout = createLayout('기본 대시보드', '3x3')
            // 샘플 위젯 추가 (임시)
            setCurrentLayout(defaultLayout)
          }
        }
        
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
  }, [
    isInitialized,
    currentLayout,
    layouts,
    initialLayoutId,
    setCurrentLayout,
    createLayout,
    loadFromLocalStorage,
  ])

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
          onClick={() => createLayout('새 대시보드', '3x3')}
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
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
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
              <WidgetWrapper
                id={widget.id}
                title={widget.type}
                locked={widget.locked}
              >
                {/* 임시 위젯 콘텐츠 */}
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
              </WidgetWrapper>
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
      </div>
    </div>
  )
}