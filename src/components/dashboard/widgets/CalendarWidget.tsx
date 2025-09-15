'use client'

import React from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import Typography from '@/components/ui/Typography'
import { cn } from '@/lib/utils'
import { widgetColors } from '@/lib/dashboard/widget-colors'

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
        return cn(widgetColors.status.info.bgLight, widgetColors.status.info.text)
      case 'deadline':
        return cn(widgetColors.status.error.bgLight, widgetColors.status.error.text)
      case 'event':
        return cn(widgetColors.status.success.bgLight, widgetColors.status.success.text)
      default:
        return cn(widgetColors.bg.hover, widgetColors.text.secondary)
    }
  }

  return (
    <div className={cn("h-full flex flex-col p-3 sm:p-4", widgetColors.bg.surface, className)}>
      <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-shrink-0">
        <Calendar className={cn("h-4 w-4 sm:h-5 sm:w-5", widgetColors.primary.icon)} />
        <Typography variant="h3" className={cn("text-base sm:text-lg", widgetColors.text.primary)}>
          오늘 일정
        </Typography>
      </div>

      {/* 오늘 날짜 */}
      <div className={cn("mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg flex-shrink-0", widgetColors.primary.bgLight)}>
        <Typography variant="h2" className={cn("text-2xl sm:text-3xl", widgetColors.primary.text)}>
          {today.getDate()}
        </Typography>
        <Typography variant="body2" className={cn("text-xs sm:text-sm", widgetColors.primary.text, "opacity-80")}>
          {todayStr}
        </Typography>
      </div>

      {/* 일정 목록 */}
      <div className="flex-1 space-y-2 sm:space-y-3 overflow-y-auto min-h-0">
        {todayEvents.length > 0 ? (
          todayEvents.map((event) => (
            <div
              key={event.id}
              className={cn("flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border hover:shadow-sm transition-shadow", widgetColors.border.secondary)}
            >
              <div className="flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Clock className={cn("w-3 h-3", widgetColors.text.tertiary)} />
                  <Typography variant="body2" className={cn("font-medium text-xs sm:text-sm", widgetColors.text.secondary)}>
                    {event.time}
                  </Typography>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <Typography variant="body1" className={cn("text-sm sm:text-base", widgetColors.text.primary)}>
                  {event.title}
                </Typography>
                {event.location && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className={cn("w-3 h-3", widgetColors.icon.muted)} />
                    <Typography variant="body2" className={cn("text-xs sm:text-sm", widgetColors.text.tertiary)}>
                      {event.location}
                    </Typography>
                  </div>
                )}
                <div className="mt-2">
                  <span className={cn("inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium", getEventColor(event.type))}>
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
            <Calendar className={cn("w-8 h-8 mx-auto mb-2", widgetColors.icon.muted)} />
            <Typography variant="body1" className={cn("text-sm sm:text-base", widgetColors.text.tertiary)}>
              오늘 예정된 일정이 없습니다
            </Typography>
          </div>
        )}
      </div>

      {todayEvents.length > 0 && (
        <div className={cn("mt-3 pt-2 sm:mt-4 sm:pt-3 border-t text-center flex-shrink-0", widgetColors.border.secondary)}>
          <Typography variant="body2" className={cn("text-xs sm:text-sm", widgetColors.text.tertiary)}>
            총 {todayEvents.length}개 일정
          </Typography>
        </div>
      )}
    </div>
  )
}