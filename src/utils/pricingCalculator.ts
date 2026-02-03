import { 
  CoefficientRow, 
  PricingRow, 
  ScenarioParams, 
  ScenarioCategory 
} from "../types";
import { getItemsByCategory } from "../constants";

// ==========================================
// HELPERS MATEMÁTICOS (Pure Functions)
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
// MOTORES DE CÁLCULO
// ==========================================

const calculateLiftPrices = (params: ScenarioParams, coefficients: CoefficientRow[]): PricingRow[] => {
    const { 
        baseRateAdult1Day = 0, 
        increasePercentage = 0, 
        roundingValue = 100, 
        minorDiscountPercentage = 0, 
        promoDiscountPercentage = 0 
    } = params;
    
    // 1. DEFINICIÓN DE BASES
    const adultBasePrice = baseRateAdult1Day * (1 + increasePercentage / 100);
    const minorBasePrice = adultBasePrice * (1 - minorDiscountPercentage / 100);

    return coefficients.map(c => {
        const days = c.day;
        const timeDiscountFactor = 1 - (c.value / 100);
        
        // 2. CÁLCULO TEMPORADA REGULAR
        const adultRegularRaw = (adultBasePrice * days) * timeDiscountFactor;
        const minorRegularRaw = (minorBasePrice * days) * timeDiscountFactor;
        
        // 3. CÁLCULO TEMPORADA PROMOCIONAL
        const promoFactor = 1 - (promoDiscountPercentage / 100);
        const adultPromoRaw = adultRegularRaw * promoFactor;
        const minorPromoRaw = minorRegularRaw * promoFactor; 

        // 4. REDONDEOS Y VISUALIZACIÓN
        const adultRegularVisual = roundUp(adultRegularRaw, roundingValue);
        let minorRegularVisual = roundDown(minorRegularRaw, roundingValue);
        
        // Regla de Negocio: Tope Menor <= 70% del Adulto Visual
        const minorCap = adultRegularVisual * 0.70;
        if (minorRegularVisual > minorCap) {
            minorRegularVisual = roundDown(minorCap, roundingValue); 
        }

        const adultPromoVisual = roundUp(adultPromoRaw, roundingValue);
        let minorPromoVisual = roundDown(minorPromoRaw, roundingValue);
        
        const minorPromoCap = adultPromoVisual * 0.70;
        if (minorPromoVisual > minorPromoCap) {
            minorPromoVisual = roundDown(minorPromoCap, roundingValue);
        }

        // Sistema (Daily Unitario)
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

const calculateRentalPrices = (
    params: ScenarioParams, 
    coefficients: CoefficientRow[], 
    category: ScenarioCategory
): PricingRow[] => {
    const { rentalBasePrices, increasePercentage, roundingValue } = params;
    const rentalItemsList = getItemsByCategory(category);
    const safeRounding = roundingValue > 0 ? roundingValue : 100;

    return coefficients.map(row => {
        const rowItemsCalculated: Record<string, { raw: number, visual: number, dailySystem: number }> = {};

        rentalItemsList.forEach(item => {
            const storedBase = rentalBasePrices?.[item.id] || 0;
            const inflatedBase = storedBase * (1 + (increasePercentage / 100));
            
            const units = row.day;
            const timeBasePrice = inflatedBase * units;
            const discountMultiplier = 1 - (row.value / 100);
            
            const finalRaw = timeBasePrice * discountMultiplier;
            const visualPrice = roundUp(finalRaw, safeRounding);
            const unitSystem = units > 0 ? truncate4(visualPrice / units) : 0;

            rowItemsCalculated[item.id] = {
                raw: finalRaw,
                visual: visualPrice,
                dailySystem: unitSystem
            };
        });

        return {
            days: row.day,
            coefficient: row.value,
            adultRegularRaw: 0, adultPromoRaw: 0, minorRegularRaw: 0, minorPromoRaw: 0,
            adultRegularVisual: 0, adultPromoVisual: 0, minorRegularVisual: 0, minorPromoVisual: 0,
            adultRegularDailySystem: 0, adultPromoDailySystem: 0, minorRegularDailySystem: 0, minorPromoDailySystem: 0,
            rentalItems: rowItemsCalculated
        };
    });
};

/**
 * Función Principal de Cálculo
 * Orquestador que decide qué estrategia de precios usar según la categoría.
 */
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