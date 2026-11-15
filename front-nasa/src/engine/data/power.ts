/**
 * NASA POWER (Prediction Of Worldwide Energy Resources) – Agroclimatology community.
 * Docs: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
 *
 * The API is public, needs no key and sends CORS headers, so the browser can call it directly.
 * We validate the payload at this boundary: nothing downstream trusts the raw JSON shape.
 */

export const POWER_PARAMETERS = [
  'T2M_MAX', // daily max air temperature at 2 m (°C)
  'T2M_MIN', // daily min air temperature at 2 m (°C)
  'PRECTOTCORR', // bias-corrected precipitation (mm/day), MERRA-2 based – validate against GPM IMERG
  'GWETROOT', // root-zone soil wetness (0–1), MERRA-2 land model – validate against SMAP L4
  'GWETTOP', // surface soil wetness (0–1)
] as const;

export type PowerParameter = (typeof POWER_PARAMETERS)[number];

export interface DailyRecord {
  /** ISO date, YYYY-MM-DD */
  date: string;
  year: number;
  /** 1–12 */
  month: number;
  /** day of year, 1–366 */
  doy: number;
  tmax: number;
  tmin: number;
  precip: number;
  rootWetness: number | null;
  topWetness: number | null;
}

export interface ClimateSeries {
  lat: number;
  lon: number;
  elevationM: number | null;
  startYear: number;
  endYear: number;
  days: DailyRecord[];
  /** Days dropped because a required variable was missing (fill value). */
  droppedDays: number;
  /** Set when `year` holds the campaign (Jul–Jun) instead of the calendar year (ENSO subsets). */
  yearIsCampaign?: boolean;
}

const BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const FILL_VALUE = -999;
const REQUEST_TIMEOUT_MS = 30_000;

export class PowerApiError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'PowerApiError';
  }
}

export function buildPowerUrl(lat: number, lon: number, startYear: number, endYear: number): string {
  assertCoordinates(lat, lon);
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || startYear > endYear) {
    throw new RangeError(`Invalid year range ${startYear}–${endYear}`);
  }
  const params = new URLSearchParams({
    parameters: POWER_PARAMETERS.join(','),
    community: 'AG',
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    start: `${startYear}0101`,
    end: `${endYear}1231`,
    format: 'JSON',
  });
  return `${BASE_URL}?${params.toString()}`;
}

export async function fetchClimateSeries(
  lat: number,
  lon: number,
  startYear: number,
  endYear: number,
  fetchImpl: typeof fetch = fetch,
): Promise<ClimateSeries> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetchImpl(buildPowerUrl(lat, lon, startYear, endYear), { signal: controller.signal });
  } catch (err) {
    throw new PowerApiError('Could not reach NASA POWER (network error or timeout).', err);
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new PowerApiError(`NASA POWER answered HTTP ${response.status}.`);
  }
  const json: unknown = await response.json();
  return parsePowerResponse(json, lat, lon, startYear, endYear);
}

/** Pure parser – exported for tests. */
export function parsePowerResponse(
  json: unknown,
  lat: number,
  lon: number,
  startYear: number,
  endYear: number,
): ClimateSeries {
  const parameter = getPath(json, ['properties', 'parameter']);
  if (!isRecord(parameter)) {
    throw new PowerApiError('Unexpected NASA POWER payload: missing properties.parameter.');
  }

  const series: Record<PowerParameter, Record<string, unknown>> = {} as Record<PowerParameter, Record<string, unknown>>;
  for (const p of POWER_PARAMETERS) {
    const values = parameter[p];
    if (!isRecord(values)) throw new PowerApiError(`NASA POWER payload is missing parameter ${p}.`);
    series[p] = values;
  }

  const coords = getPath(json, ['geometry', 'coordinates']);
  const elevation = Array.isArray(coords) && typeof coords[2] === 'number' ? coords[2] : null;

  const days: DailyRecord[] = [];
  let droppedDays = 0;
  for (const key of Object.keys(series.T2M_MAX).sort()) {
    const tmax = cleanNumber(series.T2M_MAX[key]);
    const tmin = cleanNumber(series.T2M_MIN[key]);
    const precip = cleanNumber(series.PRECTOTCORR[key]);
    if (tmax === null || tmin === null || precip === null) {
      droppedDays++;
      continue;
    }
    const date = parseYyyymmdd(key);
    if (!date) {
      droppedDays++;
      continue;
    }
    days.push({
      ...date,
      tmax,
      tmin,
      precip,
      rootWetness: cleanNumber(series.GWETROOT[key]),
      topWetness: cleanNumber(series.GWETTOP[key]),
    });
  }

  if (days.length < 360) {
    throw new PowerApiError('NASA POWER returned less than one year of usable data for this point.');
  }

  return { lat, lon, elevationM: elevation, startYear, endYear, days, droppedDays };
}

function cleanNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v !== FILL_VALUE ? v : null;
}

function parseYyyymmdd(key: string): Pick<DailyRecord, 'date' | 'year' | 'month' | 'doy'> | null {
  if (!/^\d{8}$/.test(key)) return null;
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(4, 6));
  const day = Number(key.slice(6, 8));
  const utc = Date.UTC(year, month - 1, day);
  const doy = Math.floor((utc - Date.UTC(year, 0, 1)) / 86_400_000) + 1;
  return { date: `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`, year, month, doy };
}

function assertCoordinates(lat: number, lon: number): void {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new RangeError(`Invalid latitude ${lat}`);
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new RangeError(`Invalid longitude ${lon}`);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function getPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (!isRecord(cur)) return undefined;
    cur = cur[k];
  }
  return cur;
}
