import { 
  CoefficientRow, 
  PricingRow, 
  ScenarioParams, 
  DateRange, 
  ScenarioCategory // Importamos el tipo de categoría
} from "./types";
import { getItemsByCategory } from "./constants"; // Importamos el catálogo de productos

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
// MIGRACIÓN Y VALIDACIÓN
// ==========================================

export const migrateParams = (oldParams: any): ScenarioParams => {
  const p = JSON.parse(JSON.stringify(oldParams));

  // Migración Legacy (Pases)
  if ('promoStart' in p && 'promoEnd' in p) {
    p.promoSeasons = [{ id: 'legacy-promo-' + Date.now(), start: p.promoStart, end: p.promoEnd }];
    delete p.promoStart; delete p.promoEnd;
  } else if (!p.promoSeasons) {
    p.promoSeasons = [];
  }

  if ('regularStart' in p && 'regularEnd' in p) {
    p.regularSeasons = [{ id: 'legacy-reg-' + Date.now(), start: p.regularStart, end: p.regularEnd }];
    delete p.regularStart; delete p.regularEnd;
  } else if (!p.regularSeasons) {
    p.regularSeasons = [];
  }

  // Inicializar precios de rental si no existen
  if (!p.rentalBasePrices) {
    p.rentalBasePrices = {};
  }

  return p as ScenarioParams;
};

export const validateScenarioDates = (params: ScenarioParams): string | null => {
    if (!params.validFrom || !params.validTo) return "Las fechas de Vigencia General deben estar definidas.";

    const d = (s: string) => new Date(s + 'T00:00:00').getTime();
    if (d(params.validFrom) > d(params.validTo)) return "Error en Vigencia General: 'Desde' es posterior a 'Hasta'.";

    if (!params.regularSeasons?.length) return "Falta definir Temporada Regular.";
    if (!params.promoSeasons?.length) return "Falta definir Temporada Promocional.";

    // Validación simplificada de integridad
    const check = (ranges: DateRange[]) => ranges.some(r => !r.start || !r.end || d(r.start) > d(r.end));
    if (check(params.regularSeasons)) return "Error en rangos de Temporada Regular.";
    if (check(params.promoSeasons)) return "Error en rangos de Temporada Promocional.";

    return null;
};

// ==========================================
// LÓGICA DE CÁLCULO (CORE)
// ==========================================

// 1. CÁLCULO DE PASES (LIFT) - Lógica Original
const calculateLiftPrices = (params: ScenarioParams, coefficients: CoefficientRow[]): PricingRow[] => {
  const { 
    baseRateAdult1Day, 
    increasePercentage, 
    promoDiscountPercentage, 
    minorDiscountPercentage,
    roundingValue 
  } = params;
  
  const safeRounding = roundingValue > 0 ? roundingValue : 100;
  const scenarioBaseRate = baseRateAdult1Day * (1 + (increasePercentage / 100));

  return coefficients.map(row => {
    const totalDaysPrice = scenarioBaseRate * row.day; 
    const discountMultiplier = 1 - (row.value / 100); 
    const adultRegularRawCalc = totalDaysPrice * discountMultiplier;

    // Cálculos derivados
    const adultPromoRaw = adultRegularRawCalc * (1 - (promoDiscountPercentage / 100));
    const minorRegularRaw = adultRegularRawCalc * (1 - (minorDiscountPercentage / 100));
    const minorPromoRaw = adultPromoRaw * (1 - (minorDiscountPercentage / 100));

    // Redondeos Visuales
    const adultRegularVisual = roundUp(adultRegularRawCalc, safeRounding);
    const adultPromoVisual = roundUp(adultPromoRaw, safeRounding);
    
    // Tope Menor (70% del Adulto)
    let minorRegularVisual = roundDown(minorRegularRaw, safeRounding);
    const maxMinorReg = adultRegularVisual * 0.70;
    if (minorRegularVisual > maxMinorReg) minorRegularVisual = roundDown(maxMinorReg, safeRounding);

    let minorPromoVisual = roundDown(minorPromoRaw, safeRounding);
    const maxMinorPromo = adultPromoVisual * 0.70;
    if (minorPromoVisual > maxMinorPromo) minorPromoVisual = roundDown(maxMinorPromo, safeRounding);

    return {
      days: row.day,
      coefficient: row.value,
      adultRegularRaw: adultRegularRawCalc,
      adultPromoRaw,
      minorRegularRaw,
      minorPromoRaw,
      adultRegularVisual,
      adultPromoVisual,
      minorRegularVisual,
      minorPromoVisual,
      adultRegularDailySystem: truncate4(adultRegularVisual / row.day),
      adultPromoDailySystem: truncate4(adultPromoVisual / row.day),
      minorRegularDailySystem: truncate4(minorRegularVisual / row.day),
      minorPromoDailySystem: truncate4(minorPromoVisual / row.day)
    };
  });
};

