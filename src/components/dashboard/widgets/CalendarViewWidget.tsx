'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, List, Grid3X3, Plus, Clock, MapPin, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { cn } from '@/lib/utils';
import { useWidgetData, sharedDataStore } from '@/lib/dashboard/shared-data-store';
import { emitWidgetEvent, WidgetEventTypes } from '@/lib/dashboard/widget-event-bus';
import { useCalendarDataStore, type CalendarEvent as DataServiceEvent } from '@/lib/dashboard/calendar-data-service';
import type { WidgetProps } from '@/types/dashboard';

// 위젯 내부에서 사용할 이벤트 타입 (CalendarDataService와 호환)
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date | string;
  end: Date | string;
  type: 'general' | 'tax' | 'project' | 'personal';
  location?: string;
  attendees?: string[];
  color?: string;
  allDay?: boolean;
}

type ViewMode = 'month' | 'week' | 'day';

const CalendarViewWidget: React.FC<WidgetProps> = ({
  id,
  type,
  config,
  isEditMode,
  className
}) => {
  const widgetId = id;
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  
  // CalendarDataService에서 데이터 가져오기
  const { events: calendarEvents, loadEvents, isLoading } = useCalendarDataStore();
  
  // 초기 데이터 로드
  useEffect(() => {
    loadEvents();
  }, []);
  
  // 이벤트 데이터 변환 및 타입 호환성 처리
  const events: CalendarEvent[] = useMemo(() => {
    return Array.from(calendarEvents.values())
      .filter(event => {
        // CalendarViewWidget에서 지원하는 타입만 필터링
        const supportedTypes = ['general', 'tax', 'project', 'personal'];
        return supportedTypes.includes(event.type);
      })
      .map(event => ({
        ...event,
        type: event.type as 'general' | 'tax' | 'project' | 'personal',
        start: new Date(event.start),
        end: new Date(event.end)
      }));
  }, [calendarEvents]);

  // 날짜 관련 유틸리티
  const getMonthDays = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, []);

  const getWeekDays = useCallback((date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      days.push(current);
    }
    
    return days;
  }, []);

  // 이벤트 필터링
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  }, [events]);

  // 네비게이션 핸들러
  const navigatePrevious = useCallback(() => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  const navigateNext = useCallback(() => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // 드래그 앤 드롭 핸들러
  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault();
    
    if (!draggedEvent) return;
    
    const startDate = new Date(draggedEvent.start);
    const endDate = new Date(draggedEvent.end);
    const duration = endDate.getTime() - startDate.getTime();
    
    const updatedEvent = {
      ...draggedEvent,
      start: date,
      end: new Date(date.getTime() + duration)
    };
    
    // 이벤트 업데이트를 SharedDataStore에 저장
    const updatedEvents = events.map(evt => 
      evt.id === updatedEvent.id ? updatedEvent : evt
    );
    
    sharedDataStore.setData(widgetId, { events: updatedEvents });
    
    // 이벤트 발행
    emitWidgetEvent(
      WidgetEventTypes.DATA_UPDATE,
      widgetId,
      {
        widgetId,
        data: { event: updatedEvent, action: 'move' },
        changes: ['event-moved']
      }
    );
    
    setDraggedEvent(null);
  }, [draggedEvent, events, widgetId]);

  // 이벤트 타입별 색상
  const getEventColor = useCallback((type: CalendarEvent['type']) => {
    const colors = {
      general: 'bg-blue-100 text-blue-700 border-blue-200',
      tax: 'bg-green-100 text-green-700 border-green-200',
      project: 'bg-purple-100 text-purple-700 border-purple-200',
      personal: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[type] || colors.general;
  }, []);

  // 월별 뷰 렌더링
  const renderMonthView = () => {
    const days = getMonthDays(currentDate);
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();
    const isToday = (date: Date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          const dateEvents = getEventsForDate(date);
          return (
            <div
              key={index}
              className={cn(
                'min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors',
                !isCurrentMonth(date) && 'bg-gray-50 opacity-50',
                isToday(date) && 'bg-blue-50 border-blue-300',
                selectedDate?.toDateString() === date.toDateString() && 'border-blue-500 border-2'
              )}
              onClick={() => setSelectedDate(date)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, date)}
            >
              <div className="font-medium text-sm mb-1">
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dateEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event)}
                    className={cn(
                      'text-xs p-1 rounded border truncate cursor-move',
                      getEventColor(event.type)
                    )}
                    title={event.title}
                  >
                    {event.allDay ? '종일' : new Date(event.start).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} {event.title}
                  </div>
                ))}
                {dateEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dateEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 주별 뷰 렌더링
  const renderWeekView = () => {
    const days = getWeekDays(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="overflow-auto max-h-[500px]">
        <div className="grid grid-cols-8 gap-0 min-w-[800px]">
          {/* 시간 헤더 */}
          <div className="sticky left-0 bg-white z-10"></div>
          {days.map((date, index) => (
            <div key={index} className="p-2 text-center border-b">
              <div className="text-sm font-medium">
                {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
              </div>
              <div className={cn(
                'text-lg',
                new Date().toDateString() === date.toDateString() && 'text-blue-600 font-bold'
              )}>
                {date.getDate()}
              </div>
            </div>
          ))}
          
          {/* 시간별 그리드 */}
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="p-2 text-right text-xs text-gray-500 border-t sticky left-0 bg-white">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((date, dayIndex) => {
                const hourEvents = events.filter(event => {
                  const eventStart = new Date(event.start);
                  return (
                    eventStart.toDateString() === date.toDateString() &&
                    eventStart.getHours() === hour
                  );
                });
                
                return (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className="border-t border-l p-1 min-h-[50px] hover:bg-gray-50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      const dropDate = new Date(date);
                      dropDate.setHours(hour);
                      handleDrop(e, dropDate);
                    }}
                  >
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, event)}
                        className={cn(
                          'text-xs p-1 rounded border mb-1 cursor-move',
                          getEventColor(event.type)
                        )}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // 일별 뷰 렌더링
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);
    
    return (
      <div className="overflow-auto max-h-[500px]">
        {hours.map(hour => {
          const hourEvents = dayEvents.filter(event => {
            const eventStart = new Date(event.start);
            return eventStart.getHours() === hour;
          });
          
          return (
            <div key={hour} className="flex border-b">
              <div className="w-20 p-2 text-right text-sm text-gray-500">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div 
                className="flex-1 p-2 min-h-[60px] hover:bg-gray-50"
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  const dropDate = new Date(currentDate);
                  dropDate.setHours(hour);
                  handleDrop(e, dropDate);
                }}
              >
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event)}
                    className={cn(
                      'p-2 rounded border mb-2 cursor-move',
                      getEventColor(event.type)
                    )}
                  >
                    <div className="font-medium text-sm">{event.title}</div>
                    {event.description && (
                      <div className="text-xs text-gray-600 mt-1">{event.description}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.attendees.length}명
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 편집 모드 뷰
  if (isEditMode) {
    return (
      <Card className={cn("h-full flex items-center justify-center bg-gray-50", className)}>
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-2 text-blue-600" />
          <Typography variant="body2" className="text-gray-600">
            캘린더 뷰
          </Typography>
          <Typography variant="caption" className="text-gray-500 mt-1">
            일정과 이벤트 표시
          </Typography>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <Typography variant="h3" className="text-lg font-semibold">
            캘린더
          </Typography>
        </div>
        
        {/* 뷰 모드 선택 */}
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'month' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('month')}
            className="px-2 py-1"
          >
            월
          </Button>
          <Button
            variant={viewMode === 'week' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
            className="px-2 py-1"
          >
            주
          </Button>
          <Button
            variant={viewMode === 'day' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('day')}
            className="px-2 py-1"
          >
            일
          </Button>
        </div>
      </div>

      {/* 네비게이션 바 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigatePrevious}
            className="p-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateToday}
            className="px-3 py-1"
          >
            오늘
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateNext}
            className="p-1"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <Typography variant="h4" className="text-base font-medium">
          {currentDate.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long',
            ...(viewMode === 'day' && { day: 'numeric' })
          })}
        </Typography>
        
        <Button
          variant="primary"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => {
            // 새 이벤트 추가 모달 오픈
            emitWidgetEvent(
              WidgetEventTypes.USER_ACTION,
              widgetId,
              {
                widgetId,
                action: 'add-event',
                payload: { date: selectedDate || currentDate }
              }
            );
          }}
        >
          <Plus className="w-4 h-4" />
          일정 추가
        </Button>
      </div>

      {/* 캘린더 뷰 */}
      <div className="relative">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* 선택된 날짜의 이벤트 미니 리스트 */}
      {selectedDate && viewMode === 'month' && (
        <div className="mt-4 pt-4 border-t">
          <Typography variant="h4" className="text-sm font-medium mb-2">
            {selectedDate.toLocaleDateString('ko-KR', { 
              month: 'long', 
              day: 'numeric' 
            })}의 일정
          </Typography>
          <div className="space-y-2 max-h-32 overflow-auto">
            {getEventsForDate(selectedDate).length === 0 ? (
              <div className="text-sm text-gray-500">일정이 없습니다</div>
            ) : (
              getEventsForDate(selectedDate).map(event => (
                <div
                  key={event.id}
                  className={cn(
                    'p-2 rounded border text-sm',
                    getEventColor(event.type)
                  )}
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs mt-1">
                    <Clock className="inline w-3 h-3 mr-1" />
                    {new Date(event.start).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {new Date(event.end).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// 목업 데이터 생성
function getMockEvents(): CalendarEvent[] {
  const today = new Date();
  const events: CalendarEvent[] = [
    {
      id: '1',
      title: '프로젝트 킥오프 미팅',
      description: '새 프로젝트 시작 회의',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
      type: 'project',
      location: '회의실 A',
      attendees: ['김철수', '이영희', '박민수']
    },
    {
      id: '2',
      title: '세무 신고 마감',
      description: '분기별 세무 신고',
      start: new Date(today.getFullYear(), today.getMonth(), 15, 9, 0),
      end: new Date(today.getFullYear(), today.getMonth(), 15, 18, 0),
      type: 'tax',
      allDay: true
    },
    {
      id: '3',
      title: '클라이언트 미팅',
      description: 'A사 진행 상황 공유',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 15, 0),
      type: 'project',
      location: '온라인'
    },
    {
      id: '4',
      title: '팀 빌딩 행사',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 18, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 21, 0),
      type: 'personal',
      location: '강남'
    },
    {
      id: '5',
      title: '월간 보고서 작성',
      start: new Date(today.getFullYear(), today.getMonth(), 25, 9, 0),
      end: new Date(today.getFullYear(), today.getMonth(), 25, 12, 0),
      type: 'general'
    }
  ];
  
  return events;
}

export default CalendarViewWidget;
export { CalendarViewWidget };

// 위젯 메타데이터
export const calendarViewWidgetMetadata = {
  name: '캘린더',
  description: '일정과 이벤트를 캘린더 형태로 표시',
  icon: 'calendar-days',
  defaultSize: { width: 2, height: 2 },
  minSize: { width: 2, height: 2 },
  maxSize: { width: 3, height: 3 },
  tags: ['캘린더', '일정', '이벤트'],
  configurable: true,
  version: '1.0.0'
};