import type { ClimateProfile, MonthlyClimate } from '../analysis/climate';
import { CROPS, getCrop, shiftMonth, type Crop, type CropFamily, type CropId } from './crops';

/**
 * Rotation engine.
 *
 * A rotation is a 2-year (24-month) cycle that repeats. Months are indexed 0–23 on a
 * "growing-year" axis that starts in mid-winter (July in the south, January in the north),
 * which makes the index hemisphere-independent: templates are written once.
 *
 * The engine is deliberately rule-based and transparent: every score can be traced back to
 * NASA-derived climate indicators and to crop traits. That is a feature for farmers and judges.
 * An SI/ML layer can be added on top (see README) without losing this explainability.
 */

export const ROTATION_MONTHS = 24;

export interface Slot {
  crop: CropId;
  /** Sowing month in SOUTHERN-hemisphere calendar terms (1–12). */
  sowMonthSouth: number;
  /** Rotation year, 1 or 2 (growing years). */
  year: 1 | 2;
  /** Optional override, used when a cover crop is terminated early. */
  months?: number;
}

export type TemplateId =
  | 'soy_maize_fallow'
  | 'soy_mono'
  | 'maize_wheat_soy2'
  | 'cotton_maize'
  | 'wheat_soy2_cont'
  | 'drought_sorghum_chickpea'
  | 'diversified_sunflower_vetch'
  | 'cotton_wheat_soy2'
  | 'pasture_alfalfa'
  | 'sorghum_soy';

export interface RotationTemplate {
  id: TemplateId;
  slots: Slot[];
  /** Whether the engine should fill long fallow gaps with service (cover) crops. */
  fillCovers: boolean;
  /** Usable as a "current rotation" preset in the UI. */
  isPreset: boolean;
}

export const TEMPLATES: Record<TemplateId, RotationTemplate> = {
  soy_maize_fallow: {
    id: 'soy_maize_fallow', isPreset: true, fillCovers: true,
    slots: [{ crop: 'soy', sowMonthSouth: 11, year: 1 }, { crop: 'maize', sowMonthSouth: 12, year: 2 }],
  },
  soy_mono: {
    id: 'soy_mono', isPreset: true, fillCovers: true,
    slots: [{ crop: 'soy', sowMonthSouth: 11, year: 1 }, { crop: 'soy', sowMonthSouth: 11, year: 2 }],
  },
  maize_wheat_soy2: {
    id: 'maize_wheat_soy2', isPreset: true, fillCovers: true,
    slots: [
      { crop: 'maize', sowMonthSouth: 10, year: 1 },
      { crop: 'wheat', sowMonthSouth: 6, year: 1 },
      { crop: 'soy2', sowMonthSouth: 12, year: 2 },
    ],
  },
  cotton_maize: {
    id: 'cotton_maize', isPreset: true, fillCovers: true,
    slots: [{ crop: 'cotton', sowMonthSouth: 11, year: 1 }, { crop: 'maize', sowMonthSouth: 12, year: 2 }],
  },
  wheat_soy2_cont: {
    id: 'wheat_soy2_cont', isPreset: true, fillCovers: false,
    slots: [
      { crop: 'soy2', sowMonthSouth: 12, year: 1 },
      { crop: 'wheat', sowMonthSouth: 6, year: 1 },
      { crop: 'soy2', sowMonthSouth: 12, year: 2 },
      { crop: 'wheat', sowMonthSouth: 6, year: 2 },
    ],
  },
  drought_sorghum_chickpea: {
    id: 'drought_sorghum_chickpea', isPreset: false, fillCovers: true,
    slots: [
      { crop: 'sorghum', sowMonthSouth: 12, year: 1 },
      { crop: 'chickpea', sowMonthSouth: 5, year: 1 },
      { crop: 'soy', sowMonthSouth: 11, year: 2 },
    ],
  },
  diversified_sunflower_vetch: {
    id: 'diversified_sunflower_vetch', isPreset: false, fillCovers: true,
    slots: [
      { crop: 'sunflower', sowMonthSouth: 9, year: 1 },
      { crop: 'vetch', sowMonthSouth: 4, year: 1 },
      { crop: 'maize', sowMonthSouth: 12, year: 2 },
    ],
  },
  cotton_wheat_soy2: {
    id: 'cotton_wheat_soy2', isPreset: false, fillCovers: true,
    slots: [
      { crop: 'cotton', sowMonthSouth: 11, year: 1 },
      { crop: 'wheat', sowMonthSouth: 6, year: 1 },
      { crop: 'soy2', sowMonthSouth: 12, year: 2 },
    ],
  },
  pasture_alfalfa: {
    id: 'pasture_alfalfa', isPreset: false, fillCovers: false,
    slots: [{ crop: 'alfalfa', sowMonthSouth: 4, year: 1 }],
  },
  sorghum_soy: {
    id: 'sorghum_soy', isPreset: false, fillCovers: true,
    slots: [{ crop: 'sorghum', sowMonthSouth: 12, year: 1 }, { crop: 'soy', sowMonthSouth: 11, year: 2 }],
  },
};

