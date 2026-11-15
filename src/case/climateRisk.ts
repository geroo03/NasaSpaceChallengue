import type { ClimateSeries, DailyRecord } from '../engine/data/power';
import { getCrop, type CropId } from '../engine/domain/crops';
import type { StrategyResult } from '../engine/domain/rotations';
import { ONI } from '../data/oni';

/**
 * Climate risk read from the record, never forecast:
 *  - ENSO phase of each past campaign (NOAA ONI) and what happened at this point in each phase;
 *  - heat at flowering for each crop of a rotation (hot spells in NASA POWER daily Tmax);
 *  - a month-by-month soil water bucket that keeps water between crops (complements the engine).
 */

export type EnsoPhase = 'nino' | 'nina' | 'neutral';
const SEASONS = ['DJF', 'JFM', 'FMA', 'MAM', 'AMJ', 'MJJ', 'JJA', 'JAS', 'ASO', 'SON', 'OND', 'NDJ'] as const;
const key = (season: string, year: number) => `${season}-${year}`;

/**
 * NOAA's operational definition: El Niño (La Niña) when ONI ≥ +0.5 (≤ −0.5) for at least
 * five consecutive overlapping seasons. Returns the episode flag of every season in an episode.
 */
export function ensoEpisodes(rows: [string, number, number][] = ONI): Map<string, EnsoPhase> {
  const sorted = [...rows].sort((a, b) => a[1] - b[1] || SEASONS.indexOf(a[0] as never) - SEASONS.indexOf(b[0] as never));
  const out = new Map<string, EnsoPhase>();
  let run: [string, number, number][] = [];
  let runPhase: EnsoPhase = 'neutral';
  const flush = () => {
    if (runPhase !== 'neutral' && run.length >= 5) run.forEach(([s, y]) => out.set(key(s, y), runPhase));
    run = [];
  };
  for (const r of sorted) {
    const p: EnsoPhase = r[2] >= 0.5 ? 'nino' : r[2] <= -0.5 ? 'nina' : 'neutral';
    if (p !== runPhase) {
      flush();
      runPhase = p;
    }
    if (p !== 'neutral') run.push(r);
  }
  flush();
  return out;
}

/**
 * Phase of the campaign that starts in July of `startYear`: the episode flag of the austral growing
 * season core (SON, OND, NDJ of startYear and DJF of startYear+1) when it holds in at least three of the four.
 * null when the ONI record does not cover those seasons yet.
 */
export function campaignPhase(startYear: number, episodes = ensoEpisodes(), rows: [string, number, number][] = ONI): EnsoPhase | null {
  const core: [string, number][] = [['SON', startYear], ['OND', startYear], ['NDJ', startYear], ['DJF', startYear + 1]];
  if (!core.every(([s, y]) => rows.some((r) => r[0] === s && r[1] === y))) return null;
  const flags = core.map(([s, y]) => episodes.get(key(s, y)) ?? 'neutral');
  if (flags.filter((f) => f === 'nino').length >= 3) return 'nino';
  if (flags.filter((f) => f === 'nina').length >= 3) return 'nina';
  return 'neutral';
}

/** Latest observed ONI: conditions (threshold only) and NOAA's usual strength wording. */
export function latestEnso(rows: [string, number, number][] = ONI) {
  const last = rows[rows.length - 1]!;
  const [season, year, anom] = last;
  const phase: EnsoPhase = anom >= 0.5 ? 'nino' : anom <= -0.5 ? 'nina' : 'neutral';
  const a = Math.abs(anom);
  const strength = a < 1 ? 'weak' : a < 1.5 ? 'moderate' : a < 2 ? 'strong' : 'veryStrong';
  return { season, year, anom, phase, strength } as const;
}

/** Campaign = July of year Y to June of Y+1 (austral growing year). */
export function campaignOf(d: Pick<DailyRecord, 'year' | 'month'>): number {
  return d.month >= 7 ? d.year : d.year - 1;
}

export interface CampaignStats {
  start: number;
  phase: EnsoPhase | null;
  rainMm: number;
  /** October–March: the summer crop season. */
  rainOctMarMm: number;
  heatDays: number;
  heatDays40: number;
  /** Runs of ≥3 consecutive days with Tmax ≥ 35 °C between October and March. */
  heatwaves: number;
}

const SUMMER = new Set([10, 11, 12, 1, 2, 3]);

export function countSpells(days: DailyRecord[], thresholdC: number, minRun = 3): number {
  let spells = 0;
  let run = 0;
  for (const d of days) {
    if (d.tmax >= thresholdC) {
      run++;
      if (run === minRun) spells++;
    } else run = 0;
  }
  return spells;
}

