'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { GridLayout, GridItem } from './GridLayout'
import { WidgetWrapper } from './WidgetWrapper'
import { EditModeToolbar } from './EditModeToolbar'
import { DndProvider } from './dnd/DndProvider'
import { SortableWidget } from './dnd/SortableWidget'
import { WidgetLibrary } from './WidgetLibrary'
import { WidgetConfigPanel } from './WidgetConfigPanel'
import { WidgetSkeleton } from './WidgetSkeleton'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useDashboardKeyboardNavigation } from '@/hooks/useDashboardKeyboardNavigation'
import type { WidgetType, WidgetMetadata } from '@/types/dashboard'
import { initializeWidgetRegistry } from '@/lib/dashboard/initializeWidgets'
import { WidgetRegistry } from '@/lib/dashboard/WidgetRegistry'
// Lazy loaded widgets are now handled by WidgetRegistry

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
  const [isWidgetLibraryOpen, setIsWidgetLibraryOpen] = useState(false)
  const [configPanelWidgetId, setConfigPanelWidgetId] = useState<string | null>(null)
  const [isRegistryInitialized, setIsRegistryInitialized] = useState(false)
  
  // 키보드 네비게이션 훅 사용
  useDashboardKeyboardNavigation()

  // WidgetRegistry 초기화
  useEffect(() => {
    if (!isRegistryInitialized) {
      initializeWidgetRegistry();
      setIsRegistryInitialized(true);
    }
  }, [isRegistryInitialized]);

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

  // 위젯 타입에 따른 컴포넌트 렌더링 (Lazy Loading with Suspense)
  const renderWidgetContent = (widget: any) => {
    const widgetProps = {
      id: widget.id,
      type: widget.type,
      config: widget.config,
      isEditMode: isEditMode
    }

    // Suspense와 ErrorBoundary로 감싸서 lazy loading 처리
    const renderWithSuspense = (Component: React.ComponentType<any>) => (
      <WidgetErrorBoundary widgetId={widget.id} widgetType={widget.type}>
        <Suspense fallback={<WidgetSkeleton />}>
          <Component {...widgetProps} />
        </Suspense>
      </WidgetErrorBoundary>
    )

    // WidgetRegistry에서 컴포넌트 가져오기
    const registeredComponent = WidgetRegistry.getComponent(widget.type as WidgetType);
    
    if (registeredComponent) {
      return renderWithSuspense(registeredComponent as React.ComponentType<any>);
    }
    
    // 위젯을 찾을 수 없는 경우 폴백
    console.warn(`Widget type "${widget.type}" not found in registry`);
    return (
      <WidgetErrorBoundary widgetId={widget.id} widgetType={widget.type}>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            위젯을 불러올 수 없습니다
          </h3>
          <p className="text-sm text-gray-600">
            위젯 타입: {widget.type}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            위젯 ID: {widget.id}
          </p>
        </div>
      </WidgetErrorBoundary>
    )
  }

  // 위젯 추가 핸들러
  const handleAddWidget = () => {
    setIsWidgetLibraryOpen(true)
  }

  // 위젯 라이브러리에서 위젯 추가
  const handleWidgetAdd = (type: WidgetType, metadata: WidgetMetadata) => {
    const { addWidget } = useDashboardStore.getState()
    
    // 새 위젯 생성 및 추가
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: type,
      position: {
        x: 0,
        y: 0,
        width: metadata.defaultSize.width,
        height: metadata.defaultSize.height
      },
      config: {},
      locked: false
    }
    
    addWidget(newWidget)
    console.log('위젯 추가됨:', type, metadata.name)
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
                    onConfigure={() => setConfigPanelWidgetId(widget.id)}
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

      {/* 위젯 라이브러리 사이드바 */}
      <WidgetLibrary
        isOpen={isWidgetLibraryOpen}
        onClose={() => setIsWidgetLibraryOpen(false)}
        onAddWidget={handleWidgetAdd}
      />

      {/* 위젯 설정 패널 */}
      {configPanelWidgetId && (
        <WidgetConfigPanel
          widgetId={configPanelWidgetId}
          isOpen={!!configPanelWidgetId}
          onClose={() => setConfigPanelWidgetId(null)}
        />
      )}
    </div>
  )
}