
export enum ScenarioStatus {
  DRAFT = 'BORRADOR',
  CLOSED = 'CERRADO'
}

export enum ScenarioType {
  PREVENTA_1 = 'Preventa 1',
  PREVENTA_2 = 'Preventa 2',
  PREVENTA_3 = 'Preventa 3',
  PREVENTA_4 = 'Preventa 4',
  FINAL = 'Final'
}

export interface CoefficientRow {
  day: number;
  value: number; 
}

export interface DateRange {
  id: string; 
  start: string; 
  end: string;   
}

export interface ScenarioParams {
  baseRateAdult1Day: number; 
  increasePercentage: number; 
  promoDiscountPercentage: number; 
  minorDiscountPercentage: number; 
  roundingValue: number; 
  validFrom: string; 
  validTo: string;   
  promoSeasons: DateRange[];
  regularSeasons: DateRange[];
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

// --- AUTH TYPES ---

export type Permission = 'ADMIN' | 'PRICING_ACCESS' | 'GASTRO_ACCESS' | 'STOCK_ACCESS';

export interface User {
  email: string;
  name: string;
  permissions: Permission[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
