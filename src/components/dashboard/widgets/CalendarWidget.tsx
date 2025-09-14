'use client'

import React from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import Typography from '@/components/ui/Typography'

interface CalendarEvent {
  id: string
  title: string
  time: string
  location?: string
  type: 'meeting' | 'deadline' | 'event'
}

interface CalendarWidgetProps {
  className?: string
}

export function CalendarWidget({ className }: CalendarWidgetProps) {
  const today = new Date()
  const todayStr = today.toLocaleDateString('ko-KR', { 
    month: 'long', 
    day: 'numeric',
    weekday: 'short'
  })

  // 임시 데이터 - 추후 실제 캘린더 API 연동
  const todayEvents: CalendarEvent[] = [
    {
      id: '1',
      title: '클라이언트 미팅',
      time: '10:00',
      location: '회의실 A',
      type: 'meeting'
    },
    {
      id: '2',
      title: '프로젝트 제안서 마감',
      time: '17:00',
      type: 'deadline'
    },
    {
      id: '3',
      title: '팀 회식',
      time: '19:00',
      location: '강남 맛집',
      type: 'event'
    }
  ]

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-[var(--color-status-info)]/10 text-[var(--color-status-info)]'
      case 'deadline':
        return 'bg-[var(--color-status-error)]/10 text-[var(--color-status-error)]'
      case 'event':
        return 'bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]'
      default:
        return 'bg-[var(--color-primary-surfaceHover)] text-[var(--color-text-secondary)]'
    }
  }

  return (
    <div className={`h-full bg-[var(--color-primary-surface)] p-4 ${className || ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-[var(--color-status-progress)]" />
        <Typography variant="h3" className="text-[var(--color-text-primary)]">
          오늘 일정
        </Typography>
      </div>

      {/* 오늘 날짜 */}
      <div className="mb-4 p-3 bg-[var(--color-status-progress)]/10 rounded-lg">
        <Typography variant="h2" className="text-[var(--color-status-progress)]">
          {today.getDate()}
        </Typography>
        <Typography variant="body2" className="text-[var(--color-status-progress)]/80">
          {todayStr}
        </Typography>
      </div>

      {/* 일정 목록 */}
      <div className="space-y-3">
        {todayEvents.length > 0 ? (
          todayEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-primary-borderSecondary)] hover:shadow-sm transition-shadow"
            >
              <div className="flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                  <Typography variant="body2" className="font-medium text-[var(--color-text-secondary)]">
                    {event.time}
                  </Typography>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <Typography variant="body1" className="text-[var(--color-text-primary)]">
                  {event.title}
                </Typography>
                {event.location && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <Typography variant="body2" className="text-gray-500">
                      {event.location}
                    </Typography>
                  </div>
                )}
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEventColor(event.type)}`}>
                    {event.type === 'meeting' && '미팅'}
                    {event.type === 'deadline' && '마감'}
                    {event.type === 'event' && '행사'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <Typography variant="body1" className="text-gray-500">
              오늘 예정된 일정이 없습니다
            </Typography>
          </div>
        )}
      </div>

      {todayEvents.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
            총 {todayEvents.length}개 일정
          </Typography>
        </div>
      )}
    </div>
  )
}