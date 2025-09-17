'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { Bell, Check, AlertCircle, Info, CheckCircle, X, Filter, Settings } from 'lucide-react';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NotificationCenterWidgetProps {
  id: string;
}

type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
type NotificationCategory = 'system' | 'task' | 'calendar' | 'finance' | 'team';

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

  useEffect(() => {
    loadNotifications();
    // 1분마다 새 알림 확인
    const interval = setInterval(() => {
      loadNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // 필터링된 알림 목록
  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications;
    
    if (activeFilter !== 'all') {
      filtered = filterByCategory(activeFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filterByPriority(priorityFilter);
    }
    
    return filtered;
  }, [notifications, activeFilter, priorityFilter, filterByCategory, filterByPriority]);

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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <Typography variant="h4">알림 센터</Typography>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium text-white bg-[var(--color-status-error)] rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllAsRead}
                className="text-xs"
              >
                모두 읽음
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            </Button>
          </div>
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

      <CardContent className="flex-1 overflow-auto">
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
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const isExpanded = expandedNotifications.has(notification.id);
              return (
                <div
                  key={notification.id}
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenterWidget;