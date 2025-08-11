import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProductionQueueService } from '@/services/productionQueueAPI';
import { 
  ProductionQueueItemWithDetails,
  ProductionQueueFilters,
  ProductionQueueStats,
  UpdateProductionStatusData 
} from '@/types/production';

export const useProductionQueue = (
  page: number = 1,
  limit: number = 50,
  filters: ProductionQueueFilters = {}
) => {
  const [items, setItems] = useState<ProductionQueueItemWithDetails[]>([]);
  const [stats, setStats] = useState<ProductionQueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [queueData, statsData] = await Promise.all([
        ProductionQueueService.getProductionQueue(page, limit, filters),
        ProductionQueueService.getProductionStats()
      ]);

      setItems(queueData.data);
      setTotal(queueData.total);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching production queue:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = useCallback(async (
    itemId: string, 
    updateData: UpdateProductionStatusData
  ) => {
    try {
      await ProductionQueueService.updateProductionStatus(itemId, updateData);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error updating production status:', err);
      throw err;
    }
  }, [fetchData]);

  const bulkAssign = useCallback(async (itemIds: string[], assignedTo: string) => {
    try {
      await ProductionQueueService.bulkAssign(itemIds, assignedTo);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error bulk assigning items:', err);
      throw err;
    }
  }, [fetchData]);

  const updatePriorities = useCallback(async (
    updates: { id: string; priority: number }[]
  ) => {
    try {
      await ProductionQueueService.updatePriorities(updates);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error updating priorities:', err);
      throw err;
    }
  }, [fetchData]);

  return {
    items,
    stats,
    loading,
    error,
    total,
    refetch: fetchData,
    updateStatus,
    bulkAssign,
    updatePriorities
  };
};

export const useUserProductionQueue = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ProductionQueueItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserQueue = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await ProductionQueueService.getUserProductionQueue(user.id);
      setItems(data);
    } catch (err) {
      console.error('Error fetching user production queue:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserQueue();
  }, [fetchUserQueue]);

  return {
    items,
    loading,
    error,
    refetch: fetchUserQueue
  };
};

export const useProductionQueueItem = (itemId: string | null) => {
  const [item, setItem] = useState<ProductionQueueItemWithDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<ProductionStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (!itemId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [itemData, historyData] = await Promise.all([
        ProductionQueueService.getProductionQueueItem(itemId),
        ProductionQueueService.getStatusHistory(itemId)
      ]);

      setItem(itemData);
      setStatusHistory(historyData);
    } catch (err) {
      console.error('Error fetching production queue item:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const updateStatus = useCallback(async (updateData: UpdateProductionStatusData) => {
    if (!itemId) return;

    try {
      await ProductionQueueService.updateProductionStatus(itemId, updateData);
      await fetchItem(); // Refresh data
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  }, [itemId, fetchItem]);

  const addNotes = useCallback(async (notes: string) => {
    if (!itemId) return;

    try {
      await ProductionQueueService.addProductionNotes(itemId, notes);
      await fetchItem(); // Refresh data
    } catch (err) {
      console.error('Error adding notes:', err);
      throw err;
    }
  }, [itemId, fetchItem]);

  return {
    item,
    statusHistory,
    loading,
    error,
    refetch: fetchItem,
    updateStatus,
    addNotes
  };
};