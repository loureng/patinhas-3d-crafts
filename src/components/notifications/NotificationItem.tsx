import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Mail, Bell } from 'lucide-react';
import type { Notification, NotificationType } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'ORDER_STATUS_CHANGED':
      return '📦';
    case 'NEW_ORDER':
      return '🛒';
    case 'PROMOTION':
      return '🎉';
    case 'NEWS':
      return '📰';
    case 'SYSTEM_UPDATE':
      return '⚙️';
    default:
      return '🔔';
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'ORDER_STATUS_CHANGED':
      return 'bg-blue-100 text-blue-800';
    case 'NEW_ORDER':
      return 'bg-green-100 text-green-800';
    case 'PROMOTION':
      return 'bg-purple-100 text-purple-800';
    case 'NEWS':
      return 'bg-yellow-100 text-yellow-800';
    case 'SYSTEM_UPDATE':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const getTypeLabel = (type: NotificationType) => {
  switch (type) {
    case 'ORDER_STATUS_CHANGED':
      return 'Pedido';
    case 'NEW_ORDER':
      return 'Novo Pedido';
    case 'PROMOTION':
      return 'Promoção';
    case 'NEWS':
      return 'Novidades';
    case 'SYSTEM_UPDATE':
      return 'Sistema';
    default:
      return 'Notificação';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete
}) => {
  const isUnread = !notification.read_at;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  const handleMarkAsRead = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
        isUnread ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className="text-xl mt-1">
            {getNotificationIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getNotificationColor(notification.type)}`}
              >
                {getTypeLabel(notification.type)}
              </Badge>
              {isUnread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>

            <h4 className={`font-medium text-sm mb-1 ${
              isUnread ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {notification.title}
            </h4>

            <p className={`text-sm leading-relaxed ${
              isUnread ? 'text-gray-700' : 'text-gray-600'
            }`}>
              {notification.content}
            </p>

            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-500">
                {timeAgo}
              </span>

              {/* Additional metadata */}
              {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                <div className="flex items-center gap-1">
                  {notification.metadata.order_number && (
                    <Badge variant="outline" className="text-xs">
                      #{notification.metadata.order_number}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
              title="Marcar como lida"
            >
              <Mail className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
            title="Remover notificação"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};