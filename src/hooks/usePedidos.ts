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
          total,
          status,
          estimated_delivery,
          shipping_address,
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
        total_amount: order.total_amount || order.total || DEFAULT_ORDER_TOTAL, // Fallback para compatibilidade
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

      // O histórico será adicionado automaticamente pelo trigger
      // Refetch pedidos
      await fetchPedidos();
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      throw err;
    }
  };

  const cancelarPedido = async (pedidoId: string) => {
    try {
      // Verificar se o pedido pode ser cancelado
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (!pedido) {
        throw new Error('Pedido não encontrado');
      }

      if (!['pending', 'processing'].includes(pedido.status)) {
        throw new Error('Este pedido não pode mais ser cancelado');
      }

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId)
        .eq('user_id', user?.id); // Garantir que só o dono pode cancelar

      if (error) throw error;

      await fetchPedidos();
      return { success: true };
    } catch (err) {
      console.error('Erro ao cancelar pedido:', err);
      throw err;
    }
  };

  const reordenarPedido = async (pedidoId: string) => {
    try {
      // Buscar o pedido original
      const { data: pedidoOriginal, error: fetchError } = await supabase
        .from('orders')
        .select('items, shipping_address')
        .eq('id', pedidoId)
        .eq('user_id', user?.id)
        .single();

      if (fetchError || !pedidoOriginal) {
        throw new Error('Pedido original não encontrado');
      }

      // Buscar produtos atualizados para calcular preço atual
      const items = Array.isArray(pedidoOriginal.items) ? pedidoOriginal.items : [];
      if (items.length === 0) {
        throw new Error('Nenhum item encontrado no pedido original');
      }

      const productIds = items.map((item: any) => item.product_id);
      const { data: produtos, error: produtoError } = await supabase
        .from('products')
        .select('id, name, price')
        .in('id', productIds);

      if (produtoError) throw produtoError;

      // Calcular novo total com preços atuais
      let novoTotal = 0;
      const novosItens = items.map((item: any) => {
        const produto = produtos?.find(p => p.id === item.product_id);
        if (!produto) {
          throw new Error(`Produto ${item.product_id} não está mais disponível`);
        }
        
        const precoAtual = produto.price;
        const subtotal = precoAtual * item.quantity;
        novoTotal += subtotal;

        return {
          ...item,
          price: precoAtual,
          subtotal
        };
      });

      // Criar novo pedido
      const { data: novoPedido, error: createError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          items: novosItens,
          total_amount: novoTotal,
          total: novoTotal, // Para compatibilidade
          status: 'pending',
          shipping_address: pedidoOriginal.shipping_address,
          payment_method: null // Usuário terá que escolher novamente
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchPedidos();
      return { success: true, novoPedidoId: novoPedido.id };
    } catch (err) {
      console.error('Erro ao reordenar pedido:', err);
      throw err;
    }
  };

  const alterarEnderecoPedido = async (pedidoId: string, novoEndereco: any) => {
    try {
      // Verificar se o pedido pode ter endereço alterado
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (!pedido) {
        throw new Error('Pedido não encontrado');
      }

      if (!['pending', 'processing'].includes(pedido.status)) {
        throw new Error('Não é possível alterar o endereço após o envio');
      }

      const { error } = await supabase
        .from('orders')
        .update({ 
          shipping_address: novoEndereco,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchPedidos();
      return { success: true };
    } catch (err) {
      console.error('Erro ao alterar endereço do pedido:', err);
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
    cancelarPedido,
    reordenarPedido,
    alterarEnderecoPedido,
    refetch: fetchPedidos
  };
};