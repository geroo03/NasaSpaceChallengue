/**
 * NASA HLS (Harmonized Landsat Sentinel-2) scenes for a point.
 *
 * - Scene list and cloud cover: NASA CMR granule search (public, CORS-enabled, no key).
 * - Pixels: NASA GIBS WMTS tiles of HLS surface reflectance (true colour, 30 m, no key).
 *   GIBS serves a mosaic per day, so we only offer days where CMR reports a granule over the point.
 *
 * Visual context only: nothing here feeds the rotation engine.
 */

export type HlsSensor = 'S30' | 'L30';

export interface HlsScene {
  date: string; // YYYY-MM-DD (acquisition, UTC)
  sensor: HlsSensor;
  cloudPct: number | null;
  granule: string;
}

const CMR = 'https://cmr.earthdata.nasa.gov/search/granules.json';

export function buildCmrUrl(sensor: HlsSensor, lat: number, lon: number, from: Date, to: Date, pageSize = 40): string {
  const params = new URLSearchParams({
    short_name: sensor === 'S30' ? 'HLSS30' : 'HLSL30',
    point: `${lon.toFixed(5)},${lat.toFixed(5)}`,
    temporal: `${from.toISOString().slice(0, 19)}Z,${to.toISOString().slice(0, 19)}Z`,
    sort_key: '-start_date',
    page_size: String(pageSize),
  });
  return `${CMR}?${params.toString()}`;
}

export function parseCmrGranules(json: unknown, sensor: HlsSensor): HlsScene[] {
  const entries = (json as { feed?: { entry?: unknown[] } })?.feed?.entry;
  if (!Array.isArray(entries)) throw new Error('Unexpected CMR response');
  const out: HlsScene[] = [];
  for (const e of entries) {
    const r = e as { time_start?: unknown; cloud_cover?: unknown; title?: unknown };
    if (typeof r.time_start !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(r.time_start)) continue;
    const cc = typeof r.cloud_cover === 'string' || typeof r.cloud_cover === 'number' ? Number(r.cloud_cover) : NaN;
    out.push({
      date: r.time_start.slice(0, 10),
      sensor,
      cloudPct: Number.isFinite(cc) ? cc : null,
      granule: typeof r.title === 'string' ? r.title : '',
    });
  }
  return out;
}

/** One scene per date (lowest cloud wins), newest first. */
export function mergeScenes(lists: HlsScene[][]): HlsScene[] {
  const byDate = new Map<string, HlsScene>();
  for (const s of lists.flat()) {
    const prev = byDate.get(s.date);
    if (!prev || (s.cloudPct ?? 101) < (prev.cloudPct ?? 101)) byDate.set(s.date, s);
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Most recent scene with cloud cover at or below the limit; null when none qualifies. */
export function bestScene(scenes: HlsScene[], maxCloud = 20): HlsScene | null {
  return scenes.find((s) => s.cloudPct !== null && s.cloudPct <= maxCloud) ?? null;
}

export async function searchHlsScenes(lat: number, lon: number, days = 150, fetchImpl: typeof fetch = fetch): Promise<HlsScene[]> {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const lists = await Promise.all(
    (['S30', 'L30'] as HlsSensor[]).map(async (sensor) => {
      const res = await fetchImpl(buildCmrUrl(sensor, lat, lon, from, to));
      if (!res.ok) throw new Error(`CMR HTTP ${res.status}`);
      return parseCmrGranules(await res.json(), sensor);
    }),
  );
  return mergeScenes(lists);
}

export function hlsTileUrl(sensor: HlsSensor, date: string): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/HLS_${sensor}_Nadir_BRDF_Adjusted_Reflectance/default/${date}/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png`;
}
