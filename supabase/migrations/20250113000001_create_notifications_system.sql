-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ORDER_STATUS_CHANGED', 'NEW_ORDER', 'PROMOTION', 'NEWS', 'SYSTEM_UPDATE')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  order_status_email BOOLEAN DEFAULT true,
  order_status_push BOOLEAN DEFAULT true,
  promotions_email BOOLEAN DEFAULT true,
  promotions_push BOOLEAN DEFAULT false,
  news_email BOOLEAN DEFAULT false,
  news_push BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL UNIQUE CHECK (type IN ('ORDER_STATUS_CHANGED', 'NEW_ORDER', 'PROMOTION', 'NEWS', 'SYSTEM_UPDATE')),
  email_subject TEXT,
  email_template TEXT,
  push_title TEXT,
  push_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for notification preferences
CREATE POLICY "Users can view their own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notification templates (read-only for users, admin-only for modifications)
CREATE POLICY "Users can view notification templates" ON notification_templates
  FOR SELECT USING (true);

-- Insert default notification templates
INSERT INTO notification_templates (type, email_subject, email_template, push_title, push_template) VALUES
('ORDER_STATUS_CHANGED', 
 'Atualização do seu pedido #{order_number}', 
 'Olá {customer_name},\n\nSeu pedido #{order_number} foi atualizado para: {status}\n\n{details}\n\nObrigado por escolher o Jardim das Patinhas!',
 'Pedido Atualizado',
 'Seu pedido #{order_number} foi {status}'),
 
('NEW_ORDER',
 'Novo pedido recebido #{order_number}',
 'Um novo pedido foi recebido:\n\nPedido: #{order_number}\nCliente: {customer_name}\nValor: {total}\n\nAcesse o painel administrativo para mais detalhes.',
 'Novo Pedido',
 'Pedido #{order_number} de {customer_name}'),
 
('PROMOTION',
 '{promotion_title} - Não perca!',
 'Olá {customer_name},\n\n{promotion_content}\n\nAproveite essa oportunidade especial no Jardim das Patinhas!\n\nCódigo: {promo_code}',
 'Promoção Especial',
 '{promotion_title} - {promo_code}'),
 
('NEWS',
 '{news_title}',
 'Olá {customer_name},\n\n{news_content}\n\nContinue acompanhando as novidades do Jardim das Patinhas!',
 'Novidades',
 '{news_title}'),
 
('SYSTEM_UPDATE',
 'Atualização do Sistema - {title}',
 'Prezado administrador,\n\n{content}\n\nSistema: Jardim das Patinhas',
 'Sistema Atualizado',
 '{title}');

-- Create function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create notification preferences
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_notification_preferences_for_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();