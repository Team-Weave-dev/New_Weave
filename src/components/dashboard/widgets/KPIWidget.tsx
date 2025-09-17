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
  Activity,
  Plus,
  Settings,
  Trash2,
  X,
  FileText,
  Package,
  Percent
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import type { WidgetProps } from '@/types/dashboard'
import { cn } from '@/lib/utils'
import { getSupabaseClientSafe } from '@/lib/supabase/client'
import { widgetColors, gradients } from '@/lib/dashboard/widget-colors'

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
  formula?: string // 계산 공식
  conditionalFormatting?: ConditionalFormat[] // 조건부 포맷팅 규칙
  isCustom?: boolean // 커스텀 KPI 여부
}

interface ConditionalFormat {
  condition: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' // greater than, greater than or equal, etc.
  value: number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  status: 'good' | 'warning' | 'danger'
}

interface CustomKPIForm {
  name: string
  unit: string
  value: number
  target: number
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  formula?: string
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
  const [customMetrics, setCustomMetrics] = useState<KPIMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>('month')
  const [showSettings, setShowSettings] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [editingMetric, setEditingMetric] = useState<string | null>(null)
  const [customKPIForm, setCustomKPIForm] = useState<CustomKPIForm>({
    name: '',
    unit: '개',
    value: 0,
    target: 100,
    icon: 'target',
    color: 'blue',
    formula: ''
  })
  const supabase = getSupabaseClientSafe()

  // 로컬스토리지에서 커스텀 KPI 로드
  useEffect(() => {
    const savedCustomKPIs = localStorage.getItem(`widget-kpi-custom-${id}`)
    if (savedCustomKPIs) {
      try {
        const parsed = JSON.parse(savedCustomKPIs)
        setCustomMetrics(parsed)
      } catch (error) {
        console.error('Failed to parse custom KPIs:', error)
      }
    }
  }, [id])

  // 커스텀 KPI 저장
  const saveCustomMetrics = (newMetrics: KPIMetric[]) => {
    setCustomMetrics(newMetrics)
    localStorage.setItem(`widget-kpi-custom-${id}`, JSON.stringify(newMetrics))
  }

  // 아이콘 매핑
  const iconMap: Record<string, React.ElementType> = {
    dollar: DollarSign,
    users: Users,
    cart: ShoppingCart,
    target: Target,
    chart: BarChart3,
    activity: Activity,
    file: FileText,
    package: Package,
    percent: Percent,
    trending: Activity
  }

  // 커스텀 KPI 추가
  const addCustomKPI = () => {
    const newKPI: KPIMetric = {
      id: `custom-${Date.now()}`,
      name: customKPIForm.name,
      value: customKPIForm.value,
      unit: customKPIForm.unit,
      change: 0,
      target: customKPIForm.target,
      achievement: (customKPIForm.value / customKPIForm.target) * 100,
      icon: iconMap[customKPIForm.icon] || Target,
      color: customKPIForm.color,
      trend: 'stable',
      status: customKPIForm.value >= customKPIForm.target ? 'good' : 'warning',
      formula: customKPIForm.formula,
      isCustom: true
    }

    const updated = [...customMetrics, newKPI]
    saveCustomMetrics(updated)
    setShowCustomForm(false)
    setCustomKPIForm({
      name: '',
      unit: '개',
      value: 0,
      target: 100,
      icon: 'target',
      color: 'blue',
      formula: ''
    })
  }

  // 커스텀 KPI 삭제
  const deleteCustomKPI = (id: string) => {
    const updated = customMetrics.filter(m => m.id !== id)
    saveCustomMetrics(updated)
  }

  // 조건부 포맷팅 적용
  const applyConditionalFormatting = (metric: KPIMetric): KPIMetric => {
    if (!metric.conditionalFormatting || metric.conditionalFormatting.length === 0) {
      return metric
    }

    for (const format of metric.conditionalFormatting) {
      let conditionMet = false
      
      switch (format.condition) {
        case 'gt':
          conditionMet = metric.value > format.value
          break
        case 'gte':
          conditionMet = metric.value >= format.value
          break
        case 'lt':
          conditionMet = metric.value < format.value
          break
        case 'lte':
          conditionMet = metric.value <= format.value
          break
        case 'eq':
          conditionMet = metric.value === format.value
          break
        case 'neq':
          conditionMet = metric.value !== format.value
          break
      }

      if (conditionMet) {
        return {
          ...metric,
          color: format.color,
          status: format.status
        }
      }
    }

    return metric
  }

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

