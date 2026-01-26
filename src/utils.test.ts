import { describe, it, expect } from 'vitest';
import { calculateScenarioPrices, roundUp, roundDown } from './utils';
import { CoefficientRow, ScenarioParams } from './types';

// Mock Data
const mockParams: ScenarioParams = {
  baseRateAdult1Day: 10000,
  increasePercentage: 0,
  promoDiscountPercentage: 20,
  minorDiscountPercentage: 30,
  roundingValue: 100,
  validFrom: '2025-01-01',
  validTo: '2025-12-31',
  promoSeasons: [],
  regularSeasons: [],
  rentalBasePrices: {}
};

const mockCoefficients: CoefficientRow[] = [
  { day: 1, value: 0 },
  { day: 3, value: 5.0 },
];

describe('Pricing Engine (utils.ts)', () => {

  describe('Helpers Matemáticos', () => {
    it('debe redondear hacia arriba correctamente (roundUp)', () => {
      expect(roundUp(10050, 100)).toBe(10100);
      expect(roundUp(10000, 100)).toBe(10000);
      expect(roundUp(10001, 100)).toBe(10100);
    });

    it('debe redondear hacia abajo correctamente (roundDown)', () => {
      expect(roundDown(7035, 100)).toBe(7000);
      expect(roundDown(7099, 100)).toBe(7000);
      expect(roundDown(7000, 100)).toBe(7000);
    });
  });

  describe('Cálculo de Precios (LIFT)', () => {
    const results = calculateScenarioPrices(mockParams, mockCoefficients, 'LIFT');
    const day1 = results.find(r => r.days === 1)!;
    const day3 = results.find(r => r.days === 3)!;

    it('debe calcular correctamente el precio base adulto (Día 1)', () => {
      // Base 10000 -> RoundUp 100 -> 10000
      expect(day1.adultRegularVisual).toBe(10000);
    });

    it('debe calcular correctamente el descuento de menor (Día 1)', () => {
      // 10000 * 0.7 = 7000 -> RoundDown 100 -> 7000
      expect(day1.minorRegularVisual).toBe(7000);
    });

    it('debe aplicar coeficientes de descuento (Día 3)', () => {
      // Base lineal: 30000. Descuento 5%: 30000 * 0.95 = 28500
      expect(day3.adultRegularRaw).toBe(28500);
    });

    it('debe respetar reglas de redondeo asimétrico', () => {
      const oddParams = { ...mockParams, baseRateAdult1Day: 10050 };
      const oddResults = calculateScenarioPrices(oddParams, mockCoefficients, 'LIFT');
      const oddDay1 = oddResults.find(r => r.days === 1)!;

      // Adulto: 10050 -> Ceil 100 -> 10100
      expect(oddDay1.adultRegularVisual).toBe(10100);
      
      // Menor: 10050 * 0.7 = 7035 -> Floor 100 -> 7000
      expect(oddDay1.minorRegularVisual).toBe(7000);
    });
  });

  describe('Validación de Tope 70% (Edge Cases)', () => {
    it('no debe permitir que el precio menor supere el 70% del adulto', () => {
      // Forzamos un caso donde el menor sea caro
      const highMinorParams: ScenarioParams = {
        ...mockParams,
        minorDiscountPercentage: 0, // 0% descuento, teóricamente igual al adulto
        baseRateAdult1Day: 10000
      };
      
      const results = calculateScenarioPrices(highMinorParams, mockCoefficients, 'LIFT');
      const day1 = results.find(r => r.days === 1)!;

      // Adulto: 10000.
      // Menor Raw: 10000.
      // Cap: 10000 * 0.70 = 7000.
      // El sistema debe forzar 7000.
      expect(day1.minorRegularVisual).toBeLessThanOrEqual(day1.adultRegularVisual * 0.7);
      expect(day1.minorRegularVisual).toBe(7000);
    });

    it('no debe truncar erróneamente si el cálculo da justo debajo del 70%', () => {
      // Caso especifico: 
      // Adulto: 10000 -> Cap 7000.
      // Menor Raw calculado para dar 6990 (69.9%).
      const specificParams: ScenarioParams = {
        ...mockParams,
        baseRateAdult1Day: 10000,
        minorDiscountPercentage: 30.1, // 30.1% off => 69.9% value
        roundingValue: 10 // Redondeo fino para probar el valor
      };

      const results = calculateScenarioPrices(specificParams, mockCoefficients, 'LIFT');
      const day1 = results.find(r => r.days === 1)!;

      // 10000 * 0.699 = 6990.
      // No debería activar el Cap de 7000.
      // Debería ser 6990 (RoundDown 10).
      expect(day1.minorRegularVisual).toBe(6990);
      expect(day1.minorRegularVisual).toBeLessThan(day1.adultRegularVisual * 0.7);
    });
  });
});