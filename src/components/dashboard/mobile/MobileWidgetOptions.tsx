'use client';

import React from 'react';
import { MobileBottomSheet } from './MobileBottomSheet';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import {
  Move,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  Settings,
  Palette,
  BarChart,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useDashboardStore } from '@/lib/stores/useDashboardStore';

interface MobileWidgetOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId: string | null;
}

export function MobileWidgetOptions({
  isOpen,
  onClose,
  widgetId
}: MobileWidgetOptionsProps) {
  const {
    widgets,
    updateWidget,
    deleteWidget,
    duplicateWidget,
    moveWidget
  } = useDashboardStore();

  const widget = widgetId ? widgets.find(w => w.id === widgetId) : null;

  if (!widget) return null;

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    let newX = widget.position.x;
    let newY = widget.position.y;

    switch (direction) {
      case 'up':
        newY = Math.max(0, newY - 1);
        break;
      case 'down':
        newY = newY + 1;
        break;
      case 'left':
        newX = Math.max(0, newX - 1);
        break;
      case 'right':
        newX = newX + 1;
        break;
    }

    updateWidget(widget.id, {
      position: { ...widget.position, x: newX, y: newY }
    });
  };

  const handleResize = (action: 'grow' | 'shrink') => {
    const currentWidth = widget.position.width;
    const currentHeight = widget.position.height;

    if (action === 'grow') {
      updateWidget(widget.id, {
        position: {
          ...widget.position,
          width: Math.min(3, currentWidth + 1),
          height: Math.min(3, currentHeight + 1)
        }
      });
    } else {
      updateWidget(widget.id, {
        position: {
          ...widget.position,
          width: Math.max(1, currentWidth - 1),
          height: Math.max(1, currentHeight - 1)
        }
      });
    }
  };

  const handleDuplicate = () => {
    duplicateWidget(widget.id);
    onClose();
  };

  const handleDelete = () => {
    deleteWidget(widget.id);
    onClose();
  };

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="위젯 옵션"
      height="auto"
    >
      <div className="p-4 space-y-4">
        {/* 위젯 정보 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <Typography variant="caption" className="text-txt-secondary mb-1">
            위젯 유형
          </Typography>
          <Typography variant="body2" className="text-txt-primary font-medium">
            {widget.type}
          </Typography>
          <Typography variant="caption" className="text-txt-secondary mt-2">
            크기: {widget.position.width} x {widget.position.height}
          </Typography>
        </div>

        {/* 위치 조정 */}
        <div>
          <Typography variant="body2" className="text-txt-primary font-medium mb-3">
            위치 조정
          </Typography>
          <div className="grid grid-cols-3 gap-2">
            <div />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMove('up')}
              className="flex items-center justify-center p-3 touch-manipulation"
              aria-label="위로 이동"
              style={{ minHeight: '48px' }}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
            <div />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMove('left')}
              className="flex items-center justify-center p-3 touch-manipulation"
              aria-label="왼쪽으로 이동"
              style={{ minHeight: '48px' }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex items-center justify-center p-3 touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              <Move className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMove('right')}
              className="flex items-center justify-center p-3 touch-manipulation"
              aria-label="오른쪽으로 이동"
              style={{ minHeight: '48px' }}
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <div />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMove('down')}
              className="flex items-center justify-center p-3 touch-manipulation"
              aria-label="아래로 이동"
              style={{ minHeight: '48px' }}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
            <div />
          </div>
        </div>

        {/* 크기 조정 */}
        <div>
          <Typography variant="body2" className="text-txt-primary font-medium mb-3">
            크기 조정
          </Typography>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResize('grow')}
              className="flex items-center justify-center gap-2 p-3 touch-manipulation"
              aria-label="크게"
              style={{ minHeight: '48px' }}
            >
              <Maximize2 className="h-5 w-5" />
              <span>크게</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResize('shrink')}
              className="flex items-center justify-center gap-2 p-3 touch-manipulation"
              aria-label="작게"
              style={{ minHeight: '48px' }}
            >
              <Minimize2 className="h-5 w-5" />
              <span>작게</span>
            </Button>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            className="w-full flex items-center justify-center gap-2 p-3 touch-manipulation"
            aria-label="위젯 복제"
            style={{ minHeight: '48px' }}
          >
            <Copy className="h-5 w-5" />
            <span>복제</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-2 p-3 touch-manipulation"
            aria-label="위젯 설정"
            style={{ minHeight: '48px' }}
          >
            <Settings className="h-5 w-5" />
            <span>설정</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 touch-manipulation"
            aria-label="위젯 삭제"
            style={{ minHeight: '48px' }}
          >
            <Trash2 className="h-5 w-5" />
            <span>삭제</span>
          </Button>
        </div>
      </div>
    </MobileBottomSheet>
  );
}