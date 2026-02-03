import { supabase } from '../lib/supabase';
import { 
  InventoryItem, 
  InventoryLocation, 
  InventoryStock, 
  InventoryMovement,
  InventoryStockDBResponse,
  InventoryMovementDBResponse,
  DashboardMetrics
} from '../types';

// Helper de seguridad para normalizar respuestas de Supabase (Objeto vs Array)
const mapStockResponse = (row: InventoryStockDBResponse): InventoryStock => ({
  item_id: row.item_id,
  location_id: row.location_id,
  quantity: row.quantity,
  // Normalización: Si es array, toma el primero; si es objeto, úsalo directo.
  item: Array.isArray(row.item) ? row.item[0] : row.item,
  location: Array.isArray(row.location) ? row.location[0] : row.location
});

export const InventoryService = {
  
  // --- ITEMS (CATÁLOGO) ---
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
    return data as InventoryItem;
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

  createLocation: async (name: string, type: 'CABIN' | 'DEPOSIT' | 'COMMON_AREA') => {
    const { data, error } = await supabase
        .from('inventory_locations')
        .insert({ name, type, capacity_meta: {} })
        .select()
        .single();
    if (error) throw error;
    return data;
  },

  // --- STOCK READS (BLINDADOS) ---
  fetchStockByLocation: async (locationId: string): Promise<InventoryStock[]> => {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select(`quantity, item_id, location_id, item:inventory_items (*), location:inventory_locations (*)`)
      .eq('location_id', locationId);

    if (error) throw error;
    
    // Casting seguro a la interfaz de respuesta DB
    const rawData = data as unknown as InventoryStockDBResponse[];
    return rawData.map(mapStockResponse);
  },

  fetchAllStock: async (): Promise<InventoryStock[]> => {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select(`quantity, item_id, location_id, item:inventory_items (name, category, sku), location:inventory_locations (name, type)`);

    if (error) throw error;

    const rawData = data as unknown as InventoryStockDBResponse[];
    return rawData.map(mapStockResponse);
  },

  fetchStockByItem: async (itemId: string): Promise<InventoryStock[]> => {
    const { data, error } = await supabase
      .from('inventory_stock')
      .select(`quantity, item_id, location_id, location:inventory_locations (*)`)
      .eq('item_id', itemId);

    if (error) throw error;

    const rawData = data as unknown as InventoryStockDBResponse[];
    return rawData.map(mapStockResponse);
  },

  // --- RPC OPERATIONS ---
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
    console.warn("DEPRECATED: updateStock called. Use adjustStockWithLog.");
    return 0; 
  },

  // --- DASHBOARD METRICS (OPTIMIZADO) ---
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    // Usamos { count: 'exact', head: true } para obtener SOLO el número, sin descargar datos.
    const [items, locs, alerts] = await Promise.all([
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }),
        supabase.from('inventory_locations').select('*', { count: 'exact', head: true }),
        // Filtro en servidor para alertas
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }).gt('min_stock', 0)
    ]);

    return {
        totalItems: items.count || 0,
        totalLocations: locs.count || 0,
        alertCount: alerts.count || 0
    };
  },

  // --- MOVEMENTS (BLINDADO) ---
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

    // Fetch manual de usuarios para consistencia
    const userIds = [...new Set(movements.map((m: any) => m.user_id).filter(Boolean))];
    let userMap: Record<string, { email: string; full_name: string }> = {};

    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);
        
        if (users) {
            users.forEach((u: any) => userMap[u.id] = u);
        }
    }

    const rawMovements = movements as unknown as InventoryMovementDBResponse[];

    return rawMovements.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      item_id: row.item_id,
      from_location_id: row.from_location_id,
      to_location_id: row.to_location_id,
      quantity: row.quantity,
      type: row.type,
      user_id: row.user_id,
      reason: row.reason,
      
      // Mapeo seguro de relaciones
      item: Array.isArray(row.item) ? row.item[0] : row.item,
      from: Array.isArray(row.from) ? row.from[0] : row.from,
      to: Array.isArray(row.to) ? row.to[0] : row.to,
      user: userMap[row.user_id] || { email: 'Sistema', full_name: 'N/A' }
    }));
  }
};