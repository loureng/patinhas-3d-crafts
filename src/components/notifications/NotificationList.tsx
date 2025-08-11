import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCheck, Search, Filter, RefreshCw } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationType } from '@/types/notification';

export const NotificationList: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | NotificationType>('all');

  // Filter notifications based on search and type
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unread' && !notification.read_at) ||
                         notification.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const handleRefresh = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">Carregando notificações...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Notificações</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {unreadCount}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
              title="Atualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="w-full mb-3"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar notificações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter */}
        <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
          <SelectTrigger className="w-full">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">Não lidas</SelectItem>
            <Separator className="my-1" />
            <SelectItem value="ORDER_STATUS_CHANGED">Pedidos</SelectItem>
            <SelectItem value="NEW_ORDER">Novos Pedidos</SelectItem>
            <SelectItem value="PROMOTION">Promoções</SelectItem>
            <SelectItem value="NEWS">Novidades</SelectItem>
            <SelectItem value="SYSTEM_UPDATE">Sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-96">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h4 className="font-medium text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' 
                ? 'Nenhuma notificação encontrada' 
                : 'Nenhuma notificação'}
            </h4>
            <p className="text-sm text-gray-500">
              {searchTerm || filterType !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Você não tem notificações no momento'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            {filteredNotifications.length} de {notifications.length} notificações
          </p>
        </div>
      )}
    </div>
  );
};