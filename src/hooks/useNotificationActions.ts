import { useCallback } from 'react';
import { toast } from 'sonner';
import { NotificationService } from '@/services/notificationService';
import type { NotificationType, TemplateVariables } from '@/types/notification';

export const useNotificationActions = () => {
  // Send order status notification
  const sendOrderStatusNotification = useCallback(async (
    userId: string,
    orderNumber: string,
    status: string,
    customerName: string,
    details?: string
  ) => {
    try {
      await NotificationService.sendOrderStatusNotification(
        userId,
        orderNumber,
        status,
        customerName,
        details
      );
    } catch (error) {
      console.error('Error sending order status notification:', error);
      toast.error('Erro ao enviar notificação de status do pedido');
    }
  }, []);

  // Send new order notification to admin
  const sendNewOrderNotification = useCallback(async (
    adminUserId: string,
    orderNumber: string,
    customerName: string,
    total: string
  ) => {
    try {
      await NotificationService.sendNewOrderNotification(
        adminUserId,
        orderNumber,
        customerName,
        total
      );
    } catch (error) {
      console.error('Error sending new order notification:', error);
      toast.error('Erro ao enviar notificação de novo pedido');
    }
  }, []);

  // Send promotion notification
  const sendPromotionNotification = useCallback(async (
    userId: string,
    promotionTitle: string,
    promotionContent: string,
    promoCode: string,
    customerName: string
  ) => {
    try {
      await NotificationService.sendPromotionNotification(
        userId,
        promotionTitle,
        promotionContent,
        promoCode,
        customerName
      );
    } catch (error) {
      console.error('Error sending promotion notification:', error);
      toast.error('Erro ao enviar notificação de promoção');
    }
  }, []);

  // Send news notification
  const sendNewsNotification = useCallback(async (
    userId: string,
    newsTitle: string,
    newsContent: string,
    customerName: string
  ) => {
    try {
      await NotificationService.sendNewsNotification(
        userId,
        newsTitle,
        newsContent,
        customerName
      );
    } catch (error) {
      console.error('Error sending news notification:', error);
      toast.error('Erro ao enviar notificação de novidades');
    }
  }, []);

  // Send custom notification with template
  const sendCustomNotification = useCallback(async (
    userId: string,
    type: NotificationType,
    variables: TemplateVariables
  ) => {
    try {
      await NotificationService.sendNotificationWithTemplate(userId, type, variables);
    } catch (error) {
      console.error('Error sending custom notification:', error);
      toast.error('Erro ao enviar notificação personalizada');
    }
  }, []);

  // Send notification to multiple users
  const sendBulkNotification = useCallback(async (
    userIds: string[],
    type: NotificationType,
    variables: TemplateVariables
  ) => {
    try {
      const promises = userIds.map(userId =>
        NotificationService.sendNotificationWithTemplate(userId, type, variables)
      );
      await Promise.all(promises);
      toast.success(`Notificação enviada para ${userIds.length} usuários`);
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      toast.error('Erro ao enviar notificações em massa');
    }
  }, []);

  return {
    sendOrderStatusNotification,
    sendNewOrderNotification,
    sendPromotionNotification,
    sendNewsNotification,
    sendCustomNotification,
    sendBulkNotification
  };
};