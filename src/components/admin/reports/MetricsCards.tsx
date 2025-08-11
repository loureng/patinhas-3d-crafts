import { TrendingUp, DollarSign, ShoppingBag, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/reports';

interface MetricsCardsProps {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProductsCount: number;
  isLoading?: boolean;
}

export function MetricsCards({
  totalRevenue,
  totalOrders,
  averageOrderValue,
  topProductsCount,
  isLoading = false
}: MetricsCardsProps) {
  const metrics = [
    {
      title: 'Receita Total',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Total de Pedidos',
      value: totalOrders.toString(),
      icon: ShoppingBag,
      color: 'text-blue-600'
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(averageOrderValue),
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Produtos Vendidos',
      value: topProductsCount.toString(),
      icon: Package,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                ) : (
                  metric.value
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}