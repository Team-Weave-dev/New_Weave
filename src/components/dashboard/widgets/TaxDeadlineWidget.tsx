'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import type { WidgetProps } from '@/types/dashboard'
import { cn } from '@/lib/utils'
import { widgetColors } from '@/lib/dashboard/widget-colors'

interface TaxDeadline {
  id: string
  title: string
  date: Date
  type: 'vat' | 'income' | 'corporate' | 'withholding' | 'other'
  priority: 'high' | 'medium' | 'low'
  description?: string
  recurring?: 'monthly' | 'quarterly' | 'annually'
}

// 세무 타입별 색상
const taxTypeColors = {
  vat: cn(widgetColors.primary.bgLight, widgetColors.primary.text),
  income: cn(widgetColors.status.success.bgLight, widgetColors.status.success.text),
  corporate: cn(widgetColors.secondary.bgLight, widgetColors.secondary.text),
  withholding: cn(widgetColors.status.warning.bgLight, widgetColors.status.warning.text),
  other: cn(widgetColors.bg.surfaceSecondary, widgetColors.text.secondary)
}

// 세무 타입 레이블
const taxTypeLabels = {
  vat: '부가세',
  income: '소득세',
  corporate: '법인세',
  withholding: '원천세',
  other: '기타'
}

// 한국 세무 일정 (예시 데이터)
const koreanTaxDeadlines: TaxDeadline[] = [
  {
    id: '1',
    title: '부가세 신고',
    date: new Date(2024, 0, 25), // 1월 25일
    type: 'vat',
    priority: 'high',
    description: '2023년 2기 부가가치세 신고',
    recurring: 'quarterly'
  },
  {
    id: '2',
    title: '원천세 납부',
    date: new Date(2024, 0, 10), // 매월 10일
    type: 'withholding',
    priority: 'high',
    description: '전월분 원천징수세 납부',
    recurring: 'monthly'
  },
  {
    id: '3',
    title: '법인세 중간예납',
    date: new Date(2024, 1, 28), // 2월 28일
    type: 'corporate',
    priority: 'medium',
    description: '2023년 법인세 중간예납',
    recurring: 'annually'
  },
  {
    id: '4',
    title: '종합소득세 신고',
    date: new Date(2024, 4, 31), // 5월 31일
    type: 'income',
    priority: 'high',
    description: '2023년 종합소득세 확정신고',
    recurring: 'annually'
  }
]

