'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Filter,
  X,
  ChevronDown
} from 'lucide-react';
import TransactionTable from '../table/TransactionTable';
import StatisticsCards from '../cards/StatisticsCards';
import { 
  fetchProjects,
  fetchClients,
  type Project,
  type Client
} from '@/lib/services/supabase/project-matching.service';
import {
  calculateProjectProfitability,
  calculateProjectProfitabilityTrend,
  type ProjectProfitability
} from '@/lib/services/supabase/project-profitability.service';
import { 
  fetchTransactionsWithPagination,
  type Transaction
} from '@/lib/services/supabase/tax-transactions.service';
import { exportTransactionsToExcel } from '@/lib/utils/tax-export';
import { formatFullCurrency } from '@/lib/utils/tax-formatters';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function ProjectTransactionView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profitability, setProfitability] = useState<ProjectProfitability | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  // 프로젝트 선택 시 데이터 로드
  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject.id);
    }
  }, [selectedProject, trendPeriod]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [clientsData, projectsData] = await Promise.all([
        fetchClients(),
        fetchProjects()
      ]);
      setClients(clientsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async (projectId: string) => {
    setLoading(true);
    try {
      // 프로젝트 거래 조회
      const txResponse = await fetchTransactionsWithPagination({
        filters: { project_id: projectId },
        sortField: 'transaction_date',
        sortOrder: 'desc'
      });
      setTransactions(txResponse.data);

      // 수익성 계산
      const prof = await calculateProjectProfitability(projectId);
      setProfitability(prof);

      // 트렌드 데이터
      const trend = await calculateProjectProfitabilityTrend(projectId, trendPeriod);
      setTrendData(trend);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = async (client: Client) => {
    setSelectedClient(client);
    // 클라이언트의 프로젝트만 필터링
    const clientProjects = await fetchProjects(client.id);
    setProjects(clientProjects);
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setShowProjectSelector(false);
  };

  const handleExport = () => {
    if (selectedProject) {
      exportTransactionsToExcel(
        transactions,
        `${selectedProject.name}_거래내역_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    }
  };

  // 차트 데이터 포매터
  const formatChartData = (data: any[]) => {
    return data.map(item => ({
      ...item,
      date: trendPeriod === 'monthly' 
        ? `${item.date}-01` 
        : item.date,
      displayDate: trendPeriod === 'monthly'
        ? new Date(item.date + '-01').toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })
        : new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    }));
  };

  if (loading && !selectedProject) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-secondary rounded w-1/3"></div>
          <div className="h-64 bg-bg-secondary rounded"></div>
        </div>
      </Card>
    );
  }

  // 프로젝트 선택 화면
  if (showProjectSelector || !selectedProject) {
    return (
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Typography variant="h2" className="text-xl font-bold mb-2">
              프로젝트 선택
            </Typography>
            <Typography variant="body2" className="text-txt-secondary">
              거래 내역을 확인할 프로젝트를 선택하세요
            </Typography>
          </div>

          {/* 클라이언트 필터 */}
          <div>
            <Typography variant="body2" className="font-medium mb-3">
              1. 클라이언트 선택 (선택사항)
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setSelectedClient(null);
                  loadInitialData();
                }}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  !selectedClient 
                    ? 'border-weave-primary bg-blue-50' 
                    : 'border-border-light hover:bg-bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-txt-tertiary" />
                  <Typography variant="body2" className="font-medium">
                    전체 클라이언트
                  </Typography>
                </div>
              </button>
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selectedClient?.id === client.id 
                      ? 'border-weave-primary bg-blue-50' 
                      : 'border-border-light hover:bg-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-txt-tertiary" />
                    <div>
                      <Typography variant="body2" className="font-medium">
                        {client.name}
                      </Typography>
                      {client.business_number && (
                        <Typography variant="body2" className="text-xs text-txt-tertiary">
                          {client.business_number}
                        </Typography>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 프로젝트 목록 */}
          <div>
            <Typography variant="body2" className="font-medium mb-3">
              2. 프로젝트 선택
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className="p-4 border border-border-light rounded-lg text-left hover:bg-bg-secondary transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-weave-primary mt-1" />
                    <div className="flex-1">
                      <Typography variant="body2" className="font-medium mb-1">
                        {project.name}
                      </Typography>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-txt-tertiary">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-medium
                            ${project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              project.status === 'completed' ? 'bg-green-100 text-green-700' :
                              project.status === 'planning' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-700'}`}>
                            {project.status === 'in_progress' ? '진행중' :
                             project.status === 'completed' ? '완료' :
                             project.status === 'planning' ? '계획중' : '취소'}
                          </span>
                        </div>
                        <Typography variant="body2" className="text-xs text-txt-tertiary">
                          {new Date(project.start_date).toLocaleDateString('ko-KR')}
                          {project.end_date && ` ~ ${new Date(project.end_date).toLocaleDateString('ko-KR')}`}
                        </Typography>
                        {project.budget && (
                          <Typography variant="body2" className="text-xs text-txt-tertiary">
                            예산: {formatFullCurrency(project.budget)}
                          </Typography>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 프로젝트 상세 뷰
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-weave-primary-light rounded-lg">
              <Briefcase className="w-6 h-6 text-weave-primary" />
            </div>
            <div>
              <Typography variant="h2" className="text-xl font-bold mb-1">
                {selectedProject.name}
              </Typography>
              <div className="flex items-center gap-4 text-sm text-txt-secondary">
                {selectedProject.client && (
                  <div className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {selectedProject.client.name}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedProject.start_date).toLocaleDateString('ko-KR')}
                  {selectedProject.end_date && ` ~ ${new Date(selectedProject.end_date).toLocaleDateString('ko-KR')}`}
                </div>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                  ${selectedProject.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    selectedProject.status === 'completed' ? 'bg-green-100 text-green-700' :
                    selectedProject.status === 'planning' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-700'}`}>
                  {selectedProject.status === 'in_progress' ? '진행중' :
                   selectedProject.status === 'completed' ? '완료' :
                   selectedProject.status === 'planning' ? '계획중' : '취소'}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProjectSelector(true)}
          >
            프로젝트 변경
          </Button>
        </div>
      </Card>

      {/* 수익성 요약 */}
      {profitability && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="text-txt-secondary">
                총 매출
              </Typography>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <Typography variant="h3" className="text-xl font-bold text-blue-600">
              {formatFullCurrency(profitability.totalRevenue)}
            </Typography>
            <Typography variant="body2" className="text-xs text-txt-tertiary mt-1">
              {profitability.revenueTransactions}건
            </Typography>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="text-txt-secondary">
                총 매입
              </Typography>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <Typography variant="h3" className="text-xl font-bold text-red-600">
              {formatFullCurrency(profitability.totalExpense)}
            </Typography>
            <Typography variant="body2" className="text-xs text-txt-tertiary mt-1">
              {profitability.expenseTransactions}건
            </Typography>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="text-txt-secondary">
                순이익
              </Typography>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <Typography variant="h3" className={`text-xl font-bold ${
              profitability.netProfit > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatFullCurrency(profitability.netProfit)}
            </Typography>
            <Typography variant="body2" className="text-xs text-txt-tertiary mt-1">
              이익률 {profitability.profitMargin.toFixed(1)}%
            </Typography>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="text-txt-secondary">
                ROI
              </Typography>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <Typography variant="h3" className={`text-xl font-bold ${
              profitability.roi > 0 ? 'text-purple-600' : 'text-red-600'
            }`}>
              {profitability.roi.toFixed(1)}%
            </Typography>
            <Typography variant="body2" className="text-xs text-txt-tertiary mt-1">
              투자수익률
            </Typography>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="text-txt-secondary">
                진행률
              </Typography>
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
            <Typography variant="h3" className="text-xl font-bold text-orange-600">
              {profitability.completionRate.toFixed(0)}%
            </Typography>
            {selectedProject.budget && (
              <Typography variant="body2" className="text-xs text-txt-tertiary mt-1">
                예산 사용률 {profitability.budgetUtilization.toFixed(0)}%
              </Typography>
            )}
          </Card>
        </div>
      )}

      {/* 수익 트렌드 차트 */}
      {trendData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h3" className="text-lg font-semibold">
              수익 트렌드
            </Typography>
            <select
              value={trendPeriod}
              onChange={(e) => setTrendPeriod(e.target.value as any)}
              className="text-sm px-3 py-1 border border-border-light rounded-lg"
            >
              <option value="daily">일별</option>
              <option value="weekly">주별</option>
              <option value="monthly">월별</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={formatChartData(trendData)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                formatter={(value: number) => formatFullCurrency(value)}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stackId="1"
                stroke="#3B82F6" 
                fill="#93C5FD"
                name="매출"
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stackId="2"
                stroke="#EF4444" 
                fill="#FCA5A5"
                name="매입"
              />
              <Line 
                type="monotone" 
                dataKey="cumulativeProfit" 
                stroke="#10B981" 
                strokeWidth={2}
                name="누적 수익"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* 거래 내역 테이블 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="h3" className="text-lg font-semibold">
            거래 내역 ({transactions.length}건)
          </Typography>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel 다운로드
          </Button>
        </div>
        <TransactionTable
          transactions={transactions}
          loading={loading}
          selectable={false}
          editable={false}
        />
      </Card>
    </div>
  );
}