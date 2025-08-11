import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ClienteMetrics {
  totalPedidos: number;
  valorTotalGasto: number;
  pedidosEmAndamento: number;
  pedidosRecentes: Array<{
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
  }>;
}

export const useCliente = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ClienteMetrics>({
    totalPedidos: 0,
    valorTotalGasto: 0,
    pedidosEmAndamento: 0,
    pedidosRecentes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClienteMetrics = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar todos os pedidos do usuário
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, created_at, total_amount, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          throw ordersError;
        }

        const allOrders = orders || [];
        
        // Calcular métricas
        const totalPedidos = allOrders.length;
        const valorTotalGasto = allOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const pedidosEmAndamento = allOrders.filter(order => 
          ['pending', 'processing', 'shipped'].includes(order.status)
        ).length;
        const pedidosRecentes = allOrders.slice(0, 5);

        setMetrics({
          totalPedidos,
          valorTotalGasto,
          pedidosEmAndamento,
          pedidosRecentes
        });
      } catch (err) {
        console.error('Erro ao buscar métricas do cliente:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchClienteMetrics();
  }, [user]);

  return { metrics, loading, error, refetch: () => {
    if (user) {
      setLoading(true);
      // Re-trigger the effect by updating a dependency
    }
  } };
};