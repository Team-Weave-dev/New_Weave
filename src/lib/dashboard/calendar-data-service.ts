/**
 * CalendarDataService - 통합 캘린더 데이터 서비스 레이어
 * 
 * 이벤트 타입 시스템과 데이터 관리를 담당하는 서비스
 * 현재는 목 데이터를 사용하지만, Supabase 연동을 위한 인터페이스 제공
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { emitWidgetEvent, WidgetEventTypes } from './widget-event-bus';
import { sharedDataStore } from './shared-data-store';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * 이벤트 타입 정의
 */
export type EventType = 'general' | 'tax' | 'project' | 'personal' | 'meeting' | 'deadline';

/**
 * 이벤트 우선순위
 */
export type EventPriority = 'high' | 'medium' | 'low';

/**
 * 이벤트 상태
 */
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';

/**
 * 이벤트 반복 타입
 */
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * 캘린더 이벤트 인터페이스
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date | string;
  end: Date | string;
  type: EventType;
  location?: string;
  attendees?: string[];
  tags?: string[];
  priority?: EventPriority;
  status?: EventStatus;
  allDay?: boolean;
  color?: string;
  reminder?: {
    type: 'email' | 'notification';
    before: number; // minutes
  };
  recurrence?: {
    type: RecurrenceType;
    interval?: number;
    endDate?: Date | string;
    exceptions?: Date[];
  };
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: string;
}

/**
 * 이벤트 필터 옵션
 */
export interface EventFilterOptions {
  startDate?: Date;
  endDate?: Date;
  types?: EventType[];
  priorities?: EventPriority[];
  statuses?: EventStatus[];
  tags?: string[];
  searchQuery?: string;
}

/**
 * 이벤트 정렬 옵션
 */
export interface EventSortOptions {
  field: 'date' | 'title' | 'type' | 'priority' | 'status';
  order: 'asc' | 'desc';
}

/**
 * 캘린더 데이터 서비스 상태
 */
interface CalendarDataState {
  events: Map<string, CalendarEvent>;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  filters: EventFilterOptions;
  sortOptions: EventSortOptions;
  
  // Actions
  loadEvents: () => Promise<void>;
  getEvent: (id: string) => CalendarEvent | undefined;
  getEvents: (filters?: EventFilterOptions) => CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (id: string) => Promise<void>;
  setFilters: (filters: EventFilterOptions) => void;
  setSortOptions: (options: EventSortOptions) => void;
  syncWithSupabase: () => Promise<void>;
  generateRecurringEvents: (baseEvent: CalendarEvent) => CalendarEvent[];
  clearCache: () => void;
}

// ============================================================================
// Mock Data Generator
// ============================================================================

/**
 * 목 이벤트 데이터 생성
 */
function generateMockEvents(): CalendarEvent[] {
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
      attendees: ['김철수', '이영희', '박민수'],
      tags: ['중요', '킥오프', '프로젝트'],
      priority: 'high',
      status: 'upcoming',
      reminder: { type: 'notification', before: 30 },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user123'
    },
    {
      id: '2',
      title: '세무 신고 마감',
      description: '분기별 세무 신고',
      start: new Date(today.getFullYear(), today.getMonth(), 15, 9, 0),
      end: new Date(today.getFullYear(), today.getMonth(), 15, 18, 0),
      type: 'tax',
      tags: ['세무', '마감일', '분기'],
      priority: 'high',
      status: 'upcoming',
      allDay: true,
      color: '#10b981',
      reminder: { type: 'email', before: 1440 }, // 하루 전
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user123'
    },
    {
      id: '3',
      title: '주간 팀 미팅',
      description: '정기 팀 회의',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 15, 0),
      type: 'meeting',
      location: '온라인',
      attendees: ['전체 팀원'],
      priority: 'medium',
      status: 'upcoming',
      recurrence: {
        type: 'weekly',
        interval: 1
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user123'
    },
    {
      id: '4',
      title: '클라이언트 미팅',
      description: 'A사 진행 상황 공유',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 14, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0),
      type: 'project',
      location: '온라인',
      attendees: ['김대리', 'A사 담당자'],
      priority: 'medium',
      status: 'upcoming',
      tags: ['클라이언트', 'A사'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user123'
    },
    {
      id: '5',
      title: '프로젝트 마감',
      description: 'B프로젝트 최종 납품',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 18, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 18, 0),
      type: 'deadline',
      priority: 'high',
      status: 'upcoming',
      color: '#ef4444',
      tags: ['마감', 'B프로젝트', '납품'],
      reminder: { type: 'notification', before: 120 },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user123'
    },
    {
      id: '6',
      title: '팀 빌딩 행사',
      description: '분기별 팀 빌딩',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 18, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 21, 0),
      type: 'personal',
      location: '강남',
      attendees: ['전체 팀원'],
      tags: ['팀빌딩', '회식'],
      priority: 'low',
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user123'
    },
    {
      id: '7',
      title: '월간 보고서 작성',
      start: new Date(today.getFullYear(), today.getMonth(), 25, 9, 0),
      end: new Date(today.getFullYear(), today.getMonth(), 25, 12, 0),
      type: 'general',
      tags: ['보고서', '월간'],
      priority: 'medium',
      status: 'upcoming',
      recurrence: {
        type: 'monthly',
        interval: 1
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user123'
    },
    {
      id: '8',
      title: '완료된 프로젝트 리뷰',
      description: 'C프로젝트 회고',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 14, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 16, 0),
      type: 'project',
      tags: ['회고', '완료', 'C프로젝트'],
      priority: 'low',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user123'
    }
  ];
  
  return events;
}

