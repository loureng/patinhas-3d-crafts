import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { toast } from '@/hooks/use-toast';
import { fetchCepData, validateAddress } from '@/services/cepAPI';
import { calculateShipping, getWeightWithFallback } from '@/services/shippingAPI';
import { ShippingOption, ORIGIN_CEP } from '@/types/shipping';
import { Loader2 } from 'lucide-react';

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
    number: '',
    city: '',
    state: '',
    zipCode: '',
    complement: ''
  });

  // Shipping calculation states
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingCalculated, setShippingCalculated] = useState(false);

  // Cupom e pagamento
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  // Get selected shipping option details
  const selectedShippingOption = shippingOptions.find(option => option.id === selectedShipping);
  const shippingCost = selectedShippingOption?.price || 0;

  // Cálculo de desconto
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

    // Validate address
    const addressValidation = validateAddress({
      cep: shippingInfo.zipCode,
      address: shippingInfo.address,
      city: shippingInfo.city,
      state: shippingInfo.state,
      number: shippingInfo.number
    });

    if (!addressValidation.isValid) {
      toast({
        title: "Endereço inválido",
        description: addressValidation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    // Validate shipping selection
    if (!selectedShipping || !selectedShippingOption) {
      toast({
        title: "Selecione uma opção de frete",
        description: "É necessário escolher uma modalidade de entrega.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create order with enhanced shipping data
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
            shipping: {
              option_id: selectedShipping,
              name: selectedShippingOption.name,
              carrier: selectedShippingOption.carrier,
              price: selectedShippingOption.price,
              delivery_time: selectedShippingOption.deliveryTime,
              description: selectedShippingOption.description
            }
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
        description: `Pedido #${order.id.slice(0, 8)} foi criado. Entrega via ${selectedShippingOption.name} em ${selectedShippingOption.deliveryTime}.`
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
      const data = await fetchCepData(cep);

      if (!data.erro) {
        setShippingInfo(prev => ({
          ...prev,
          address: data.logradouro,
          city: data.localidade,
          state: data.uf
        }));

        // Trigger shipping calculation after address is populated
        if (data.localidade && data.uf) {
          calculateShippingOptions();
        }
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const calculateShippingOptions = async () => {
    if (!shippingInfo.zipCode || !shippingInfo.city || !shippingInfo.state) {
      return;
    }

    try {
      setShippingLoading(true);
      setShippingCalculated(false);

      // Prepare shipping calculation request
      const shippingItems = items.map(item => ({
        weight: getWeightWithFallback(item.weight), // Use product weight or default
        quantity: item.quantity
      }));

      const shippingRequest = {
        origin: ORIGIN_CEP, // Company CEP
        destination: {
          cep: shippingInfo.zipCode,
          address: shippingInfo.address,
          number: shippingInfo.number || '1',
          neighborhood: '', // Not critical for calculation
          city: shippingInfo.city,
          state: shippingInfo.state
        },
        items: shippingItems
      };

      const result = await calculateShipping(shippingRequest);
      
      if (!result.success) {
        toast({
          title: "Aviso",
          description: result.error || "Usando valores estimados de frete",
          variant: "default"
        });
      }

      if (result.success && result.options.length > 0) {
        setShippingOptions(result.options);
        // Auto-select the cheapest option
        setSelectedShipping(result.options[0].id);
        setShippingCalculated(true);
      } else {
        throw new Error(result.error || 'Não foi possível calcular o frete');
      }
    } catch (error) {
      console.error('Shipping calculation error:', error);
      toast({
        title: "Erro no cálculo de frete",
        description: "Não foi possível calcular o frete. Usando valores padrão.",
        variant: "destructive"
      });
      
      // Fallback to default shipping
      setShippingOptions([{
        id: 'default',
        name: 'Frete Padrão',
        carrier: 'Correios',
        price: total >= 200 ? 0 : 20,
        deliveryTime: '5-7 dias úteis',
        description: 'Entrega padrão'
      }]);
      setSelectedShipping('default');
      setShippingCalculated(true);
    } finally {
      setShippingLoading(false);
    }
  };

  // Recalculate shipping when cart items change
  useEffect(() => {
    if (shippingCalculated && shippingInfo.zipCode && shippingInfo.city) {
      calculateShippingOptions();
    }
  }, [items]); // Re-run when cart items change

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
    
    // Validate shipping selection
    if (!selectedShipping || !selectedShippingOption) {
      toast({
        title: "Selecione uma opção de frete",
        description: "É necessário escolher uma modalidade de entrega.",
        variant: "destructive"
      });
      return;
    }

    try {
      setPayLoading(true);

      // 1) Create the order before payment
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
            shipping: {
              option_id: selectedShipping,
              name: selectedShippingOption.name,
              carrier: selectedShippingOption.carrier,
              price: selectedShippingOption.price,
              delivery_time: selectedShippingOption.deliveryTime,
              description: selectedShippingOption.description
            }
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

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        required
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        required
                        value={shippingInfo.number}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, number: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={shippingInfo.complement}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, complement: e.target.value }))}
                    />
                  </div>

                  {/* Shipping Options Section */}
                  {shippingInfo.zipCode && shippingInfo.city && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Opções de Entrega</Label>
                        {shippingLoading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Calculando frete...
                          </div>
                        )}
                      </div>
                      
                      {!shippingLoading && shippingOptions.length > 0 && (
                        <RadioGroup 
                          value={selectedShipping} 
                          onValueChange={setSelectedShipping}
                          className="space-y-3"
                        >
                          {shippingOptions.map((option) => (
                            <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{option.name}</p>
                                    <p className="text-sm text-muted-foreground">{option.description}</p>
                                    <p className="text-sm text-muted-foreground">Prazo: {option.deliveryTime}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">R$ {option.price.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">{option.carrier}</p>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                      
                      {!shippingLoading && shippingOptions.length === 0 && shippingInfo.zipCode && (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>Preencha o endereço completo para calcular o frete</p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={calculateShippingOptions}
                            className="mt-2"
                          >
                            Calcular Frete
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={loading || !selectedShipping}>
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
                    <span>
                      {selectedShippingOption ? (
                        <div className="text-right">
                          <div>R$ {selectedShippingOption.price.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedShippingOption.name} - {selectedShippingOption.deliveryTime}
                          </div>
                        </div>
                      ) : (
                        shippingLoading ? 'Calculando...' : 'A calcular'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {totalWithDiscount.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      type="button" 
                      onClick={handleMercadoPago}
                      className="w-full" 
                      size="lg"
                      disabled={payLoading || !selectedShipping}
                    >
                      {payLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processando pagamento...
                        </div>
                      ) : (
                        'Pagar com Mercado Pago'
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      PIX, Cartão de Crédito ou Boleto
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