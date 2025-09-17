'use client';

import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { 
  Calendar, 
  List, 
  Clock, 
  Search, 
  Filter, 
  ChevronDown,
  MapPin,
  Users,
  Tag,
  ArrowUpDown
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { cn } from '@/lib/utils';
import { useWidgetData } from '@/lib/dashboard/shared-data-store';
import { emitWidgetEvent, WidgetEventTypes } from '@/lib/dashboard/widget-event-bus';
import { 
  useCalendarDataStore, 
  type CalendarEvent,
  type EventType,
  type EventPriority,
  type EventStatus
} from '@/lib/dashboard/calendar-data-service';
import type { WidgetProps } from '@/types/dashboard';
import { FixedSizeList } from 'react-window';
import { areWidgetPropsEqual } from '@/lib/dashboard/optimization';

// EventItem을 CalendarEvent로 타입 별칭 설정
type EventItem = CalendarEvent;

type ViewMode = 'list' | 'timeline';
type SortBy = 'date' | 'title' | 'type' | 'priority';
type FilterBy = 'all' | 'today' | 'week' | 'month' | 'upcoming' | 'past';

// 가상 스크롤링 EventRow 컴포넌트의 props - React.memo로 최적화
interface EventRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    events: EventItem[];
    expandedEvents: Set<string>;
    handleEventClick: (event: EventItem) => void;
    getEventColor: (type: EventItem['type']) => string;
    getPriorityIndicator: (priority?: EventItem['priority']) => React.ReactNode;
  };
}

// 가상 스크롤링을 위한 EventRow 컴포넌트 - React.memo로 최적화
const EventRow = memo(({ index, style, data }: EventRowProps) => {
  const {
    events,
    expandedEvents,
    handleEventClick,
    getEventColor,
    getPriorityIndicator
  } = data;
  
  const event = events[index];
  if (!event) return null;
  
  const isExpanded = expandedEvents.has(event.id);
  const eventDate = new Date(event.start);
  const eventEndDate = new Date(event.end);
  const isToday = eventDate.toDateString() === new Date().toDateString();
  const isPast = eventEndDate < new Date();
  
  return (
    <div style={style} className="px-2">
      <div
        className={cn(
          "p-3 rounded-lg border cursor-pointer transition-all",
          isExpanded ? "shadow-md" : "hover:shadow-sm",
          isPast ? "opacity-60" : "",
          isToday ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        )}
        onClick={() => handleEventClick(event)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getPriorityIndicator(event.priority)}
              <Typography variant="body2" className="font-medium">
                {event.title}
              </Typography>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded",
                getEventColor(event.type)
              )}>
                {event.type}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {eventDate.toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
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
            
            {isExpanded && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                {event.description && (
                  <Typography variant="caption" className="text-gray-600 mb-2 block">
                    {event.description}
                  </Typography>
                )}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tag className="w-3 h-3 text-gray-400" />
                    {event.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <ChevronDown className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            isExpanded ? "rotate-180" : ""
          )} />
        </div>
      </div>
    </div>
  );
});

