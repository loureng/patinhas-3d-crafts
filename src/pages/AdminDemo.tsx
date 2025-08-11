import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Package, Users, ShoppingCart, AlertTriangle } from "lucide-react";

// Dados simulados para demonstração
const mockMetrics = {
  totalRevenue: 45678.90,
  totalOrders: 234,
  totalProducts: 89,
  totalCustomers: 156,
  revenueGrowth: 12.5,
  ordersGrowth: 8.3
};

const mockSalesData = [
  { month: 'Jan', revenue: 8500, orders: 45 },
  { month: 'Fev', revenue: 9200, orders: 52 },
  { month: 'Mar', revenue: 7800, orders: 38 },
  { month: 'Abr', revenue: 10500, orders: 61 },
  { month: 'Mai', revenue: 12300, orders: 67 },
  { month: 'Jun', revenue: 15400, orders: 78 }
];

const mockTopProducts = [
  { name: 'Casinha Pet 3D', sales: 89, revenue: 12450 },
  { name: 'Comedouro Personalizado', sales: 67, revenue: 8900 },
  { name: 'Placa Identificação', sales: 123, revenue: 3690 },
  { name: 'Brinquedo Interativo', sales: 45, revenue: 5400 },
  { name: 'Decoração Jardim', sales: 34, revenue: 6800 }
];

const mockOrderStatus = [
  { status: 'pending', count: 12, color: '#f59e0b' },
  { status: 'processing', count: 25, color: '#3b82f6' },
  { status: 'shipped', count: 18, color: '#10b981' },
  { status: 'delivered', count: 156, color: '#059669' },
  { status: 'cancelled', count: 3, color: '#ef4444' }
];

const mockLowStockProducts = [
  { id: '1', name: 'Casinha para Gatos', category: 'pets', stock: 3, image_url: '/placeholder.svg' },
  { id: '2', name: 'Vaso Decorativo', category: 'jardim', stock: 5, image_url: '/placeholder.svg' },
  { id: '3', name: 'Comedouro Duplo', category: 'pets', stock: 2, image_url: '/placeholder.svg' }
];

export default function AdminDemo() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">JP</span>
            </div>
            <div>
              <h2 className="font-bold text-lg">Jardim das Patinhas</h2>
              <p className="text-xs text-muted-foreground">Admin Panel - Demo</p>
            </div>
          </div>
          <div className="ml-auto">
            <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
              🚀 Demo - Sistema Administrativo
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="p-6 space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🎯 Demonstração do Sistema Administrativo</h3>
          <p className="text-blue-800 text-sm">
            Este é o dashboard principal do painel administrativo do Jardim das Patinhas. 
            Inclui métricas em tempo real, gráficos interativos e alertas de estoque.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio</p>
          </div>
        </div>

        {/* Métricas principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockMetrics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +{mockMetrics.revenueGrowth.toFixed(1)}% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                +{mockMetrics.ordersGrowth.toFixed(1)}% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {mockLowStockProducts.length} com estoque baixo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Total de clientes cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e análises */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="inventory">Estoque</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Receita por Mês</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockSalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pedidos por Mês</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockSalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Produtos Mais Vendidos</CardTitle>
                <CardDescription>Baseado na receita gerada</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockTopProducts} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Status dos Pedidos</CardTitle>
                <CardDescription>Distribuição atual dos pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockOrderStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {mockOrderStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 mt-4">
                  {mockOrderStatus.map((item) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm capitalize">{item.status}: {item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Produtos com Estoque Baixo
                </CardTitle>
                <CardDescription>
                  Produtos com menos de 10 unidades em estoque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-500">{product.stock}</p>
                        <p className="text-sm text-muted-foreground">unidades</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}