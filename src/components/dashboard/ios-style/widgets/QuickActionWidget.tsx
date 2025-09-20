'use client';

import React from 'react';
import { IOSWidgetProps } from '@/lib/dashboard/ios-widget-registry';
import { Card } from '@/components/ui/Card';
import { 
  Plus, 
  FileText, 
  Users, 
  Receipt, 
  Package, 
  Calendar,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  path?: string;
  onClick?: () => void;
}

export function QuickActionWidget(props: IOSWidgetProps) {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: 'new-project',
      label: '새 프로젝트',
      icon: Plus,
      color: 'bg-blue-500',
      path: '/projects/new',
    },
    {
      id: 'new-invoice',
      label: '견적서 작성',
      icon: FileText,
      color: 'bg-green-500',
      path: '/invoices/new',
    },
    {
      id: 'new-client',
      label: '고객 추가',
      icon: Users,
      color: 'bg-purple-500',
      path: '/clients/new',
    },
    {
      id: 'tax-report',
      label: '세무 신고',
      icon: Receipt,
      color: 'bg-orange-500',
      path: '/tax-management',
    },
    {
      id: 'inventory',
      label: '재고 관리',
      icon: Package,
      color: 'bg-pink-500',
      path: '/inventory',
    },
    {
      id: 'schedule',
      label: '일정 관리',
      icon: Calendar,
      color: 'bg-indigo-500',
      path: '/calendar',
    },
  ];

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.path) {
      router.push(action.path);
    }
  };

  // 위젯 크기에 따라 표시할 액션 수 조정
  const displayActions = props.size?.height === 1 
    ? actions.slice(0, 3) 
    : actions;

  return (
    <Card className="w-full h-full p-3 bg-card border shadow-sm">
      <div className="flex flex-col h-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <h3 className="font-semibold text-sm">{props.title || '빠른 작업'}</h3>
          </div>
        </div>
        
        {/* 액션 버튼 그리드 */}
        <div className={cn(
          "grid gap-2 flex-1",
          props.size?.height === 1 
            ? "grid-cols-3" 
            : "grid-cols-2"
        )}>
          {displayActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className={cn(
                  "group relative flex flex-col items-center justify-center",
                  "p-2 rounded-lg",
                  "bg-white/5 backdrop-blur",
                  "hover:bg-white/10",
                  "transition-all duration-200",
                  "hover:scale-105",
                  "border border-transparent",
                  "hover:border-primary/20"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center mb-1",
                  "transition-transform group-hover:scale-110",
                  action.color
                )}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs text-center line-clamp-1">
                  {action.label}
                </span>
                <ChevronRight className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
        
        {/* 크기 정보 */}
        {props.size && process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-muted-foreground">
            크기: {props.size.width}x{props.size.height}
          </div>
        )}
      </div>
    </Card>
  );
}