import { describe, expect, it } from 'vitest';
import proj4 from 'proj4';
import { sampleRaster } from './dsm';
import { proj4DefFor } from './crs';
import { gridInside, terrainStats } from './terrain';
import type { LatLon } from './flightOrder';

// 600 m × 600 m lot near Añatuya and a synthetic RTK DSM in POSGAR faja 4 that drops 0.5 m to the south
// (like a very flat irrigated lot), with a nodata hole.
const def = proj4DefFor(5346)!;
const toNative = (lon: number, lat: number) => proj4('EPSG:4326', def, [lon, lat]) as [number, number];
const lat0 = -28.46;
const lon0 = -62.84;
const dLat = 600 / 110_574;
const dLon = 600 / (111_320 * Math.cos((lat0 * Math.PI) / 180));
const ring: LatLon[] = [[lat0, lon0], [lat0, lon0 + dLon], [lat0 + dLat, lon0 + dLon], [lat0 + dLat, lon0]];
const [x0, y0] = toNative(lon0 - dLon * 0.1, lat0 - dLat * 0.1);
const [x1, y1] = toNative(lon0 + dLon * 1.1, lat0 + dLat * 1.1);
const W = 330;
const H = 330;
const raster = new Float32Array(W * H);
for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) raster[r * W + c] = 162.05 + (0.5 * (H - 1 - r)) / (H - 1) * 1.2;
raster[150 * W + 150] = -9999;

describe('drone DSM sampling', () => {
  it('reads elevations at lot points in the file CRS and skips nodata', () => {
    const pts = gridInside(ring, 2500, 2);
    const { samples, hits } = sampleRaster(raster, W, H, [x0, y0, x1, y1], toNative, pts, -9999);
    expect(hits).toBeGreaterThan(pts.length * 0.99);
    expect(samples.every((s) => s.elev > 162 && s.elev < 163)).toBe(true);
    const st = terrainStats(samples, 'drone')!;
    expect(st.reliefM).toBeGreaterThan(0.3);
    expect(st.reliefM).toBeLessThan(0.6);
    expect(st.slopeClass).toBe('flat');
    expect(st.aspectDeg!).toBeGreaterThan(170); // water runs south
    expect(st.aspectDeg!).toBeLessThan(190);
  });

  it('reports no hits when the DSM does not cover the lot', () => {
    const far: LatLon[] = ring.map(([a, o]) => [a + 0.5, o]);
    expect(sampleRaster(raster, W, H, [x0, y0, x1, y1], toNative, gridInside(far), null).hits).toBe(0);
  });
});
