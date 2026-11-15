import type { StrategyResult } from '../engine/domain/rotations';
import type { CropId } from '../engine/domain/crops';

/**
 * Field checks suggested by the modelled calendar of one strategy.
 *
 * AgroField does not process drone imagery: it only says WHAT to look at and WHEN, so a field visit or a
 * drone flight (e.g. by Vuelo Verde pilots) can confirm or correct the model. Every item is derived from
 * engine outputs already shown in the UI; nothing here adds a new formula or threshold to the ranking.
 */
export type CheckKind = 'preSowing' | 'peakStress' | 'residue' | 'coverEnd';

export interface FieldCheck {
  kind: CheckKind;
  /** Growing-year month index 0–23 where the check is suggested. */
  month: number;
  /** Last month of a monitoring or residue-check window. */
  untilMonth?: number;
  crop?: CropId;
  /** Estimated water deficit of that crop (0–100) for peakStress. */
  deficitPct?: number;
}

/** Below this estimated deficit a stress flight is not suggested (it would just confirm a normal season). */
const STRESS_CHECK_MIN_DEFICIT = 0.2;

export function planFieldChecks(s: StrategyResult): FieldCheck[] {
  const checks: FieldCheck[] = [];
  const productive = s.slots.filter((a) => a.crop.role !== 'cover').sort((a, b) => a.startIndex - b.startIndex);

  // 1. Before the first cash-crop sowing: soil moisture and weeds (the "decide before sowing" moment).
  const first = productive[0];
  if (first) {
    const sow = first.months[0] ?? first.startIndex;
    checks.push({ kind: 'preSowing', month: Math.max(0, sow - 1), crop: first.crop.id });
  }

  // 2. The deficit is a cycle aggregate, so suggest a monitoring window, never an invented monthly peak.
  const worst = [...productive].sort((a, b) => b.deficitRatio - a.deficitRatio)[0];
  if (worst && worst.deficitRatio >= STRESS_CHECK_MIN_DEFICIT) {
    const start = worst.months[0];
    const end = worst.months[worst.months.length - 1];
    if (start !== undefined) checks.push({ kind: 'peakStress', month: start, untilMonth: end !== undefined && end >= start ? end : undefined, crop: worst.crop.id, deficitPct: Math.round(worst.deficitRatio * 100) });
  }

  // 3. Longest run of months with no crop scheduled: is there residue / cover, or weeds?
  let best: { start: number; len: number } | null = null;
  let runStart = -1;
  for (let i = 0; i <= s.timeline.length; i++) {
    const bare = s.timeline[i]?.bare ?? false;
    if (bare && runStart < 0) runStart = i;
    if (!bare && runStart >= 0) {
      const len = i - runStart;
      if (!best || len > best.len) best = { start: runStart, len };
      runStart = -1;
    }
  }
  if (best && best.len >= 2) checks.push({ kind: 'residue', month: best.start, untilMonth: best.start + best.len - 1 });

  // 4. Cover crops: check biomass / soil water before termination.
  const cover = s.slots.filter((a) => a.crop.role === 'cover').sort((a, b) => a.startIndex - b.startIndex)[0];
  if (cover) {
    const end = cover.months[cover.months.length - 1];
    if (end !== undefined) checks.push({ kind: 'coverEnd', month: end, crop: cover.crop.id });
  }

  return checks.sort((a, b) => a.month - b.month);
}
