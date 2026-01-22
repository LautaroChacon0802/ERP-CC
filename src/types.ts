// ==========================================
// ENUMS & BASIC TYPES
// ==========================================
export type UserRole = 'ADMIN' | 'PRICING_ACCESS' | 'GASTRO_ACCESS' | 'STOCK_ACCESS';

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
// RENTAL ARCHITECTURE
// ==========================================

export interface RentalItem {
  id: string;
  label: string;
  category: ScenarioCategory; 
  type: 'SKI' | 'SNOWBOARD' | 'ACCESSORY' | 'OTHER';
  pricingUnit: 'DAY' | 'HOUR'; 
  isFixedDuration?: boolean; 
}

// ==========================================
// CORE INTERFACES
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
  createdAt: string;
  closedAt?: string;
  
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
  category: ScenarioCategory; // <--- CAMBIO CRÍTICO: CAMPO AGREGADO
  data: PricingRow[];
  params: ScenarioParams;
}

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