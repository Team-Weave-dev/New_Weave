'use client';

import React, { useEffect, useState } from 'react';
import { taxTransactionService } from '@/lib/services/supabase/tax-transactions.service';
import type { YearlyProjection, MonthlyTrend } from '@/lib/services/supabase/tax-transactions.service';
import YearlyProjectionCard from './cards/YearlyProjectionCard';
import MonthlyRevenueCard from './cards/MonthlyRevenueCard';
import TaxDeadlineCard from './cards/TaxDeadlineCard';
import MonthlyTrendChart from './charts/MonthlyTrendChart';

export default function TaxOverview() {
  const [projection, setProjection] = useState<YearlyProjection | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      const year = new Date().getFullYear();
      
      // 병렬로 데이터 로드
      const [projectionData, trendData] = await Promise.all([
        taxTransactionService.getYearlyProjection(year),
        taxTransactionService.getMonthlyTrend(year)
      ]);
      
      setProjection(projectionData);
      setMonthlyTrend(trendData);
    } catch (error) {
      console.error('Failed to load overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 매출 예상 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <YearlyProjectionCard 
          projection={projection} 
          loading={loading}
        />
        <MonthlyRevenueCard 
          projection={projection} 
          loading={loading}
        />
        <TaxDeadlineCard 
          loading={loading}
        />
      </div>

      {/* 월별 매출 트렌드 차트 */}
      <MonthlyTrendChart 
        data={monthlyTrend}
        loading={loading}
        chartType="composed"
        height={300}
      />
    </div>
  );
}