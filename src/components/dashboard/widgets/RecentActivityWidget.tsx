'use client'

import React from 'react'
import { Activity, FileText, Users, DollarSign, MessageSquare, Bell } from 'lucide-react'
import Typography from '@/components/ui/Typography'

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
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'client':
        return <Users className="w-4 h-4 text-green-500" />
      case 'invoice':
        return <DollarSign className="w-4 h-4 text-purple-500" />
      case 'message':
        return <MessageSquare className="w-4 h-4 text-orange-500" />
      case 'notification':
        return <Bell className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className={`h-full bg-white p-4 ${className || ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-orange-600" />
        <Typography variant="h3" className="text-gray-900">
          최근 활동
        </Typography>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            {/* 아이콘 */}
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>

            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <Typography variant="body1" className="font-medium text-gray-900">
                  {activity.title}
                </Typography>
                <Typography variant="body2" className="text-gray-500 flex-shrink-0 ml-2">
                  {activity.time}
                </Typography>
              </div>
              
              <Typography variant="body2" className="text-gray-600 leading-relaxed">
                {activity.description}
              </Typography>
              
              {activity.user && (
                <Typography variant="body2" className="text-gray-500 mt-1">
                  by {activity.user}
                </Typography>
              )}
            </div>

            {/* 연결선 (마지막 항목 제외) */}
            {index !== activities.length - 1 && (
              <div className="absolute left-6 mt-8 w-px h-4 bg-gray-200"></div>
            )}
          </div>
        ))}
      </div>

      {/* 더보기 링크 */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          모든 활동 보기
        </button>
      </div>
    </div>
  )
}