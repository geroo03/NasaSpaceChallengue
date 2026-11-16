import type { SoilTexture } from './model';

/**
 * Soil of the lot from ISRIC SoilGrids 2.0 (global 250 m maps, modelled from soil profiles; CC-BY 4.0).
 * Public REST API with CORS and no key. We read, for the 0–100 cm root zone:
 *  - volumetric water content at field capacity (wv0033, 33 kPa) and wilting point (wv1500, 1500 kPa)
 *    → plant-available water (PAW) = Σ (FC − WP) × layer thickness. This replaces the generic 120 mm.
 *  - sand, clay and soil organic carbon, to describe the soil in words.
 * It is a modelled map, not a lab analysis of the field: a soil test replaces it.
 */

export interface SoilLayer {
  depth: string; // '0-5cm'
  thicknessMm: number;
  sandPct: number;
  clayPct: number;
  /** null = SoilGrids has no organic carbon value for this layer (unknown, not zero). */
  socGkg: number | null;
  fcPct: number; // % volume at 33 kPa
  wpPct: number; // % volume at 1500 kPa
}

export interface SoilSummary {
  source: 'soilgrids' | 'declared';
  lat: number;
  lon: number;
  retrievedOn: string;
  /** Plant-available water 0–100 cm, mm. */
  pawMm: number;
  /** Texture of the top 30 cm (where seed and roots start). */
  sandPct: number;
  clayPct: number;
  siltPct: number;
  /** Organic carbon of the top 30 cm, g/kg; null when any of those layers lacks it. */
  socGkg: number | null;
  texture: Exclude<SoilTexture, 'unknown'>;
  layers: SoilLayer[];
}

export const SOIL_PROPERTIES = ['wv0033', 'wv1500', 'sand', 'clay', 'soc'] as const;
export const SOIL_DEPTHS = ['0-5cm', '5-15cm', '15-30cm', '30-60cm', '60-100cm'] as const;
const THICKNESS_MM: Record<(typeof SOIL_DEPTHS)[number], number> = { '0-5cm': 50, '5-15cm': 100, '15-30cm': 150, '30-60cm': 300, '60-100cm': 400 };

export function soilgridsUrl(lat: number, lon: number): string {
  const p = new URLSearchParams();
  p.set('lon', lon.toFixed(5));
  p.set('lat', lat.toFixed(5));
  SOIL_PROPERTIES.forEach((x) => p.append('property', x));
  SOIL_DEPTHS.forEach((d) => p.append('depth', d));
  p.append('value', 'mean');
  return `https://rest.isric.org/soilgrids/v2.0/properties/query?${p.toString()}`;
}

export class SoilError extends Error {
  constructor(readonly code: 'noData' | 'http' | 'shape') {
    super(code);
    this.name = 'SoilError';
  }
}

/**
 * Three classes the app speaks in. USDA texture triangle collapsed:
 * sand / loamy sand / sandy loam → sandy; clay, silty clay, sandy clay (≥ 35 % clay) → clay; the rest → loam.
 */
export function textureClass(sandPct: number, clayPct: number): Exclude<SoilTexture, 'unknown'> {
  if (clayPct >= 35) return 'clay';
  const sandOrLoamySand = sandPct >= 70 && clayPct < 15;
  const sandyLoam = (sandPct >= 52 && clayPct < 20) || (sandPct >= 43 && clayPct < 7);
  if (sandOrLoamySand || sandyLoam) return 'sandy';
  return 'loam';
}

interface SgLayer {
  name: string;
  unit_measure?: { d_factor?: number };
  depths: { label: string; values: { mean: number | null } }[];
}

