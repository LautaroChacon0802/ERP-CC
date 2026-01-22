import { ScenarioType, ScenarioCategory, RentalItem } from './types';

export const SCENARIO_TYPES = [
  { value: ScenarioType.BASE, label: 'Base' },
  { value: ScenarioType.DRAFT, label: 'Borrador' },
  { value: ScenarioType.FINAL, label: 'Final' },
];

// NUEVO: Catálogo de Categorías
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
  rentalBasePrices: {} // Inicializamos vacío
};

// ==========================================
// CATÁLOGO DE ARTÍCULOS DE RENTAL
// ==========================================

export const RENTAL_ITEMS: RentalItem[] = [
  // --- RENTAL BASE / MORADA (mnt) ---
  { id: 'mnt_ski_jr_compl', label: 'Esquí Junior + Botas + Bastones', category: 'RENTAL_MOUNTAIN', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false },
  { id: 'mnt_ski_ad_std_compl', label: 'Esquí Adulto Std + Botas + Bastones', category: 'RENTAL_MOUNTAIN', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false },
  { id: 'mnt_ski_ad_high_compl', label: 'Esquí Adulto Gama Alta + Botas + Bastones', category: 'RENTAL_MOUNTAIN', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false },
  { id: 'mnt_ski_ad_high_only', label: 'Esquí Adulto Gama Alta (Solo Tablas)', category: 'RENTAL_MOUNTAIN', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false },
  { id: 'mnt_ski_ad_prem_compl', label: 'Esquí Adulto Premium + Botas + Bastones', category: 'RENTAL_MOUNTAIN', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: true }, // Solo x1 día
  { id: 'mnt_ski_ad_prem_only', label: 'Esquí Adulto Premium (Solo Tablas)', category: 'RENTAL_MOUNTAIN', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: true }, // Solo x1 día
  { id: 'mnt_snow_ad_compl', label: 'Snowboard + Botas', category: 'RENTAL_MOUNTAIN', type: 'SNOWBOARD', pricingUnit: 'DAY', isFixedDuration: false },
  { id: 'mnt_helmet', label: 'Casco', category: 'RENTAL_MOUNTAIN', type: 'ACCESSORY', pricingUnit: 'DAY', isFixedDuration: false },

  // --- RENTAL CIUDAD (cty) ---
  { id: 'cty_ski_jr_compl', label: 'Esquí Junior + Botas + Bastones', category: 'RENTAL_CITY', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false },
  { id: 'cty_ski_ad_std_compl', label: 'Esquí Adulto Std + Botas + Bastones', category: 'RENTAL_CITY', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false },
  { id: 'cty_ski_ad_std_only', label: 'Esquí Adulto Std (Solo Tablas)', category: 'RENTAL_CITY', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false }, // Exclusivo Ciudad
  { id: 'cty_ski_ad_high_compl', label: 'Esquí Adulto Gama Alta + Botas + Bastones', category: 'RENTAL_CITY', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false },
  { id: 'cty_ski_ad_prem_compl', label: 'Esquí Adulto Premium + Botas + Bastones', category: 'RENTAL_CITY', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false }, // Nota: En ciudad no especificaste que fuera solo x1 día, lo dejo libre.
  { id: 'cty_snow_ad_compl', label: 'Snowboard + Botas', category: 'RENTAL_CITY', type: 'SNOWBOARD', pricingUnit: 'DAY', isFixedDuration: false },
  { id: 'cty_snow_ad_only', label: 'Snowboard (Solo Tablas)', category: 'RENTAL_CITY', type: 'SNOWBOARD', pricingUnit: 'DAY', isFixedDuration: false }, // Exclusivo Ciudad
  { id: 'cty_helmet', label: 'Casco', category: 'RENTAL_CITY', type: 'ACCESSORY', pricingUnit: 'DAY', isFixedDuration: false },

  // --- RENTAL ALPINO (alp) ---
  { id: 'alp_raquetas', label: 'Raquetas de Nieve', category: 'RENTAL_ALPINO', type: 'OTHER', pricingUnit: 'HOUR', isFixedDuration: false },
  { id: 'alp_skates_minor', label: 'Patines Hielo (Menor)', category: 'RENTAL_ALPINO', type: 'OTHER', pricingUnit: 'HOUR', isFixedDuration: false },
  { id: 'alp_skates_adult', label: 'Patines Hielo (Adulto)', category: 'RENTAL_ALPINO', type: 'OTHER', pricingUnit: 'HOUR', isFixedDuration: false },
  { id: 'alp_nordic', label: 'Esquí Nórdico (Fondo)', category: 'RENTAL_ALPINO', type: 'SKI', pricingUnit: 'DAY', isFixedDuration: false },
  { id: 'alp_locker', label: 'Locker', category: 'RENTAL_ALPINO', type: 'OTHER', pricingUnit: 'DAY', isFixedDuration: false },
];

// Helper para obtener items por categoría
export const getItemsByCategory = (cat: string) => RENTAL_ITEMS.filter(i => i.category === cat);