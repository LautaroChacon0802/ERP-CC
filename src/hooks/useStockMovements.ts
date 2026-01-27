import { useState, useCallback } from 'react';
import { InventoryService } from '../api/inventory';
import { InventoryMovement } from '../types';

export const useStockMovements = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await InventoryService.getMovements(100);
      setMovements(data);
    } catch (error) {
      console.error("Error loading movements:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerTransfer = useCallback(async (
    itemId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
    userId: string
  ) => {
    setIsLoading(true);
    try {
      await InventoryService.transferStock(itemId, fromLocationId, toLocationId, quantity, userId);
      // No recargamos movimientos automáticamente aquí para no bloquear la UI de detalle
      return true;
    } catch (error) {
      console.error("Error transferring stock:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    movements,
    isLoading,
    loadMovements,
    registerTransfer
  };
};