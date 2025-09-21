'use client';

import React from 'react';
import InsightCard from './InsightCard';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

// 대시보드 룰 R1-R4에 해당하는 인사이트 데이터 타입
export interface DashboardInsight {
  id: 'R1' | 'R2' | 'R3' | 'R4';
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  icon: React.ReactNode;
  actionLabel?: string;
  onActionClick?: () => void;
  variant?: 'default' | 'warning' | 'success' | 'info';
  isEmpty?: boolean;
  emptyMessage?: string;
}

export interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface DashboardLayoutProps {
  insights: DashboardInsight[];
  quickActions?: QuickAction[];
  className?: string;
  children?: React.ReactNode;
}

export default function DashboardLayout({
  insights,
  quickActions = [],
  className = '',
  children
}: DashboardLayoutProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Header - 모바일 가로 배치 최적화 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 sm:p-3 bg-weave-primary-light rounded-lg flex-shrink-0">
            <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-weave-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <Typography variant="h2" className="text-xl sm:text-2xl mb-0 sm:mb-1 text-txt-primary leading-tight">대시보드</Typography>
            <Typography variant="body1" className="text-sm sm:text-base text-txt-secondary leading-tight hidden sm:block">
              비즈니스 현황을 한눈에 확인하세요
            </Typography>
          </div>
        </div>
        
        {/* Quick Actions - 모바일 최적화 */}
        {quickActions.length > 0 && (
          <div className="flex space-x-2 sm:space-x-3 flex-shrink-0">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'primary'}
                onClick={action.onClick}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2"
              >
                {action.icon}
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            title={insight.title}
            value={insight.value}
            subtitle={insight.subtitle}
            trend={insight.trend}
            icon={insight.icon}
            actionLabel={insight.actionLabel}
            onActionClick={insight.onActionClick}
            variant={insight.variant}
            isEmpty={insight.isEmpty}
            emptyMessage={insight.emptyMessage}
          />
        ))}
      </div>

      {/* Additional Content */}
      {children && (
        <div className="mt-8">
          {children}
        </div>
      )}
    </div>
  );
}