# 🔗 Guia de Integração - Sistema de Notificações

## Integrações Recomendadas para Existing Workflows

### 🛒 Integração com Sistema de Pedidos

#### 1. Ao criar novo pedido:
```typescript
// Em OrderService.ts ou similar
import { useNotificationActions } from '@/hooks/useNotificationActions';

const { sendNewOrderNotification, sendOrderStatusNotification } = useNotificationActions();

// Quando pedido é criado
const createOrder = async (orderData) => {
  const order = await supabase.from('orders').insert(orderData);
  
  // Notificar cliente
  await sendOrderStatusNotification(
    orderData.user_id,
    order.id,
    'Pedido confirmado',
    customerName,
    'Seu pedido foi recebido e está sendo processado.'
  );
  
  // Notificar admins (buscar todos os admins)
  const admins = await getAdminUsers();
  for (const admin of admins) {
    await sendNewOrderNotification(
      admin.id,
      order.id,
      customerName,
      `R$ ${orderData.total_amount.toFixed(2)}`
    );
  }
};
```

#### 2. Ao atualizar status do pedido:
```typescript
// Em componente AdminOrders ou OrderService
const updateOrderStatus = async (orderId: string, newStatus: string) => {
  const order = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select('*, user_id')
    .single();
  
  // Buscar dados do cliente
  const customer = await getUserById(order.user_id);
  
  // Notificar cliente sobre mudança de status
  await sendOrderStatusNotification(
    order.user_id,
    orderId,
    newStatus,
    customer.display_name,
    getStatusMessage(newStatus) // função helper para mensagem detalhada
  );
};

// Helper function
const getStatusMessage = (status: string): string => {
  const messages = {
    'Em preparação': 'Seu pedido está sendo preparado pela nossa equipe.',
    'Em produção': 'Seu produto está sendo impresso em 3D.',
    'Enviado': 'Seu pedido foi enviado e logo chegará até você.',
    'Entregue': 'Pedido entregue com sucesso! Esperamos que você tenha gostado.'
  };
  return messages[status] || 'Status do pedido atualizado.';
};
```

### 📧 Integração com Campanhas de Marketing

#### 1. Promoções e ofertas:
```typescript
// Em MarketingService.ts
const sendPromotionCampaign = async (promotionData) => {
  // Buscar usuários que aceitam promoções
  const users = await supabase
    .from('notification_preferences')
    .select('user_id, users!inner(*)')
    .eq('promotions_push', true);
  
  // Enviar para todos os usuários
  const notifications = users.map(user => 
    sendPromotionNotification(
      user.user_id,
      promotionData.title,
      promotionData.content,
      promotionData.code,
      user.users.display_name
    )
  );
  
  await Promise.all(notifications);
};
```

#### 2. Newsletter e novidades:
```typescript
// Em NewsService.ts
const publishNews = async (newsData) => {
  // Buscar usuários interessados em novidades
  const subscribers = await supabase
    .from('notification_preferences')
    .select('user_id, users!inner(*)')
    .eq('news_push', true);
  
  // Enviar notificação de novidades
  for (const subscriber of subscribers) {
    await sendNewsNotification(
      subscriber.user_id,
      newsData.title,
      newsData.content,
      subscriber.users.display_name
    );
  }
};
```

### 👤 Integração com Sistema de Usuários

#### 1. Boas-vindas para novos usuários:
```typescript
// Em AuthContext.tsx ou UserService
const sendWelcomeNotification = async (userId: string, userName: string) => {
  await sendCustomNotification(userId, 'NEWS', {
    title: 'Bem-vindo ao Jardim das Patinhas! 🐾',
    content: `Olá ${userName}! Agora você faz parte da nossa família. Explore nossos produtos 3D personalizados e crie algo especial para seu pet.`,
    customer_name: userName
  });
};

// Chamar após registro bem-sucedido
const { data: user } = await supabase.auth.signUp({...});
if (user) {
  await sendWelcomeNotification(user.id, displayName);
}
```

