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

  // --- STOCK (FIXED) ---

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
    
    // FIX: Saneamiento de datos (Array -> Object)
    const sanitizedData = data.map((row: any) => ({
      item_id: row.item_id,
      location_id: row.location_id,
      quantity: row.quantity,
      // Si viene como array (por la relación 1:N detectada por supabase), tomamos el primero
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

    // FIX: Saneamiento de datos
    const sanitizedData = data.map((row: any) => ({
      item_id: row.item_id,
      location_id: row.location_id,
      quantity: row.quantity,
      location: Array.isArray(row.location) ? row.location[0] : row.location
    }));

    return sanitizedData as InventoryStock[];
  }
};