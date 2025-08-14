-- Create settings table for admin configuration
CREATE TABLE public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('store_name', '"Jardim das Patinhas"', 'Nome da loja'),
('store_description', '"Produtos personalizados para pets, casa e jardim"', 'Descrição da loja'),
('contact_email', '"contato@jardimdaspatinhas.com.br"', 'Email de contato'),
('contact_phone', '"(11) 9999-9999"', 'Telefone de contato'),
('store_address', '"São Paulo, SP"', 'Endereço da loja'),
('currency', '"BRL"', 'Moeda padrão'),
('tax_rate', '0', 'Taxa de imposto (%)'),
('shipping_fee', '15.00', 'Taxa de envio padrão'),
('free_shipping_threshold', '199.00', 'Valor mínimo para frete grátis'),
('maintenance_mode', 'false', 'Modo de manutenção ativo'),
('allow_guest_checkout', 'true', 'Permitir compra sem cadastro'),
('require_email_verification', 'false', 'Exigir verificação de email');

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access for authenticated users" ON public.settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for service role" ON public.settings
    FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON public.settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();