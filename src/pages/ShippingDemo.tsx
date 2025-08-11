import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { calculateShipping } from '@/services/shippingAPI';
import { ShippingOption } from '@/types/shipping';
import { fetchCepData } from '@/services/cepAPI';

const ShippingDemo = () => {
  const [cepOrigin] = useState('01310-100'); // São Paulo
  const [cepDestination, setCepDestination] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const handleCalculateShipping = async () => {
    if (!cepDestination || cepDestination.length < 8) return;

    setLoading(true);
    setCalculated(false);

    try {
      // Test items (comedouro + 2 vasos)
      const testItems = [
        { weight: 800, quantity: 1 }, // Comedouro 800g
        { weight: 500, quantity: 2 }  // 2x Vaso 500g cada
      ];

      const result = await calculateShipping({
        origin: cepOrigin,
        destination: {
          cep: cepDestination,
          address: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'Cidade Teste',
          state: 'SP'
        },
        items: testItems
      });

      if (result.options.length > 0) {
        setShippingOptions(result.options);
        setSelectedShipping(result.options[0].id);
        setCalculated(true);
      }
    } catch (error) {
      console.error('Erro no cálculo:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = shippingOptions.find(opt => opt.id === selectedShipping);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">🚀 Demo: Cálculo de Frete Implementado</h1>
          <p className="text-muted-foreground">
            Demonstração da funcionalidade completa de cálculo de frete
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Simulation Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Simulação de Frete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>CEP de Origem</Label>
                <Input value={cepOrigin} disabled />
                <small className="text-muted-foreground">São Paulo - SP</small>
              </div>

              <div>
                <Label htmlFor="cep-dest">CEP de Destino</Label>
                <Input
                  id="cep-dest"
                  value={cepDestination}
                  onChange={(e) => setCepDestination(e.target.value)}
                  placeholder="Ex: 20040-020 (Rio de Janeiro)"
                  maxLength={9}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Produtos no Carrinho:</h4>
                <ul className="text-sm space-y-1">
                  <li>• 1x Comedouro Personalizado (800g) - R$ 45,90</li>
                  <li>• 2x Vaso Decorativo (500g cada) - R$ 35,90</li>
                </ul>
                <p className="font-medium mt-2">Total: R$ 117,70 | Peso: 1,8kg</p>
              </div>

              <Button 
                onClick={handleCalculateShipping}
                disabled={loading || cepDestination.length < 8}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  'Calcular Frete'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Opções de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              {!calculated && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Digite um CEP de destino para calcular o frete</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Calculando distância e preços...</p>
                </div>
              )}

              {calculated && shippingOptions.length > 0 && (
                <div className="space-y-4">
                  <RadioGroup value={selectedShipping} onValueChange={setSelectedShipping}>
                    {shippingOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{option.name}</p>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                              <p className="text-sm text-muted-foreground">Prazo: {option.deliveryTime}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">R$ {option.price.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{option.carrier}</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {selectedOption && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Resumo da Entrega</h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <p><strong>Modalidade:</strong> {selectedOption.name}</p>
                        <p><strong>Preço:</strong> R$ {selectedOption.price.toFixed(2)}</p>
                        <p><strong>Prazo:</strong> {selectedOption.deliveryTime}</p>
                        <p><strong>Transportadora:</strong> {selectedOption.carrier}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Implementation Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>✅ Funcionalidades Implementadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">🔧 Cálculo Automático de Frete</h4>
                <ul className="text-sm space-y-2">
                  <li>✅ Integração com ViaCEP para busca de endereços</li>
                  <li>✅ Lookup de coordenadas via Nominatim (OpenStreetMap)</li>
                  <li>✅ Cálculo de distância usando fórmula de Haversine</li>
                  <li>✅ Preços baseados em distância + peso + modalidade</li>
                  <li>✅ Sistema de fallback para falhas de API</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">🎯 Opções de Entrega Dinâmicas</h4>
                <ul className="text-sm space-y-2">
                  <li>✅ PAC Econômico (7-12 dias úteis)</li>
                  <li>✅ SEDEX Padrão (3-5 dias úteis)</li>
                  <li>✅ Express (1-2 dias úteis)</li>
                  <li>✅ Preços e prazos calculados automaticamente</li>
                  <li>✅ Interface responsiva com seleção de modalidade</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">💾 Persistência no Banco de Dados</h4>
              <p className="text-sm text-blue-700">
                No checkout real, os dados de frete selecionados são salvos no campo <code>shipping_address</code> 
                da tabela <code>orders</code>, incluindo modalidade, preço, prazo e transportadora.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShippingDemo;