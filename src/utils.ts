import { 
  CoefficientRow, 
  PricingRow, 
  ScenarioParams, 
  ScenarioCategory
} from "./types";

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
// LÓGICA DE CÁLCULO
// ==========================================

const calculateLiftPrices = (params: ScenarioParams, coefficients: CoefficientRow[]): PricingRow[] => {
    const { 
        baseRateAdult1Day = 0, 
        increasePercentage = 0, 
        roundingValue = 100, 
        minorDiscountPercentage = 0, 
        promoDiscountPercentage = 0 
    } = params;
    
    // 1. DEFINICIÓN DE BASES (Origen de datos)
    // Base Adulto = Base Configurada * (1 + Aumento)
    const adultBasePrice = baseRateAdult1Day * (1 + increasePercentage / 100);
    
    // Base Menor = Base Adulto * (1 - Descuento Menor)
    const minorBasePrice = adultBasePrice * (1 - minorDiscountPercentage / 100);

    return coefficients.map(c => {
        const days = c.day;
        // Coeficiente de descuento por tiempo (ej: si value es 5%, el factor es 0.95)
        const timeDiscountFactor = 1 - (c.value / 100);
        
        // 2. CÁLCULO DE TEMPORADA REGULAR
        // Precio = (Base * Días) * FactorTiempo
        const adultRegularRaw = (adultBasePrice * days) * timeDiscountFactor;
        const minorRegularRaw = (minorBasePrice * days) * timeDiscountFactor;
        
        // 3. CÁLCULO DE TEMPORADA PROMOCIONAL (Derivada de Regular)
        const promoFactor = 1 - (promoDiscountPercentage / 100);
        
        const adultPromoRaw = adultRegularRaw * promoFactor;
        const minorPromoRaw = minorRegularRaw * promoFactor; 

        // 4. REDONDEOS Y VISUALIZACIÓN
        // Adulto Regular: Hacia arriba
        const adultRegularVisual = roundUp(adultRegularRaw, roundingValue);
        
        // Menor Regular: Hacia abajo (floor)
        let minorRegularVisual = roundDown(minorRegularRaw, roundingValue);
        
        // REGLA DE NEGOCIO: Tope Menor <= 70% del Adulto Visual
        // Validamos que el precio visual del menor no rompa la regla histórica
        const minorCap = adultRegularVisual * 0.70;
        if (minorRegularVisual > minorCap) {
            minorRegularVisual = roundDown(minorCap, roundingValue); 
        }

        // Promo Visuales
        const adultPromoVisual = roundUp(adultPromoRaw, roundingValue);
        let minorPromoVisual = roundDown(minorPromoRaw, roundingValue);
        
        // Tope Promo Menor
        const minorPromoCap = adultPromoVisual * 0.70;
        if (minorPromoVisual > minorPromoCap) {
            minorPromoVisual = roundDown(minorPromoCap, roundingValue);
        }

        // Sistema (Daily)
        const adultRegularDailySystem = days > 0 ? adultRegularVisual / days : 0;
        const minorRegularDailySystem = days > 0 ? minorRegularVisual / days : 0;
        const adultPromoDailySystem = days > 0 ? adultPromoVisual / days : 0;
        const minorPromoDailySystem = days > 0 ? minorPromoVisual / days : 0;

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
            
            adultRegularDailySystem,
            adultPromoDailySystem,
            minorRegularDailySystem,
            minorPromoDailySystem
        };
    });
};

const calculateRentalPrices = (params: ScenarioParams, coefficients: CoefficientRow[], category: ScenarioCategory): PricingRow[] => {
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