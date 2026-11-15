import type { LatLon } from './flightOrder';

/**
 * Terrain data for a lot from NASA SRTM (~30 m), read from the public AWS Terrain Tiles
 * (Terrarium encoding, CORS-enabled, no key; each tile declares its source, e.g. srtm/S29W063.tif).
 *
 * SRTM has a vertical noise of a few metres, so per-pixel slopes on flat Chaco fields would be
 * meaningless. We report:
 *  - relief as the 5th–95th percentile range (not min/max, which are dominated by noise and trees),
 *  - the general slope of the lot from a least-squares plane fitted to every sample.
 * A drone DSM with RTK (centimetres) replaces this estimate when loaded.
 */

export interface TerrainSample {
  lat: number;
  lon: number;
  elev: number;
}

export interface TerrainStats {
  source: 'srtm' | 'drone';
  samples: number;
  meanM: number;
  p5M: number;
  p95M: number;
  reliefM: number;
  /** General slope of the lot (fitted plane), percent. */
  slopePct: number;
  /** Downhill direction of the fitted plane, degrees clockwise from north; null when practically flat. */
  aspectDeg: number | null;
  slopeClass: 'flat' | 'gentle' | 'steep';
}

export const TERRAIN_ZOOM = 13; // ≈ 17 m/px at 28° S; SRTM itself is ~30 m
const TILE = 256;

