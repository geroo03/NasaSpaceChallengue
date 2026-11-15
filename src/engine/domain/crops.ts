/**
 * Crop knowledge base.
 *
 * Values are generic agronomic reference ranges (FAO Irrigation & Drainage Paper 56 crop coefficients,
 * standard extension guidance). They are deliberately coarse and MUST be validated locally –
 * the UI says so. Swapping this file for a regional dataset (INTA, USDA NRCS, FAO GAEZ suitability)
 * is the single biggest accuracy upgrade available.
 *
 * Months are given for the SOUTHERN hemisphere; `shiftForHemisphere` converts them.
 */

export type CropId =
  | 'soy'
  | 'soy2'
  | 'maize'
  | 'sorghum'
  | 'sunflower'
  | 'cotton'
  | 'wheat'
  | 'chickpea'
  | 'vetch'
  | 'cereal_rye'
  | 'oat_cover'
  | 'alfalfa';

export type CropFamily = 'poaceae' | 'fabaceae' | 'asteraceae' | 'malvaceae';
export type CropRole = 'cash' | 'cover' | 'forage';

export interface Crop {
  id: CropId;
  name: { es: string; en: string };
  family: CropFamily;
  role: CropRole;
  /** Calendar months (1–12, southern hemisphere) in which sowing is agronomically normal. */
  sowWindowSouth: number[];
  /**
   * Months the crop occupies the field in a warm climate (sowing → harvest/termination).
   * For grain crops this is a MINIMUM: in cooler places the cycle is stretched by thermal time (see gdd).
   */
  cycleMonths: number;
  /** Cover crops can be terminated early; minimum useful duration. */
  minCycleMonths: number;
  /** Upper bound for the thermal-time stretched cycle (e.g. winter wheat with dormancy). */
  maxCycleMonths: number;
  /** Growing degree-days (°C·d) from sowing to maturity and their base temperature. null = calendar-based (covers, perennials). */
  gdd: { required: number; baseC: number } | null;
  /**
   * Season-average crop coefficient (FAO-56 Kc, averaged over initial/mid/late stages).
   * Crop water demand = Σ Kc × ET0 over the months the crop occupies the field, with ET0 from NASA POWER.
   */
  kc: number;
  /** 1 (very sensitive) – 5 (very tolerant) */
  droughtTolerance: 1 | 2 | 3 | 4 | 5;
  heatTolerance: 1 | 2 | 3 | 4 | 5;
  frostTolerant: boolean;
  nFixing: boolean;
  /** 1 shallow – 3 deep (breaks compaction, scavenges deep nutrients) */
  rootDepth: 1 | 2 | 3;
  /** Residue / organic-matter contribution, 1–5 */
  residue: 1 | 2 | 3 | 4 | 5;
  /** Soil-cover / erosion protection while growing, 1–5 */
  groundCover: 1 | 2 | 3 | 4 | 5;
  /** Generic market potential, 1–5. Placeholder: replace with USDA AMS / local price data. */
  marketPotential: 0 | 1 | 2 | 3 | 4 | 5;
  forageValue: 0 | 1 | 2 | 3 | 4 | 5;
  /**
   * Flowering, the stage most damaged by heat: month after sowing (0 = sowing month) in a warm climate,
   * and the Tmax from which a hot spell hurts pollination. Approximate agronomic values for alerts only
   * (not used in scores); they shift with sowing date, hybrid/cultivar and temperature.
   */
  flowering?: { offsetMonths: number; heatC: number };
}

