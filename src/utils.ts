import { 
  CoefficientRow, 
  ScenarioParams
} from "./types";
// Importar helpers de redondeo desde el nuevo archivo si son necesarios para formatters locales,
// o dejarlos aquí solo si son usados por UI directamente. 
// En este caso, los formatters de abajo son independientes.

// ==========================================
// CONSTANTES INICIALES
// ==========================================

const ALLOWED_DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 30];

export const INITIAL_COEFFICIENTS: CoefficientRow[] = ALLOWED_DAYS.map(day => ({
  day,
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
// HELPERS MATEMÁTICOS DE UI (Re-export si se usan en componentes)
// ==========================================
// Nota: La lógica "pesada" se movió a pricingCalculator.ts
export { roundUp, roundDown, truncate4, calculateScenarioPrices } from './utils/pricingCalculator';

// ==========================================
// MIGRACIONES
// ==========================================
export const migrateParams = (params: any): ScenarioParams => {
  if (!params) return INITIAL_PARAMS;
  return {
      ...INITIAL_PARAMS,
      ...params,
      rentalBasePrices: params.rentalBasePrices || {}
  };
};

// ==========================================
// VALIDACIONES
// ==========================================

const areDatesOverlapping = (startA: string, endA: string, startB: string, endB: string): boolean => {
  const sA = new Date(startA + 'T00:00:00').getTime();
  const eA = new Date(endA + 'T00:00:00').getTime();
  const sB = new Date(startB + 'T00:00:00').getTime();
  const eB = new Date(endB + 'T00:00:00').getTime();
  
  return (sA <= eB) && (eA >= sB);
};

export const validateScenarioDates = (params: ScenarioParams): string | null => {
    if (!params.validFrom || !params.validTo) return "Las fechas de Vigencia General deben estar definidas.";
    
    const d = (s: string) => new Date(s + 'T00:00:00').getTime();
    if (d(params.validFrom) > d(params.validTo)) return "Error en Vigencia General: 'Desde' es posterior a 'Hasta'.";

    if (params.regularSeasons && params.promoSeasons) {
        for (const reg of params.regularSeasons) {
            for (const promo of params.promoSeasons) {
                if (areDatesOverlapping(reg.start, reg.end, promo.start, promo.end)) {
                    return `Conflicto de Fechas: La temporada regular (${reg.start} - ${reg.end}) se solapa con la promo (${promo.start} - ${promo.end}).`;
                }
            }
        }
    }

    return null;
};

// ==========================================
// FORMATTERS
// ==========================================
export const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);
export const formatDecimal = (val: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(val);
export const format4Decimals = (val: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(val);