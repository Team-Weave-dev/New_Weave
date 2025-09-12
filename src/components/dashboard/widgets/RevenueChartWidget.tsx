'use client'

import React from 'react'
import { TrendingUp, DollarSign, ArrowUp } from 'lucide-react'
import Typography from '@/components/ui/Typography'

interface RevenueChartWidgetProps {
  className?: string
}

export function RevenueChartWidget({ className }: RevenueChartWidgetProps) {
  // 임시 데이터 - 추후 실제 차트 라이브러리로 교체
  const revenueData = {
    thisMonth: 45200000,
    lastMonth: 38500000,
    change: 17.4,
    monthlyData: [
      { month: '8월', amount: 32000000 },
      { month: '9월', amount: 38500000 },
      { month: '10월', amount: 45200000 },
    ]
  }

  const formatCurrency = (amount: number) => {
    return `₩${(amount / 1000000).toFixed(1)}M`
  }

  return (
    <div className={`h-full bg-white p-4 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <Typography variant="h3" className="text-gray-900">
            매출 현황
          </Typography>
        </div>
        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
          <ArrowUp className="w-3 h-3 text-green-600" />
          <Typography variant="body2" className="font-medium text-green-600">
            {revenueData.change}%
          </Typography>
        </div>
      </div>

      <div className="space-y-4">
        {/* 이번 달 매출 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <Typography variant="body2" className="text-gray-600">
              이번 달 매출
            </Typography>
          </div>
          <Typography variant="h2" className="text-gray-900">
            {formatCurrency(revenueData.thisMonth)}
          </Typography>
        </div>

        {/* 간단한 바 차트 */}
        <div className="space-y-2">
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            최근 3개월 추이
          </Typography>
          {revenueData.monthlyData.map((data, index) => {
            const maxAmount = Math.max(...revenueData.monthlyData.map(d => d.amount))
            const percentage = (data.amount / maxAmount) * 100
            
            return (
              <div key={data.month} className="flex items-center gap-3">
                <Typography variant="body2" className="w-8 text-gray-600 dark:text-gray-400">
                  {data.month}
                </Typography>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      index === revenueData.monthlyData.length - 1
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <Typography variant="body2" className="w-12 text-right text-gray-600 dark:text-gray-400">
                  {formatCurrency(data.amount)}
                </Typography>
              </div>
            )
          })}
        </div>

        {/* 전월 대비 */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Typography variant="body2" className="text-gray-600">
              전월 대비
            </Typography>
            <Typography variant="body2" className="font-medium text-gray-900">
              +{formatCurrency(revenueData.thisMonth - revenueData.lastMonth)}
            </Typography>
          </div>
        </div>
      </div>
    </div>
  )
}