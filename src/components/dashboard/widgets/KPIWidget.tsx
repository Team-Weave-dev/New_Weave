'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Target,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import type { WidgetProps } from '@/types/dashboard'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface KPIMetric {
  id: string
  name: string
  value: number
  unit: string
  change: number // 전월 대비 변화율 (%)
  target?: number // 목표값
  achievement?: number // 달성률 (%)
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  trend: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'danger'
}

type PeriodType = 'month' | 'quarter' | 'year'

export function KPIWidget({
  id,
  type,
  config,
  isEditMode,
  className
}: WidgetProps) {
  const [metrics, setMetrics] = useState<KPIMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>('month')
  const supabase = createClientComponentClient()

  // 초기 데이터 로드
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        
        // 실제로는 Supabase에서 데이터를 가져옴
        // const { data: metricsData, error } = await supabase
        //   .from('kpi_metrics')
        //   .select('*')
        //   .eq('period', period)

        // 임시 데이터
        const mockMetrics: KPIMetric[] = [
          {
            id: '1',
            name: '월 매출',
            value: 85000000,
            unit: '원',
            change: 12.5,
            target: 100000000,
            achievement: 85,
            icon: DollarSign,
            color: 'blue',
            trend: 'up',
            status: 'good'
          },
          {
            id: '2',
            name: '신규 고객',
            value: 143,
            unit: '명',
            change: 23.2,
            target: 150,
            achievement: 95.3,
            icon: Users,
            color: 'green',
            trend: 'up',
            status: 'good'
          },
          {
            id: '3',
            name: '프로젝트 완료율',
            value: 87.5,
            unit: '%',
            change: -2.3,
            target: 90,
            achievement: 97.2,
            icon: CheckCircle2,
            color: 'purple',
            trend: 'down',
            status: 'warning'
          },
          {
            id: '4',
            name: '평균 거래액',
            value: 594000,
            unit: '원',
            change: 5.8,
            target: 600000,
            achievement: 99,
            icon: ShoppingCart,
            color: 'orange',
            trend: 'up',
            status: 'good'
          },
          {
            id: '5',
            name: '고객 만족도',
            value: 4.6,
            unit: '점',
            change: 2.2,
            target: 4.5,
            achievement: 102.2,
            icon: Activity,
            color: 'green',
            trend: 'up',
            status: 'good'
          },
          {
            id: '6',
            name: '비용 절감률',
            value: 18.3,
            unit: '%',
            change: 8.5,
            target: 20,
            achievement: 91.5,
            icon: Target,
            color: 'red',
            trend: 'up',
            status: 'warning'
          }
        ]

        // 기간에 따른 데이터 조정 (시뮬레이션)
        if (period === 'quarter') {
          mockMetrics.forEach(metric => {
            metric.value *= 3
            if (metric.target) metric.target *= 3
          })
        } else if (period === 'year') {
          mockMetrics.forEach(metric => {
            metric.value *= 12
            if (metric.target) metric.target *= 12
          })
        }

        setMetrics(mockMetrics)
      } catch (error) {
        console.error('Failed to fetch KPI metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!isEditMode) {
      fetchMetrics()
    } else {
      // 편집 모드에서는 샘플 데이터
      setMetrics([
        {
          id: 'sample1',
          name: '샘플 지표 1',
          value: 100,
          unit: '%',
          change: 10,
          icon: BarChart3,
          color: 'blue',
          trend: 'up',
          status: 'good'
        },
        {
          id: 'sample2',
          name: '샘플 지표 2',
          value: 50,
          unit: '개',
          change: -5,
          icon: Target,
          color: 'red',
          trend: 'down',
          status: 'warning'
        }
      ])
      setLoading(false)
    }
  }, [isEditMode, period, supabase])

  // 값 포맷팅
  const formatValue = (value: number, unit: string): string => {
    if (unit === '원') {
      if (value >= 100000000) {
        return `${(value / 100000000).toFixed(1)}억`
      } else if (value >= 10000000) {
        return `${(value / 10000000).toFixed(1)}천만`
      } else if (value >= 10000) {
        return `${(value / 10000).toFixed(0)}만`
      }
      return value.toLocaleString('ko-KR')
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`
    } else if (unit === '점') {
      return value.toFixed(1)
    } else {
      return value.toLocaleString('ko-KR')
    }
  }

  // 색상 클래스 가져오기
  const getColorClasses = (color: KPIMetric['color']) => {
    const colors = {
      blue: {
        bg: 'bg-[var(--color-accent-blue)]/10',
        icon: 'text-[var(--color-accent-blue)]',
        text: 'text-[var(--color-text-primary)]'
      },
      green: {
        bg: 'bg-[var(--color-status-success)]/10',
        icon: 'text-[var(--color-status-success)]',
        text: 'text-[var(--color-text-primary)]'
      },
      purple: {
        bg: 'bg-[var(--color-accent-purple)]/10',
        icon: 'text-[var(--color-accent-purple)]',
        text: 'text-[var(--color-text-primary)]'
      },
      orange: {
        bg: 'bg-[var(--color-accent-orange)]/10',
        icon: 'text-[var(--color-accent-orange)]',
        text: 'text-[var(--color-text-primary)]'
      },
      red: {
        bg: 'bg-[var(--color-status-error)]/10',
        icon: 'text-[var(--color-status-error)]',
        text: 'text-[var(--color-text-primary)]'
      }
    }
    return colors[color]
  }

  // 트렌드 아이콘 가져오기
  const getTrendIcon = (trend: KPIMetric['trend'], change: number) => {
    if (Math.abs(change) < 0.5) {
      return <Minus className="w-4 h-4 text-gray-500" />
    }
    if (trend === 'up') {
      return <ArrowUp className="w-4 h-4 text-[var(--color-status-success)]" />
    }
    return <ArrowDown className="w-4 h-4 text-[var(--color-status-error)]" />
  }

  // 상태 아이콘 가져오기
  const getStatusIcon = (status: KPIMetric['status']) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="w-4 h-4 text-[var(--color-status-success)]" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-[var(--color-status-warning)]" />
      case 'danger':
        return <XCircle className="w-4 h-4 text-[var(--color-status-error)]" />
    }
  }

  // 진행률 바 색상
  const getProgressColor = (achievement: number) => {
    if (achievement >= 100) return 'bg-[var(--color-status-success)]'
    if (achievement >= 80) return 'bg-[var(--color-status-info)]'
    if (achievement >= 60) return 'bg-[var(--color-status-warning)]'
    return 'bg-[var(--color-status-error)]'
  }

  // 요약 통계
  const summary = useMemo(() => {
    const total = metrics.length
    const achieving = metrics.filter(m => m.achievement && m.achievement >= 100).length
    const improving = metrics.filter(m => m.change > 0).length
    const warning = metrics.filter(m => m.status === 'warning' || m.status === 'danger').length

    return {
      total,
      achieving,
      achievementRate: total > 0 ? Math.round((achieving / total) * 100) : 0,
      improving,
      improvementRate: total > 0 ? Math.round((improving / total) * 100) : 0,
      warning
    }
  }, [metrics])

  // 편집 모드 뷰
  if (isEditMode) {
    return (
      <Card className={cn("h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            KPI 메트릭
          </Typography>
          <Typography variant="caption" className="text-gray-500 dark:text-gray-500 mt-1">
            핵심 성과 지표
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
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("h-full p-4 flex flex-col", className)}>
      {/* 헤더 */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--color-brand-primary-start)]" />
            <CardTitle>KPI 대시보드</CardTitle>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
            className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
          >
            <option value="month">월간</option>
            <option value="quarter">분기</option>
            <option value="year">연간</option>
          </select>
        </div>
      </CardHeader>

      {/* 요약 통계 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center">
          <Typography variant="caption" className="text-gray-500">
            전체
          </Typography>
          <Typography variant="h4" className="text-gray-900">
            {summary.total}
          </Typography>
        </div>
        <div className="text-center">
          <Typography variant="caption" className="text-gray-500">
            달성
          </Typography>
          <Typography variant="h4" className="text-green-600">
            {summary.achieving}
          </Typography>
        </div>
        <div className="text-center">
          <Typography variant="caption" className="text-gray-500">
            개선
          </Typography>
          <Typography variant="h4" className="text-blue-600">
            {summary.improving}
          </Typography>
        </div>
        <div className="text-center">
          <Typography variant="caption" className="text-gray-500">
            주의
          </Typography>
          <Typography variant="h4" className="text-orange-600">
            {summary.warning}
          </Typography>
        </div>
      </div>

      {/* KPI 카드 그리드 */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(metric => {
            const colors = getColorClasses(metric.color)
            const Icon = metric.icon

            return (
              <div
                key={metric.id}
                className={cn(
                  "p-3 rounded-lg border border-gray-200 dark:border-gray-700",
                  colors.bg
                )}
              >
                {/* 지표 헤더 */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded", colors.bg)}>
                      <Icon className={cn("w-4 h-4", colors.icon)} />
                    </div>
                    <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                      {metric.name}
                    </Typography>
                  </div>
                  {getStatusIcon(metric.status)}
                </div>

                {/* 값과 변화율 */}
                <div className="flex items-end justify-between mb-2">
                  <Typography variant="h3" className={colors.text}>
                    {formatValue(metric.value, metric.unit)}
                  </Typography>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend, metric.change)}
                    <Typography 
                      variant="caption" 
                      className={cn(
                        "font-medium",
                        metric.change > 0 ? "text-green-600" : metric.change < 0 ? "text-red-600" : "text-gray-500"
                      )}
                    >
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </Typography>
                  </div>
                </div>

                {/* 목표 대비 달성률 */}
                {metric.target && metric.achievement !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                        목표: {formatValue(metric.target, metric.unit)}
                      </Typography>
                      <Typography variant="caption" className="font-medium text-gray-600 dark:text-gray-300">
                        {metric.achievement.toFixed(1)}%
                      </Typography>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          getProgressColor(metric.achievement)
                        )}
                        style={{ width: `${Math.min(metric.achievement, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 하단 요약 */}
      {config?.showSummary !== false && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                  달성률 {summary.achievementRate}%
                </Typography>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-blue-600" />
                <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                  개선율 {summary.improvementRate}%
                </Typography>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// 위젯 메타데이터
export const kpiWidgetMetadata = {
  name: 'KPI 메트릭',
  description: '핵심 성과 지표를 한눈에 확인',
  icon: 'chart',
  defaultSize: { width: 2, height: 2 },
  minSize: { width: 2, height: 2 },
  maxSize: { width: 4, height: 3 },
  tags: ['KPI', '성과', '지표', '대시보드'],
  configurable: true,
  version: '1.0.0'
}

export default KPIWidget