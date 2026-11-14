import type { FarmContext, Priorities, TemplateId } from '../engine/domain/rotations';
import { TEMPLATES } from '../engine/domain/rotations';

/**
 * What the farmer told us, kept separate from what the engine consumes.
 * `toFarmContext` is the only bridge and reports every value it had to assume.
 */

export type Access = 'owned' | 'shared' | 'contracted' | 'unavailable' | 'unknown';
export const ACCESS_LEVELS: Access[] = ['owned', 'shared', 'contracted', 'unavailable', 'unknown'];

export const RESOURCES = ['manual', 'tractor', 'seeder', 'sprayer', 'harvest', 'irrigation', 'coverMgmt'] as const;
export type ResourceId = (typeof RESOURCES)[number];

export type Availability = 'confirmed' | 'pending';

export const GOALS = ['water', 'cover', 'climate', 'soil', 'income', 'pests'] as const;
export type Goal = (typeof GOALS)[number];

export type Slope = FarmContext['slope'] | 'unknown';
export type SoilTexture = 'sandy' | 'loam' | 'clay' | 'unknown';
export type CurrentChoice = 'preset' | 'other' | 'none';

export interface PlacePreset {
  id: string;
  lat: number;
  lon: number;
  /** true when a saved NASA POWER snapshot exists for exactly this point. */
  hasSnapshot: boolean;
}

export const PLACE_PRESETS: PlacePreset[] = [
  { id: 'sde', lat: -27.7834, lon: -64.2642, hasSnapshot: true },
  { id: 'anatuya', lat: -28.4606, lon: -62.8347, hasSnapshot: false },
];

export interface FarmCase {
  lat: number;
  lon: number;
  placeId: string | null;
  years: number;
  currentChoice: CurrentChoice;
  currentTemplate: TemplateId;
  otherCrop: string;
  slope: Slope;
  soilTexture: SoilTexture;
  resources: Record<ResourceId, Access>;
  availability: Record<ResourceId, Availability>;
  /** Supplemental irrigation per crop season (mm); null = farmer does not know. */
  irrigationMm: number | null;
  goals: Goal[];
  priorities: Priorities;
  customPriorities: boolean;
}

const ALL_UNKNOWN = Object.fromEntries(RESOURCES.map((r) => [r, 'unknown'])) as Record<ResourceId, Access>;
const ALL_PENDING = Object.fromEntries(RESOURCES.map((r) => [r, 'pending'])) as Record<ResourceId, Availability>;

export const DEFAULT_CASE: FarmCase = {
  lat: -27.7834,
  lon: -64.2642,
  placeId: 'sde',
  years: 15,
  currentChoice: 'preset',
  currentTemplate: 'soy_maize_fallow',
  otherCrop: '',
  slope: 'unknown',
  soilTexture: 'unknown',
  resources: ALL_UNKNOWN,
  availability: ALL_PENDING,
  irrigationMm: null,
  goals: ['water', 'cover'],
  priorities: prioritiesFromGoals(['water', 'cover']),
  customPriorities: false,
};

export const PRESET_TEMPLATES: TemplateId[] = Object.values(TEMPLATES)
  .filter((t) => t.isPreset)
  .map((t) => t.id);

/** Plain-language goals → the engine's seven weights (0–5). Not a scientific mapping: a starting point the user can fine-tune. */
export function prioritiesFromGoals(goals: Goal[]): Priorities {
  const p: Priorities = { waterSecurity: 2, waterUse: 2, climateRisk: 2, soil: 2, erosion: 2, pests: 2, income: 2 };
  if (goals.includes('water')) Object.assign(p, { waterSecurity: 5, waterUse: 4 });
  if (goals.includes('cover')) Object.assign(p, { erosion: 5, soil: Math.max(p.soil, 4) });
  if (goals.includes('climate')) p.climateRisk = 5;
  if (goals.includes('soil')) p.soil = 5;
  if (goals.includes('income')) p.income = 5;
  if (goals.includes('pests')) p.pests = 5;
  return p;
}

export function hasIrrigationAccess(c: FarmCase): boolean {
  const a = c.resources.irrigation;
  return a === 'owned' || a === 'shared' || a === 'contracted';
}

/** Keys of assumptions made while translating the case for the engine (shown in the UI). */
export type AssumptionKey = 'slopeAssumed' | 'irrigationAssumedZero' | 'irrigationUnknownMm' | 'referenceSubstitute' | 'soilNotUsed';

export function toFarmContext(c: FarmCase): { farm: FarmContext; assumptions: AssumptionKey[] } {
  const assumptions: AssumptionKey[] = [];
  let slope: FarmContext['slope'];
  if (c.slope === 'unknown') {
    slope = 'gentle';
    assumptions.push('slopeAssumed');
  } else {
    slope = c.slope;
  }
  let irrigationMm = 0;
  if (hasIrrigationAccess(c)) {
    if (c.irrigationMm === null) assumptions.push('irrigationUnknownMm');
    else irrigationMm = Math.max(0, Math.min(800, c.irrigationMm));
  } else if (c.resources.irrigation === 'unknown') {
    assumptions.push('irrigationAssumedZero');
  }
  if (c.currentChoice !== 'preset') assumptions.push('referenceSubstitute');
  if (c.soilTexture !== 'unknown') assumptions.push('soilNotUsed');
  return { farm: { irrigationMm, slope, priorities: c.priorities }, assumptions };
}

export function matchingPreset(lat: number, lon: number): PlacePreset | undefined {
  return PLACE_PRESETS.find((p) => Math.abs(p.lat - lat) < 1e-4 && Math.abs(p.lon - lon) < 1e-4);
}

const STORAGE_KEY = 'field-shift-lab.case.v1';

export function loadCase(): FarmCase {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CASE;
    const parsed = JSON.parse(raw) as Partial<FarmCase>;
    const merged: FarmCase = {
      ...DEFAULT_CASE,
      ...parsed,
      resources: { ...DEFAULT_CASE.resources, ...(parsed.resources ?? {}) },
      availability: { ...DEFAULT_CASE.availability, ...(parsed.availability ?? {}) },
      priorities: { ...DEFAULT_CASE.priorities, ...(parsed.priorities ?? {}) },
    };
    if (!(merged.currentTemplate in TEMPLATES)) merged.currentTemplate = DEFAULT_CASE.currentTemplate;
    return merged;
  } catch {
    return DEFAULT_CASE;
  }
}

export function saveCase(c: FarmCase): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    // storage unavailable (private mode, quota): the app keeps working in memory
  }
}
