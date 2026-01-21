
import { ScenarioType } from "./types";

export const DAYS_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 30];

// Default coefficients are now DISCOUNT PERCENTAGES.
// 0 = 0% discount (Full price: Days * Base)
// 5 = 5% discount, etc.
export const DEFAULT_COEFFICIENTS: Record<number, number> = {
  1: 0,    // 0% discount for 1 day
  2: 2.5,  // 2.5% discount
  3: 5.0,  // 5% discount
  4: 7.5,
  5: 10.0,
  6: 12.0,
  7: 14.0,
  8: 16.0,
  9: 18.0,
  10: 20.0,
  15: 25.0,
  30: 35.0
};

export const INITIAL_PARAMS = {
  baseRateAdult1Day: 10000,
  increasePercentage: 0,
  promoDiscountPercentage: 0,
  minorDiscountPercentage: 30, // Fixed 30%
  roundingValue: 100, // Default rounding multiple
  
  // Default Dates (approximate for typical season)
  validFrom: '2025-06-20',
  validTo: '2025-09-30',
  
  // Multi-range initialization (Default Seed)
  promoSeasons: [
    { id: 'def-promo-1', start: '2025-06-20', end: '2025-07-04' },
    { id: 'def-promo-2', start: '2025-09-20', end: '2025-09-30' }
  ],
  regularSeasons: [
    { id: 'def-reg-1', start: '2025-07-05', end: '2025-09-19' }
  ]
};

export const SCENARIO_TYPES = [
  ScenarioType.PREVENTA_1,
  ScenarioType.PREVENTA_2,
  ScenarioType.PREVENTA_3,
  ScenarioType.PREVENTA_4,
  ScenarioType.FINAL,
];
