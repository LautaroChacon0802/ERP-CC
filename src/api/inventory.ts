import { supabase } from '../lib/supabase';
import { InventoryItem, InventoryLocation, InventoryStock, InventoryMovement } from '../types';

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

  updateStock: async (locationId: string, itemId: string, quantityDelta: number): Promise<number> => {
    const { data: current, error: fetchError } = await supabase
        .from('inventory_stock')
        .select('quantity')
        .eq('location_id', locationId)
        .eq('item_id', itemId)
        .maybeSingle();

    if (fetchError) throw fetchError;

    const currentQty = current?.quantity || 0;
    const newQty = Math.max(0, currentQty + quantityDelta); 

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
  },

  // --- MOVIMIENTOS (NUEVO) ---

  transferStock: async (
    itemId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
    userId: string
  ): Promise<boolean> => {
    try {
        // 1. Restar de origen
        await InventoryService.updateStock(fromLocationId, itemId, -quantity);
        
        // 2. Sumar a destino
        await InventoryService.updateStock(toLocationId, itemId, quantity);
        
        // 3. Registrar Movimiento
        const { error } = await supabase.from('inventory_movements').insert({
            item_id: itemId,
            from_location_id: fromLocationId,
            to_location_id: toLocationId,
            quantity: quantity,
            type: 'MOVE',
            user_id: userId,
            reason: 'Traslado interno'
        });

        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Transaction Error:", e);
        throw e;
    }
  },

  getMovements: async (limit = 50): Promise<InventoryMovement[]> => {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        item:inventory_items(name, category),
        from:inventory_locations!from_location_id(name),
        to:inventory_locations!to_location_id(name),
        user:profiles(email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((row: any) => ({
      ...row,
      item: Array.isArray(row.item) ? row.item[0] : row.item,
      from: Array.isArray(row.from) ? row.from[0] : row.from,
      to: Array.isArray(row.to) ? row.to[0] : row.to,
      user: Array.isArray(row.user) ? row.user[0] : row.user,
    }));
  }
};