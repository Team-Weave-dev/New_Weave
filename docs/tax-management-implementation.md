# 세무 관리 시스템 구현 가이드

## 📦 주요 컴포넌트 구현 예시

### 1. 메인 페이지 구조 (tax-management/page.tsx)

```tsx
'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { DataPageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Calculator, FileSpreadsheet, FileText } from 'lucide-react';
import TaxOverview from '@/components/tax/TaxOverview';
import TaxTransactions from '@/components/tax/TaxTransactions';
import TaxFiling from '@/components/tax/TaxFiling';

export default function TaxManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '개요', icon: Calculator },
    { id: 'transactions', label: '매입매출 상세', icon: FileSpreadsheet },
    { id: 'filing', label: '세무 신고', icon: FileText }
  ];

  return (
    <AppLayout>
      <DataPageContainer>
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-weave-primary-light rounded-lg">
              <Calculator className="w-6 h-6 text-weave-primary" />
            </div>
            <div>
              <Typography variant="h2" className="text-2xl mb-1 text-txt-primary">
                세무 관리
              </Typography>
              <Typography variant="body1" className="text-txt-secondary">
                매입매출 관리와 세무 신고를 한 곳에서 처리하세요
              </Typography>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex items-center gap-2 border-b border-border-light">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-weave-primary text-weave-primary'
                    : 'border-transparent text-txt-secondary hover:text-txt-primary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'overview' && <TaxOverview />}
        {activeTab === 'transactions' && <TaxTransactions />}
        {activeTab === 'filing' && <TaxFiling />}
      </DataPageContainer>
    </AppLayout>
  );
}
```

### 2. 개요 탭 컴포넌트 (TaxOverview.tsx)

```tsx
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { taxTransactionService } from '@/lib/services/supabase/tax-transactions.service';
import MonthlyTrendChart from './MonthlyTrendChart';

interface YearlyProjection {
  expectedRevenue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  growthRate: number;
}

export default function TaxOverview() {
  const [projection, setProjection] = useState<YearlyProjection | null>(null);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    const year = new Date().getFullYear();
    const data = await taxTransactionService.getYearlyProjection(year);
    setProjection(data);
    
    const monthly = await taxTransactionService.getMonthlyTrend(year);
    setMonthlyData(monthly);
  };

  return (
    <div className="space-y-6">
      {/* 매출 예상 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 당해연도 매출 예상 */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-txt-tertiary">
              {new Date().getFullYear()}년
            </span>
          </div>
          <Typography variant="h3" className="text-2xl font-bold text-txt-primary mb-1">
            ₩{projection?.expectedRevenue.toLocaleString() || 0}
          </Typography>
          <Typography variant="body2" className="text-txt-secondary">
            연간 매출 예상
          </Typography>
          {projection?.growthRate && (
            <div className={`mt-2 text-sm ${projection.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {projection.growthRate > 0 ? '↑' : '↓'} {Math.abs(projection.growthRate)}% 
              <span className="text-txt-tertiary"> vs 작년</span>
            </div>
          )}
        </Card>

        {/* 당월 매출 예상 */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-txt-tertiary">
              {new Date().getMonth() + 1}월
            </span>
          </div>
          <Typography variant="h3" className="text-2xl font-bold text-txt-primary mb-1">
            ₩{projection?.currentMonthRevenue.toLocaleString() || 0}
          </Typography>
          <Typography variant="body2" className="text-txt-secondary">
            이번 달 매출
          </Typography>
          <div className="mt-2 text-sm text-txt-tertiary">
            전월 대비 {projection?.previousMonthRevenue ? 
              `${((projection.currentMonthRevenue / projection.previousMonthRevenue - 1) * 100).toFixed(1)}%` 
              : '-%'}
          </div>
        </Card>

        {/* 다음 신고 일정 */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-txt-tertiary">다음 신고</span>
          </div>
          <Typography variant="h3" className="text-2xl font-bold text-txt-primary mb-1">
            D-15
          </Typography>
          <Typography variant="body2" className="text-txt-secondary">
            부가가치세 신고
          </Typography>
          <div className="mt-2 text-sm text-orange-600">
            2025년 1월 25일 마감
          </div>
        </Card>
      </div>

      {/* 월별 매출 트렌드 차트 */}
      <Card className="p-6">
        <Typography variant="h3" className="text-lg font-semibold text-txt-primary mb-6">
          월별 매출 트렌드
        </Typography>
        <MonthlyTrendChart data={monthlyData} />
      </Card>
    </div>
  );
}
```

### 3. 매입매출 상세 탭 (TaxTransactions.tsx)

```tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { Filter, Download, Upload, Plus } from 'lucide-react';
import TransactionTable from './TransactionTable';
import TransactionCards from './TransactionCards';
import TransactionFilter from './TransactionFilter';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { taxTransactionService } from '@/lib/services/supabase/tax-transactions.service';

