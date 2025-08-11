# 🔔 Sistema de Notificações - Jardim das Patinhas

## Visão Geral

O sistema de notificações do Jardim das Patinhas oferece uma experiência completa de comunicação com clientes e administradores, incluindo notificações em tempo real, preferências personalizáveis e suporte futuro para email e push notifications.

## 🎯 Funcionalidades Implementadas

### ✅ Sistema Core
- **Persistência em banco real** (Supabase PostgreSQL)
- **Notificações em tempo real** via Supabase subscriptions
- **Interface responsiva** com componentes UI modernos
- **Preferências personalizáveis** por usuário
- **Sistema de templates** para diferentes tipos de notificação

### 📱 Interface de Usuário
- **NotificationBell**: Ícone com contador no header
- **NotificationList**: Lista completa com filtros e busca
- **NotificationItem**: Item individual com ações
- **NotificationPreferences**: Configurações detalhadas

### 🔔 Tipos de Notificação
- **ORDER_STATUS_CHANGED**: Status de pedidos para clientes
- **NEW_ORDER**: Novos pedidos para administradores
- **PROMOTION**: Promoções e ofertas especiais
- **NEWS**: Novidades e atualizações
- **SYSTEM_UPDATE**: Atualizações do sistema

## 🗄️ Estrutura do Banco de Dados

### Tabela `notifications`
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key para auth.users)
- type: TEXT (tipo da notificação)
- title: TEXT (título da notificação)
- content: TEXT (conteúdo da notificação)
- metadata: JSONB (dados adicionais)
- read_at: TIMESTAMP (quando foi lida)
- created_at: TIMESTAMP (criada em)
- updated_at: TIMESTAMP (atualizada em)
```

### Tabela `notification_preferences`
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key para auth.users)
- email_enabled: BOOLEAN (emails habilitados)
- push_enabled: BOOLEAN (push notifications habilitados)
- order_status_email: BOOLEAN (emails de status de pedido)
- order_status_push: BOOLEAN (push de status de pedido)
- promotions_email: BOOLEAN (emails de promoções)
- promotions_push: BOOLEAN (push de promoções)
- news_email: BOOLEAN (emails de novidades)
- news_push: BOOLEAN (push de novidades)
```

### Tabela `notification_templates`
```sql
- id: UUID (primary key)
- type: TEXT (tipo da notificação)
- email_subject: TEXT (assunto do email)
- email_template: TEXT (template do email)
- push_title: TEXT (título da push notification)
- push_template: TEXT (template da push notification)
```

## 🚀 Como Usar

### 1. Integração no Header
```tsx
import { NotificationBell } from '@/components/notifications';

// No componente Header
{user && <NotificationBell />}
```

### 2. Context Provider
```tsx
import { NotificationProvider } from '@/contexts/NotificationContext';

// No App.tsx
<NotificationProvider>
  <App />
</NotificationProvider>
```

### 3. Enviando Notificações
```tsx
import { useNotificationActions } from '@/hooks/useNotificationActions';

const { sendOrderStatusNotification } = useNotificationActions();

// Enviar notificação de status de pedido
await sendOrderStatusNotification(
  userId,
  'PED-001',
  'Enviado',
  'João Silva',
  'Seu pedido foi enviado via correios'
);
```

### 4. Consumindo Notificações
```tsx
import { useNotifications } from '@/contexts/NotificationContext';

const { notifications, unreadCount, markAsRead } = useNotifications();
```

## 🔧 API do Sistema

### NotificationService
- `getNotifications(filters?)`: Buscar notificações
- `markAsRead(id)`: Marcar como lida
- `markAllAsRead()`: Marcar todas como lidas
- `deleteNotification(id)`: Remover notificação
- `createNotification(data)`: Criar notificação
- `getPreferences()`: Buscar preferências
- `updatePreferences(data)`: Atualizar preferências
- `sendNotificationWithTemplate()`: Enviar com template

### useNotificationActions Hook
- `sendOrderStatusNotification()`
- `sendNewOrderNotification()`
- `sendPromotionNotification()`
- `sendNewsNotification()`
- `sendCustomNotification()`
- `sendBulkNotification()`

## 🎮 Demo e Testes

Acesse `/notification-demo` para testar o sistema:
- Envio de diferentes tipos de notificação
- Configuração de preferências
- Visualização em tempo real

## 📋 Estruturas Pendentes para Implementação Completa

### 🚨 Endpoints Necessários (Comentário para PR)

**Email Service Integration:**
```typescript
// Endpoints necessários para email notifications
POST /api/notifications/send-email
GET /api/notifications/email-templates
PUT /api/notifications/email-templates/:id

// Configuração necessária:
// - Integração com SendGrid/AWS SES/Nodemailer
// - Variáveis de ambiente para SMTP
// - Templates HTML responsivos
```

**Push Notifications Service:**
```typescript
// Endpoints necessários para web push
POST /api/notifications/subscribe-push
POST /api/notifications/send-push
DELETE /api/notifications/unsubscribe-push

// Configuração necessária:
// - Service Worker para web push
// - VAPID keys para web push
// - Firebase/OneSignal integration
```

**Admin Dashboard:**
```typescript
// Endpoints para administração
GET /api/admin/notifications/stats
POST /api/admin/notifications/broadcast
GET /api/admin/notifications/templates
PUT /api/admin/notifications/templates/:id

// Funcionalidades pendentes:
// - Dashboard para envio em massa
// - Analytics de notificações
// - Editor de templates WYSIWYG
```

### 🔧 Configurações Adicionais

**Variáveis de Ambiente Necessárias:**
```env
# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@jardimdaspatinhas.com
SMTP_PASS=app_password
EMAIL_FROM=notifications@jardimdaspatinhas.com

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@jardimdaspatinhas.com

# Notification Settings
NOTIFICATIONS_RATE_LIMIT=100
BULK_NOTIFICATION_BATCH_SIZE=50
```

**Service Worker (para Web Push):**
```javascript
// public/sw.js - Service Worker necessário
self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png'
  };
  
  event.waitUntil(
    self.registration.showNotification('Jardim das Patinhas', options)
  );
});
```

### 📊 Analytics e Métricas

**Tabelas Adicionais Recomendadas:**
```sql
-- Tracking de abertura de notificações
CREATE TABLE notification_analytics (
  id UUID PRIMARY KEY,
  notification_id UUID REFERENCES notifications(id),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT, -- 'opened', 'clicked', 'dismissed'
  created_at TIMESTAMP DEFAULT now()
);

-- Filas para processamento em background
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY,
  notification_data JSONB,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

## 🚀 Próximos Passos

1. **Implementar email service** com templates HTML
2. **Configurar web push notifications** com service worker
3. **Criar dashboard administrativo** para gestão de notificações
4. **Adicionar analytics** de abertura e cliques
5. **Implementar sistema de filas** para notificações em massa
6. **Criar templates visuais** com editor WYSIWYG
7. **Adicionar categorias** e tags para notificações
8. **Implementar digest** de notificações por email

## 🔒 Segurança Implementada

- **RLS (Row Level Security)** no Supabase
- **Autenticação obrigatória** para todas as operações
- **Validação de tipos** com TypeScript
- **Sanitização de conteúdo** em templates
- **Rate limiting** (preparado para implementação)

## 📱 Responsividade

- **Design mobile-first** em todos os componentes
- **Popover adaptativo** no NotificationBell
- **Layout responsivo** na lista de notificações
- **Otimização touch** para dispositivos móveis

---

**Status:** ✅ Sistema base implementado e funcional
**Próximo milestone:** Integração completa com email e push notifications