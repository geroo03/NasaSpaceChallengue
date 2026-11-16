import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyPatch, DEFAULT_CASE, distanceKm, loadCase, prioritiesFromGoals, ringCentroid, saveCase, toFarmContext, withDeclaredSlope, withLot, withTerrain, type FarmCase, type TerrainSummary } from './model';

const base: FarmCase = { ...DEFAULT_CASE };

describe('case → engine context', () => {
  it('never treats an unknown irrigation access as available water', () => {
    const { farm, assumptions } = toFarmContext({ ...base, resources: { ...base.resources, irrigation: 'unknown' }, irrigationMm: 300 });
    expect(farm.irrigationMm).toBe(0);
    expect(assumptions).toContain('irrigationAssumedZero');
  });

  it('uses declared irrigation only when the farmer has some access to it', () => {
    const owned = toFarmContext({ ...base, resources: { ...base.resources, irrigation: 'contracted' }, availability: { ...base.availability, irrigation: 'confirmed' }, irrigationMm: 150, irrigationSystem: 'drip' });
    expect(owned.farm.irrigationMm).toBeCloseTo(135, 6); // 150 mm applied by drip × 0.9
    const none = toFarmContext({ ...base, resources: { ...base.resources, irrigation: 'unavailable' }, irrigationMm: 150 });
    expect(none.farm.irrigationMm).toBe(0);
    expect(none.assumptions).not.toContain('irrigationAssumedZero');
  });

  it('flags an irrigation amount the farmer does not know instead of inventing one', () => {
    const { farm, assumptions } = toFarmContext({ ...base, resources: { ...base.resources, irrigation: 'owned' }, irrigationMm: null });
    expect(farm.irrigationMm).toBe(0);
    expect(assumptions).toContain('irrigationUnknownMm');
  });

  it.each(['shared', 'contracted'] as const)('keeps %s irrigation out of the water supply until availability is confirmed', (access) => {
    const pending: FarmCase = { ...base, resources: { ...base.resources, irrigation: access }, irrigationMm: 300 };
    expect(toFarmContext(pending).farm.irrigationMm).toBe(0);
    expect(toFarmContext(pending).assumptions).toContain('irrigationPending');
    expect(toFarmContext({ ...pending, availability: { ...pending.availability, irrigation: 'confirmed' } }).farm.irrigationMm).toBeCloseTo(180, 6); // unknown system → acequia, 0.6
  });

  it('counts only the water that reaches the crop, by irrigation system', () => {
    const c: FarmCase = { ...base, resources: { ...base.resources, irrigation: 'owned' }, irrigationMm: 200 };
    expect(toFarmContext({ ...c, irrigationSystem: 'drip' }).farm.irrigationMm).toBeCloseTo(180, 6);
    expect(toFarmContext({ ...c, irrigationSystem: 'sprinkler' }).farm.irrigationMm).toBeCloseTo(150, 6);
    expect(toFarmContext({ ...c, irrigationSystem: 'surface' }).farm.irrigationMm).toBeCloseTo(120, 6);
    const unknown = toFarmContext({ ...c, irrigationSystem: 'unknown' });
    expect(unknown.farm.irrigationMm).toBeCloseTo(120, 6);
    expect(unknown.assumptions).toContain('irrigationSystemAssumed');
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

describe('case persistence during coordinate edits', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('recovers a legacy null coordinate and preserves the other answers', () => {
    const getItem = vi.fn(() => JSON.stringify({ ...base, lat: null, lon: -62, placeId: null, otherCrop: 'caupí' }));
    vi.stubGlobal('window', { localStorage: { getItem } });
    const recovered = loadCase();
    expect([recovered.lat, recovered.lon]).toEqual([base.lat, base.lon]);
    expect(recovered.otherCrop).toBe('caupí');
  });

  it('retains the previous valid case when a coordinate is temporarily empty', () => {
    const setItem = vi.fn();
    vi.stubGlobal('window', { localStorage: { setItem } });
    saveCase({ ...base, lat: NaN });
    expect(setItem).not.toHaveBeenCalled();
    saveCase(base);
    expect(JSON.parse(setItem.mock.calls[0]![1])).toMatchObject({ lat: base.lat, lon: base.lon });
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

describe('slope provenance', () => {
  it('reports when the slope comes from SRTM or a drone DSM instead of the farmer', () => {
    expect(toFarmContext({ ...base, slope: 'flat', slopeSource: 'srtm' }).assumptions).toContain('slopeFromSrtm');
    expect(toFarmContext({ ...base, slope: 'gentle', slopeSource: 'drone' }).assumptions).toContain('slopeFromDrone');
    expect(toFarmContext({ ...base, slope: 'gentle', slopeSource: 'declared' }).assumptions).not.toContain('slopeFromSrtm');
  });
});

describe('lot-first flow', () => {
  const ring: [number, number][] = [
    [-28.47, -62.85],
    [-28.47, -62.84],
    [-28.46, -62.84],
    [-28.46, -62.85],
  ];
  const srtm: TerrainSummary = { source: 'srtm', samples: 400, meanM: 120, reliefM: 3, slopePct: 0.3, aspectDeg: 90, slopeClass: 'flat', sources: ['srtm/S29W063.tif'] };
  const drone: TerrainSummary = { ...srtm, source: 'drone', slopePct: 1.4, slopeClass: 'gentle', sources: ['dsm.tif'] };

  it('moves the climate point to the lot centre only on the field screen', () => {
    const moved = withLot(base, ring, { kind: 'drawn' }, { movePoint: true });
    expect(moved.lat).toBeCloseTo(-28.465, 4);
    expect(moved.lon).toBeCloseTo(-62.845, 4);
    expect(moved.placeId).toBeNull();
    const kept = withLot(base, ring, { kind: 'drawn' }, { movePoint: false });
    expect(kept.lat).toBe(base.lat);
  });

  it('uses the lot terrain for the slope unless the farmer declared it', () => {
    const c = withTerrain(withLot(base, ring, { kind: 'drawn' }, { movePoint: true }), srtm);
    expect(c.slope).toBe('flat');
    expect(c.slopeSource).toBe('srtm');
    const declared = withTerrain({ ...base, slope: 'steep', slopeSource: 'declared' }, srtm);
    expect(declared.slope).toBe('steep');
    expect(declared.terrain).toEqual(srtm);
  });

  it('does not apply an SRTM slope from too few samples', () => {
    const c = withTerrain(base, { ...srtm, samples: 12 });
    expect(c.slope).toBe('unknown');
    expect(c.terrain?.samples).toBe(12);
  });

  it('keeps a drone measurement over a later SRTM estimate', () => {
    const c = withTerrain(withTerrain(base, drone), srtm);
    expect(c.terrain?.source).toBe('drone');
    expect(c.slope).toBe('gentle');
  });

  it('resets terrain and its slope when the boundary changes', () => {
    const c = withLot(withTerrain(base, srtm), ring, { kind: 'drawn' }, { movePoint: false });
    expect(c.terrain).toBeNull();
    expect(c.slope).toBe('unknown');
    expect(withLot(c, null, { kind: 'drawn' }, { movePoint: false }).lotSource).toBeNull();
  });

  it('falls back to the measured slope when the farmer answers "I don\'t know"', () => {
    const c = withDeclaredSlope(withTerrain(base, srtm), 'steep');
    expect(c.slopeSource).toBe('declared');
    const back = withDeclaredSlope(c, 'unknown');
    expect(back.slope).toBe('flat');
    expect(back.slopeSource).toBe('srtm');
  });
});

describe('example lot', () => {
  it('centres on the point that has a saved NASA POWER series', async () => {
    const { EXAMPLE_LOT } = await import('./model');
    const { snapshotFor } = await import('./climateSource');
    const c = withLot(base, EXAMPLE_LOT, { kind: 'example' }, { movePoint: true });
    expect(snapshotFor(c.lat, c.lon)?.id).toBe('anatuya-example');
  });
});

describe('soil water reserve provenance', () => {
  const soil = { source: 'soilgrids' as const, lat: base.lat, lon: base.lon, retrievedOn: '2026-11-14', pawMm: 94.2, sandPct: 37, clayPct: 20, siltPct: 43, socGkg: 15, texture: 'loam' as const, layers: [] };

  it('says the 120 mm reserve is an assumption when there is no soil data', () => {
    const { farm, assumptions } = toFarmContext(base);
    expect(farm.soilPawMm).toBeUndefined();
    expect(assumptions).toContain('soilReserveAssumed');
  });

  it('uses the SoilGrids water only at the point it was read for', () => {
    const here = toFarmContext({ ...base, soil });
    expect(here.farm.soilPawMm).toBe(94);
    expect(here.assumptions).toContain('soilFromSoilgrids');
    const moved = toFarmContext({ ...base, soil, lat: base.lat + 0.1 });
    expect(moved.farm.soilPawMm).toBeUndefined();
  });

  it('prefers the farmer’s own soil test and flags a texture that disagrees with the map', () => {
    expect(toFarmContext({ ...base, soil, soilPawDeclaredMm: 150 }).farm.soilPawMm).toBe(150);
    expect(toFarmContext({ ...base, soil, soilTexture: 'sandy' }).assumptions).toContain('soilTextureDiffers');
  });
});

describe('a soil test belongs to its field', () => {
  const ringAt = (lat: number, lon: number): [number, number][] => [
    [lat, lon],
    [lat, lon + 0.005],
    [lat + 0.005, lon + 0.005],
    [lat + 0.005, lon],
  ];
  it('is kept when the same boundary is edited', () => {
    const c = { ...withLot(base, ringAt(-28.38, -62.74), { kind: 'drawn' }, { movePoint: true }), soilPawDeclaredMm: 250 };
    const edited = withLot(c, ringAt(-28.3801, -62.7401), { kind: 'drawn', edited: true }, { movePoint: true });
    expect(edited.soilPawDeclaredMm).toBe(250);
  });
  it('is dropped when another field is loaded', () => {
    const c = { ...withLot(base, ringAt(-28.38, -62.74), { kind: 'drawn' }, { movePoint: true }), soilPawDeclaredMm: 250 };
    const other = withLot(c, ringAt(-27.9, -63.1), { kind: 'file' }, { movePoint: true });
    expect(other.soilPawDeclaredMm).toBeNull();
    expect(toFarmContext(other).assumptions.some((a) => JSON.stringify(a).includes('250'))).toBe(false);
  });
  it('is dropped when the point moves elsewhere without a lot', () => {
    const c = { ...base, lotPolygon: null, soilPawDeclaredMm: 180 };
    expect(applyPatch(c, { lat: c.lat + 0.5 }).soilPawDeclaredMm).toBeNull();
    expect(applyPatch(c, { lat: c.lat + 0.001 }).soilPawDeclaredMm).toBe(180);
    expect(applyPatch(c, { lat: c.lat + 0.5, soilPawDeclaredMm: 90 }).soilPawDeclaredMm).toBe(90);
  });
});
