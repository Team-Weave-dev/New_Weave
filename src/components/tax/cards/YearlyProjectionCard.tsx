'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { YearlyProjection } from '@/lib/services/supabase/tax-transactions.service';

interface YearlyProjectionCardProps {
  projection: YearlyProjection | null;
  loading?: boolean;
  year?: number;
}

export default function YearlyProjectionCard({ 
  projection, 
  loading = false,
  year = new Date().getFullYear()
}: YearlyProjectionCardProps) {
  // 성장률에 따른 색상 및 아이콘 결정
  const getTrendIndicator = (rate: number | undefined) => {
    if (!rate || rate === 0) {
      return {
        icon: Minus,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      };
    }
    if (rate > 0) {
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      };
    }
    return {
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    };
  };

  const trend = getTrendIndicator(projection?.growthRate);
  const TrendIcon = trend.icon;

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-bg-secondary rounded-lg"></div>
          <div className="w-16 h-4 bg-bg-secondary rounded"></div>
        </div>
        <div className="h-8 bg-bg-secondary rounded mb-2"></div>
        <div className="h-4 bg-bg-secondary rounded w-2/3"></div>
      </Card>
    );
  }

  // 금액 포맷팅 함수
  const formatAmount = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    }
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(1)}천만`;
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`;
    }
    return amount.toLocaleString();
  };

  const expectedRevenue = projection?.expectedRevenue || 0;
  const growthRate = projection?.growthRate || 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${trend.bgColor} rounded-lg transition-transform group-hover:scale-110`}>
          <TrendIcon className={`w-6 h-6 ${trend.color}`} />
        </div>
        <span className="text-xs text-txt-tertiary font-medium">
          {year}년
        </span>
      </div>

      <div className="mb-4">
        <Typography variant="h3" className="text-2xl font-bold text-txt-primary mb-1">
          ₩{formatAmount(expectedRevenue)}
        </Typography>
        <Typography variant="body2" className="text-txt-secondary">
          연간 매출 예상
        </Typography>
      </div>

      {/* 성장률 표시 */}
      {projection && (
        <div className="pt-3 border-t border-border-light">
          <div className="flex items-center justify-between">
            <span className="text-sm text-txt-tertiary">전년 대비</span>
            <div className={`flex items-center gap-1 ${trend.color}`}>
              {growthRate > 0 ? '↑' : growthRate < 0 ? '↓' : '→'}
              <span className="font-semibold">
                {Math.abs(growthRate).toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* 추가 통계 */}
          {projection.previousYearRevenue > 0 && (
            <div className="mt-2 text-xs text-txt-tertiary">
              작년: ₩{formatAmount(projection.previousYearRevenue)}
            </div>
          )}
        </div>
      )}

      {/* 데이터 없음 상태 */}
      {!projection && (
        <div className="pt-3 border-t border-border-light">
          <Typography variant="body2" className="text-txt-tertiary text-center">
            데이터를 수집 중입니다
          </Typography>
        </div>
      )}
    </Card>
  );
}