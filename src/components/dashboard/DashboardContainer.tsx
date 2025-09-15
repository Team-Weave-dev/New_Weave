'use client'

import React, { useEffect, useState, Suspense, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import { extractLayoutFromShareLink } from '@/lib/dashboard/layoutSharing'
import { useToast } from '@/components/ui/Toast'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'
import { log } from '@/lib/logger'
import { GridLayout, GridItem } from './GridLayout'
import { useResponsiveGrid } from '@/lib/dashboard/responsive-grid'
import { OptimizedWidgetWrapper } from './OptimizedWidgetWrapper'
import { EditModeToolbar } from './EditModeToolbar'
import { DndProvider } from './dnd/DndProvider'
import { SortableWidget } from './dnd/SortableWidget'
import { WidgetLibrary } from './WidgetLibrary'
import { WidgetConfigPanel } from './WidgetConfigPanel'
import { WidgetSkeleton } from './WidgetSkeleton'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'
import { KeyboardShortcutHelp } from './KeyboardShortcutHelp'
import { AnimatedWidget, LayoutTransition } from './AnimatedWidget'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useDashboardKeyboardNavigation } from '@/hooks/useDashboardKeyboardNavigation'
import type { WidgetType, WidgetMetadata } from '@/types/dashboard'
import { initializeWidgetRegistry } from '@/lib/dashboard/initializeWidgets'
import { WidgetRegistry } from '@/lib/dashboard/WidgetRegistry'
import { normalizeWidgetType } from '@/lib/dashboard/widgetTypeMapping'
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
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false)
  
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  
  // 반응형 그리드 훅 사용
  const {
    deviceType,
    gridSize: responsiveGridSize,
    isResponsiveMode,
    toggleResponsiveMode,
    setManualGridSize
  } = useResponsiveGrid(currentLayout?.gridSize || '3x3')
  
  // 키보드 네비게이션 훅 사용
  useDashboardKeyboardNavigation()

  // WidgetRegistry 초기화 (한 번만 실행)
  useEffect(() => {
    initializeWidgetRegistry();
  }, []);

  // 키보드 단축키 도움말 표시 (? 키)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault()
        setIsShortcutHelpOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 초기 레이아웃 로드
  useEffect(() => {
    const initializeLayout = async () => {
      setIsLoading(true)
      
      try {
        // 공유 링크 확인
        const shareParam = searchParams?.get('share')
        if (shareParam) {
          const currentUrl = window.location.href
          const sharedLayout = extractLayoutFromShareLink(currentUrl)
          
          if (sharedLayout) {
            // 공유된 레이아웃 가져오기
            const { createLayout, setCurrentLayout, updateLayout } = useDashboardStore.getState()
            const newLayout = createLayout(sharedLayout.name, sharedLayout.gridSize)
            updateLayout(newLayout.id, { widgets: sharedLayout.widgets })
            setCurrentLayout(newLayout)
            
            // URL에서 share 파라미터 제거
            const url = new URL(window.location.href)
            url.searchParams.delete('share')
            window.history.replaceState({}, '', url.toString())
            
            addToast('공유된 레이아웃을 성공적으로 가져왔습니다.', 'success')
          }
        } else {
          // localStorage에서 저장된 레이아웃 로드
          loadFromLocalStorage()
        }
        
        // 로드 후에도 레이아웃이 없거나 위젯이 없으면 처리하지 않음
        // (page.tsx에서 처리)
        
        setIsInitialized(true)
      } catch (error) {
        log.error('Failed to initialize dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!isInitialized) {
      initializeLayout()
    }
  }, [isInitialized, loadFromLocalStorage, searchParams])

  // 위젯 타입에 따른 컴포넌트 렌더링 (Lazy Loading with Suspense) - 메모이제이션
  const renderWidgetContent = useCallback((widget: any) => {
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

    // 위젯 타입 정규화 (한글 -> 영문 변환)
    const normalizedType = normalizeWidgetType(widget.type) as WidgetType;
    
    // WidgetRegistry에서 컴포넌트 가져오기
    const registeredComponent = WidgetRegistry.getComponent(normalizedType);
    
    if (registeredComponent) {
      return renderWithSuspense(registeredComponent as React.ComponentType<any>);
    }
    
    // 위젯을 찾을 수 없는 경우 폴백
    log.warn(`Widget type "${widget.type}" (normalized: "${normalizedType}") not found in registry`);
    return (
      <WidgetErrorBoundary widgetId={widget.id} widgetType={widget.type}>
        <div className="p-4 bg-[var(--color-primary-surface)] rounded-lg border border-[var(--color-primary-borderSecondary)]">
          <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">
            위젯을 불러올 수 없습니다
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            위젯 타입: {widget.type}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
            위젯 ID: {widget.id}
          </p>
        </div>
      </WidgetErrorBoundary>
    )
  }, [isEditMode])

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
    log.info('위젯 추가됨:', { type, name: metadata.name })
  }

  // 레이아웃 저장 핸들러
  const handleSaveLayout = async () => {
    log.info('레이아웃 저장')
    // TODO: Supabase에 저장 구현
  }

  // 취소 핸들러
  const handleCancel = () => {
    log.info('편집 취소')
    // TODO: 변경사항 되돌리기 구현
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-secondary)]" />
      </div>
    )
  }

  // 레이아웃이 없는 경우
  if (!currentLayout) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-[var(--color-text-secondary)]">대시보드 레이아웃이 없습니다.</p>
        <button
          onClick={() => {
            const newLayout = createLayout('새 대시보드', '3x3')
            setCurrentLayout(newLayout)
          }}
          className="px-4 py-2 bg-gradient-to-r from-[var(--color-brand-secondary-start)] to-[var(--color-brand-secondary-end)] text-white rounded-lg hover:shadow-lg transition-all"
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
          <LayoutTransition>
            <GridLayout
              gridSize={isResponsiveMode ? responsiveGridSize : currentLayout.gridSize}
              className="h-full"
              gap={deviceType === 'mobile' ? 12 : isEditMode ? 20 : 16}
              padding={deviceType === 'mobile' ? 12 : isEditMode ? 20 : 16}
            >
              {currentLayout.widgets.map((widget) => (
                <AnimatedWidget
                  key={widget.id}
                  id={widget.id}
                  position={widget.position}
                  isEditMode={isEditMode}
                  className={cn({
                    'hover:shadow-lg transition-shadow': isEditMode && !widget.locked,
                  })}
                >
                  <SortableWidget
                    id={widget.id}
                    disabled={!isEditMode || widget.locked}
                  >
                    <OptimizedWidgetWrapper
                      id={widget.id}
                      type={widget.type}
                      title={widget.type}
                      locked={widget.locked}
                      position={widget.position}
                      onConfigure={() => setConfigPanelWidgetId(widget.id)}
                    >
                      {renderWidgetContent(widget)}
                    </OptimizedWidgetWrapper>
                  </SortableWidget>
                </AnimatedWidget>
              ))}

            {/* 빈 그리드 셀 (편집 모드에서만) */}
            {isEditMode && currentLayout.widgets.length === 0 && (
              <div className="col-span-full row-span-full flex items-center justify-center">
                <div className="text-center">
                  <Typography variant="body1" className="text-[var(--color-gray-500)] mb-4">
                    위젯을 추가하여 대시보드를 구성하세요
                  </Typography>
                  <Button
                    onClick={handleAddWidget}
                    variant="primary"
                    className="bg-[var(--color-blue-500)] hover:bg-[var(--color-blue-600)]"
                  >
                    첫 위젯 추가하기
                  </Button>
                </div>
              </div>
            )}
          </GridLayout>
          </LayoutTransition>
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

      {/* 키보드 단축키 도움말 */}
      <KeyboardShortcutHelp
        isOpen={isShortcutHelpOpen}
        onClose={() => setIsShortcutHelpOpen(false)}
      />
    </div>
  )
}