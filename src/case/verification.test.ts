import { describe, expect, it } from 'vitest';
import { buildClimateProfile } from '../engine/analysis/climate';
import { compareStrategies, type FarmContext } from '../engine/domain/rotations';
import { syntheticSeries } from '../engine/test/fixtures';
import { planFieldChecks } from './verification';

const farm: FarmContext = {
  irrigationMm: 0,
  slope: 'gentle',
  priorities: { waterSecurity: 3, waterUse: 3, climateRisk: 3, soil: 3, erosion: 3, pests: 3, income: 3 },
};
const dry = buildClimateProfile(syntheticSeries({ lat: -28, years: 8, tmeanAnnual: 21, annualRainMm: 600 }));
const results = compareStrategies(dry, farm, { currentTemplate: 'soy_maize_fallow' });
const reference = results[0]!;

describe('field checks derived from the calendar', () => {
  it('suggests a pre-sowing check before the first cash crop', () => {
    const checks = planFieldChecks(reference);
    const pre = checks.find((c) => c.kind === 'preSowing');
    const firstSow = Math.min(...reference.slots.filter((a) => a.crop.role !== 'cover').map((a) => a.months[0] ?? 99));
    expect(pre?.month).toBe(Math.max(0, firstSow - 1));
  });

  it('points the residue check at the longest run of months with no crop scheduled', () => {
    const residue = planFieldChecks(reference).find((c) => c.kind === 'residue');
    expect(residue).toBeDefined();
    for (let i = residue!.month; i <= residue!.untilMonth!; i++) expect(reference.timeline[i]?.bare).toBe(true);
  });

  it('places the stress check inside the cycle of the crop with the highest estimated deficit', () => {
    const stress = planFieldChecks(reference).find((c) => c.kind === 'peakStress');
    if (!stress) return; // only suggested when the deficit is meaningful
    const slot = reference.slots.find((a) => a.crop.id === stress.crop);
    expect(slot?.months).toContain(stress.month);
  });

  it('reports a cycle window even when every month has the same aggregate pressure', () => {
    const worst = [...reference.slots].filter((a) => a.crop.role !== 'cover').sort((a, b) => b.deficitRatio - a.deficitRatio)[0]!;
    const sample = { ...reference, slots: [{ ...worst, deficitRatio: 0.5, months: [8, 9, 10] }], timeline: reference.timeline.map((c) => ({ ...c, pressure: 0.4 })) };
    const check = planFieldChecks(sample).find((c) => c.kind === 'peakStress');
    expect(check).toMatchObject({ month: 8, untilMonth: 10, deficitPct: 50 });
  });

  it('adds a cover-termination check only when the strategy has cover crops', () => {
    for (const s of results) {
      const hasCover = s.slots.some((a) => a.crop.role === 'cover');
      expect(planFieldChecks(s).some((c) => c.kind === 'coverEnd')).toBe(hasCover);
    }
  });

  it('returns checks in calendar order', () => {
    const months = planFieldChecks(reference).map((c) => c.month);
    expect(months).toEqual([...months].sort((a, b) => a - b));
  });
});
