'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { Bell, Check, AlertCircle, Info, CheckCircle, X, Filter, Settings, Search } from 'lucide-react';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FixedSizeList } from 'react-window';
import { useSearchApi } from '@/lib/hooks/useApiOptimizer';
import { 
  useScreenReader,
  useAriaProps 
} from '@/lib/accessibility/hooks/useScreenReader';
import { ariaLabels } from '@/lib/accessibility/screen-reader';

interface NotificationCenterWidgetProps {
  id: string;
}

type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
type NotificationCategory = 'system' | 'task' | 'calendar' | 'finance' | 'team';

// 가상 스크롤링 NotificationRow 컴포넌트의 props
interface NotificationRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    notifications: any[];
    expandedNotifications: Set<string>;
    markAsRead: (id: string) => void;
    deleteNotification: (id: string) => void;
    toggleExpanded: (id: string) => void;
    getPriorityIcon: (priority: NotificationPriority) => React.ReactNode;
    getCategoryColor: (category: NotificationCategory) => string;
  };
}

// 가상 스크롤링을 위한 NotificationRow 컴포넌트
const NotificationRow = ({ index, style, data }: NotificationRowProps) => {
  const {
    notifications,
    expandedNotifications,
    markAsRead,
    deleteNotification,
    toggleExpanded,
    getPriorityIcon,
    getCategoryColor
  } = data;
  
  const notification = notifications[index];
  if (!notification) return null;
  
  const isExpanded = expandedNotifications.has(notification.id);
  const listAriaProps = ariaLabels.listItem(index + 1, notifications.length);
  
  return (
    <div style={style} className="px-2" {...listAriaProps}>
      <div
        className={`p-3 rounded-lg border transition-all cursor-pointer ${
          notification.isRead 
            ? 'bg-[var(--color-surface-secondary)] border-[var(--color-border)]' 
            : 'bg-[var(--color-surface-primary)] border-[var(--color-brand-primary-start)]'
        } hover:shadow-sm`}
        onClick={() => {
          if (!notification.isRead) {
            markAsRead(notification.id);
          }
          toggleExpanded(notification.id);
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${notification.title}. ${notification.isRead ? '읽음' : '읽지 않음'}. 우선순위: ${notification.priority}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1">{getPriorityIcon(notification.priority)}</div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${getCategoryColor(notification.category)}20`,
                      color: getCategoryColor(notification.category)
                    }}
                  >
                    {notification.category}
                  </span>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-[var(--color-brand-primary-start)] rounded-full" />
                  )}
                </div>
                <Typography variant="body2" className="font-medium mb-1">
                  {notification.title}
                </Typography>
                <Typography 
                  variant="caption" 
                  className={`text-[var(--color-text-secondary)] ${!isExpanded ? 'line-clamp-2' : ''}`}
                >
                  {notification.message}
                </Typography>
                {notification.actionUrl && isExpanded && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 p-0 h-auto text-[var(--color-brand-primary-start)] hover:text-[var(--color-brand-primary-end)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 실제 구현에서는 라우터를 사용하여 이동
                      console.log('Navigate to:', notification.actionUrl);
                    }}
                  >
                    자세히 보기 →
                  </Button>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Typography variant="caption" className="text-[var(--color-text-tertiary)] whitespace-nowrap">
                  {formatDistanceToNow(new Date(notification.createdAt), { 
                    addSuffix: true,
                    locale: ko 
                  })}
                </Typography>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationCenterWidget: React.FC<NotificationCenterWidgetProps> = ({ id }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    filterByCategory,
    filterByPriority,
    loadNotifications,
  } = useNotificationStore();

  const [activeFilter, setActiveFilter] = useState<NotificationCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  
  // 스크린 리더 지원
  const { 
    announceCount,
    announceCompletion,
    announceSearchResults,
    alert
  } = useScreenReader();
  
  const widgetAriaProps = useAriaProps('widget', {
    type: 'NotificationCenter',
    title: '알림 센터'
  });
  
  // 검색 기능 with 디바운싱
  const searchFunction = React.useCallback(async (query: string) => {
    if (!query.trim()) return notifications;
    
    const lowerQuery = query.toLowerCase();
    return notifications.filter(notification => 
      notification.title.toLowerCase().includes(lowerQuery) ||
      notification.message.toLowerCase().includes(lowerQuery)
    );
  }, [notifications]);
  
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    loading: searchLoading
  } = useSearchApi(searchFunction, 300); // 300ms 디바운싱

  useEffect(() => {
    loadNotifications();
    // 1분마다 새 알림 확인
    const interval = setInterval(() => {
      loadNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // 필터링된 알림 목록 (검색 결과 우선)
  const filteredNotifications = React.useMemo(() => {
    // 검색 쿼리가 있으면 검색 결과 사용
    let filtered = searchQuery ? searchResults : notifications;
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(n => n.category === activeFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority === priorityFilter);
    }
    
    return filtered;
  }, [notifications, searchResults, searchQuery, activeFilter, priorityFilter]);

  // 검색 결과 알림
  useEffect(() => {
    if (searchQuery && !searchLoading) {
      announceSearchResults(searchQuery, searchResults.length);
    }
  }, [searchQuery, searchResults.length, searchLoading, announceSearchResults]);

  // 읽지 않은 알림 개수 알림
  useEffect(() => {
    if (unreadCount > 0) {
      announceCount('읽지 않은 알림', unreadCount);
    }
  }, [unreadCount, announceCount]);

  const getPriorityIcon = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-[var(--color-status-error)]" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-[var(--color-status-warning)]" />;
      case 'medium':
        return <Info className="w-4 h-4 text-[var(--color-status-info)]" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-[var(--color-text-secondary)]" />;
    }
  };

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case 'system':
        return 'var(--color-text-secondary)';
      case 'task':
        return 'var(--color-status-info)';
      case 'calendar':
        return 'var(--color-brand-primary-start)';
      case 'finance':
        return 'var(--color-status-success)';
      case 'team':
        return 'var(--color-status-warning)';
      default:
        return 'var(--color-text-primary)';
    }
  };

  const toggleExpanded = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  // markAsRead 래퍼 함수
  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    announceCompletion('알림 읽음 처리', true);
  };

  // markAllAsRead 래퍼 함수
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    announceCompletion('모든 알림 읽음 처리', true);
  };

  // deleteNotification 래퍼 함수
  const handleDeleteNotification = (id: string) => {
    deleteNotification(id);
    announceCompletion('알림 삭제', true);
  };

  const categoryButtons = [
    { value: 'all', label: '전체' },
    { value: 'system', label: '시스템' },
    { value: 'task', label: '작업' },
    { value: 'calendar', label: '일정' },
    { value: 'finance', label: '재무' },
    { value: 'team', label: '팀' },
  ];

  const priorityButtons = [
    { value: 'all', label: '전체' },
    { value: 'urgent', label: '긴급' },
    { value: 'high', label: '높음' },
    { value: 'medium', label: '보통' },
    { value: 'low', label: '낮음' },
  ];

  return (
    <Card className="h-full flex flex-col" {...widgetAriaProps}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <Typography variant="h4">알림 센터</Typography>
            {unreadCount > 0 && (
              <span 
                className="px-2 py-0.5 text-xs font-medium text-white bg-[var(--color-status-error)] rounded-full"
                aria-label={`읽지 않은 알림 ${unreadCount}개`}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAllAsRead}
                className="text-xs"
                aria-label="모든 알림을 읽음으로 표시"
              >
                모두 읽음
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              aria-label={showSettings ? '설정 닫기' : '설정 열기'}
              aria-expanded={showSettings}
            >
              {showSettings ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="알림 검색..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary-start)]"
            aria-label="알림 검색"
            aria-describedby="search-results-count"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[var(--color-brand-primary-start)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* 필터 섹션 */}
        {showSettings && (
          <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
            <div>
              <Typography variant="body2" className="text-[var(--color-text-secondary)] mb-2">
                카테고리
              </Typography>
              <div className="flex flex-wrap gap-1">
                {categoryButtons.map(({ value, label }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={activeFilter === value ? 'primary' : 'outline'}
                    onClick={() => setActiveFilter(value as NotificationCategory | 'all')}
                    className="text-xs px-2 py-1"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Typography variant="body2" className="text-[var(--color-text-secondary)] mb-2">
                우선순위
              </Typography>
              <div className="flex flex-wrap gap-1">
                {priorityButtons.map(({ value, label }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={priorityFilter === value ? 'primary' : 'outline'}
                    onClick={() => setPriorityFilter(value as NotificationPriority | 'all')}
                    className="text-xs px-2 py-1"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bell className="w-12 h-12 text-[var(--color-text-tertiary)] mb-3" />
            <Typography variant="body1" className="text-[var(--color-text-secondary)]">
              새로운 알림이 없습니다
            </Typography>
            <Typography variant="body2" className="text-[var(--color-text-tertiary)] mt-1">
              중요한 업데이트가 있으면 여기에 표시됩니다
            </Typography>
          </div>
        ) : (
          <FixedSizeList
            height={400} // 위젯 높이에 맞게 조정
            itemCount={filteredNotifications.length}
            itemSize={expandedNotifications.size > 0 ? 140 : 100} // 확장된 아이템이 있을 때 더 큰 높이
            width="100%"
            itemData={{
              notifications: filteredNotifications,
              expandedNotifications,
              markAsRead,
              deleteNotification,
              toggleExpanded,
              getPriorityIcon,
              getCategoryColor
            }}
          >
            {NotificationRow}
          </FixedSizeList>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenterWidget;