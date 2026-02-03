// ==========================================
// ENUMS & BASIC TYPES
// ==========================================
export type UserRole = 'admin' | 'pricing_manager' | 'user';

// Categorías de Tarifarios
export type ScenarioCategory = 'LIFT' | 'RENTAL_MOUNTAIN' | 'RENTAL_CITY' | 'RENTAL_ALPINO';

export enum ScenarioType {
  BASE = 'Base',
  DRAFT = 'Borrador',
  FINAL = 'Final'
}

export enum ScenarioStatus {
  DRAFT = 'draft',
  CLOSED = 'closed'
}

export interface DateRange {
  id: string;
  start: string;
  end: string;
}

// ==========================================
// CORE INTERFACES (PRICING ENGINE)
// ==========================================

export interface CoefficientRow {
  day: number;
  value: number;
}

export interface ScenarioParams {
  baseRateAdult1Day: number; 
  increasePercentage: number;
  promoDiscountPercentage: number;
  minorDiscountPercentage: number;
  roundingValue: number;
  
  validFrom: string;
  validTo: string;
  regularSeasons: DateRange[];
  promoSeasons: DateRange[];

  rentalBasePrices?: Record<string, number>;
}

export interface PricingRow {
  days: number;
  coefficient: number;

  adultRegularRaw: number;
  adultPromoRaw: number;
  minorRegularRaw: number;
  minorPromoRaw: number;
  
  adultRegularVisual: number;
  adultPromoVisual: number;
  minorRegularVisual: number;
  minorPromoVisual: number;

  adultRegularDailySystem: number;
  adultPromoDailySystem: number;
  minorRegularDailySystem: number;
  minorPromoDailySystem: number;

  rentalItems?: Record<string, {
    raw: number;         
    visual: number;      
    dailySystem: number; 
  }>;
}

export interface Scenario {
  id: string;
  name: string;
  season: number;
  type: ScenarioType;
  baseScenarioId: string | null;
  status: ScenarioStatus;
  category?: ScenarioCategory; 
  
  // Timestamps
  createdAt: string;
  closedAt?: string;
  
  // Data
  params: ScenarioParams;
  coefficients: CoefficientRow[];
  calculatedData: PricingRow[];
}

export interface HistoryLogEntry {
  scenarioId: string;
  name: string;
  season: number;
  scenarioType: string;
  status: ScenarioStatus;
  closedAt: string;
  category: ScenarioCategory;
  data: PricingRow[];
  params: ScenarioParams;
}

// ==========================================
// RENTAL TYPES
// ==========================================

export interface RentalItem {
  id: string;
  label: string;
  category: ScenarioCategory;
  type: 'SKI' | 'SNOWBOARD' | 'ACCESSORY' | 'OTHER';
  pricingUnit: 'DAY' | 'HOUR';
  isFixedDuration: boolean;
}

// ==========================================
// AUTH & USER TYPES
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export type UserProfile = User;

// ==========================================
// MÓDULO DE INVENTARIO (STOCK)
// ==========================================

export type StockCategory = 
  | 'AMENITIES' 
  | 'VAJILLA' 
  | 'BLANCOS' 
  | 'ELECTRO' 
  | 'EQUIPAMIENTO' 
  | 'LIMPIEZA' 
  | 'SPA' 
  | 'GIMNASIO';

export type LocationType = 'CABIN' | 'DEPOSIT' | 'COMMON_AREA';

export type MovementType = 'IN' | 'OUT' | 'MOVE' | 'ADJUST';

export interface InventoryItem {
  id: string;
  sku?: string;
  name: string;
  category: StockCategory;
  description?: string;
  is_serialized: boolean;
  min_stock: number;
  image_url?: string;
  created_at?: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  type: LocationType;
  capacity_meta?: Record<string, any>;
  created_at?: string;
}

export interface InventoryStock {
  item_id: string;
  location_id: string;
  quantity: number;
  item?: InventoryItem;
  location?: InventoryLocation;
}

export interface InventoryMovement {
  id: string;
  created_at: string;
  item_id: string;
  from_location_id?: string;
  to_location_id?: string;
  quantity: number;
  type: MovementType;
  user_id: string;
  reason?: string;
  // Campos expandidos opcionales
  item?: InventoryItem;
  from?: InventoryLocation;
  to?: InventoryLocation;
  user?: { email: string; full_name: string };
}

// --- TIPOS DE BLINDAJE Y DTOs (NUEVOS) ---

// Tipo para mapear respuesta cruda de Supabase (que puede devolver arrays en joins)
export interface InventoryStockDBResponse {
  quantity: number;
  item_id: string;
  location_id: string;
  item: InventoryItem | InventoryItem[];
  location: InventoryLocation | InventoryLocation[];
}

// Tipo para mapear movimientos crudos antes de procesar
export interface InventoryMovementDBResponse {
  id: string;
  created_at: string;
  item_id: string;
  from_location_id?: string;
  to_location_id?: string;
  quantity: number;
  type: MovementType;
  user_id: string;
  reason?: string;
  item: InventoryItem | InventoryItem[];
  from: InventoryLocation | InventoryLocation[];
  to: InventoryLocation | InventoryLocation[];
  // user se maneja separado en la lógica actual de inventory.ts, pero lo definimos por si acaso
  user?: any; 
}

// DTO optimizado para el Dashboard
export interface DashboardMetrics {
    totalItems: number;
    totalLocations: number;
    alertCount: number;
}