        // 커스텀 메트릭과 기본 메트릭 병합실기 조건부 포맷팅 적용
        const formattedMetrics = mockMetrics.map(applyConditionalFormatting)
        const formattedCustomMetrics = customMetrics.map(applyConditionalFormatting)
        const allMetrics = [...formattedMetrics, ...formattedCustomMetrics]
        setMetrics(allMetrics)
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
  }, [isEditMode, period, supabase, customMetrics])

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
        bg: widgetColors.primary.bgLight,
        icon: widgetColors.primary.icon,
        text: widgetColors.text.primary
      },
      green: {
        bg: widgetColors.status.success.bgLight,
        icon: widgetColors.status.success.icon,
        text: widgetColors.text.primary
      },
      purple: {
        bg: widgetColors.secondary.bgLight,
        icon: widgetColors.secondary.icon,
        text: widgetColors.text.primary
      },
      orange: {
        bg: widgetColors.status.warning.bgLight,
        icon: widgetColors.status.warning.icon,
        text: widgetColors.text.primary
      },
      red: {
        bg: widgetColors.status.error.bgLight,
        icon: widgetColors.status.error.icon,
        text: widgetColors.text.primary
      }
    }
    return colors[color]
  }

  // 트렌드 아이콘 가져오기
  const getTrendIcon = (trend: KPIMetric['trend'], change: number) => {
    if (Math.abs(change) < 0.5) {
      return <Minus className={cn("w-4 h-4", widgetColors.text.muted)} />
    }
    if (trend === 'up') {
      return <ArrowUp className={cn("w-4 h-4", widgetColors.status.success.icon)} />
    }
    return <ArrowDown className={cn("w-4 h-4", widgetColors.status.error.icon)} />
  }

  // 상태 아이콘 가져오기
  const getStatusIcon = (status: KPIMetric['status']) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className={cn("w-4 h-4", widgetColors.status.success.icon)} />
      case 'warning':
        return <AlertCircle className={cn("w-4 h-4", widgetColors.status.warning.icon)} />
      case 'danger':
        return <XCircle className={cn("w-4 h-4", widgetColors.status.error.icon)} />
    }
  }

  // 진행률 바 색상
  const getProgressColor = (achievement: number) => {
    if (achievement >= 100) return widgetColors.status.success.bg
    if (achievement >= 80) return widgetColors.status.info.bg
    if (achievement >= 60) return widgetColors.status.warning.bg
    return widgetColors.status.error.bg
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
      <Card className={cn("h-full flex items-center justify-center bg-gray-50", className)}>
        <div className="text-center">
          <BarChart3 className={cn("w-12 h-12 mx-auto mb-2", widgetColors.primary.icon)} />
          <Typography variant="body2" className={widgetColors.text.secondary}>
            KPI 메트릭
          </Typography>
          <Typography variant="caption" className={cn(widgetColors.text.tertiary, "mt-1")}>
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
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("h-full p-3 sm:p-4 flex flex-col", className)}>
      {/* 헤더 */}
      <CardHeader className="pb-2 sm:pb-3 px-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className={cn("w-4 h-4 sm:w-5 sm:h-5", widgetColors.primary.icon)} />
            <CardTitle className="text-base sm:text-lg">KPI 대시보드</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomForm(true)}
              className={cn(
                "p-1 rounded hover:bg-gray-100 transition-colors",
                widgetColors.border.primary
              )}
              title="커스텀 KPI 추가"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-1 rounded hover:bg-gray-100 transition-colors",
                widgetColors.border.primary
              )}
              title="설정"
            >
              <Settings className="w-4 h-4" />
            </button>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              className={cn("text-xs sm:text-sm border rounded px-1.5 py-0.5 sm:px-2 sm:py-1", widgetColors.border.primary)}
            >
              <option value="month">월간</option>
              <option value="quarter">분기</option>
              <option value="year">연간</option>
            </select>
          </div>
        </div>
      </CardHeader>

      {/* 요약 통계 */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-3 sm:mb-4">
        <div className="text-center">
          <Typography variant="caption" className={cn("text-[10px] sm:text-xs", widgetColors.text.tertiary)}>
            전체
          </Typography>
          <Typography variant="h4" className={cn("text-base sm:text-xl", widgetColors.text.primary)}>
            {summary.total}
          </Typography>
        </div>
        <div className="text-center">
          <Typography variant="caption" className={cn("text-[10px] sm:text-xs", widgetColors.text.tertiary)}>
            달성
          </Typography>
          <Typography variant="h4" className={cn("text-base sm:text-xl", widgetColors.status.success.text)}>
            {summary.achieving}
          </Typography>
        </div>
        <div className="text-center">
          <Typography variant="caption" className={cn("text-[10px] sm:text-xs", widgetColors.text.tertiary)}>
            개선
          </Typography>
          <Typography variant="h4" className={cn("text-base sm:text-xl", widgetColors.primary.text)}>
            {summary.improving}
          </Typography>
        </div>
        <div className="text-center">
          <Typography variant="caption" className={cn("text-[10px] sm:text-xs", widgetColors.text.tertiary)}>
            주의
          </Typography>
          <Typography variant="h4" className={cn("text-base sm:text-xl", widgetColors.status.warning.text)}>
            {summary.warning}
          </Typography>
        </div>
      </div>

      {/* 커스텀 KPI 추가 폼 */}
      {showCustomForm && (
        <div className="mb-3 p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <Typography variant="h4" className="text-sm">커스텀 KPI 추가</Typography>
            <button
              onClick={() => setShowCustomForm(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="KPI 이름"
              value={customKPIForm.name}
              onChange={(e) => setCustomKPIForm({ ...customKPIForm, name: e.target.value })}
              className="px-2 py-1 text-xs border rounded"
            />
            <select
              value={customKPIForm.unit}
              onChange={(e) => setCustomKPIForm({ ...customKPIForm, unit: e.target.value })}
              className="px-2 py-1 text-xs border rounded"
            >
              <option value="개">개</option>
              <option value="%">%</option>
              <option value="원">원</option>
              <option value="점">점</option>
              <option value="명">명</option>
              <option value="건">건</option>
              <option value="시간">시간</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="number"
              placeholder="현재 값"
              value={customKPIForm.value}
              onChange={(e) => setCustomKPIForm({ ...customKPIForm, value: Number(e.target.value) })}
              className="px-2 py-1 text-xs border rounded"
            />
            <input
              type="number"
              placeholder="목표 값"
              value={customKPIForm.target}
              onChange={(e) => setCustomKPIForm({ ...customKPIForm, target: Number(e.target.value) })}
              className="px-2 py-1 text-xs border rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <select
              value={customKPIForm.icon}
              onChange={(e) => setCustomKPIForm({ ...customKPIForm, icon: e.target.value })}
              className="px-2 py-1 text-xs border rounded"
            >
              <option value="target">타겟</option>
              <option value="dollar">돈</option>
              <option value="users">사용자</option>
              <option value="cart">장바구니</option>
              <option value="chart">차트</option>
              <option value="activity">활동</option>
              <option value="file">파일</option>
              <option value="package">패키지</option>
              <option value="percent">퍼센트</option>
              <option value="trending">트렌드</option>
            </select>
            <select
              value={customKPIForm.color}
              onChange={(e) => setCustomKPIForm({ ...customKPIForm, color: e.target.value as any })}
              className="px-2 py-1 text-xs border rounded"
            >
              <option value="blue">파랑</option>
              <option value="green">초록</option>
              <option value="purple">보라</option>
              <option value="orange">주황</option>
              <option value="red">빨강</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="계산 공식 (선택사항)"
            value={customKPIForm.formula || ''}
            onChange={(e) => setCustomKPIForm({ ...customKPIForm, formula: e.target.value })}
            className="w-full px-2 py-1 text-xs border rounded mb-2"
          />

          <button
            onClick={addCustomKPI}
            disabled={!customKPIForm.name}
            className={cn(
              "w-full px-2 py-1 text-xs rounded transition-colors",
              customKPIForm.name 
                ? "bg-blue-500 text-white hover:bg-blue-600" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <Plus className="w-3 h-3 inline mr-1" />
            KPI 추가
          </button>
        </div>
      )}

      {/* KPI 카드 그리드 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {metrics.map(metric => {
            const colors = getColorClasses(metric.color)
            const Icon = metric.icon

            return (
              <div
                key={metric.id}
                className={cn(
                  "p-2 sm:p-3 rounded-lg border", widgetColors.border.primary,
                  colors.bg
                )}
              >
                {/* 지표 헤더 */}
                <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className={cn("p-1 sm:p-1.5 rounded", colors.bg)}>
                      <Icon className={cn("w-3 h-3 sm:w-4 sm:h-4", colors.icon)} />
                    </div>
                    <Typography variant="caption" className={cn("text-[10px] sm:text-xs", widgetColors.text.secondary)}>
                      {metric.name}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-1">
                    {metric.isCustom && (
                      <button
                        onClick={() => deleteCustomKPI(metric.id)}
                        className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    )}
                    {getStatusIcon(metric.status)}
                  </div>
                </div>

                {/* 값과 변화율 */}
                <div className="flex items-end justify-between mb-1.5 sm:mb-2">
                  <Typography variant="h3" className={cn("text-sm sm:text-lg", colors.text)}>
                    {formatValue(metric.value, metric.unit)}
                  </Typography>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend, metric.change)}
                    <Typography 
                      variant="caption" 
                      className={cn(
                        "font-medium text-[10px] sm:text-xs",
                        metric.change > 0 ? widgetColors.status.success.text : metric.change < 0 ? widgetColors.status.error.text : widgetColors.text.muted
                      )}
                    >
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </Typography>
                  </div>
                </div>

                {/* 목표 대비 달성률 */}
                {metric.target && metric.achievement !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                      <Typography variant="caption" className={cn("text-[10px] sm:text-xs", widgetColors.text.tertiary)}>
                        목표: {formatValue(metric.target, metric.unit)}
                      </Typography>
                      <Typography variant="caption" className={cn(
                        "font-medium text-[10px] sm:text-xs",
                        metric.achievement >= 100 
                          ? widgetColors.status.success.text 
                          : metric.achievement >= 80 
                            ? widgetColors.status.info.text
                            : metric.achievement >= 60
                              ? widgetColors.status.warning.text
                              : widgetColors.status.error.text
                      )}>
                        {metric.achievement.toFixed(1)}%
                      </Typography>
                    </div>
                    <div className="relative">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-500 relative",
                            getProgressColor(metric.achievement)
                          )}
                          style={{ width: `${Math.min(metric.achievement, 100)}%` }}
                        >
                          {/* 진행률 그래디언트 효과 */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                        </div>
                      </div>
                      {/* 목표 지점 표시 */}
                      {metric.achievement < 100 && (
                        <div 
                          className="absolute top-0 h-2 w-0.5 bg-gray-600"
                          style={{ right: '0%' }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="mb-3 p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <Typography variant="h4" className="text-sm">KPI 설정</Typography>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div>
              <Typography variant="caption" className="text-xs text-gray-600 mb-1">
                조건부 포맷팅 규칙
              </Typography>
              <Typography variant="caption" className="text-[10px] text-gray-500">
                각 KPI에 대해 값에 따른 색상과 상태를 자동으로 설정할 수 있습니다.
              </Typography>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] mt-2">
              <div className="text-center p-1 bg-green-100 rounded">
                <CheckCircle2 className="w-3 h-3 text-green-600 mx-auto mb-1" />
                <span>목표 달성</span>
              </div>
              <div className="text-center p-1 bg-yellow-100 rounded">
                <AlertCircle className="w-3 h-3 text-yellow-600 mx-auto mb-1" />
                <span>주의 필요</span>
              </div>
              <div className="text-center p-1 bg-red-100 rounded">
                <XCircle className="w-3 h-3 text-red-600 mx-auto mb-1" />
                <span>위험 수준</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <Typography variant="caption" className="text-xs text-gray-600">
                커스텀 KPI: {customMetrics.length}개
              </Typography>
            </div>
          </div>
        </div>
      )}

      {/* 하단 요약 */}
      {config?.showSummary !== false && (
        <div className={cn("mt-3 pt-2 sm:mt-4 sm:pt-3 border-t", widgetColors.border.primary)}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1">
                <TrendingUp className={cn("w-3 h-3 sm:w-4 sm:h-4", widgetColors.status.success.icon)} />
                <Typography variant="caption" className={cn("text-[10px] sm:text-xs", widgetColors.text.secondary)}>
                  달성률 {summary.achievementRate}%
                </Typography>
              </div>
              <div className="flex items-center gap-1">
                <Activity className={cn("w-3 h-3 sm:w-4 sm:h-4", widgetColors.primary.icon)} />
                <Typography variant="caption" className={cn("text-[10px] sm:text-xs", widgetColors.text.secondary)}>
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