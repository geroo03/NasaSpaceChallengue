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
  /** Lot boundary drawn by the user, [lat, lon] vertices. Used for imagery and flight orders, not by the engine. */
  lotPolygon: [number, number][] | null;
  /** Where the lot boundary came from (shown as provenance). */
  lotSource: LotSource | null;
  /** Terrain derived from the lot (SRTM estimate or drone DSM). */
  terrain: TerrainSummary | null;
  /** Who set the slope the engine uses. */
  slopeSource: 'declared' | 'srtm' | 'drone' | null;
}

/** Plain copy of TerrainStats kept in the case (no imports from the imagery layer). */
export interface TerrainSummary {
  source: 'srtm' | 'drone';
  samples: number;
  meanM: number;
  reliefM: number;
  slopePct: number;
  aspectDeg: number | null;
  slopeClass: 'flat' | 'gentle' | 'steep';
  /** e.g. 'srtm/S29W063.tif' or the drone file name. */
  sources: string[];
}

export interface LotSource {
  kind: 'drawn' | 'file' | 'drone';
  fileName?: string;
  format?: string;
  /** Parcel name inside the file (cadastre nomenclature, layer…). */
  parcel?: string;
  /** Vertices were moved by hand after importing. */
  edited?: boolean;
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
  lotPolygon: null,
  lotSource: null,
  terrain: null,
  slopeSource: null,
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
export type AssumptionKey = 'slopeAssumed' | 'slopeFromSrtm' | 'slopeFromDrone' | 'irrigationAssumedZero' | 'irrigationUnknownMm' | 'irrigationPending' | 'referenceSubstitute' | 'soilNotUsed';

export function toFarmContext(c: FarmCase): { farm: FarmContext; assumptions: AssumptionKey[] } {
  const assumptions: AssumptionKey[] = [];
  let slope: FarmContext['slope'];
  if (c.slope === 'unknown') {
    slope = 'gentle';
    assumptions.push('slopeAssumed');
  } else {
    slope = c.slope;
    if (c.slopeSource === 'srtm') assumptions.push('slopeFromSrtm');
    if (c.slopeSource === 'drone') assumptions.push('slopeFromDrone');
  }
  let irrigationMm = 0;
  if (hasIrrigationAccess(c)) {
    const needsConfirmation = c.resources.irrigation === 'shared' || c.resources.irrigation === 'contracted';
    if (needsConfirmation && c.availability.irrigation !== 'confirmed') assumptions.push('irrigationPending');
    else if (c.irrigationMm === null) assumptions.push('irrigationUnknownMm');
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

function validCoordinates(lat: unknown, lon: unknown): boolean {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -60 && lat <= 75 &&
    typeof lon === 'number' && Number.isFinite(lon) && lon >= -180 && lon <= 180;
}

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
    // Old versions could persist an empty input as null. Recover the point without losing the other answers.
    if (!validCoordinates(merged.lat, merged.lon)) {
      merged.lat = DEFAULT_CASE.lat;
      merged.lon = DEFAULT_CASE.lon;
      merged.placeId = DEFAULT_CASE.placeId;
    }
    if (!(merged.currentTemplate in TEMPLATES)) merged.currentTemplate = DEFAULT_CASE.currentTemplate;
    return merged;
  } catch {
    return DEFAULT_CASE;
  }
}

export function saveCase(c: FarmCase): void {
  if (!validCoordinates(c.lat, c.lon)) return; // retain the last valid case while a coordinate is being edited
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    // storage unavailable (private mode, quota): the app keeps working in memory
  }
}

/** Area-weighted centroid of a small lat/lon polygon, as [lat, lon] (planar approximation, fine for a field). */
export function ringCentroid(ring: [number, number][]): [number, number] | null {
  if (ring.length < 3) return null;
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [y1, x1] = ring[i]!;
    const [y2, x2] = ring[(i + 1) % ring.length]!;
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  if (Math.abs(a) < 1e-14) return null;
  return [cy / (3 * a), cx / (3 * a)];
}

/** Great-circle distance in km. */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r;
  const dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** SRTM estimates below this many samples (~4.5 ha at 30 m) are shown but not applied to the slope. */
export const MIN_TERRAIN_SAMPLES = 50;

/**
 * Sets (or clears) the lot. Terrain belongs to a boundary, so it is reset and re-derived; a slope that came
 * from terrain goes back to unknown until the new estimate arrives. With `movePoint`, the climate point
 * moves to the lot centre (the wizard's lot-first flow); the results view keeps the analysed point and warns instead.
 */
export function withLot(c: FarmCase, ring: [number, number][] | null, source: LotSource | null, opts: { movePoint: boolean }): FarmCase {
  const next: FarmCase = { ...c, lotPolygon: ring, lotSource: ring ? source : null, terrain: null };
  if (c.slopeSource === 'srtm' || c.slopeSource === 'drone') {
    next.slope = 'unknown';
    next.slopeSource = null;
  }
  if (ring && opts.movePoint) {
    const centre = ringCentroid(ring);
    if (centre) {
      next.lat = Number(centre[0].toFixed(5));
      next.lon = Number(centre[1].toFixed(5));
      next.placeId = null;
    }
  }
  return next;
}

/**
 * Stores lot terrain and, unless the farmer declared the slope, uses its slope class for the engine.
 * A drone measurement is never replaced by an SRTM estimate.
 */
export function withTerrain(c: FarmCase, terrain: TerrainSummary): FarmCase {
  if (terrain.source === 'srtm' && c.terrain?.source === 'drone') return c;
  const next: FarmCase = { ...c, terrain };
  const enough = terrain.source === 'drone' || terrain.samples >= MIN_TERRAIN_SAMPLES;
  const declared = c.slopeSource === 'declared' || (c.slopeSource === null && c.slope !== 'unknown');
  if (!declared && enough) {
    next.slope = terrain.slopeClass;
    next.slopeSource = terrain.source;
  }
  return next;
}

/** The farmer answers the slope question; "I don't know" falls back to the lot terrain when there is one. */
export function withDeclaredSlope(c: FarmCase, slope: Slope): FarmCase {
  if (slope !== 'unknown') return { ...c, slope, slopeSource: 'declared' };
  const t = c.terrain;
  if (t && (t.source === 'drone' || t.samples >= MIN_TERRAIN_SAMPLES)) return { ...c, slope: t.slopeClass, slopeSource: t.source };
  return { ...c, slope: 'unknown', slopeSource: null };
}