export function campaignStats(series: ClimateSeries, episodes = ensoEpisodes()): CampaignStats[] {
  const groups = new Map<number, DailyRecord[]>();
  for (const d of series.days) {
    const c = campaignOf(d);
    const g = groups.get(c);
    if (g) g.push(d);
    else groups.set(c, [d]);
  }
  const out: CampaignStats[] = [];
  for (const [start, days] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    if (days.length < 360) continue; // partial campaigns at the edges of the record
    const summer = days.filter((d) => SUMMER.has(d.month));
    out.push({
      start,
      phase: campaignPhase(start, episodes),
      rainMm: days.reduce((a, d) => a + d.precip, 0),
      rainOctMarMm: summer.reduce((a, d) => a + d.precip, 0),
      heatDays: days.filter((d) => d.tmax >= 35).length,
      heatDays40: days.filter((d) => d.tmax >= 40).length,
      heatwaves: countSpells(summer, 35),
    });
  }
  return out;
}

export interface PhaseSummary {
  phase: EnsoPhase;
  campaigns: number[];
  rainMm: number;
  rainOctMarMm: number;
  heatDays: number;
  heatwaves: number;
}

export function summarizeByPhase(stats: CampaignStats[]): PhaseSummary[] {
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
  return (['nino', 'neutral', 'nina'] as EnsoPhase[]).map((phase) => {
    const s = stats.filter((x) => x.phase === phase);
    return {
      phase,
      campaigns: s.map((x) => x.start),
      rainMm: avg(s.map((x) => x.rainMm)),
      rainOctMarMm: avg(s.map((x) => x.rainOctMarMm)),
      heatDays: avg(s.map((x) => x.heatDays)),
      heatwaves: avg(s.map((x) => x.heatwaves)),
    };
  });
}

/**
 * Keeps only the given campaigns and relabels each day with its campaign, so the climate profile
 * treats every campaign (Jul–Jun) as one complete year.
 */
export function seriesForCampaigns(series: ClimateSeries, starts: number[]): ClimateSeries {
  const keep = new Set(starts);
  return {
    ...series,
    yearIsCampaign: true,
    days: series.days.filter((d) => keep.has(campaignOf(d))).map((d) => ({ ...d, year: campaignOf(d) })),
  };
}

// --- Heat at flowering -----------------------------------------------------------------------------

export interface FloweringHeat {
  crop: CropId;
  /** Timeline index (0–23) and calendar month of the approximate flowering month. */
  index: number;
  calendarMonth: number;
  heatC: number;
  /** Years in which that month had at least one run of ≥3 days with Tmax ≥ heatC. */
  yearsWithSpell: number;
  years: number;
  /** Mean days per year with Tmax ≥ heatC in that month. */
  hotDays: number;
  level: 'high' | 'medium' | 'low';
}

export function floweringHeat(strategy: StrategyResult, series: ClimateSeries): FloweringHeat[] {
  const out: FloweringHeat[] = [];
  for (const a of [...strategy.slots].sort((x, y) => x.startIndex - y.startIndex)) {
    const crop = getCrop(a.crop.id);
    if (crop.role === 'cover' || !crop.flowering || !a.months.length) continue;
    const index = a.months[Math.min(crop.flowering.offsetMonths, a.months.length - 1)]!;
    const cell = strategy.timeline[index];
    if (!cell) continue;
    const byYear = new Map<number, DailyRecord[]>();
    for (const d of series.days) {
      if (d.month !== cell.calendarMonth) continue;
      const g = byYear.get(d.year);
      if (g) g.push(d);
      else byYear.set(d.year, [d]);
    }
    const years = [...byYear.values()].filter((days) => days.length >= 28);
    if (!years.length) continue;
    const withSpell = years.filter((days) => countSpells(days, crop.flowering!.heatC) > 0).length;
    const hot = years.reduce((acc, days) => acc + days.filter((d) => d.tmax >= crop.flowering!.heatC).length, 0) / years.length;
    out.push({
      crop: crop.id,
      index,
      calendarMonth: cell.calendarMonth,
      heatC: crop.flowering.heatC,
      yearsWithSpell: withSpell,
      years: years.length,
      hotDays: hot,
      level: hot >= 10 ? 'high' : hot >= 5 ? 'medium' : 'low',
    });
  }
  return out;
}

// --- Day-by-day soil water over the real record ------------------------------------------------------

/**
 * Two-bucket daily water balance (FAO-56 idea, simplified), run over the real NASA POWER days:
 *  - the rotation's 24-month calendar is laid over the record (twice, starting in odd and even years),
 *  - rain × 0.75 fills a surface layer (TEW) and then the root zone up to the soil's available water;
 *    anything above that drains,
 *  - crops and cover crops use Kc × ET₀ (Hargreaves, daily) from the whole profile,
 *  - a weed-free fallow with residue only evaporates from the surface layer (FALLOW_KE × ET₀),
 *    so water stored deeper is kept for the next crop: the point of a fallow in rainfed farming.
 * Complements the engine (whose index still resets the reserve for each crop).
 */
