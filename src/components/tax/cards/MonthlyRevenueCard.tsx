'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { YearlyProjection } from '@/lib/services/supabase/tax-transactions.service';

interface MonthlyRevenueCardProps {
  projection: YearlyProjection | null;
  loading?: boolean;
  currentMonth?: number;
  currentYear?: number;
}

export default function MonthlyRevenueCard({ 
  projection, 
  loading = false,
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear()
}: MonthlyRevenueCardProps) {
  // 전월 대비 증감률 계산
  const calculateMonthGrowth = () => {
    if (!projection || !projection.previousMonthRevenue || projection.previousMonthRevenue === 0) {
      return null;
    }
    const growth = ((projection.currentMonthRevenue / projection.previousMonthRevenue - 1) * 100);
    return growth;
  };

  const monthGrowth = calculateMonthGrowth();

  // 증감률에 따른 스타일 결정
  const getTrendStyle = (rate: number | null) => {
    if (rate === null || rate === 0) {
      return {
        icon: Minus,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        label: '변동 없음'
      };
    }
    if (rate > 0) {
      return {
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: '증가'
      };
    }
    return {
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      label: '감소'
    };
  };

  const trend = getTrendStyle(monthGrowth);

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

  const currentRevenue = projection?.currentMonthRevenue || 0;
  const previousRevenue = projection?.previousMonthRevenue || 0;

  // 월 이름 배열
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${trend.bgColor} rounded-lg transition-transform group-hover:scale-110`}>
          <DollarSign className={`w-6 h-6 ${trend.color}`} />
        </div>
        <span className="text-xs text-txt-tertiary font-medium">
          {currentYear}년 {monthNames[currentMonth - 1]}
        </span>
      </div>

      <div className="mb-4">
        <Typography variant="h3" className="text-2xl font-bold text-txt-primary mb-1">
          ₩{formatAmount(currentRevenue)}
        </Typography>
        <Typography variant="body2" className="text-txt-secondary">
          이번 달 매출
        </Typography>
      </div>

      {/* 전월 대비 증감 표시 */}
      <div className="pt-3 border-t border-border-light">
        {monthGrowth !== null ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-txt-tertiary">전월 대비</span>
              <div className={`flex items-center gap-1 ${trend.color}`}>
                {monthGrowth > 0 ? '↑' : monthGrowth < 0 ? '↓' : '→'}
                <span className="font-semibold">
                  {Math.abs(monthGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            
            {/* 전월 매출액 표시 */}
            {previousRevenue > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-txt-tertiary">
                  {monthNames[(currentMonth - 2 + 12) % 12]} 매출
                </span>
                <span className="text-txt-secondary">
                  ₩{formatAmount(previousRevenue)}
                </span>
              </div>
            )}

            {/* 증감액 표시 */}
            {monthGrowth !== 0 && (
              <div className="mt-2 text-xs text-center">
                <span className={`${trend.color} font-medium`}>
                  {monthGrowth > 0 ? '+' : ''}₩{formatAmount(Math.abs(currentRevenue - previousRevenue))}
                </span>
              </div>
            )}
          </>
        ) : (
          <Typography variant="body2" className="text-txt-tertiary text-center">
            전월 데이터 없음
          </Typography>
        )}
      </div>

      {/* 진행률 바 (선택적) */}
      {projection && projection.monthlyTarget && (
        <div className="mt-3 pt-3 border-t border-border-light">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-txt-tertiary">목표 달성률</span>
            <span className="text-txt-secondary font-medium">
              {Math.min(100, (currentRevenue / projection.monthlyTarget * 100)).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-bg-secondary rounded-full h-2">
            <div 
              className="bg-weave-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (currentRevenue / projection.monthlyTarget * 100))}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}