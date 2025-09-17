import { create } from 'zustand';
import { 
  Notification, 
  NotificationCategory, 
  NotificationPriority, 
  NotificationSettings 
} from '@/lib/types/notification.types';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  
  // Actions
  loadNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  archiveNotification: (id: string) => void;
  filterByCategory: (category: NotificationCategory) => Notification[];
  filterByPriority: (priority: NotificationPriority) => Notification[];
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  clearExpired: () => void;
}

// Mock 알림 데이터 생성
const generateMockNotifications = (): Notification[] => {
  const now = new Date();
  const notifications: Notification[] = [
    {
      id: '1',
      title: '새로운 프로젝트 할당',
      message: '웹사이트 리디자인 프로젝트가 할당되었습니다. 마감일은 다음 주 금요일입니다.',
      priority: 'high',
      category: 'task',
      isRead: false,
      actionUrl: '/projects/website-redesign',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
    },
    {
      id: '2',
      title: '시스템 업데이트 완료',
      message: '대시보드 시스템이 v2.1.0으로 업데이트되었습니다. 새로운 기능을 확인해보세요.',
      priority: 'medium',
      category: 'system',
      isRead: false,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4시간 전
    },
    {
      id: '3',
      title: '내일 오후 2시 회의',
      message: '클라이언트 미팅이 내일 오후 2시에 예정되어 있습니다. 준비 자료를 확인해주세요.',
      priority: 'urgent',
      category: 'calendar',
      isRead: false,
      actionUrl: '/calendar/meeting-123',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1시간 전
    },
    {
      id: '4',
      title: '청구서 결제 완료',
      message: '프로젝트 A의 청구서가 결제되었습니다. 금액: ₩5,000,000',
      priority: 'medium',
      category: 'finance',
      isRead: true,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    },
    {
      id: '5',
      title: '팀원 휴가 알림',
      message: '김개발님이 다음 주 월요일부터 수요일까지 휴가입니다.',
      priority: 'low',
      category: 'team',
      isRead: true,
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), // 2일 전
    },
    {
      id: '6',
      title: '작업 마감일 임박',
      message: 'API 문서 작성 작업이 3시간 후 마감입니다.',
      priority: 'urgent',
      category: 'task',
      isRead: false,
      actionUrl: '/tasks/api-documentation',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30분 전
    },
    {
      id: '7',
      title: '주간 리포트 생성됨',
      message: '이번 주 프로젝트 진행 상황 리포트가 생성되었습니다.',
      priority: 'low',
      category: 'system',
      isRead: true,
      actionUrl: '/reports/weekly-2024-01',
      createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(), // 3일 전
    },
    {
      id: '8',
      title: '미수금 알림',
      message: '프로젝트 B의 청구서가 7일째 미결제 상태입니다.',
      priority: 'high',
      category: 'finance',
      isRead: false,
      actionUrl: '/invoices/unpaid',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6시간 전
    },
  ];

  return notifications.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

const defaultSettings: NotificationSettings = {
  enableDesktopNotifications: true,
  enableSoundAlerts: true,
  enableEmailDigest: false,
  digestFrequency: 'daily',
  mutedCategories: [],
  priorityThreshold: 'low',
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  settings: defaultSettings,

  loadNotifications: () => {
    // localStorage에서 알림 로드 또는 Mock 데이터 사용
    const savedNotifications = localStorage.getItem('notifications');
    const notifications = savedNotifications 
      ? JSON.parse(savedNotifications) 
      : generateMockNotifications();
    
    const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
    
    set({ notifications, unreadCount });
    
    // 실시간 알림 시뮬레이션 (개발용)
    if (process.env.NODE_ENV === 'development' && Math.random() > 0.95) {
      setTimeout(() => {
        get().addNotification({
          title: '새로운 메시지',
          message: '실시간 알림 테스트입니다.',
          priority: 'medium',
          category: 'team',
        });
      }, 5000);
    }
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    set((state) => {
      const notifications = [newNotification, ...state.notifications];
      localStorage.setItem('notifications', JSON.stringify(notifications));
      
      // 사운드 알림 (설정에 따라)
      if (state.settings.enableSoundAlerts) {
        // 실제 구현에서는 사운드 재생
        console.log('🔔 알림 사운드');
      }
      
      return {
        notifications,
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = notifications.filter(n => !n.isRead).length;
      
      localStorage.setItem('notifications', JSON.stringify(notifications));
      return { notifications, unreadCount };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const notifications = state.notifications.map(n => ({ ...n, isRead: true }));
      localStorage.setItem('notifications', JSON.stringify(notifications));
      return { notifications, unreadCount: 0 };
    });
  },

  deleteNotification: (id) => {
    set((state) => {
      const notifications = state.notifications.filter(n => n.id !== id);
      const unreadCount = notifications.filter(n => !n.isRead).length;
      
      localStorage.setItem('notifications', JSON.stringify(notifications));
      return { notifications, unreadCount };
    });
  },

  archiveNotification: (id) => {
    // 실제 구현에서는 아카이브 처리
    get().deleteNotification(id);
  },

  filterByCategory: (category) => {
    return get().notifications.filter(n => n.category === category);
  },

  filterByPriority: (priority) => {
    return get().notifications.filter(n => n.priority === priority);
  },

  updateSettings: (settings) => {
    set((state) => {
      const newSettings = { ...state.settings, ...settings };
      localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      return { settings: newSettings };
    });
  },

  clearExpired: () => {
    set((state) => {
      const now = new Date().getTime();
      const notifications = state.notifications.filter(n => {
        if (!n.expiresAt) return true;
        return new Date(n.expiresAt).getTime() > now;
      });
      const unreadCount = notifications.filter(n => !n.isRead).length;
      
      localStorage.setItem('notifications', JSON.stringify(notifications));
      return { notifications, unreadCount };
    });
  },
}));