// Production Queue System Types

export type ProductionStatus = 
  | 'awaiting_production'
  | 'in_production'
  | 'quality_check'
  | 'finished'
  | 'on_hold'
  | 'cancelled';

export type ProductionPriority = 1 | 2 | 3 | 4 | 5; // 1=highest, 5=lowest

export interface ProductionQueueItem {
  id: string;
  order_id: string;
  order_item_id: string;
  customization_id?: string;
  
  // Production details
  item_name: string;
  customization_details?: any;
  production_notes?: string;
  
  // Status and timeline
  status: ProductionStatus;
  priority: ProductionPriority;
  
  // Time estimates and tracking
  estimated_hours?: number;
  actual_hours?: number;
  estimated_completion?: string;
  started_at?: string;
  completed_at?: string;
  
  // Assignment
  assigned_to?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ProductionStatusHistory {
  id: string;
  production_queue_id: string;
  previous_status?: string;
  new_status: string;
  description?: string;
  changed_by?: string;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  description?: string;
  created_at: string;
  created_by?: string;
}

// Enhanced types for production management
export interface ProductionQueueItemWithDetails extends ProductionQueueItem {
  order: {
    id: string;
    user_id: string;
    total_amount: number;
    status: string;
    created_at: string;
  };
  order_item: {
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    customization?: any;
  };
  product: {
    id: string;
    name: string;
    category: string;
    image_url?: string;
  };
  customer: {
    display_name?: string;
    email?: string;
  };
  status_history: ProductionStatusHistory[];
}

// Status label mappings
export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  awaiting_production: 'Aguardando Produção',
  in_production: 'Em Produção',
  quality_check: 'Controle de Qualidade',
  finished: 'Finalizado',
  on_hold: 'Em Espera',
  cancelled: 'Cancelado'
};

export const PRIORITY_LABELS: Record<ProductionPriority, string> = {
  1: 'Urgente',
  2: 'Alta',
  3: 'Normal',
  4: 'Baixa',
  5: 'Muito Baixa'
};

// Filter and search types
export interface ProductionQueueFilters {
  status?: ProductionStatus | 'all';
  priority?: ProductionPriority | 'all';
  assigned_to?: string | 'all';
  customer?: string;
  item_name?: string;
  date_from?: string;
  date_to?: string;
  overdue?: boolean;
}

export interface ProductionQueueStats {
  total: number;
  awaiting_production: number;
  in_production: number;
  quality_check: number;
  finished: number;
  on_hold: number;
  cancelled: number;
  overdue: number;
  average_completion_time?: number;
}

// Form types for updating production status
export interface UpdateProductionStatusData {
  status: ProductionStatus;
  notes?: string;
  hours_worked?: number;
  estimated_completion?: string;
  assigned_to?: string;
  priority?: ProductionPriority;
}

// API response types
export interface ProductionQueueResponse {
  data: ProductionQueueItemWithDetails[];
  total: number;
  page: number;
  limit: number;
  stats: ProductionQueueStats;
}