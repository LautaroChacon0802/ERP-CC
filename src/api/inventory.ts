import { supabase } from '../lib/supabase';
import { InventoryItem, InventoryLocation, InventoryStock } from '../types';

export const InventoryService = {
  
  // --- ITEMS ---
  
  fetchCatalog: async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as InventoryItem[];
  },

  fetchItemById: async (id: string): Promise<InventoryItem | null> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as InventoryItem;
  },

  createItem: async (item: Omit<InventoryItem, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>) => {
    const { error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id);
      
    if (error) throw error;
    return true;
  },

  deleteItem: async (id: string) => {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  },

  // --- LOCATIONS ---

  fetchLocations: async (): Promise<InventoryLocation[]> => {
    const { data, error } = await supabase
      .from('inventory_locations')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data as InventoryLocation[];
  },

  // --- STOCK ---

  fetchStockByLocation: async (locationId: string): Promise<InventoryStock[]> => {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select(`
        quantity,
        item_id,
        location_id,
        item:inventory_items (*),
        location:inventory_locations (*)
      `)
      .eq('location_id', locationId);

    if (error) throw error;
    
    // Mapeo seguro para transformar arrays de joins en objetos
    const sanitizedData = data.map((row: any) => ({
      item_id: row.item_id,
      location_id: row.location_id,
      quantity: row.quantity,
      item: Array.isArray(row.item) ? row.item[0] : row.item,
      location: Array.isArray(row.location) ? row.location[0] : row.location
    }));

    return sanitizedData as InventoryStock[];
  },

  fetchStockByItem: async (itemId: string): Promise<InventoryStock[]> => {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select(`
        quantity,
        item_id,
        location_id,
        location:inventory_locations (*)
      `)
      .eq('item_id', itemId);

    if (error) throw error;

    const sanitizedData = data.map((row: any) => ({
      item_id: row.item_id,
      location_id: row.location_id,
      quantity: row.quantity,
      location: Array.isArray(row.location) ? row.location[0] : row.location
    }));

    return sanitizedData as InventoryStock[];
  },

  // NUEVO: Actualizar Stock (Delta)
  updateStock: async (locationId: string, itemId: string, quantityDelta: number): Promise<number> => {
    // 1. Obtener stock actual para calcular el nuevo valor
    const { data: current, error: fetchError } = await supabase
        .from('inventory_stock')
        .select('quantity')
        .eq('location_id', locationId)
        .eq('item_id', itemId)
        .maybeSingle();

    if (fetchError) throw fetchError;

    const currentQty = current?.quantity || 0;
    const newQty = Math.max(0, currentQty + quantityDelta); // Evitar negativos

    // 2. Upsert (Insertar o Actualizar)
    const { error: upsertError } = await supabase
        .from('inventory_stock')
        .upsert({
            item_id: itemId,
            location_id: locationId,
            quantity: newQty,
            updated_at: new Date().toISOString()
        });

    if (upsertError) throw upsertError;
    return newQty;
  }
};