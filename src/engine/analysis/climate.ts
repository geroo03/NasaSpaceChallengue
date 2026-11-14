import type { ClimateSeries, DailyRecord } from '../data/power';

/**
 * Turns daily NASA POWER records into farmer-relevant indicators.
 * Everything here is a pure function so it can be unit-tested and reused (e.g. in a worker or a backend).
 */

export const HEAT_STRESS_C = 35; // Tmax above which most summer crops suffer at flowering
export const FROST_C = 0; // Tmin at or below which a frost is counted (air temperature at 2 m)
export const EXTREME_RAIN_MM = 40; // daily rain likely to cause runoff/erosion on bare soil

export interface MonthlyClimate {
  /** 1–12 */
  month: number;
  precipMm: number;
  et0Mm: number;
  /** precip − ET0: negative means the atmosphere demands more water than rain supplies */
  balanceMm: number;
  tmaxC: number;
  tminC: number;
  /** probability (0–1) that the month has at least one frost day in a given year */
  frostProb: number;
  frostDays: number;
  heatDays: number;
  extremeRainDays: number;
  /** mean root-zone soil wetness 0–1, null if unavailable */
  rootWetness: number | null;
}

export interface Trend {
  /** change per decade, in the unit of the variable */
  slopePerDecade: number;
  /** coefficient of determination of the linear fit (0–1) */
  r2: number;
  years: number;
}

export interface ClimateProfile {
  lat: number;
  lon: number;
  elevationM: number | null;
  hemisphere: 'north' | 'south';
  yearsAnalysed: number[];
  monthly: MonthlyClimate[];
  annual: {
    precipMm: number;
    et0Mm: number;
    aridityIndex: number; // P / ET0 (UNEP: <0.5 semi-arid or drier)
    heatDays: number;
    frostDays: number;
  };
  trends: {
    precipMm: Trend;
    tmaxC: Trend;
    heatDays: Trend;
    rootWetness: Trend | null;
  };
  /** Soil-moisture anomaly of the last 12 complete months vs. the long-term mean of each month (z-score). */
  recentRootWetnessAnomaly: { month: number; year: number; z: number }[];
  /** Typical last spring frost / first autumn frost expressed as day of the growing year, null if frost-free. */
  frostFreeSeasonDays: number | null;
}

/** FAO-56 eq. 21: extraterrestrial radiation (MJ m⁻² day⁻¹). */
export function extraterrestrialRadiation(latDeg: number, doy: number): number {
  const phi = (latDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * doy) / 365 - 1.39);
  const x = Math.min(1, Math.max(-1, -Math.tan(phi) * Math.tan(delta)));
  const ws = Math.acos(x);
  const gsc = 0.082;
  const ra =
    ((24 * 60) / Math.PI) *
    gsc *
    dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
  return Math.max(0, ra);
}

/**
 * FAO-56 eq. 52 (Hargreaves): reference evapotranspiration in mm/day.
 * Chosen because it only needs Tmax/Tmin + latitude, which POWER provides everywhere.
 * Known bias: overestimates in humid climates, underestimates with strong wind. Documented in the UI.
 */
export function hargreavesEt0(tmax: number, tmin: number, latDeg: number, doy: number): number {
  const tmean = (tmax + tmin) / 2;
  const range = Math.max(0, tmax - tmin);
  const raMm = 0.408 * extraterrestrialRadiation(latDeg, doy);
  return Math.max(0, 0.0023 * (tmean + 17.8) * Math.sqrt(range) * raMm);
}

export function linearTrend(xs: number[], ys: number[]): Trend {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { slopePerDecade: 0, r2: 0, years: n };
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - mx;
    const dy = ys[i]! - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0) return { slopePerDecade: 0, r2: 0, years: n };
  const slope = sxy / sxx;
  const r2 = syy === 0 ? 0 : (sxy * sxy) / (sxx * syy);
  return { slopePerDecade: slope * 10, r2, years: n };
}

