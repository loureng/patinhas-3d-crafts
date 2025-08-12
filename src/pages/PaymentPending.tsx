import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Package, AlertCircle, RefreshCw, Phone } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: any;
}

const PaymentPending = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Get payment info from URL params
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!user || !externalReference) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', externalReference)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [user, externalReference]);

  const checkPaymentStatus = async () => {
    if (!order || !paymentId) return;

    setCheckingStatus(true);
    
    try {
      // In a real implementation, you would call your backend to check payment status
      // For now, we'll just reload the order data
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .single();

      if (error) throw error;
      
      setOrder(data);
      
      if (data.status === 'approved') {
        navigate(`/payment/success?payment_id=${paymentId}&status=approved&external_reference=${order.id}`);
      } else if (data.status === 'rejected') {
        navigate(`/payment/failure?payment_id=${paymentId}&status=rejected&external_reference=${order.id}`);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setCheckingStatus(false);
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

  const getPaymentMethodInstructions = () => {
    // Based on Mercado Pago payment methods
    if (status === 'pending') {
      return {
        title: 'Aguardando Confirmação do Pagamento',
        description: 'Seu pagamento está sendo processado. Isso pode levar alguns minutos.',
        instructions: [
          'PIX: Geralmente é confirmado em até 2 horas',
          'Boleto Bancário: Pode levar até 3 dias úteis para compensar',
          'Cartão de Crédito: Aguardando autorização do banco emissor',
        ]
      };
    }
    
    return {
      title: 'Pagamento em Análise',
      description: 'Estamos verificando as informações do seu pagamento.',
      instructions: [
        'Verifique se os dados do cartão estão corretos',
        'Confirme se há limite disponível em sua conta',
        'Entre em contato com seu banco se necessário',
      ]
    };
  };

  const paymentInfo = getPaymentMethodInstructions();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Verificando status do pagamento...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Pending Header */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl text-yellow-800">
                {paymentInfo.title}
              </CardTitle>
              <p className="text-yellow-700">
                {paymentInfo.description}
              </p>
            </CardHeader>
          </Card>

          {/* Order Details */}
          {order && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detalhes do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Número do Pedido</p>
                    <p className="font-semibold">#{order.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Pedido</p>
                    <p className="font-semibold">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-semibold text-lg">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendente
                    </span>
                  </div>
                </div>

                {paymentId && (
                  <div>
                    <p className="text-sm text-muted-foreground">ID do Pagamento</p>
                    <p className="font-mono text-sm">{paymentId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Instruções de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentInfo.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-semibold text-yellow-600">{index + 1}</span>
                    </div>
                    <p className="text-sm">{instruction}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={checkPaymentStatus}
              disabled={checkingStatus}
              className="w-full"
              size="lg"
            >
              {checkingStatus ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando Status...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Status do Pagamento
                </>
              )}
            </Button>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate('/account/orders')}
                variant="outline"
                className="flex-1"
              >
                <Package className="h-4 w-4 mr-2" />
                Ver Meus Pedidos
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1"
              >
                Voltar à Loja
              </Button>
            </div>
          </div>

          {/* Help Section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Precisa de Ajuda com seu Pagamento?
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Nossa equipe está disponível para esclarecer dúvidas sobre seu pagamento
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" size="sm">
                    Chat Online
                  </Button>
                  <Button variant="outline" size="sm">
                    Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-refresh notice */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  💡 Esta página será atualizada automaticamente assim que seu pagamento for confirmado
                </p>
                <p className="mt-1">
                  Você também receberá um email de confirmação quando o pagamento for processado
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentPending;