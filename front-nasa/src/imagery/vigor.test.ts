import { describe, expect, it } from 'vitest';
import proj4 from 'proj4';
import { classify, ndvi, prescriptionGeoJson, prescriptionGrid, quantileThresholds, zoneStats, type VigorRaster } from './vigor';
import { proj4DefFor } from './crs';

// 100 × 50 px NDVI map in POSGAR faja 4, 5 m pixels (500 m × 250 m = 12.5 ha), vigour rising west → east.
const def = proj4DefFor(5346)!;
const [x0, y0] = proj4('EPSG:4326', def, [-62.74, -28.383]) as [number, number];
const W = 100;
const H = 50;
const values = new Float32Array(W * H);
for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) values[r * W + c] = 0.2 + (0.6 * c) / (W - 1);
values[0] = NaN;
const raster: VigorRaster = { name: 'ndvi.tif', epsg: 5346, width: W, height: H, values, bbox: [x0, y0, x0 + 500, y0 + 250], pixelAreaM2: 25, source: 'index' };

describe('drone vigour zoning and prescription', () => {
  it('computes NDVI from red and near-infrared', () => {
    expect(ndvi(0.05, 0.45)).toBeCloseTo(0.8, 6);
    expect(ndvi(0, 0)).toBeNaN();
  });

  it('splits the lot into equal-area zones and measures them', () => {
    const t = quantileThresholds(values, 3);
    expect(t).toHaveLength(2);
    expect(classify(0.21, t)).toBe(0);
    expect(classify(0.79, t)).toBe(2);
    expect(classify(NaN, t)).toBe(-1);
    const z = zoneStats(raster, t);
    const total = z.reduce((a, s) => a + s.areaHa, 0);
    expect(total).toBeCloseTo((W * H - 1) * 25 / 10_000, 6); // ≈ 12.5 ha, minus the no-data pixel
    for (const s of z) expect(s.areaHa).toBeGreaterThan(3.9);
    expect(z[0]!.mean).toBeLessThan(z[2]!.mean);
  });

  it('exports a grid prescription with the rate of each zone, in WGS 84', () => {
    const t = quantileThresholds(values, 3);
    const cells = prescriptionGrid(raster, t, [12, 0, 0], 25);
    expect(cells.length).toBe(20 * 10); // 25 m cells over 500 m × 250 m
    const low = cells.filter((c) => c.zone === 0);
    expect(low.every((c) => c.rate === 12)).toBe(true);
    const [lon, lat] = cells[0]!.ring[0]!;
    expect(lon).toBeCloseTo(-62.74, 3);
    expect(lat).toBeGreaterThan(-28.383);
    const gj = JSON.parse(prescriptionGeoJson(cells, { name: 'x', unit: 'L/ha', createdOn: '2026-11-15' }));
    expect(gj.features[0].properties).toEqual({ zona: 1, dosis: 12, unidad: 'L/ha' });
  });
});