export function buildClimateProfile(series: ClimateSeries): ClimateProfile {
  const byYear = groupBy(series.days, (d) => d.year);
  // Only complete years enter the statistics, otherwise partial years bias totals.
  const completeYears = [...byYear.entries()]
    .filter(([, days]) => days.length >= 360)
    .map(([y]) => y)
    .sort((a, b) => a - b);
  if (completeYears.length === 0) throw new Error('No complete year of data to analyse.');

  const usable = series.days.filter((d) => completeYears.includes(d.year));
  const et0ByDay = new Map<DailyRecord, number>();
  for (const d of usable) et0ByDay.set(d, hargreavesEt0(d.tmax, d.tmin, series.lat, d.doy));

  const nYears = completeYears.length;
  const monthly: MonthlyClimate[] = [];
  for (let m = 1; m <= 12; m++) {
    const days = usable.filter((d) => d.month === m);
    const yearsWithFrost = new Set(days.filter((d) => d.tmin <= FROST_C).map((d) => d.year));
    const wet = days.map((d) => d.rootWetness).filter((v): v is number => v !== null);
    const precip = sum(days.map((d) => d.precip)) / nYears;
    const et0 = sum(days.map((d) => et0ByDay.get(d) ?? 0)) / nYears;
    monthly.push({
      month: m,
      precipMm: precip,
      et0Mm: et0,
      balanceMm: precip - et0,
      tmaxC: mean(days.map((d) => d.tmax)),
      tminC: mean(days.map((d) => d.tmin)),
      frostProb: yearsWithFrost.size / nYears,
      frostDays: days.filter((d) => d.tmin <= FROST_C).length / nYears,
      heatDays: days.filter((d) => d.tmax >= HEAT_STRESS_C).length / nYears,
      extremeRainDays: days.filter((d) => d.precip >= EXTREME_RAIN_MM).length / nYears,
      rootWetness: wet.length ? mean(wet) : null,
    });
  }

  const annualPrecip = completeYears.map((y) => sum(byYear.get(y)!.map((d) => d.precip)));
  const annualTmax = completeYears.map((y) => mean(byYear.get(y)!.map((d) => d.tmax)));
  const annualHeat = completeYears.map((y) => byYear.get(y)!.filter((d) => d.tmax >= HEAT_STRESS_C).length);
  const annualWet = completeYears.map((y) => {
    const v = byYear.get(y)!.map((d) => d.rootWetness).filter((x): x is number => x !== null);
    return v.length ? mean(v) : NaN;
  });
  const wetOk = annualWet.every((v) => Number.isFinite(v));

  const totalP = sum(monthly.map((m) => m.precipMm));
  const totalEt0 = sum(monthly.map((m) => m.et0Mm));

  return {
    lat: series.lat,
    lon: series.lon,
    elevationM: series.elevationM,
    hemisphere: series.lat < 0 ? 'south' : 'north',
    yearsAnalysed: completeYears,
    monthly,
    annual: {
      precipMm: totalP,
      et0Mm: totalEt0,
      aridityIndex: totalEt0 > 0 ? totalP / totalEt0 : 0,
      heatDays: sum(monthly.map((m) => m.heatDays)),
      frostDays: sum(monthly.map((m) => m.frostDays)),
    },
    trends: {
      precipMm: linearTrend(completeYears, annualPrecip),
      tmaxC: linearTrend(completeYears, annualTmax),
      heatDays: linearTrend(completeYears, annualHeat),
      rootWetness: wetOk ? linearTrend(completeYears, annualWet) : null,
    },
    recentRootWetnessAnomaly: recentAnomaly(usable, completeYears),
    frostFreeSeasonDays: frostFreeSeason(usable, series.lat < 0 ? 'south' : 'north'),
  };
}

