import { supabase } from '@/integrations/supabase/client';
import type {
  Notification,
  NotificationPreferences,
  NotificationTemplate,
  CreateNotificationData,
  NotificationFilters,
  NotificationStats,
  TemplateVariables,
  NotificationType
} from '@/types/notification';

export class NotificationService {
  // Get notifications for current user
  static async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.read !== undefined) {
      if (filters.read) {
        query = query.not('read_at', 'is', null);
      } else {
        query = query.is('read_at', null);
      }
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    
    if (error) {
      // Se a tabela notifications não existir, retornar array vazio silenciosamente
      if (error.code === 'PGRST205' && error.message?.includes('notifications')) {
        console.warn('📊 Tabela notifications não encontrada - funcionalidade desabilitada temporariamente');
        return [];
      }
      
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return (data || []) as Notification[];
  }

  // Get notification statistics
  static async getNotificationStats(): Promise<NotificationStats> {
    const { data, error } = await supabase
      .from('notifications')
      .select('type, read_at');

    if (error) {
      // Se a tabela notifications não existir, retornar stats zeradas
      if (error.code === 'PGRST205' && error.message?.includes('notifications')) {
        console.warn('📊 Tabela notifications não encontrada - stats zeradas');
        return { 
          total: 0, 
          unread: 0, 
          byType: {
            ORDER_STATUS_CHANGED: 0,
            NEW_ORDER: 0,
            PROMOTION: 0,
            NEWS: 0,
            SYSTEM_UPDATE: 0
          }
        };
      }
      
      console.error('Error fetching notification stats:', error);
      throw error;
    }

    const stats: NotificationStats = {
      total: data?.length || 0,
      unread: data?.filter(n => !n.read_at).length || 0,
      byType: {} as Record<NotificationType, number>
    };

    // Count by type
    data?.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });

    return stats;
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Create new notification
  static async createNotification(data: CreateNotificationData): Promise<Notification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    return notification as Notification;
  }

  // Get user notification preferences
  static async getPreferences(): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error is ok
      console.error('Error fetching notification preferences:', error);
      throw error;
    }

    return data;
  }

  // Update notification preferences
  static async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const { data: existingPrefs } = await supabase
      .from('notification_preferences')
      .select('id')
      .single();

    let result;

    if (existingPrefs) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('id', existingPrefs.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating notification preferences:', error);
        throw error;
      }
      result = data;
    } else {
      // Create new preferences
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.user.id, ...preferences })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification preferences:', error);
        throw error;
      }
      result = data;
    }

    return result;
  }

  // Get notification templates
  static async getTemplates(): Promise<NotificationTemplate[]> {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('type');

    if (error) {
      console.error('Error fetching notification templates:', error);
      throw error;
    }

    return (data || []) as NotificationTemplate[];
  }

  // Process template with variables
  static processTemplate(template: string, variables: TemplateVariables): string {
    let processedTemplate = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      if (value !== undefined) {
        const regex = new RegExp(`{${key}}`, 'g');
        processedTemplate = processedTemplate.replace(regex, value);
      }
    });

    return processedTemplate;
  }

  // Send notification with template processing
  static async sendNotificationWithTemplate(
    userId: string,
    type: NotificationType,
    variables: TemplateVariables
  ): Promise<Notification> {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('type', type)
      .single();

    if (templateError) {
      console.error('Error fetching notification template:', templateError);
      throw templateError;
    }

    // Process template
    const title = template.push_title 
      ? this.processTemplate(template.push_title, variables)
      : 'Notificação';
    
    const content = template.push_template
      ? this.processTemplate(template.push_template, variables)
      : 'Você tem uma nova notificação';

    // Create notification
    return this.createNotification({
      user_id: userId,
      type,
      title,
      content,
      metadata: variables
    });
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }

  // Helper methods for specific notification types
  static async sendOrderStatusNotification(
    userId: string,
    orderNumber: string,
    status: string,
    customerName: string,
    details?: string
  ): Promise<Notification> {
    return this.sendNotificationWithTemplate(userId, 'ORDER_STATUS_CHANGED', {
      customer_name: customerName,
      order_number: orderNumber,
      status,
      details: details || ''
    });
  }

  static async sendNewOrderNotification(
    adminUserId: string,
    orderNumber: string,
    customerName: string,
    total: string
  ): Promise<Notification> {
    return this.sendNotificationWithTemplate(adminUserId, 'NEW_ORDER', {
      order_number: orderNumber,
      customer_name: customerName,
      total
    });
  }

  static async sendPromotionNotification(
    userId: string,
    promotionTitle: string,
    promotionContent: string,
    promoCode: string,
    customerName: string
  ): Promise<Notification> {
    return this.sendNotificationWithTemplate(userId, 'PROMOTION', {
      customer_name: customerName,
      promotion_title: promotionTitle,
      promotion_content: promotionContent,
      promo_code: promoCode
    });
  }

  static async sendNewsNotification(
    userId: string,
    newsTitle: string,
    newsContent: string,
    customerName: string
  ): Promise<Notification> {
    return this.sendNotificationWithTemplate(userId, 'NEWS', {
      customer_name: customerName,
      news_title: newsTitle,
      news_content: newsContent
    });
  }
}