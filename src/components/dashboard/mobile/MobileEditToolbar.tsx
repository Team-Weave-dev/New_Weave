'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import {
  Save,
  X,
  Plus,
  Grid3x3,
  Undo2,
  Redo2,
  RefreshCw,
  Maximize2,
  Settings,
  MoreVertical,
  Move,
  Square,
  Trash2
} from 'lucide-react';
import { useDashboardStore } from '@/lib/stores/useDashboardStore';
import { cn } from '@/lib/utils';

interface MobileEditToolbarProps {
  onClose: () => void;
  onAddWidget: () => void;
  onOpenSettings?: () => void;
}

export function MobileEditToolbar({ 
  onClose, 
  onAddWidget,
  onOpenSettings 
}: MobileEditToolbarProps) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  const {
    isEditMode,
    setEditMode,
    undoLastAction,
    redoAction,
    canUndo,
    canRedo,
    reflowWidgets,
    optimizeLayout,
    normalizeWidgetPositions,
    selectedWidgetId,
    deleteWidget
  } = useDashboardStore();

  const handleSave = () => {
    setEditMode(false);
    onClose();
  };

  const handleDeleteSelected = () => {
    if (selectedWidgetId) {
      deleteWidget(selectedWidgetId);
    }
  };

  return (
    <>
      {/* 모바일 편집 툴바 - 하단 고정 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-lg">
        {/* 메인 툴바 */}
        <div className="flex items-center justify-between p-2">
          {/* 좌측 액션 버튼들 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={undoLastAction}
              disabled={!canUndo}
              className="p-2 touch-manipulation"
              aria-label="실행 취소"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              <Undo2 className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={redoAction}
              disabled={!canRedo}
              className="p-2 touch-manipulation"
              aria-label="다시 실행"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              <Redo2 className="h-5 w-5" />
            </Button>

            <div className="w-px h-8 bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onAddWidget}
              className="p-2 touch-manipulation"
              aria-label="위젯 추가"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              <Plus className="h-5 w-5" />
            </Button>

            {selectedWidgetId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteSelected}
                className="p-2 text-red-600 touch-manipulation"
                aria-label="선택된 위젯 삭제"
                style={{ minHeight: '48px', minWidth: '48px' }}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* 우측 액션 버튼들 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="p-2 touch-manipulation"
              aria-label="더 많은 옵션"
              aria-expanded={showMoreOptions}
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>

            <div className="w-px h-8 bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 touch-manipulation"
              aria-label="편집 모드 종료"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              <X className="h-5 w-5" />
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="px-3 py-2 touch-manipulation"
              aria-label="변경사항 저장"
              style={{ minHeight: '48px' }}
            >
              <Save className="h-5 w-5 mr-1" />
              저장
            </Button>
          </div>
        </div>

        {/* 확장 옵션 패널 */}
        {showMoreOptions && (
          <div className="border-t border-gray-200 p-2 bg-gray-50">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  reflowWidgets();
                  setShowMoreOptions(false);
                }}
                className="flex flex-col items-center justify-center p-3 touch-manipulation"
                aria-label="위젯 자동 정렬"
                style={{ minHeight: '64px' }}
              >
                <RefreshCw className="h-5 w-5 mb-1" />
                <span className="text-xs">정렬</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  optimizeLayout();
                  setShowMoreOptions(false);
                }}
                className="flex flex-col items-center justify-center p-3 touch-manipulation"
                aria-label="레이아웃 최적화"
                style={{ minHeight: '64px' }}
              >
                <Maximize2 className="h-5 w-5 mb-1" />
                <span className="text-xs">최적화</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  normalizeWidgetPositions();
                  setShowMoreOptions(false);
                }}
                className="flex flex-col items-center justify-center p-3 touch-manipulation"
                aria-label="위치 정규화"
                style={{ minHeight: '64px' }}
              >
                <Grid3x3 className="h-5 w-5 mb-1" />
                <span className="text-xs">정규화</span>
              </Button>

              {onOpenSettings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenSettings();
                    setShowMoreOptions(false);
                  }}
                  className="flex flex-col items-center justify-center p-3 touch-manipulation"
                  aria-label="대시보드 설정"
                  style={{ minHeight: '64px' }}
                >
                  <Settings className="h-5 w-5 mb-1" />
                  <span className="text-xs">설정</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 선택된 위젯 정보 (있을 경우) */}
      {selectedWidgetId && (
        <div className="fixed top-16 left-4 right-4 z-30 lg:hidden bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4 text-blue-600" />
              <Typography variant="caption" className="text-blue-700 font-medium">
                위젯이 선택됨 - 드래그하여 이동
              </Typography>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => useDashboardStore.getState().setSelectedWidgetId(null)}
              className="p-1 text-blue-600"
              aria-label="선택 해제"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}