import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCliente } from '@/hooks/useCliente';
import { 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  TrendingUp,
  Eye,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardCliente = () => {
  const { metrics, loading, error } = useCliente();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar dados: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'processing': return 'secondary';
      case 'shipped': return 'outline';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Em Produção';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral da sua conta e atividades recentes
        </p>
      </div>

      {/* Métricas Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pedidos
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPedidos}</div>
            <p className="text-xs text-muted-foreground">
              Todos os seus pedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total Gasto
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.valorTotalGasto.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Em todos os pedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos em Andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pedidosEmAndamento}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento ou envio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Médio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.totalPedidos > 0 ? (metrics.valorTotalGasto / metrics.totalPedidos).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por pedido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos Recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pedidos Recentes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/account/orders">
                <Eye className="mr-2 h-4 w-4" />
                Ver Todos
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.pedidosRecentes.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link to="/produtos">Começar a Comprar</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.pedidosRecentes.map((pedido, index) => (
                <div key={pedido.id}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          Pedido #{pedido.id.slice(0, 8)}
                        </span>
                        <Badge variant={getStatusColor(pedido.status)}>
                          {getStatusLabel(pedido.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(pedido.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        R$ {pedido.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {index < metrics.pedidosRecentes.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" asChild>
              <Link to="/account/orders">Ver Pedidos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/account/wishlist">Lista de Desejos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/account/addresses">Endereços</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/produtos">Continuar Comprando</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCliente;