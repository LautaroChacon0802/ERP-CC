import { CoefficientRow, PricingRow, ScenarioParams, DateRange } from "./types";

// Helper for dynamic rounding
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

/**
 * Migration Helper: Converts legacy params (single dates) to Multi-Range support.
 * Useful for loading old scenarios from history/backend.
 */
export const migrateParams = (oldParams: any): ScenarioParams => {
  // Deep clone to avoid mutating original ref
  const p = JSON.parse(JSON.stringify(oldParams));

  // Check for legacy promo fields
  if ('promoStart' in p && 'promoEnd' in p) {
    p.promoSeasons = [
      { id: 'legacy-promo-' + Date.now(), start: p.promoStart, end: p.promoEnd }
    ];
    delete p.promoStart;
    delete p.promoEnd;
  } else if (!p.promoSeasons) {
    p.promoSeasons = [];
  }

  // Check for legacy regular fields
  if ('regularStart' in p && 'regularEnd' in p) {
    p.regularSeasons = [
      { id: 'legacy-reg-' + Date.now(), start: p.regularStart, end: p.regularEnd }
    ];
    delete p.regularStart;
    delete p.regularEnd;
  } else if (!p.regularSeasons) {
    p.regularSeasons = [];
  }

  return p as ScenarioParams;
};

/**
 * Validates date ranges and overlaps.
 * Returns an error string if invalid, or null if valid.
 */
export const validateScenarioDates = (params: ScenarioParams): string | null => {
    if (!params.validFrom || !params.validTo) {
        return "Las fechas de Vigencia General deben estar definidas.";
    }

    const d = (s: string) => new Date(s + 'T00:00:00').getTime();

    // 1. Basic General Validity Check
    if (d(params.validFrom) > d(params.validTo)) return "Error en Vigencia General: 'Desde' es posterior a 'Hasta'.";

    // 2. Validate Arrays Existence
    if (!params.regularSeasons || params.regularSeasons.length === 0) return "Debe definir al menos un rango para Temporada Regular.";
    if (!params.promoSeasons || params.promoSeasons.length === 0) return "Debe definir al menos un rango para Temporada Promocional.";

    // Helper to check range integrity (Start <= End)
    const checkRangeIntegrity = (ranges: DateRange[], name: string): string | null => {
        for (const r of ranges) {
            if (!r.start || !r.end) return `Faltan fechas en un rango de ${name}.`;
            if (d(r.start) > d(r.end)) return `Error en ${name}: Una fecha de inicio es posterior a su fin.`;
        }
        return null;
    };

    const regIntegrity = checkRangeIntegrity(params.regularSeasons, 'Temp. Regular');
    if (regIntegrity) return regIntegrity;

    const promoIntegrity = checkRangeIntegrity(params.promoSeasons, 'Temp. Promocional');
    if (promoIntegrity) return promoIntegrity;


    // 3. Helper for Overlap Detection
    // Returns true if overlap exists: (StartA <= EndB) and (EndA >= StartB)
    const hasOverlap = (r1: DateRange, r2: DateRange) => {
        return d(r1.start) <= d(r2.end) && d(r1.end) >= d(r2.start);
    };

    // 4. Self-Overlap Check (Inside same season type)
    const checkSelfOverlap = (ranges: DateRange[], name: string): string | null => {
        for (let i = 0; i < ranges.length; i++) {
            for (let j = i + 1; j < ranges.length; j++) {
                if (hasOverlap(ranges[i], ranges[j])) {
                    return `Superposición detectada internamente en ${name} (Rango ${i+1} vs ${j+1}).`;
                }
            }
        }
        return null;
    };

    const selfRegError = checkSelfOverlap(params.regularSeasons, 'Temp. Regular');
    if (selfRegError) return selfRegError;

    const selfPromoError = checkSelfOverlap(params.promoSeasons, 'Temp. Promocional');
    if (selfPromoError) return selfPromoError;

    // 5. Cross-Overlap Check (Regular vs Promo)
    for (const reg of params.regularSeasons) {
        for (const promo of params.promoSeasons) {
            if (hasOverlap(reg, promo)) {
                 return "Conflicto de Fechas: Un rango de Temporada Regular se superpone con Temporada Promocional.";
            }
        }
    }

    return null; // No errors
};

export const calculateScenarioPrices = (
  params: ScenarioParams,
  coefficients: CoefficientRow[]
): PricingRow[] => {
  const { 
    baseRateAdult1Day, 
    increasePercentage, 
    promoDiscountPercentage, 
    minorDiscountPercentage,
    roundingValue 
  } = params;
  
  const safeRounding = roundingValue && roundingValue > 0 ? roundingValue : 100;
  
  // 1. Calculate Base Adult 1 Day for this scenario
  const scenarioBaseRate = baseRateAdult1Day * (1 + (increasePercentage / 100));

  return coefficients.map(row => {
    const totalDaysPrice = scenarioBaseRate * row.day; 
    const discountMultiplier = 1 - (row.value / 100); 
    
    const adultRegularRawCalc = totalDaysPrice * discountMultiplier;

    // Promo 
    const adultPromoRaw = adultRegularRawCalc * (1 - (promoDiscountPercentage / 100));

    // Minor (Regular & Promo) 
    const minorRegularRaw = adultRegularRawCalc * (1 - (minorDiscountPercentage / 100));
    const minorPromoRaw = adultPromoRaw * (1 - (minorDiscountPercentage / 100));

    // --- VISUAL TARIFARIO (Rounding) ---
    const adultRegularVisual = roundUp(adultRegularRawCalc, safeRounding);
    const adultPromoVisual = roundUp(adultPromoRaw, safeRounding);

    // Minor Validation: Minor <= 70% Adult.
    let minorRegularVisual = roundDown(minorRegularRaw, safeRounding);
    const maxMinorReg = adultRegularVisual * 0.70;
    if (minorRegularVisual > maxMinorReg) minorRegularVisual = roundDown(maxMinorReg, safeRounding);

    let minorPromoVisual = roundDown(minorPromoRaw, safeRounding);
    const maxMinorPromo = adultPromoVisual * 0.70;
    if (minorPromoVisual > maxMinorPromo) minorPromoVisual = roundDown(maxMinorPromo, safeRounding);

    // --- SYSTEM / DOBLEMENTE (Technical) ---
    // Here we strictly TRUNCATE to 4 decimals the DAILY value
    const adultRegularDailySystem = truncate4(adultRegularVisual / row.day);
    const adultPromoDailySystem = truncate4(adultPromoVisual / row.day);
    const minorRegularDailySystem = truncate4(minorRegularVisual / row.day);
    const minorPromoDailySystem = truncate4(minorPromoVisual / row.day);

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
      adultRegularDailySystem,
      adultPromoDailySystem,
      minorRegularDailySystem,
      minorPromoDailySystem
    };
  });
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
};

export const formatDecimal = (val: number) => {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(val);
};

// --- NEW FUNCTION: STRICT 4 DECIMALS ---
export const format4Decimals = (val: number) => {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(val);
};