/** ECOSTRESS Collection 2 ETdaily: integrated daytime actual ET in mm/day, not reference ET₀. */
export const ECOSTRESS_PRODUCT = 'ECO_L3T_JET.002';
export const ECOSTRESS_UNIT = 'mm/day';
export const ECOSTRESS_LAYERS = ['ETdaily', 'cloud', 'water'] as const;
export const MAX_CSV_BYTES = 2_000_000;
export interface Point { lat: number; lon: number }
export interface Extraction extends Point { from: string; to: string }
export interface Observation { date: string; etMmDay: number }
export interface EcostressData extends Point {
  product: typeof ECOSTRESS_PRODUCT;
  observations: Observation[];
  rejected: { cloud: number; water: number; missing: number };
  otherPoints: number;
}
export class EcostressError extends Error {
  constructor(readonly code: string) { super(code); this.name = 'EcostressError'; }
}

export function validPoint(p: Point): boolean {
  return Number.isFinite(p.lat) && Math.abs(p.lat) <= 52 && Number.isFinite(p.lon) && Math.abs(p.lon) <= 180;
}
export function isoDate(value: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  const us = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(value);
  const s = iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : us ? `${us[3]}-${us[1]}-${us[2]}` : '';
  const n = Date.parse(`${s}T00:00:00Z`);
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === s ? s : null;
}
export function validateExtraction(value: unknown, today = new Date()): Extraction {
  const x = value as Partial<Extraction> | null;
  if (!x || typeof x.lat !== 'number' || typeof x.lon !== 'number' || !validPoint(x as Point)) throw new EcostressError('point');
  const from = typeof x.from === 'string' ? isoDate(x.from) : null;
  const to = typeof x.to === 'string' ? isoDate(x.to) : null;
  if (!from || !to || from < '2018-07-01' || from > to || to > today.toISOString().slice(0, 10) || Date.parse(to) - Date.parse(from) > 180 * 86400000) throw new EcostressError('dates');
  return { lat: x.lat, lon: x.lon, from, to };
}
export function defaultPeriod(today = new Date()): Pick<Extraction, 'from' | 'to'> {
  return { from: new Date(today.getTime() - 90 * 86400000).toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
}
export function appeearsTask(x: Extraction) {
  const us = (d: string) => `${d.slice(5, 7)}-${d.slice(8, 10)}-${d.slice(0, 4)}`;
  return {
    task_type: 'point', task_name: `Field-Shift-ECOSTRESS-${x.from}-${x.to}`,
    params: {
      dates: [{ startDate: us(x.from), endDate: us(x.to) }],
      layers: ECOSTRESS_LAYERS.map((layer) => ({ product: ECOSTRESS_PRODUCT, layer })),
      coordinates: [{ id: 'field-shift', category: 'analysis-point', latitude: x.lat, longitude: x.lon }],
    },
  };
}

/** RFC 4180: quoted names, commas, escaped quotes and CRLF; bound before parsing untrusted files. */
export function csvRows(text: string): string[][] {
  if (new TextEncoder().encode(text).length > MAX_CSV_BYTES) throw new EcostressError('large');
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
  const s = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === '"') {
      if (quoted && s[i + 1] === '"') { field += '"'; i++; }
      else if (quoted || field === '') quoted = !quoted;
      else throw new EcostressError('csv');
    } else if (!quoted && (c === ',' || c === '\n' || c === '\r')) {
      row.push(field.trim()); field = '';
      if (c !== ',') {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (c === '\r' && s[i + 1] === '\n') i++;
      }
    } else field += c;
  }
  if (quoted) throw new EcostressError('csv');
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}
const normal = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
const numeric = (x: string | undefined) => x !== undefined && x.trim() !== '' ? Number(x) : NaN;

