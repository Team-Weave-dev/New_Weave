'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
// import Button from '../../ui/Button'; // 임시 주석 처리
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
      className="fixed top-16 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-b"
      role="toolbar"
      aria-label="편집 모드 도구 모음"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 취소 버튼 */}
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground px-3 py-1.5 text-xs h-8 rounded-lg flex items-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="편집 모드 취소"
            role="button"
            tabIndex={0}
          >
            <X className="h-4 w-4 mr-1" aria-hidden="true" />
            취소
          </button>

          {/* 중앙: 편집 모드 표시 */}
          <div className="flex items-center gap-3" role="status" aria-live="polite">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-2 h-2 bg-primary rounded-full"
              aria-hidden="true"
            />
            <span className="font-medium text-sm" role="heading" aria-level={2}>편집 모드</span>
            <motion.div
              animate={{ rotate: [0, -360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-2 h-2 bg-primary rounded-full"
              aria-hidden="true"
            />
          </div>

          {/* 오른쪽: 완료 버튼 */}
          <button
            onClick={onDone}
            className="bg-blue-600 text-white px-4 py-2 text-sm h-10 rounded-lg font-medium flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="편집 완료 및 저장"
            role="button"
            tabIndex={0}
          >
            <Check className="h-4 w-4 mr-1" aria-hidden="true" />
            완료
          </button>
        </div>

        {/* 하단 액션 버튼들 */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {/* 위젯 추가 드롭다운 */}
          <DropdownMenu open={showWidgetMenu} onOpenChange={setShowWidgetMenu}>
            <DropdownMenuTrigger asChild>
              <button className="bg-transparent text-gray-600 border-2 border-gray-300 px-3 py-1.5 text-xs h-8 rounded-lg flex items-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="위젯 추가 메뉴 열기"
                aria-expanded={showWidgetMenu}
                aria-haspopup="menu"
                tabIndex={0}>
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                위젯 추가
              </button>
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
              <button className="bg-transparent text-gray-600 border-2 border-gray-300 px-3 py-1.5 text-xs h-8 rounded-lg flex items-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="레이아웃 템플릿 메뉴 열기"
                aria-expanded={showTemplateMenu}
                aria-haspopup="menu"
                tabIndex={0}>
                <Layout className="h-4 w-4 mr-1" aria-hidden="true" />
                템플릿
              </button>
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
        'lg:hidden', // 모바일에서만 표시
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
      aria-label="새 위젯 추가"
      role="button"
      tabIndex={0}
    >
      <Plus className="h-6 w-6" aria-hidden="true" />
    </motion.button>
  );
}