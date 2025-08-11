import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Settings, Save } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationPreferences } from '@/types/notification';

export const NotificationPreferences: React.FC = () => {
  const { preferences, updatePreferences, loading } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreferences>>(
    preferences || {}
  );

  React.useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await updatePreferences(localPrefs);
  };

  const hasChanges = JSON.stringify(localPrefs) !== JSON.stringify(preferences);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferências de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Preferências de Notificação
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure como você deseja receber notificações
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Settings */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Configurações Gerais
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-enabled">Notificações por Email</Label>
              <p className="text-sm text-gray-500">
                Receber notificações no seu email
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={localPrefs.email_enabled ?? true}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-enabled">Push Notifications</Label>
              <p className="text-sm text-gray-500">
                Receber notificações no navegador
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={localPrefs.push_enabled ?? true}
              onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Order Status Notifications */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            📦 Status de Pedidos
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="order-email">Email para status de pedidos</Label>
              <p className="text-sm text-gray-500">
                Receber updates sobre seus pedidos por email
              </p>
            </div>
            <Switch
              id="order-email"
              checked={localPrefs.order_status_email ?? true}
              onCheckedChange={(checked) => handleToggle('order_status_email', checked)}
              disabled={!localPrefs.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="order-push">Push para status de pedidos</Label>
              <p className="text-sm text-gray-500">
                Receber updates sobre seus pedidos no navegador
              </p>
            </div>
            <Switch
              id="order-push"
              checked={localPrefs.order_status_push ?? true}
              onCheckedChange={(checked) => handleToggle('order_status_push', checked)}
              disabled={!localPrefs.push_enabled}
            />
          </div>
        </div>

        <Separator />

        {/* Promotions */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            🎉 Promoções
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="promo-email">Email para promoções</Label>
              <p className="text-sm text-gray-500">
                Receber ofertas especiais por email
              </p>
            </div>
            <Switch
              id="promo-email"
              checked={localPrefs.promotions_email ?? true}
              onCheckedChange={(checked) => handleToggle('promotions_email', checked)}
              disabled={!localPrefs.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="promo-push">Push para promoções</Label>
              <p className="text-sm text-gray-500">
                Receber ofertas especiais no navegador
              </p>
            </div>
            <Switch
              id="promo-push"
              checked={localPrefs.promotions_push ?? false}
              onCheckedChange={(checked) => handleToggle('promotions_push', checked)}
              disabled={!localPrefs.push_enabled}
            />
          </div>
        </div>

        <Separator />

        {/* News */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            📰 Novidades
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="news-email">Email para novidades</Label>
              <p className="text-sm text-gray-500">
                Receber newsletters e novidades por email
              </p>
            </div>
            <Switch
              id="news-email"
              checked={localPrefs.news_email ?? false}
              onCheckedChange={(checked) => handleToggle('news_email', checked)}
              disabled={!localPrefs.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="news-push">Push para novidades</Label>
              <p className="text-sm text-gray-500">
                Receber newsletters e novidades no navegador
              </p>
            </div>
            <Switch
              id="news-push"
              checked={localPrefs.news_push ?? false}
              onCheckedChange={(checked) => handleToggle('news_push', checked)}
              disabled={!localPrefs.push_enabled}
            />
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-4">
            <Button onClick={handleSave} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Preferências
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};