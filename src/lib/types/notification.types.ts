export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationCategory = 'system' | 'task' | 'calendar' | 'finance' | 'team';
export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
}

export interface NotificationSettings {
  enableDesktopNotifications: boolean;
  enableSoundAlerts: boolean;
  enableEmailDigest: boolean;
  digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  mutedCategories: NotificationCategory[];
  priorityThreshold: NotificationPriority;
}