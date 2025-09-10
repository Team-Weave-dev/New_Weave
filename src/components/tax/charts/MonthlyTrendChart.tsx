'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import type { MonthlyTrend } from '@/lib/services/supabase/tax-transactions.service';

interface MonthlyTrendChartProps {
  data: MonthlyTrend[];
  loading?: boolean;
  chartType?: 'line' | 'bar' | 'area' | 'composed';
  height?: number;
}

export default function MonthlyTrendChart({ 
  data, 
  loading = false,
  chartType = 'composed',
  height = 300
}: MonthlyTrendChartProps) {
  // 차트 데이터 포맷팅
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // 샘플 데이터 (빈 상태 표시용)
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 12 }, (_, i) => ({
        month: `${i + 1}월`,
        revenue: 0,
        expense: 0,
        profit: 0,
        vat: 0
      }));
    }

    return data.map(item => ({
      month: `${item.month}월`,
      revenue: item.매출 || 0,  // MonthlyTrend 인터페이스에 맞게 수정
      expense: item.매입 || 0,  // MonthlyTrend 인터페이스에 맞게 수정
      profit: (item.매출 || 0) - (item.매입 || 0),
      vat: Math.floor((item.매출 || 0) * 0.1)  // 부가세 10% 계산
    }));
  }, [data]);

  // 금액 포맷팅 함수
  const formatValue = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    }
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(0)}천만`;
    }
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만`;
    }
    return value.toLocaleString();
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-border-light">
          <p className="text-sm font-semibold text-txt-primary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-txt-secondary">{entry.name}:</span>
              </span>
              <span className="font-medium text-txt-primary">
                ₩{formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // 차트 색상
  const colors = {
    revenue: '#10b981', // green-500
    expense: '#ef4444', // red-500
    profit: '#3b82f6', // blue-500
    vat: '#f59e0b' // amber-500
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-bg-secondary rounded w-32"></div>
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-bg-secondary rounded"></div>
              <div className="h-8 w-20 bg-bg-secondary rounded"></div>
            </div>
          </div>
          <div className="h-64 bg-bg-secondary rounded"></div>
        </div>
      </Card>
    );
  }

  // 차트 컴포넌트 렌더링
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    const commonAxisProps = {
      stroke: '#e5e7eb',
      fontSize: 12
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" {...commonAxisProps} />
            <YAxis tickFormatter={formatValue} {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke={colors.revenue} 
              strokeWidth={2}
              name="매출"
              dot={{ fill: colors.revenue, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              stroke={colors.expense} 
              strokeWidth={2}
              name="매입"
              dot={{ fill: colors.expense, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke={colors.profit} 
              strokeWidth={2}
              name="순이익"
              dot={{ fill: colors.profit, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" {...commonAxisProps} />
            <YAxis tickFormatter={formatValue} {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="revenue" fill={colors.revenue} name="매출" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill={colors.expense} name="매입" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" {...commonAxisProps} />
            <YAxis tickFormatter={formatValue} {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stackId="1"
              stroke={colors.revenue} 
              fill={colors.revenue}
              fillOpacity={0.6}
              name="매출"
            />
            <Area 
              type="monotone" 
              dataKey="expense" 
              stackId="2"
              stroke={colors.expense} 
              fill={colors.expense}
              fillOpacity={0.6}
              name="매입"
            />
          </AreaChart>
        );

      case 'composed':
      default:
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" {...commonAxisProps} />
            <YAxis tickFormatter={formatValue} {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="revenue" 
              fill={colors.revenue} 
              name="매출" 
              radius={[4, 4, 0, 0]}
              fillOpacity={0.8}
            />
            <Bar 
              dataKey="expense" 
              fill={colors.expense} 
              name="매입" 
              radius={[4, 4, 0, 0]}
              fillOpacity={0.8}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke={colors.profit} 
              strokeWidth={2}
              name="순이익"
              dot={{ fill: colors.profit, r: 3 }}
            />
          </ComposedChart>
        );
    }
  };

  // 차트 타입 버튼
  const chartTypeButtons = [
    { type: 'composed', icon: TrendingUp, label: '복합' },
    { type: 'bar', icon: BarChart3, label: '막대' },
    { type: 'line', icon: Activity, label: '라인' }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Typography variant="h3" className="text-lg font-semibold text-txt-primary">
          월별 매출 트렌드
        </Typography>
        
        {/* 차트 타입 선택 버튼 (옵션) */}
        {/* <div className="flex gap-1">
          {chartTypeButtons.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setChartType(type as any)}
              className={`p-2 rounded-md transition-colors ${
                chartType === type 
                  ? 'bg-weave-primary text-white' 
                  : 'bg-bg-secondary text-txt-secondary hover:bg-bg-tertiary'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div> */}
      </div>

      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-txt-tertiary mx-auto mb-3" />
            <Typography variant="body1" className="text-txt-tertiary">
              거래 데이터가 없습니다
            </Typography>
            <Typography variant="body2" className="text-txt-tertiary mt-1">
              거래를 입력하면 차트가 자동으로 생성됩니다
            </Typography>
          </div>
        </div>
      )}

      {/* 통계 요약 (옵션) */}
      {data && data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-light grid grid-cols-3 gap-4">
          <div>
            <Typography variant="body2" className="text-txt-tertiary mb-1">
              평균 매출
            </Typography>
            <Typography variant="body1" className="font-semibold text-green-600">
              ₩{formatValue(chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length)}
            </Typography>
          </div>
          <div>
            <Typography variant="body2" className="text-txt-tertiary mb-1">
              평균 매입
            </Typography>
            <Typography variant="body1" className="font-semibold text-red-600">
              ₩{formatValue(chartData.reduce((sum, d) => sum + d.expense, 0) / chartData.length)}
            </Typography>
          </div>
          <div>
            <Typography variant="body2" className="text-txt-tertiary mb-1">
              평균 순이익
            </Typography>
            <Typography variant="body1" className="font-semibold text-blue-600">
              ₩{formatValue(chartData.reduce((sum, d) => sum + d.profit, 0) / chartData.length)}
            </Typography>
          </div>
        </div>
      )}
    </Card>
  );
}