// 2. CÁLCULO DE RENTAL (NUEVO) - Lógica Multiproducto
const calculateRentalPrices = (
    params: ScenarioParams, 
    coefficients: CoefficientRow[], 
    category: ScenarioCategory
): PricingRow[] => {
    const { rentalBasePrices, increasePercentage, roundingValue } = params;
    const items = getItemsByCategory(category);
    const safeRounding = roundingValue > 0 ? roundingValue : 100;
    
    // Regla de Negocio: Rental Ciudad tiene 15% de descuento sobre la base
    const isCity = category === 'RENTAL_CITY';
    const cityDiscountFactor = isCity ? 0.85 : 1.0;

    return coefficients.map(row => {
        // Inicializamos el objeto de items para esta fila (día/hora)
        const rowItemsCalculated: Record<string, { raw: number, visual: number, dailySystem: number }> = {};

        items.forEach(item => {
            // A. Obtener Precio Base del Artículo (desde parámetros)
            const storedBase = rentalBasePrices?.[item.id] || 0;

            // B. Aplicar % Aumento General (Inflación)
            // Se asume que el aumento proyectado aplica a todos los rentals igual que a los pases
            const inflatedBase = storedBase * (1 + (increasePercentage / 100));

            // C. Aplicar Descuento por Sucursal (Ej: Ciudad -15%)
            const locationBase = inflatedBase * cityDiscountFactor;

            // D. Calcular Total por Duración (Días u Horas)
            // row.day actúa como "Cantidad de Unidades" (1 día, 2 días... o 1 hora, 2 horas)
            const units = row.day;
            const timeBasePrice = locationBase * units;

            // E. Aplicar Coeficiente (Descuento por cantidad de días)
            // Nota: Si es Alpino y son horas, el coeficiente define si hay descuento por horas acumuladas.
            const discountMultiplier = 1 - (row.value / 100);
            
            // F. Precio Final Crudo
            const finalRaw = timeBasePrice * discountMultiplier;

            // G. Redondeo Visual (Hacia arriba, múltiplo configurado)
            // Nota: Para lockers o patines baratos, un redondeo de $100 puede ser mucho, 
            // pero respetamos el parámetro 'roundingValue' global.
            const visualPrice = roundUp(finalRaw, safeRounding);

            // H. Precio Unitario Sistema (Truncado 4 decimales)
            const unitSystem = truncate4(visualPrice / units);

            // Guardar resultado para este ítem
            rowItemsCalculated[item.id] = {
                raw: finalRaw,
                visual: visualPrice,
                dailySystem: unitSystem
            };
        });

        return {
            days: row.day,
            coefficient: row.value,
            // Llenamos con 0 los campos legacy de LIFT para mantener compatibilidad de tipos
            adultRegularRaw: 0,
            adultPromoRaw: 0,
            minorRegularRaw: 0,
            minorPromoRaw: 0,
            adultRegularVisual: 0,
            adultPromoVisual: 0,
            minorRegularVisual: 0,
            minorPromoVisual: 0,
            adultRegularDailySystem: 0,
            adultPromoDailySystem: 0,
            minorRegularDailySystem: 0,
            minorPromoDailySystem: 0,
            // Aquí va la data real del Rental
            rentalItems: rowItemsCalculated
        };
    });
};

// ==========================================
// EXPORT FINAL (ROUTER)
// ==========================================

export const calculateScenarioPrices = (
  params: ScenarioParams,
  coefficients: CoefficientRow[],
  category: ScenarioCategory = 'LIFT' // Por defecto LIFT para no romper llamadas antiguas
): PricingRow[] => {
  if (category === 'LIFT') {
      return calculateLiftPrices(params, coefficients);
  } else {
      return calculateRentalPrices(params, coefficients, category);
  }
};

// ==========================================
// FORMATTERS
// ==========================================

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
};

export const formatDecimal = (val: number) => {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(val);
};

export const format4Decimals = (val: number) => {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(val);
};