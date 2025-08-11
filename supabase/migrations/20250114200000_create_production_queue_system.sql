-- Create order_status_history table (referenced in code but missing)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS for order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_status_history
CREATE POLICY "Users can view status history of their own orders" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_status_history.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Create production_queue table for managing custom item production
CREATE TABLE IF NOT EXISTS public.production_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  customization_id uuid REFERENCES public.customizations(id) ON DELETE SET NULL,
  
  -- Production details
  item_name text NOT NULL,
  customization_details jsonb,
  production_notes text,
  
  -- Status and timeline
  status text NOT NULL DEFAULT 'awaiting_production' CHECK (
    status IN (
      'awaiting_production',
      'in_production', 
      'quality_check',
      'finished',
      'on_hold',
      'cancelled'
    )
  ),
  priority integer DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1=highest, 5=lowest
  
  -- Time estimates and tracking
  estimated_hours decimal(4,1),
  actual_hours decimal(4,1),
  estimated_completion timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Assignment
  assigned_to uuid REFERENCES auth.users(id),
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for production_queue
ALTER TABLE public.production_queue ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for production_queue
-- Customers can view their own production queue items
CREATE POLICY "Users can view their own production queue items" ON public.production_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = production_queue.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all production queue items (for now, authenticated users who are assigned)
CREATE POLICY "Assigned users can view production queue" ON public.production_queue
  FOR SELECT USING (assigned_to = auth.uid());

-- Create production_status_history table for detailed tracking
CREATE TABLE IF NOT EXISTS public.production_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_queue_id uuid NOT NULL REFERENCES public.production_queue(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  description text,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for production_status_history
ALTER TABLE public.production_status_history ENABLE ROW LEVEL SECURITY;

-- Users can view status history of their own production items
CREATE POLICY "Users can view their production status history" ON public.production_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.production_queue pq
      JOIN public.orders o ON o.id = pq.order_id
      WHERE pq.id = production_status_history.production_queue_id 
      AND o.user_id = auth.uid()
    )
  );

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_production_queue_updated_at
  BEFORE UPDATE ON public.production_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_production_queue_order_id ON public.production_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_production_queue_status ON public.production_queue(status);
CREATE INDEX IF NOT EXISTS idx_production_queue_priority ON public.production_queue(priority);
CREATE INDEX IF NOT EXISTS idx_production_queue_assigned_to ON public.production_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_production_queue_created_at ON public.production_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_production_status_history_queue_id ON public.production_status_history(production_queue_id);

-- Function to automatically add customized items to production queue
CREATE OR REPLACE FUNCTION public.add_to_production_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add to production queue if the order item has customization
  IF NEW.customization IS NOT NULL AND NEW.customization != '{}'::jsonb THEN
    INSERT INTO public.production_queue (
      order_id,
      order_item_id,
      item_name,
      customization_details,
      estimated_hours
    ) 
    SELECT 
      NEW.order_id,
      NEW.id,
      p.name,
      NEW.customization,
      CASE 
        WHEN p.category = 'personalizacao' THEN 24.0
        WHEN p.customizable = true THEN 8.0
        ELSE 4.0
      END
    FROM public.products p 
    WHERE p.id = NEW.product_id;
    
    -- Add status history entry for production queue creation
    INSERT INTO public.order_status_history (order_id, status, description)
    VALUES (NEW.order_id, 'awaiting_production', 'Item personalizado adicionado à fila de produção');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add customized items to production queue
CREATE TRIGGER add_customized_items_to_production_queue
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.add_to_production_queue();

-- Function to update production status and create history
CREATE OR REPLACE FUNCTION public.update_production_status(
  queue_item_id uuid,
  new_status text,
  notes text DEFAULT NULL,
  hours_worked decimal DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  old_status text;
BEGIN
  -- Get current status
  SELECT status INTO old_status 
  FROM public.production_queue 
  WHERE id = queue_item_id;
  
  -- Update production queue item
  UPDATE public.production_queue 
  SET 
    status = new_status,
    production_notes = COALESCE(notes, production_notes),
    actual_hours = COALESCE(hours_worked, actual_hours),
    started_at = CASE 
      WHEN new_status = 'in_production' AND started_at IS NULL 
      THEN now() 
      ELSE started_at 
    END,
    completed_at = CASE 
      WHEN new_status IN ('finished', 'cancelled') 
      THEN now() 
      ELSE completed_at 
    END
  WHERE id = queue_item_id;
  
  -- Add to status history
  INSERT INTO public.production_status_history (
    production_queue_id,
    previous_status,
    new_status,
    description,
    changed_by
  ) VALUES (
    queue_item_id,
    old_status,
    new_status,
    notes,
    auth.uid()
  );
  
  -- Update order status if all items in the order are finished
  IF new_status = 'finished' THEN
    -- Check if all production items for this order are finished
    IF NOT EXISTS (
      SELECT 1 FROM public.production_queue pq
      JOIN public.order_items oi ON oi.id = pq.order_item_id
      WHERE oi.order_id = (
        SELECT oi2.order_id FROM public.order_items oi2 
        WHERE oi2.id = (
          SELECT order_item_id FROM public.production_queue WHERE id = queue_item_id
        )
      )
      AND pq.status NOT IN ('finished', 'cancelled')
    ) THEN
      -- All production items finished, update order to processing
      UPDATE public.orders 
      SET status = 'processing'
      WHERE id = (
        SELECT oi.order_id FROM public.order_items oi 
        WHERE oi.id = (
          SELECT order_item_id FROM public.production_queue WHERE id = queue_item_id
        )
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;