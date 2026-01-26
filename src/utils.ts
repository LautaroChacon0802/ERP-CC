import { 
  CoefficientRow, 
  PricingRow, 
  ScenarioParams, 
  ScenarioCategory
} from "./types";

// ==========================================
// CONSTANTES INICIALES
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
// VALIDACIONES (MEJORADA)
// ==========================================

// Helper puro para chequear intersección de fechas
const areDatesOverlapping = (startA: string, endA: string, startB: string, endB: string): boolean => {
  const sA = new Date(startA + 'T00:00:00').getTime();
  const eA = new Date(endA + 'T00:00:00').getTime();
  const sB = new Date(startB + 'T00:00:00').getTime();
  const eB = new Date(endB + 'T00:00:00').getTime();
  
  // Lógica de solapamiento: El inicio de A es antes del fin de B Y el fin de A es después del inicio de B
  return (sA <= eB) && (eA >= sB);
};

export const validateScenarioDates = (params: ScenarioParams): string | null => {
    // 1. Validar Vigencia General
    if (!params.validFrom || !params.validTo) return "Las fechas de Vigencia General deben estar definidas.";
    
    const d = (s: string) => new Date(s + 'T00:00:00').getTime();
    if (d(params.validFrom) > d(params.validTo)) return "Error en Vigencia General: 'Desde' es posterior a 'Hasta'.";

    // 2. Validar Solapamientos entre Temporadas (Regular vs Promo)
    // Esto previene que un día tenga dos precios contradictorios definidos por fecha
    if (params.regularSeasons && params.promoSeasons) {
        for (const reg of params.regularSeasons) {
            for (const promo of params.promoSeasons) {
                if (areDatesOverlapping(reg.start, reg.end, promo.start, promo.end)) {
                    return `Conflicto de Fechas: La temporada regular (${reg.start} - ${reg.end}) se solapa con la promo (${promo.start} - ${promo.end}).`;
                }
            }
        }
    }
    
    // 3. Validar Solapamientos internos (Regular vs Regular, Promo vs Promo) - Opcional pero recomendado
    // ...se podría extender aquí si se desea

    return null;
};

// ==========================================
// LÓGICA DE CÁLCULO
// ==========================================

const calculateLiftPrices = (params: ScenarioParams, coefficients: CoefficientRow[]): PricingRow[] => {
    const { baseRateAdult1Day, increasePercentage, roundingValue, minorDiscountPercentage, promoDiscountPercentage } = params;
    
    const baseAdult = baseRateAdult1Day * (1 + increasePercentage / 100);

    return coefficients.map(c => {
        const rawLineal = baseAdult * c.day;
        const dayDiscountFactor = 1 - (c.value / 100);
        const adultRegularRaw = rawLineal * dayDiscountFactor;
        
        const adultRegularVisual = roundUp(adultRegularRaw, roundingValue);

        const minorFactor = 1 - (minorDiscountPercentage / 100);
        let minorRegularRaw = adultRegularVisual * minorFactor;
        const minorRegularVisual = roundDown(minorRegularRaw, roundingValue);

        const promoFactor = 1 - (promoDiscountPercentage / 100);
        const adultPromoRaw = adultRegularVisual * promoFactor;
        const adultPromoVisual = roundUp(adultPromoRaw, roundingValue);

        const minorPromoRaw = minorRegularVisual * promoFactor;
        const minorPromoVisual = roundDown(minorPromoRaw, roundingValue);

        return {
            days: c.day,
            coefficient: c.value,
            
            adultRegularRaw,
            adultPromoRaw,
            minorRegularRaw,
            minorPromoRaw,
            
            adultRegularVisual,
            adultPromoVisual,
            minorRegularVisual,
            minorPromoVisual,
            
            adultRegularDailySystem: c.day > 0 ? adultRegularVisual / c.day : 0,
            adultPromoDailySystem: c.day > 0 ? adultPromoVisual / c.day : 0,
            minorRegularDailySystem: c.day > 0 ? minorRegularVisual / c.day : 0,
            minorPromoDailySystem: c.day > 0 ? minorPromoVisual / c.day : 0
        };
    });
};

const calculateRentalPrices = (params: ScenarioParams, coefficients: CoefficientRow[], category: ScenarioCategory): PricingRow[] => {
    // Placeholder para lógica rental
    return coefficients.map(c => ({
        days: c.day,
        coefficient: c.value,
        adultRegularRaw: 0, adultPromoRaw: 0, minorRegularRaw: 0, minorPromoRaw: 0,
        adultRegularVisual: 0, adultPromoVisual: 0, minorRegularVisual: 0, minorPromoVisual: 0,
        adultRegularDailySystem: 0, adultPromoDailySystem: 0, minorRegularDailySystem: 0, minorPromoDailySystem: 0,
        rentalItems: {}
    }));
};

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

export const calculatePricingData = calculateScenarioPrices;

// ==========================================
// FORMATTERS
// ==========================================
export const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);
export const formatDecimal = (val: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(val);
export const format4Decimals = (val: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(val);