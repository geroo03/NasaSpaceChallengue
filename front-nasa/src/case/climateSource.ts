import { fetchClimateSeries, parsePowerResponse, type ClimateSeries } from '../engine/data/power';

/** Provenance of the series actually used, shown next to every result. */
export interface LoadedSeries {
  series: ClimateSeries;
  origin: 'live' | 'saved';
  /** ISO date the data was downloaded. */
  retrievedOn: string;
  startYear: number;
  endYear: number;
  /** Set when the live request failed and this saved series was used instead. */
  liveError?: string;
  /** Set when the answer came from this device's offline copy of an earlier query (service worker). */
  deviceCachedOn?: string;
}

export interface Snapshot {
  id: string;
  url: string;
  lat: number;
  lon: number;
  startYear: number;
  endYear: number;
  retrievedOn: string;
  sha256: string;
}

/** NASA POWER responses shipped with the app, downloaded unmodified, so the demo works without a connection. */
export const SNAPSHOTS: Snapshot[] = [
  {
    id: 'sde',
    url: `${import.meta.env.BASE_URL}data/power-sde-2011-2025.json`,
    lat: -27.7834,
    lon: -64.2642,
    startYear: 2011,
    endYear: 2025,
    retrievedOn: '2026-11-14',
    sha256: 'c5c4cab935fbfe2b74bf634ef560cb2a7bcdd7d830d1e6f85dd1a5e4db0f5725',
  },
  {
    // Centre of the example lot near Añatuya (see EXAMPLE_LOT).
    id: 'anatuya-example',
    url: `${import.meta.env.BASE_URL}data/power-anatuya-2011-2025.json`,
    lat: -28.38175,
    lon: -62.73655,
    startYear: 2011,
    endYear: 2025,
    retrievedOn: '2026-11-14',
    sha256: '45f21d5a8325f9d288fda8b24d684b574c14c8fbab909151f492cb5277761f2b',
  },
];

/** The illustrative Santiago del Estero point (inside the city). */
export const SAVED_SNAPSHOT = SNAPSHOTS[0]!;

export function yearRange(years: number, today = new Date()): { startYear: number; endYear: number } {
  const endYear = today.getFullYear() - 1; // last complete year
  const n = Math.min(30, Math.max(5, Math.round(years)));
  return { startYear: endYear - n + 1, endYear };
}

export function snapshotFor(lat: number, lon: number): Snapshot | undefined {
  return SNAPSHOTS.find((s) => Math.abs(lat - s.lat) < 1e-4 && Math.abs(lon - s.lon) < 1e-4);
}

export function snapshotMatches(lat: number, lon: number): boolean {
  return snapshotFor(lat, lon) !== undefined;
}

export async function loadLive(lat: number, lon: number, years: number): Promise<LoadedSeries> {
  const { startYear, endYear } = yearRange(years);
  // The service worker marks answers it serves from this device's storage (no signal in the field).
  let cachedOn: string | null = null;
  const marked: typeof fetch = async (input, init) => {
    const res = await fetch(input, init);
    cachedOn = res.headers.get('x-fs-cached-on');
    return res;
  };
  const series = await fetchClimateSeries(lat, lon, startYear, endYear, marked);
  if (cachedOn) return { series, origin: 'saved', retrievedOn: cachedOn, startYear, endYear, deviceCachedOn: cachedOn };
  return { series, origin: 'live', retrievedOn: new Date().toISOString().slice(0, 10), startYear, endYear };
}

export async function loadSaved(lat: number, lon: number): Promise<LoadedSeries> {
  const s = snapshotFor(lat, lon);
  if (!s) throw new Error('No saved series for this point');
  const res = await fetch(s.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  return {
    series: parsePowerResponse(json, s.lat, s.lon, s.startYear, s.endYear),
    origin: 'saved',
    retrievedOn: s.retrievedOn,
    startYear: s.startYear,
    endYear: s.endYear,
  };
}
