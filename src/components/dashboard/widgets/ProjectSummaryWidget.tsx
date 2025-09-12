'use client'

import React from 'react'
import { Target, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import Typography from '@/components/ui/Typography'

interface ProjectSummaryWidgetProps {
  className?: string
}

export function ProjectSummaryWidget({ className }: ProjectSummaryWidgetProps) {
  // 임시 데이터 - 추후 실제 API 연동
  const projectStats = {
    total: 24,
    active: 8,
    completed: 16,
    onSchedule: 85, // 퍼센트
  }

  return (
    <div className={`h-full bg-white p-4 ${className || ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-blue-600" />
        <Typography variant="h3" className="text-gray-900">
          프로젝트 요약
        </Typography>
      </div>

      <div className="space-y-4">
        {/* 총 프로젝트 수 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <Typography variant="body1" className="text-gray-700">
              총 프로젝트
            </Typography>
          </div>
          <Typography variant="body1" className="font-semibold text-gray-900">
            {projectStats.total}
          </Typography>
        </div>

        {/* 진행 중 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <Typography variant="body1" className="text-gray-700">
              진행 중
            </Typography>
          </div>
          <Typography variant="body1" className="font-semibold text-orange-600">
            {projectStats.active}
          </Typography>
        </div>

        {/* 완료됨 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <Typography variant="body1" className="text-gray-700">
              완료됨
            </Typography>
          </div>
          <Typography variant="body1" className="font-semibold text-green-600">
            {projectStats.completed}
          </Typography>
        </div>

        {/* 진행률 */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Typography variant="body2" className="text-gray-600">
              일정 준수율
            </Typography>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <Typography variant="body2" className="font-medium text-green-600">
                {projectStats.onSchedule}%
              </Typography>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${projectStats.onSchedule}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}