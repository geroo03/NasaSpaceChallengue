/** 7-day forecast from Open-Meteo (free, no key) and the field alerts it implies. */

export interface ForecastDay {
  date: string; // YYYY-MM-DD, local to the lot
  tmax: number;
  tmin: number;
  rainMm: number;
  rainProb: number | null; // %
  windKmh: number;
  et0Mm: number;
}

export type AlertKind = 'rain' | 'heat' | 'frost' | 'wind';

/** Thresholds a field technician uses; the agronomist decides what to do. */
export const LIMITS = {
  rainMm: 10, // enough to skip an irrigation
  heatC: 35, // maize and soy pollination suffer above ~35 °C
  frostC: 2, // shelter temperature ≤ 2 °C risks frost at ground level
  windKmh: 20, // above this, drift: no spraying (ground rig or drone)
} as const;

export interface Forecast {
  days: ForecastDay[];
  cachedOn: string | null; // set when the service worker answered from the device
}

export function forecastUrl(lat: number, lon: number): string {
  const p = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration',
    timezone: 'auto',
    forecast_days: '7',
  });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}

export function parseForecast(json: unknown): ForecastDay[] {
  const d = (json as { daily?: Record<string, unknown[]> })?.daily;
  if (!d || !Array.isArray(d.time)) throw new Error('forecast: unexpected response');
  const n = (k: string, i: number) => {
    const v = d[k]?.[i];
    return typeof v === 'number' && Number.isFinite(v) ? v : NaN;
  };
  const days: ForecastDay[] = [];
  d.time.forEach((date, i) => {
    const day: ForecastDay = {
      date: String(date),
      tmax: n('temperature_2m_max', i),
      tmin: n('temperature_2m_min', i),
      rainMm: n('precipitation_sum', i),
      rainProb: Number.isFinite(n('precipitation_probability_max', i)) ? n('precipitation_probability_max', i) : null,
      windKmh: n('wind_speed_10m_max', i),
      et0Mm: n('et0_fao_evapotranspiration', i),
    };
    if (Number.isFinite(day.tmax) && Number.isFinite(day.tmin)) days.push(day);
  });
  if (!days.length) throw new Error('forecast: no days');
  return days;
}

export function dayAlerts(d: ForecastDay): AlertKind[] {
  const out: AlertKind[] = [];
  if (d.rainMm >= LIMITS.rainMm) out.push('rain');
  if (d.tmax >= LIMITS.heatC) out.push('heat');
  if (d.tmin <= LIMITS.frostC) out.push('frost');
  if (d.windKmh >= LIMITS.windKmh) out.push('wind');
  return out;
}

/** Week totals: rain against crop-reference demand (ET₀). Negative balance = the soil loses water. */
export function weekSummary(days: ForecastDay[]) {
  const sum = (f: (d: ForecastDay) => number) => days.reduce((a, d) => a + (Number.isFinite(f(d)) ? f(d) : 0), 0);
  const rainMm = sum((d) => d.rainMm);
  const et0Mm = sum((d) => d.et0Mm);
  const sprayDays = days.filter((d) => d.windKmh < LIMITS.windKmh && d.rainMm < 2).map((d) => d.date);
  return { rainMm, et0Mm, balanceMm: rainMm - et0Mm, sprayDays, hotDays: days.filter((d) => d.tmax >= LIMITS.heatC).length };
}

export async function fetchForecast(lat: number, lon: number, signal?: AbortSignal): Promise<Forecast> {
  const res = await fetch(forecastUrl(lat, lon), { signal });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return { days: parseForecast(await res.json()), cachedOn: res.headers.get('x-fs-cached-on') };
}
