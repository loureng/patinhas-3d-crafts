-- Fix production queue table structure for admin UI compatibility
-- This migration addresses PGRST205 error in admin UI at /admin/production-queue
-- The existing production_queue table has a complex structure that doesn't match frontend expectations

-- Drop the existing production_queue table and recreate with simpler structure
-- This ensures the admin UI can properly query the table
DROP TABLE IF EXISTS public.production_queue CASCADE;

-- Create table public.production_queue with simplified structure matching frontend expectations
CREATE TABLE public.production_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  customization_id uuid REFERENCES public.customizations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  priority integer DEFAULT 0,
  scheduled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable ROW LEVEL SECURITY on the table
ALTER TABLE public.production_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users (permissive for admin workflows)
CREATE POLICY "Authenticated users can read production queue" 
  ON public.production_queue 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert into production queue" 
  ON public.production_queue 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update production queue" 
  ON public.production_queue 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete production queue" 
  ON public.production_queue 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Create index for common lookups (status, priority)
CREATE INDEX idx_production_queue_status_priority ON public.production_queue(status, priority);

-- Create trigger to update updated_at using existing update_updated_at_column function
CREATE TRIGGER update_production_queue_updated_at
  BEFORE UPDATE ON public.production_queue
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();