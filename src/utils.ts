import { 
  CoefficientRow, 
  PricingRow, 
  ScenarioParams, 
  DateRange, 
  ScenarioCategory
} from "./types";
import { getItemsByCategory } from "./constants";

// ==========================================
// CONSTANTES INICIALES (NUEVAS)
// ==========================================

export const INITIAL_COEFFICIENTS: CoefficientRow[] = Array.from({ length: 15 }, (_, i) => ({
  day: i + 1,
  value: 0
}));

export const INITIAL_PARAMS: ScenarioParams = {
  baseRateAdult1Day: 0,
  increasePercentage: 0,
  promoDiscountPercentage: 0,
  minorDiscountPercentage: 0,
  roundingValue: 100,
  validFrom: '',
  validTo: '',
  regularSeasons: [],
  promoSeasons: [],
  rentalBasePrices: {}
};

// ==========================================
// HELPERS MATEMÁTICOS
// ==========================================

export const roundUp = (num: number, multiple: number): number => {
  if (multiple === 0) return Math.ceil(num);
  return Math.ceil(num / multiple) * multiple;
};

export const roundDown = (num: number, multiple: number): number => {
  if (multiple === 0) return Math.floor(num);
  return Math.floor(num / multiple) * multiple;
};

export const truncate4 = (num: number): number => {
  return Math.trunc(num * 10000) / 10000;
};

// ==========================================
// VALIDACIONES
// ==========================================

export const validateScenarioDates = (params: ScenarioParams): string | null => {
    if (!params.validFrom || !params.validTo) return "Las fechas de Vigencia General deben estar definidas.";
    // ... resto de validaciones igual ...
    const d = (s: string) => new Date(s + 'T00:00:00').getTime();
    if (d(params.validFrom) > d(params.validTo)) return "Error en Vigencia General: 'Desde' es posterior a 'Hasta'.";
    return null;
};

// ==========================================
// LÓGICA DE CÁLCULO
// ==========================================
// ... (Mantén tus funciones calculateLiftPrices y calculateRentalPrices aquí) ...

const calculateLiftPrices = (params: ScenarioParams, coefficients: CoefficientRow[]): PricingRow[] => {
    // ... tu lógica existente de Lift ...
    // (Simplificado para brevedad, usa el código que ya tenías o pídeme que lo repita si lo perdiste)
    const { baseRateAdult1Day, increasePercentage } = params;
    const base = baseRateAdult1Day * (1 + increasePercentage / 100);
    return coefficients.map(c => ({
        days: c.day,
        coefficient: c.value,
        adultRegularRaw: base * c.day, // Ejemplo simplificado
        // ... rellenar resto de campos con 0 o cálculo real
        adultPromoRaw: 0, minorRegularRaw: 0, minorPromoRaw: 0,
        adultRegularVisual: 0, adultPromoVisual: 0, minorRegularVisual: 0, minorPromoVisual: 0,
        adultRegularDailySystem: 0, adultPromoDailySystem: 0, minorRegularDailySystem: 0, minorPromoDailySystem: 0
    }));
};

const calculateRentalPrices = (params: ScenarioParams, coefficients: CoefficientRow[], category: ScenarioCategory): PricingRow[] => {
    // ... tu lógica existente de Rental ...
    return coefficients.map(c => ({
        days: c.day,
        coefficient: c.value,
        adultRegularRaw: 0, adultPromoRaw: 0, minorRegularRaw: 0, minorPromoRaw: 0,
        adultRegularVisual: 0, adultPromoVisual: 0, minorRegularVisual: 0, minorPromoVisual: 0,
        adultRegularDailySystem: 0, adultPromoDailySystem: 0, minorRegularDailySystem: 0, minorPromoDailySystem: 0,
        rentalItems: {}
    }));
};

// ESTA ES LA FUNCIÓN QUE BUSCA EL HOOK (RENOMBRADA O ALIAS)
export const calculateScenarioPrices = (
  params: ScenarioParams,
  coefficients: CoefficientRow[],
  category: ScenarioCategory = 'LIFT'
): PricingRow[] => {
  if (category === 'LIFT') {
      return calculateLiftPrices(params, coefficients);
  } else {
      return calculateRentalPrices(params, coefficients, category);
  }
};

// ALIAS PARA COMPATIBILIDAD (Soluciona el error 'no exported member calculatePricingData')
export const calculatePricingData = calculateScenarioPrices;

// ==========================================
// FORMATTERS
// ==========================================
export const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);
export const formatDecimal = (val: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(val);
export const format4Decimals = (val: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(val);