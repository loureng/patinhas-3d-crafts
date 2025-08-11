-- Create categories table for better product organization
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

-- Admin policies (will be implemented with proper admin role later)
CREATE POLICY "Only admins can manage categories" 
ON public.categories 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
('Pets', 'pets', 'Produtos para animais de estimação', 1),
('Casa', 'casa', 'Decoração e utilidades para casa', 2),
('Jardim', 'jardim', 'Produtos para jardim e plantas', 3),
('Personalização', 'personalizacao', 'Produtos totalmente personalizáveis', 4);

-- Update products table to reference categories properly
-- First, update existing products to use the new category slugs
UPDATE public.products SET category = 'pets' WHERE category = 'pets';
UPDATE public.products SET category = 'casa' WHERE category = 'casa';
UPDATE public.products SET category = 'jardim' WHERE category = 'jardim';
UPDATE public.products SET category = 'personalizacao' WHERE category = 'personalizacao';

-- Add some missing fields that might be useful for admin panel
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customizable boolean DEFAULT false;

-- Update existing products with proper image_url field
UPDATE public.products 
SET image_url = images[1] 
WHERE image_url IS NULL AND array_length(images, 1) > 0;

UPDATE public.products 
SET customizable = is_customizable 
WHERE customizable IS NULL;

-- Create order_items table for better order management
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price decimal(10,2) NOT NULL,
  customization jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items
CREATE POLICY "Users can view their own order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Update orders table structure
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount decimal(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;

-- Migrate data from old items column to new order_items table
-- This would need to be done carefully in production with existing data

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Add email field to profiles for admin management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles 
  SET email = NEW.email 
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger to sync email updates
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();

-- Update existing profiles with email from auth.users
UPDATE public.profiles 
SET email = auth_users.email 
FROM auth.users AS auth_users 
WHERE profiles.user_id = auth_users.id 
AND profiles.email IS NULL;