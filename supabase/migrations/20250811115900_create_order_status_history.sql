-- Create order_status_history table for order tracking
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view status history for their own orders
CREATE POLICY "Users can view their own order status history" 
ON public.order_status_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_status_history.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- RLS Policy: Only system can insert status history (via functions)
CREATE POLICY "System can insert order status history" 
ON public.order_status_history 
FOR INSERT 
WITH CHECK (true);

-- RLS Policy: System can update status history (via functions)
CREATE POLICY "System can update order status history" 
ON public.order_status_history 
FOR UPDATE 
USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_order_status_history_updated_at
  BEFORE UPDATE ON public.order_status_history
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically add status history when order status changes
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only add history if status actually changed
  IF OLD IS NULL OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, status, description)
    VALUES (
      NEW.id,
      NEW.status,
      CASE 
        WHEN NEW.status = 'pending' THEN 'Pedido confirmado e aguardando processamento'
        WHEN NEW.status = 'processing' THEN 'Pedido em produção'
        WHEN NEW.status = 'quality_check' THEN 'Produto em controle de qualidade'
        WHEN NEW.status = 'shipped' THEN 'Pedido enviado para entrega'
        WHEN NEW.status = 'delivered' THEN 'Pedido entregue'
        WHEN NEW.status = 'cancelled' THEN 'Pedido cancelado'
        ELSE 'Status atualizado para: ' || NEW.status
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically add status history on order status changes
DROP TRIGGER IF EXISTS order_status_change_trigger ON public.orders;
CREATE TRIGGER order_status_change_trigger
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_order_status_change();

-- Add estimated_delivery column to orders if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'estimated_delivery'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN estimated_delivery TIMESTAMPTZ;
  END IF;
END $$;

-- Add total_amount column to orders if it doesn't exist (from migration analysis)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'total_amount'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total_amount DECIMAL(10,2);
    -- Update existing orders that might have 'total' instead, only if needed
    IF EXISTS (
      SELECT 1 FROM public.orders WHERE total_amount IS NULL AND total IS NOT NULL
    ) THEN
      UPDATE public.orders SET total_amount = total WHERE total_amount IS NULL AND total IS NOT NULL;
    END IF;
  END IF;
END $$;