export function parseSoilgrids(json: unknown, lat: number, lon: number, retrievedOn: string): SoilSummary {
  const layers = (json as { properties?: { layers?: SgLayer[] } })?.properties?.layers;
  if (!Array.isArray(layers)) throw new SoilError('shape');
  const get = (name: string, depth: string): number | null => {
    const l = layers.find((x) => x.name === name);
    const v = l?.depths.find((d) => d.label === depth)?.values.mean;
    if (v === null || v === undefined || !Number.isFinite(v)) return null;
    return v / (l?.unit_measure?.d_factor ?? 10);
  };
  const out: SoilLayer[] = [];
  for (const depth of SOIL_DEPTHS) {
    const fc = get('wv0033', depth); // 10⁻² cm³/cm³ = % volume
    const wp = get('wv1500', depth);
    const sand = get('sand', depth); // %
    const clay = get('clay', depth); // %
    const soc = get('soc', depth); // g/kg
    if (fc === null || wp === null || sand === null || clay === null) continue;
    out.push({ depth, thicknessMm: THICKNESS_MM[depth], sandPct: sand, clayPct: clay, socGkg: soc, fcPct: fc, wpPct: wp });
  }
  // Water and urban areas have no values, and a profile missing a layer would understate the 1 m
  // reserve: say so instead of inventing a soil (the engine falls back to the generic reserve).
  if (out.length < SOIL_DEPTHS.length) throw new SoilError('noData');
  const pawMm = out.reduce((acc, l) => acc + (Math.max(0, l.fcPct - l.wpPct) / 100) * l.thicknessMm, 0);
  const top = out.filter((l) => l.depth === '0-5cm' || l.depth === '5-15cm' || l.depth === '15-30cm');
  const w = top.reduce((a, l) => a + l.thicknessMm, 0) || 1;
  const avg = (f: (l: SoilLayer) => number) => top.reduce((a, l) => a + f(l) * l.thicknessMm, 0) / w;
  const sandPct = avg((l) => l.sandPct);
  const clayPct = avg((l) => l.clayPct);
  return {
    source: 'soilgrids',
    lat,
    lon,
    retrievedOn,
    pawMm,
    sandPct,
    clayPct,
    siltPct: Math.max(0, 100 - sandPct - clayPct),
    socGkg: top.every((l) => l.socGkg !== null) ? avg((l) => l.socGkg!) : null,
    texture: textureClass(sandPct, clayPct),
    layers: out,
  };
}

/** Saved SoilGrids answers shipped with the app (unmodified), so the demo point works offline. */
const SAVED: { lat: number; lon: number; url: string; retrievedOn: string }[] = [
  { lat: -28.38175, lon: -62.73655, url: `${import.meta.env.BASE_URL}data/soilgrids-anatuya-example.json`, retrievedOn: '2026-11-14' },
];

/** SoilGrids can take 10–15 s; in the field we never wait forever. A point with a saved answer waits less. */
export const SOIL_TIMEOUT_MS = 25_000;
export const SOIL_TIMEOUT_SAVED_MS = 6_000;

export async function fetchSoil(lat: number, lon: number, signal?: AbortSignal): Promise<SoilSummary> {
  const saved = SAVED.find((s) => Math.abs(s.lat - lat) < 1e-4 && Math.abs(s.lon - lon) < 1e-4);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), saved ? SOIL_TIMEOUT_SAVED_MS : SOIL_TIMEOUT_MS);
  const stop = () => ctrl.abort();
  signal?.addEventListener('abort', stop);
  try {
    const res = await fetch(soilgridsUrl(lat, lon), { signal: ctrl.signal });
    if (!res.ok) throw new SoilError('http');
    // A copy stored on this device by the service worker keeps its original date.
    const on = res.headers.get('x-fs-cached-on') ?? new Date().toISOString().slice(0, 10);
    return parseSoilgrids(await res.json(), lat, lon, on);
  } catch (err) {
    if (signal?.aborted) throw err; // the point changed: nobody needs this answer
    if (!saved || (err instanceof SoilError && err.code === 'noData')) throw err;
    const res = await fetch(saved.url, { signal });
    if (!res.ok) throw err;
    return parseSoilgrids(await res.json(), lat, lon, saved.retrievedOn);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', stop);
  }
}
