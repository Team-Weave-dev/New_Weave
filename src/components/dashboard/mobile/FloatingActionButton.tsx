'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  X, 
  Settings, 
  Sparkles,
  Grid3x3,
  Save,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Target,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/lib/stores/useDashboardStore';

interface FloatingActionButtonProps {
  onAddWidget: (type: string) => void;
  onOpenTemplates?: () => void;
  onOpenSettings?: () => void;
}

export function FloatingActionButton({
  onAddWidget,
  onOpenTemplates,
  onOpenSettings
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isEditMode } = useDashboardStore();

  const widgetOptions = [
    { id: 'revenue', icon: DollarSign, label: '매출 현황', color: 'bg-green-500' },
    { id: 'calendar', icon: Calendar, label: '일정', color: 'bg-blue-500' },
    { id: 'analytics', icon: TrendingUp, label: '분석', color: 'bg-purple-500' },
    { id: 'team', icon: Users, label: '팀 현황', color: 'bg-orange-500' },
    { id: 'tasks', icon: Target, label: '작업', color: 'bg-red-500' },
    { id: 'report', icon: FileText, label: '보고서', color: 'bg-indigo-500' },
    { id: 'chart', icon: PieChart, label: '차트', color: 'bg-pink-500' }
  ];

  const handleAddWidget = (type: string) => {
    onAddWidget(type);
    setIsExpanded(false);
  };

  // 편집 모드가 아닐 때는 FAB 숨김
  if (!isEditMode) return null;

  return (
    <>
      {/* 오버레이 */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB 그룹 */}
      <div className="fixed bottom-20 right-4 z-50 lg:hidden">
        {/* 확장된 옵션들 */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 space-y-2">
            {/* 템플릿 버튼 */}
            {onOpenTemplates && (
              <div className="flex items-center justify-end gap-2">
                <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  템플릿
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onOpenTemplates();
                    setIsExpanded(false);
                  }}
                  className="h-12 w-12 rounded-full shadow-lg p-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 touch-manipulation"
                  aria-label="템플릿 열기"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  <Sparkles className="h-5 w-5 text-white" />
                </Button>
              </div>
            )}

            {/* 설정 버튼 */}
            {onOpenSettings && (
              <div className="flex items-center justify-end gap-2">
                <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  설정
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onOpenSettings();
                    setIsExpanded(false);
                  }}
                  className="h-12 w-12 rounded-full shadow-lg p-0 bg-gray-600 hover:bg-gray-700 touch-manipulation"
                  aria-label="설정 열기"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  <Settings className="h-5 w-5 text-white" />
                </Button>
              </div>
            )}

            {/* 위젯 추가 옵션들 */}
            <div className="space-y-2">
              {widgetOptions.map((widget) => {
                const Icon = widget.icon;
                return (
                  <div key={widget.id} className="flex items-center justify-end gap-2">
                    <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {widget.label}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddWidget(widget.id)}
                      className={cn(
                        "h-12 w-12 rounded-full shadow-lg p-0 touch-manipulation",
                        widget.color,
                        "hover:opacity-90"
                      )}
                      aria-label={`${widget.label} 위젯 추가`}
                      style={{ minHeight: '48px', minWidth: '48px' }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 메인 FAB 버튼 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg p-0 transition-all duration-200 touch-manipulation",
            "bg-weave-primary hover:bg-weave-primary-dark",
            isExpanded && "rotate-45"
          )}
          aria-label={isExpanded ? "메뉴 닫기" : "위젯 추가 메뉴 열기"}
          aria-expanded={isExpanded}
          style={{ minHeight: '56px', minWidth: '56px' }}
        >
          {isExpanded ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>
    </>
  );
}