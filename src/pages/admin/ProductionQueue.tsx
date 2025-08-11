import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Clock, PlayCircle, CheckCircle, XCircle, PauseCircle, Search, Filter, MoreVertical, User, Calendar, Target } from "lucide-react";
import { toast } from "sonner";
import { useProductionQueue } from "@/hooks/useProductionQueue";
import { 
  ProductionStatus, 
  ProductionPriority, 
  UpdateProductionStatusData,
  ProductionQueueFilters,
  PRODUCTION_STATUS_LABELS,
  PRIORITY_LABELS 
} from "@/types/production";

const statusIcons = {
  awaiting_production: Clock,
  in_production: PlayCircle,
  quality_check: CheckCircle,
  finished: CheckCircle,
  on_hold: PauseCircle,
  cancelled: XCircle,
};

const statusColors = {
  awaiting_production: "secondary",
  in_production: "default",
  quality_check: "secondary",
  finished: "success",
  on_hold: "warning",
  cancelled: "destructive",
} as const;

const priorityColors = {
  1: "destructive", // Urgente
  2: "warning",     // Alta  
  3: "default",     // Normal
  4: "secondary",   // Baixa
  5: "outline",     // Muito Baixa
} as const;

export default function ProductionQueueAdmin() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ProductionQueueFilters>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [updateData, setUpdateData] = useState<UpdateProductionStatusData>({
    status: 'awaiting_production'
  });

  const { items, stats, loading, error, total, refetch, updateStatus, bulkAssign } = useProductionQueue(
    page,
    20,
    filters
  );

  const handleStatusUpdate = async () => {
    if (!selectedItem) return;

    try {
      await updateStatus(selectedItem, updateData);
      toast.success('Status atualizado com sucesso!');
      setUpdateDialogOpen(false);
      setSelectedItem(null);
      setUpdateData({ status: 'awaiting_production' });
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleBulkAssign = async (assignedTo: string) => {
    if (selectedItems.length === 0) return;

    try {
      await bulkAssign(selectedItems, assignedTo);
      toast.success('Itens atribuídos com sucesso!');
      setSelectedItems([]);
    } catch (error) {
      toast.error('Erro ao atribuir itens');
    }
  };

  const filteredStats = useMemo(() => {
    if (!stats) return null;
    
    return {
      ...stats,
      overdue_percentage: stats.total > 0 ? (stats.overdue / stats.total) * 100 : 0
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">Erro ao carregar fila de produção: {error}</p>
            <Button onClick={refetch} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fila de Produção</h1>
          <p className="text-muted-foreground">
            Gerencie itens personalizados em produção
          </p>
        </div>
        <Button onClick={refetch} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {filteredStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total na Fila</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Produção</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.in_production}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.awaiting_production}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{filteredStats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                {filteredStats.overdue_percentage.toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar Item</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do item..."
                  value={filters.item_name || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, item_name: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  status: value === 'all' ? undefined : value as ProductionStatus
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {Object.entries(PRODUCTION_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={filters.priority?.toString() || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  priority: value === 'all' ? undefined : parseInt(value) as ProductionPriority
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => setFilters({})} 
                variant="outline"
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Queue Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Itens na Fila</CardTitle>
            <div className="flex gap-2">
              {selectedItems.length > 0 && (
                <Select onValueChange={handleBulkAssign}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Atribuir selecionados..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user1">João Silva</SelectItem>
                    <SelectItem value="user2">Maria Santos</SelectItem>
                    <SelectItem value="user3">Pedro Costa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <CardDescription>
            {total} itens encontrados
            {selectedItems.length > 0 && ` • ${selectedItems.length} selecionados`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input 
                    type="checkbox"
                    checked={selectedItems.length === items.length && items.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(items.map(item => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Tempo Est.</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const StatusIcon = statusIcons[item.status];
                const isOverdue = item.estimated_completion && 
                  new Date(item.estimated_completion) < new Date() &&
                  !['finished', 'cancelled'].includes(item.status);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input 
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(prev => [...prev, item.id]);
                          } else {
                            setSelectedItems(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.item_name}</div>
                        <div className="text-sm text-muted-foreground">
                          #{item.order_id.slice(-8)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          {item.customer
                            ? item.customer.display_name || item.customer.email || 'Cliente'
                            : <span className="italic text-muted-foreground">Cliente não disponível</span>
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={statusColors[item.status]}
                        className="flex items-center gap-1 w-fit"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {PRODUCTION_STATUS_LABELS[item.status]}
                      </Badge>
                      {isOverdue && (
                        <Badge variant="destructive" className="ml-2">
                          Atrasado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityColors[item.priority]}>
                        {PRIORITY_LABELS[item.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {item.estimated_hours ? `${item.estimated_hours}h` : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog 
                        open={updateDialogOpen && selectedItem === item.id}
                        onOpenChange={(open) => {
                          setUpdateDialogOpen(open);
                          if (open) {
                            setSelectedItem(item.id);
                            setUpdateData({
                              status: item.status,
                              priority: item.priority,
                              estimated_completion: item.estimated_completion || '',
                              assigned_to: item.assigned_to || ''
                            });
                          } else {
                            setSelectedItem(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Atualizar Item de Produção</DialogTitle>
                            <DialogDescription>
                              {item.item_name} - Pedido #{item.order_id.slice(-8)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="status">Status</Label>
                              <Select
                                value={updateData.status}
                                onValueChange={(value) => setUpdateData(prev => ({ 
                                  ...prev, 
                                  status: value as ProductionStatus 
                                }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(PRODUCTION_STATUS_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="priority">Prioridade</Label>
                              <Select
                                value={updateData.priority?.toString()}
                                onValueChange={(value) => setUpdateData(prev => ({ 
                                  ...prev, 
                                  priority: parseInt(value) as ProductionPriority 
                                }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="hours">Horas Trabalhadas</Label>
                              <Input
                                type="number"
                                step="0.5"
                                placeholder="Ex: 2.5"
                                value={updateData.hours_worked || ''}
                                onChange={(e) => setUpdateData(prev => ({ 
                                  ...prev, 
                                  hours_worked: parseFloat(e.target.value) || undefined
                                }))}
                              />
                            </div>

                            <div>
                              <Label htmlFor="notes">Observações</Label>
                              <Textarea
                                placeholder="Adicione observações sobre o progresso..."
                                value={updateData.notes || ''}
                                onChange={(e) => setUpdateData(prev => ({ 
                                  ...prev, 
                                  notes: e.target.value 
                                }))}
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setUpdateDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button onClick={handleStatusUpdate}>
                                Atualizar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum item encontrado na fila de produção.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}