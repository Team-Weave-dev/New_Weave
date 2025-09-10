'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart,
  Package,
  DollarSign,
  Receipt,
  Calculator,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatFullCurrency, formatCompactKoreanCurrency } from '@/lib/utils/tax-formatters';

interface StatisticsCardsProps {
  totalSales: number;
  totalPurchases: number;
  totalVat: number;
  netAmount: number;
  transactionCount: number;
  period?: string;
  previousPeriod?: {
    totalSales: number;
    totalPurchases: number;
    totalVat: number;
    netAmount: number;
  };
}

interface StatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  format?: 'currency' | 'compact' | 'number';
  showChange?: boolean;
}

function StatCard({ 
  title, 
  value, 
  previousValue,
  icon: Icon, 
  color, 
  bgColor,
  format = 'currency',
  showChange = true
}: StatCardProps) {
  // 변화율 계산
  const changePercent = previousValue 
    ? ((value - previousValue) / previousValue * 100).toFixed(1)
    : null;
  
  const isPositive = previousValue ? value > previousValue : true;

  // 값 포맷팅
  const formatValue = (val: number) => {
    switch (format) {
      case 'compact':
        return formatCompactKoreanCurrency(val);
      case 'number':
        return val.toLocaleString('ko-KR');
      default:
        return formatFullCurrency(val);
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {showChange && changePercent && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>{Math.abs(Number(changePercent))}%</span>
          </div>
        )}
      </div>
      
      <div>
        <Typography variant="body2" className="text-txt-tertiary text-xs mb-1">
          {title}
        </Typography>
        <Typography variant="h3" className="text-xl font-bold text-txt-primary">
          {formatValue(value)}
        </Typography>
        {previousValue !== undefined && (
          <Typography variant="body2" className="text-txt-tertiary text-xs mt-1">
            이전: {formatValue(previousValue)}
          </Typography>
        )}
      </div>
    </Card>
  );
}

export default function StatisticsCards({
  totalSales,
  totalPurchases,
  totalVat,
  netAmount,
  transactionCount,
  period,
  previousPeriod
}: StatisticsCardsProps) {
  return (
    <div className="space-y-4">
      {/* 기간 표시 */}
      {period && (
        <div className="flex items-center gap-2 text-sm text-txt-secondary">
          <AlertCircle className="w-4 h-4" />
          <span>{period} 기준 통계</span>
        </div>
      )}

      {/* 주요 지표 - 2열 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 매출 */}
        <StatCard
          title="총 매출"
          value={totalSales}
          previousValue={previousPeriod?.totalSales}
          icon={TrendingUp}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />

        {/* 매입 */}
        <StatCard
          title="총 매입"
          value={totalPurchases}
          previousValue={previousPeriod?.totalPurchases}
          icon={TrendingDown}
          color="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* 순이익 강조 카드 */}
      <Card className="p-5 bg-gradient-to-r from-weave-primary-light to-blue-50 border-weave-primary">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="body2" className="text-weave-primary font-medium mb-1">
              순이익 (매출 - 매입)
            </Typography>
            <Typography variant="h2" className="text-2xl font-bold text-txt-primary">
              {formatFullCurrency(netAmount)}
            </Typography>
            {previousPeriod && (
              <div className="flex items-center gap-2 mt-2">
                <Typography variant="body2" className="text-txt-secondary text-sm">
                  이전 기간: {formatFullCurrency(previousPeriod.netAmount)}
                </Typography>
                {(() => {
                  const change = netAmount - previousPeriod.netAmount;
                  const changePercent = previousPeriod.netAmount 
                    ? (change / previousPeriod.netAmount * 100).toFixed(1)
                    : '0';
                  const isPositive = change > 0;
                  
                  return (
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {Math.abs(Number(changePercent))}%
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="p-3 bg-white/50 rounded-lg">
            <DollarSign className="w-7 h-7 text-weave-primary" />
          </div>
        </div>
      </Card>

      {/* 세부 지표 - 3열 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 부가세 */}
        <StatCard
          title="총 부가세"
          value={totalVat}
          previousValue={previousPeriod?.totalVat}
          icon={Calculator}
          color="text-purple-600"
          bgColor="bg-purple-50"
          format="compact"
          showChange={false}
        />

        {/* 거래 건수 */}
        <StatCard
          title="거래 건수"
          value={transactionCount}
          icon={Receipt}
          color="text-green-600"
          bgColor="bg-green-50"
          format="number"
          showChange={false}
        />

        {/* 평균 거래액 */}
        <StatCard
          title="평균 거래액"
          value={transactionCount > 0 ? Math.round((totalSales + totalPurchases) / transactionCount) : 0}
          icon={Package}
          color="text-orange-600"
          bgColor="bg-orange-50"
          format="compact"
          showChange={false}
        />
      </div>

      {/* 빠른 분석 */}
      <Card className="p-4 bg-bg-secondary">
        <Typography variant="body2" className="text-txt-secondary text-sm mb-2 font-medium">
          빠른 분석
        </Typography>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-txt-tertiary">매출 대비 매입 비율</span>
            <span className="font-medium text-txt-primary">
              {totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : '0'}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-txt-tertiary">이익률</span>
            <span className="font-medium text-txt-primary">
              {totalSales > 0 ? ((netAmount / totalSales) * 100).toFixed(1) : '0'}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-txt-tertiary">부가세 비율</span>
            <span className="font-medium text-txt-primary">
              {(totalSales + totalPurchases) > 0 
                ? ((totalVat / (totalSales + totalPurchases)) * 100).toFixed(1) 
                : '0'}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-txt-tertiary">일평균 거래</span>
            <span className="font-medium text-txt-primary">
              {Math.round(transactionCount / 30)}건
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}