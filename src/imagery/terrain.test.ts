import { describe, expect, it } from 'vitest';
import { classifySlope, decodeTerrarium, fitPlane, gridInside, pointInRing, terrainStats, tilePixel, type TerrainSample } from './terrain';
import type { LatLon } from './flightOrder';

const lat0 = -28.47;
const lon0 = -62.85;
const dLat = 1000 / 110_574;
const dLon = 1000 / (111_320 * Math.cos((lat0 * Math.PI) / 180));
const square: LatLon[] = [
  [lat0, lon0],
  [lat0, lon0 + dLon],
  [lat0 + dLat, lon0 + dLon],
  [lat0 + dLat, lon0],
];

/** Synthetic terrain: plane rising `pct` % towards the east, plus optional noise. */
function synth(pct: number, noiseM = 0, seed = 1): TerrainSample[] {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
  return gridInside(square, 900, 30).map(([lat, lon]) => {
    const xM = (lon - lon0) * 111_320 * Math.cos((lat0 * Math.PI) / 180);
    return { lat, lon, elev: 100 + (pct / 100) * xM + noiseM * rnd() };
  });
}

describe('SRTM terrain from Terrarium tiles', () => {
  it('decodes Terrarium RGB to metres', () => {
    expect(decodeTerrarium(128, 0, 0)).toBe(0);
    expect(decodeTerrarium(128, 100, 128)).toBeCloseTo(100.5, 6);
  });

  it('maps a point to its tile and pixel', () => {
    const { tx, ty, px, py } = tilePixel(-28.4664, -62.8459, 13);
    expect(tx).toBe(2665);
    expect(ty).toBeGreaterThan(4700);
    expect(px).toBeGreaterThanOrEqual(0);
    expect(py).toBeLessThan(256);
  });

  it('samples a grid strictly inside the lot', () => {
    const pts = gridInside(square, 400, 30);
    expect(pts.length).toBeGreaterThan(300);
    expect(pts.length).toBeLessThanOrEqual(400);
    expect(pts.every(([la, lo]) => pointInRing(la, lo, square))).toBe(true);
    expect(pointInRing(lat0 - 0.01, lon0, square)).toBe(false);
  });

  it('recovers the general slope and its downhill direction from a fitted plane', () => {
    const st = terrainStats(synth(2), 'srtm')!;
    expect(st.slopePct).toBeCloseTo(2, 1);
    expect(st.slopeClass).toBe('gentle');
    expect(st.aspectDeg!).toBeCloseTo(270, 0); // rises to the east → water runs west
    expect(st.reliefM).toBeGreaterThan(15); // 2 % over ~1 km, 5th–95th percentile
  });

  it('does not invent slope on a flat field with SRTM-like noise', () => {
    const st = terrainStats(synth(0, 3), 'srtm')!;
    expect(st.slopePct).toBeLessThan(0.3);
    expect(st.slopeClass).toBe('flat');
  });

  it('ignores void values and needs at least three samples', () => {
    const s = synth(1);
    s[0]!.elev = -32768;
    expect(terrainStats(s, 'srtm')!.samples).toBe(s.length - 1);
    expect(terrainStats(s.slice(0, 2), 'srtm')).toBeNull();
    expect(fitPlane(s.slice(0, 2))).toBeNull();
  });

  it('classifies slope with the engine thresholds', () => {
    expect(classifySlope(0.4)).toBe('flat');
    expect(classifySlope(2.5)).toBe('gentle');
    expect(classifySlope(6)).toBe('steep');
  });
});
