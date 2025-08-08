-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','amount')),
  discount_value numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  valid_from timestamptz,
  valid_to timestamptz,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Coupons are viewable by everyone when valid/active
CREATE POLICY IF NOT EXISTS "Coupons are viewable by everyone"
ON public.coupons
FOR SELECT
USING (
  is_active = true AND
  (valid_from IS NULL OR now() >= valid_from) AND
  (valid_to IS NULL OR now() <= valid_to) AND
  (usage_limit IS NULL OR used_count < usage_limit)
);

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_coupons_updated_at'
  ) THEN
    CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create customizations storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('customizations', 'customizations', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the customizations bucket
DO $$
BEGIN
  -- Insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own customization files'
  ) THEN
    CREATE POLICY "Users can upload their own customization files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'customizations' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Select
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can view their own customization files'
  ) THEN
    CREATE POLICY "Users can view their own customization files"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'customizations' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own customization files'
  ) THEN
    CREATE POLICY "Users can update their own customization files"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'customizations' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own customization files'
  ) THEN
    CREATE POLICY "Users can delete their own customization files"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'customizations' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;