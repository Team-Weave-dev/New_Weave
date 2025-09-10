import { createClient } from '@/lib/services/supabase/client';
import type { Project } from './project-matching.service';
import type { Transaction } from './tax-transactions.service';

export interface ProjectProfitability {
  projectId: string;
  projectName: string;
  clientId?: string;
  clientName?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  budget?: number;
  totalRevenue: number;       // 총 매출
  totalExpense: number;       // 총 매입
  totalVat: number;          // 총 부가세
  netProfit: number;         // 순이익 (매출 - 매입)
  profitMargin: number;      // 이익률 (%)
  roi: number;               // ROI (투자수익률) %
  transactionCount: number;  // 거래 건수
  revenueTransactions: number;  // 매출 건수
  expenseTransactions: number;  // 매입 건수
  avgTransactionValue: number;  // 평균 거래 금액
  completionRate: number;    // 프로젝트 진행률 (%)
  budgetUtilization: number; // 예산 사용률 (%)
  lastTransactionDate?: string; // 마지막 거래일
}

export interface ProfitabilityAggregates {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
  avgProfitMargin: number;
  avgROI: number;
  bestProject?: ProjectProfitability;
  worstProject?: ProjectProfitability;
}

/**
 * 프로젝트별 수익성 계산
 */
export async function calculateProjectProfitability(
  projectId: string
): Promise<ProjectProfitability | null> {
  const supabase = createClient();

  try {
    // 프로젝트 정보 조회
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Project not found:', projectError);
      return null;
    }

    // 프로젝트 관련 거래 조회
    const { data: transactions, error: transError } = await supabase
      .from('tax_transactions')
      .select('*')
      .eq('project_id', projectId);

    if (transError) {
      console.error('Error fetching transactions:', transError);
      return null;
    }

    const txns = transactions || [];

    // 수익성 메트릭 계산
    let totalRevenue = 0;
    let totalExpense = 0;
    let totalVat = 0;
    let revenueTransactions = 0;
    let expenseTransactions = 0;
    let lastTransactionDate: string | undefined;

    txns.forEach(txn => {
      const amount = Number(txn.total_amount);
      const vat = Number(txn.vat_amount);

      if (txn.transaction_type === 'sale') {
        totalRevenue += amount;
        revenueTransactions++;
      } else {
        totalExpense += amount;
        expenseTransactions++;
      }

      totalVat += vat;

      // 마지막 거래일 추적
      if (!lastTransactionDate || txn.transaction_date > lastTransactionDate) {
        lastTransactionDate = txn.transaction_date;
      }
    });

    const netProfit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const roi = totalExpense > 0 ? (netProfit / totalExpense) * 100 : 0;
    const avgTransactionValue = txns.length > 0 ? (totalRevenue + totalExpense) / txns.length : 0;

    // 프로젝트 진행률 계산 (날짜 기반)
    let completionRate = 0;
    if (project.status === 'completed') {
      completionRate = 100;
    } else if (project.status === 'in_progress' && project.start_date) {
      const start = new Date(project.start_date).getTime();
      const now = new Date().getTime();
      const end = project.end_date ? new Date(project.end_date).getTime() : now;
      
      if (end > start) {
        completionRate = Math.min(100, ((now - start) / (end - start)) * 100);
      }
    }

    // 예산 사용률 계산
    const budgetUtilization = project.budget ? (totalExpense / project.budget) * 100 : 0;

    return {
      projectId: project.id,
      projectName: project.name,
      clientId: project.client_id,
      clientName: project.client?.name,
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      budget: project.budget,
      totalRevenue,
      totalExpense,
      totalVat,
      netProfit,
      profitMargin,
      roi,
      transactionCount: txns.length,
      revenueTransactions,
      expenseTransactions,
      avgTransactionValue,
      completionRate,
      budgetUtilization,
      lastTransactionDate
    };
  } catch (error) {
    console.error('Error calculating project profitability:', error);
    return null;
  }
}

/**
 * 여러 프로젝트의 수익성 계산
 */
export async function calculateMultipleProjectsProfitability(
  projectIds?: string[]
): Promise<ProjectProfitability[]> {
  const supabase = createClient();

  try {
    // 프로젝트 조회 쿼리
    let projectQuery = supabase
      .from('projects')
      .select(`
        *,
        client:clients(*)
      `);

    if (projectIds && projectIds.length > 0) {
      projectQuery = projectQuery.in('id', projectIds);
    }

    const { data: projects, error: projectError } = await projectQuery;

    if (projectError || !projects) {
      console.error('Error fetching projects:', projectError);
      return [];
    }

    // 모든 프로젝트의 수익성 계산
    const profitabilities = await Promise.all(
      projects.map(project => calculateProjectProfitability(project.id))
    );

    return profitabilities.filter((p): p is ProjectProfitability => p !== null);
  } catch (error) {
    console.error('Error calculating multiple projects profitability:', error);
    return [];
  }
}

/**
 * 클라이언트별 프로젝트 수익성 계산
 */
