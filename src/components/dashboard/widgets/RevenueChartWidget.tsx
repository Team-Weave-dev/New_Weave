'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, ArrowUp, ArrowDown, Calendar, Filter, Download, BarChart2, LineChart as LineChartIcon, Activity } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import type { WidgetProps } from '@/types/dashboard'
import { cn } from '@/lib/utils'
import { getSupabaseClientSafe } from '@/lib/supabase/client'
import { widgetColors, chartColors, gradients } from '@/lib/dashboard/widget-colors'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts'

interface RevenueData {
  month: string
  revenue: number
  expense: number
  profit: number
  date: Date
  // 비교 데이터
  prevRevenue?: number
  prevExpense?: number
  prevProfit?: number
}

type ChartType = 'line' | 'bar' | 'area'
type PeriodType = 'month' | 'quarter' | 'year'
type CompareMode = 'none' | 'previous' | 'year'

export function RevenueChartWidget({
  id,
  type,
  config,
  isEditMode,
  className
}: WidgetProps) {
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<ChartType>('area')
  const [period, setPeriod] = useState<PeriodType>('month')
  const [compareMode, setCompareMode] = useState<CompareMode>('none')
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [growthRate, setGrowthRate] = useState(0)
  const [showComparison, setShowComparison] = useState(false)
  const supabase = getSupabaseClientSafe()

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true)

        // 실제로는 Supabase에서 데이터를 가져옴
        // const { data: revenueData, error } = await supabase
        //   .from('revenue')
        //   .select('*')
        //   .order('date', { ascending: true })

        // 임시 데이터
        const now = new Date()
        const mockData: RevenueData[] = []
        
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const revenue = Math.floor(35000000 + Math.random() * 15000000)
          const expense = Math.floor(revenue * (0.6 + Math.random() * 0.2))
          
          // 비교 데이터 추가 (전년 동기 또는 전기)
          const prevRevenue = Math.floor(30000000 + Math.random() * 12000000)
          const prevExpense = Math.floor(prevRevenue * (0.6 + Math.random() * 0.2))
          
          mockData.push({
            month: date.toLocaleDateString('ko-KR', { month: 'short' }),
            revenue,
            expense,
            profit: revenue - expense,
            date,
            prevRevenue,
            prevExpense,
            prevProfit: prevRevenue - prevExpense
          })
        }

        setData(mockData)
        
        // 총 수익 계산
        const total = mockData.reduce((sum, item) => sum + item.revenue, 0)
        setTotalRevenue(total)
        
        // 성장률 계산 (최근 달 vs 이전 달)
        if (mockData.length >= 2) {
          const current = mockData[mockData.length - 1].revenue
          const previous = mockData[mockData.length - 2].revenue
          const rate = ((current - previous) / previous) * 100
          setGrowthRate(Math.round(rate * 10) / 10)
        }
      } catch (error) {
        console.error('Failed to fetch revenue data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!isEditMode) {
      fetchRevenueData()
    } else {
      // 편집 모드에서는 샘플 데이터
      setData([
        { month: '1월', revenue: 42000000, expense: 28000000, profit: 14000000, date: new Date() },
        { month: '2월', revenue: 45000000, expense: 30000000, profit: 15000000, date: new Date() },
        { month: '3월', revenue: 48000000, expense: 31000000, profit: 17000000, date: new Date() }
      ])
      setTotalRevenue(135000000)
      setGrowthRate(12.5)
      setLoading(false)
    }
  }, [isEditMode, period, compareMode, supabase])

  // 데이터 내보내기 기능
  const exportData = () => {
    const csvContent = [
      ['월', '매출', '지출', '순익'].join(','),
      ...data.map(row => 
        `${row.month},${row.revenue},${row.expense},${row.profit}`
      )
    ].join('\n')

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `revenue-chart-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 편집 모드 뷰
  if (isEditMode) {
    return (
      <Card className={cn("h-full flex items-center justify-center bg-gray-50", className)}>
        <div className="text-center">
          <TrendingUp className={cn("w-12 h-12 mx-auto mb-2", widgetColors.primary.icon)} />
          <Typography variant="body2" className={widgetColors.text.secondary}>
            수익 차트
          </Typography>
          <Typography variant="caption" className={cn(widgetColors.text.tertiary, "mt-1")}>
            매출/수익 시각화
          </Typography>
        </div>
      </Card>
    )
  }

  // 로딩 상태
  if (loading) {
    return (
      <Card className={cn("h-full p-4", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  // 금액 포맷
  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `₩${(value / 100000000).toFixed(1)}억`
    } else if (value >= 10000000) {
      return `₩${(value / 10000000).toFixed(1)}천만`
    } else {
      return `₩${(value / 1000000).toFixed(1)}백만`
    }
  }

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <Typography variant="body2" className="font-medium mb-2">
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <Typography variant="caption" className={widgetColors.text.secondary}>
                {entry.name}:
              </Typography>
              <Typography variant="caption" className="font-medium">
                {formatCurrency(entry.value)}
              </Typography>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // 차트 렌더링
  const renderChart = () => {
    const chartProps = {
      data,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#60a5fa" 
              strokeWidth={2}
              name="매출"
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#14b8a6" 
              strokeWidth={2}
              name="순익"
              dot={{ r: 3 }}
            />
            {compareMode !== 'none' && showComparison && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="prevRevenue" 
                  stroke="#60a5fa" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="전기 매출"
                  dot={{ r: 2 }}
                  opacity={0.6}
                />
                <Line 
                  type="monotone" 
                  dataKey="prevProfit" 
                  stroke="#14b8a6" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="전기 순익"
                  dot={{ r: 2 }}
                  opacity={0.6}
                />
              </>
            )}
          </LineChart>
        )
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="revenue" fill="#60a5fa" name="매출" />
            <Bar dataKey="expense" fill="#ef4444" name="지출" />
            <Bar dataKey="profit" fill="#14b8a6" name="순익" />
            {compareMode !== 'none' && showComparison && (
              <>
                <Bar dataKey="prevRevenue" fill="#60a5fa" name="전기 매출" opacity={0.3} />
                <Bar dataKey="prevExpense" fill="#ef4444" name="전기 지출" opacity={0.3} />
                <Bar dataKey="prevProfit" fill="#14b8a6" name="전기 순익" opacity={0.3} />
              </>
            )}
          </BarChart>
        )
      case 'area':
      default:
        return (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#60a5fa" 
              fillOpacity={1} 
              fill="url(#colorRevenue)"
              name="매출"
            />
            <Area 
              type="monotone" 
              dataKey="profit" 
              stroke="#14b8a6" 
              fillOpacity={1} 
              fill="url(#colorProfit)"
              name="순익"
            />
            {compareMode !== 'none' && showComparison && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="prevRevenue" 
                  stroke="#60a5fa" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="전기 매출"
                  dot={false}
                  opacity={0.6}
                />
                <Line 
                  type="monotone" 
                  dataKey="prevProfit" 
                  stroke="#14b8a6" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="전기 순익"
                  dot={false}
                  opacity={0.6}
                />
              </>
            )}
          </AreaChart>
        )
    }
  }

  return (
    <Card className={cn("h-full p-4 flex flex-col", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className={cn("w-5 h-5", widgetColors.primary.icon)} />
          <Typography variant="h3" className={widgetColors.text.primary}>
            수익 차트
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          {/* 기간 선택 */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="month">월별</option>
            <option value="quarter">분기별</option>
            <option value="year">연도별</option>
          </select>
          
          {/* 비교 모드 선택 */}
          <select
            value={compareMode}
            onChange={(e) => {
              setCompareMode(e.target.value as CompareMode)
              setShowComparison(e.target.value !== 'none')
            }}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="none">비교 없음</option>
            <option value="previous">전기 비교</option>
            <option value="year">전년 비교</option>
          </select>
          
          {/* 차트 타입 선택 */}
          <div className="flex gap-1">
            <button
              onClick={() => setChartType('area')}
              className={cn(
                "p-1.5 rounded",
                chartType === 'area' 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              title="영역 차트"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={cn(
                "p-1.5 rounded",
                chartType === 'line' 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              title="선 차트"
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={cn(
                "p-1.5 rounded",
                chartType === 'bar' 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              title="막대 차트"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* 내보내기 버튼 */}
          <button
            onClick={exportData}
            className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="CSV 내보내기"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[var(--color-brand-primary-start)]/5 rounded-lg p-3 border border-[var(--color-brand-primary-start)]/10">
          <div className="flex items-center justify-between mb-1">
            <DollarSign className={cn("w-4 h-4", widgetColors.primary.icon)} />
            <Typography variant="caption" className={widgetColors.primary.text}>
              총 수익
            </Typography>
          </div>
          <Typography variant="h3" className={widgetColors.primary.text}>
            {formatCurrency(totalRevenue)}
          </Typography>
        </div>
        
        <div className={cn(
          "rounded-lg p-3 border",
          growthRate >= 0 
            ? "bg-[var(--color-brand-secondary-start)]/5 border-[var(--color-brand-secondary-start)]/10" 
            : "bg-[var(--color-status-error)]/5 border-[var(--color-status-error)]/10"
        )}>
          <div className="flex items-center justify-between mb-1">
            {growthRate >= 0 ? (
              <ArrowUp className={cn("w-4 h-4", widgetColors.status.success.icon)} />
            ) : (
              <ArrowDown className={cn("w-4 h-4", widgetColors.status.error.icon)} />
            )}
            <Typography variant="caption" className={
              growthRate >= 0 ? widgetColors.status.success.text : widgetColors.status.error.text
            }>
              전월 대비
            </Typography>
          </div>
          <Typography variant="h3" className={
            growthRate >= 0 
              ? widgetColors.status.success.text 
              : widgetColors.status.error.text
          }>
            {growthRate > 0 ? '+' : ''}{growthRate}%
          </Typography>
        </div>
      </div>

      {/* 차트 */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      {config?.showLegend !== false && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <Typography variant="caption" className={widgetColors.text.secondary}>
                매출
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <Typography variant="caption" className={widgetColors.text.secondary}>
                지출
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <Typography variant="caption" className={widgetColors.text.secondary}>
                순익
              </Typography>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// 위젯 메타데이터
export const revenueChartWidgetMetadata = {
  name: '수익 차트',
  description: '월별/분기별 수익을 차트로 표시',
  icon: 'chart',
  defaultSize: { width: 2, height: 2 },
  minSize: { width: 2, height: 1 },
  maxSize: { width: 4, height: 3 },
  tags: ['수익', '차트', '분석'],
  configurable: true,
  version: '1.0.0'
}

export default RevenueChartWidget