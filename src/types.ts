// ==========================================
// ENUMS & BASIC TYPES
// ==========================================
export type UserRole = 'ADMIN' | 'PRICING_ACCESS' | 'GASTRO_ACCESS' | 'STOCK_ACCESS';

// NUEVO: Categorías de Tarifarios
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
// RENTAL ARCHITECTURE
// ==========================================

// NUEVO: Definición de un Artículo de Rental
export interface RentalItem {
  id: string;
  label: string;
  category: ScenarioCategory; // A qué rental pertenece
  type: 'SKI' | 'SNOWBOARD' | 'ACCESSORY' | 'OTHER';
  pricingUnit: 'DAY' | 'HOUR'; // Para Alpino (Hora) vs Resto (Día)
  isFixedDuration?: boolean; // Para los equipos Premium que son solo x1 día
}

// ==========================================
// CORE INTERFACES
// ==========================================

export interface CoefficientRow {
  day: number;
  value: number;
}

export interface ScenarioParams {
  // --- Parámetros Generales ---
  baseRateAdult1Day: number; // Usado para Pases (LIFT)
  increasePercentage: number;
  promoDiscountPercentage: number;
  minorDiscountPercentage: number;
  roundingValue: number;
  
  // --- Fechas ---
  validFrom: string;
  validTo: string;
  regularSeasons: DateRange[];
  promoSeasons: DateRange[];

  // --- NUEVO: Parámetros de Rental ---
  // Almacena el Precio Base de cada artículo.
  // Clave: ItemID (ej: 'mnt_ski_jr_compl'), Valor: Precio Base (Entero)
  rentalBasePrices?: Record<string, number>;
}

export interface PricingRow {
  days: number;
  coefficient: number;

  // --- CAMPOS LEGACY (LIFT) ---
  // Los mantenemos obligatorios para no romper componentes existentes por ahora.
  // En escenarios de Rental vendrán en 0.
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

  // --- NUEVO: CAMPOS RENTAL ---
  // Estructura dinámica para N artículos.
  // Clave: ItemID
  rentalItems?: Record<string, {
    raw: number;         // Precio calculado crudo
    visual: number;      // Precio redondeado (Visual)
    dailySystem: number; // Precio diario truncado 4 decimales (Sistema)
  }>;
}

export interface Scenario {
  id: string;
  name: string;
  season: number;
  type: ScenarioType;
  baseScenarioId: string | null;
  status: ScenarioStatus;
  createdAt: string;
  closedAt?: string;
  
  // NUEVO: Categoría del escenario (Opcional para compatibilidad hacia atrás, pero idealmente obligatorio)
  category?: ScenarioCategory; 
  
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
  data: PricingRow[];
  params: ScenarioParams;
}

// Auth Types
export interface User {
  email: string;
  name: string;
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}