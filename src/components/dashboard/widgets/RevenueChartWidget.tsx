'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, ArrowUp, ArrowDown, Calendar, Filter } from 'lucide-react'
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
}

type ChartType = 'line' | 'bar' | 'area'
type PeriodType = 'month' | 'quarter' | 'year'

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
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [growthRate, setGrowthRate] = useState(0)
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
          
          mockData.push({
            month: date.toLocaleDateString('ko-KR', { month: 'short' }),
            revenue,
            expense,
            profit: revenue - expense,
            date
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
  }, [isEditMode, period, supabase])

  // 편집 모드 뷰
  if (isEditMode) {
    return (
      <Card className={cn("h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
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
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-primary-borderSecondary)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--color-brand-primary-end)" 
              strokeWidth={2}
              name="매출"
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="var(--color-brand-secondary-start)" 
              strokeWidth={2}
              name="순익"
              dot={{ r: 3 }}
            />
          </LineChart>
        )
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-primary-borderSecondary)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="revenue" fill="var(--color-brand-primary-end)" name="매출" />
            <Bar dataKey="expense" fill="var(--color-status-error)" name="지출" />
            <Bar dataKey="profit" fill="var(--color-brand-secondary-start)" name="순익" />
          </BarChart>
        )
      case 'area':
      default:
        return (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-brand-primary-end)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-brand-primary-end)" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-brand-secondary-start)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-brand-secondary-start)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-primary-borderSecondary)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--color-brand-primary-end)" 
              fillOpacity={1} 
              fill="url(#colorRevenue)"
              name="매출"
            />
            <Area 
              type="monotone" 
              dataKey="profit" 
              stroke="var(--color-brand-secondary-start)" 
              fillOpacity={1} 
              fill="url(#colorProfit)"
              name="순익"
            />
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
            className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
          >
            <option value="month">월별</option>
            <option value="quarter">분기별</option>
            <option value="year">연도별</option>
          </select>
          {/* 차트 타입 선택 */}
          <div className="flex gap-1">
            {(['area', 'line', 'bar'] as ChartType[]).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={cn(
                  "p-1 rounded",
                  chartType === type 
                    ? "bg-blue-500 text-white" 
                    : cn(widgetColors.bg.surfaceSecondary, widgetColors.text.secondary)
                )}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  {type === 'line' && <path d="M1 13L5 8L8 10L15 3" stroke="currentColor" fill="none" strokeWidth="2"/>}
                  {type === 'bar' && (
                    <>
                      <rect x="2" y="8" width="3" height="5"/>
                      <rect x="7" y="5" width="3" height="8"/>
                      <rect x="12" y="3" width="3" height="10"/>
                    </>
                  )}
                  {type === 'area' && <path d="M1 13L5 8L8 10L15 3V13H1Z" fillOpacity="0.5"/>}
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
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
          "rounded-lg p-3",
          growthRate >= 0 
            ? "bg-green-50 dark:bg-green-900/20" 
            : "bg-red-50 dark:bg-red-900/20"
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
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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