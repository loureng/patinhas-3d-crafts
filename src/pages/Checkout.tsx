import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { toast } from '@/hooks/use-toast';

type Coupon = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: number | string; // supabase numeric pode chegar como string
  usage_limit?: number | null;
  used_count?: number | null;
};

type MpPreferenceResponse = {
  init_point?: string;
  sandbox_init_point?: string;
};

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    complement: ''
  });

  // Cupom e pagamento
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  // Cálculo de frete e desconto
  const shippingCost = total >= 200 ? 0 : 20;
  const discountAmount = appliedCoupon
    ? (appliedCoupon.discount_type === 'percentage'
        ? (total * Number(appliedCoupon.value)) / 100
        : Number(appliedCoupon.value))
    : 0;
  const totalWithDiscount = Math.max(0, total - discountAmount + shippingCost);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalWithDiscount,
          status: 'pending',
          shipping_address: {
            ...shippingInfo,
            coupon: appliedCoupon?.code || null,
            discount: Number(discountAmount.toFixed(2)),
            shipping_cost: shippingCost,
          }
        })
        .select()
        .single();

      if (orderError || !order) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        customization: item.customization
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
      toast({
        title: "Pedido realizado com sucesso!",
        description: `Pedido #${order.id.slice(0, 8)} foi criado. Você receberá um email de confirmação.`
      });
      navigate('/account/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Erro no checkout",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const searchAddress = async () => {
    if (!shippingInfo.zipCode || shippingInfo.zipCode.length < 8) return;

    try {
      const cep = shippingInfo.zipCode.replace(/\D/g, '');
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setShippingInfo(prev => ({
          ...prev,
          address: data.logradouro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      setCouponLoading(true);
      const code = couponCode.trim().toUpperCase();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setAppliedCoupon(null);
        toast({
          title: 'Cupom inválido',
          description: 'Verifique o código e tente novamente.',
          variant: 'destructive'
        });
        return;
      }

      if (data.usage_limit && data.used_count >= data.usage_limit) {
        setAppliedCoupon(null);
        toast({
          title: 'Cupom expirado',
          description: 'O limite de uso deste cupom foi atingido.',
          variant: 'destructive'
        });
        return;
      }

      const normalized: Coupon = {
        code: data.code,
        discount_type: data.discount_type === 'percentage' ? 'percentage' : 'fixed',
        value: data.value,
        usage_limit: data.usage_limit ?? null,
        used_count: data.used_count ?? null,
      };
      setAppliedCoupon(normalized);
      toast({
        title: 'Cupom aplicado',
        description: `Desconto de ${data.discount_type === 'percentage' ? `${data.value}%` : `R$ ${Number(data.value).toFixed(2)}`} aplicado.`,
      });
    } catch (err) {
      console.error('Apply coupon error:', err);
      toast({
        title: 'Erro ao aplicar cupom',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleMercadoPago = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      setPayLoading(true);

      // 1) Criar o pedido antes do pagamento
      const shippingCost = total >= 200 ? 0 : 20;
      const discountAmount = appliedCoupon
        ? (appliedCoupon.discount_type === 'percentage'
            ? (total * Number(appliedCoupon.value)) / 100
            : Number(appliedCoupon.value))
        : 0;
      const totalWithDiscount = Math.max(0, total - discountAmount + shippingCost);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalWithDiscount,
          status: 'pending',
          shipping_address: {
            ...shippingInfo,
            coupon: appliedCoupon?.code || null,
            discount: Number(discountAmount.toFixed(2)),
            shipping_cost: shippingCost,
          }
        })
        .select()
        .single();

      if (orderError || !order) {
        throw orderError || new Error('Failed to create order');
      }

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        customization: item.customization
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 2) Criar preferência no MP vinculando ao pedido
      const mpItems = items.map((item) => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: Number(item.price),
        currency_id: 'BRL',
      }));

      const backUrl = `${window.location.origin}/account/orders`;
  const { data, error } = await supabase.functions.invoke('create-payment-preference', {
        body: {
          items: mpItems,
          back_urls: {
            success: backUrl,
            failure: backUrl,
            pending: backUrl,
          },
          auto_return: 'approved',
          external_reference: order.id,
        },
      });

      if (error) {
        console.error('MP error:', error);
        toast({ title: 'Erro ao iniciar pagamento', description: 'Tente novamente.', variant: 'destructive' });
        return;
      }

  const pref = (data as MpPreferenceResponse) || {};
  const redirectUrl = pref.init_point || pref.sandbox_init_point;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast({ title: 'Erro ao iniciar pagamento', description: 'URL de pagamento não retornada.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Mercado Pago error:', err);
      toast({ title: 'Erro ao iniciar pagamento', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    } finally {
      setPayLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Informações de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        required
                        value={shippingInfo.name}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      required
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        required
                        value={shippingInfo.zipCode}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                        onBlur={searchAddress}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        required
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        required
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      required
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={shippingInfo.complement}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, complement: e.target.value }))}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Processando...' : 'Confirmar Pedido'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.id}-${JSON.stringify(item.customization)}`} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                    </div>
                    <p className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <Label htmlFor="coupon">Cupom de desconto</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="coupon"
                        placeholder="INSIRA O CUPOM"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode}>
                        {couponLoading ? 'Aplicando...' : 'Aplicar'}
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <p className="text-sm text-green-600 mt-1">
                        Cupom aplicado: {appliedCoupon.code} (
                        {appliedCoupon.discount_type === 'percentage'
                          ? `${appliedCoupon.value}%`
                          : `R$ ${Number(appliedCoupon.value).toFixed(2)}`}
                        )
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto</span>
                      <span>- R$ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span>{shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {totalWithDiscount.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    <Button type="button" variant="secondary" className="w-full" disabled>
                      Pagamento em manutenção
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Temporariamente indisponível. Tente novamente mais tarde.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;