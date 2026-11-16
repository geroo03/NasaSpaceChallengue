import { describe, expect, it } from 'vitest';
import proj4 from 'proj4';
import { classify, ndvi, prescriptionGeoJson, prescriptionGrid, prescriptionTotals, quantileThresholds, zoneStats, type VigorRaster } from './vigor';
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
    // The first cell holds the no-data pixel: its geometry leaves it out.
    const first = cells[0]!;
    expect(first.areaHa).toBeCloseTo((25 - 1) * 25 / 10_000, 9);
    const [lon, lat] = first.polygons[first.polygons.length - 1]![0]!;
    expect(lon).toBeCloseTo(-62.74, 3);
    expect(lat).toBeGreaterThan(-28.383);
    const gj = JSON.parse(prescriptionGeoJson(cells, { name: 'x', unit: 'L/ha', createdOn: '2026-11-15' }));
    expect(gj.features[0].properties).toEqual({ zona: 1, dosis: 12, unidad: 'L/ha', superficie_ha: 0.06 });
    expect(gj.features[0].geometry.type).toBe('MultiPolygon');
    // Exported area = valid area of the lot.
    expect(prescriptionTotals(cells).areaHa).toBeCloseTo((W * H - 1) * 25 / 10_000, 9);
  });

  it('never gives a rate to pixels outside the lot or without data', () => {
    // 2 × 2 raster, 10 m pixels, only the top-left pixel is valid; one 20 m cell covers all four.
    const v = new Float32Array([0.5, NaN, NaN, NaN]);
    const small: VigorRaster = { name: 's.tif', epsg: 5346, width: 2, height: 2, values: v, bbox: [x0, y0, x0 + 20, y0 + 20], pixelAreaM2: 100, source: 'index' };
    const cells = prescriptionGrid(small, [], [20], 20);
    expect(cells).toHaveLength(1);
    expect(cells[0]!.areaHa).toBeCloseTo(0.01, 9);
    expect(cells[0]!.polygons).toHaveLength(1);
    const ring = cells[0]!.polygons[0]!.map(([lo, la]) => proj4('EPSG:4326', def, [lo, la]) as [number, number]);
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(10, 3); // one pixel wide, not the whole cell
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(10, 3);
    expect(prescriptionTotals(cells)).toEqual({ total: 0.2, appliedHa: 0.01, areaHa: 0.01 });
  });

  it('shows the same totals it exports, even with mixed zones in a cell', () => {
    const t = quantileThresholds(values, 3);
    const cells = prescriptionGrid(raster, t, [30, 20, 10], 25);
    const totals = prescriptionTotals(cells);
    const fromFile = JSON.parse(prescriptionGeoJson(cells, { name: 'x', unit: 'kg/ha', createdOn: '2026-11-15' })).features
      .reduce((a: number, f: { properties: { dosis: number; superficie_ha: number } }) => a + f.properties.dosis * f.properties.superficie_ha, 0);
    expect(fromFile).toBeCloseTo(totals.total, 2);
  });
});
