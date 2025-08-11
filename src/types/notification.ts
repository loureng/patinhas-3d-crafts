export type NotificationType = 
  | 'ORDER_STATUS_CHANGED'
  | 'NEW_ORDER'
  | 'PROMOTION'
  | 'NEWS'
  | 'SYSTEM_UPDATE';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata: Record<string, any>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  order_status_email: boolean;
  order_status_push: boolean;
  promotions_email: boolean;
  promotions_push: boolean;
  news_email: boolean;
  news_push: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  email_subject: string | null;
  email_template: string | null;
  push_title: string | null;
  push_template: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

// Template variable replacement interface
export interface TemplateVariables {
  customer_name?: string;
  order_number?: string;
  status?: string;
  details?: string;
  total?: string;
  promotion_title?: string;
  promotion_content?: string;
  promo_code?: string;
  news_title?: string;
  news_content?: string;
  title?: string;
  content?: string;
  [key: string]: string | undefined;
}

// Notification context types
export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreferences | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  sendNotification: (data: CreateNotificationData) => Promise<void>;
  refetch: () => Promise<void>;
}