import type { ClimateSeries, DailyRecord } from '../data/power';

/**
 * Deterministic synthetic climate for tests: seasonal temperature + rainfall cycle.
 * `summerPeakDoy` ≈ 15 for the southern hemisphere, ≈ 196 for the northern one.
 */
export function syntheticSeries(opts: {
  lat: number;
  years: number;
  startYear?: number;
  tmeanAnnual?: number;
  tAmplitude?: number;
  annualRainMm?: number;
  rootWetness?: number;
}): ClimateSeries {
  const startYear = opts.startYear ?? 2010;
  const tmeanAnnual = opts.tmeanAnnual ?? 20;
  const amp = opts.tAmplitude ?? 8;
  const rain = opts.annualRainMm ?? 700;
  const peak = opts.lat < 0 ? 15 : 196;
  const days: DailyRecord[] = [];
  for (let y = startYear; y < startYear + opts.years; y++) {
    const n = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
    for (let doy = 1; doy <= n; doy++) {
      const date = new Date(Date.UTC(y, 0, doy));
      const season = Math.cos((2 * Math.PI * (doy - peak)) / 365); // +1 summer, −1 winter
      const tmean = tmeanAnnual + amp * season;
      // rain concentrated in summer: weight (1 + season)
      const precip = (rain / 365) * (1 + season);
      days.push({
        date: date.toISOString().slice(0, 10),
        year: y,
        month: date.getUTCMonth() + 1,
        doy,
        tmax: tmean + 7,
        tmin: tmean - 7,
        precip,
        rootWetness: opts.rootWetness ?? 0.5,
        topWetness: opts.rootWetness ?? 0.5,
      });
    }
  }
  return { lat: opts.lat, lon: -64, elevationM: 200, startYear, endYear: startYear + opts.years - 1, days, droppedDays: 0 };
}
