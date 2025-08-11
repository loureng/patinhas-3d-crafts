import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodSalesData, formatCurrency } from '@/lib/reports';

interface SalesChartProps {
  data: PeriodSalesData[];
  isLoading?: boolean;
}

export function SalesChart({ data, isLoading = false }: SalesChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Carregando gráfico...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Nenhum dado encontrado para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico
  const chartData = data.map(item => ({
    periodo: item.period,
    receita: item.revenue,
    pedidos: item.orders,
    // Formatação para tooltip
    receitaFormatada: formatCurrency(item.revenue)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas por Período</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="periodo" 
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="receita"
                orientation="left"
                fontSize={12}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                yAxisId="pedidos"
                orientation="right"
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'receita') {
                    return [formatCurrency(Number(value)), 'Receita'];
                  }
                  return [value, 'Pedidos'];
                }}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend />
              <Line 
                yAxisId="receita"
                type="monotone" 
                dataKey="receita" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Receita"
                dot={{ fill: '#8884d8', strokeWidth: 2 }}
              />
              <Line 
                yAxisId="pedidos"
                type="monotone" 
                dataKey="pedidos" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Pedidos"
                dot={{ fill: '#82ca9d', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}