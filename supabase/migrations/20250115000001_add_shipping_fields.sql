-- Add shipping-related fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS length_cm INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS width_cm INTEGER DEFAULT 10, 
ADD COLUMN IF NOT EXISTS height_cm INTEGER DEFAULT 5;

-- Update existing products with sensible default weights based on category
UPDATE public.products 
SET weight_grams = CASE 
  WHEN category = 'pets' AND name ILIKE '%comedouro%' THEN 800
  WHEN category = 'pets' AND name ILIKE '%casinha%' THEN 2000  
  WHEN category = 'pets' AND name ILIKE '%brinquedo%' THEN 150
  WHEN category = 'jardim' AND name ILIKE '%vaso%' THEN 500
  WHEN category = 'jardim' AND name ILIKE '%casinha%' THEN 1500
  WHEN category = 'casa' AND name ILIKE '%porta%' THEN 100
  WHEN category = 'casa' AND name ILIKE '%organizador%' THEN 300
  WHEN category = 'personalizacao' THEN 50
  ELSE 200
END
WHERE weight_grams = 200; -- Only update products that still have default weight

-- Add index for performance on weight-based queries
CREATE INDEX IF NOT EXISTS idx_products_weight ON public.products (weight_grams);

-- Add comment explaining the fields
COMMENT ON COLUMN public.products.weight_grams IS 'Product weight in grams for shipping calculation';
COMMENT ON COLUMN public.products.length_cm IS 'Product length in centimeters';
COMMENT ON COLUMN public.products.width_cm IS 'Product width in centimeters'; 
COMMENT ON COLUMN public.products.height_cm IS 'Product height in centimeters';