function recentAnomaly(days: DailyRecord[], years: number[]): { month: number; year: number; z: number }[] {
  // Monthly means per (year, month)
  const key = (y: number, m: number) => y * 100 + m;
  const sums = new Map<number, { s: number; n: number }>();
  for (const d of days) {
    if (d.rootWetness === null) continue;
    const k = key(d.year, d.month);
    const acc = sums.get(k) ?? { s: 0, n: 0 };
    acc.s += d.rootWetness;
    acc.n += 1;
    sums.set(k, acc);
  }
  const monthMean = (y: number, m: number) => {
    const a = sums.get(key(y, m));
    return a && a.n > 0 ? a.s / a.n : null;
  };
  const lastYear = years[years.length - 1]!;
  const out: { month: number; year: number; z: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const hist = years.map((y) => monthMean(y, m)).filter((v): v is number => v !== null);
    const current = monthMean(lastYear, m);
    if (current === null || hist.length < 3) continue;
    const mu = mean(hist);
    const sd = Math.sqrt(mean(hist.map((v) => (v - mu) ** 2)));
    out.push({ month: m, year: lastYear, z: sd > 0 ? (current - mu) / sd : 0 });
  }
  return out;
}

/**
 * Median length (days) of the frost-free period. The "growing year" starts in mid-winter
 * (July 1 in the south, January 1 in the north) so that one season is not split in two.
 */
function frostFreeSeason(days: DailyRecord[], hemisphere: 'north' | 'south'): number | null {
  if (!days.some((d) => d.tmin <= FROST_C)) return null;
  const MID = 182; // middle of the growing year ≈ peak of summer
  const seasons = new Map<number, { frostIdx: number[]; nDays: number }>();
  for (const d of days) {
    let idx: number;
    let seasonYear: number;
    if (hemisphere === 'south') {
      // growing year runs Jul 1 → Jun 30
      idx = d.doy >= 183 ? d.doy - 183 : d.doy + 182;
      seasonYear = d.doy >= 183 ? d.year : d.year - 1;
    } else {
      idx = d.doy - 1;
      seasonYear = d.year;
    }
    const s = seasons.get(seasonYear) ?? { frostIdx: [], nDays: 0 };
    s.nDays += 1;
    if (d.tmin <= FROST_C) s.frostIdx.push(idx);
    seasons.set(seasonYear, s);
  }
  const lengths: number[] = [];
  for (const { frostIdx: list, nDays } of seasons.values()) {
    if (nDays < 360) continue; // incomplete growing year at the edges of the record
    const spring = list.filter((i) => i < MID);
    const autumn = list.filter((i) => i >= MID);
    const lastSpring = spring.length ? Math.max(...spring) : 0;
    const firstAutumn = autumn.length ? Math.min(...autumn) : 365;
    lengths.push(firstAutumn - lastSpring);
  }
  if (!lengths.length) return null;
  lengths.sort((a, b) => a - b);
  return lengths[Math.floor(lengths.length / 2)] ?? null;
}

export interface Scenario {
  /** Relative rainfall change, e.g. -15 for 15 % less rain. */
  precipPct: number;
  /** Additive temperature change applied to Tmax and Tmin (°C). */
  tempC: number;
}

/**
 * Simple "delta-change" scenario: perturbs the historical record instead of inventing a forecast.
 * Soil wetness is scaled with rainfall as a first-order approximation (documented limitation).
 */
export function applyScenario(series: ClimateSeries, s: Scenario): ClimateSeries {
  if (s.precipPct === 0 && s.tempC === 0) return series;
  const pf = Math.max(0, 1 + s.precipPct / 100);
  const wf = Math.max(0, 1 + s.precipPct / 200);
  return {
    ...series,
    days: series.days.map((d) => ({
      ...d,
      tmax: d.tmax + s.tempC,
      tmin: d.tmin + s.tempC,
      precip: d.precip * pf,
      rootWetness: d.rootWetness === null ? null : Math.min(1, d.rootWetness * wf),
      topWetness: d.topWetness === null ? null : Math.min(1, d.topWetness * wf),
    })),
  };
}

export function mean(xs: number[]): number {
  return xs.length ? sum(xs) / xs.length : 0;
}

export function sum(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

function groupBy<T, K>(items: T[], key: (t: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = map.get(k);
    if (arr) arr.push(it);
    else map.set(k, [it]);
  }
  return map;
}
