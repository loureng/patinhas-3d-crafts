import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Copy, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Coupon = Tables<"coupons">;

interface CouponFormData {
  code: string;
  description: string;
  discount_type: string;
  value: number;
  usage_limit: number | null;
  expires_at: string;
  active: boolean;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    description: "",
    discount_type: "percentage",
    value: 0,
    usage_limit: null,
    expires_at: "",
    active: true
  });

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();

    // Real-time subscription para mudanças nos cupons
    const subscription = supabase
      .channel('coupons-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'coupons' }, 
        (payload) => {
          console.log('Cupom atualizado em tempo real:', payload);
          loadCoupons(); // Recarregar dados quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadCoupons]);

  const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleSaveCoupon = async () => {
    try {
      if (!formData.code || !formData.discount_type || formData.value <= 0) {
        toast.error('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      // Validar valor do desconto
      if (formData.discount_type === 'percentage' && formData.value > 100) {
        toast.error('Desconto percentual não pode ser maior que 100%');
        return;
      }

      if (selectedCoupon) {
        // Editar cupom existente
        const { error } = await supabase
          .from('coupons')
          .update({
            code: formData.code,
            description: formData.description,
            discount_type: formData.discount_type,
            value: formData.value,
            usage_limit: formData.usage_limit,
            expires_at: formData.expires_at || null,
            active: formData.active
          })
          .eq('id', selectedCoupon.id);

        if (error) throw error;
        toast.success('Cupom atualizado com sucesso');
      } else {
        // Criar novo cupom
        const { error } = await supabase
          .from('coupons')
          .insert([{
            code: formData.code,
            description: formData.description,
            discount_type: formData.discount_type,
            value: formData.value,
            usage_limit: formData.usage_limit,
            expires_at: formData.expires_at || null,
            active: formData.active,
            used_count: 0
          }]);

        if (error) throw error;
        toast.success('Cupom criado com sucesso');
      }

      setIsEditDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      toast.error('Erro ao salvar cupom');
    }
  };

  const handleDeleteCoupon = async () => {
    try {
      if (!selectedCoupon) return;

      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', selectedCoupon.id);

      if (error) throw error;

      toast.success('Cupom excluído com sucesso');
      setIsDeleteDialogOpen(false);
      setSelectedCoupon(null);
      loadCoupons();
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      toast.error('Erro ao excluir cupom');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ active: !coupon.active })
        .eq('id', coupon.id);

      if (error) throw error;

      toast.success(`Cupom ${!coupon.active ? 'ativado' : 'desativado'} com sucesso`);
      loadCoupons();
    } catch (error) {
      console.error('Erro ao alterar status do cupom:', error);
      toast.error('Erro ao alterar status do cupom');
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      value: 0,
      usage_limit: null,
      expires_at: "",
      active: true
    });
    setSelectedCoupon(null);
  };

  const openEditDialog = (coupon?: Coupon) => {
    if (coupon) {
      setSelectedCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || "",
        discount_type: coupon.discount_type,
        value: coupon.value,
        usage_limit: coupon.usage_limit,
        expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : "",
        active: coupon.active
      });
    } else {
      resetForm();
      setFormData(prev => ({ ...prev, code: generateCouponCode() }));
    }
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteDialogOpen(true);
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado para a área de transferência');
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = 
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActive = 
      filterActive === "all" || 
      (filterActive === "active" && coupon.active) ||
      (filterActive === "inactive" && !coupon.active);
    
    return matchesSearch && matchesActive;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDiscountDisplay = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    } else {
      return formatCurrency(value);
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;
    
    if (!coupon.active) {
      return { label: "Inativo", variant: "secondary" as const };
    }
    
    if (expiresAt && expiresAt < now) {
      return { label: "Expirado", variant: "destructive" as const };
    }
    
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { label: "Esgotado", variant: "destructive" as const };
    }
    
    return { label: "Ativo", variant: "default" as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando cupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground">Gerencie cupons e promoções</p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cupom
        </Button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{coupons.length}</p>
              <p className="text-sm text-muted-foreground">Total de Cupons</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {coupons.filter(c => c.active).length}
              </p>
              <p className="text-sm text-muted-foreground">Cupons Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {coupons.reduce((sum, c) => sum + c.used_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total de Usos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {coupons.filter(c => {
                  const expiresAt = c.expires_at ? new Date(c.expires_at) : null;
                  return expiresAt && expiresAt < new Date();
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Cupons Expirados</p>
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
                  placeholder="Buscar por código ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status do cupom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Apenas ativos</SelectItem>
                  <SelectItem value="inactive">Apenas inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de cupons */}
      <Card>
        <CardHeader>
          <CardTitle>Cupons Cadastrados</CardTitle>
          <CardDescription>
            {filteredCoupons.length} cupom(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">
                          {coupon.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCouponCode(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {coupon.description || 'Sem descrição'}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {coupon.discount_type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {getDiscountDisplay(coupon.discount_type, coupon.value)}
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-semibold">{coupon.used_count}</div>
                        {coupon.usage_limit && (
                          <div className="text-xs text-muted-foreground">
                            / {coupon.usage_limit}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.expires_at ? (
                        formatDate(coupon.expires_at)
                      ) : (
                        <span className="text-muted-foreground">Sem expiração</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(coupon)}
                        >
                          {coupon.active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(coupon)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(coupon)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredCoupons.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="text-lg font-semibold">Nenhum cupom encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterActive !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Comece criando seu primeiro cupom de desconto."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCoupon ? 'Editar Cupom' : 'Novo Cupom'}
            </DialogTitle>
            <DialogDescription>
              Configure os parâmetros do cupom de desconto.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Código do Cupom*</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="CUPOM123"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData(prev => ({ ...prev, code: generateCouponCode() }))}
                  >
                    Gerar
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="discount_type">Tipo de Desconto*</Label>
                <Select 
                  value={formData.discount_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, discount_type: value, value: 0 }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do cupom (opcional)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">
                  Valor do Desconto* {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '50.00'}
                />
              </div>
              <div>
                <Label htmlFor="usage_limit">Limite de Usos</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min="1"
                  value={formData.usage_limit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expires_at">Data de Expiração</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="active">Cupom ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCoupon}>
              {selectedCoupon ? 'Atualizar' : 'Criar'} Cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cupom "{selectedCoupon?.code}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCoupon}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}