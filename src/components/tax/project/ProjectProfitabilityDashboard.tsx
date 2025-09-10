'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Award,
  AlertTriangle,
  RefreshCcw,
  Download,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  calculateMultipleProjectsProfitability,
  getProjectProfitabilityAggregates,
  getProjectProfitabilityRanking,
  type ProjectProfitability,
  type ProfitabilityAggregates
} from '@/lib/services/supabase/project-profitability.service';
import { formatFullCurrency } from '@/lib/utils/tax-formatters';

export default function ProjectProfitabilityDashboard() {
  const [loading, setLoading] = useState(true);
  const [profitabilities, setProfitabilities] = useState<ProjectProfitability[]>([]);
  const [aggregates, setAggregates] = useState<ProfitabilityAggregates | null>(null);
  const [topProjects, setTopProjects] = useState<ProjectProfitability[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'profit' | 'margin' | 'roi' | 'revenue'>('profit');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'planning' | 'in_progress' | 'completed'>('all');
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year' | 'all'>('quarter');

  useEffect(() => {
    loadDashboardData();
  }, [selectedStatus, timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 필터 설정
      const filters: any = {};
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      
      // 시간 범위 필터
      const now = new Date();
      if (timeRange === 'month') {
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        filters.startDate = startDate.toISOString();
      } else if (timeRange === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        const startDate = new Date(now.getFullYear(), quarter * 3, 1);
        filters.startDate = startDate.toISOString();
      } else if (timeRange === 'year') {
        const startDate = new Date(now.getFullYear(), 0, 1);
        filters.startDate = startDate.toISOString();
      }

      // 데이터 로드
      const [profs, aggs, ranking] = await Promise.all([
        calculateMultipleProjectsProfitability(),
        getProjectProfitabilityAggregates(filters),
        getProjectProfitabilityRanking(5, selectedMetric)
      ]);

      setProfitabilities(profs);
      setAggregates(aggs);
      setTopProjects(ranking);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 차트 데이터 준비
  const prepareChartData = () => {
    return profitabilities
      .filter(p => selectedStatus === 'all' || p.status === selectedStatus)
      .slice(0, 10)
      .map(p => ({
        name: p.projectName.length > 15 ? p.projectName.substring(0, 15) + '...' : p.projectName,
        revenue: p.totalRevenue,
        expense: p.totalExpense,
        profit: p.netProfit,
        margin: p.profitMargin,
        roi: p.roi
      }));
  };

  // 파이 차트 데이터
  const preparePieData = () => {
    const statusCounts = {
      planning: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };

    profitabilities.forEach(p => {
      statusCounts[p.status]++;
    });

    return [
      { name: '계획중', value: statusCounts.planning, color: '#94A3B8' },
      { name: '진행중', value: statusCounts.in_progress, color: '#3B82F6' },
      { name: '완료', value: statusCounts.completed, color: '#10B981' },
      { name: '취소', value: statusCounts.cancelled, color: '#EF4444' }
    ].filter(item => item.value > 0);
  };

  // 메트릭 카드 색상
  const getMetricColor = (value: number, type: 'profit' | 'margin' | 'roi') => {
    if (type === 'profit') {
      return value > 0 ? 'text-green-600' : 'text-red-600';
    }
    if (type === 'margin' || type === 'roi') {
      if (value > 20) return 'text-green-600';
      if (value > 10) return 'text-yellow-600';
      if (value > 0) return 'text-orange-600';
      return 'text-red-600';
    }
    return 'text-txt-primary';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-secondary rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-bg-secondary rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-bg-secondary rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography variant="h2" className="text-2xl font-bold text-txt-primary">
            프로젝트 수익성 대시보드
          </Typography>
          <Typography variant="body2" className="text-txt-secondary mt-1">
            프로젝트별 수익성 분석 및 성과 추적
          </Typography>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 시간 범위 선택 */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary"
          >
            <option value="month">이번 달</option>
            <option value="quarter">이번 분기</option>
            <option value="year">올해</option>
            <option value="all">전체</option>
          </select>

          {/* 상태 필터 */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary"
          >
            <option value="all">전체 프로젝트</option>
            <option value="planning">계획중</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 주요 메트릭 카드 */}
      {aggregates && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 총 수익 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="text-txt-secondary">
                총 수익
              </Typography>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <Typography variant="h3" className={`text-2xl font-bold ${getMetricColor(aggregates.totalProfit, 'profit')}`}>
              {formatFullCurrency(aggregates.totalProfit)}
            </Typography>
            <Typography variant="body2" className="text-xs text-txt-tertiary mt-1">
              매출 {formatFullCurrency(aggregates.totalRevenue)} - 매입 {formatFullCurrency(aggregates.totalExpense)}
            </Typography>
          </Card>

          {/* 평균 이익률 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="text-txt-secondary">
                평균 이익률
              </Typography>
              <PieChart className="w-5 h-5 text-blue-600" />
            </div>
            <Typography variant="h3" className={`text-2xl font-bold ${getMetricColor(aggregates.avgProfitMargin, 'margin')}`}>
              {aggregates.avgProfitMargin.toFixed(1)}%
            </Typography>
            <Typography variant="body2" className="text-xs text-txt-tertiary mt-1">
              {aggregates.totalProjects}개 프로젝트 평균
            </Typography>
          </Card>

          {/* 평균 ROI */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="text-txt-secondary">
                평균 ROI
              </Typography>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <Typography variant="h3" className={`text-2xl font-bold ${getMetricColor(aggregates.avgROI, 'roi')}`}>
              {aggregates.avgROI.toFixed(1)}%
            </Typography>
            <Typography variant="body2" className="text-xs text-txt-tertiary mt-1">
              투자 대비 수익률
            </Typography>
          </Card>

          {/* 프로젝트 현황 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="text-txt-secondary">
                프로젝트 현황
              </Typography>
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <Typography variant="h3" className="text-2xl font-bold text-txt-primary">
                  {aggregates.totalProjects}
                </Typography>
                <Typography variant="body2" className="text-xs text-txt-tertiary">
                  전체
                </Typography>
              </div>
              <div className="text-center">
                <Typography variant="body1" className="font-semibold text-blue-600">
                  {aggregates.activeProjects}
                </Typography>
                <Typography variant="body2" className="text-xs text-txt-tertiary">
                  진행중
                </Typography>
              </div>
              <div className="text-center">
                <Typography variant="body1" className="font-semibold text-green-600">
                  {aggregates.completedProjects}
                </Typography>
                <Typography variant="body2" className="text-xs text-txt-tertiary">
                  완료
                </Typography>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 최고/최악 프로젝트 */}
      {aggregates?.bestProject && aggregates?.worstProject && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 최고 수익 프로젝트 */}
          <Card className="p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-green-600" />
              <Typography variant="h4" className="text-sm font-semibold text-green-700">
                최고 수익 프로젝트
              </Typography>
            </div>
            <Typography variant="h3" className="text-lg font-bold text-txt-primary mb-1">
              {aggregates.bestProject.projectName}
            </Typography>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <Typography variant="body2" className="text-txt-tertiary">수익</Typography>
                <Typography variant="body2" className="font-semibold text-green-600">
                  {formatFullCurrency(aggregates.bestProject.netProfit)}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" className="text-txt-tertiary">이익률</Typography>
                <Typography variant="body2" className="font-semibold">
                  {aggregates.bestProject.profitMargin.toFixed(1)}%
                </Typography>
              </div>
              <div>
                <Typography variant="body2" className="text-txt-tertiary">ROI</Typography>
                <Typography variant="body2" className="font-semibold">
                  {aggregates.bestProject.roi.toFixed(1)}%
                </Typography>
              </div>
            </div>
          </Card>

          {/* 최악 수익 프로젝트 */}
          <Card className="p-4 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <Typography variant="h4" className="text-sm font-semibold text-red-700">
                개선 필요 프로젝트
              </Typography>
            </div>
            <Typography variant="h3" className="text-lg font-bold text-txt-primary mb-1">
              {aggregates.worstProject.projectName}
            </Typography>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <Typography variant="body2" className="text-txt-tertiary">수익</Typography>
                <Typography variant="body2" className="font-semibold text-red-600">
                  {formatFullCurrency(aggregates.worstProject.netProfit)}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" className="text-txt-tertiary">이익률</Typography>
                <Typography variant="body2" className="font-semibold">
                  {aggregates.worstProject.profitMargin.toFixed(1)}%
                </Typography>
              </div>
              <div>
                <Typography variant="body2" className="text-txt-tertiary">ROI</Typography>
                <Typography variant="body2" className="font-semibold">
                  {aggregates.worstProject.roi.toFixed(1)}%
                </Typography>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 프로젝트별 수익 차트 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h3" className="text-lg font-semibold">
              프로젝트별 수익 분석
            </Typography>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="text-sm px-2 py-1 border border-border-light rounded"
            >
              <option value="profit">순이익</option>
              <option value="margin">이익률</option>
              <option value="roi">ROI</option>
              <option value="revenue">매출</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prepareChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number) => {
                  if (selectedMetric === 'margin' || selectedMetric === 'roi') {
                    return `${value.toFixed(1)}%`;
                  }
                  return formatFullCurrency(value);
                }}
              />
              <Bar 
                dataKey={selectedMetric} 
                fill={selectedMetric === 'profit' ? '#10B981' : 
                      selectedMetric === 'revenue' ? '#3B82F6' : '#8B5CF6'} 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 프로젝트 상태 분포 */}
        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            프로젝트 상태 분포
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={preparePieData()}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {preparePieData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* TOP 5 프로젝트 테이블 */}
      <Card className="p-6">
        <Typography variant="h3" className="text-lg font-semibold mb-4">
          TOP 5 수익 프로젝트
        </Typography>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border-light">
              <tr>
                <th className="text-left py-2 px-3 text-sm font-medium text-txt-secondary">순위</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-txt-secondary">프로젝트명</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-txt-secondary">클라이언트</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-txt-secondary">매출</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-txt-secondary">순이익</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-txt-secondary">이익률</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-txt-secondary">ROI</th>
              </tr>
            </thead>
            <tbody>
              {topProjects.map((project, index) => (
                <tr key={project.projectId} className="border-b border-border-light hover:bg-bg-secondary">
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-gray-100 text-gray-700' : 
                        index === 2 ? 'bg-orange-100 text-orange-700' : 
                        'bg-bg-secondary text-txt-secondary'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <Typography variant="body2" className="font-medium">
                      {project.projectName}
                    </Typography>
                  </td>
                  <td className="py-3 px-3">
                    <Typography variant="body2" className="text-txt-secondary">
                      {project.clientName || '-'}
                    </Typography>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Typography variant="body2">
                      {formatFullCurrency(project.totalRevenue)}
                    </Typography>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Typography variant="body2" className={`font-semibold ${
                      project.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatFullCurrency(project.netProfit)}
                    </Typography>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                      ${project.profitMargin > 20 ? 'bg-green-100 text-green-700' :
                        project.profitMargin > 10 ? 'bg-yellow-100 text-yellow-700' :
                        project.profitMargin > 0 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'}`}>
                      {project.profitMargin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Typography variant="body2">
                      {project.roi.toFixed(1)}%
                    </Typography>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}