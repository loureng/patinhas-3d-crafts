import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PedidoTracking {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  status_history: Array<{
    status: string;
    timestamp: string;
    description?: string;
  }>;
  estimated_delivery?: string;
}

export const usePedidos = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusLabels = {
    pending: 'Pedido Confirmado',
    processing: 'Em Produção',
    quality_check: 'Controle de Qualidade',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  };

  const getStatusProgress = (status: string): number => {
    const statusOrder = ['pending', 'processing', 'quality_check', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  const fetchPedidos = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          estimated_delivery,
          order_status_history (
            status,
            created_at,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      const pedidosFormatados = (orders || []).map(order => ({
        ...order,
        status_history: order.order_status_history?.map((history: any) => ({
          status: history.status,
          timestamp: history.created_at,
          description: history.description
        })) || [
          {
            status: order.status,
            timestamp: order.created_at,
            description: `Pedido ${statusLabels[order.status as keyof typeof statusLabels] || order.status}`
          }
        ]
      }));

      setPedidos(pedidosFormatados);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, [user]);

  const updatePedidoStatus = async (pedidoId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', pedidoId);

      if (error) throw error;

      // Adicionar entrada no histórico
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: pedidoId,
          status: newStatus,
          description: `Pedido ${statusLabels[newStatus as keyof typeof statusLabels] || newStatus}`
        });

      if (historyError) console.warn('Erro ao adicionar histórico:', historyError);

      // Refetch pedidos
      await fetchPedidos();
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      throw err;
    }
  };

  return {
    pedidos,
    loading,
    error,
    statusLabels,
    getStatusProgress,
    updatePedidoStatus,
    refetch: fetchPedidos
  };
};