export const DIMENSIONS = ['waterSecurity', 'waterUse', 'climateRisk', 'soil', 'erosion', 'pests', 'income'] as const;
export type Dimension = (typeof DIMENSIONS)[number];
export type Priorities = Record<Dimension, number>; // 0–5 each

export interface FarmContext {
  /** Supplemental irrigation available per crop season (mm). 0 = rainfed. */
  irrigationMm: number;
  slope: 'flat' | 'gentle' | 'steep';
  priorities: Priorities;
  /**
   * Plant-available water of the root zone at full wetness (mm, ~0–100 cm), e.g. from SoilGrids
   * field capacity − wilting point. Omitted → the generic 120 mm assumption.
   */
  soilPawMm?: number;
}

/** A translatable message: the UI owns the wording, the engine owns the facts. */
export interface Msg {
  key: string;
  params?: Record<string, string | number>;
}

export interface SlotAssessment {
  slot: Slot;
  crop: Crop;
  startIndex: number;
  months: number[]; // occupied month indexes 0–23
  demandMm: number;
  supplyMm: number;
  deficitRatio: number;
  frostRisk: number;
  heatRisk: number;
  addedAsCover: boolean;
}

export interface MonthCell {
  index: number;
  calendarMonth: number;
  crop: CropId | null;
  bare: boolean;
  /** 0–1 composite climate pressure for whatever is (or is not) in the field that month */
  pressure: number;
}

export interface StrategyResult {
  id: string;
  templateId: TemplateId | 'current_plus_covers';
  isCurrent: boolean;
  slots: SlotAssessment[];
  timeline: MonthCell[];
  scores: Record<Dimension, number>;
  overall: number;
  bareMonths: number;
  /** false when the rotation hits hard agronomic limits here (shown, never recommended). */
  suitable: boolean;
  unsuitable: Msg[];
  rationale: Msg[];
  evidence: Msg[];
  benefits: Msg[];
  tradeoffs: Msg[];
  risks: Msg[];
  gaps: Msg[];
}

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

export function slotStartIndex(slot: Slot): number {
  return ((slot.sowMonthSouth - 7 + 12) % 12) + (slot.year - 1) * 12;
}

export function calendarMonthAt(index: number, hemisphere: 'north' | 'south'): number {
  const south = ((index + 6) % 12) + 1;
  return shiftMonth(south, hemisphere);
}

export function occupiedMonths(slot: Slot): number[] {
  const start = slotStartIndex(slot);
  const n = Math.min(ROTATION_MONTHS, slot.months ?? getCrop(slot.crop).cycleMonths);
  return Array.from({ length: n }, (_, i) => (start + i) % ROTATION_MONTHS);
}

/** Returns the overlapping month indexes, empty when the rotation is physically feasible. */
export function findOverlaps(slots: Slot[]): number[] {
  const count = new Array<number>(ROTATION_MONTHS).fill(0);
  for (const s of slots) for (const m of occupiedMonths(s)) count[m]! += 1;
  return count.flatMap((c, i) => (c > 1 ? [i] : []));
}

