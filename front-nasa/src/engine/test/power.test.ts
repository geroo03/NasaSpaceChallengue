import { describe, expect, it } from 'vitest';
import { buildPowerUrl, parsePowerResponse, PowerApiError } from '../data/power';

function payload(days: Record<string, number[]>) {
  const params = ['T2M_MAX', 'T2M_MIN', 'PRECTOTCORR', 'GWETROOT', 'GWETTOP'];
  const parameter: Record<string, Record<string, number>> = {};
  params.forEach((p, i) => {
    parameter[p] = Object.fromEntries(Object.entries(days).map(([d, v]) => [d, v[i]!]));
  });
  return { geometry: { coordinates: [-64, -27, 230] }, properties: { parameter } };
}

function yearOfDays(year: number, override: Record<string, number[]> = {}) {
  const days: Record<string, number[]> = {};
  for (let i = 0; i < 365; i++) {
    const d = new Date(Date.UTC(year, 0, 1 + i)).toISOString().slice(0, 10).replace(/-/g, '');
    days[d] = [30, 15, 2, 0.5, 0.4];
  }
  return { ...days, ...override };
}

describe('NASA POWER parsing', () => {
  it('builds a valid URL with the AG community and all parameters', () => {
    const url = new URL(buildPowerUrl(-27.78, -64.26, 2010, 2024));
    expect(url.searchParams.get('community')).toBe('AG');
    expect(url.searchParams.get('start')).toBe('20100101');
    expect(url.searchParams.get('end')).toBe('20241231');
    expect(url.searchParams.get('parameters')).toContain('GWETROOT');
  });

  it('rejects invalid coordinates and year ranges', () => {
    expect(() => buildPowerUrl(95, 0, 2010, 2020)).toThrow(RangeError);
    expect(() => buildPowerUrl(0, 0, 2020, 2010)).toThrow(RangeError);
  });

  it('drops days with fill values in required variables and keeps optional nulls', () => {
    const json = payload(yearOfDays(2023, { '20230105': [-999, 10, 1, 0.5, 0.5], '20230106': [30, 10, 1, -999, 0.5] }));
    const s = parsePowerResponse(json, -27, -64, 2023, 2023);
    expect(s.droppedDays).toBe(1);
    expect(s.days).toHaveLength(364);
    expect(s.elevationM).toBe(230);
    const jan6 = s.days.find((d) => d.date === '2023-01-06');
    expect(jan6?.rootWetness).toBeNull();
    expect(jan6?.doy).toBe(6);
  });

  it('throws a typed error on malformed payloads', () => {
    expect(() => parsePowerResponse({}, 0, 0, 2023, 2023)).toThrow(PowerApiError);
    expect(() => parsePowerResponse({ properties: { parameter: { T2M_MAX: {} } } }, 0, 0, 2023, 2023)).toThrow(/missing parameter/);
  });
});