/** AppEEARS point CSV, with all three pinned-product layers. Never accepts unknown flags as clear. */
export function parseEcostressCsv(text: string, point: Point): EcostressData {
  const [header, ...rows] = csvRows(text);
  if (!header || !rows.length) throw new EcostressError('csv');
  const h = header.map(normal);
  const field = (name: string) => h.indexOf(normal(name));
  const lat = field('Latitude'), lon = field('Longitude'), date = field('Date');
  const layer = (name: string) => field(`ECO_L3T_JET_002_${name}`);
  const et = layer('ETdaily'), cloud = layer('cloud'), water = layer('water');
  if ([lat, lon, date, et].some((n) => n < 0)) throw new EcostressError('product');
  if (cloud < 0 || water < 0) throw new EcostressError('quality');
  const out: EcostressData = { ...point, product: ECOSTRESS_PRODUCT, observations: [], rejected: { cloud: 0, water: 0, missing: 0 }, otherPoints: 0 };
  let matching = 0;
  for (const r of rows) {
    const a = numeric(r[lat]), b = numeric(r[lon]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - point.lat) > 1e-4 || Math.abs(b - point.lon) > 1e-4) { out.otherPoints++; continue; }
    matching++;
    const d = isoDate(r[date] ?? ''); const flux = numeric(r[et]); const c = numeric(r[cloud]); const w = numeric(r[water]);
    if (!d || !Number.isFinite(flux) || flux < 0 || ![0, 1].includes(c) || ![0, 1].includes(w)) { out.rejected.missing++; continue; }
    if (c === 1) { out.rejected.cloud++; continue; }
    if (w === 1) { out.rejected.water++; continue; }
    out.observations.push({ date: d, etMmDay: flux });
  }
  if (!matching) throw new EcostressError('mismatch');
  out.observations.sort((a, b) => b.date.localeCompare(a.date));
  return out;
}

export interface EcostressScene { id: string; granule: string; acquiredAt: string }
export function hasEcostressSnapshot(point: Point): boolean {
  return Math.abs(point.lat + 28.38175) < 1e-4 && Math.abs(point.lon + 62.73655) < 1e-4;
}
export async function loadEcostressSnapshot(point: Point, signal?: AbortSignal): Promise<{ csv: string; retrievedOn: string }> {
  if (!hasEcostressSnapshot(point)) throw new EcostressError('mismatch');
  const response = await fetch('/data/ecostress-anatuya-example-2026-09.json', { signal });
  if (!response.ok) throw new EcostressError('network');
  const s = await response.json() as { product?: string; unit?: string; lat: number; lon: number; csv?: string; retrievedOn?: string };
  if (s.product !== ECOSTRESS_PRODUCT || s.unit !== ECOSTRESS_UNIT || !hasEcostressSnapshot(s) || typeof s.csv !== 'string' || !s.retrievedOn || !isoDate(s.retrievedOn)) throw new EcostressError('product');
  parseEcostressCsv(s.csv, point);
  return { csv: s.csv, retrievedOn: s.retrievedOn };
}
export function catalogUrl(x: Extraction): string {
  const p = new URLSearchParams({ short_name: 'ECO_L3T_JET', version: '002', point: `${x.lon.toFixed(5)},${x.lat.toFixed(5)}`, temporal: `${x.from}T00:00:00Z,${x.to}T23:59:59Z`, sort_key: '-start_date', page_size: '8' });
  return `https://cmr.earthdata.nasa.gov/search/granules.json?${p}`;
}
export async function searchEcostress(x: Extraction, signal?: AbortSignal): Promise<EcostressScene[]> {
  const r = await fetch(catalogUrl(x), { signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(20_000)]) });
  if (!r.ok) throw new EcostressError('network');
  const json = await r.json() as { feed?: { entry?: { id?: string; title?: string; time_start?: string }[] } };
  if (!Array.isArray(json.feed?.entry)) throw new EcostressError('network');
  return json.feed.entry.filter((s) => s.id && s.title?.startsWith('ECOv002_L3T_JET_') && s.time_start && Number.isFinite(Date.parse(s.time_start)))
    .map((s) => ({ id: s.id!, granule: s.title!, acquiredAt: s.time_start! }));
}
