export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  description: string;
  carrier: string;
}

export interface ShippingAddress {
  cep: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ShippingCalculationRequest {
  origin: string; // CEP de origem
  destination: ShippingAddress;
  items: Array<{
    weight: number; // em gramas
    quantity: number;
  }>;
}

export interface ShippingCalculationResponse {
  success: boolean;
  options: ShippingOption[];
  error?: string;
}

export interface ProductDimensions {
  weight: number; // em gramas
  length?: number; // em cm
  width?: number; // em cm  
  height?: number; // em cm
}

export const DEFAULT_PRODUCT_WEIGHT = 200; // 200g default weight
export const ORIGIN_CEP = '01310-100'; // CEP da empresa (São Paulo - exemplo)

export const SHIPPING_CARRIERS = {
  CORREIOS_PAC: 'correios-pac',
  CORREIOS_SEDEX: 'correios-sedex', 
  EXPRESS: 'express'
} as const;

export type ShippingCarrier = typeof SHIPPING_CARRIERS[keyof typeof SHIPPING_CARRIERS];