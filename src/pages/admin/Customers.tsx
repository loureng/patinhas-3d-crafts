import { useState, useEffect, useCallback } from "react";
import { Search, Eye, Users, Mail, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface CustomerWithStats extends Profile {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar todos os perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar estatísticas de pedidos para cada cliente
      const customersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .eq('user_id', profile.user_id);

          const totalOrders = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
          const lastOrderDate = orders?.length ? 
            orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at :
            null;

          return {
            ...profile,
            totalOrders,
            totalSpent,
            lastOrderDate
          };
        })
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const loadCustomerOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos do cliente:', error);
      toast.error('Erro ao carregar pedidos do cliente');
    }
  };

  const openDetailsDialog = async (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(true);
    await loadCustomerOrders(customer.user_id);
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.display_name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.user_id.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCustomerSegment = (totalSpent: number, totalOrders: number) => {
    if (totalSpent > 1000 || totalOrders > 10) {
      return { label: "VIP", variant: "default" as const };
    } else if (totalSpent > 500 || totalOrders > 5) {
      return { label: "Premium", variant: "secondary" as const };
    } else if (totalOrders > 0) {
      return { label: "Regular", variant: "outline" as const };
    } else {
      return { label: "Novo", variant: "destructive" as const };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.totalOrders > 0).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes VIP</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.totalSpent > 1000 || c.totalOrders > 10).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    customers.reduce((sum, c) => sum + c.totalSpent, 0) /
                    Math.max(customers.filter(c => c.totalOrders > 0).length, 1)
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {filteredCustomers.length} Cliente(s)
          </CardTitle>
          <CardDescription>
            Lista completa de clientes cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Total Gasto</TableHead>
                <TableHead>Último Pedido</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const segment = getCustomerSegment(customer.totalSpent, customer.totalOrders);
                return (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={customer.avatar_url || undefined} />
                          <AvatarFallback>
                            {customer.display_name?.charAt(0)?.toUpperCase() || 
                             customer.email?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {customer.display_name || 'Nome não informado'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {customer.user_id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-semibold">{customer.totalOrders}</div>
                        <div className="text-sm text-muted-foreground">pedidos</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell>
                      {customer.lastOrderDate ? (
                        <div className="text-center">
                          <div>{formatDate(customer.lastOrderDate)}</div>
                          <div className="text-sm text-muted-foreground">
                            {Math.floor((new Date().getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))} dias atrás
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={segment.variant}>
                        {segment.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetailsDialog(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum cliente encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm
                  ? "Tente ajustar os filtros de busca."
                  : "Ainda não há clientes cadastrados."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Cliente */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Cliente
            </DialogTitle>
            <DialogDescription>
              Informações completas e histórico de pedidos
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Informações pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={selectedCustomer.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {selectedCustomer.display_name?.charAt(0)?.toUpperCase() || 
                         selectedCustomer.email?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Nome
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.display_name || 'Nome não informado'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.email}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Cliente desde
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedCustomer.created_at)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">Segmento</h4>
                        <div className="mt-1">
                          <Badge variant={getCustomerSegment(selectedCustomer.totalSpent, selectedCustomer.totalOrders).variant}>
                            {getCustomerSegment(selectedCustomer.totalSpent, selectedCustomer.totalOrders).label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold">{selectedCustomer.totalOrders}</div>
                    <p className="text-sm text-muted-foreground">Pedidos Realizados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(selectedCustomer.totalSpent)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Gasto</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold">
                      {selectedCustomer.totalOrders > 0 
                        ? formatCurrency(selectedCustomer.totalSpent / selectedCustomer.totalOrders)
                        : formatCurrency(0)
                      }
                    </div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  </CardContent>
                </Card>
              </div>

              {/* Histórico de pedidos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico de Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                  {customerOrders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID do Pedido</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Itens</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">
                              #{order.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>{formatDate(order.created_at)}</TableCell>
                            <TableCell>{order.order_items.length} item(s)</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(order.total_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={order.status === 'delivered' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">
                        Este cliente ainda não realizou nenhum pedido.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}