-- Create missing tables: wishlist and notification_preferences
-- This migration addresses PGRST205 errors where tables don't exist

-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Create notification_preferences table  
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_marketing BOOLEAN DEFAULT true,
  email_orders BOOLEAN DEFAULT true,
  email_promotions BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist
CREATE POLICY "Users can view their own wishlist items" 
ON public.wishlist FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add items to their own wishlist" 
ON public.wishlist FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove items from their own wishlist" 
ON public.wishlist FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" 
ON public.notification_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
ON public.notification_preferences FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" 
ON public.notification_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON public.wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Create function to update updated_at timestamp (if not already exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate entries
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create notification preferences for new users
DROP TRIGGER IF EXISTS on_auth_user_created_notification_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_preferences();