export const FALLOW_KE = 0.6; // evaporation coefficient of wet soil under partial residue (approximate)
const RAIN_SHARE = 0.75; // same effective-rain rule as the engine

export interface SowingWater {
  crop: CropId;
  index: number;
  values: number[];
  medianMm: number;
  minMm: number;
  /** Share of campaigns in which the profile was less than a third full at sowing. */
  lowShare: number;
}

export interface DailyWaterBalance {
  pawMm: number;
  tewMm: number;
  cycles: number;
  /** Soil water at the end of each rotation month across campaigns: median and quartiles. */
  monthly: { index: number; median: number; p25: number; p75: number }[];
  sowing: SowingWater[];
}

function quantile(xs: number[], q: number): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const i = (s.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return s[lo]! + (s[hi]! - s[lo]!) * (i - lo);
}

export function dailyWaterBalance(strategy: StrategyResult, series: ClimateSeries, pawMm: number, et0: (d: DailyRecord) => number): DailyWaterBalance {
  const paw = Math.max(0, pawMm);
  const tew = Math.min(20, paw / 3);
  const days = [...series.days].sort((a, b) => a.date.localeCompare(b.date));
  const kcAt = new Map<number, { kc: number; crop: CropId; cash: boolean }>();
  for (const a of strategy.slots) {
    const c = getCrop(a.crop.id);
    for (const m of a.months) kcAt.set(m, { kc: c.kc, crop: c.id, cash: c.role !== 'cover' });
  }
  const sowingMonths = new Map<number, CropId>();
  for (const a of strategy.slots) if (a.crop.role !== 'cover' && a.months.length) sowingMonths.set(a.months[0]!, a.crop.id);

  const endOfMonth = new Map<number, number[]>(); // rotation month → storage values
  const atSowing = new Map<number, number[]>();
  let cycles = 0;
  const first = days[0];
  if (!first) return { pawMm: paw, tewMm: tew, cycles: 0, monthly: [], sowing: [] };
  const firstCampaign = campaignOf(first) + 1; // first complete campaign

  for (const offset of [0, 12]) {
    let surface = tew * (days[0]?.topWetness ?? 0.4);
    let deep = (paw - tew) * (days[0]?.rootWetness ?? 0.4);
    let lastKey = '';
    for (let i = 0; i < days.length; i++) {
      const d = days[i]!;
      const monthsSince = (d.year - firstCampaign) * 12 + (d.month - 7);
      if (monthsSince < 0) continue;
      const idx = (((monthsSince + offset) % 24) + 24) % 24;
      const k = `${d.year}-${d.month}`;
      if (k !== lastKey) {
        // first day of a month: record sowing water (state at the end of the previous day)
        if (sowingMonths.has(idx) && monthsSince >= 6) {
          const arr = atSowing.get(idx) ?? [];
          arr.push(surface + deep);
          atSowing.set(idx, arr);
        }
        if (idx === 0 && monthsSince + offset >= 24) cycles++;
        lastKey = k;
      }
      // rain fills the surface layer, then the root zone; the excess drains
      surface += RAIN_SHARE * d.precip;
      if (surface > tew) {
        deep += surface - tew;
        surface = tew;
      }
      if (deep > paw - tew) deep = paw - tew;
      const e0 = et0(d);
      const crop = kcAt.get(idx);
      if (crop) {
        let need = crop.kc * e0;
        const fromSurface = Math.min(surface, need);
        surface -= fromSurface;
        need -= fromSurface;
        deep -= Math.min(deep, need);
      } else {
        surface -= Math.min(surface, FALLOW_KE * e0);
      }
      const next = days[i + 1];
      if (!next || next.month !== d.month) {
        const arr = endOfMonth.get(idx) ?? [];
        if (monthsSince >= 6) arr.push(surface + deep);
        endOfMonth.set(idx, arr);
      }
    }
  }
  const monthly = Array.from({ length: 24 }, (_, index) => {
    const v = endOfMonth.get(index) ?? [];
    return { index, median: quantile(v, 0.5), p25: quantile(v, 0.25), p75: quantile(v, 0.75) };
  });
  const sowing = [...sowingMonths.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, crop]) => {
      const values = atSowing.get(index) ?? [];
      return {
        crop,
        index,
        values,
        medianMm: quantile(values, 0.5),
        minMm: values.length ? Math.min(...values) : NaN,
        lowShare: values.length && paw > 0 ? values.filter((v) => v < paw / 3).length / values.length : 0,
      };
    });
  return { pawMm: paw, tewMm: tew, cycles, monthly, sowing };
}
