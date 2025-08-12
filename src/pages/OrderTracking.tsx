import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Search, Package, CheckCircle, Clock, Truck, AlertCircle, Calendar, Mail } from 'lucide-react';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  shipping_address: any;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    products: {
      name: string;
      image_url: string | null;
    } | null;
  }>;
}

const OrderTracking = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const statusLabels = {
    pending: 'Pendente',
    approved: 'Aprovado',
    processing: 'Em Produção',
    quality_check: 'Controle de Qualidade',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    rejected: 'Rejeitado'
  };

  const statusSteps = [
    { key: 'pending', label: 'Pedido Confirmado', icon: Clock },
    { key: 'approved', label: 'Pagamento Aprovado', icon: CheckCircle },
    { key: 'processing', label: 'Em Produção', icon: Package },
    { key: 'shipped', label: 'Enviado', icon: Truck },
    { key: 'delivered', label: 'Entregue', icon: CheckCircle }
  ];

  const getStatusProgress = (status: string) => {
    const statusOrder = ['pending', 'approved', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const stepIndex = statusSteps.findIndex(step => step.key === stepKey);
    const currentIndex = statusSteps.findIndex(step => step.key === currentStatus);
    
    if (currentStatus === 'cancelled' || currentStatus === 'rejected') return 'cancelled';
    if (stepIndex <= currentIndex) return 'completed';
    if (stepIndex === currentIndex + 1) return 'current';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': 
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'approved': return 'default';
      case 'processing': return 'secondary';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled':
      case 'rejected': return 'destructive';
      default: return 'default';
    }
  };

  const handleSearch = async () => {
    if (!orderId.trim() || !email.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o ID do pedido e o email.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Search for order by ID and email
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
        .eq('id', orderId.trim())
        .single();

      if (error) throw error;

      // Verify email matches
      const orderEmail = data.shipping_address?.email?.toLowerCase();
      const searchEmail = email.trim().toLowerCase();
      
      if (orderEmail !== searchEmail) {
        setOrder(null);
        toast({
          title: "Pedido não encontrado",
          description: "Verifique o ID do pedido e o email informados.",
          variant: "destructive"
        });
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error searching order:', error);
      setOrder(null);
      toast({
        title: "Pedido não encontrado",
        description: "Verifique o ID do pedido e o email informados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Rastreamento de Pedido</h1>
            <p className="text-muted-foreground">
              Acompanhe o status do seu pedido em tempo real
            </p>
          </div>

          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    ID do Pedido
                  </label>
                  <Input
                    placeholder="Ex: 12345678-abcd-..."
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Email do Pedido
                  </label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? 'Buscando...' : 'Buscar Pedido'}
              </Button>
            </CardContent>
          </Card>

          {/* Order Results */}
          {searched && !loading && !order && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  Pedido não encontrado
                </h3>
                <p className="text-orange-700">
                  Verifique se o ID do pedido e o email estão corretos.
                  Se você acabou de fazer o pedido, aguarde alguns minutos e tente novamente.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              {/* Order Header */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span>Pedido #{order.id.slice(0, 8)}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(order.created_at)}
                        </div>
                        <span>{formatCurrency(order.total_amount)}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(order.status)} className="w-fit">
                      {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso do Pedido</span>
                      <span>{Math.round(getStatusProgress(order.status))}%</span>
                    </div>
                    <Progress 
                      value={getStatusProgress(order.status)} 
                      className="w-full"
                    />
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Timeline do Pedido</h4>
                    <div className="relative">
                      {statusSteps.map((step, index) => {
                        const stepStatus = getStepStatus(step.key, order.status);
                        const Icon = step.icon;
                        
                        return (
                          <div key={step.key} className="relative flex items-start space-x-3 pb-4">
                            {/* Connector Line */}
                            {index < statusSteps.length - 1 && (
                              <div 
                                className={`absolute left-4 top-8 w-0.5 h-8 ${
                                  stepStatus === 'completed' ? 'bg-primary' : 'bg-muted'
                                }`}
                              />
                            )}
                            
                            {/* Status Icon */}
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
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${
                                stepStatus === 'completed' || stepStatus === 'current' 
                                  ? 'text-foreground' 
                                  : 'text-muted-foreground'
                              }`}>
                                {step.label}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <img 
                          src={item.products?.image_url || '/placeholder.svg'} 
                          alt={item.products?.name || 'Produto'}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {item.products?.name || 'Produto não encontrado'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Quantidade: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.price)} cada
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center pt-4">
                      <span className="text-lg font-semibold">Total do Pedido:</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help Section */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-blue-800 mb-2">
                      Precisa de Ajuda?
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Entre em contato conosco se tiver dúvidas sobre seu pedido
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm">
                        WhatsApp
                      </Button>
                      <Button variant="outline" size="sm">
                        Chat Online
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;