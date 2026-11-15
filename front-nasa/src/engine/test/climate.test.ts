import { describe, expect, it } from 'vitest';
import { applyScenario, buildClimateProfile, extraterrestrialRadiation, hargreavesEt0, linearTrend } from '../analysis/climate';
import { syntheticSeries } from './fixtures';

describe('FAO-56 helpers', () => {
  it('matches FAO-56 example 8 for extraterrestrial radiation (20°S, 3 Sep → 32.2 MJ/m²/day)', () => {
    expect(extraterrestrialRadiation(-20, 246)).toBeCloseTo(32.2, 1);
  });

  it('gives plausible Hargreaves ET0 values', () => {
    const summer = hargreavesEt0(34, 20, -27.8, 15);
    const winter = hargreavesEt0(22, 5, -27.8, 196);
    expect(summer).toBeGreaterThan(5);
    expect(summer).toBeLessThan(9);
    expect(winter).toBeLessThan(summer);
  });

  it('computes an exact linear trend per decade', () => {
    const years = [2010, 2011, 2012, 2013, 2014];
    const tr = linearTrend(years, years.map((y) => 2 * (y - 2010) + 5));
    expect(tr.slopePerDecade).toBeCloseTo(20);
    expect(tr.r2).toBeCloseTo(1);
  });
});

describe('climate profile', () => {
  const cold = buildClimateProfile(syntheticSeries({ lat: -30, years: 10, tmeanAnnual: 15, tAmplitude: 9 }));

  it('detects hemisphere and analyses only complete years', () => {
    expect(cold.hemisphere).toBe('south');
    expect(cold.yearsAnalysed).toHaveLength(10);
    expect(cold.monthly).toHaveLength(12);
  });

  it('places frost in southern winter and heat in southern summer', () => {
    const july = cold.monthly[6]!;
    const january = cold.monthly[0]!;
    expect(july.frostProb).toBe(1);
    expect(january.frostProb).toBe(0);
    expect(january.precipMm).toBeGreaterThan(july.precipMm);
  });

  it('returns a frost-free season shorter than a year when frost exists', () => {
    expect(cold.frostFreeSeasonDays).not.toBeNull();
    expect(cold.frostFreeSeasonDays!).toBeGreaterThan(90);
    expect(cold.frostFreeSeasonDays!).toBeLessThan(365);
  });

  it('applies delta-change scenarios', () => {
    const base = syntheticSeries({ lat: -30, years: 5 });
    const drier = buildClimateProfile(applyScenario(base, { precipPct: -20, tempC: 2 }));
    const ref = buildClimateProfile(base);
    expect(drier.annual.precipMm).toBeCloseTo(ref.annual.precipMm * 0.8, 0);
    expect(drier.annual.et0Mm).toBeGreaterThan(ref.annual.et0Mm);
  });
});
