'use client';

import { useState, useEffect, useMemo } from 'react';
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
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

interface CashFlowData {
  month: string;
  income: number;
  expense: number;
  netFlow: number;
  cumulative: number;
}

interface Prediction {
  month: string;
  predicted: number;
  confidence: number;
}

type ViewMode = 'flow' | 'comparison' | 'cumulative' | 'prediction';
type TimeRange = '3months' | '6months' | '12months' | 'all';

export function CashFlowWidget() {
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const [timeRange, setTimeRange] = useState<TimeRange>('6months');
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate mock data
  useEffect(() => {
    const generateMockData = () => {
      const months = [
        '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
        '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'
      ];

      let cumulative = 0;
      const data: CashFlowData[] = months.map((month) => {
        const income = Math.floor(Math.random() * 50000) + 30000;
        const expense = Math.floor(Math.random() * 40000) + 20000;
        const netFlow = income - expense;
        cumulative += netFlow;

        return {
          month: month.split('-')[1],
          income,
          expense,
          netFlow,
          cumulative
        };
      });

      setCashFlowData(data);
    };

    generateMockData();
  }, []);

  // Generate predictions using simple linear regression
  useEffect(() => {
    if (cashFlowData.length === 0) return;

    const generatePredictions = () => {
      const recentData = cashFlowData.slice(-6);
      const avgNetFlow = recentData.reduce((sum, d) => sum + d.netFlow, 0) / recentData.length;
      const trend = (recentData[recentData.length - 1].netFlow - recentData[0].netFlow) / 5;

      const nextMonths = ['01', '02', '03'];
      const newPredictions: Prediction[] = nextMonths.map((month, index) => ({
        month: `2025-${month}`,
        predicted: Math.round(avgNetFlow + trend * (index + 1)),
        confidence: Math.max(0.7 - index * 0.1, 0.4)
      }));

      setPredictions(newPredictions);
    };

    generatePredictions();
  }, [cashFlowData]);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const ranges: Record<TimeRange, number> = {
      '3months': 3,
      '6months': 6,
      '12months': 12,
      'all': cashFlowData.length
    };

    return cashFlowData.slice(-ranges[timeRange]);
  }, [cashFlowData, timeRange]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;

    const totalIncome = filteredData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = filteredData.reduce((sum, d) => sum + d.expense, 0);
    const avgMonthlyFlow = filteredData.reduce((sum, d) => sum + d.netFlow, 0) / filteredData.length;
    const currentBalance = filteredData[filteredData.length - 1]?.cumulative || 0;

    return {
      totalIncome,
      totalExpense,
      avgMonthlyFlow,
      currentBalance
    };
  }, [filteredData]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Re-generate mock data
      const months = [
        '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
        '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'
      ];

      let cumulative = 0;
      const data: CashFlowData[] = months.map((month) => {
        const income = Math.floor(Math.random() * 50000) + 30000;
        const expense = Math.floor(Math.random() * 40000) + 20000;
        const netFlow = income - expense;
        cumulative += netFlow;

        return {
          month: month.split('-')[1],
          income,
          expense,
          netFlow,
          cumulative
        };
      });

      setCashFlowData(data);
      setIsLoading(false);
    }, 1000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(value);
  };

  const renderChart = () => {
    switch (viewMode) {
      case 'flow':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value / 1000}K`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="수입" />
              <Bar dataKey="expense" fill="#ef4444" name="지출" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'comparison':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value / 1000}K`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" name="수입" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" name="지출" strokeWidth={2} />
              <Line type="monotone" dataKey="netFlow" stroke="#3b82f6" name="순현금흐름" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'cumulative':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value / 1000}K`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.6}
                name="누적 현금흐름"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'prediction':
        const combinedData = [
          ...filteredData.slice(-3).map(d => ({ ...d, type: 'actual' })),
          ...predictions.map(p => ({
            month: p.month.split('-')[1],
            netFlow: p.predicted,
            type: 'predicted',
            confidence: p.confidence
          }))
        ];

        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value / 1000}K`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="netFlow" 
                stroke="#3b82f6" 
                name="순현금흐름"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (!stats) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-40">
          <Typography variant="body2" className="text-gray-500">
            데이터 로딩 중...
          </Typography>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <Typography variant="h3">현금 흐름</Typography>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <Typography variant="caption" className="text-green-600">
                총 수입
              </Typography>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <Typography variant="body1" className="font-semibold text-green-700 mt-1">
              {formatCurrency(stats.totalIncome)}
            </Typography>
          </div>

          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <Typography variant="caption" className="text-red-600">
                총 지출
              </Typography>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <Typography variant="body1" className="font-semibold text-red-700 mt-1">
              {formatCurrency(stats.totalExpense)}
            </Typography>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'flow' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setViewMode('flow')}
          >
            흐름
          </Button>
          <Button
            variant={viewMode === 'comparison' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setViewMode('comparison')}
          >
            비교
          </Button>
          <Button
            variant={viewMode === 'cumulative' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setViewMode('cumulative')}
          >
            누적
          </Button>
          <Button
            variant={viewMode === 'prediction' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setViewMode('prediction')}
          >
            예측
          </Button>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3months">최근 3개월</option>
            <option value="6months">최근 6개월</option>
            <option value="12months">최근 12개월</option>
            <option value="all">전체</option>
          </select>
        </div>

        {/* Chart */}
        <div className="mt-4">
          {renderChart()}
        </div>

        {/* Footer Stats */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="caption" className="text-gray-500">
                월평균 순흐름
              </Typography>
              <Typography 
                variant="body2" 
                className={`font-semibold ${stats.avgMonthlyFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(stats.avgMonthlyFlow)}
              </Typography>
            </div>
            <div className="text-right">
              <Typography variant="caption" className="text-gray-500">
                현재 잔액
              </Typography>
              <Typography 
                variant="body2" 
                className={`font-semibold ${stats.currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}
              >
                {formatCurrency(stats.currentBalance)}
              </Typography>
            </div>
          </div>
        </div>

        {/* Prediction Info (when in prediction mode) */}
        {viewMode === 'prediction' && predictions.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <Typography variant="caption" className="text-blue-700">
              예측 정보
            </Typography>
            <Typography variant="caption" className="block text-blue-600 mt-1">
              다음 3개월 예상 순흐름: {formatCurrency(predictions[0].predicted)}
            </Typography>
            <Typography variant="caption" className="block text-blue-600">
              신뢰도: {Math.round(predictions[0].confidence * 100)}%
            </Typography>
          </div>
        )}
      </div>
    </Card>
  );
}