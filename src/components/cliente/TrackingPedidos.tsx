import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { usePedidos } from '@/hooks/usePedidos';
import { 
  Package,
  CheckCircle,
  Clock,
  Truck,
  ShoppingBag,
  AlertCircle,
  Calendar
} from 'lucide-react';

const TrackingPedidos = () => {
  const { pedidos, loading, error, statusLabels, getStatusProgress } = usePedidos();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">Erro ao carregar pedidos: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'quality_check': return <CheckCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'processing': return 'secondary';
      case 'quality_check': return 'outline';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const statusSteps = [
    { key: 'pending', label: 'Pedido Confirmado', icon: Clock },
    { key: 'processing', label: 'Em Produção', icon: Package },
    { key: 'quality_check', label: 'Controle de Qualidade', icon: CheckCircle },
    { key: 'shipped', label: 'Enviado', icon: Truck },
    { key: 'delivered', label: 'Entregue', icon: CheckCircle }
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const stepIndex = statusSteps.findIndex(step => step.key === stepKey);
    const currentIndex = statusSteps.findIndex(step => step.key === currentStatus);
    
    if (currentStatus === 'cancelled') return 'cancelled';
    if (stepIndex <= currentIndex) return 'completed';
    if (stepIndex === currentIndex + 1) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Rastreamento de Pedidos</h2>
        <p className="text-muted-foreground">
          Acompanhe o status de todos os seus pedidos em tempo real
        </p>
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não fez nenhum pedido. Explore nossos produtos e faça seu primeiro pedido!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {getStatusIcon(pedido.status)}
                      <span>Pedido #{pedido.id.slice(0, 8)}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <span>R$ {pedido.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(pedido.status)} className="w-fit">
                    {statusLabels[pedido.status as keyof typeof statusLabels] || pedido.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Barra de Progresso */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso do Pedido</span>
                    <span>{Math.round(getStatusProgress(pedido.status))}%</span>
                  </div>
                  <Progress 
                    value={getStatusProgress(pedido.status)} 
                    className="w-full"
                  />
                </div>

                {/* Timeline dos Status */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Timeline do Pedido</h4>
                  <div className="relative">
                    {statusSteps.map((step, index) => {
                      const stepStatus = getStepStatus(step.key, pedido.status);
                      const Icon = step.icon;
                      
                      return (
                        <div key={step.key} className="relative flex items-start space-x-3 pb-4">
                          {/* Linha conectora */}
                          {index < statusSteps.length - 1 && (
                            <div 
                              className={`absolute left-4 top-8 w-0.5 h-8 ${
                                stepStatus === 'completed' ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          )}
                          
                          {/* Ícone do status */}
                          <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full border-2 
                            ${stepStatus === 'completed' 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : stepStatus === 'current'
                              ? 'bg-background border-primary text-primary'
                              : stepStatus === 'cancelled'
                              ? 'bg-background border-destructive text-destructive'
                              : 'bg-background border-muted text-muted-foreground'
                            }
                          `}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              stepStatus === 'completed' || stepStatus === 'current' 
                                ? 'text-foreground' 
                                : 'text-muted-foreground'
                            }`}>
                              {step.label}
                            </p>
                            {pedido.status_history?.find(h => h.status === step.key) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(
                                  pedido.status_history.find(h => h.status === step.key)!.timestamp
                                ).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Estimativa de Entrega */}
                {pedido.estimated_delivery && pedido.status !== 'delivered' && pedido.status !== 'cancelled' && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Entrega Estimada</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {new Date(pedido.estimated_delivery).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </>
                )}

                {/* Histórico Detalhado */}
                {pedido.status_history && pedido.status_history.length > 1 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Histórico Detalhado</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {pedido.status_history
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((history, index) => (
                          <div key={index} className="flex justify-between items-start text-xs">
                            <span className="text-muted-foreground">
                              {history.description || statusLabels[history.status as keyof typeof statusLabels] || history.status}
                            </span>
                            <span className="text-muted-foreground whitespace-nowrap ml-2">
                              {new Date(history.timestamp).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackingPedidos;