import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useUserProductionQueue } from '@/hooks/useProductionQueue';
import { 
  Package,
  CheckCircle,
  Clock,
  PlayCircle,
  AlertCircle,
  Calendar,
  Timer,
  User,
  FileText
} from 'lucide-react';
import {
  PRODUCTION_STATUS_LABELS,
  PRIORITY_LABELS,
  ProductionStatus
} from '@/types/production';

const statusIcons = {
  awaiting_production: Clock,
  in_production: PlayCircle,
  quality_check: CheckCircle,
  finished: CheckCircle,
  on_hold: Clock,
  cancelled: AlertCircle,
};

const statusColors = {
  awaiting_production: "secondary",
  in_production: "default", 
  quality_check: "secondary",
  finished: "success",
  on_hold: "warning",
  cancelled: "destructive",
} as const;

const getStatusProgress = (status: ProductionStatus): number => {
  const statusOrder: ProductionStatus[] = [
    'awaiting_production', 
    'in_production', 
    'quality_check', 
    'finished'
  ];
  
  const currentIndex = statusOrder.indexOf(status);
  return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
};

const ProductionQueueCliente = () => {
  const { items, loading, error, refetch } = useUserProductionQueue();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded mb-4"></div>
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
            <p className="text-destructive">Erro ao carregar itens em produção: {error}</p>
            <Button onClick={refetch} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum item em produção</h3>
          <p className="text-muted-foreground">
            Você não possui itens personalizados sendo produzidos no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Itens em Produção</h2>
          <p className="text-muted-foreground">
            Acompanhe o progresso dos seus itens personalizados
          </p>
        </div>
        <Button onClick={refetch} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Production Items */}
      <div className="space-y-4">
        {items.map((item) => {
          const StatusIcon = statusIcons[item.status];
          const progress = getStatusProgress(item.status);
          const isOverdue = item.estimated_completion && 
            new Date(item.estimated_completion) < new Date() &&
            !['finished', 'cancelled'].includes(item.status);

          return (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {item.item_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pedido #{item.order_id.slice(-8)} • {item.product?.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={statusColors[item.status]}
                      className="flex items-center gap-1"
                    >
                      <StatusIcon className="h-3 w-3" />
                      {PRODUCTION_STATUS_LABELS[item.status]}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive">
                        Atrasado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso da Produção</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Iniciado em</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {item.estimated_completion && (
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Previsão de Conclusão</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.estimated_completion).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}

                  {item.estimated_hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Tempo Estimado</p>
                        <p className="text-sm text-muted-foreground">
                          {item.estimated_hours} horas
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customization Details */}
                {item.customization_details && Object.keys(item.customization_details).length > 0 && (
                  <div>
                    <Separator className="my-3" />
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">Detalhes da Personalização</p>
                        <div className="bg-muted rounded-md p-3">
                          <div className="text-xs whitespace-pre-wrap font-mono">
                            {Object.entries(item.customization_details).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-semibold">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Production Notes */}
                {item.production_notes && (
                  <div>
                    <Separator className="my-3" />
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Observações da Produção</p>
                        <p className="text-sm text-muted-foreground">{item.production_notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status History */}
                {item.status_history && item.status_history.length > 1 && (
                  <div>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Histórico de Status</p>
                      <div className="space-y-2">
                        {item.status_history
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 3)
                          .map((history, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <div className={`w-2 h-2 rounded-full ${
                                index === 0 ? 'bg-primary' : 'bg-muted-foreground'
                              }`} />
                              <span className="font-medium">
                                {PRODUCTION_STATUS_LABELS[history.new_status as ProductionStatus] || history.new_status}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(history.created_at).toLocaleDateString('pt-BR')}
                              </span>
                              {history.description && (
                                <span className="text-muted-foreground">
                                  • {history.description}
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Time Tracking */}
                {(item.started_at || item.completed_at || item.actual_hours) && (
                  <div>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {item.started_at && (
                        <div>
                          <p className="font-medium">Produção Iniciada</p>
                          <p className="text-muted-foreground">
                            {new Date(item.started_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                      
                      {item.completed_at && (
                        <div>
                          <p className="font-medium">Concluído em</p>
                          <p className="text-muted-foreground">
                            {new Date(item.completed_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                      
                      {item.actual_hours && (
                        <div>
                          <p className="font-medium">Tempo Real</p>
                          <p className="text-muted-foreground">{item.actual_hours} horas</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Total de {items.length} {items.length === 1 ? 'item' : 'itens'} em produção
            </span>
            <span className="text-muted-foreground">
              Última atualização: {new Date().toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionQueueCliente;