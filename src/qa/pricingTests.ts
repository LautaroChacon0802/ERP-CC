import { calculateScenarioPrices, roundUp, roundDown } from '../utils';
import { CoefficientRow, ScenarioParams } from '../src/types';

/**
 * QA TEST SUITE
 * Runs client-side validation logic to ensure pricing integrity.
 */
export const runPricingTests = () => {
  console.group("🧪 STARTING PRICING UNIT TESTS");
  let passed = 0;
  let failed = 0;

  const assert = (description: string, condition: boolean) => {
    if (condition) {
      console.log(`✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${description}`);
      failed++;
    }
  };

  // --- MOCK DATA ---
  const mockParams: ScenarioParams = {
    baseRateAdult1Day: 10000,
    increasePercentage: 0,
    promoDiscountPercentage: 20, // 20% off for promo
    minorDiscountPercentage: 30, // 30% off for minor
    roundingValue: 100, // Round to nearest 100
    validFrom: '2025-01-01',
    validTo: '2025-12-31',
    promoSeasons: [{ id: 'p1', start: '2025-06-01', end: '2025-06-30' }],
    regularSeasons: [{ id: 'r1', start: '2025-07-01', end: '2025-08-31' }]
  };

  const mockCoefficients: CoefficientRow[] = [
    { day: 1, value: 0 },    // 0% discount
    { day: 3, value: 5.0 },  // 5% discount
  ];

  // --- EXECUTE CALCULATION ---
  const results = calculateScenarioPrices(mockParams, mockCoefficients);
  const day1 = results.find(r => r.days === 1);
  const day3 = results.find(r => r.days === 3);

  if (!day1 || !day3) {
      console.error("Critical: Calculation returned empty or missing days.");
      return;
  }

  // --- TEST CASE 1: Basic Math & Rounding (Day 1) ---
  // Base = 10000. 1 Day. No coef discount.
  // Adult Raw = 10000.
  // Adult Visual = ceil(10000 / 100) * 100 = 10000.
  assert("Day 1 Adult Visual is 10000", day1.adultRegularVisual === 10000);

  // Minor Raw = 10000 * 0.7 = 7000.
  // Minor Visual = floor(7000 / 100) * 100 = 7000.
  assert("Day 1 Minor Visual is 7000", day1.minorRegularVisual === 7000);

  // --- TEST CASE 2: Rounding Up Rule (Adult) ---
  // Change base to 10050. Rounding 100.
  // 10050 -> Ceil to 100 -> 10100.
  const oddParams = { ...mockParams, baseRateAdult1Day: 10050 };
  const oddResults = calculateScenarioPrices(oddParams, mockCoefficients);
  const oddDay1 = oddResults.find(r => r.days === 1)!;
  assert("Rounding UP Adult (10050 -> 10100)", oddDay1.adultRegularVisual === 10100);

  // --- TEST CASE 3: Rounding Down Rule (Minor) ---
  // Base 10050. Minor Raw = 7035.
  // Floor to 100 -> 7000.
  assert("Rounding DOWN Minor (7035 -> 7000)", oddDay1.minorRegularVisual === 7000);

  // --- TEST CASE 4: The 70% Cap Rule ---
  // Ensure Minor Visual never exceeds 70% of Adult Visual.
  // Example: Adult Visual = 10100. 70% = 7070.
  // Minor Visual was calculated as 7000. 7000 <= 7070. OK.
  // Let's force a scenario where rounding might push it over if logic was wrong.
  // Actually, the main validation is: minor <= adult * 0.70.
  // In `calculateScenarioPrices`, we explicitly cap it:
  // if (minorVisual > maxMinorReg) minorVisual = roundDown(maxMinorReg).
  
  const capCheck = oddDay1.minorRegularVisual <= (oddDay1.adultRegularVisual * 0.7);
  assert("Minor Visual respects 70% Cap of Adult Visual", capCheck);

  // --- TEST CASE 5: Coefficients (Day 3) ---
  // Base 10000. 3 Days. 5% Discount.
  // Total Linear = 30000.
  // Discounted = 30000 * 0.95 = 28500.
  assert("Day 3 Coefficient applied correct math (28500)", day3.adultRegularRaw === 28500);

  console.log(`🏁 TESTS COMPLETED: ${passed} Passed, ${failed} Failed.`);
  console.groupEnd();
};