export function TaxDeadlineWidget({
  id,
  type,
  config,
  isEditMode,
  className
}: WidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month')
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([])

  useEffect(() => {
    // 실제로는 Supabase에서 데이터를 가져옴
    // 현재는 예시 데이터 사용
    const loadDeadlines = () => {
      // 현재 월의 세무 일정 필터링
      const monthDeadlines = koreanTaxDeadlines.map(deadline => {
        // 반복 일정 처리
        const newDate = new Date(deadline.date)
        newDate.setFullYear(selectedMonth.getFullYear())
        
        if (deadline.recurring === 'monthly') {
          newDate.setMonth(selectedMonth.getMonth())
        } else if (deadline.recurring === 'quarterly') {
          // 분기별 처리
          const quarter = Math.floor(selectedMonth.getMonth() / 3)
          newDate.setMonth(quarter * 3 + (deadline.date.getMonth() % 3))
        }
        
        return {
          ...deadline,
          date: newDate
        }
      }).filter(deadline => {
        // 선택된 월에 해당하는 일정만 필터
        return deadline.date.getMonth() === selectedMonth.getMonth() &&
               deadline.date.getFullYear() === selectedMonth.getFullYear()
      })
      
      setDeadlines(monthDeadlines)
    }

    if (!isEditMode) {
      loadDeadlines()
    } else {
      // 편집 모드에서는 샘플 데이터
      setDeadlines([
        {
          id: 'sample1',
          title: '부가세 신고',
          date: new Date(),
          type: 'vat',
          priority: 'high',
          recurring: 'quarterly'
        }
      ])
    }
  }, [selectedMonth, isEditMode])

  // 월 변경 핸들러
  const changeMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  // 일정까지 남은 일수 계산
  const getDaysUntil = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    const diff = date.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // 편집 모드 뷰
  if (isEditMode) {
    return (
      <Card className={cn("h-full flex items-center justify-center bg-gray-50", className)}>
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <Typography variant="body2" className="text-gray-600">
            세무 캘린더
          </Typography>
          <Typography variant="caption" className="text-gray-500 mt-1">
            세무 일정 관리
          </Typography>
        </div>
      </Card>
    )
  }

  // 캘린더 그리드 생성
  const generateCalendarGrid = () => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const calendarDays = generateCalendarGrid()
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <Card className={cn("h-full p-4 flex flex-col", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className={cn("w-5 h-5", widgetColors.secondary.icon)} />
          <Typography variant="h3" className={widgetColors.text.primary}>
            세무 캘린더
          </Typography>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth('prev')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Typography variant="body2" className="px-2 font-medium">
            {selectedMonth.getFullYear()}년 {monthNames[selectedMonth.getMonth()]}
          </Typography>
          <button
            onClick={() => changeMonth('next')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 뷰 모드 토글 */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setViewMode('month')}
          className={cn(
            "flex-1 py-1 px-2 rounded text-sm",
            viewMode === 'month' 
              ? cn(widgetColors.secondary.bg, "text-white")
              : cn(widgetColors.bg.surfaceSecondary, widgetColors.text.tertiary)
          )}
        >
          월간
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={cn(
            "flex-1 py-1 px-2 rounded text-sm",
            viewMode === 'list' 
              ? cn(widgetColors.secondary.bg, "text-white")
              : cn(widgetColors.bg.surfaceSecondary, widgetColors.text.tertiary)
          )}
        >
          목록
        </button>
      </div>

      {/* 캘린더 뷰 */}
      {viewMode === 'month' ? (
        <div className="flex-1 overflow-auto">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map(day => (
              <div key={day} className="text-center">
                <Typography variant="caption" className={cn(
                  widgetColors.text.tertiary,
                  day === '일' && widgetColors.status.error.text,
                  day === '토' && widgetColors.primary.text
                )}>
                  {day}
                </Typography>
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === selectedMonth.getMonth()
              const isToday = day.toDateString() === currentDate.toDateString()
              const dayDeadlines = deadlines.filter(d => 
                d.date.toDateString() === day.toDateString()
              )
              
              return (
                <div
                  key={index}
                  className={cn(
                    "aspect-square p-0.5 sm:p-1 border rounded text-center relative text-xs sm:text-sm",
                    isCurrentMonth 
                      ? "bg-white border-gray-200" 
                      : "bg-gray-50 border-gray-100",
                    isToday && cn("ring-2", "ring-" + widgetColors.secondary.border.split('-')[1]),
                    dayDeadlines.length > 0 && widgetColors.status.error.bgLight
                  )}
                >
                  <Typography 
                    variant="caption" 
                    className={cn(
                      isCurrentMonth ? widgetColors.text.primary : widgetColors.text.muted,
                      day.getDay() === 0 && widgetColors.status.error.text,
                      day.getDay() === 6 && widgetColors.primary.text
                    )}
                  >
                    {day.getDate()}
                  </Typography>
                  {dayDeadlines.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 px-1">
                      <div className={cn("w-full h-1 rounded-full", widgetColors.status.error.bg)} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* 목록 뷰 */
        <div className="flex-1 overflow-y-auto">
          {deadlines.length === 0 ? (
            <div className="text-center py-8">
              <Typography variant="body2" className="text-gray-500">
                이번 달 세무 일정이 없습니다
              </Typography>
            </div>
          ) : (
            <div className="space-y-2">
              {deadlines.sort((a, b) => a.date.getTime() - b.date.getTime()).map(deadline => {
                const daysUntil = getDaysUntil(deadline.date)
                const isOverdue = daysUntil < 0
                const isUrgent = daysUntil >= 0 && daysUntil <= 3
                
                return (
                  <div
                    key={deadline.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      isOverdue && cn(widgetColors.status.error.bgLight, widgetColors.border.primary),
                      isUrgent && cn(widgetColors.status.warning.bgLight, widgetColors.border.primary),
                      !isOverdue && !isUrgent && widgetColors.border.secondary
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            taxTypeColors[deadline.type]
                          )}>
                            {taxTypeLabels[deadline.type]}
                          </span>
                          <Typography variant="body2" className="font-medium">
                            {deadline.title}
                          </Typography>
                        </div>
                        {deadline.description && (
                          <Typography variant="caption" className="text-gray-600">
                            {deadline.description}
                          </Typography>
                        )}
                      </div>
                      <div className="text-right">
                        <Typography variant="caption" className="text-gray-500">
                          {deadline.date.getMonth() + 1}월 {deadline.date.getDate()}일
                        </Typography>
                        {daysUntil >= 0 ? (
                          <Typography 
                            variant="caption" 
                            className={cn(
                              "block",
                              isUrgent ? cn(widgetColors.status.warning.text, "font-medium") : widgetColors.text.tertiary
                            )}
                          >
                            D-{daysUntil}
                          </Typography>
                        ) : (
                          <Typography variant="caption" className={cn("block font-medium", widgetColors.status.error.text)}>
                            {Math.abs(daysUntil)}일 지남
                          </Typography>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 다가오는 일정 알림 */}
      {!isEditMode && deadlines.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <AlertCircle className={cn("w-4 h-4", widgetColors.status.warning.icon)} />
            <Typography variant="caption" className="text-gray-600">
              다가오는 일정: {deadlines.filter(d => {
                const days = getDaysUntil(d.date)
                return days >= 0 && days <= 7
              }).length}개
            </Typography>
          </div>
        </div>
      )}
    </Card>
  )
}

// 위젯 메타데이터
export const taxDeadlineWidgetMetadata = {
  name: '세무 캘린더',
  description: '세무 관련 마감일과 일정을 표시',
  icon: 'calendar',
  defaultSize: { width: 2, height: 2 },
  minSize: { width: 2, height: 2 },
  maxSize: { width: 4, height: 4 },
  tags: ['세무', '캘린더', '마감일'],
  configurable: true,
  version: '1.0.0'
}

export default TaxDeadlineWidget