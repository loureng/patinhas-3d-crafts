interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

interface CepCoordinates {
  lat: number;
  lng: number;
}

interface EnhancedCepResponse extends ViaCepResponse {
  coordinates?: CepCoordinates;
}

export const fetchCepData = async (cep: string): Promise<EnhancedCepResponse> => {
  // Remove caracteres não numéricos
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao consultar CEP');
    }

    const data: ViaCepResponse = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    // Try to get coordinates for shipping calculation
    const coordinates = await getCepCoordinates(cleanCep, data.localidade, data.uf);

    return {
      ...data,
      coordinates
    };
  } catch (error) {
    console.error('Erro na consulta do CEP:', error);
    throw error;
  }
};

// Get coordinates for a CEP using a geocoding service
const getCepCoordinates = async (cep: string, city: string, state: string): Promise<CepCoordinates | undefined> => {
  try {
    // Use Nominatim (OpenStreetMap) free geocoding service
    const query = `${cep}, ${city}, ${state}, Brazil`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`,
      {
        headers: {
          'User-Agent': 'JardimDasPatinhasEcommerce/1.0 (contact@jardimdaspatinhas.com.br)'
        }
      }
    );

    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        return {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon)
        };
      }
    }

    // Fallback: Use approximate coordinates based on state capitals
    return getStateCapitalCoordinates(state);
  } catch (error) {
    console.warn('Erro ao buscar coordenadas:', error);
    return getStateCapitalCoordinates(state);
  }
};

// Fallback coordinates based on state capitals
const getStateCapitalCoordinates = (state: string): CepCoordinates | undefined => {
  const stateCoords: Record<string, CepCoordinates> = {
    'SP': { lat: -23.5505, lng: -46.6333 }, // São Paulo
    'RJ': { lat: -22.9068, lng: -43.1729 }, // Rio de Janeiro
    'MG': { lat: -19.9167, lng: -43.9345 }, // Belo Horizonte
    'RS': { lat: -30.0346, lng: -51.2177 }, // Porto Alegre
    'PR': { lat: -25.4244, lng: -49.2654 }, // Curitiba
    'SC': { lat: -27.5954, lng: -48.5480 }, // Florianópolis
    'GO': { lat: -16.6864, lng: -49.2643 }, // Goiânia
    'DF': { lat: -15.8267, lng: -47.9218 }, // Brasília
    'ES': { lat: -20.3155, lng: -40.3128 }, // Vitória
    'BA': { lat: -12.9714, lng: -38.5014 }, // Salvador
    'PE': { lat: -8.0476, lng: -34.8770 },  // Recife
    'CE': { lat: -3.7172, lng: -38.5433 },  // Fortaleza
    'MT': { lat: -15.6014, lng: -56.0979 }, // Cuiabá
    'MS': { lat: -20.4697, lng: -54.6201 }, // Campo Grande
    'AL': { lat: -9.6658, lng: -35.7353 },  // Maceió
    'SE': { lat: -10.9472, lng: -37.0731 }, // Aracaju
    'PB': { lat: -7.1195, lng: -34.8450 },  // João Pessoa
    'RN': { lat: -5.7945, lng: -35.2110 },  // Natal
    'PI': { lat: -5.0892, lng: -42.8019 },  // Teresina
    'MA': { lat: -2.5297, lng: -44.3028 },  // São Luís
    'PA': { lat: -1.4558, lng: -48.5044 },  // Belém
    'AP': { lat: 0.0389, lng: -51.0664 },   // Macapá
    'AM': { lat: -3.1190, lng: -60.0217 },  // Manaus
    'RR': { lat: 2.8235, lng: -60.6758 },   // Boa Vista
    'AC': { lat: -9.9754, lng: -67.8249 },  // Rio Branco
    'RO': { lat: -8.7612, lng: -63.9004 },  // Porto Velho
    'TO': { lat: -10.1753, lng: -48.2982 }  // Palmas
  };

  return stateCoords[state.toUpperCase()];
};

export const formatCep = (cep: string): string => {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
};

export const validateCep = (cep: string): boolean => {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8 && /^\d+$/.test(cleanCep);
};

export const validateAddress = (address: {
  cep: string;
  address: string;
  city: string;
  state: string;
  number?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!validateCep(address.cep)) {
    errors.push('CEP inválido');
  }

  if (!address.address || address.address.trim().length < 5) {
    errors.push('Endereço deve ter pelo menos 5 caracteres');
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.push('Cidade inválida');
  }

  if (!address.state || address.state.trim().length !== 2) {
    errors.push('Estado deve ter 2 caracteres');
  }

  if (address.number && address.number.trim() === '') {
    errors.push('Número do endereço é obrigatório');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};