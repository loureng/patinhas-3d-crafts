export interface Endereco {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface StatusHistory {
  status: string;
  timestamp: string;
  description: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price?: number;
}

export interface Pedido {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_address: Endereco;
  status_history: StatusHistory[];
  estimated_delivery?: string;
  items?: OrderItem[];
}

export interface OrderStatusHistory {
  status: string;
  created_at: string;
  description: string;
}

export interface OrderFromDB {
  id: string;
  status: string;
  total_amount?: number;
  total?: number;
  created_at: string;
  delivery_address: Endereco;
  order_status_history?: OrderStatusHistory[];
  estimated_delivery?: string;
  items?: OrderItem[];
}