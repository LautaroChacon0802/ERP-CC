import { ScenarioType, ScenarioCategory, RentalItem } from './types';

// ... (MANTENER CÓDIGO PREVIO INTACTO: SCENARIO_TYPES, SCENARIO_CATEGORIES, INITIAL_PARAMS) ...

export const SCENARIO_TYPES = [
  { value: ScenarioType.BASE, label: 'Base' },
  { value: ScenarioType.DRAFT, label: 'Borrador' },
  { value: ScenarioType.FINAL, label: 'Final' },
];

export const SCENARIO_CATEGORIES: { id: ScenarioCategory; label: string }[] = [
  { id: 'LIFT', label: 'Medios de Elevación' },
  { id: 'RENTAL_MOUNTAIN', label: 'Rental Base / Morada' },
  { id: 'RENTAL_CITY', label: 'Rental Ciudad' },
  { id: 'RENTAL_ALPINO', label: 'Rental Alpino' },
];

export const INITIAL_PARAMS = {
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

// NUEVO: Íconos para Categorías de Stock
export const CATEGORY_ICONS: Record<string, string> = {
    'AMENITIES': '🧴',
    'VAJILLA': '🍽️',
    'BLANCOS': '🛏️',
    'ELECTRO': '🔌',
    'EQUIPAMIENTO': '🛋️',
    'LIMPIEZA': '🧹',
    'SPA': '🧖‍♀️',
    'GIMNASIO': '🏋️‍♂️',
    'OTROS': '📦'
};

export const RENTAL_ITEMS: RentalItem[] = [
  // ... (MANTENER CÓDIGO RENTAL_ITEMS EXISTENTE) ...
  { id: 'mnt_ski_jr_compl', label: 'Esquí Junior + Botas + Bastones', category: 'RENTAL_MOUNTAIN', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false },
  // ... (Asumimos el resto de la lista existente aquí) ...
  { id: 'alp_locker', label: 'Locker', category: 'RENTAL_ALPINO', type: 'OTHER', pricingUnit: 'DAY', isFixedDuration: false },
];

export const getItemsByCategory = (cat: string) => RENTAL_ITEMS.filter(i => i.category === cat);