export default function TaxTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'thisMonth',
    transactionType: 'all',
    projectId: null,
    clientId: null
  });
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    const data = await taxTransactionService.getTransactions(filters);
    setTransactions(data);
  };

  return (
    <div className="space-y-6">
      {/* 툴바 */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="w-4 h-4 mr-2" />
            필터
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            엑셀 업로드
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            거래 추가
          </Button>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilter && (
        <Card className="p-4">
          <TransactionFilter 
            filters={filters}
            onFilterChange={setFilters}
          />
        </Card>
      )}

      {/* 거래 목록 */}
      <Card className="overflow-hidden">
        {isMobile ? (
          <TransactionCards transactions={transactions} />
        ) : (
          <TransactionTable transactions={transactions} />
        )}
      </Card>
    </div>
  );
}
```

### 4. 거래 테이블 컴포넌트 (TransactionTable.tsx)

```tsx
import React from 'react';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { Edit2, Trash2, Link } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: '매입' | '매출';
  project_name?: string;
  supplier_name: string;
  supply_amount: number;
  vat_amount: number;
  withholding_tax_3_3: number;
  withholding_tax_6_8: number;
  total_amount: number;
}

interface Props {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-bg-secondary border-b border-border-light">
          <tr>
            <th className="px-4 py-3 text-left">
              <Typography variant="body2" className="font-semibold text-txt-secondary">
                날짜
              </Typography>
            </th>
            <th className="px-4 py-3 text-left">
              <Typography variant="body2" className="font-semibold text-txt-secondary">
                구분
              </Typography>
            </th>
            <th className="px-4 py-3 text-left">
              <Typography variant="body2" className="font-semibold text-txt-secondary">
                프로젝트(품명)
              </Typography>
            </th>
            <th className="px-4 py-3 text-left">
              <Typography variant="body2" className="font-semibold text-txt-secondary">
                클라이언트(공급자)
              </Typography>
            </th>
            <th className="px-4 py-3 text-right">
              <Typography variant="body2" className="font-semibold text-txt-secondary">
                공급가액
              </Typography>
            </th>
            <th className="px-4 py-3 text-right">
              <Typography variant="body2" className="font-semibold text-txt-secondary">
                부가세(10%)
              </Typography>
            </th>
            <th className="px-4 py-3 text-right">
              <Typography variant="body2" className="font-semibold text-txt-secondary">
                원천세(3.3%)
              </Typography>
            </th>
            <th className="px-4 py-3 text-right">
              <Typography variant="body2" className="font-semibold text-txt-secondary">
                원천세(6.8%)
              </Typography>
            </th>
            <th className="px-4 py-3 text-right">
              <Typography variant="body2" className="font-semibold text-txt-secondary">
                합계(입금액)
              </Typography>
            </th>
            <th className="px-4 py-3 text-center">
              <Typography variant="body2" className="font-semibold text-txt-secondary">
                작업
              </Typography>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr 
              key={transaction.id}
              className="border-b border-border-light hover:bg-bg-secondary transition-colors"
            >
              <td className="px-4 py-3">
                <Typography variant="body2" className="text-txt-primary">
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </Typography>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  transaction.transaction_type === '매출' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {transaction.transaction_type}
                </span>
              </td>
              <td className="px-4 py-3">
                <Typography variant="body2" className="text-txt-primary">
                  {transaction.project_name || '-'}
                </Typography>
              </td>
              <td className="px-4 py-3">
                <Typography variant="body2" className="text-txt-primary">
                  {transaction.supplier_name}
                </Typography>
              </td>
              <td className="px-4 py-3 text-right">
                <Typography variant="body2" className="text-txt-primary">
                  ₩{transaction.supply_amount.toLocaleString()}
                </Typography>
              </td>
              <td className="px-4 py-3 text-right">
                <Typography variant="body2" className="text-txt-primary">
                  ₩{transaction.vat_amount.toLocaleString()}
                </Typography>
              </td>
              <td className="px-4 py-3 text-right">
                <Typography variant="body2" className="text-txt-primary">
                  {transaction.withholding_tax_3_3 > 0 
                    ? `₩${transaction.withholding_tax_3_3.toLocaleString()}`
                    : '-'}
                </Typography>
              </td>
              <td className="px-4 py-3 text-right">
                <Typography variant="body2" className="text-txt-primary">
                  {transaction.withholding_tax_6_8 > 0 
                    ? `₩${transaction.withholding_tax_6_8.toLocaleString()}`
                    : '-'}
                </Typography>
              </td>
              <td className="px-4 py-3 text-right">
                <Typography variant="body2" className="font-semibold text-txt-primary">
                  ₩{transaction.total_amount.toLocaleString()}
                </Typography>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                  {!transaction.project_name && (
                    <Button variant="ghost" size="sm" className="p-1">
                      <Link className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="p-1">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. 모바일 카드 뷰 (TransactionCards.tsx)

```tsx
import React from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { ChevronRight } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: '매입' | '매출';
  supplier_name: string;
  total_amount: number;
  project_name?: string;
}

interface Props {
  transactions: Transaction[];
}

export default function TransactionCards({ transactions }: Props) {
  return (
    <div className="space-y-3 p-4">
      {transactions.map((transaction) => (
        <Card 
          key={transaction.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  transaction.transaction_type === '매출' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {transaction.transaction_type}
                </span>
                <Typography variant="body2" className="text-txt-tertiary">
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </Typography>
              </div>
              
              <Typography variant="body1" className="font-medium text-txt-primary mb-1">
                {transaction.supplier_name}
              </Typography>
              
              {transaction.project_name && (
                <Typography variant="body2" className="text-txt-secondary mb-2">
                  프로젝트: {transaction.project_name}
                </Typography>
              )}
              
              <Typography variant="h3" className="text-lg font-bold text-txt-primary">
                ₩{transaction.total_amount.toLocaleString()}
              </Typography>
            </div>
            
            <ChevronRight className="w-5 h-5 text-txt-tertiary mt-1" />
          </div>
        </Card>
      ))}
    </div>
  );
}
```

### 6. 서비스 레이어 (tax-transactions.service.ts)

```typescript
import { getSupabaseClient } from '@/lib/supabase/client';

export interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: '매입' | '매출';
  project_id?: string;
  client_id?: string;
  supplier_name: string;
  business_number?: string;
  supply_amount: number;
  vat_amount: number;
  withholding_tax_3_3: number;
  withholding_tax_6_8: number;
  total_amount: number;
  category?: string;
  description?: string;
  status: string;
  document_url?: string;
  document_type?: string;
}

export interface TransactionFilters {
  dateRange?: string;
  transactionType?: 'all' | '매입' | '매출';
  projectId?: string | null;
  clientId?: string | null;
  startDate?: Date;
  endDate?: Date;
}

export interface MonthlyStats {
  year: number;
  month: number;
  totalSales: number;
  totalPurchases: number;
  vatPayable: number;
  transactionCount: number;
}

export interface YearlyProjection {
  expectedRevenue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  growthRate: number;
}

export class TaxTransactionService {
  private supabase = getSupabaseClient();

  async createTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    const { data: result, error } = await this.supabase
      .from('tax_transactions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getTransactions(filters: TransactionFilters): Promise<Transaction[]> {
    let query = this.supabase
      .from('tax_transactions')
      .select(`
        *,
        projects (
          id,
          name
        ),
        clients (
          id,
          name,
          company
        )
      `)
      .order('transaction_date', { ascending: false });

    // Apply filters
    if (filters.transactionType && filters.transactionType !== 'all') {
      query = query.eq('transaction_type', filters.transactionType);
    }

    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters.startDate) {
      query = query.gte('transaction_date', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('transaction_date', filters.endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const { data: result, error } = await this.supabase
      .from('tax_transactions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tax_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async linkToProject(transactionId: string, projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('tax_transactions')
      .update({ project_id: projectId })
      .eq('id', transactionId);

    if (error) throw error;
  }

  async getMonthlyStatistics(year: number, month: number): Promise<MonthlyStats> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { data, error } = await this.supabase
      .from('tax_monthly_summary')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .single();

    if (error) {
      // Calculate if not cached
      return this.calculateMonthlyStats(year, month);
    }

    return data;
  }

  async getYearlyProjection(year: number): Promise<YearlyProjection> {
    // Get current year data
    const { data: yearData } = await this.supabase
      .from('tax_transactions')
      .select('*')
      .eq('transaction_type', '매출')
      .gte('transaction_date', `${year}-01-01`)
      .lte('transaction_date', `${year}-12-31`);

    const currentMonth = new Date().getMonth() + 1;
    const monthlyAverage = yearData?.reduce((sum, t) => sum + t.total_amount, 0) / currentMonth || 0;
    const expectedRevenue = monthlyAverage * 12;

    // Get current and previous month revenue
    const currentMonthRevenue = yearData
      ?.filter(t => new Date(t.transaction_date).getMonth() + 1 === currentMonth)
      .reduce((sum, t) => sum + t.total_amount, 0) || 0;

    const previousMonthRevenue = yearData
      ?.filter(t => new Date(t.transaction_date).getMonth() + 1 === currentMonth - 1)
      .reduce((sum, t) => sum + t.total_amount, 0) || 0;

    // Calculate growth rate
    const { data: lastYearData } = await this.supabase
      .from('tax_transactions')
      .select('*')
      .eq('transaction_type', '매출')
      .gte('transaction_date', `${year - 1}-01-01`)
      .lte('transaction_date', `${year - 1}-12-31`);

    const lastYearTotal = lastYearData?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
    const growthRate = lastYearTotal > 0 
      ? ((expectedRevenue / lastYearTotal - 1) * 100) 
      : 0;

    return {
      expectedRevenue,
      currentMonthRevenue,
      previousMonthRevenue,
      growthRate
    };
  }

  async getMonthlyTrend(year: number) {
    const { data } = await this.supabase
      .from('tax_transactions')
      .select('*')
      .gte('transaction_date', `${year}-01-01`)
      .lte('transaction_date', `${year}-12-31`);

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      매출: 0,
      매입: 0
    }));

    data?.forEach(transaction => {
      const month = new Date(transaction.transaction_date).getMonth();
      if (transaction.transaction_type === '매출') {
        monthlyData[month].매출 += transaction.total_amount;
      } else {
        monthlyData[month].매입 += transaction.total_amount;
      }
    });

    return monthlyData;
  }

  private async calculateMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { data } = await this.supabase
      .from('tax_transactions')
      .select('*')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    const stats = {
      year,
      month,
      totalSales: 0,
      totalPurchases: 0,
      vatPayable: 0,
      transactionCount: data?.length || 0
    };

    data?.forEach(transaction => {
      if (transaction.transaction_type === '매출') {
        stats.totalSales += transaction.total_amount;
        stats.vatPayable += transaction.vat_amount;
      } else {
        stats.totalPurchases += transaction.total_amount;
        stats.vatPayable -= transaction.vat_amount; // 매입 부가세는 공제
      }
    });

    // Cache the result
    await this.supabase
      .from('tax_monthly_summary')
      .upsert(stats);

    return stats;
  }

  async exportToExcel(filters: TransactionFilters): Promise<Blob> {
    const transactions = await this.getTransactions(filters);
    
    // Excel export logic here
    // This would use a library like xlsx or exceljs
    
    return new Blob();
  }

  async bulkImportTransactions(data: Transaction[]): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 };
    
    for (const transaction of data) {
      try {
        await this.createTransaction(transaction);
        results.success++;
      } catch (error) {
        results.failed++;
      }
    }
    
    return results;
  }
}

export const taxTransactionService = new TaxTransactionService();
```

## 🚀 구현 우선순위

### Phase 1 (즉시 구현 가능)
1. 데이터베이스 마이그레이션 실행
2. 기본 API 서비스 구현
3. 탭 구조 변경

### Phase 2 (1주차)
1. 개요 탭 구현
2. 기본 거래 목록 표시

### Phase 3 (2주차)
1. 거래 CRUD 기능
2. 필터링 및 검색
3. 프로젝트 연동

### Phase 4 (3주차)
1. 엑셀 임포트/익스포트
2. 대량 편집
3. 차트 및 통계

## 💡 핵심 개선사항

### 1. 사용자 경험
- **직관적 탭 구조**: 5개→3개로 단순화
- **엑셀형 인터페이스**: 익숙한 작업 환경
- **모바일 최적화**: 카드형 뷰로 편리한 모바일 사용

### 2. 기능적 개선
- **프로젝트 연동**: 수익성 분석 가능
- **자동 계산**: 부가세, 원천세 자동 계산
- **실시간 통계**: 매출 예상 및 트렌드 분석

### 3. 기술적 개선
- **성능 최적화**: 가상 스크롤, 지연 로딩
- **실시간 동기화**: Supabase 실시간 구독
- **타입 안정성**: TypeScript 전체 적용