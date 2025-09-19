'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { LayoutTemplate } from '@/types/ios-dashboard';
import {
  Plus,
  Check,
  X,
  Layout,
  Grid3x3,
  Columns,
  Rows,
  Square,
  PanelTop,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EditModeToolbarProps {
  onDone: () => void;
  onCancel: () => void;
  onAddWidget: (widgetType: string) => void;
  onApplyTemplate: (template: LayoutTemplate) => void;
  isVisible: boolean;
}

// 사전 정의된 레이아웃 템플릿
const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'dashboard-default',
    name: '대시보드 기본',
    description: '균형 잡힌 기본 레이아웃',
    widgets: [
      {
        id: 'w1',
        type: 'stats',
        title: '통계',
        position: { gridColumn: '1 / span 2', gridRow: '1 / span 2' },
        size: { width: 2, height: 2 },
        data: {},
        style: {},
        isLocked: false,
      },
      {
        id: 'w2',
        type: 'chart',
        title: '차트',
        position: { gridColumn: '3 / span 2', gridRow: '1 / span 2' },
        size: { width: 2, height: 2 },
        data: {},
        style: {},
        isLocked: false,
      },
      {
        id: 'w3',
        type: 'list',
        title: '목록',
        position: { gridColumn: '1 / span 4', gridRow: '3 / span 3' },
        size: { width: 4, height: 3 },
        data: {},
        style: {},
        isLocked: false,
      },
    ],
    gridConfig: { columns: 4, gap: 16 },
  },
  {
    id: 'analytics-focus',
    name: '분석 중심',
    description: '차트와 그래프 중심 레이아웃',
    widgets: [
      {
        id: 'w1',
        type: 'chart',
        title: '메인 차트',
        position: { gridColumn: '1 / span 4', gridRow: '1 / span 3' },
        size: { width: 4, height: 3 },
        data: {},
        style: {},
        isLocked: false,
      },
      {
        id: 'w2',
        type: 'stats',
        title: 'KPI',
        position: { gridColumn: '1 / span 1', gridRow: '4 / span 1' },
        size: { width: 1, height: 1 },
        data: {},
        style: {},
        isLocked: false,
      },
      {
        id: 'w3',
        type: 'stats',
        title: 'KPI',
        position: { gridColumn: '2 / span 1', gridRow: '4 / span 1' },
        size: { width: 1, height: 1 },
        data: {},
        style: {},
        isLocked: false,
      },
    ],
    gridConfig: { columns: 4, gap: 16 },
  },
  {
    id: 'minimal',
    name: '미니멀',
    description: '핵심 정보만 표시',
    widgets: [
      {
        id: 'w1',
        type: 'stats',
        title: '주요 지표',
        position: { gridColumn: '1 / span 2', gridRow: '1 / span 2' },
        size: { width: 2, height: 2 },
        data: {},
        style: {},
        isLocked: false,
      },
      {
        id: 'w2',
        type: 'list',
        title: '알림',
        position: { gridColumn: '3 / span 2', gridRow: '1 / span 2' },
        size: { width: 2, height: 2 },
        data: {},
        style: {},
        isLocked: false,
      },
    ],
    gridConfig: { columns: 4, gap: 16 },
  },
];

// 위젯 타입 목록
const WIDGET_TYPES = [
  { id: 'stats', name: '통계', icon: Square },
  { id: 'chart', name: '차트', icon: PanelTop },
  { id: 'list', name: '목록', icon: Rows },
  { id: 'calendar', name: '캘린더', icon: Grid3x3 },
  { id: 'weather', name: '날씨', icon: Columns },
];

export function EditModeToolbar({
  onDone,
  onCancel,
  onAddWidget,
  onApplyTemplate,
  isVisible,
}: EditModeToolbarProps) {
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 취소 버튼 */}
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            취소
          </Button>

          {/* 중앙: 편집 모드 표시 */}
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-2 h-2 bg-primary rounded-full"
            />
            <span className="font-medium text-sm">편집 모드</span>
            <motion.div
              animate={{ rotate: [0, -360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          </div>

          {/* 오른쪽: 완료 버튼 */}
          <Button
            onClick={onDone}
            variant="default"
            size="sm"
            className="font-medium"
          >
            <Check className="h-4 w-4 mr-1" />
            완료
          </Button>
        </div>

        {/* 하단 액션 버튼들 */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {/* 위젯 추가 드롭다운 */}
          <DropdownMenu open={showWidgetMenu} onOpenChange={setShowWidgetMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                위젯 추가
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>위젯 선택</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {WIDGET_TYPES.map((widget) => {
                const Icon = widget.icon;
                return (
                  <DropdownMenuItem
                    key={widget.id}
                    onClick={() => {
                      onAddWidget(widget.id);
                      setShowWidgetMenu(false);
                    }}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {widget.name}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 템플릿 선택 드롭다운 */}
          <DropdownMenu open={showTemplateMenu} onOpenChange={setShowTemplateMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Layout className="h-4 w-4 mr-1" />
                템플릿
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>레이아웃 템플릿</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LAYOUT_TEMPLATES.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => {
                    onApplyTemplate(template);
                    setShowTemplateMenu(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{template.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {template.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

// FAB 스타일 위젯 추가 버튼 (모바일용)
export function AddWidgetFAB({
  onClick,
  isEditMode,
}: {
  onClick: () => void;
  isEditMode: boolean;
}) {
  if (!isEditMode) return null;

  return (
    <motion.button
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6',
        'w-14 h-14',
        'bg-primary text-primary-foreground',
        'rounded-full',
        'shadow-lg',
        'flex items-center justify-center',
        'z-30',
        'hover:shadow-xl',
        'transition-shadow',
        'lg:hidden' // 모바일에서만 표시
      )}
      aria-label="위젯 추가"
    >
      <Plus className="h-6 w-6" />
    </motion.button>
  );
}