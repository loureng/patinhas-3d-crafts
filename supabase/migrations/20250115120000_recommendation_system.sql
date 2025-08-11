-- Create recommendation system tables
-- This migration adds the database structure for a functional recommendation system

-- Create enum for interaction types
CREATE TYPE interaction_type AS ENUM ('view', 'add_to_cart', 'purchase', 'search', 'wishlist');

-- Create user_interactions table to track user behavior
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  interaction_type interaction_type NOT NULL,
  interaction_data jsonb DEFAULT '{}',
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create product_recommendations table to store generated recommendations
CREATE TABLE IF NOT EXISTS public.product_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  recommended_product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  score numeric(5,4) NOT NULL DEFAULT 0.0,
  algorithm_type text NOT NULL,
  context jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  CONSTRAINT unique_user_product_recommendation UNIQUE (user_id, product_id, recommended_product_id, algorithm_type)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_interactions
CREATE POLICY "Users can read their own interactions"
  ON public.user_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON public.user_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
  ON public.user_interactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for product_recommendations
CREATE POLICY "Users can read their own recommendations"
  ON public.product_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations"
  ON public.product_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON public.product_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_product_id ON public.user_interactions (product_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON public.user_interactions (interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON public.user_interactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_user_id ON public.product_recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_product_id ON public.product_recommendations (product_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_score ON public.product_recommendations (score DESC);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_expires_at ON public.product_recommendations (expires_at);

-- Create function for content-based recommendations
CREATE OR REPLACE FUNCTION get_content_based_recommendations(
  target_user_id uuid,
  target_product_id uuid,
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  product_id uuid,
  name text,
  price numeric,
  image_url text,
  category text,
  score numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.image_url,
    p.category,
    -- Score based on category match and price similarity
    CASE 
      WHEN p.category = tp.category THEN 0.8
      ELSE 0.3
    END +
    CASE 
      WHEN ABS(p.price - tp.price) <= tp.price * 0.2 THEN 0.2
      ELSE 0.0
    END AS score
  FROM public.products p
  CROSS JOIN public.products tp
  WHERE tp.id = target_product_id
    AND p.id != target_product_id
    AND p.stock > 0
  ORDER BY score DESC, p.rating DESC NULLS LAST, p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create function for collaborative filtering recommendations
CREATE OR REPLACE FUNCTION get_collaborative_recommendations(
  target_user_id uuid,
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  product_id uuid,
  name text,
  price numeric,
  image_url text,
  category text,
  score numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_purchases AS (
    -- Get products purchased by target user
    SELECT DISTINCT oi.product_id
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    WHERE o.user_id = target_user_id
  ),
  similar_users AS (
    -- Find users who bought similar products
    SELECT o.user_id, COUNT(*) as common_products
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    JOIN user_purchases up ON oi.product_id = up.product_id
    WHERE o.user_id != target_user_id
    GROUP BY o.user_id
    HAVING COUNT(*) >= 1
    ORDER BY common_products DESC
    LIMIT 50
  ),
  recommended_products AS (
    -- Get products bought by similar users but not by target user
    SELECT 
      oi.product_id,
      COUNT(*) as purchase_count,
      AVG(su.common_products::numeric) as avg_similarity
    FROM similar_users su
    JOIN public.orders o ON su.user_id = o.user_id
    JOIN public.order_items oi ON o.id = oi.order_id
    LEFT JOIN user_purchases up ON oi.product_id = up.product_id
    WHERE up.product_id IS NULL -- Not purchased by target user
    GROUP BY oi.product_id
  )
  SELECT 
    p.id,
    p.name,
    p.price,
    p.image_url,
    p.category,
    (rp.purchase_count * rp.avg_similarity / 100.0)::numeric as score
  FROM recommended_products rp
  JOIN public.products p ON rp.product_id = p.id
  WHERE p.stock > 0
  ORDER BY score DESC, p.rating DESC NULLS LAST
  LIMIT limit_count;
END;
$$;

-- Create function for popular recommendations (fallback)
CREATE OR REPLACE FUNCTION get_popular_recommendations(
  category_filter text DEFAULT NULL,
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  product_id uuid,
  name text,
  price numeric,
  image_url text,
  category text,
  score numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.image_url,
    p.category,
    -- Score based on rating and review count
    (COALESCE(p.rating, 0) * 0.7 + LEAST(COALESCE(p.review_count, 0) / 10.0, 3.0) * 0.3)::numeric as score
  FROM public.products p
  WHERE p.stock > 0
    AND (category_filter IS NULL OR p.category = category_filter)
  ORDER BY score DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create function to clean expired recommendations
CREATE OR REPLACE FUNCTION clean_expired_recommendations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.product_recommendations 
  WHERE expires_at < now();
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON TYPE interaction_type TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_based_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_collaborative_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_recommendations TO authenticated;