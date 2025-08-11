import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesData, ReportFilters } from '@/lib/reports';

/**
 * Hook para buscar dados de vendas com itens e produtos
 */
export function useReportsData(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['reports-data', filters],
    queryFn: async (): Promise<SalesData[]> => {
      let query = supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          user_id,
          order_items (
            id,
            product_id,
            quantity,
            price,
            products (
              name,
              category
            )
          )
        `);

      // Aplicar filtros de data
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      // Aplicar filtro de status
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar dados de vendas: ${error.message}`);
      }

      // Filtrar por categoria/produto no frontend se necessário
      let salesData = data || [];
      
      if (filters?.category || filters?.productId) {
        salesData = salesData.filter(sale => {
          return sale.order_items.some(item => {
            if (filters.category && item.products?.category !== filters.category) {
              return false;
            }
            if (filters.productId && item.product_id !== filters.productId) {
              return false;
            }
            return true;
          });
        });
      }

      return salesData.map(sale => ({
        ...sale,
        items: sale.order_items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          product: {
            name: item.products?.name || 'Produto sem nome',
            category: item.products?.category || 'Sem categoria'
          }
        }))
      }));
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para buscar lista de categorias disponíveis
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .order('category');

      if (error) {
        throw new Error(`Erro ao buscar categorias: ${error.message}`);
      }

      // Remover duplicatas
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      return uniqueCategories.filter(Boolean);
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}

/**
 * Hook para buscar lista de produtos disponíveis
 */
export function useProducts() {
  return useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category')
        .order('name');

      if (error) {
        throw new Error(`Erro ao buscar produtos: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}

/**
 * Hook para buscar estatísticas gerais da loja
 */
export function useStoreStats() {
  return useQuery({
    queryKey: ['store-stats'],
    queryFn: async () => {
      // Buscar total de pedidos
      const { count: totalOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (ordersError) {
        throw new Error(`Erro ao buscar total de pedidos: ${ordersError.message}`);
      }

      // Buscar receita total
      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      if (revenueError) {
        throw new Error(`Erro ao buscar receita total: ${revenueError.message}`);
      }

      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      // Buscar total de produtos
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) {
        throw new Error(`Erro ao buscar total de produtos: ${productsError.message}`);
      }

      return {
        totalOrders: totalOrders || 0,
        totalRevenue,
        totalProducts: totalProducts || 0,
        averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}