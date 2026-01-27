import { useState, useCallback, useEffect } from 'react';
import { InventoryService } from '../api/inventory';
import { InventoryItem, InventoryLocation } from '../types';

export const useStockManager = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await InventoryService.fetchCatalog();
      setItems(data);
    } catch (err: any) {
      console.error("Error loading catalog:", err);
      setError("No se pudo cargar el catálogo de ítems.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await InventoryService.fetchLocations();
      setLocations(data);
    } catch (err: any) {
      console.error("Error loading locations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (itemData: Omit<InventoryItem, 'id' | 'created_at'>) => {
    setIsLoading(true);
    try {
      const newItem = await InventoryService.createItem(itemData);
      setItems(prev => [...prev, newItem]);
      return true;
    } catch (err: any) {
      console.error("Error creating product:", err);
      setError("Error al crear el producto.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial automática
  useEffect(() => {
    loadCatalog();
    loadLocations();
  }, [loadCatalog, loadLocations]);

  return {
    items,
    locations,
    isLoading,
    error,
    loadCatalog,
    loadLocations,
    createProduct
  };
};