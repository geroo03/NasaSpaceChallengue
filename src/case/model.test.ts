import { describe, expect, it } from 'vitest';
import { DEFAULT_CASE, distanceKm, prioritiesFromGoals, ringCentroid, toFarmContext, type FarmCase } from './model';

const base: FarmCase = { ...DEFAULT_CASE };

describe('case → engine context', () => {
  it('never treats an unknown irrigation access as available water', () => {
    const { farm, assumptions } = toFarmContext({ ...base, resources: { ...base.resources, irrigation: 'unknown' }, irrigationMm: 300 });
    expect(farm.irrigationMm).toBe(0);
    expect(assumptions).toContain('irrigationAssumedZero');
  });

  it('uses declared irrigation only when the farmer has some access to it', () => {
    const owned = toFarmContext({ ...base, resources: { ...base.resources, irrigation: 'contracted' }, irrigationMm: 150 });
    expect(owned.farm.irrigationMm).toBe(150);
    const none = toFarmContext({ ...base, resources: { ...base.resources, irrigation: 'unavailable' }, irrigationMm: 150 });
    expect(none.farm.irrigationMm).toBe(0);
    expect(none.assumptions).not.toContain('irrigationAssumedZero');
  });

  it('flags an irrigation amount the farmer does not know instead of inventing one', () => {
    const { farm, assumptions } = toFarmContext({ ...base, resources: { ...base.resources, irrigation: 'owned' }, irrigationMm: null });
    expect(farm.irrigationMm).toBe(0);
    expect(assumptions).toContain('irrigationUnknownMm');
  });

  it('marks the slope as assumed when unknown', () => {
    expect(toFarmContext({ ...base, slope: 'unknown' }).assumptions).toContain('slopeAssumed');
    expect(toFarmContext({ ...base, slope: 'flat' }).farm.slope).toBe('flat');
  });

  it('marks a substitute reference when the current crop is outside the catalogue', () => {
    expect(toFarmContext({ ...base, currentChoice: 'other', otherCrop: 'caupí' }).assumptions).toContain('referenceSubstitute');
  });

  it('turns goals into weights and keeps unselected dimensions in play', () => {
    const p = prioritiesFromGoals(['water']);
    expect(p.waterSecurity).toBe(5);
    expect(p.income).toBe(2);
  });
});

describe('lot centroid as analysis point', () => {
  it('finds the centre of an L-shaped lot by area, not by averaging vertices', () => {
    // L shape: big square [0,2]x[0,2] minus [1,2]x[1,2] (in degrees, lat/lon order)
    const L: [number, number][] = [[0, 0], [0, 2], [1, 2], [1, 1], [2, 1], [2, 0]];
    const c = ringCentroid(L)!;
    expect(c[0]).toBeCloseTo(5 / 6, 6);
    expect(c[1]).toBeCloseTo(5 / 6, 6);
  });

  it('measures distances in km', () => {
    expect(distanceKm([-27.78, -64.26], [-27.78, -64.26])).toBe(0);
    expect(distanceKm([-28, -64], [-29, -64])).toBeGreaterThan(110);
    expect(distanceKm([-28, -64], [-29, -64])).toBeLessThan(112);
  });
});
