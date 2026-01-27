import { supabase } from '../lib/supabase';
import { InventoryItem, InventoryLocation, InventoryStock, InventoryMovement } from '../types';

export const InventoryService = {
  
  // --- ITEMS ---
  fetchCatalog: async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase.from('inventory_items').select('*').order('name');
    if (error) throw error;
    return data as InventoryItem[];
  },

  fetchItemById: async (id: string): Promise<InventoryItem | null> => {
    const { data, error } = await supabase.from('inventory_items').select('*').eq('id', id).single();
    if (error) throw error;
    return data as InventoryItem;
  },

  createItem: async (item: Omit<InventoryItem, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('inventory_items').insert(item).select().single();
    if (error) throw error;
    return data;
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>) => {
    const { error } = await supabase.from('inventory_items').update(updates).eq('id', id);
    if (error) throw error;
    return true;
  },

  deleteItem: async (id: string) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- LOCATIONS ---
  fetchLocations: async (): Promise<InventoryLocation[]> => {
    const { data, error } = await supabase.from('inventory_locations').select('*').order('name');
    if (error) throw error;
    return data as InventoryLocation[];
  },

  // NUEVO: Crear ubicación
  createLocation: async (name: string, type: 'CABIN' | 'DEPOSIT' | 'COMMON_AREA') => {
    const { data, error } = await supabase
        .from('inventory_locations')
        .insert({ name, type, capacity_meta: {} })
        .select()
        .single();
    if (error) throw error;
    return data;
  },

  // --- STOCK ---
  fetchStockByLocation: async (locationId: string): Promise<InventoryStock[]> => {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select(`quantity, item_id, location_id, item:inventory_items (*), location:inventory_locations (*)`)
      .eq('location_id', locationId);

    if (error) throw error;
    
    return data.map((row: any) => ({
      item_id: row.item_id,
      location_id: row.location_id,
      quantity: row.quantity,
      item: Array.isArray(row.item) ? row.item[0] : row.item,
      location: Array.isArray(row.location) ? row.location[0] : row.location
    }));
  },

  fetchAllStock: async (): Promise<InventoryStock[]> => {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select(`quantity, item_id, location_id, item:inventory_items (name, category, sku), location:inventory_locations (name, type)`);

    if (error) throw error;

    return data.map((row: any) => ({
      item_id: row.item_id,
      location_id: row.location_id,
      quantity: row.quantity,
      item: Array.isArray(row.item) ? row.item[0] : row.item,
      location: Array.isArray(row.location) ? row.location[0] : row.location
    }));
  },

  fetchStockByItem: async (itemId: string): Promise<InventoryStock[]> => {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select(`quantity, item_id, location_id, location:inventory_locations (*)`)
      .eq('item_id', itemId);

    if (error) throw error;

    return data.map((row: any) => ({
      item_id: row.item_id,
      location_id: row.location_id,
      quantity: row.quantity,
      location: Array.isArray(row.location) ? row.location[0] : row.location
    }));
  },

  adjustStockWithLog: async (
    locationId: string, itemId: string, quantityDelta: number, userId: string, reason: string = 'Ajuste manual'
  ): Promise<number> => {
    const { data, error } = await supabase.rpc('adjust_stock', {
      p_location_id: locationId,
      p_item_id: itemId,
      p_quantity_delta: quantityDelta,
      p_user_id: userId,
      p_reason: reason
    });

    if (error) throw error;
    return data as number;
  },

  transferStock: async (
    itemId: string, fromLocationId: string, toLocationId: string, quantity: number, userId: string
  ): Promise<boolean> => {
    const { data, error } = await supabase.rpc('transfer_stock', {
      p_item_id: itemId,
      p_from_location_id: fromLocationId,
      p_to_location_id: toLocationId,
      p_quantity: quantity,
      p_user_id: userId
    });

    if (error) throw error;
    return data as boolean;
  },

  updateStock: async (locationId: string, itemId: string, quantityDelta: number): Promise<number> => {
    console.warn("DEPRECATED: updateStock called.");
    return 0; 
  },

  getDashboardMetrics: async () => {
    const [items, locs, alerts] = await Promise.all([
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }),
        supabase.from('inventory_locations').select('*', { count: 'exact', head: true }),
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }).gt('min_stock', 0)
    ]);

    return {
        totalItems: items.count || 0,
        totalLocations: locs.count || 0,
        alertCount: alerts.count || 0
    };
  },

  // FIX 400: Eliminamos el join directo a profiles que fallaba por falta de FK en PostgREST
  getMovements: async (limit = 50): Promise<InventoryMovement[]> => {
    const { data: movements, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        item:inventory_items(name, category),
        from:inventory_locations!from_location_id(name),
        to:inventory_locations!to_location_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Recolectar user_ids únicos para hacer fetch manual de profiles
    const userIds = [...new Set(movements.map((m: any) => m.user_id).filter(Boolean))];
    let userMap: Record<string, any> = {};

    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);
        
        if (users) {
            users.forEach((u: any) => userMap[u.id] = u);
        }
    }

    // Mapear resultado final
    return movements.map((row: any) => ({
      ...row,
      item: Array.isArray(row.item) ? row.item[0] : row.item,
      from: Array.isArray(row.from) ? row.from[0] : row.from,
      to: Array.isArray(row.to) ? row.to[0] : row.to,
      // Asignar objeto user manualmente
      user: userMap[row.user_id] || { email: 'Usuario desconocido', full_name: 'N/A' },
    }));
  }
};