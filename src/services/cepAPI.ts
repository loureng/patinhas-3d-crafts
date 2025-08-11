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

export const fetchCepData = async (cep: string): Promise<ViaCepResponse> => {
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

    return data;
  } catch (error) {
    console.error('Erro na consulta do CEP:', error);
    throw error;
  }
};

export const formatCep = (cep: string): string => {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
};

export const validateCep = (cep: string): boolean => {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8 && /^\d+$/.test(cleanCep);
};