import { useState, useEffect, useCallback } from "react";
import { Search, Package, AlertTriangle, TrendingUp, TrendingDown, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  created_at: string;
  products?: {
    name: string;
  };
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [stockData, setStockData] = useState({
    movement_type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Carregar produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Simular movimentações de estoque (em produção, você teria uma tabela stock_movements)
      const mockMovements: StockMovement[] = [
        {
          id: '1',
          product_id: productsData?.[0]?.id || '',
          movement_type: 'in',
          quantity: 50,
          reason: 'Reposição de estoque',
          created_at: new Date().toISOString(),
          products: { name: productsData?.[0]?.name || '' }
        },
        {
          id: '2',
          product_id: productsData?.[1]?.id || '',
          movement_type: 'out',
          quantity: 5,
          reason: 'Venda',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          products: { name: productsData?.[1]?.name || '' }
        }
      ];
      setMovements(mockMovements);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStockMovement = async () => {
    try {
      if (!selectedProduct || stockData.quantity <= 0) {
        toast.error('Por favor, preencha todos os campos');
        return;
      }

      let newStock = selectedProduct.stock || 0;
      
      switch (stockData.movement_type) {
        case 'in':
          newStock += stockData.quantity;
          break;
        case 'out':
          newStock = Math.max(0, newStock - stockData.quantity);
          break;
        case 'adjustment':
          newStock = stockData.quantity;
          break;
      }

      // Atualizar estoque do produto
      const { error } = await supabase
        .from('products')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      // Em produção, você registraria a movimentação na tabela stock_movements
      const newMovement: StockMovement = {
        id: Date.now().toString(),
        product_id: selectedProduct.id,
        movement_type: stockData.movement_type,
        quantity: stockData.quantity,
        reason: stockData.reason,
        created_at: new Date().toISOString(),
        products: { name: selectedProduct.name }
      };

      setMovements(prev => [newMovement, ...prev]);

      toast.success('Movimentação de estoque registrada com sucesso');
      setIsStockDialogOpen(false);
      resetStockForm();
      loadData();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast.error('Erro ao registrar movimentação');
    }
  };

  const resetStockForm = () => {
    setStockData({
      movement_type: 'in',
      quantity: 0,
      reason: ''
    });
    setSelectedProduct(null);
  };

  const openStockDialog = (product: Product) => {
    setSelectedProduct(product);
    resetStockForm();
    setIsStockDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStock = true;
    const stock = product.stock || 0;
    
    switch (stockFilter) {
      case 'low':
        matchesStock = stock > 0 && stock < 10;
        break;
      case 'out':
        matchesStock = stock === 0;
        break;
      case 'available':
        matchesStock = stock >= 10;
        break;
      case 'all':
      default:
        matchesStock = true;
    }
    
    return matchesSearch && matchesStock;
  });

  const getStockStatus = (stock: number | null) => {
    if (!stock || stock === 0) {
      return { 
        label: "Esgotado", 
        variant: "destructive" as const, 
        icon: AlertTriangle,
        color: "text-red-500"
      };
    }
    if (stock < 10) {
      return { 
        label: "Baixo", 
        variant: "secondary" as const, 
        icon: TrendingDown,
        color: "text-orange-500"
      };
    }
    return { 
      label: "Disponível", 
      variant: "default" as const, 
      icon: TrendingUp,
      color: "text-green-500"
    };
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'adjustment':
        return <Package className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Entrada';
      case 'out': return 'Saída';
      case 'adjustment': return 'Ajuste';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular estatísticas
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 10).length;
  const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + ((p.stock || 0) * p.price), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando inventário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
          <p className="text-muted-foreground">Controle seu inventário e movimentações</p>
        </div>
      </div>

      {/* Métricas do estoque */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold text-orange-500">{lowStockCount}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Esgotados</p>
                <p className="text-2xl font-bold text-red-500">{outOfStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor do Estoque</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(totalStockValue)}
                </p>
              </div>
              <Warehouse className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status do estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  <SelectItem value="available">Estoque normal</SelectItem>
                  <SelectItem value="low">Estoque baixo</SelectItem>
                  <SelectItem value="out">Esgotados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid com produtos e movimentações */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lista de produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos ({filteredProducts.length})
            </CardTitle>
            <CardDescription>
              Status de estoque dos produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.stock);
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.image_url || '/placeholder.svg'} 
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(product.price)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{product.stock || 0}</div>
                          <div className="text-sm text-muted-foreground">unidades</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${status.color}`} />
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStockDialog(product)}
                        >
                          Movimentar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">Nenhum produto encontrado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tente ajustar os filtros de busca.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Movimentações recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Movimentações Recentes
            </CardTitle>
            <CardDescription>
              Últimas movimentações de estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {movements.length > 0 ? (
                movements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getMovementIcon(movement.movement_type)}
                      <div>
                        <div className="font-medium">{movement.products?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {movement.reason}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getMovementTypeLabel(movement.movement_type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(movement.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Nenhuma movimentação</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    As movimentações de estoque aparecerão aqui.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Movimentação de Estoque */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar Estoque</DialogTitle>
            <DialogDescription>
              Registre uma movimentação de estoque para "{selectedProduct?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label>Estoque Atual</Label>
              <div className="text-2xl font-bold">{selectedProduct?.stock || 0} unidades</div>
            </div>

            <div>
              <Label htmlFor="movement_type">Tipo de Movimentação</Label>
              <Select 
                value={stockData.movement_type} 
                onValueChange={(value: 'in' | 'out' | 'adjustment') => 
                  setStockData(prev => ({ ...prev, movement_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada (adicionar estoque)</SelectItem>
                  <SelectItem value="out">Saída (remover estoque)</SelectItem>
                  <SelectItem value="adjustment">Ajuste (definir quantidade exata)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">
                {stockData.movement_type === 'adjustment' ? 'Nova Quantidade' : 'Quantidade'}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={stockData.quantity}
                onChange={(e) => setStockData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                value={stockData.reason}
                onChange={(e) => setStockData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ex: Reposição, Venda, Correção de inventário..."
              />
            </div>

            {stockData.movement_type !== 'adjustment' && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium">Novo estoque será:</div>
                <div className="text-lg font-bold">
                  {stockData.movement_type === 'in' 
                    ? (selectedProduct?.stock || 0) + stockData.quantity
                    : Math.max(0, (selectedProduct?.stock || 0) - stockData.quantity)
                  } unidades
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStockMovement}>
              Registrar Movimentação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}