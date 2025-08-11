import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Package,
  CheckCircle,
  Clock,
  Truck,
  ShoppingBag,
  AlertCircle,
  Calendar,
  X,
  RotateCcw,
  Edit,
  MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Dados simulados para demonstração
const pedidosDemo = [
  {
    id: 'demo-001',
    created_at: '2024-08-10T10:00:00Z',
    total_amount: 129.90,
    status: 'processing',
    estimated_delivery: '2024-08-15T18:00:00Z',
    shipping_address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Jardim Primavera',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    status_history: [
      {
        status: 'pending',
        timestamp: '2024-08-10T10:00:00Z',
        description: 'Pedido confirmado e aguardando processamento'
      },
      {
        status: 'processing',
        timestamp: '2024-08-10T14:30:00Z',
        description: 'Pedido em produção'
      }
    ]
  },
  {
    id: 'demo-002',
    created_at: '2024-08-08T15:30:00Z',
    total_amount: 89.50,
    status: 'shipped',
    estimated_delivery: '2024-08-12T18:00:00Z',
    shipping_address: {
      street: 'Avenida Central',
      number: '456',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000'
    },
    status_history: [
      {
        status: 'pending',
        timestamp: '2024-08-08T15:30:00Z',
        description: 'Pedido confirmado e aguardando processamento'
      },
      {
        status: 'processing',
        timestamp: '2024-08-08T16:00:00Z',
        description: 'Pedido em produção'
      },
      {
        status: 'quality_check',
        timestamp: '2024-08-09T09:00:00Z',
        description: 'Produto em controle de qualidade'
      },
      {
        status: 'shipped',
        timestamp: '2024-08-09T16:00:00Z',
        description: 'Pedido enviado para entrega'
      }
    ]
  },
  {
    id: 'demo-003',
    created_at: '2024-08-05T11:15:00Z',
    total_amount: 199.90,
    status: 'delivered',
    shipping_address: {
      street: 'Rua do Comércio',
      number: '789',
      neighborhood: 'Vila Nova',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '02000-000'
    },
    status_history: [
      {
        status: 'pending',
        timestamp: '2024-08-05T11:15:00Z',
        description: 'Pedido confirmado e aguardando processamento'
      },
      {
        status: 'processing',
        timestamp: '2024-08-05T12:00:00Z',
        description: 'Pedido em produção'
      },
      {
        status: 'quality_check',
        timestamp: '2024-08-06T10:00:00Z',
        description: 'Produto em controle de qualidade'
      },
      {
        status: 'shipped',
        timestamp: '2024-08-06T16:00:00Z',
        description: 'Pedido enviado para entrega'
      },
      {
        status: 'delivered',
        timestamp: '2024-08-08T14:30:00Z',
        description: 'Pedido entregue'
      }
    ]
  }
];

const TrackingPedidosDemo = () => {
  const [pedidos, setPedidos] = useState(pedidosDemo);
  const [cancelarDialogOpen, setCancelarDialogOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleCancelarPedido = async () => {
    if (!pedidoSelecionado) return;
    
    try {
      setActionLoading(true);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar status para cancelado
      setPedidos(prev => prev.map(pedido => 
        pedido.id === pedidoSelecionado 
          ? { 
              ...pedido, 
              status: 'cancelled',
              status_history: [
                ...pedido.status_history,
                {
                  status: 'cancelled',
                  timestamp: new Date().toISOString(),
                  description: 'Pedido cancelado pelo cliente'
                }
              ]
            }
          : pedido
      ));
      
      toast.success('Pedido cancelado com sucesso');
      setCancelarDialogOpen(false);
      setPedidoSelecionado(null);
    } catch (error) {
      toast.error('Erro ao cancelar pedido');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReordenarPedido = async (pedidoId: string) => {
    try {
      setActionLoading(true);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Criar novo pedido baseado no anterior
      const pedidoOriginal = pedidos.find(p => p.id === pedidoId);
      if (pedidoOriginal) {
        const novoPedido = {
          ...pedidoOriginal,
          id: 'demo-new-' + Date.now(),
          created_at: new Date().toISOString(),
          status: 'pending',
          estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status_history: [
            {
              status: 'pending',
              timestamp: new Date().toISOString(),
              description: 'Pedido confirmado e aguardando processamento (Reordenado)'
            }
          ]
        };
        
        setPedidos(prev => [novoPedido, ...prev]);
      }
      
      toast.success('Novo pedido criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao reordenar pedido');
    } finally {
      setActionLoading(false);
    }
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'processing'].includes(status);
  };

  const canEditOrder = (status: string) => {
    return ['pending', 'processing'].includes(status);
  };

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">🎯 Demo - Área do Cliente</h1>
        <p className="text-muted-foreground">
          Demonstração das funcionalidades implementadas (dados simulados)
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rastreamento de Pedidos</h2>
          <p className="text-muted-foreground">
            Acompanhe o status de todos os seus pedidos em tempo real
          </p>
        </div>

        <div className="space-y-6">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {getStatusIcon(pedido.status)}
                      <span>Pedido #{pedido.id}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <span>R$ {pedido.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(pedido.status)} className="w-fit">
                      {statusLabels[pedido.status as keyof typeof statusLabels] || pedido.status}
                    </Badge>
                    
                    {/* Menu de ações */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleReordenarPedido(pedido.id)}
                          disabled={actionLoading}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reordenar
                        </DropdownMenuItem>
                        
                        {canEditOrder(pedido.status) && (
                          <DropdownMenuItem 
                            onClick={() => toast.info('Modal de editar endereço foi implementado!')}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Endereço
                          </DropdownMenuItem>
                        )}
                        
                        {canCancelOrder(pedido.status) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setPedidoSelecionado(pedido.id);
                              setCancelarDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar Pedido
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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

                {/* Endereço de Entrega */}
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Endereço de Entrega</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>{pedido.shipping_address.street}, {pedido.shipping_address.number}</p>
                    {pedido.shipping_address.complement && <p>{pedido.shipping_address.complement}</p>}
                    <p>{pedido.shipping_address.neighborhood}</p>
                    <p>{pedido.shipping_address.city}, {pedido.shipping_address.state} - {pedido.shipping_address.zipCode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de confirmação para cancelar pedido */}
      <Dialog open={cancelarDialogOpen} onOpenChange={setCancelarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCancelarDialogOpen(false)}
              disabled={actionLoading}
            >
              Manter Pedido
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelarPedido}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackingPedidosDemo;