import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ReportsFilters } from '@/components/admin/reports/ReportsFilters';
import { MetricsCards } from '@/components/admin/reports/MetricsCards';
import { SalesChart } from '@/components/admin/reports/SalesChart';
import { TopProductsTable } from '@/components/admin/reports/TopProductsTable';
import { ExportButton } from '@/components/admin/reports/ExportButton';
import { useReportsData } from '@/hooks/useReports';
import { supabase } from '@/integrations/supabase/client';
import { 
  filterSalesData, 
  calculateSalesMetrics, 
  aggregateProductSales, 
  aggregateSalesByPeriod,
  ReportFilters as IReportFilters 
} from '@/lib/reports';

export default function Reports() {
  const [filters, setFilters] = useState<IReportFilters>({});
  const queryClient = useQueryClient();
  
  // Buscar dados com filtros aplicados no backend quando possível
  const { 
    data: rawSalesData = [], 
    isLoading, 
    error 
  } = useReportsData(filters);

  // Real-time subscription para invalidar queries quando dados mudarem
  useEffect(() => {
    const ordersSubscription = supabase
      .channel('reports-orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        (payload) => {
          console.log('Pedido atualizado no relatório:', payload);
          // Invalidar query para refetch automático
          queryClient.invalidateQueries({ queryKey: ['reports-data'] });
        }
      )
      .subscribe();

    const orderItemsSubscription = supabase
      .channel('reports-order-items-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'order_items' }, 
        (payload) => {
          console.log('Item de pedido atualizado no relatório:', payload);
          queryClient.invalidateQueries({ queryKey: ['reports-data'] });
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      orderItemsSubscription.unsubscribe();
    };
  }, [queryClient]);

  // Processamento dos dados para relatórios
  const processedData = useMemo(() => {
    if (!rawSalesData.length) {
      return {
        filteredSales: [],
        metrics: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, completedOrders: 0 },
        productSales: [],
        periodSales: []
      };
    }

    // Aplicar filtros adicionais no frontend se necessário
    const filteredSales = filterSalesData(rawSalesData, filters);
    
    // Calcular métricas
    const metrics = calculateSalesMetrics(filteredSales);
    
    // Agregar dados por produto
    const productSales = aggregateProductSales(filteredSales);
    
    // Agregar dados por período (diário por padrão)
    const periodSales = aggregateSalesByPeriod(filteredSales, 'daily');

    return {
      filteredSales,
      metrics,
      productSales,
      periodSales
    };
  }, [rawSalesData, filters]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar relatórios</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Análise detalhada de vendas e performance de produtos
          </p>
        </div>
        <ExportButton
          salesData={processedData.filteredSales}
          productData={processedData.productSales}
          periodData={processedData.periodSales}
          disabled={isLoading}
        />
      </div>

      {/* Filtros */}
      <ReportsFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* Métricas Resumo */}
      <MetricsCards
        totalRevenue={processedData.metrics.totalRevenue}
        totalOrders={processedData.metrics.totalOrders}
        averageOrderValue={processedData.metrics.averageOrderValue}
        topProductsCount={processedData.productSales.length}
        isLoading={isLoading}
      />

      {/* Gráfico de Vendas por Período */}
      <SalesChart 
        data={processedData.periodSales} 
        isLoading={isLoading}
      />

      {/* Tabela de Produtos Mais Vendidos */}
      <TopProductsTable 
        data={processedData.productSales} 
        isLoading={isLoading}
        maxItems={10}
      />

      {/* Informação sobre dados */}
      {!isLoading && (
        <div className="text-center text-sm text-muted-foreground py-4">
          {processedData.filteredSales.length > 0 ? (
            `Mostrando dados de ${processedData.filteredSales.length} pedidos filtrados`
          ) : (
            'Nenhum dado encontrado para os filtros selecionados'
          )}
        </div>
      )}
    </div>
  );
}