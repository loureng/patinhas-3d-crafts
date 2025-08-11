import { supabase } from '@/integrations/supabase/client';
import { 
  ProductionQueueItem, 
  ProductionQueueItemWithDetails,
  ProductionQueueFilters,
  ProductionQueueStats,
  UpdateProductionStatusData,
  ProductionStatus 
} from '@/types/production';

export class ProductionQueueService {
  
  /**
   * Get production queue items with filtering and pagination
   */
  static async getProductionQueue(
    page: number = 1,
    limit: number = 50,
    filters: ProductionQueueFilters = {}
  ) {
    let query = supabase
      .from('production_queue')
      .select(`
        *,
        order:orders!inner(id, user_id, total_amount, status, created_at),
        order_item:order_items!inner(id, product_id, quantity, price, customization),
        product:products!inner(id, name, category, image_url),
        customer:profiles!inner(display_name, email),
        status_history:production_status_history(*)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters.assigned_to && filters.assigned_to !== 'all') {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    
    if (filters.item_name) {
      query = query.ilike('item_name', `%${filters.item_name}%`);
    }
    
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.overdue) {
      query = query.lt('estimated_completion', new Date().toISOString());
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching production queue:', error);
      throw error;
    }

    return {
      data: data as ProductionQueueItemWithDetails[],
      total: count || 0,
      page,
      limit
    };
  }

  /**
   * Get production queue statistics
   */
  static async getProductionStats(): Promise<ProductionQueueStats> {
    const { data, error } = await supabase
      .from('production_queue')
      .select('status, created_at, completed_at, estimated_completion');

    if (error) {
      console.error('Error fetching production stats:', error);
      throw error;
    }

    const now = new Date();
    const stats: ProductionQueueStats = {
      total: data.length,
      awaiting_production: 0,
      in_production: 0,
      quality_check: 0,
      finished: 0,
      on_hold: 0,
      cancelled: 0,
      overdue: 0
    };

    let totalCompletionTime = 0;
    let completedCount = 0;

    data.forEach(item => {
      // Count by status
      stats[item.status as keyof ProductionQueueStats] = 
        (stats[item.status as keyof ProductionQueueStats] as number) + 1;

      // Count overdue items
      if (item.estimated_completion && 
          new Date(item.estimated_completion) < now && 
          !['finished', 'cancelled'].includes(item.status)) {
        stats.overdue++;
      }

      // Calculate average completion time
      if (item.completed_at && item.created_at) {
        const completionTime = new Date(item.completed_at).getTime() - 
                             new Date(item.created_at).getTime();
        totalCompletionTime += completionTime;
        completedCount++;
      }
    });

    if (completedCount > 0) {
      stats.average_completion_time = totalCompletionTime / completedCount / (1000 * 60 * 60); // hours
    }

    return stats;
  }

  /**
   * Update production status
   */
  static async updateProductionStatus(
    queueItemId: string, 
    updateData: UpdateProductionStatusData
  ) {
    // Call the database function that handles status updates and history
    const { error } = await supabase.rpc('update_production_status', {
      queue_item_id: queueItemId,
      new_status: updateData.status,
      notes: updateData.notes,
      hours_worked: updateData.hours_worked
    });

    if (error) {
      console.error('Error updating production status:', error);
      throw error;
    }

    // Update additional fields if provided
    if (updateData.estimated_completion || updateData.assigned_to || updateData.priority) {
      const updateFields: any = {};
      
      if (updateData.estimated_completion) {
        updateFields.estimated_completion = updateData.estimated_completion;
      }
      
      if (updateData.assigned_to) {
        updateFields.assigned_to = updateData.assigned_to;
      }
      
      if (updateData.priority) {
        updateFields.priority = updateData.priority;
      }

      const { error: updateError } = await supabase
        .from('production_queue')
        .update(updateFields)
        .eq('id', queueItemId);

      if (updateError) {
        console.error('Error updating additional fields:', updateError);
        throw updateError;
      }
    }
  }

  /**
   * Get production queue item by ID
   */
  static async getProductionQueueItem(id: string): Promise<ProductionQueueItemWithDetails> {
    const { data, error } = await supabase
      .from('production_queue')
      .select(`
        *,
        order:orders!inner(id, user_id, total_amount, status, created_at),
        order_item:order_items!inner(id, product_id, quantity, price, customization),
        product:products!inner(id, name, category, image_url),
        customer:profiles!inner(display_name, email),
        status_history:production_status_history(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching production queue item:', error);
      throw error;
    }

    return data as ProductionQueueItemWithDetails;
  }

  /**
   * Get production queue items for a specific customer (user)
   */
  static async getUserProductionQueue(userId: string) {
    const { data, error } = await supabase
      .from('production_queue')
      .select(`
        *,
        order:orders!inner(id, user_id, total_amount, status, created_at),
        order_item:order_items!inner(id, product_id, quantity, price, customization),
        product:products!inner(id, name, category, image_url),
        status_history:production_status_history(*)
      `)
      .eq('order.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user production queue:', error);
      throw error;
    }

    return data as ProductionQueueItemWithDetails[];
  }

  /**
   * Bulk update production queue priorities
   */
  static async updatePriorities(updates: { id: string; priority: number }[]) {
    const promises = updates.map(update => 
      supabase
        .from('production_queue')
        .update({ priority: update.priority })
        .eq('id', update.id)
    );

    const results = await Promise.all(promises);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      console.error('Error updating priorities:', errors);
      throw errors[0].error;
    }
  }

  /**
   * Assign multiple items to a user
   */
  static async bulkAssign(itemIds: string[], assignedTo: string) {
    const { error } = await supabase
      .from('production_queue')
      .update({ assigned_to: assignedTo })
      .in('id', itemIds);

    if (error) {
      console.error('Error bulk assigning items:', error);
      throw error;
    }
  }

  /**
   * Add production notes
   */
  static async addProductionNotes(queueItemId: string, notes: string) {
    const { error } = await supabase
      .from('production_queue')
      .update({ 
        production_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', queueItemId);

    if (error) {
      console.error('Error adding production notes:', error);
      throw error;
    }
  }

  /**
   * Get production status history for an item
   */
  static async getStatusHistory(queueItemId: string) {
    const { data, error } = await supabase
      .from('production_status_history')
      .select(`
        *,
        changed_by_profile:profiles(display_name, email)
      `)
      .eq('production_queue_id', queueItemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching status history:', error);
      throw error;
    }

    return data;
  }
}