import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Package, AlertTriangle, RotateCcw, CreditCard, HelpCircle } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: any;
}

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { restoreCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Get payment info from URL params
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  const statusDetail = searchParams.get('status_detail');

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

  const getFailureReason = () => {
    // Map common Mercado Pago status_detail codes to user-friendly messages
    const statusMessages: Record<string, { title: string; description: string; solutions: string[] }> = {
      'cc_rejected_insufficient_amount': {
        title: 'Limite do cartão insuficiente',
        description: 'O valor da compra excede o limite disponível no seu cartão.',
        solutions: [
          'Verifique o limite disponível com seu banco',
          'Tente um cartão diferente',
          'Divida a compra em mais parcelas',
          'Use outro método de pagamento como PIX'
        ]
      },
      'cc_rejected_bad_filled_card_number': {
        title: 'Número do cartão inválido',
        description: 'O número do cartão informado está incorreto.',
        solutions: [
          'Verifique se digitou o número corretamente',
          'Confirme se o cartão não está vencido',
          'Tente novamente prestando atenção aos dígitos'
        ]
      },
      'cc_rejected_bad_filled_date': {
        title: 'Data de validade inválida',
        description: 'A data de validade do cartão está incorreta.',
        solutions: [
          'Verifique a data de validade do seu cartão',
          'Confirme se o cartão não está vencido',
          'Digite a data no formato correto (MM/AA)'
        ]
      },
      'cc_rejected_bad_filled_security_code': {
        title: 'Código de segurança inválido',
        description: 'O código CVV do cartão está incorreto.',
        solutions: [
          'Verifique o código de 3 dígitos no verso do cartão',
          'Para cartões American Express, são 4 dígitos na frente',
          'Digite apenas os números, sem espaços'
        ]
      },
      'cc_rejected_call_for_authorize': {
        title: 'Autorização necessária',
        description: 'Seu banco bloqueou a transação por segurança.',
        solutions: [
          'Entre em contato com seu banco',
          'Confirme que a compra foi feita por você',
          'Solicite a liberação para compras online',
          'Tente novamente após autorização'
        ]
      },
      'cc_rejected_card_disabled': {
        title: 'Cartão desabilitado',
        description: 'Seu cartão está temporariamente bloqueado.',
        solutions: [
          'Entre em contato com seu banco',
          'Verifique se o cartão está ativo',
          'Use outro cartão ou método de pagamento'
        ]
      },
      'cc_rejected_duplicated_payment': {
        title: 'Pagamento duplicado',
        description: 'Esta transação já foi processada anteriormente.',
        solutions: [
          'Verifique se o pagamento já foi aprovado',
          'Aguarde alguns minutos antes de tentar novamente',
          'Entre em contato conosco se precisar de ajuda'
        ]
      },
      'cc_rejected_high_risk': {
        title: 'Transação de alto risco',
        description: 'A transação foi bloqueada por medidas de segurança.',
        solutions: [
          'Tente usar PIX como método de pagamento',
          'Entre em contato com seu banco',
          'Verifique se seus dados estão corretos'
        ]
      }
    };

    const failureInfo = statusMessages[statusDetail || ''] || {
      title: 'Pagamento não autorizado',
      description: 'Não foi possível processar seu pagamento.',
      solutions: [
        'Verifique os dados do cartão',
        'Confirme se há limite disponível',
        'Tente outro método de pagamento',
        'Entre em contato com seu banco'
      ]
    };

    return failureInfo;
  };

  const handleRetryPayment = async () => {
    if (!order) return;

    try {
      // Restore cart items from the failed order
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            id,
            name,
            price,
            image_url
          )
        `)
        .eq('order_id', order.id);

      if (orderItems && orderItems.length > 0) {
        // Convert order items back to cart format
        const cartItems = orderItems.map(item => ({
          id: item.products?.id || '',
          name: item.products?.name || '',
          price: item.price,
          quantity: item.quantity,
          image: item.products?.image_url || '',
          customization: item.customization
        }));

        // Restore items to cart
        await restoreCart(cartItems);
        
        // Navigate to checkout
        navigate('/checkout');
      }
    } catch (error) {
      console.error('Error restoring cart:', error);
      navigate('/cart');
    }
  };

  const failureInfo = getFailureReason();

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
          {/* Failure Header */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">
                Pagamento Não Autorizado
              </CardTitle>
              <p className="text-red-700">
                Não conseguimos processar seu pagamento desta vez
              </p>
            </CardHeader>
          </Card>

          {/* Failure Reason */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                {failureInfo.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 mb-4">{failureInfo.description}</p>
              <div className="space-y-2">
                <h4 className="font-medium text-orange-800">Como resolver:</h4>
                <ul className="space-y-1">
                  {failureInfo.solutions.map((solution, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                      <span className="w-4 h-4 bg-orange-200 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                        <span className="text-xs font-semibold text-orange-800">{index + 1}</span>
                      </span>
                      {solution}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
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
                    <p className="text-sm text-muted-foreground">Data da Tentativa</p>
                    <p className="font-semibold">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-semibold text-lg">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Rejeitado
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

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleRetryPayment}
              className="w-full"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Tentar Pagamento Novamente
            </Button>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate('/checkout')}
                variant="outline"
                className="flex-1"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Escolher Outro Método
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

          {/* Payment Methods Suggestion */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Métodos de Pagamento Alternativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">PIX</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Pagamento via PIX</p>
                    <p className="text-sm text-blue-700">Aprovação instantânea, sem tarifas</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Outro Cartão</p>
                    <p className="text-sm text-blue-700">Tente com um cartão diferente</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Boleto Bancário</p>
                    <p className="text-sm text-blue-700">Pagamento em até 3 dias úteis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Precisa de Ajuda?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Nossa equipe está pronta para ajudar com qualquer dúvida sobre pagamentos
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline" size="sm">
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
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;