// ============================================================================
// Calendar Data Service Store
// ============================================================================

/**
 * 캘린더 데이터 서비스 스토어
 */
export const useCalendarDataStore = create<CalendarDataState>()(
  subscribeWithSelector((set, get) => ({
    events: new Map(),
    isLoading: false,
    error: null,
    lastSyncTime: null,
    filters: {},
    sortOptions: { field: 'date', order: 'asc' },
    
    /**
     * 이벤트 로드 (현재는 목 데이터)
     */
    loadEvents: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // TODO: Supabase 연동 시 실제 데이터 로드
        // const { data, error } = await supabase
        //   .from('calendar_events')
        //   .select('*');
        
        // 현재는 목 데이터 사용
        const mockEvents = generateMockEvents();
        const eventsMap = new Map<string, CalendarEvent>();
        
        mockEvents.forEach(event => {
          eventsMap.set(event.id, event);
        });
        
        set({ 
          events: eventsMap,
          isLoading: false,
          lastSyncTime: new Date()
        });
        
        // SharedDataStore에도 데이터 공유
        sharedDataStore.setGlobalData('calendarEvents', mockEvents);
        
        // 이벤트 발행
        emitWidgetEvent(
          WidgetEventTypes.DATA_UPDATE,
          'calendar-service',
          { 
            widgetId: 'calendar-service',
            data: { events: mockEvents },
            changes: ['events']
          }
        );
        
      } catch (error) {
        console.error('Failed to load events:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load events',
          isLoading: false 
        });
      }
    },
    
    /**
     * 단일 이벤트 조회
     */
    getEvent: (id: string) => {
      return get().events.get(id);
    },
    
    /**
     * 이벤트 목록 조회 (필터링 적용)
     */
    getEvents: (filters?: EventFilterOptions) => {
      const state = get();
      let events = Array.from(state.events.values());
      const appliedFilters = filters || state.filters;
      
      // 필터링 적용
      if (appliedFilters.startDate) {
        events = events.filter(event => 
          new Date(event.start) >= appliedFilters.startDate!
        );
      }
      
      if (appliedFilters.endDate) {
        events = events.filter(event => 
          new Date(event.start) <= appliedFilters.endDate!
        );
      }
      
      if (appliedFilters.types && appliedFilters.types.length > 0) {
        events = events.filter(event => 
          appliedFilters.types!.includes(event.type)
        );
      }
      
      if (appliedFilters.priorities && appliedFilters.priorities.length > 0) {
        events = events.filter(event => 
          event.priority && appliedFilters.priorities!.includes(event.priority)
        );
      }
      
      if (appliedFilters.statuses && appliedFilters.statuses.length > 0) {
        events = events.filter(event => 
          event.status && appliedFilters.statuses!.includes(event.status)
        );
      }
      
      if (appliedFilters.tags && appliedFilters.tags.length > 0) {
        events = events.filter(event => 
          event.tags?.some(tag => appliedFilters.tags!.includes(tag))
        );
      }
      
      if (appliedFilters.searchQuery) {
        const query = appliedFilters.searchQuery.toLowerCase();
        events = events.filter(event => 
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query) ||
          event.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      // 정렬 적용
      events.sort((a, b) => {
        const { field, order } = state.sortOptions;
        let comparison = 0;
        
        switch (field) {
          case 'date':
            comparison = new Date(a.start).getTime() - new Date(b.start).getTime();
            break;
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const aPriority = a.priority ? priorityOrder[a.priority] : 3;
            const bPriority = b.priority ? priorityOrder[b.priority] : 3;
            comparison = aPriority - bPriority;
            break;
          case 'status':
            const statusOrder = { upcoming: 0, ongoing: 1, completed: 2, cancelled: 3, postponed: 4 };
            const aStatus = a.status ? statusOrder[a.status] : 5;
            const bStatus = b.status ? statusOrder[b.status] : 5;
            comparison = aStatus - bStatus;
            break;
        }
        
        return order === 'asc' ? comparison : -comparison;
      });
      
      return events;
    },
    
    /**
     * 이벤트 추가
     */
    addEvent: async (eventData) => {
      try {
        // TODO: Supabase 연동
        // const { data, error } = await supabase
        //   .from('calendar_events')
        //   .insert(eventData)
        //   .select()
        //   .single();
        
        // 목 데이터 생성
        const newEvent: CalendarEvent = {
          ...eventData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user123'
        };
        
        const state = get();
        const newEvents = new Map(state.events);
        newEvents.set(newEvent.id, newEvent);
        
        set({ events: newEvents });
        
        // SharedDataStore 업데이트
        const allEvents = Array.from(newEvents.values());
        sharedDataStore.setGlobalData('calendarEvents', allEvents);
        
        // 이벤트 발행
        emitWidgetEvent(
          WidgetEventTypes.DATA_UPDATE,
          'calendar-service',
          { 
            widgetId: 'calendar-service',
            data: { event: newEvent },
            changes: ['add']
          }
        );
        
        return newEvent;
        
      } catch (error) {
        console.error('Failed to add event:', error);
        throw error;
      }
    },
    
    /**
     * 이벤트 업데이트
     */
    updateEvent: async (id, updates) => {
      try {
        // TODO: Supabase 연동
        // const { data, error } = await supabase
        //   .from('calendar_events')
        //   .update(updates)
        //   .eq('id', id)
        //   .select()
        //   .single();
        
        const state = get();
        const existingEvent = state.events.get(id);
        
        if (!existingEvent) {
          throw new Error('Event not found');
        }
        
        const updatedEvent: CalendarEvent = {
          ...existingEvent,
          ...updates,
          updatedAt: new Date()
        };
        
        const newEvents = new Map(state.events);
        newEvents.set(id, updatedEvent);
        
        set({ events: newEvents });
        
        // SharedDataStore 업데이트
        const allEvents = Array.from(newEvents.values());
        sharedDataStore.setGlobalData('calendarEvents', allEvents);
        
        // 이벤트 발행
        emitWidgetEvent(
          WidgetEventTypes.DATA_UPDATE,
          'calendar-service',
          { 
            widgetId: 'calendar-service',
            data: { event: updatedEvent },
            changes: ['update']
          }
        );
        
        return updatedEvent;
        
      } catch (error) {
        console.error('Failed to update event:', error);
        throw error;
      }
    },
    
    /**
     * 이벤트 삭제
     */
    deleteEvent: async (id) => {
      try {
        // TODO: Supabase 연동
        // const { error } = await supabase
        //   .from('calendar_events')
        //   .delete()
        //   .eq('id', id);
        
        const state = get();
        const newEvents = new Map(state.events);
        newEvents.delete(id);
        
        set({ events: newEvents });
        
        // SharedDataStore 업데이트
        const allEvents = Array.from(newEvents.values());
        sharedDataStore.setGlobalData('calendarEvents', allEvents);
        
        // 이벤트 발행
        emitWidgetEvent(
          WidgetEventTypes.DATA_UPDATE,
          'calendar-service',
          { 
            widgetId: 'calendar-service',
            data: { eventId: id },
            changes: ['delete']
          }
        );
        
      } catch (error) {
        console.error('Failed to delete event:', error);
        throw error;
      }
    },
    
    /**
     * 필터 설정
     */
    setFilters: (filters) => {
      set({ filters });
    },
    
    /**
     * 정렬 옵션 설정
     */
    setSortOptions: (options) => {
      set({ sortOptions: options });
    },
    
    /**
     * Supabase와 동기화 (향후 구현)
     */
    syncWithSupabase: async () => {
      // TODO: Supabase Realtime 구독 설정
      // const channel = supabase
      //   .channel('calendar-events')
      //   .on('postgres_changes', 
      //     { event: '*', schema: 'public', table: 'calendar_events' },
      //     (payload) => {
      //       // 실시간 업데이트 처리
      //     }
      //   )
      //   .subscribe();
      
      console.log('Supabase sync will be implemented later');
      set({ lastSyncTime: new Date() });
    },
    
    /**
     * 반복 이벤트 생성
     */
    generateRecurringEvents: (baseEvent) => {
      if (!baseEvent.recurrence || baseEvent.recurrence.type === 'none') {
        return [baseEvent];
      }
      
      const events: CalendarEvent[] = [];
      const startDate = new Date(baseEvent.start);
      const endDate = baseEvent.recurrence.endDate 
        ? new Date(baseEvent.recurrence.endDate)
        : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1년 후
      
      const interval = baseEvent.recurrence.interval || 1;
      let currentDate = new Date(startDate);
      let occurrence = 0;
      
      while (currentDate <= endDate && occurrence < 100) { // 최대 100개 생성
        // 예외 날짜 체크
        if (baseEvent.recurrence.exceptions) {
          const isException = baseEvent.recurrence.exceptions.some(exception => {
            const exceptionDate = new Date(exception);
            return exceptionDate.toDateString() === currentDate.toDateString();
          });
          
          if (isException) {
            continue;
          }
        }
        
        const recurringEvent: CalendarEvent = {
          ...baseEvent,
          id: `${baseEvent.id}-${occurrence}`,
          start: new Date(currentDate),
          end: new Date(currentDate.getTime() + 
            (new Date(baseEvent.end).getTime() - new Date(baseEvent.start).getTime()))
        };
        
        events.push(recurringEvent);
        
        // 다음 반복 날짜 계산
        switch (baseEvent.recurrence.type) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + interval);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + (7 * interval));
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + interval);
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + interval);
            break;
        }
        
        occurrence++;
      }
      
      return events;
    },
    
    /**
     * 캐시 클리어
     */
    clearCache: () => {
      set({ 
        events: new Map(),
        lastSyncTime: null,
        error: null
      });
    }
  }))
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 이벤트 타입별 색상 반환
 */
