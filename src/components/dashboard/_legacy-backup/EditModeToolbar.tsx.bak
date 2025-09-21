'use client'

import React, { useState } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { log } from '@/lib/logger'
import {
  Edit3,
  Save,
  X,
  Grid3x3,
  Grid2x2,
  Plus,
  Layout,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Layers,
  Share2,
  Menu,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LayoutManager } from './LayoutManager'
import { ShareLayoutModal } from './ShareLayoutModal'
import { downloadLayout, readLayoutFromFile } from '@/lib/dashboard/layoutExportImport'

interface EditModeToolbarProps {
  className?: string
  onAddWidget?: () => void
  onSave?: () => void
  onCancel?: () => void
}

export function EditModeToolbar({
  className,
  onAddWidget,
  onSave,
  onCancel,
}: EditModeToolbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const {
    isEditMode,
    setEditMode,
    currentLayout,
    setGridSize,
    saveToLocalStorage,
    reset,
  } = useDashboardStore()

  const [isSaving, setIsSaving] = useState(false)
  const [isLayoutManagerOpen, setIsLayoutManagerOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const { addToast } = useToast()

  const handleToggleEditMode = () => {
    setEditMode(!isEditMode)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      saveToLocalStorage()
      if (onSave) {
        await onSave()
      }
      setEditMode(false)
    } catch (error) {
      log.error('Failed to save layout:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    setEditMode(false)
  }

  const handleGridSizeChange = (size: '3x3' | '4x4') => {
    setGridSize(size)
  }

  const handleReset = () => {
    if (window.confirm('대시보드를 초기 상태로 재설정하시겠습니까?')) {
      reset()
    }
  }

  const handleExportLayout = () => {
    if (currentLayout) {
      downloadLayout(currentLayout)
    }
  }

  const handleImportLayout = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const layout = await readLayoutFromFile(file)
        if (layout) {
          const { createLayout, setCurrentLayout, updateLayout } = useDashboardStore.getState()
          const newLayout = createLayout(layout.name, layout.gridSize)
          updateLayout(newLayout.id, { widgets: layout.widgets })
          setCurrentLayout(newLayout)
          saveToLocalStorage()
          addToast('레이아웃을 성공적으로 가져왔습니다.', 'success')
        } else {
          addToast('레이아웃 파일을 읽을 수 없습니다.', 'error')
        }
      }
    }
    
    input.click()
  }

  return (
    <>
      {/* 모바일 메뉴 버튼 */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-full w-14 h-14 shadow-lg"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* 모바일 하단 시트 */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-2xl shadow-2xl p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 편집 모드 토글 */}
          <Button
            variant={isEditMode ? 'primary' : 'outline'}
            size="lg"
            onClick={() => {
              handleToggleEditMode()
              setIsMobileMenuOpen(false)
            }}
            className="w-full h-14 flex items-center justify-center gap-3"
          >
            {isEditMode ? <EyeOff className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
            <span className="text-base">{isEditMode ? '편집 종료' : '편집 모드'}</span>
          </Button>

          {isEditMode && (
            <>
              {/* 위젯 추가 */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  onAddWidget?.()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full h-14 flex items-center justify-center gap-3"
              >
                <Plus className="h-5 w-5" />
                <span className="text-base">위젯 추가</span>
              </Button>

              {/* 그리드 크기 선택 */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={currentLayout?.gridSize === '3x3' ? 'primary' : 'outline'}
                  size="lg"
                  onClick={() => handleGridSizeChange('3x3')}
                  className="h-14 flex items-center justify-center gap-2"
                >
                  <Grid3x3 className="h-5 w-5" />
                  <span>3x3</span>
                </Button>
                <Button
                  variant={currentLayout?.gridSize === '4x4' ? 'primary' : 'outline'}
                  size="lg"
                  onClick={() => handleGridSizeChange('4x4')}
                  className="h-14 flex items-center justify-center gap-2"
                >
                  <Grid2x2 className="h-5 w-5" />
                  <span>4x4</span>
                </Button>
              </div>

              {/* 기타 액션 */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setIsLayoutManagerOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="h-14"
                >
                  <Layers className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="h-14"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>

              {/* 저장/취소 */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    handleCancel()
                    setIsMobileMenuOpen(false)
                  }}
                  disabled={isSaving}
                  className="h-14"
                >
                  <X className="h-5 w-5" />
                  <span>취소</span>
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    handleSave()
                    setIsMobileMenuOpen(false)
                  }}
                  disabled={isSaving}
                  className="h-14"
                >
                  <Save className="h-5 w-5" />
                  <span>{isSaving ? '저장 중...' : '저장'}</span>
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 데스크톱 툴바 (기존 코드) */}
      <div
        className={cn(
          'hidden lg:flex items-center justify-between gap-4 p-4 bg-[var(--color-primary-surface)] border-b border-[var(--color-primary-borderSecondary)]',
          className
        )}
      >
      <div className="flex items-center gap-4">
        {/* 편집 모드 토글 */}
        <Button
          variant={isEditMode ? 'primary' : 'outline'}
          size="sm"
          onClick={handleToggleEditMode}
          className="gap-2"
        >
          {isEditMode ? (
            <>
              <EyeOff className="h-4 w-4" />
              편집 종료
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4" />
              편집 모드
            </>
          )}
        </Button>

        {/* 편집 모드 액션들 */}
        {isEditMode && (
          <>
            {/* 위젯 추가 */}
            <Button
              variant="outline"
              size="sm"
              onClick={onAddWidget}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              위젯 추가
            </Button>

            {/* 그리드 크기 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-gray-600)] dark:text-[var(--color-gray-400)]">
                그리드:
              </span>
              <div className="flex gap-1">
                <Button
                  variant={currentLayout?.gridSize === '3x3' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleGridSizeChange('3x3')}
                  className="h-8 w-8 p-0"
                  title="3x3 그리드"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentLayout?.gridSize === '4x4' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleGridSizeChange('4x4')}
                  className="h-8 w-8 p-0"
                  title="4x4 그리드"
                >
                  <Grid2x2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 레이아웃 관리 */}
            <div className="flex items-center gap-1 border-l pl-4 ml-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLayoutManagerOpen(true)}
                className="gap-2"
                title="레이아웃 관리"
              >
                <Layers className="h-4 w-4" />
                레이아웃
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-2"
                title="초기화"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportLayout}
                className="gap-2"
                title="레이아웃 내보내기"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImportLayout}
                className="gap-2"
                title="레이아웃 가져오기"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsShareModalOpen(true)}
                className="gap-2"
                title="레이아웃 공유"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* 저장/취소 버튼 (편집 모드에서만) */}
      {isEditMode && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      )}

      {/* 뷰 모드 정보 */}
      {!isEditMode && currentLayout && (
        <div className="flex items-center gap-4 text-sm text-[var(--color-gray-600)] dark:text-[var(--color-gray-400)]">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            <span>{currentLayout.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            <span>{currentLayout.gridSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>위젯 {currentLayout.widgets.length}개</span>
          </div>
        </div>
      )}

      {/* 레이아웃 매니저 모달 */}
      <LayoutManager
        isOpen={isLayoutManagerOpen}
        onClose={() => setIsLayoutManagerOpen(false)}
      />

      {/* 레이아웃 공유 모달 */}
      <ShareLayoutModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
      </div>
    </>
  )
}