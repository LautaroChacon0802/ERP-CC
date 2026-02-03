import { describe, it, expect } from 'vitest';
import { calculateScenarioPrices, roundUp } from './pricingCalculator';
import { ScenarioParams, CoefficientRow } from '../types';

describe('Pricing Calculator Engine', () => {
    
    it('debe redondear hacia arriba correctamente (roundUp)', () => {
        expect(roundUp(101, 100)).toBe(200);
        expect(roundUp(100, 100)).toBe(100);
        expect(roundUp(1550, 100)).toBe(1600);
    });

    it('debe calcular precios de PASE (LIFT) aplicando aumento y coeficiente', () => {
        const mockParams: ScenarioParams = {
            baseRateAdult1Day: 1000,
            increasePercentage: 10, // Base = 1100
            minorDiscountPercentage: 0,
            promoDiscountPercentage: 0,
            roundingValue: 10,
            validFrom: '', validTo: '', regularSeasons: [], promoSeasons: [], rentalBasePrices: {}
        };

        const mockCoefs: CoefficientRow[] = [
            { day: 1, value: 0 },   // 1 día, 0% desc -> 1100
            { day: 2, value: 10 }   // 2 días, 10% desc -> (1100 * 2) * 0.9 = 1980
        ];

        const result = calculateScenarioPrices(mockParams, mockCoefs, 'LIFT');

        // Día 1
        expect(result[0].adultRegularVisual).toBe(1100);
        // Día 2
        expect(result[1].adultRegularVisual).toBe(1980);
    });

    it('debe calcular precios de RENTAL aplicando aumento y redondeo', () => {
        const mockParams: ScenarioParams = {
            baseRateAdult1Day: 0,
            increasePercentage: 20, // Aumento 20%
            roundingValue: 100,
            minorDiscountPercentage: 0, promoDiscountPercentage: 0,
            validFrom: '', validTo: '', regularSeasons: [], promoSeasons: [],
            rentalBasePrices: {
                'mnt_ski_jr_compl': 5000 // Base Rental
            }
        };

        const mockCoefs: CoefficientRow[] = [
            { day: 1, value: 0 } 
        ];

        // Base 5000 + 20% = 6000. Día 1 = 6000.
        const result = calculateScenarioPrices(mockParams, mockCoefs, 'RENTAL_MOUNTAIN');
        const itemResult = result[0].rentalItems?.['mnt_ski_jr_compl'];

        expect(itemResult).toBeDefined();
        expect(itemResult?.visual).toBe(6000);
    });
});