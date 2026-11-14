import { describe, expect, it } from 'vitest';
import { buildClimateProfile } from '../analysis/climate';
import {
  calendarMonthAt,
  compareStrategies,
  compareStrategiesDetailed,
  cycleMonthsAt,
  optimizeSchedule,
  DIMENSIONS,
  fillGapsWithCovers,
  findGaps,
  findOverlaps,
  slotStartIndex,
  TEMPLATES,
  type FarmContext,
} from '../domain/rotations';
import { syntheticSeries } from './fixtures';
import { getCrop } from '../domain/crops';

const farm: FarmContext = {
  irrigationMm: 0,
  slope: 'gentle',
  priorities: { waterSecurity: 3, waterUse: 3, climateRisk: 3, soil: 3, erosion: 3, pests: 3, income: 3 },
};
const south = buildClimateProfile(syntheticSeries({ lat: -28, years: 8, tmeanAnnual: 20, annualRainMm: 650 }));
const north = buildClimateProfile(syntheticSeries({ lat: 41, years: 8, tmeanAnnual: 11, tAmplitude: 12, annualRainMm: 850 }));

describe('rotation calendar', () => {
  it('indexes the growing year from July in the south and January in the north', () => {
    expect(slotStartIndex({ crop: 'soy', sowMonthSouth: 7, year: 1 })).toBe(0);
    expect(slotStartIndex({ crop: 'soy', sowMonthSouth: 11, year: 2 })).toBe(16);
    expect(calendarMonthAt(0, 'south')).toBe(7);
    expect(calendarMonthAt(0, 'north')).toBe(1);
    expect(calendarMonthAt(4, 'north')).toBe(5); // soybean sown in Nov (south) ↔ May (north)
  });

  it('ships only physically feasible templates', () => {
    for (const tpl of Object.values(TEMPLATES)) {
      expect(findOverlaps(tpl.slots), tpl.id).toEqual([]);
    }
  });

  it('finds the winter fallows of a soybean–maize rotation', () => {
    const gaps = findGaps(TEMPLATES.soy_maize_fallow.slots);
    const total = gaps.reduce((a, g) => a + g.length, 0);
    expect(total).toBe(24 - 5 - 6);
  });

  it('fills long fallows with cover crops without creating overlaps', () => {
    const filled = fillGapsWithCovers(TEMPLATES.soy_maize_fallow.slots, south);
    expect(filled.length).toBeGreaterThan(2);
    expect(findOverlaps(filled)).toEqual([]);
    // a legume is preferred before maize (nitrogen credit)
    expect(filled.some((s) => s.crop === 'vetch')).toBe(true);
  });
});

describe('strategy comparison', () => {
  for (const [name, profile] of [['south', south], ['north', north]] as const) {
    it(`returns the current rotation plus three distinct alternatives (${name})`, () => {
      const res = compareStrategies(profile, farm, { currentTemplate: 'soy_maize_fallow' });
      expect(res).toHaveLength(4);
      expect(res[0]!.isCurrent).toBe(true);
      expect(new Set(res.map((r) => r.id)).size).toBe(4);
      for (const r of res) {
        for (const d of DIMENSIONS) {
          expect(r.scores[d]).toBeGreaterThanOrEqual(0);
          expect(r.scores[d]).toBeLessThanOrEqual(100);
        }
        expect(r.timeline).toHaveLength(24);
        expect(r.evidence.length).toBeGreaterThan(0);
      }
    });
  }

  it('alternatives are explained relative to the current rotation', () => {
    const res = compareStrategies(south, farm, { currentTemplate: 'soy_mono' });
    const alts = res.filter((r) => !r.isCurrent);
    expect(alts.every((a) => a.benefits.length + a.tradeoffs.length > 0)).toBe(true);
    expect(res[0]!.benefits).toEqual([]);
  });

  it('cover crops reduce bare months and raise erosion protection', () => {
    const res = compareStrategies(south, farm, { currentTemplate: 'soy_maize_fallow', alternatives: 20 });
    const current = res.find((r) => r.isCurrent)!;
    const covered = res.find((r) => r.id === 'current_plus_covers')!;
    expect(covered.bareMonths).toBeLessThan(current.bareMonths);
    expect(covered.scores.erosion).toBeGreaterThan(current.scores.erosion);
  });

  it('the top alternative is the best one on the only dimension the farmer cares about', () => {
    const zero = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as FarmContext['priorities'];
    for (const dim of ['income', 'soil', 'erosion'] as const) {
      const res = compareStrategies(south, { ...farm, priorities: { ...zero, [dim]: 5 } }, { currentTemplate: 'soy_mono', alternatives: 20 });
      const alts = res.filter((r) => !r.isCurrent);
      const best = Math.max(...alts.map((a) => a.scores[dim]));
      expect(alts[0]!.scores[dim], dim).toBe(best);
    }
  });

  it('irrigation improves water security', () => {
    const dry = compareStrategies(south, farm, { currentTemplate: 'soy_maize_fallow' })[0]!;
    const wet = compareStrategies(south, { ...farm, irrigationMm: 300 }, { currentTemplate: 'soy_maize_fallow' })[0]!;
    expect(wet.scores.waterSecurity).toBeGreaterThanOrEqual(dry.scores.waterSecurity);
  });
});

