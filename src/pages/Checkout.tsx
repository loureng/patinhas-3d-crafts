import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { toast } from '@/hooks/use-toast';
import { fetchCepData, validateAddress } from '@/services/cepAPI';
import { calculateShipping, getWeightWithFallback } from '@/services/shippingAPI';
import { ShippingOption, ORIGIN_CEP } from '@/types/shipping';
import { Loader2, MapPin, CreditCard, Truck, CheckCircle, AlertCircle, Package } from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState(1); // 1: Delivery, 2: Shipping, 3: Payment
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

  // Remove the handleSubmit function since we're only using Mercado Pago

  // Auto-calculate shipping when address is complete
  useEffect(() => {
    const timer = setTimeout(() => {
      if (shippingInfo.zipCode && shippingInfo.city && shippingInfo.state && shippingInfo.address) {
        calculateShippingOptions();
      }
    }, 1000); // Debounce

    return () => clearTimeout(timer);
  }, [shippingInfo.zipCode, shippingInfo.city, shippingInfo.state, shippingInfo.address]);

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

        toast({
          title: "Endereço encontrado!",
          description: `${data.logradouro}, ${data.localidade} - ${data.uf}`,
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP e tente novamente.",
          variant: "destructive"
        });
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
        setCurrentStep(2); // Move to shipping step
        toast({
          title: "Frete calculado!",
          description: `${result.options.length} opções disponíveis`,
        });
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
    
    // Validate required fields
    const requiredFields = [
      { field: shippingInfo.name, name: 'Nome completo' },
      { field: shippingInfo.email, name: 'Email' },
      { field: shippingInfo.phone, name: 'Telefone' },
      { field: shippingInfo.zipCode, name: 'CEP' },
      { field: shippingInfo.address, name: 'Endereço' },
      { field: shippingInfo.number, name: 'Número' },
      { field: shippingInfo.city, name: 'Cidade' },
      { field: shippingInfo.state, name: 'Estado' },
    ];

    for (const { field, name } of requiredFields) {
      if (!field) {
        toast({
          title: "Campo obrigatório",
          description: `Por favor, preencha o campo: ${name}`,
          variant: "destructive"
        });
        setCurrentStep(1);
        return;
      }
    }

    // Validate shipping selection
    if (!selectedShipping || !selectedShippingOption) {
      toast({
        title: "Selecione uma opção de frete",
        description: "É necessário escolher uma modalidade de entrega.",
        variant: "destructive"
      });
      setCurrentStep(2);
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

      // URLs de retorno para desenvolvimento e produção
      const baseUrl = window.location.origin;
      const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
      
      // Em desenvolvimento, usar URLs de produção temporárias para testes
      const backUrls = isLocalhost ? {
        success: 'https://jardim-das-patinhas.vercel.app/payment/success',
        failure: 'https://jardim-das-patinhas.vercel.app/payment/failure', 
        pending: 'https://jardim-das-patinhas.vercel.app/payment/pending',
      } : {
        success: `${baseUrl}/payment/success`,
        failure: `${baseUrl}/payment/failure`,
        pending: `${baseUrl}/payment/pending`,
      };

      const { data, error } = await supabase.functions.invoke('create-payment-preference', {
        body: {
          items: mpItems,
          back_urls: backUrls,
          auto_return: 'approved',
          external_reference: order.id,
        },
      });

      if (error) {
        console.error('MP error:', error);
        toast({ 
          title: 'Erro ao iniciar pagamento', 
          description: `Erro na integração: ${error.message || 'Tente novamente.'}`, 
          variant: 'destructive' 
        });
        return;
      }

      const pref = (data as MpPreferenceResponse) || {};
      const redirectUrl = pref.init_point || pref.sandbox_init_point;
      if (redirectUrl) {
        // Show success feedback before redirecting
        toast({ 
          title: 'Redirecionando para pagamento...', 
          description: 'Você será redirecionado para o Mercado Pago em instantes.',
          duration: 2000
        });
        
        // Clear cart before redirecting
        clearCart();
        
        // Small delay to show the toast
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000);
      } else {
        toast({ title: 'Erro ao iniciar pagamento', description: 'URL de pagamento não retornada.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Mercado Pago error:', err);
      
      // Better error messaging for development
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      const isDevelopment = window.location.hostname === 'localhost';
      
      toast({ 
        title: 'Erro ao iniciar pagamento', 
        description: isDevelopment 
          ? `[DEV] ${errorMessage} - Verifique configuração do Supabase`
          : 'Tente novamente mais tarde.', 
        variant: 'destructive' 
      });
    } finally {
      setPayLoading(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
          currentStep >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'
        }`}>
          {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
        </div>
        <div className={`text-sm font-medium ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          Dados de Entrega
        </div>
        
        <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        
        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
          currentStep >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'
        }`}>
          {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
        </div>
        <div className={`text-sm font-medium ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          Entrega
        </div>
        
        <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        
        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
          currentStep >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'
        }`}>
          <CreditCard className="h-5 w-5" />
        </div>
        <div className={`text-sm font-medium ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          Pagamento
        </div>
      </div>
    </div>
  );

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2">Finalizar Compra</h1>
          <p className="text-muted-foreground text-center mb-8">Complete os dados para finalizar seu pedido</p>
          
          <StepIndicator />
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Information */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MapPin className="h-5 w-5 text-primary" />
                    Informações de Entrega
                    {currentStep > 1 && <Badge variant="secondary" className="ml-auto">Concluído</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium">Nome Completo *</Label>
                        <Input
                          id="name"
                          required
                          value={shippingInfo.name}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1"
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={shippingInfo.email}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">Telefone *</Label>
                      <Input
                        id="phone"
                        required
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="zipCode" className="text-sm font-medium">CEP *</Label>
                        <Input
                          id="zipCode"
                          required
                          value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                          onBlur={searchAddress}
                          className="mt-1"
                          placeholder="00000-000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium">Cidade *</Label>
                        <Input
                          id="city"
                          required
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                          className="mt-1"
                          placeholder="Sua cidade"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm font-medium">Estado *</Label>
                        <Input
                          id="state"
                          required
                          value={shippingInfo.state}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
                          className="mt-1"
                          placeholder="SP"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-3">
                        <Label htmlFor="address" className="text-sm font-medium">Endereço *</Label>
                        <Input
                          id="address"
                          required
                          value={shippingInfo.address}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                          className="mt-1"
                          placeholder="Rua, avenida, etc."
                        />
                      </div>
                      <div>
                        <Label htmlFor="number" className="text-sm font-medium">Número *</Label>
                        <Input
                          id="number"
                          required
                          value={shippingInfo.number}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, number: e.target.value }))}
                          className="mt-1"
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="complement" className="text-sm font-medium">Complemento</Label>
                      <Input
                        id="complement"
                        value={shippingInfo.complement}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, complement: e.target.value }))}
                        className="mt-1"
                        placeholder="Apto, bloco, etc. (opcional)"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Options */}
              {(shippingOptions.length > 0 || shippingLoading) && (
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Truck className="h-5 w-5 text-primary" />
                      Opções de Entrega
                      {shippingLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Calculando frete...
                        </div>
                      )}
                      {selectedShipping && !shippingLoading && (
                        <Badge variant="secondary" className="ml-auto">Selecionado</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!shippingLoading && shippingOptions.length > 0 && (
                      <RadioGroup 
                        value={selectedShipping} 
                        onValueChange={(value) => {
                          setSelectedShipping(value);
                          setCurrentStep(3);
                        }}
                        className="space-y-3"
                      >
                        {shippingOptions.map((option) => (
                          <div key={option.id} className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-base">{option.name}</p>
                                  <p className="text-sm text-muted-foreground">{option.description}</p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Package className="h-3 w-3" />
                                    Prazo: {option.deliveryTime}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg text-green-600">R$ {option.price.toFixed(2)}</p>
                                  <p className="text-xs text-muted-foreground">{option.carrier}</p>
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                    
                    {!shippingLoading && shippingOptions.length === 0 && shippingInfo.zipCode && (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-medium">Preencha o endereço completo</p>
                        <p className="text-sm">O frete será calculado automaticamente</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0 sticky top-4">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Package className="h-5 w-5 text-primary" />
                    Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.id}-${JSON.stringify(item.customization)}`} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
                        {item.customization && Object.keys(item.customization).length > 0 && (
                          <p className="text-xs text-blue-600">Personalizado</p>
                        )}
                      </div>
                      <p className="font-bold text-sm">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div>
                    <Label htmlFor="coupon" className="text-sm font-medium">Cupom de desconto</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="coupon"
                        placeholder="CUPOM2024"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="text-sm"
                      />
                      <Button 
                        type="button" 
                        onClick={handleApplyCoupon} 
                        disabled={couponLoading || !couponCode}
                        size="sm"
                        variant="outline"
                      >
                        {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Aplicar'}
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                        <p className="text-sm text-green-700 font-medium">
                          ✓ Cupom aplicado: {appliedCoupon.code}
                        </p>
                        <p className="text-xs text-green-600">
                          Desconto: {appliedCoupon.discount_type === 'percentage'
                            ? `${appliedCoupon.value}%`
                            : `R$ ${Number(appliedCoupon.value).toFixed(2)}`}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto</span>
                        <span>- R$ {discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span>Frete</span>
                      <span>
                        {selectedShippingOption ? (
                          <div className="text-right">
                            <div className="font-medium">R$ {selectedShippingOption.price.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {selectedShippingOption.name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {shippingLoading ? 'Calculando...' : 'A calcular'}
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">R$ {totalWithDiscount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Section */}
                  <div className="pt-4 space-y-3">
                    <div className="text-center">
                      <CreditCard className="h-8 w-8 mx-auto text-primary mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Pagamento Seguro</p>
                    </div>
                    
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
                          Processando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Finalizar Pagamento
                        </div>
                      )}
                    </Button>
                    
                    <div className="text-center space-y-1">
                      <p className="text-xs text-muted-foreground">
                        💳 PIX • Cartão • Boleto
                      </p>
                      <p className="text-xs text-muted-foreground">
                        🔒 Pagamento processado pelo Mercado Pago
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;