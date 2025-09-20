'use client';

import React from 'react';
import { IOSWidgetProps } from '@/lib/dashboard/ios-widget-registry';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Activity, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsData {
  revenue: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  customers: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  orders: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  conversion: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
}

export function StatsWidget(props: IOSWidgetProps) {
  // 실제 데이터 시뮬레이션 (실제로는 API 호출 또는 스토어에서 가져와야 함)
  const [statsData] = React.useState<StatsData>({
    revenue: {
      value: 47250000,
      change: 12.5,
      trend: 'up'
    },
    customers: {
      value: 3842,
      change: -5.4,
      trend: 'down'
    },
    orders: {
      value: 1827,
      change: 8.2,
      trend: 'up'
    },
    conversion: {
      value: 3.24,
      change: 2.1,
      trend: 'up'
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    trend, 
    icon: Icon,
    format = 'number' 
  }: {
    title: string;
    value: number;
    change: number;
    trend: 'up' | 'down';
    icon: React.ElementType;
    format?: 'currency' | 'number' | 'percent';
  }) => {
    const formattedValue = 
      format === 'currency' ? formatCurrency(value) :
      format === 'percent' ? `${value.toFixed(2)}%` :
      formatNumber(value);

    return (
      <div className="bg-white/5 backdrop-blur rounded-lg p-3 hover:bg-white/10 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-lg font-bold">{formattedValue}</p>
          <p className={cn(
            "text-xs font-medium",
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          )}>
            {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full h-full p-4 bg-card border shadow-sm">
      <div className="flex flex-col h-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{props.title || '통계 대시보드'}</h3>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          <StatCard
            title="매출"
            value={statsData.revenue.value}
            change={statsData.revenue.change}
            trend={statsData.revenue.trend}
            icon={TrendingUp}
            format="currency"
          />
          <StatCard
            title="고객"
            value={statsData.customers.value}
            change={statsData.customers.change}
            trend={statsData.customers.trend}
            icon={Users}
            format="number"
          />
          <StatCard
            title="주문"
            value={statsData.orders.value}
            change={statsData.orders.change}
            trend={statsData.orders.trend}
            icon={Activity}
            format="number"
          />
          <StatCard
            title="전환율"
            value={statsData.conversion.value}
            change={statsData.conversion.change}
            trend={statsData.conversion.trend}
            icon={TrendingUp}
            format="percent"
          />
        </div>
        
        {/* 푸터 */}
        {props.size && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            크기: {props.size.width}x{props.size.height}
          </div>
        )}
      </div>
    </Card>
  );
}