export function getEventTypeColor(type: EventType): string {
  const colors = {
    general: '#3b82f6',    // blue
    tax: '#10b981',        // green
    project: '#8b5cf6',    // purple
    personal: '#eab308',   // yellow
    meeting: '#06b6d4',    // cyan
    deadline: '#ef4444'    // red
  };
  
  return colors[type] || colors.general;
}

/**
 * 우선순위별 아이콘 반환
 */
export function getPriorityIcon(priority?: EventPriority): string {
  const icons = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };
  
  return priority ? icons[priority] : '';
}

/**
 * 이벤트 기간 포맷팅
 */
export function formatEventDuration(start: Date | string, end: Date | string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (startDate.toDateString() === endDate.toDateString()) {
    // 같은 날
    return `${startDate.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${endDate.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  } else {
    // 다른 날
    return `${startDate.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    })} ${startDate.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${endDate.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    })} ${endDate.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * CalendarDataService 싱글톤 인스턴스
 */
class CalendarDataService {
  private static instance: CalendarDataService;
  
  private constructor() {
    // 초기화
    this.initialize();
  }
  
  static getInstance(): CalendarDataService {
    if (!CalendarDataService.instance) {
      CalendarDataService.instance = new CalendarDataService();
    }
    return CalendarDataService.instance;
  }
  
  private async initialize() {
    // 초기 데이터 로드
    await useCalendarDataStore.getState().loadEvents();
    
    // SharedDataStore에서 calendarEvents 전역 데이터를 설정
    // 실제로는 위젯 간 구독 관계 설정이 필요하지만, 현재는 전역 데이터만 사용
    console.log('CalendarDataService initialized');
  }
  
  // Public API
  public async loadEvents() {
    return useCalendarDataStore.getState().loadEvents();
  }
  
  public getEvents(filters?: EventFilterOptions) {
    return useCalendarDataStore.getState().getEvents(filters);
  }
  
  public async addEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) {
    return useCalendarDataStore.getState().addEvent(event);
  }
  
  public async updateEvent(id: string, updates: Partial<CalendarEvent>) {
    return useCalendarDataStore.getState().updateEvent(id, updates);
  }
  
  public async deleteEvent(id: string) {
    return useCalendarDataStore.getState().deleteEvent(id);
  }
  
  public setFilters(filters: EventFilterOptions) {
    useCalendarDataStore.getState().setFilters(filters);
  }
  
  public setSortOptions(options: EventSortOptions) {
    useCalendarDataStore.getState().setSortOptions(options);
  }
  
  public async syncWithSupabase() {
    return useCalendarDataStore.getState().syncWithSupabase();
  }
}

// Export singleton instance
export const calendarDataService = CalendarDataService.getInstance();