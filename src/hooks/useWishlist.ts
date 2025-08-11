import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { clienteAPI, WishlistItem } from '@/services/clienteAPI';

export const useWishlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await clienteAPI.getWishlist(user.id);
      setItems(data);
    } catch (err) {
      console.error('Erro ao buscar wishlist:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const addToWishlist = async (productId: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      await clienteAPI.addToWishlist(user.id, productId);
      await fetchWishlist(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao adicionar à wishlist:', err);
      throw err;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      await clienteAPI.removeFromWishlist(user.id, productId);
      await fetchWishlist(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao remover da wishlist:', err);
      throw err;
    }
  };

  const moveToCart = async (productId: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      await clienteAPI.moveToCart(user.id, productId);
      await fetchWishlist(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao mover para carrinho:', err);
      throw err;
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return items.some(item => item.product_id === productId);
  };

  return {
    items,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    isInWishlist,
    refetch: fetchWishlist
  };
};