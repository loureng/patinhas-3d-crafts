import { 
  ShippingCalculationRequest, 
  ShippingCalculationResponse, 
  ShippingOption,
  ORIGIN_CEP,
  SHIPPING_CARRIERS 
} from '@/types/shipping';
import { fetchCepData } from './cepAPI';

// Configurações de preço base para cada modalidade
const SHIPPING_CONFIG = {
  [SHIPPING_CARRIERS.CORREIOS_PAC]: {
    name: 'PAC - Econômico',
    carrier: 'Correios',
    basePrice: 8.50,
    pricePerKm: 0.015, // R$ por km
    pricePerKg: 4.50,  // R$ por kg adicional
    baseDays: 8,
    extraDaysPerKm: 0.002, // dias por km
    description: 'Entrega econômica em 7-12 dias úteis'
  },
  [SHIPPING_CARRIERS.CORREIOS_SEDEX]: {
    name: 'SEDEX - Padrão',
    carrier: 'Correios', 
    basePrice: 15.50,
    pricePerKm: 0.025,
    pricePerKg: 6.50,
    baseDays: 4,
    extraDaysPerKm: 0.001,
    description: 'Entrega padrão em 2-5 dias úteis'
  },
  [SHIPPING_CARRIERS.EXPRESS]: {
    name: 'Expresso',
    carrier: 'Transportadora',
    basePrice: 25.50,
    pricePerKm: 0.035,
    pricePerKg: 8.50,
    baseDays: 2,
    extraDaysPerKm: 0.0005,
    description: 'Entrega expressa em 1-2 dias úteis'
  }
};

// Calcula distância entre duas coordenadas usando fórmula de Haversine
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = EARTH_RADIUS_KM; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calcula preço e prazo de entrega baseado na distância e peso
function calculateShippingOption(
  carrierId: string, 
  distance: number, 
  totalWeight: number
): ShippingOption {
  const config = SHIPPING_CONFIG[carrierId as keyof typeof SHIPPING_CONFIG];
  
  const totalWeightKg = totalWeight / 1000; // Converte gramas para kg
  const extraWeight = Math.max(0, totalWeightKg - 1); // Peso adicional além de 1kg
  
  const price = Math.max(
    config.basePrice + 
    (distance * config.pricePerKm) + 
    (extraWeight * config.pricePerKg),
    config.basePrice // Preço mínimo
  );
  
  const deliveryDays = Math.ceil(
    config.baseDays + (distance * config.extraDaysPerKm)
  );
  
  return {
    id: carrierId,
    name: config.name,
    carrier: config.carrier,
    price: Math.round(price * 100) / 100, // Arredonda para 2 casas decimais
    deliveryTime: `${deliveryDays} dia${deliveryDays > 1 ? 's' : ''} útil${deliveryDays > 1 ? 'eis' : ''}`,
    description: config.description
  };
}

// Função principal para calcular opções de frete
export async function calculateShipping(request: ShippingCalculationRequest): Promise<ShippingCalculationResponse> {
  try {
    // Busca coordenadas do CEP de origem
    const originData = await fetchCepData(ORIGIN_CEP);
    if (!originData.coordinates) {
      throw new Error('Não foi possível obter coordenadas do CEP de origem');
    }

    // Busca coordenadas do CEP de destino
    const destinationData = await fetchCepData(request.destination.cep);
    if (!destinationData.coordinates) {
      throw new Error('Não foi possível obter coordenadas do CEP de destino');
    }

    // Calcula distância entre origem e destino
    const distance = calculateDistance(
      originData.coordinates.lat,
      originData.coordinates.lng,
      destinationData.coordinates.lat,
      destinationData.coordinates.lng
    );

    // Calcula peso total dos itens
    const totalWeight = request.items.reduce((total, item) => {
      return total + (item.weight * item.quantity);
    }, 0);

    // Gera opções de frete para cada modalidade
    const options = Object.keys(SHIPPING_CARRIERS).map(carrierId => 
      calculateShippingOption(carrierId, distance, totalWeight)
    );

    // Ordena por preço
    options.sort((a, b) => a.price - b.price);

    return {
      success: true,
      options
    };

  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    
    // Retorna opções de fallback em caso de erro
    return getFallbackShippingOptions(request);
  }
}

// Opções de fallback quando o cálculo dinâmico falha
function getFallbackShippingOptions(request: ShippingCalculationRequest): ShippingCalculationResponse {
  const totalWeight = request.items.reduce((total, item) => {
    return total + (item.weight * item.quantity);
  }, 0);

  const totalWeightKg = totalWeight / 1000;
  const weightMultiplier = Math.max(1, Math.ceil(totalWeightKg));

  const fallbackOptions: ShippingOption[] = [
    {
      id: SHIPPING_CARRIERS.CORREIOS_PAC,
      name: 'PAC - Econômico',
      carrier: 'Correios',
      price: 12.90 * weightMultiplier,
      deliveryTime: '8-12 dias úteis',
      description: 'Entrega econômica'
    },
    {
      id: SHIPPING_CARRIERS.CORREIOS_SEDEX,
      name: 'SEDEX - Padrão', 
      carrier: 'Correios',
      price: 19.90 * weightMultiplier,
      deliveryTime: '3-5 dias úteis',
      description: 'Entrega padrão'
    },
    {
      id: SHIPPING_CARRIERS.EXPRESS,
      name: 'Expresso',
      carrier: 'Transportadora',
      price: 29.90 * weightMultiplier,
      deliveryTime: '1-2 dias úteis',
      description: 'Entrega expressa'
    }
  ];

  return {
    success: false, // Indica que usou fallback
    options: fallbackOptions,
    error: 'Cálculo automático indisponível, valores estimados'
  };
}

// Função para validar se um CEP é atendido (todas as regiões do Brasil)
export function isDeliveryAvailable(cep: string): boolean {
  const cleanCep = cep.replace(/\D/g, '');
  
  // CEPs válidos no Brasil vão de 01000-000 a 99999-999
  const cepNumber = parseInt(cleanCep);
  return cepNumber >= 1000000 && cepNumber <= 99999999;
}

// Função utilitária para normalizar peso (com fallback)
export function getWeightWithFallback(weight?: number): number {
  return weight && weight > 0 ? weight : 200; // 200g default
}