export function decodeTerrarium(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

export function tilePixel(lat: number, lon: number, z: number): { tx: number; ty: number; px: number; py: number } {
  const n = 2 ** z;
  const x = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n;
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  return { tx, ty, px: Math.min(TILE - 1, Math.floor((x - tx) * TILE)), py: Math.min(TILE - 1, Math.floor((y - ty) * TILE)) };
}

export function pointInRing(lat: number, lon: number, ring: LatLon[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i]!;
    const [yj, xj] = ring[j]!;
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Regular grid of points inside the lot, spaced so there are at most ~maxPoints and never closer than minSpacingM. */
export function gridInside(ring: LatLon[], maxPoints = 900, minSpacingM = 30): LatLon[] {
  const lats = ring.map((p) => p[0]);
  const lons = ring.map((p) => p[1]);
  const [s, n, w, e] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
  const midLat = ((s + n) / 2) * (Math.PI / 180);
  const hM = (n - s) * 110_574;
  const wM = (e - w) * 111_320 * Math.cos(midLat);
  const spacing = Math.max(minSpacingM, Math.sqrt((hM * wM) / maxPoints));
  const dLat = spacing / 110_574;
  const dLon = spacing / (111_320 * Math.cos(midLat));
  const out: LatLon[] = [];
  for (let lat = s + dLat / 2; lat < n; lat += dLat) {
    for (let lon = w + dLon / 2; lon < e; lon += dLon) {
      if (pointInRing(lat, lon, ring)) out.push([lat, lon]);
    }
  }
  return out;
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (i - lo);
}

export function classifySlope(slopePct: number): TerrainStats['slopeClass'] {
  // Same classes the rotation engine uses: flat < 1 %, gentle 1–4 %, steep > 4 %.
  if (slopePct < 1) return 'flat';
  if (slopePct <= 4) return 'gentle';
  return 'steep';
}

/** Least-squares plane z = a·x + b·y + c over local metric coordinates (x east, y north). */
export function fitPlane(samples: TerrainSample[]): { a: number; b: number } | null {
  if (samples.length < 3) return null;
  const lat0 = samples.reduce((acc, s) => acc + s.lat, 0) / samples.length;
  const lon0 = samples.reduce((acc, s) => acc + s.lon, 0) / samples.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  let sxx = 0, sxy = 0, syy = 0, sxz = 0, syz = 0, sz = 0, sx = 0, sy = 0;
  const n = samples.length;
  for (const s of samples) {
    const x = (s.lon - lon0) * 111_320 * k;
    const y = (s.lat - lat0) * 110_574;
    sx += x; sy += y; sz += s.elev;
    sxx += x * x; syy += y * y; sxy += x * y; sxz += x * s.elev; syz += y * s.elev;
  }
  // Centre the normal equations (removes c).
  const cxx = sxx - (sx * sx) / n;
  const cyy = syy - (sy * sy) / n;
  const cxy = sxy - (sx * sy) / n;
  const cxz = sxz - (sx * sz) / n;
  const cyz = syz - (sy * sz) / n;
  const det = cxx * cyy - cxy * cxy;
  if (Math.abs(det) < 1e-9) return null;
  return { a: (cxz * cyy - cyz * cxy) / det, b: (cyz * cxx - cxz * cxy) / det };
}

export function terrainStats(samples: TerrainSample[], source: TerrainStats['source']): TerrainStats | null {
  const valid = samples.filter((s) => Number.isFinite(s.elev) && s.elev > -500 && s.elev < 9000);
  if (valid.length < 3) return null;
  const elevs = valid.map((s) => s.elev).sort((x, y) => x - y);
  const plane = fitPlane(valid);
  const slopePct = plane ? Math.hypot(plane.a, plane.b) * 100 : 0;
  // Downhill = opposite of the gradient (a east, b north).
  const aspectDeg = plane && slopePct >= 0.05 ? (Math.atan2(-plane.a, -plane.b) * (180 / Math.PI) + 360) % 360 : null;
  const p5 = quantile(elevs, 0.05);
  const p95 = quantile(elevs, 0.95);
  return {
    source,
    samples: valid.length,
    meanM: elevs.reduce((x, y) => x + y, 0) / elevs.length,
    p5M: p5,
    p95M: p95,
    reliefM: p95 - p5,
    slopePct,
    aspectDeg,
    slopeClass: classifySlope(slopePct),
  };
}

export function terrainTileUrl(z: number, x: number, y: number): string {
  return `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
}

/** Browser only: loads the needed Terrarium tiles and samples elevations on a grid inside the lot. */
export async function sampleSrtm(ring: LatLon[], z = TERRAIN_ZOOM): Promise<{ stats: TerrainStats | null; sources: string[] }> {
  const points = gridInside(ring);
  if (points.length < 3) {
    // Very small lot: sample its vertices and centre instead.
    points.push(...ring);
  }
  const byTile = new Map<string, { tx: number; ty: number; pts: { lat: number; lon: number; px: number; py: number }[] }>();
  for (const [lat, lon] of points) {
    const { tx, ty, px, py } = tilePixel(lat, lon, z);
    const key = `${tx}/${ty}`;
    if (!byTile.has(key)) byTile.set(key, { tx, ty, pts: [] });
    byTile.get(key)!.pts.push({ lat, lon, px, py });
  }
  const samples: TerrainSample[] = [];
  const sources = new Set<string>();
  await Promise.all(
    [...byTile.values()].map(async ({ tx, ty, pts }) => {
      const url = terrainTileUrl(z, tx, ty);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`terrain HTTP ${res.status}`);
      const src = res.headers.get('x-amz-meta-x-imagery-sources');
      if (src) src.split(',').forEach((s) => sources.add(s.trim()));
      const bitmap = await createImageBitmap(await res.blob());
      const canvas = document.createElement('canvas');
      canvas.width = TILE;
      canvas.height = TILE;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('canvas');
      ctx.drawImage(bitmap, 0, 0);
      const data = ctx.getImageData(0, 0, TILE, TILE).data;
      for (const p of pts) {
        const i = (p.py * TILE + p.px) * 4;
        samples.push({ lat: p.lat, lon: p.lon, elev: decodeTerrarium(data[i]!, data[i + 1]!, data[i + 2]!) });
      }
    }),
  );
  return { stats: terrainStats(samples, 'srtm'), sources: [...sources] };
}
