import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationPreferences } from '@/components/notifications';
import type { NotificationType } from '@/types/notification';

const NotificationDemo: React.FC = () => {
  const { user } = useAuth();
  const {
    sendOrderStatusNotification,
    sendNewOrderNotification,
    sendPromotionNotification,
    sendNewsNotification,
    sendCustomNotification
  } = useNotificationActions();

  // Form states
  const [orderForm, setOrderForm] = useState({
    orderNumber: 'PED-001',
    status: 'Em preparação',
    customerName: 'João Silva',
    details: 'Seu pedido está sendo preparado com carinho.'
  });

  const [promoForm, setPromoForm] = useState({
    title: 'Black Friday - 50% OFF',
    content: 'Aproveite nossa mega promoção de Black Friday! Todos os produtos com 50% de desconto.',
    promoCode: 'BLACK50',
    customerName: 'João Silva'
  });

  const [newsForm, setNewsForm] = useState({
    title: 'Novos Produtos Chegaram!',
    content: 'Confira nossa nova linha de produtos 3D para pets. Agora com ainda mais opções de personalização!',
    customerName: 'João Silva'
  });

  const [customForm, setCustomForm] = useState({
    type: 'ORDER_STATUS_CHANGED' as NotificationType,
    title: 'Notificação Personalizada',
    content: 'Esta é uma notificação de teste personalizada.'
  });

  const handleSendOrderNotification = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      await sendOrderStatusNotification(
        user.id,
        orderForm.orderNumber,
        orderForm.status,
        orderForm.customerName,
        orderForm.details
      );
      toast.success('Notificação de pedido enviada!');
    } catch (error) {
      toast.error('Erro ao enviar notificação');
    }
  };

  const handleSendNewOrderToAdmin = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      await sendNewOrderNotification(
        user.id, // Simulating admin user
        orderForm.orderNumber,
        orderForm.customerName,
        'R$ 299,90'
      );
      toast.success('Notificação de novo pedido enviada!');
    } catch (error) {
      toast.error('Erro ao enviar notificação');
    }
  };

  const handleSendPromotion = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      await sendPromotionNotification(
        user.id,
        promoForm.title,
        promoForm.content,
        promoForm.promoCode,
        promoForm.customerName
      );
      toast.success('Notificação de promoção enviada!');
    } catch (error) {
      toast.error('Erro ao enviar notificação');
    }
  };

  const handleSendNews = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      await sendNewsNotification(
        user.id,
        newsForm.title,
        newsForm.content,
        newsForm.customerName
      );
      toast.success('Notificação de novidades enviada!');
    } catch (error) {
      toast.error('Erro ao enviar notificação');
    }
  };

  const handleSendCustom = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      await sendCustomNotification(user.id, customForm.type, {
        title: customForm.title,
        content: customForm.content,
        customer_name: 'João Silva'
      });
      toast.success('Notificação personalizada enviada!');
    } catch (error) {
      toast.error('Erro ao enviar notificação');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Demo de Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você precisa estar logado para testar as notificações.</p>
            <Button onClick={() => window.location.href = '/auth'} className="mt-4">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Demo do Sistema de Notificações</h1>
      
      <p className="text-muted-foreground">
        Esta página permite testar diferentes tipos de notificações. As notificações aparecerão no sino 🔔 no header.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Status Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>📦 Notificações de Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="order-number">Número do Pedido</Label>
              <Input
                id="order-number"
                value={orderForm.orderNumber}
                onChange={(e) => setOrderForm(prev => ({ ...prev, orderNumber: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="order-status">Status</Label>
              <Select value={orderForm.status} onValueChange={(value) => setOrderForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pedido confirmado">Pedido confirmado</SelectItem>
                  <SelectItem value="Em preparação">Em preparação</SelectItem>
                  <SelectItem value="Em produção">Em produção</SelectItem>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="customer-name">Nome do Cliente</Label>
              <Input
                id="customer-name"
                value={orderForm.customerName}
                onChange={(e) => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="order-details">Detalhes</Label>
              <Textarea
                id="order-details"
                value={orderForm.details}
                onChange={(e) => setOrderForm(prev => ({ ...prev, details: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSendOrderNotification} className="flex-1">
                Enviar para Cliente
              </Button>
              <Button onClick={handleSendNewOrderToAdmin} variant="outline" className="flex-1">
                Enviar para Admin
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Promotion Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>🎉 Notificações de Promoção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="promo-title">Título da Promoção</Label>
              <Input
                id="promo-title"
                value={promoForm.title}
                onChange={(e) => setPromoForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="promo-content">Conteúdo</Label>
              <Textarea
                id="promo-content"
                value={promoForm.content}
                onChange={(e) => setPromoForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="promo-code">Código Promocional</Label>
              <Input
                id="promo-code"
                value={promoForm.promoCode}
                onChange={(e) => setPromoForm(prev => ({ ...prev, promoCode: e.target.value }))}
              />
            </div>

            <Button onClick={handleSendPromotion} className="w-full">
              Enviar Promoção
            </Button>
          </CardContent>
        </Card>

        {/* News Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>📰 Notificações de Novidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="news-title">Título da Novidade</Label>
              <Input
                id="news-title"
                value={newsForm.title}
                onChange={(e) => setNewsForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="news-content">Conteúdo</Label>
              <Textarea
                id="news-content"
                value={newsForm.content}
                onChange={(e) => setNewsForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>

            <Button onClick={handleSendNews} className="w-full">
              Enviar Novidade
            </Button>
          </CardContent>
        </Card>

        {/* Custom Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Notificação Personalizada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custom-type">Tipo</Label>
              <Select value={customForm.type} onValueChange={(value) => setCustomForm(prev => ({ ...prev, type: value as NotificationType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORDER_STATUS_CHANGED">Status do Pedido</SelectItem>
                  <SelectItem value="NEW_ORDER">Novo Pedido</SelectItem>
                  <SelectItem value="PROMOTION">Promoção</SelectItem>
                  <SelectItem value="NEWS">Novidades</SelectItem>
                  <SelectItem value="SYSTEM_UPDATE">Atualização do Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="custom-title">Título</Label>
              <Input
                id="custom-title"
                value={customForm.title}
                onChange={(e) => setCustomForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="custom-content">Conteúdo</Label>
              <Textarea
                id="custom-content"
                value={customForm.content}
                onChange={(e) => setCustomForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>

            <Button onClick={handleSendCustom} className="w-full">
              Enviar Personalizada
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Notification Preferences */}
      <NotificationPreferences />
    </div>
  );
};

export default NotificationDemo;