#### 2. Lembretes de carrinho abandonado:
```typescript
// Em CartService.ts ou job background
const sendCartAbandonmentReminder = async (userId: string) => {
  const cart = await getCartItems(userId);
  const user = await getUserById(userId);
  
  if (cart.length > 0) {
    await sendCustomNotification(userId, 'PROMOTION', {
      title: 'Você esqueceu algo especial no seu carrinho! 🛒',
      content: `${user.display_name}, seus produtos personalizados estão te esperando. Finalize sua compra e ganhe 10% de desconto!`,
      customer_name: user.display_name,
      promo_code: 'VOLTA10'
    });
  }
};
```

### ⚙️ Integração com Sistema Administrativo

#### 1. Alertas de estoque baixo:
```typescript
// Em InventoryService.ts
const checkLowStock = async () => {
  const lowStockProducts = await supabase
    .from('products')
    .select('*')
    .lt('stock_quantity', 5);
  
  if (lowStockProducts.length > 0) {
    const admins = await getAdminUsers();
    
    for (const admin of admins) {
      await sendCustomNotification(admin.id, 'SYSTEM_UPDATE', {
        title: 'Alerta: Estoque Baixo',
        content: `${lowStockProducts.length} produtos estão com estoque baixo. Verifique o painel administrativo.`,
        customer_name: admin.display_name
      });
    }
  }
};
```

#### 2. Relatórios automáticos:
```typescript
// Em ReportsService.ts
const sendDailyReport = async () => {
  const stats = await getDailyStats();
  const admins = await getAdminUsers();
  
  for (const admin of admins) {
    await sendCustomNotification(admin.id, 'SYSTEM_UPDATE', {
      title: 'Relatório Diário',
      content: `Hoje: ${stats.newOrders} novos pedidos, ${stats.revenue} em vendas, ${stats.newCustomers} novos clientes.`,
      customer_name: admin.display_name
    });
  }
};
```

### 🔄 Automações com Supabase Triggers

#### 1. Trigger para novo pedido:
```sql
-- Adicionar ao migration
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir notificação para admins automaticamente
  INSERT INTO notifications (user_id, type, title, content, metadata)
  SELECT 
    u.id,
    'NEW_ORDER',
    'Novo pedido recebido #' || NEW.id,
    'Um novo pedido foi recebido no valor de R$ ' || NEW.total_amount,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.id,
      'total', NEW.total_amount
    )
  FROM auth.users u
  WHERE u.raw_user_meta_data->>'role' = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();
```

#### 2. Trigger para status de pedido:
```sql
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar cliente quando status muda
  IF OLD.status != NEW.status THEN
    INSERT INTO notifications (user_id, type, title, content, metadata)
    VALUES (
      NEW.user_id,
      'ORDER_STATUS_CHANGED',
      'Pedido #' || NEW.id || ' atualizado',
      'Seu pedido foi atualizado para: ' || NEW.status,
      jsonb_build_object(
        'order_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_status_changed
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_status_change();
```

### 📱 Configurações Recomendadas

#### 1. Helpers para buscar usuários:
```typescript
// Em utils/userHelpers.ts
export const getAdminUsers = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .eq('role', 'admin');
  return data || [];
};

export const getUserById = async (userId: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
};
```

#### 2. Batching para performance:
```typescript
// Para notificações em massa
export const sendBulkNotifications = async (
  notifications: Array<{userId: string, type: NotificationType, data: any}>
) => {
  const batchSize = 50;
  
  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize);
    const promises = batch.map(n => 
      sendCustomNotification(n.userId, n.type, n.data)
    );
    await Promise.all(promises);
    
    // Pequena pausa entre batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};
```

## 🎯 Próximos Passos de Integração

1. **Implementar os triggers** no banco de dados
2. **Adicionar notificações** nos fluxos existentes de pedidos
3. **Configurar campanhas** de marketing automatizadas
4. **Criar jobs** para verificações periódicas (estoque, relatórios)
5. **Implementar email service** para notificações críticas
6. **Adicionar analytics** para medir engajamento