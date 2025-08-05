-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price decimal(10,2) NOT NULL,
  category text NOT NULL,
  images text[] DEFAULT '{}',
  is_customizable boolean DEFAULT false,
  customization_options jsonb DEFAULT '{}',
  stock integer DEFAULT 0,
  model_3d_url text,
  materials text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for products (public read)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- Create orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]',
  total decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  mercado_pago_id text,
  shipping_address jsonb,
  tracking_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create customizations table
CREATE TABLE public.customizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  stl_file_url text,
  status text NOT NULL DEFAULT 'pending',
  price decimal(10,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for customizations
ALTER TABLE public.customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customizations" 
ON public.customizations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customizations" 
ON public.customizations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customizations_updated_at
  BEFORE UPDATE ON public.customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample products
INSERT INTO public.products (name, slug, description, price, category, images, is_customizable, stock, materials) VALUES
('Comedouro Personalizado', 'comedouro-personalizado', 'Comedouro para pets com nome personalizado', 45.00, 'pets', '{"https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"}', true, 50, '{"PLA", "PETG"}'),
('Vaso Decorativo', 'vaso-decorativo', 'Vaso decorativo para plantas', 35.00, 'jardim', '{"https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400"}', false, 30, '{"PLA"}'),
('Porta-chaves Geométrico', 'porta-chaves-geometrico', 'Porta-chaves com design geométrico moderno', 25.00, 'casa', '{"https://images.unsplash.com/photo-1558618666-fbd6c1c0bbc4?w=400"}', true, 100, '{"PLA", "ABS"}'),
('Casinha de Passarinho', 'casinha-passarinho', 'Casinha decorativa para passarinhos', 55.00, 'jardim', '{"https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400"}', false, 20, '{"PETG"}'),
('Brinquedo Interativo Pet', 'brinquedo-interativo-pet', 'Brinquedo resistente para cães e gatos', 30.00, 'pets', '{"https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400"}', true, 75, '{"TPU", "PLA"}'),
('Organizador de Mesa', 'organizador-mesa', 'Organizador modular para escritório', 40.00, 'casa', '{"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400"}', false, 40, '{"PLA"});

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();