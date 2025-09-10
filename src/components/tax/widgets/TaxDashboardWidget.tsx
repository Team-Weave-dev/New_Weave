'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Receipt,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Bell,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchMonthlyStatistics } from '@/lib/services/supabase/tax-transactions.service';
import { getTaxDeadlines } from '@/lib/services/supabase/tax-notification.service';
import { format, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TaxStatistics {
  currentMonth: {
    totalSales: number;
    totalPurchases: number;
    netVat: number;
    transactionCount: number;
  };
  previousMonth: {
    totalSales: number;
    totalPurchases: number;
  };
  growthRate: {
    sales: number;
    purchases: number;
  };
}

export default function TaxDashboardWidget() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<TaxStatistics | null>(null);
  const [nextDeadline, setNextDeadline] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 통계 데이터 로드
      const now = new Date();
      const currentMonth = await fetchMonthlyStatistics(
        now.getFullYear(),
        now.getMonth() + 1
      );
      
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const previousMonth = await fetchMonthlyStatistics(
        lastMonth.getFullYear(),
        lastMonth.getMonth() + 1
      );

      // 성장률 계산
      const salesGrowth = previousMonth.totalSales > 0
        ? ((currentMonth.totalSales - previousMonth.totalSales) / previousMonth.totalSales) * 100
        : 0;
      
      const purchasesGrowth = previousMonth.totalPurchases > 0
        ? ((currentMonth.totalPurchases - previousMonth.totalPurchases) / previousMonth.totalPurchases) * 100
        : 0;

      setStatistics({
        currentMonth: {
          totalSales: currentMonth.totalSales,
          totalPurchases: currentMonth.totalPurchases,
          netVat: currentMonth.totalSalesVat - currentMonth.totalPurchasesVat,
          transactionCount: currentMonth.transactionCount
        },
        previousMonth: {
          totalSales: previousMonth.totalSales,
          totalPurchases: previousMonth.totalPurchases
        },
        growthRate: {
          sales: salesGrowth,
          purchases: purchasesGrowth
        }
      });

      // 다음 신고 일정
      const deadlines = getTaxDeadlines(now.getFullYear(), now.getMonth() + 1);
      if (deadlines.length > 0) {
        setNextDeadline(deadlines[0]);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToTaxManagement = () => {
    router.push('/dashboard/tax-management');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-weave-primary animate-spin" />
        </div>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={navigateToTaxManagement}>
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-weave-primary" />
            <Typography variant="h3" className="text-lg font-semibold">
              세무 관리
            </Typography>
          </div>
          <ChevronRight className="w-5 h-5 text-txt-tertiary" />
        </div>

        {/* 이번 달 요약 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <Typography variant="body2" className="text-xs text-blue-600">
                매출
              </Typography>
              {statistics.growthRate.sales !== 0 && (
                <div className={`flex items-center gap-0.5 ${
                  statistics.growthRate.sales > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {statistics.growthRate.sales > 0 ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  <span className="text-xs font-medium">
                    {Math.abs(statistics.growthRate.sales).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <Typography variant="body1" className="text-lg font-bold text-blue-700">
              {(statistics.currentMonth.totalSales / 1000000).toFixed(1)}M
            </Typography>
          </div>

          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <Typography variant="body2" className="text-xs text-red-600">
                매입
              </Typography>
              {statistics.growthRate.purchases !== 0 && (
                <div className={`flex items-center gap-0.5 ${
                  statistics.growthRate.purchases > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {statistics.growthRate.purchases > 0 ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  <span className="text-xs font-medium">
                    {Math.abs(statistics.growthRate.purchases).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <Typography variant="body1" className="text-lg font-bold text-red-700">
              {(statistics.currentMonth.totalPurchases / 1000000).toFixed(1)}M
            </Typography>
          </div>
        </div>

        {/* 부가세 차액 */}
        <div className={`p-3 rounded-lg ${
          statistics.currentMonth.netVat >= 0 ? 'bg-green-50' : 'bg-orange-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="body2" className={`text-xs ${
                statistics.currentMonth.netVat >= 0 ? 'text-green-600' : 'text-orange-600'
              }`}>
                부가세 {statistics.currentMonth.netVat >= 0 ? '납부' : '환급'} 예정
              </Typography>
              <Typography variant="body1" className={`text-lg font-bold mt-1 ${
                statistics.currentMonth.netVat >= 0 ? 'text-green-700' : 'text-orange-700'
              }`}>
                {Math.abs(statistics.currentMonth.netVat).toLocaleString()}원
              </Typography>
            </div>
            <DollarSign className={`w-5 h-5 ${
              statistics.currentMonth.netVat >= 0 ? 'text-green-600' : 'text-orange-600'
            }`} />
          </div>
        </div>

        {/* 다음 신고 일정 */}
        {nextDeadline && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" className="text-xs text-yellow-600">
                  {nextDeadline.title}
                </Typography>
                <Typography variant="body2" className="text-sm font-medium text-yellow-700 mt-1">
                  D-{nextDeadline.daysRemaining}
                </Typography>
              </div>
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        )}

        {/* 빠른 액션 */}
        <div className="flex items-center justify-between pt-2 border-t border-border-light">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Receipt className="w-4 h-4 text-txt-tertiary" />
              <Typography variant="body2" className="text-xs text-txt-secondary">
                {statistics.currentMonth.transactionCount}건
              </Typography>
            </div>
            {nextDeadline && nextDeadline.daysRemaining <= 7 && (
              <div className="flex items-center gap-1">
                <Bell className="w-4 h-4 text-red-500" />
                <Typography variant="body2" className="text-xs text-red-600 font-medium">
                  신고 임박
                </Typography>
              </div>
            )}
          </div>
          <Typography variant="body2" className="text-xs text-weave-primary font-medium">
            자세히 보기 →
          </Typography>
        </div>
      </div>
    </Card>
  );
}

/**
 * 미니 세무 위젯 (더 작은 버전)
 */
export function TaxMiniWidget() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const stats = await fetchMonthlyStatistics(
        now.getFullYear(),
        now.getMonth() + 1
      );
      
      const deadlines = getTaxDeadlines(now.getFullYear(), now.getMonth() + 1);
      
      setData({
        netAmount: stats.totalSales - stats.totalPurchases,
        netVat: stats.totalSalesVat - stats.totalPurchasesVat,
        nextDeadline: deadlines[0] || null
      });
    } catch (error) {
      console.error('빠른 통계 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-4 bg-white rounded-lg border border-border-light">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 bg-white rounded-lg border border-border-light hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push('/dashboard/tax-management')}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-weave-primary" />
            <Typography variant="body2" className="text-xs text-txt-secondary">
              이번 달 순액
            </Typography>
          </div>
          <Typography variant="body1" className={`text-lg font-bold ${
            data.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {data.netAmount >= 0 ? '+' : ''}{(data.netAmount / 1000000).toFixed(1)}M
          </Typography>
        </div>
        
        {data.nextDeadline && data.nextDeadline.daysRemaining <= 7 && (
          <div className="flex flex-col items-end">
            <Bell className="w-4 h-4 text-red-500 mb-1" />
            <Typography variant="body2" className="text-xs text-red-600 font-medium">
              D-{data.nextDeadline.daysRemaining}
            </Typography>
          </div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-border-light">
        <Typography variant="body2" className="text-xs text-txt-tertiary">
          부가세: {data.netVat >= 0 ? '납부' : '환급'} {Math.abs(data.netVat).toLocaleString()}원
        </Typography>
      </div>
    </div>
  );
}

/**
 * 세무 알림 배지
 */
export function TaxNotificationBadge() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const now = new Date();
    const deadlines = getTaxDeadlines(now.getFullYear(), now.getMonth() + 1);
    const urgentCount = deadlines.filter(d => d.daysRemaining <= 7).length;
    setCount(urgentCount);
  }, []);

  if (count === 0) return null;

  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-txt-secondary" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
        {count}
      </span>
    </div>
  );
}