const EventListWidget: React.FC<WidgetProps> = memo(({
  id,
  type,
  config,
  isEditMode,
  className
}) => {
  const widgetId = id;
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // CalendarDataService에서 데이터 가져오기
  const { getEvents, loadEvents, isLoading, setFilters, setSortOptions } = useCalendarDataStore();
  
  // 초기 데이터 로드
  useEffect(() => {
    loadEvents();
  }, []);

  // 필터 및 정렬 업데이트
  useEffect(() => {
    const types = selectedType === 'all' ? undefined : [selectedType];
    setFilters({ types });
    setSortOptions({ field: sortBy, order: 'asc' });
  }, [selectedType, sortBy, setFilters, setSortOptions]);

  // 이벤트 데이터 가져오기
  const events: EventItem[] = useMemo(() => {
    return getEvents();
  }, [getEvents]);

  // 이벤트 필터링
  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    
    // 텍스트 검색
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // 타입 필터
    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedType);
    }
    
    // 시간 필터
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    switch (filterBy) {
      case 'today':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.start);
          return eventDate.toDateString() === today.toDateString();
        });
        break;
      case 'week':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.start);
          return eventDate >= today && eventDate <= weekEnd;
        });
        break;
      case 'month':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.start);
          return eventDate >= today && eventDate <= monthEnd;
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(event => new Date(event.start) >= now);
        break;
      case 'past':
        filtered = filtered.filter(event => new Date(event.end) < now);
        break;
    }
    
    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.start).getTime() - new Date(b.start).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
          return (priorityOrder[a.priority || 'undefined'] || 3) - (priorityOrder[b.priority || 'undefined'] || 3);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [events, searchQuery, selectedType, filterBy, sortBy]);

  // 이벤트 확장/축소 토글
  const toggleEventExpanded = useCallback((eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  }, []);

  // 이벤트 클릭 핸들러
  const handleEventClick = useCallback((event: EventItem) => {
    emitWidgetEvent(
      WidgetEventTypes.USER_ACTION,
      widgetId,
      {
        widgetId,
        action: 'event-click',
        payload: event
      }
    );
    toggleEventExpanded(event.id);
  }, [widgetId, toggleEventExpanded]);

  // 이벤트 타입별 색상
  const getEventColor = useCallback((type: EventItem['type']) => {
    const colors = {
      general: 'bg-blue-100 text-blue-700 border-blue-200',
      tax: 'bg-green-100 text-green-700 border-green-200',
      project: 'bg-purple-100 text-purple-700 border-purple-200',
      personal: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[type] || colors.general;
  }, []);

  // 우선순위 표시
  const getPriorityIndicator = useCallback((priority?: EventItem['priority']) => {
    if (!priority) return null;
    const indicators = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };
    return indicators[priority];
  }, []);

  // 편집 모드 뷰
  if (isEditMode) {
    return (
      <Card className={cn("h-full flex items-center justify-center bg-gray-50", className)}>
        <div className="text-center">
          <List className="w-12 h-12 mx-auto mb-2 text-blue-600" />
          <Typography variant="body2" className="text-gray-600">
            이벤트 목록
          </Typography>
          <Typography variant="caption" className="text-gray-500 mt-1">
            일정과 이벤트를 목록으로 표시
          </Typography>
        </div>
      </Card>
    );
  }

  // 리스트 뷰 렌더링 with 가상 스크롤링
  const renderListView = () => {
    if (filteredEvents.length === 0) {
      return (
        <div className="text-center py-8">
          <Typography variant="body2" className="text-gray-500">
            이벤트가 없습니다
          </Typography>
        </div>
      );
    }

    // 가상 스크롤링 사용
    return (
      <FixedSizeList
        height={400} // 위젯 높이에 맞게 조정
        itemCount={filteredEvents.length}
        itemSize={expandedEvents.size > 0 ? 150 : 90} // 확장된 아이템이 있을 때 더 큰 높이
        width="100%"
        itemData={{
          events: filteredEvents,
          expandedEvents,
          handleEventClick,
          getEventColor,
          getPriorityIndicator
        }}
      >
        {EventRow}
      </FixedSizeList>
    );
  };

  // 타임라인 뷰 렌더링
  const renderTimelineView = () => {
    const groupedByDate = filteredEvents.reduce((acc, event) => {
      const date = new Date(event.start).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {} as Record<string, EventItem[]>);

    return (
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        {Object.entries(groupedByDate).map(([date, dateEvents]) => (
          <div key={date} className="mb-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                {new Date(date).getDate()}
              </div>
              <Typography variant="caption" className="ml-3 text-gray-600">
                {new Date(date).toLocaleDateString('ko-KR', { 
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </div>
            <div className="ml-12 space-y-2">
              {dateEvents.map(event => (
                <div
                  key={event.id}
                  className={cn(
                    "p-2 rounded border cursor-pointer hover:shadow-sm",
                    getEventColor(event.type)
                  )}
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex items-center justify-between">
                    <Typography variant="caption" className="font-medium">
                      {event.title}
                    </Typography>
                    <Typography variant="caption">
                      {new Date(event.start).toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={cn('p-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <Typography variant="h3" className="text-lg font-semibold">
            이벤트 목록
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            ({filteredEvents.length}개)
          </Typography>
        </div>
        
        {/* 뷰 모드 전환 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded",
              viewMode === 'list' ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={cn(
              "p-1.5 rounded",
              viewMode === 'timeline' ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"
            )}
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="space-y-2 mb-3">
        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="이벤트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
          />
        </div>
        
        {/* 필터 및 정렬 */}
        <div className="flex gap-2">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
            <option value="upcoming">예정</option>
            <option value="past">지난 일정</option>
          </select>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as EventItem['type'] | 'all')}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
          >
            <option value="all">모든 타입</option>
            <option value="general">일반</option>
            <option value="tax">세무</option>
            <option value="project">프로젝트</option>
            <option value="personal">개인</option>
          </select>
          
          <button
            onClick={() => {
              const sortOptions: SortBy[] = ['date', 'title', 'type', 'priority'];
              const currentIndex = sortOptions.indexOf(sortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              setSortBy(sortOptions[nextIndex]);
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortBy === 'date' && '날짜'}
            {sortBy === 'title' && '제목'}
            {sortBy === 'type' && '타입'}
            {sortBy === 'priority' && '우선순위'}
          </button>
        </div>
      </div>

      {/* 이벤트 목록 */}
      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Typography variant="body2">일정이 없습니다</Typography>
          </div>
        ) : viewMode === 'list' ? (
          renderListView()
        ) : (
          renderTimelineView()
        )}
      </div>
    </Card>
  );
}, areWidgetPropsEqual);

// 목업 데이터 생성
function getMockEvents(): EventItem[] {
  const today = new Date();
  
  return [
    {
      id: '1',
      title: '프로젝트 킥오프 미팅',
      description: '새 프로젝트 시작 회의',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
      type: 'project',
      location: '회의실 A',
      attendees: ['김철수', '이영희', '박민수'],
      tags: ['중요', '킥오프'],
      priority: 'high',
      status: 'upcoming'
    },
    {
      id: '2',
      title: '세무 신고 마감',
      description: '분기별 세무 신고',
      start: new Date(today.getFullYear(), today.getMonth(), 15, 9, 0),
      end: new Date(today.getFullYear(), today.getMonth(), 15, 18, 0),
      type: 'tax',
      tags: ['세무', '마감일'],
      priority: 'high',
      status: 'upcoming'
    },
    {
      id: '3',
      title: '클라이언트 미팅',
      description: 'A사 진행 상황 공유',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 15, 0),
      type: 'project',
      location: '온라인',
      attendees: ['김대리', 'A사 담당자'],
      priority: 'medium',
      status: 'upcoming'
    },
    {
      id: '4',
      title: '팀 빌딩 행사',
      description: '분기별 팀 빌딩',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 18, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 21, 0),
      type: 'personal',
      location: '강남',
      attendees: ['전체 팀원'],
      tags: ['팀빌딩', '회식'],
      priority: 'low',
      status: 'upcoming'
    },
    {
      id: '5',
      title: '월간 보고서 작성',
      start: new Date(today.getFullYear(), today.getMonth(), 25, 9, 0),
      end: new Date(today.getFullYear(), today.getMonth(), 25, 12, 0),
      type: 'general',
      tags: ['보고서', '월간'],
      priority: 'medium',
      status: 'upcoming'
    },
    {
      id: '6',
      title: '완료된 프로젝트 리뷰',
      description: 'B프로젝트 회고',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 14, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 16, 0),
      type: 'project',
      tags: ['회고', '완료'],
      priority: 'low',
      status: 'completed'
    }
  ];
}

export default EventListWidget;
export { EventListWidget };

// 위젯 메타데이터
export const eventListWidgetMetadata = {
  name: '이벤트 목록',
  description: '일정과 이벤트를 목록 형태로 표시',
  icon: 'list',
  defaultSize: { width: 2, height: 2 },
  minSize: { width: 2, height: 1 },
  maxSize: { width: 4, height: 3 },
  tags: ['일정', '이벤트', '목록'],
  configurable: true,
  version: '1.0.0'
};