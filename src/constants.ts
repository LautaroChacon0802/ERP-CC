import { ScenarioType, ScenarioCategory, RentalItem } from './types';

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

// ==========================================
// RENTAL ITEMS DEFINITION
// ==========================================

const COMMON_EQUIPMENT_ITEMS = [
  // Snowboard Unificado (Se eliminaron variantes AD/MN)
  { id: 'sb_completo', label: 'Snowboard Completo', type: 'SNOWBOARD', pricingUnit: 'DAY' },
  { id: 'sb_solo_tabla', label: 'Snowboard (Solo Tabla)', type: 'SNOWBOARD', pricingUnit: 'DAY' },
  
  // Esquí
  { id: 'ski_jr_comp', label: 'Ski Junior Completo', type: 'SKI', pricingUnit: 'DAY' },
  { id: 'ski_jr_tabla', label: 'Ski Junior Solo Tablas', type: 'SKI', pricingUnit: 'DAY' },
  { id: 'ski_std_comp', label: 'Ski Estandar Completo', type: 'SKI', pricingUnit: 'DAY' },
  { id: 'ski_std_tabla', label: 'Ski Estandar Solo Tablas', type: 'SKI', pricingUnit: 'DAY' },
  { id: 'ski_high_comp', label: 'Ski Alta Gama Completo', type: 'SKI', pricingUnit: 'DAY' },
  { id: 'ski_high_tabla', label: 'Ski Alta Gama Solo Tablas', type: 'SKI', pricingUnit: 'DAY' },
  { id: 'ski_prem_comp', label: 'Ski Premium Completo', type: 'SKI', pricingUnit: 'DAY' },
  { id: 'ski_prem_tabla', label: 'Ski Premium Solo Tablas', type: 'SKI', pricingUnit: 'DAY' },
  
  // Accesorios
  { id: 'helmet', label: 'Casco', type: 'ACCESSORY', pricingUnit: 'DAY' }
];

const ALPINO_ITEMS = [
  { id: 'patines', label: 'Patines de hielo', type: 'OTHER', pricingUnit: 'DAY' },
  { id: 'raquetas', label: 'Raquetas de nieve', type: 'OTHER', pricingUnit: 'DAY' },
  { id: 'nordico', label: 'Ski Nordico', type: 'SKI', pricingUnit: 'DAY' },
  { id: 'locker_2', label: 'Locker x2', type: 'OTHER', pricingUnit: 'DAY' },
  { id: 'locker_4', label: 'Locker x4', type: 'OTHER', pricingUnit: 'DAY' },
  { id: 'pin_locker', label: 'Pin Locker', type: 'OTHER', pricingUnit: 'DAY' }
];

// Helper to generate items for a specific category
const generateItems = (items: any[], category: ScenarioCategory): RentalItem[] => {
  return items.map(item => ({
    ...item,
    category,
    isFixedDuration: false // Default to false
  }));
};

export const RENTAL_ITEMS: RentalItem[] = [
  // Equipos para RENTAL_MOUNTAIN (Base / Morada)
  ...generateItems(COMMON_EQUIPMENT_ITEMS, 'RENTAL_MOUNTAIN'),
  
  // Equipos para RENTAL_CITY (Ciudad)
  ...generateItems(COMMON_EQUIPMENT_ITEMS, 'RENTAL_CITY'),

  // Items para RENTAL_ALPINO
  ...generateItems(ALPINO_ITEMS, 'RENTAL_ALPINO')
];

export const getItemsByCategory = (cat: string) => RENTAL_ITEMS.filter(i => i.category === cat);