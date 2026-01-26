import { 
  CoefficientRow, 
  PricingRow, 
  ScenarioParams, 
  DateRange, 
  ScenarioCategory
} from "./types";
import { getItemsByCategory } from "./constants";

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
// VALIDACIONES (ACTUALIZADA)
// ==========================================

// Helper para detectar solapamiento de rangos de fecha
const areDatesOverlapping = (startA: string, endA: string, startB: string, endB: string): boolean => {
  const sA = new Date(startA + 'T00:00:00').getTime();
  const eA = new Date(endA + 'T00:00:00').getTime();
  const sB = new Date(startB + 'T00:00:00').getTime();
  const eB = new Date(endB + 'T00:00:00').getTime();
  
  // Condición de solapamiento: (StartA <= EndB) y (EndA >= StartB)
  return (sA <= eB) && (eA >= sB);
};

export const validateScenarioDates = (params: ScenarioParams): string | null => {
    if (!params.validFrom || !params.validTo) return "Las fechas de Vigencia General deben estar definidas.";
    
    const d = (s: string) => new Date(s + 'T00:00:00').getTime();
    if (d(params.validFrom) > d(params.validTo)) return "Error en Vigencia General: 'Desde' es posterior a 'Hasta'.";

    // Validar solapamientos entre Regular y Promo
    for (const reg of params.regularSeasons) {
        for (const promo of params.promoSeasons) {
            if (areDatesOverlapping(reg.start, reg.end, promo.start, promo.end)) {
                return `Conflicto de Fechas: La temporada regular (${reg.start} - ${reg.end}) se solapa con la promo (${promo.start} - ${promo.end}).`;
            }
        }
    }

    return null;
};

// ==========================================
// LÓGICA DE CÁLCULO
// ==========================================

const calculateLiftPrices = (params: ScenarioParams, coefficients: CoefficientRow[]): PricingRow[] => {
    const { baseRateAdult1Day, increasePercentage, roundingValue, minorDiscountPercentage, promoDiscountPercentage } = params;
    
    // 1. Calcular Base Adulto con Aumento
    const baseAdult = baseRateAdult1Day * (1 + increasePercentage / 100);

    return coefficients.map(c => {
        // Cálculo Lineal
        const rawLineal = baseAdult * c.day;
        
        // Aplicar Coeficiente del día (Descuento por cantidad de días)
        // Coef value viene como porcentaje de descuento (ej: 5 para 5%)
        // Si coefficient es positivo es descuento.
        const dayDiscountFactor = 1 - (c.value / 100);
        
        const adultRegularRaw = rawLineal * dayDiscountFactor;
        
        // Adulto Venta (Redondeo hacia ARRIBA)
        const adultRegularVisual = roundUp(adultRegularRaw, roundingValue);

        // Menor (Descuento sobre el Adulto Visual)
        // Regla de Negocio: Menor = Adulto * (1 - minorDiscount%)
        // Validar tope 70% implícito si el descuento < 30%
        // Pero usamos el porcentaje explícito del params.
        const minorFactor = 1 - (minorDiscountPercentage / 100);
        let minorRegularRaw = adultRegularVisual * minorFactor;
        
        // Cap de seguridad: Menor nunca puede ser > 70% del adulto (Regla histórica)
        // Si el usuario pone descuento 0%, forzamos 30% off mínimo estructuralmente si se requiere,
        // pero por ahora respetamos el parametro, salvo que supere al adulto.
        
        // Menor Venta (Redondeo hacia ABAJO - Floor)
        const minorRegularVisual = roundDown(minorRegularRaw, roundingValue);

        // Promo (Descuento sobre el precio de lista/venta regular)
        const promoFactor = 1 - (promoDiscountPercentage / 100);
        
        const adultPromoRaw = adultRegularVisual * promoFactor;
        const adultPromoVisual = roundUp(adultPromoRaw, roundingValue); // Promo suele redondearse arriba también

        const minorPromoRaw = minorRegularVisual * promoFactor;
        const minorPromoVisual = roundDown(minorPromoRaw, roundingValue); // Menor Promo floor

        // Sistema (Diario)
        const adultRegularDailySystem = c.day > 0 ? adultRegularVisual / c.day : 0;
        const minorRegularDailySystem = c.day > 0 ? minorRegularVisual / c.day : 0;
        const adultPromoDailySystem = c.day > 0 ? adultPromoVisual / c.day : 0;
        const minorPromoDailySystem = c.day > 0 ? minorPromoVisual / c.day : 0;

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
    // Implementación placeholder para rental hasta definir lógica exacta
    // Usamos el mismo array de coeficientes pero con base 0 si no hay items definidos
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