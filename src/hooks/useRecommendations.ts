import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RecommendedProduct {
  product_id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  score: number;
}

export interface UserInteraction {
  id?: string;
  user_id: string;
  product_id: string;
  interaction_type: 'view' | 'add_to_cart' | 'purchase' | 'search' | 'wishlist';
  interaction_data?: any;
  session_id?: string;
}

export const useRecommendations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track user interaction
  const trackInteraction = useCallback(async (interaction: Omit<UserInteraction, 'user_id' | 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          ...interaction,
          session_id: sessionStorage.getItem('session_id') || crypto.randomUUID()
        });

      if (error) {
        console.warn('Error tracking interaction:', error);
      }
    } catch (err) {
      console.warn('Error tracking interaction:', err);
    }
  }, [user]);

  // Get content-based recommendations for a specific product
  const getContentBasedRecommendations = useCallback(async (
    productId: string,
    limit: number = 5
  ): Promise<RecommendedProduct[]> => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .rpc('get_content_based_recommendations', {
          target_user_id: user.id,
          target_product_id: productId,
          limit_count: limit
        });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error getting recommendations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get collaborative filtering recommendations
  const getCollaborativeRecommendations = useCallback(async (
    limit: number = 5
  ): Promise<RecommendedProduct[]> => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .rpc('get_collaborative_recommendations', {
          target_user_id: user.id,
          limit_count: limit
        });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error getting recommendations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get popular recommendations (fallback for non-authenticated users)
  const getPopularRecommendations = useCallback(async (
    category?: string,
    limit: number = 5
  ): Promise<RecommendedProduct[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .rpc('get_popular_recommendations', {
          category_filter: category || null,
          limit_count: limit
        });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error getting recommendations');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get cached recommendations or generate new ones
  const getCachedRecommendations = useCallback(async (
    productId: string,
    algorithmType: 'content' | 'collaborative' | 'popular' = 'content',
    limit: number = 5
  ): Promise<RecommendedProduct[]> => {
    if (!user) {
      return getPopularRecommendations(undefined, limit);
    }

    try {
      // First, try to get cached recommendations
      const { data: cachedData, error: cacheError } = await supabase
        .from('product_recommendations')
        .select(`
          recommended_product_id,
          score,
          products:recommended_product_id (
            id,
            name,
            price,
            image_url,
            category
          )
        `)
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('algorithm_type', algorithmType)
        .gt('expires_at', new Date().toISOString())
        .order('score', { ascending: false })
        .limit(limit);

      if (!cacheError && cachedData && cachedData.length > 0) {
        return cachedData.map(item => ({
          product_id: item.recommended_product_id,
          name: (item.products as any)?.name || '',
          price: (item.products as any)?.price || 0,
          image_url: (item.products as any)?.image_url || '',
          category: (item.products as any)?.category || '',
          score: item.score
        }));
      }

      // If no cached data, generate new recommendations
      let recommendations: RecommendedProduct[] = [];
      
      switch (algorithmType) {
        case 'content':
          recommendations = await getContentBasedRecommendations(productId, limit);
          break;
        case 'collaborative':
          recommendations = await getCollaborativeRecommendations(limit);
          break;
        case 'popular':
          recommendations = await getPopularRecommendations(undefined, limit);
          break;
      }

      // Cache the new recommendations
      if (recommendations.length > 0) {
        const cacheEntries = recommendations.map(rec => ({
          user_id: user.id,
          product_id: productId,
          recommended_product_id: rec.product_id,
          score: rec.score,
          algorithm_type: algorithmType,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }));

        await supabase
          .from('product_recommendations')
          .upsert(cacheEntries, {
            onConflict: 'user_id,product_id,recommended_product_id,algorithm_type'
          });
      }

      return recommendations;
    } catch (err) {
      console.error('Error getting cached recommendations:', err);
      return [];
    }
  }, [user, getContentBasedRecommendations, getCollaborativeRecommendations, getPopularRecommendations]);

  // Get personalized recommendations for homepage/catalog
  const getPersonalizedRecommendations = useCallback(async (
    limit: number = 8
  ): Promise<RecommendedProduct[]> => {
    if (!user) {
      return getPopularRecommendations(undefined, limit);
    }

    try {
      // Mix collaborative and popular recommendations
      const [collaborative, popular] = await Promise.all([
        getCollaborativeRecommendations(Math.ceil(limit * 0.7)),
        getPopularRecommendations(undefined, Math.ceil(limit * 0.3))
      ]);

      // Combine and deduplicate
      const combined = [...collaborative, ...popular];
      const unique = combined.filter((item, index, self) => 
        index === self.findIndex(t => t.product_id === item.product_id)
      );

      return unique.slice(0, limit);
    } catch (err) {
      console.error('Error getting personalized recommendations:', err);
      return getPopularRecommendations(undefined, limit);
    }
  }, [user, getCollaborativeRecommendations, getPopularRecommendations]);

  // Initialize session ID
  useEffect(() => {
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', crypto.randomUUID());
    }
  }, []);

  return {
    loading,
    error,
    trackInteraction,
    getContentBasedRecommendations,
    getCollaborativeRecommendations,
    getPopularRecommendations,
    getCachedRecommendations,
    getPersonalizedRecommendations
  };
};