/** Contiguous free stretches on the circular 24-month axis. */
export function findGaps(slots: Slot[]): { start: number; length: number }[] {
  const occ = new Array<boolean>(ROTATION_MONTHS).fill(false);
  for (const s of slots) for (const m of occupiedMonths(s)) occ[m] = true;
  if (occ.every((o) => !o)) return [{ start: 0, length: ROTATION_MONTHS }];
  const anchor = occ.findIndex((o) => o); // start scanning right after an occupied month
  const gaps: { start: number; length: number }[] = [];
  let cur: { start: number; length: number } | null = null;
  for (let k = 1; k <= ROTATION_MONTHS; k++) {
    const i = (anchor + k) % ROTATION_MONTHS;
    if (!occ[i]) {
      if (cur) cur.length += 1;
      else cur = { start: i, length: 1 };
    } else if (cur) {
      gaps.push(cur);
      cur = null;
    }
  }
  if (cur) gaps.push(cur);
  return gaps;
}

// ---------------------------------------------------------------------------
// Cover-crop gap filling
// ---------------------------------------------------------------------------

const COVER_CANDIDATES: CropId[] = ['vetch', 'cereal_rye', 'oat_cover'];
const MIN_GAP_FOR_COVER = 4;

export function fillGapsWithCovers(slots: Slot[], climate: ClimateProfile): Slot[] {
  const out = [...slots];
  for (const gap of findGaps(slots)) {
    if (gap.length < MIN_GAP_FOR_COVER) continue;
    const nextIndex = (gap.start + gap.length) % ROTATION_MONTHS;
    const nextCrop = slots.find((s) => slotStartIndex(s) === nextIndex);
    const nextIsGrass = nextCrop ? getCrop(nextCrop.crop).family === 'poaceae' : false;
    const gapMonths = Array.from({ length: gap.length }, (_, i) => (gap.start + i) % ROTATION_MONTHS);
    const gapBalance = gapMonths.reduce((acc, i) => acc + monthAt(climate, i).balanceMm, 0);
    const dry = climate.annual.aridityIndex < 0.65 || gapBalance < -250;

    let best: { slot: Slot; score: number } | null = null;
    for (const id of COVER_CANDIDATES) {
      const crop = getCrop(id);
      for (const sowSouth of crop.sowWindowSouth) {
        const idx = ((sowSouth - 7 + 12) % 12) + 12 * Math.floor(gap.start / 12);
        const offsets = [idx, (idx + 12) % ROTATION_MONTHS].map((i) => (i - gap.start + ROTATION_MONTHS) % ROTATION_MONTHS);
        const offset = Math.min(...offsets);
        if (offset > 1) continue; // sow within a month of the previous harvest
        // leave the last gap month free: termination + residue settling before the next crop
        const months = Math.min(crop.cycleMonths, gap.length - offset - 1);
        if (months < crop.minCycleMonths) continue;
        const start = (gap.start + offset) % ROTATION_MONTHS;
        const slot: Slot = {
          crop: id,
          sowMonthSouth: ((start + 6) % 12) + 1,
          year: start < 12 ? 1 : 2,
          months,
        };
        const score =
          (nextIsGrass && crop.nFixing ? 2 : 0) + crop.residue * 0.3 + (dry ? crop.droughtTolerance * 0.4 : 0) + months * 0.1;
        if (!best || score > best.score) best = { slot, score };
      }
    }
    if (best) out.push(best.slot);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Location-adaptive scheduling (sowing date + thermal-time cycle length)
// ---------------------------------------------------------------------------

const DAYS_PER_MONTH = 30.4;
const GDD_UPPER_C = 30; // standard upper cutoff for degree-day accumulation

/**
 * Months needed to reach maturity when sown at `startIndex`, from NASA POWER monthly mean temperature.
 * Clamped to the crop's [cycleMonths, maxCycleMonths]: in hot places photoperiod and variety choice
 * keep cycles from shrinking much, in cool places thermal time stretches them (e.g. winter wheat).
 */
export function cycleMonthsAt(crop: Crop, startIndex: number, climate: ClimateProfile): number {
  if (!crop.gdd) return crop.cycleMonths;
  let acc = 0;
  for (let k = 0; k < crop.maxCycleMonths; k++) {
    const mc = monthAt(climate, (startIndex + k) % ROTATION_MONTHS);
    const tmean = Math.min(GDD_UPPER_C, (mc.tmaxC + mc.tminC) / 2);
    acc += Math.max(0, tmean - crop.gdd.baseC) * DAYS_PER_MONTH;
    if (acc >= crop.gdd.required) return Math.max(crop.cycleMonths, k + 1);
  }
  return crop.maxCycleMonths;
}

function slotRisk(a: SlotAssessment): number {
  return Math.max(a.frostRisk, a.heatRisk, a.deficitRatio * 0.7);
}

/**
 * Picks, for every slot, the sowing month inside the crop's window (and the resulting thermal-time
 * cycle length) that minimises climate risk at THIS location, without overlapping other crops.
 * Exhaustive search: ≤ 5 options per slot and ≤ 4 slots ⇒ ≤ 625 combinations, trivial to evaluate.
 * Returns null when no feasible schedule exists (the rotation does not fit this climate).
 */
export function optimizeSchedule(slots: Slot[], climate: ClimateProfile, farm: FarmContext): Slot[] | null {
  const options: { slot: Slot; shift: number }[][] = slots.map((base) => {
    const crop = getCrop(base.crop);
    if (!crop.gdd) return [{ slot: base, shift: 0 }];
    const baseIdx = slotStartIndex(base);
    return crop.sowWindowSouth.map((m) => {
      let delta = (m - base.sowMonthSouth + 12) % 12;
      if (delta > 6) delta -= 12;
      const idx = (baseIdx + delta + ROTATION_MONTHS) % ROTATION_MONTHS;
      const slot: Slot = { crop: base.crop, sowMonthSouth: m, year: idx < 12 ? 1 : 2 };
      return { slot: { ...slot, months: cycleMonthsAt(crop, idx, climate) }, shift: Math.abs(delta) };
    });
  });

  let best: { slots: Slot[]; cost: number } | null = null;
  const pick = (i: number, chosen: { slot: Slot; shift: number }[]): void => {
    if (i === options.length) {
      const candidate = chosen.map((c) => c.slot);
      if (findOverlaps(candidate).length) return;
      const cost =
        candidate.reduce((acc, s) => acc + (getCrop(s.crop).role === 'cover' ? 0 : slotRisk(assessSlot(s, climate, farm))), 0) +
        chosen.reduce((acc, c) => acc + 0.03 * c.shift, 0); // prefer customary dates on ties
      if (!best || cost < best.cost) best = { slots: candidate, cost };
      return;
    }
    for (const opt of options[i]!) pick(i + 1, [...chosen, opt]);
  };
  pick(0, []);
  return best ? (best as { slots: Slot[]; cost: number }).slots : null;
}

/** Hard agronomic limits: beyond these a rotation is not a realistic option at this location. */
const UNSUITABLE_FROST = 0.5;
const UNSUITABLE_DEFICIT_RAINFED = 0.75;

function unsuitableReasons(assessed: SlotAssessment[], farm: FarmContext): Msg[] {
  const out: Msg[] = [];
  for (const a of assessed) {
    if (a.crop.role === 'cover') continue;
    if (a.frostRisk >= UNSUITABLE_FROST) out.push({ key: 'unsuitable.frost', params: { crop: a.crop.id, prob: Math.round(a.frostRisk * 100) } });
    if (farm.irrigationMm === 0 && a.deficitRatio >= UNSUITABLE_DEFICIT_RAINFED) {
      out.push({ key: 'unsuitable.water', params: { crop: a.crop.id, deficit: Math.round(a.deficitRatio * 100) } });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

function monthAt(climate: ClimateProfile, index: number): MonthlyClimate {
  const m = calendarMonthAt(index, climate.hemisphere);
  const found = climate.monthly[m - 1];
  if (!found) throw new Error(`Missing climate for month ${m}`);
  return found;
}

const EFFECTIVE_RAIN = 0.75; // share of rainfall that infiltrates and is usable (USDA-SCS rule of thumb)
export const DEFAULT_PAW_MM = 120; // assumed plant-available water in the root zone when GWETROOT ≈ 1 (loam, ~1 m)

export function assessSlot(slot: Slot, climate: ClimateProfile, farm: FarmContext, addedAsCover = false): SlotAssessment {
  const crop = getCrop(slot.crop);
  const months = occupiedMonths(slot);
  const startIndex = slotStartIndex(slot);
  const startClimate = monthAt(climate, startIndex);

  let demand = 0;
  let rain = 0;
  let heatDays = 0;
  let frostRisk = 0;
  months.forEach((i, k) => {
    const mc = monthAt(climate, i);
    demand += crop.kc * mc.et0Mm;
    rain += EFFECTIVE_RAIN * mc.precipMm;
    heatDays += mc.heatDays;
    if (!crop.frostTolerant) {
      // Sowing month: farmers sow after the last frost, so only half of its frost probability counts.
      // Harvest month: a frost at physiological maturity does little damage, so it is ignored.
      const isLast = k === months.length - 1 && months.length > 2;
      const weight = k === 0 ? 0.5 : isLast ? 0 : 1;
      frostRisk = Math.max(frostRisk, weight * mc.frostProb);
    }
  });
  const paw = farm.soilPawMm !== undefined && Number.isFinite(farm.soilPawMm) ? Math.max(0, Math.min(400, farm.soilPawMm)) : DEFAULT_PAW_MM;
  const stored = paw * (startClimate.rootWetness ?? 0.4);
  const irrigation = crop.role === 'cover' ? 0 : farm.irrigationMm;
  const supply = rain + stored + irrigation;
  const deficitRatio = demand > 0 ? clamp01((demand - supply) / demand) : 0;
  const heatShare = heatDays / (30.4 * months.length);
  // Calibrated on NASA POWER for the Chaco (≈90 days ≥35 °C/yr): sensitive crops ≈0.4–0.6, tolerant ≈0.
  const heatRisk = clamp01(heatShare * 1.5 * ((5 - crop.heatTolerance) / 4));

  return { slot, crop, startIndex, months, demandMm: demand, supplyMm: supply, deficitRatio, frostRisk, heatRisk, addedAsCover };
}

export function buildTimeline(assessed: SlotAssessment[], climate: ClimateProfile): MonthCell[] {
  const cells: MonthCell[] = [];
  for (let i = 0; i < ROTATION_MONTHS; i++) {
    const owner = assessed.find((a) => a.months.includes(i));
    const mc = monthAt(climate, i);
    const erosive = clamp01(mc.extremeRainDays / 2 + mc.precipMm / 250);
    const pressure = owner
      ? Math.max(owner.frostRisk, owner.heatRisk, owner.deficitRatio * 0.8)
      : erosive; // bare soil: pressure = erosion exposure
    cells.push({ index: i, calendarMonth: calendarMonthAt(i, climate.hemisphere), crop: owner?.crop.id ?? null, bare: !owner, pressure });
  }
  return cells;
}

const SLOPE_FACTOR: Record<FarmContext['slope'], number> = { flat: 0.6, gentle: 1, steep: 1.5 };

export function scoreDimensions(assessed: SlotAssessment[], climate: ClimateProfile, farm: FarmContext): Record<Dimension, number> {
  const productive = assessed.filter((a) => a.crop.role !== 'cover');
  const covers = assessed.filter((a) => a.crop.role === 'cover');
  const meanDeficit = mean(productive.map((a) => a.deficitRatio));

  // Water security: will the productive crops get the water they need?
  const coverCompetition = covers.filter((c) => c.deficitRatio > 0.5).length;
  const waterSecurity = 100 * (1 - meanDeficit) - 6 * coverCompetition;

  // Water use: total crop demand vs. what falls from the sky over the 2-year cycle.
  const totalDemand = sum(assessed.map((a) => a.demandMm));
  const ratio = climate.annual.precipMm > 0 ? totalDemand / (2 * climate.annual.precipMm) : 2;
  // ratio 0.6 → 100 (very frugal), 1.5 → 50, 2.4 → 0. Calibrated so semi-arid sites still discriminate.
  const waterUse = 100 * clamp01(1 - (ratio - 0.6) / 1.8);

  // Climate risk (inverse): frost, heat and drought pressure on productive crops.
  const slotRisk = productive.map((a) => Math.max(a.frostRisk, a.heatRisk, a.deficitRatio * 0.7));
  const climateRisk = 100 * (1 - mean(slotRisk));

  // Soil health
  const months = new Set(assessed.flatMap((a) => a.months));
  const legumes = assessed.filter((a) => a.crop.nFixing).length;
  const residue = weightedMean(assessed.map((a) => [a.crop.residue, a.months.length]));
  const families = new Set(assessed.map((a) => a.crop.family)).size;
  const soil =
    Math.min(2, legumes) * 12 +
    (residue / 5) * 25 +
    (assessed.some((a) => a.crop.rootDepth === 3) ? 10 : 0) +
    (months.size / ROTATION_MONTHS) * 25 +
    (families >= 3 ? 16 : families === 2 ? 8 : 0);

  // Erosion protection, weighted by how erosive each month's rain is.
  let wSum = 0;
  let protectedSum = 0;
  for (let i = 0; i < ROTATION_MONTHS; i++) {
    const mc = monthAt(climate, i);
    const w = 1 + 3 * mc.extremeRainDays + mc.precipMm / 100;
    const owner = assessed.find((a) => a.months.includes(i));
    let cover = owner ? owner.crop.groundCover / 5 : 0;
    if (!owner) {
      // residue of the previous crop still protects the surface for a while
      const prev = assessed.find((a) => {
        const end = (a.startIndex + a.months.length - 1) % ROTATION_MONTHS;
        const since = (i - end + ROTATION_MONTHS) % ROTATION_MONTHS;
        return since >= 1 && since <= 3;
      });
      cover = prev ? (prev.crop.residue / 5) * 0.4 : 0;
    }
    wSum += w;
    protectedSum += w * cover;
  }
  const protection = wSum > 0 ? protectedSum / wSum : 0;
  const erosion = 100 * (1 - (1 - protection) * SLOPE_FACTOR[farm.slope]);

  // Pest & disease cycle break
  const seq = [...productive].sort((a, b) => a.startIndex - b.startIndex).map((a) => a.crop.family);
  let sameConsecutive = 0;
  for (let i = 0; i < seq.length; i++) {
    if (seq.length > 1 && seq[i] === seq[(i + 1) % seq.length]) sameConsecutive++;
  }
  const distinct = new Set<CropFamily>(assessed.map((a) => a.crop.family)).size;
  const pests = 20 + (distinct - 1) * 25 - sameConsecutive * 20 + (covers.length ? 10 : 0);

  // Income potential (generic, discounted by expected water stress)
  const cash = productive.filter((a) => a.crop.marketPotential > 0);
  const market = mean(cash.map((a) => a.crop.marketPotential));
  const income = ((market / 5) * 70 + (Math.min(4, cash.length) / 4) * 30) * (1 - meanDeficit * 0.5);

  return {
    waterSecurity: clampScore(waterSecurity),
    waterUse: clampScore(waterUse),
    climateRisk: clampScore(climateRisk),
    soil: clampScore(soil),
    erosion: clampScore(erosion),
    pests: clampScore(pests),
    income: clampScore(income),
  };
}

export function overallScore(scores: Record<Dimension, number>, priorities: Priorities): number {
  let wSum = 0;
  let total = 0;
  for (const d of DIMENSIONS) {
    const w = Math.max(0, priorities[d]);
    wSum += w;
    total += w * scores[d];
  }
  return wSum > 0 ? total / wSum : mean(DIMENSIONS.map((d) => scores[d]));
}

// ---------------------------------------------------------------------------
// Strategy generation + explanation
// ---------------------------------------------------------------------------

export function evaluateRotation(
  id: string,
  templateId: StrategyResult['templateId'],
  slots: Slot[],
  originalSlots: Slot[],
  climate: ClimateProfile,
  farm: FarmContext,
  isCurrent: boolean,
): Omit<StrategyResult, 'benefits' | 'tradeoffs'> {
  // fillGapsWithCovers keeps the original slot objects, so reference equality identifies added covers.
  const isOriginal = (s: Slot) => originalSlots.includes(s);
  const assessed = slots.map((s) => assessSlot(s, climate, farm, !isOriginal(s)));
  const timeline = buildTimeline(assessed, climate);
  const scores = scoreDimensions(assessed, climate, farm);
  const bareMonths = timeline.filter((c) => c.bare).length;
  const unsuitable = unsuitableReasons(assessed, farm);
  return {
    id,
    templateId,
    isCurrent,
    slots: assessed,
    timeline,
    scores,
    overall: overallScore(scores, farm.priorities),
    bareMonths,
    suitable: unsuitable.length === 0,
    unsuitable,
    rationale: rationaleFor(templateId, assessed),
    evidence: evidenceFor(assessed, timeline, climate),
    risks: risksFor(assessed, climate, farm),
    gaps: gapsFor(templateId, assessed),
  };
}

export interface CompareOptions {
  currentTemplate: TemplateId;
  /** How many alternatives to return besides the current rotation. */
  alternatives?: number;
}

/** A catalogue rotation that did not make it to the comparison, with the reason. */
export interface DiscardedStrategy {
  templateId: TemplateId | 'current_plus_covers';
  /** noSchedule: no sowing dates fit this climate; unsuitable: hits a hard limit; outranked: viable but scored lower. */
  reason: 'noSchedule' | 'unsuitable' | 'outranked';
  messages: Msg[];
  overall: number | null;
}

export interface ComparisonOutcome {
  strategies: StrategyResult[];
  discarded: DiscardedStrategy[];
}

export function compareStrategies(climate: ClimateProfile, farm: FarmContext, opts: CompareOptions): StrategyResult[] {
  return compareStrategiesDetailed(climate, farm, opts).strategies;
}

/**
 * Same selection as `compareStrategies`, but also reports every catalogue rotation that was left out
 * and why. It does not change any formula or threshold.
 */
export function compareStrategiesDetailed(climate: ClimateProfile, farm: FarmContext, opts: CompareOptions): ComparisonOutcome {
  const nAlt = opts.alternatives ?? 3;
  const current = TEMPLATES[opts.currentTemplate];

  // The current rotation is evaluated with locally-adapted dates as well: the farmer already sows
  // at sensible dates for their place, so comparing against a mis-timed baseline would be unfair.
  const currentSlots = optimizeSchedule(current.slots, climate, farm) ?? current.slots;
  const currentEval = evaluateRotation('current', current.id, currentSlots, currentSlots, climate, farm, true);

  const candidates: Omit<StrategyResult, 'benefits' | 'tradeoffs'>[] = [];
  if (current.fillCovers) {
    const withCovers = fillGapsWithCovers(currentSlots, climate);
    if (withCovers.length > currentSlots.length) {
      candidates.push(evaluateRotation('current_plus_covers', 'current_plus_covers', withCovers, currentSlots, climate, farm, false));
    }
  }
  const discarded: DiscardedStrategy[] = [];
  for (const t of Object.values(TEMPLATES)) {
    if (t.id === current.id) continue;
    const scheduled = optimizeSchedule(t.slots, climate, farm);
    if (!scheduled) {
      // cannot be fitted into this climate's calendar
      discarded.push({ templateId: t.id, reason: 'noSchedule', messages: [], overall: null });
      continue;
    }
    const slots = t.fillCovers ? fillGapsWithCovers(scheduled, climate) : scheduled;
    candidates.push(evaluateRotation(t.id, t.id, slots, scheduled, climate, farm, false));
  }

  const ranked = candidates.filter((c) => c.suitable).sort((a, b) => b.overall - a.overall);
  const picked = ranked.slice(0, nAlt);
  for (const c of candidates) {
    if (!c.suitable) discarded.push({ templateId: c.templateId, reason: 'unsuitable', messages: c.unsuitable, overall: c.overall });
  }
  for (const c of ranked.slice(nAlt)) {
    discarded.push({ templateId: c.templateId, reason: 'outranked', messages: [], overall: c.overall });
  }
  return { strategies: [currentEval, ...picked].map((r) => withDeltas(r, currentEval)), discarded };
}

function withDeltas(r: Omit<StrategyResult, 'benefits' | 'tradeoffs'>, current: Omit<StrategyResult, 'benefits' | 'tradeoffs'>): StrategyResult {
  const benefits: Msg[] = [];
  const tradeoffs: Msg[] = [];
  if (!r.isCurrent) {
    for (const d of DIMENSIONS) {
      const delta = Math.round(r.scores[d] - current.scores[d]);
      if (delta >= 8) benefits.push({ key: `benefit.${d}`, params: { delta } });
      else if (delta <= -8) tradeoffs.push({ key: `tradeoff.${d}`, params: { delta: Math.abs(delta) } });
    }
    const bareDelta = current.bareMonths - r.bareMonths;
    if (bareDelta > 0) benefits.push({ key: 'benefit.bareMonths', params: { months: bareDelta } });
  }
  return { ...r, benefits, tradeoffs };
}

function rationaleFor(templateId: StrategyResult['templateId'], assessed: SlotAssessment[]): Msg[] {
  const msgs: Msg[] = [{ key: `rationale.${templateId}` }];
  const covers = assessed.filter((a) => a.addedAsCover && a.crop.role === 'cover');
  if (covers.length) {
    msgs.push({ key: 'rationale.coversAdded', params: { crops: covers.map((c) => c.crop.id).join(',') } });
  }
  return msgs;
}

function evidenceFor(assessed: SlotAssessment[], timeline: MonthCell[], climate: ClimateProfile): Msg[] {
  const out: Msg[] = [];
  for (const a of assessed) {
    if (a.crop.role === 'cover') continue;
    out.push({
      key: 'evidence.water',
      params: { crop: a.crop.id, demand: Math.round(a.demandMm), supply: Math.round(a.supplyMm), deficit: Math.round(a.deficitRatio * 100) },
    });
    if (a.frostRisk >= 0.2) out.push({ key: 'evidence.frost', params: { crop: a.crop.id, prob: Math.round(a.frostRisk * 100) } });
    const heatDays = a.months.reduce((acc, i) => acc + (climate.monthly[timeline[i]!.calendarMonth - 1]?.heatDays ?? 0), 0);
    if (heatDays >= 5) out.push({ key: 'evidence.heat', params: { crop: a.crop.id, days: Math.round(heatDays) } });
  }
  const bare = timeline.filter((c) => c.bare);
  if (bare.length) {
    const erosiveRain = bare.reduce((acc, c) => acc + (climate.monthly[c.calendarMonth - 1]?.precipMm ?? 0), 0);
    out.push({ key: 'evidence.bare', params: { months: bare.length, rain: Math.round(erosiveRain) } });
  }
  return out;
}

function risksFor(assessed: SlotAssessment[], climate: ClimateProfile, farm: FarmContext): Msg[] {
  const out: Msg[] = [];
  for (const a of assessed) {
    if (a.crop.role !== 'cover' && a.deficitRatio > 0.3) {
      out.push({ key: farm.irrigationMm > 0 ? 'risk.deficitIrrigated' : 'risk.deficit', params: { crop: a.crop.id, deficit: Math.round(a.deficitRatio * 100) } });
    }
    if (a.frostRisk >= 0.3) out.push({ key: 'risk.frost', params: { crop: a.crop.id, prob: Math.round(a.frostRisk * 100) } });
    if (a.heatRisk >= 0.25) out.push({ key: 'risk.heat', params: { crop: a.crop.id } });
    if (a.crop.role === 'cover' && a.deficitRatio > 0.5) out.push({ key: 'risk.coverWater', params: { crop: a.crop.id } });
  }
  if (assessed.some((a) => a.crop.id === 'alfalfa')) out.push({ key: 'risk.alfalfaMarket' });
  if (assessed.some((a) => a.crop.id === 'soy2')) out.push({ key: 'risk.doubleCropTiming' });
  if (assessed.some((a) => a.crop.id === 'chickpea')) out.push({ key: 'risk.chickpea' });
  if (climate.annual.aridityIndex < 0.5 && assessed.some((a) => a.crop.role === 'cover')) out.push({ key: 'risk.aridCovers' });
  return out;
}

function gapsFor(templateId: StrategyResult['templateId'], assessed: SlotAssessment[]): Msg[] {
  const out: Msg[] = [];
  if (assessed.some((a) => a.crop.role === 'cover')) out.push({ key: 'gap.coverTermination' });
  if (templateId === 'pasture_alfalfa') out.push({ key: 'gap.livestock' });
  out.push({ key: 'gap.marketGeneric' });
  return out;
}

/** Limitations that apply to every strategy; shown once in the UI. */
export const GLOBAL_GAPS: Msg[] = [
  { key: 'gap.resolution' },
  { key: 'gap.et0Method' },
  { key: 'gap.soilData' },
  { key: 'gap.cropParams' },
];

// ---------------------------------------------------------------------------
// small math helpers
// ---------------------------------------------------------------------------

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
function clampScore(x: number): number {
  return Math.round(Math.min(100, Math.max(0, x)));
}
function mean(xs: number[]): number {
  return xs.length ? sum(xs) / xs.length : 0;
}
function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
function weightedMean(pairs: [number, number][]): number {
  const w = sum(pairs.map(([, wt]) => wt));
  return w > 0 ? sum(pairs.map(([v, wt]) => v * wt)) / w : 0;
}

export { CROPS };
