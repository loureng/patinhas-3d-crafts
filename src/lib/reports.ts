import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export interface SalesData {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    category: string;
  };
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  productId?: string;
  status?: string;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completedOrders: number;
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface PeriodSalesData {
  period: string;
  revenue: number;
  orders: number;
  date: Date;
}

/**
 * Filtra dados de vendas baseado nos filtros aplicados
 */
export function filterSalesData(data: SalesData[], filters: ReportFilters): SalesData[] {
  return data.filter(sale => {
    // Filtro por período
    if (filters.startDate && filters.endDate) {
      const saleDate = new Date(sale.created_at);
      const dateRange = {
        start: startOfDay(filters.startDate),
        end: endOfDay(filters.endDate)
      };
      if (!isWithinInterval(saleDate, dateRange)) {
        return false;
      }
    }

    // Filtro por status
    if (filters.status && sale.status !== filters.status) {
      return false;
    }

    // Filtro por categoria ou produto
    if (filters.category || filters.productId) {
      const hasMatchingItem = sale.items.some(item => {
        if (filters.category && item.product.category !== filters.category) {
          return false;
        }
        if (filters.productId && item.product_id !== filters.productId) {
          return false;
        }
        return true;
      });
      if (!hasMatchingItem) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calcula métricas gerais de vendas
 */
export function calculateSalesMetrics(data: SalesData[]): SalesMetrics {
  const totalRevenue = data.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalOrders = data.length;
  const completedOrders = data.filter(sale => sale.status === 'completed').length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    completedOrders
  };
}

/**
 * Agrupa vendas por produto e calcula estatísticas
 */
export function aggregateProductSales(data: SalesData[]): ProductSalesData[] {
  const productMap = new Map<string, ProductSalesData>();

  data.forEach(sale => {
    sale.items.forEach(item => {
      const existing = productMap.get(item.product_id);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.price * item.quantity;
        existing.orderCount += 1;
      } else {
        productMap.set(item.product_id, {
          productId: item.product_id,
          productName: item.product.name,
          category: item.product.category,
          totalQuantity: item.quantity,
          totalRevenue: item.price * item.quantity,
          orderCount: 1
        });
      }
    });
  });

  return Array.from(productMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Agrupa vendas por período (diário, semanal, mensal)
 */
export function aggregateSalesByPeriod(
  data: SalesData[], 
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
): PeriodSalesData[] {
  const periodMap = new Map<string, PeriodSalesData>();

  data.forEach(sale => {
    const date = new Date(sale.created_at);
    let periodKey: string;
    let periodDate: Date;

    switch (period) {
      case 'daily':
        periodKey = format(date, 'yyyy-MM-dd');
        periodDate = startOfDay(date);
        break;
      case 'weekly':
        periodKey = format(date, 'yyyy-\'W\'ww');
        periodDate = startOfDay(date);
        break;
      case 'monthly':
        periodKey = format(date, 'yyyy-MM');
        periodDate = new Date(date.getFullYear(), date.getMonth(), 1);
        break;
    }

    const existing = periodMap.get(periodKey);
    if (existing) {
      existing.revenue += sale.total_amount;
      existing.orders += 1;
    } else {
      periodMap.set(periodKey, {
        period: periodKey,
        revenue: sale.total_amount,
        orders: 1,
        date: periodDate
      });
    }
  });

  return Array.from(periodMap.values()).sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  );
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata data para exibição
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy');
}