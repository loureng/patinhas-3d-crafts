import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { NotificationService } from '@/services/notificationService';
import type {
  Notification,
  NotificationPreferences,
  CreateNotificationData,
  NotificationContextType
} from '@/types/notification';
import { supabase } from '@/integrations/supabase/client';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch notifications and preferences
  const fetchData = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [notificationsData, preferencesData] = await Promise.all([
        NotificationService.getNotifications({ limit: 50 }),
        NotificationService.getPreferences()
      ]);

      setNotifications(notificationsData);
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Error fetching notification data:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    const channel = NotificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show toast for new notification
        toast.success(newNotification.title, {
          description: newNotification.content,
          action: {
            label: 'Ver',
            onClick: () => markAsRead(newNotification.id)
          }
        });
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Erro ao marcar notificação como lida');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          read_at: notification.read_at || new Date().toISOString()
        }))
      );
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Erro ao marcar todas as notificações como lidas');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      toast.success('Notificação removida');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao remover notificação');
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const updatedPreferences = await NotificationService.updatePreferences(newPreferences);
      setPreferences(updatedPreferences);
      toast.success('Preferências atualizadas');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Erro ao atualizar preferências');
    }
  }, []);

  // Send notification (for admin use)
  const sendNotification = useCallback(async (data: CreateNotificationData) => {
    try {
      const newNotification = await NotificationService.createNotification(data);
      // Don't add to local state if it's for another user
      if (data.user_id === user?.id) {
        setNotifications(prev => [newNotification, ...prev]);
      }
      toast.success('Notificação enviada');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erro ao enviar notificação');
    }
  }, [user?.id]);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read_at).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    sendNotification,
    refetch: fetchData
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};