export async function calculateClientProfitability(
  clientId: string
): Promise<ProjectProfitability[]> {
  const supabase = createClient();

  try {
    // 클라이언트의 모든 프로젝트 조회
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', clientId);

    if (error || !projects) {
      console.error('Error fetching client projects:', error);
      return [];
    }

    const projectIds = projects.map(p => p.id);
    return calculateMultipleProjectsProfitability(projectIds);
  } catch (error) {
    console.error('Error calculating client profitability:', error);
    return [];
  }
}

/**
 * 전체 프로젝트 수익성 집계
 */
export async function getProjectProfitabilityAggregates(
  filters?: {
    status?: 'planning' | 'in_progress' | 'completed' | 'cancelled';
    clientId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ProfitabilityAggregates> {
  const supabase = createClient();

  try {
    // 필터링된 프로젝트 조회
    let query = supabase.from('projects').select('id, status');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters?.startDate) {
      query = query.gte('start_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('start_date', filters.endDate);
    }

    const { data: projects, error } = await query;

    if (error || !projects) {
      console.error('Error fetching projects for aggregates:', error);
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalRevenue: 0,
        totalExpense: 0,
        totalProfit: 0,
        avgProfitMargin: 0,
        avgROI: 0
      };
    }

    // 모든 프로젝트의 수익성 계산
    const projectIds = projects.map(p => p.id);
    const profitabilities = await calculateMultipleProjectsProfitability(projectIds);

    // 집계 데이터 계산
    let totalRevenue = 0;
    let totalExpense = 0;
    let totalProfit = 0;
    let bestProject: ProjectProfitability | undefined;
    let worstProject: ProjectProfitability | undefined;

    profitabilities.forEach(p => {
      totalRevenue += p.totalRevenue;
      totalExpense += p.totalExpense;
      totalProfit += p.netProfit;

      // 최고/최악 프로젝트 추적
      if (!bestProject || p.profitMargin > bestProject.profitMargin) {
        bestProject = p;
      }
      if (!worstProject || p.profitMargin < worstProject.profitMargin) {
        worstProject = p;
      }
    });

    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    
    const avgProfitMargin = profitabilities.length > 0
      ? profitabilities.reduce((sum, p) => sum + p.profitMargin, 0) / profitabilities.length
      : 0;
    
    const avgROI = profitabilities.length > 0
      ? profitabilities.reduce((sum, p) => sum + p.roi, 0) / profitabilities.length
      : 0;

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      totalRevenue,
      totalExpense,
      totalProfit,
      avgProfitMargin,
      avgROI,
      bestProject,
      worstProject
    };
  } catch (error) {
    console.error('Error getting profitability aggregates:', error);
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalRevenue: 0,
      totalExpense: 0,
      totalProfit: 0,
      avgProfitMargin: 0,
      avgROI: 0
    };
  }
}

/**
 * 프로젝트 수익성 순위
 */
export async function getProjectProfitabilityRanking(
  limit: number = 10,
  sortBy: 'profit' | 'margin' | 'roi' | 'revenue' = 'profit'
): Promise<ProjectProfitability[]> {
  const profitabilities = await calculateMultipleProjectsProfitability();

  // 정렬
  profitabilities.sort((a, b) => {
    switch (sortBy) {
      case 'profit':
        return b.netProfit - a.netProfit;
      case 'margin':
        return b.profitMargin - a.profitMargin;
      case 'roi':
        return b.roi - a.roi;
      case 'revenue':
        return b.totalRevenue - a.totalRevenue;
      default:
        return b.netProfit - a.netProfit;
    }
  });

  return profitabilities.slice(0, limit);
}

/**
 * 프로젝트 수익성 트렌드 계산
 */
export async function calculateProjectProfitabilityTrend(
  projectId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Promise<Array<{
  date: string;
  revenue: number;
  expense: number;
  profit: number;
  cumulativeProfit: number;
}>> {
  const supabase = createClient();

  try {
    // 프로젝트 거래 조회
    const { data: transactions, error } = await supabase
      .from('tax_transactions')
      .select('*')
      .eq('project_id', projectId)
      .order('transaction_date', { ascending: true });

    if (error || !transactions) {
      console.error('Error fetching transactions for trend:', error);
      return [];
    }

    // 날짜별 그룹핑
    const grouped = new Map<string, {
      revenue: number;
      expense: number;
    }>();

    transactions.forEach(txn => {
      const date = new Date(txn.transaction_date);
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!grouped.has(key)) {
        grouped.set(key, { revenue: 0, expense: 0 });
      }

      const group = grouped.get(key)!;
      const amount = Number(txn.total_amount);

      if (txn.transaction_type === 'sale') {
        group.revenue += amount;
      } else {
        group.expense += amount;
      }
    });

    // 트렌드 데이터 생성
    const trend: Array<{
      date: string;
      revenue: number;
      expense: number;
      profit: number;
      cumulativeProfit: number;
    }> = [];

    let cumulativeProfit = 0;

    Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, data]) => {
        const profit = data.revenue - data.expense;
        cumulativeProfit += profit;

        trend.push({
          date,
          revenue: data.revenue,
          expense: data.expense,
          profit,
          cumulativeProfit
        });
      });

    return trend;
  } catch (error) {
    console.error('Error calculating profitability trend:', error);
    return [];
  }
}