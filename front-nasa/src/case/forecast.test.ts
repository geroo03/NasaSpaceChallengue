import { describe, expect, it } from 'vitest';
import { dayAlerts, forecastUrl, parseForecast, weekSummary } from './forecast';

const sample = {
  daily: {
    time: ['2026-11-16', '2026-11-17', '2026-11-18'],
    temperature_2m_max: [38.2, 30, 28],
    temperature_2m_min: [20, 1.5, 15],
    precipitation_sum: [0, 0, 24],
    precipitation_probability_max: [5, 10, 90],
    wind_speed_10m_max: [12, 28, 15],
    et0_fao_evapotranspiration: [7, 6, 3],
  },
};

describe('forecast', () => {
  it('builds an Open-Meteo URL for the lot', () => {
    const u = new URL(forecastUrl(-28.38175, -62.73655));
    expect(u.host).toBe('api.open-meteo.com');
    expect(u.searchParams.get('latitude')).toBe('-28.3818');
    expect(u.searchParams.get('forecast_days')).toBe('7');
  });
  it('parses days and flags heat, frost, wind and rain', () => {
    const days = parseForecast(sample);
    expect(days).toHaveLength(3);
    expect(dayAlerts(days[0]!)).toEqual(['heat']);
    expect(dayAlerts(days[1]!)).toEqual(['frost', 'wind']);
    expect(dayAlerts(days[2]!)).toEqual(['rain']);
  });
  it('sums the week: rain minus ET0, and calm dry days for spraying', () => {
    const s = weekSummary(parseForecast(sample));
    expect(s.rainMm).toBe(24);
    expect(s.et0Mm).toBe(16);
    expect(s.balanceMm).toBe(8);
    expect(s.sprayDays).toEqual(['2026-11-16']);
    expect(s.hotDays).toBe(1);
  });
  it('rejects a malformed answer', () => {
    expect(() => parseForecast({})).toThrow();
  });
});
