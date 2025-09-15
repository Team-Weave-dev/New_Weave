'use client'

import React from 'react'
import { Activity, FileText, Users, DollarSign, MessageSquare, Bell } from 'lucide-react'
import Typography from '@/components/ui/Typography'
import { cn } from '@/lib/utils'
import { widgetColors } from '@/lib/dashboard/widget-colors'

interface ActivityItem {
  id: string
  type: 'project' | 'client' | 'invoice' | 'message' | 'notification'
  title: string
  description: string
  time: string
  user?: string
}

interface RecentActivityWidgetProps {
  className?: string
}

export function RecentActivityWidget({ className }: RecentActivityWidgetProps) {
  // 임시 데이터 - 추후 실제 활동 로그 API 연동
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'project',
      title: '프로젝트 업데이트',
      description: '웹사이트 리뉴얼 프로젝트가 90% 완료되었습니다',
      time: '2분 전',
      user: '김개발'
    },
    {
      id: '2',
      type: 'invoice',
      title: '청구서 발송',
      description: 'ABC 회사에 11월 청구서를 발송했습니다',
      time: '15분 전',
      user: '박회계'
    },
    {
      id: '3',
      type: 'client',
      title: '새 클라이언트',
      description: 'XYZ 스타트업이 새로운 고객으로 등록되었습니다',
      time: '1시간 전',
      user: '이영업'
    },
    {
      id: '4',
      type: 'message',
      title: '메시지 수신',
      description: '클라이언트로부터 프로젝트 피드백을 받았습니다',
      time: '2시간 전'
    },
    {
      id: '5',
      type: 'notification',
      title: '마감일 알림',
      description: '내일까지 완료해야 할 작업이 3개 있습니다',
      time: '3시간 전'
    }
  ]

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'project':
        return <FileText className={cn("w-4 h-4", widgetColors.status.info.icon)} />
      case 'client':
        return <Users className={cn("w-4 h-4", widgetColors.status.success.icon)} />
      case 'invoice':
        return <DollarSign className={cn("w-4 h-4", widgetColors.primary.icon)} />
      case 'message':
        return <MessageSquare className={cn("w-4 h-4", widgetColors.status.warning.icon)} />
      case 'notification':
        return <Bell className={cn("w-4 h-4", widgetColors.status.error.icon)} />
      default:
        return <Activity className={cn("w-4 h-4", widgetColors.text.tertiary)} />
    }
  }

  return (
    <div className={cn("h-full p-4", widgetColors.bg.surface, className)}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className={cn("h-5 w-5", widgetColors.secondary.icon)} />
        <Typography variant="h3" className={widgetColors.text.primary}>
          최근 활동
        </Typography>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={cn("flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer", "hover:" + widgetColors.bg.hover)}
          >
            {/* 아이콘 */}
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>

            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <Typography variant="body1" className={cn("font-medium", widgetColors.text.primary)}>
                  {activity.title}
                </Typography>
                <Typography variant="body2" className={cn("flex-shrink-0 ml-2", widgetColors.text.tertiary)}>
                  {activity.time}
                </Typography>
              </div>
              
              <Typography variant="body2" className={cn("leading-relaxed", widgetColors.text.secondary)}>
                {activity.description}
              </Typography>
              
              {activity.user && (
                <Typography variant="body2" className={cn("mt-1", widgetColors.text.tertiary)}>
                  by {activity.user}
                </Typography>
              )}
            </div>

            {/* 연결선 (마지막 항목 제외) */}
            {index !== activities.length - 1 && (
              <div className={cn("absolute left-6 mt-8 w-px h-4", widgetColors.border.secondary)}></div>
            )}
          </div>
        ))}
      </div>

      {/* 더보기 링크 */}
      <div className={cn("mt-4 pt-3 border-t text-center", widgetColors.border.secondary)}>
        <button className={cn("text-sm font-medium", widgetColors.primary.text, widgetColors.primary.textHover)}>
          모든 활동 보기
        </button>
      </div>
    </div>
  )
}