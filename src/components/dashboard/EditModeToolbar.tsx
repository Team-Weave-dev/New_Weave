'use client'

import React, { useState } from 'react'
import { useDashboardStore } from '@/lib/stores/useDashboardStore'
import Button from '@/components/ui/Button'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const {
    isEditMode,
    setEditMode,
    currentLayout,
    setGridSize,
    saveToLocalStorage,
    reset,
  } = useDashboardStore()

  const [isSaving, setIsSaving] = useState(false)

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
      console.error('Failed to save layout:', error)
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

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-4 bg-[var(--color-primary-surface)] border-b border-[var(--color-primary-borderSecondary)]',
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
              <span className="text-sm text-gray-600 dark:text-gray-400">
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
                className="gap-2"
                title="레이아웃 내보내기"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                title="레이아웃 가져오기"
              >
                <Upload className="h-4 w-4" />
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
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
    </div>
  )
}