import { supabase } from '@/integrations/supabase/client';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    description: string;
  };
}

export const clienteAPI = {
  // Wishlist operations
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        id,
        user_id,
        product_id,
        created_at,
        products (
          id,
          name,
          price,
          image_url,
          description
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data?.map(item => ({
      ...item,
      product: item.products
    })) || [];
  },

  async addToWishlist(userId: string, productId: string): Promise<WishlistItem> {
    // Verificar se já existe na wishlist
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      throw new Error('Produto já está na lista de desejos');
    }

    const { data, error } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        product_id: productId
      })
      .select(`
        id,
        user_id,
        product_id,
        created_at,
        products (
          id,
          name,
          price,
          image_url,
          description
        )
      `)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      product: data.products
    };
  },

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;
  },

  async moveToCart(userId: string, productId: string): Promise<void> {
    // Aqui você implementaria a lógica para mover para o carrinho
    // Por agora, vamos apenas remover da wishlist
    await this.removeFromWishlist(userId, productId);
    
    // TODO: Adicionar lógica de carrinho quando disponível
    console.log('Produto movido para o carrinho:', productId);
  },

  // Dashboard metrics
  async getDashboardMetrics(userId: string) {
    const [ordersResponse, wishlistResponse] = await Promise.all([
      supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('user_id', userId),
      supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
    ]);

    if (ordersResponse.error) throw ordersResponse.error;
    if (wishlistResponse.error) throw wishlistResponse.error;

    const orders = ordersResponse.data || [];
    const wishlistCount = wishlistResponse.data?.length || 0;

    return {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      pendingOrders: orders.filter(order => 
        ['pending', 'processing', 'shipped'].includes(order.status)
      ).length,
      wishlistCount,
      recentOrders: orders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
    };
  }
};