describe('location-adaptive scheduling', () => {
  it('stretches winter-wheat cycles with thermal time in cold climates', () => {
    const wheat = getCrop('wheat');
    const octNorth = 9; // growing-year index 9 = October in the north
    expect(cycleMonthsAt(wheat, octNorth, north)).toBeGreaterThan(cycleMonthsAt(wheat, 10, south));
    expect(cycleMonthsAt(wheat, octNorth, north)).toBeLessThanOrEqual(wheat.maxCycleMonths);
  });

  it('moves maize sowing to late spring in a cold northern climate (no frost inside the cycle)', () => {
    const scheduled = optimizeSchedule(TEMPLATES.soy_maize_fallow.slots, north, farm)!;
    expect(scheduled).not.toBeNull();
    const maize = scheduled.find((s) => s.crop === 'maize')!;
    const sowNorth = calendarMonthAt(slotStartIndex(maize), 'north');
    expect([4, 5, 6]).toContain(sowNorth);
    expect(findOverlaps(scheduled)).toEqual([]);
  });

  it('never recommends rotations that break hard frost limits', () => {
    const cold = buildClimateProfile(syntheticSeries({ lat: 47, years: 6, tmeanAnnual: 6, tAmplitude: 14, annualRainMm: 600 }));
    const res = compareStrategies(cold, farm, { currentTemplate: 'soy_maize_fallow', alternatives: 20 });
    for (const r of res.filter((x) => !x.isCurrent)) {
      expect(r.suitable).toBe(true);
      expect(r.slots.every((a) => a.crop.role === 'cover' || a.frostRisk < 0.5)).toBe(true);
    }
  });
});

describe('discarded alternatives', () => {
  it('accounts for every catalogue rotation: shown, or discarded with a reason', () => {
    for (const climate of [south, north]) {
      const { strategies, discarded } = compareStrategiesDetailed(climate, farm, { currentTemplate: 'soy_maize_fallow' });
      const shown = new Set(strategies.map((s) => s.templateId));
      const out = new Set(discarded.map((d) => d.templateId));
      for (const id of Object.keys(TEMPLATES)) {
        if (id === 'soy_maize_fallow') continue;
        expect(shown.has(id as never) !== out.has(id as never), id).toBe(true);
      }
      for (const d of discarded) {
        if (d.reason === 'unsuitable') expect(d.messages.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the same selection as compareStrategies', () => {
    const plain = compareStrategies(south, farm, { currentTemplate: 'soy_maize_fallow' });
    const detailed = compareStrategiesDetailed(south, farm, { currentTemplate: 'soy_maize_fallow' });
    expect(detailed.strategies.map((s) => s.id)).toEqual(plain.map((s) => s.id));
  });

  it('reports outranked rotations when fewer slots than viable candidates are requested', () => {
    const { discarded } = compareStrategiesDetailed(south, farm, { currentTemplate: 'soy_maize_fallow', alternatives: 1 });
    expect(discarded.some((d) => d.reason === 'outranked')).toBe(true);
  });
});