export const CROPS: Record<CropId, Crop> = {
  soy: {
    id: 'soy', name: { es: 'Soja (1ª)', en: 'Soybean' }, family: 'fabaceae', role: 'cash',
    sowWindowSouth: [10, 11, 12], cycleMonths: 5, minCycleMonths: 5, maxCycleMonths: 6, gdd: { required: 1350, baseC: 10 }, kc: 0.8,
    droughtTolerance: 2, heatTolerance: 3, frostTolerant: false, nFixing: true, rootDepth: 2,
    residue: 2, groundCover: 2, marketPotential: 5, forageValue: 1,
    flowering: { offsetMonths: 2, heatC: 35 },
  },
  soy2: {
    id: 'soy2', name: { es: 'Soja de 2ª', en: 'Double-crop soybean' }, family: 'fabaceae', role: 'cash',
    sowWindowSouth: [12, 1], cycleMonths: 4, minCycleMonths: 4, maxCycleMonths: 5, gdd: { required: 1150, baseC: 10 }, kc: 0.75,
    droughtTolerance: 2, heatTolerance: 3, frostTolerant: false, nFixing: true, rootDepth: 2,
    residue: 1, groundCover: 2, marketPotential: 5, forageValue: 1,
    flowering: { offsetMonths: 2, heatC: 35 },
  },
  maize: {
    id: 'maize', name: { es: 'Maíz', en: 'Maize / corn' }, family: 'poaceae', role: 'cash',
    sowWindowSouth: [9, 10, 11, 12, 1], cycleMonths: 6, minCycleMonths: 6, maxCycleMonths: 7, gdd: { required: 1500, baseC: 10 }, kc: 0.85,
    droughtTolerance: 2, heatTolerance: 2, frostTolerant: false, nFixing: false, rootDepth: 2,
    residue: 5, groundCover: 3, marketPotential: 4, forageValue: 3,
    flowering: { offsetMonths: 2, heatC: 35 },
  },
  sorghum: {
    id: 'sorghum', name: { es: 'Sorgo', en: 'Sorghum' }, family: 'poaceae', role: 'cash',
    sowWindowSouth: [10, 11, 12, 1], cycleMonths: 5, minCycleMonths: 5, maxCycleMonths: 6, gdd: { required: 1400, baseC: 10 }, kc: 0.75,
    droughtTolerance: 4, heatTolerance: 5, frostTolerant: false, nFixing: false, rootDepth: 3,
    residue: 5, groundCover: 3, marketPotential: 3, forageValue: 4,
    flowering: { offsetMonths: 2, heatC: 38 },
  },
  sunflower: {
    id: 'sunflower', name: { es: 'Girasol', en: 'Sunflower' }, family: 'asteraceae', role: 'cash',
    sowWindowSouth: [8, 9, 10, 11], cycleMonths: 4, minCycleMonths: 4, maxCycleMonths: 5, gdd: { required: 1500, baseC: 7 }, kc: 0.75,
    droughtTolerance: 4, heatTolerance: 3, frostTolerant: false, nFixing: false, rootDepth: 3,
    residue: 2, groundCover: 2, marketPotential: 3, forageValue: 1,
    flowering: { offsetMonths: 2, heatC: 35 },
  },
  cotton: {
    id: 'cotton', name: { es: 'Algodón', en: 'Cotton' }, family: 'malvaceae', role: 'cash',
    sowWindowSouth: [10, 11, 12], cycleMonths: 6, minCycleMonths: 6, maxCycleMonths: 7, gdd: { required: 1800, baseC: 15 }, kc: 0.8,
    droughtTolerance: 4, heatTolerance: 5, frostTolerant: false, nFixing: false, rootDepth: 3,
    residue: 2, groundCover: 2, marketPotential: 3, forageValue: 0,
    flowering: { offsetMonths: 2, heatC: 38 },
  },
  wheat: {
    id: 'wheat', name: { es: 'Trigo', en: 'Wheat' }, family: 'poaceae', role: 'cash',
    sowWindowSouth: [4, 5, 6, 7], cycleMonths: 6, minCycleMonths: 6, maxCycleMonths: 10, gdd: { required: 2000, baseC: 0 }, kc: 0.75,
    droughtTolerance: 3, heatTolerance: 2, frostTolerant: true, nFixing: false, rootDepth: 2,
    residue: 4, groundCover: 4, marketPotential: 4, forageValue: 2,
    flowering: { offsetMonths: 4, heatC: 32 },
  },
  chickpea: {
    id: 'chickpea', name: { es: 'Garbanzo', en: 'Chickpea' }, family: 'fabaceae', role: 'cash',
    sowWindowSouth: [4, 5, 6, 7], cycleMonths: 6, minCycleMonths: 6, maxCycleMonths: 8, gdd: { required: 1600, baseC: 0 }, kc: 0.65,
    droughtTolerance: 4, heatTolerance: 2, frostTolerant: true, nFixing: true, rootDepth: 3,
    residue: 1, groundCover: 2, marketPotential: 3, forageValue: 1,
    flowering: { offsetMonths: 4, heatC: 32 },
  },
  vetch: {
    id: 'vetch', name: { es: 'Vicia (cultivo de servicio)', en: 'Hairy vetch (cover)' }, family: 'fabaceae', role: 'cover',
    sowWindowSouth: [3, 4, 5], cycleMonths: 6, minCycleMonths: 3, maxCycleMonths: 6, gdd: null, kc: 0.6,
    droughtTolerance: 3, heatTolerance: 2, frostTolerant: true, nFixing: true, rootDepth: 2,
    residue: 3, groundCover: 4, marketPotential: 0, forageValue: 3,
  },
  cereal_rye: {
    id: 'cereal_rye', name: { es: 'Centeno (cultivo de servicio)', en: 'Cereal rye (cover)' }, family: 'poaceae', role: 'cover',
    sowWindowSouth: [3, 4, 5, 6], cycleMonths: 6, minCycleMonths: 3, maxCycleMonths: 6, gdd: null, kc: 0.6,
    droughtTolerance: 4, heatTolerance: 2, frostTolerant: true, nFixing: false, rootDepth: 3,
    residue: 5, groundCover: 5, marketPotential: 0, forageValue: 3,
  },
  oat_cover: {
    id: 'oat_cover', name: { es: 'Avena (cultivo de servicio)', en: 'Oats (cover)' }, family: 'poaceae', role: 'cover',
    sowWindowSouth: [3, 4, 5, 6], cycleMonths: 5, minCycleMonths: 3, maxCycleMonths: 5, gdd: null, kc: 0.6,
    droughtTolerance: 3, heatTolerance: 2, frostTolerant: true, nFixing: false, rootDepth: 2,
    residue: 4, groundCover: 4, marketPotential: 0, forageValue: 4,
  },
  alfalfa: {
    id: 'alfalfa', name: { es: 'Alfalfa (pastura)', en: 'Alfalfa (pasture)' }, family: 'fabaceae', role: 'forage',
    sowWindowSouth: [3, 4, 5], cycleMonths: 24, minCycleMonths: 24, maxCycleMonths: 24, gdd: null, kc: 0.85,
    droughtTolerance: 4, heatTolerance: 4, frostTolerant: true, nFixing: true, rootDepth: 3,
    residue: 4, groundCover: 5, marketPotential: 3, forageValue: 5,
  },
};

export function getCrop(id: CropId): Crop {
  return CROPS[id];
}

/** Converts a southern-hemisphere calendar month to the equivalent northern one (and vice versa). */
export function shiftMonth(month: number, hemisphere: 'north' | 'south'): number {
  return hemisphere === 'south' ? month : ((month - 1 + 6) % 12) + 1;
}
