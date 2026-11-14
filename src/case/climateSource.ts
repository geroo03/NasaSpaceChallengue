import { fetchClimateSeries, parsePowerResponse, type ClimateSeries } from '../engine/data/power';

/** Provenance of the series actually used, shown next to every result. */
export interface LoadedSeries {
  series: ClimateSeries;
  origin: 'live' | 'saved';
  /** ISO date the data was downloaded. */
  retrievedOn: string;
  startYear: number;
  endYear: number;
}

/** The snapshot shipped with the app (downloaded and checked on 2026-11-14). */
export const SAVED_SNAPSHOT = {
  url: `${import.meta.env.BASE_URL}data/power-sde-2011-2025.json`,
  lat: -27.7834,
  lon: -64.2642,
  startYear: 2011,
  endYear: 2025,
  retrievedOn: '2026-11-14',
  sha256: 'c5c4cab935fbfe2b74bf634ef560cb2a7bcdd7d830d1e6f85dd1a5e4db0f5725',
};

export function yearRange(years: number, today = new Date()): { startYear: number; endYear: number } {
  const endYear = today.getFullYear() - 1; // last complete year
  const n = Math.min(30, Math.max(5, Math.round(years)));
  return { startYear: endYear - n + 1, endYear };
}

export function snapshotMatches(lat: number, lon: number): boolean {
  return Math.abs(lat - SAVED_SNAPSHOT.lat) < 1e-4 && Math.abs(lon - SAVED_SNAPSHOT.lon) < 1e-4;
}

export async function loadLive(lat: number, lon: number, years: number): Promise<LoadedSeries> {
  const { startYear, endYear } = yearRange(years);
  const series = await fetchClimateSeries(lat, lon, startYear, endYear);
  return { series, origin: 'live', retrievedOn: new Date().toISOString().slice(0, 10), startYear, endYear };
}

export async function loadSaved(): Promise<LoadedSeries> {
  const res = await fetch(SAVED_SNAPSHOT.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  const s = SAVED_SNAPSHOT;
  return {
    series: parsePowerResponse(json, s.lat, s.lon, s.startYear, s.endYear),
    origin: 'saved',
    retrievedOn: s.retrievedOn,
    startYear: s.startYear,
    endYear: s.endYear,
  };
}
