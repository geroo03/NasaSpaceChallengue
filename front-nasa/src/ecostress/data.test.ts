import { describe, expect, it } from 'vitest';
import { appeearsTask, catalogUrl, ECOSTRESS_PRODUCT, parseEcostressCsv, validateExtraction } from './data';
import { ecoEn, ecoEs } from '../i18n/ecostress';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ECOSTRESS_UNIT, hasEcostressSnapshot } from './data';

const point = { lat: -28.38175, lon: -62.73655 };
// Synthetic values, official AppEEARS point-result column convention. These are not field observations.
const header = 'ID,Category,Latitude,Longitude,Date,ECO_L3T_JET_002_ETdaily,ECO_L3T_JET_002_cloud,ECO_L3T_JET_002_water';
const row = (date: string, flux: string | number, cloud: string | number = 0, water = 0, lat = point.lat) => `field-shift,"test, fixture",${lat},${point.lon},${date},${flux},${cloud},${water}`;
describe('ECOSTRESS numerical point evidence', () => {
  it('keeps native ET values, real dates and quality exclusions; preserves multiple overpasses', () => {
    const data = parseEcostressCsv('\uFEFF' + [header, row('2026-09-29', 110), row('09/25/2026', 90), row('2026-09-29', 120), row('2026-09-20', 130, 1), row('2026-09-19', 100, 0, 1), row('2026-09-18', 'NaN'), row('2026-09-17', 90, ''), row('2026-09-16', 90, 255), row('2026-02-30', 90)].join('\r\n'), point);
    expect(data.product).toBe(ECOSTRESS_PRODUCT);
    expect(data.observations).toEqual([{ date: '2026-09-29', etMmDay: 110 }, { date: '2026-09-29', etMmDay: 120 }, { date: '2026-09-25', etMmDay: 90 }]);
    expect(data.rejected).toEqual({ cloud: 1, water: 1, missing: 4 });
  });
  it('never treats missing masks as clear or silently accepts another product version', () => {
    expect(() => parseEcostressCsv('Latitude,Longitude,Date,ECO_L3T_JET_002_ETdaily\n-28.38175,-62.73655,2026-09-29,110', point)).toThrow('quality');
    expect(() => parseEcostressCsv([header.replaceAll('_002_', '_003_'), row('2026-09-29', 110)].join('\n'), point)).toThrow('product');
  });
  it('keeps all-cloud observations unavailable instead of filling a value', () => {
    const data = parseEcostressCsv([header, row('2026-09-29', 110, 1)].join('\n'), point);
    expect(data.observations).toEqual([]); expect(data.rejected.cloud).toBe(1);
  });
  it('refuses a different lot and ignores extra points in a multipoint export', () => {
    expect(() => parseEcostressCsv([header, row('2026-09-29', 110, 0, 0, -27)].join('\n'), point)).toThrow('mismatch');
    const data = parseEcostressCsv([header, row('2026-09-29', 110), row('2026-09-29', 999, 0, 0, -27)].join('\n'), point);
    expect(data.observations).toHaveLength(1); expect(data.otherPoints).toBe(1);
  });
  it('builds a bounded NASA request with coordinates and both masks', () => {
    const x = validateExtraction({ ...point, from: '2026-08-01', to: '2026-09-29' }, new Date('2026-11-15'));
    const task = appeearsTask(x);
    expect(task.params.layers.map((l) => l.layer)).toEqual(['ETdaily', 'cloud', 'water']);
    expect(task.params.dates).toEqual([{ startDate: '08-01-2026', endDate: '09-29-2026' }]);
    expect(task.params.coordinates[0]?.latitude).toBe(point.lat);
    const url = new URL(catalogUrl(x)); expect(url.searchParams.get('version')).toBe('002'); expect(url.searchParams.get('point')).toBe('-62.73655,-28.38175');
  });
  it('rejects unsupported latitude, future dates, nonexistent dates and excessive periods', () => {
    const now = new Date('2026-11-15');
    for (const patch of [{ lat: 60 }, { to: '2027-01-01' }, { from: '2026-02-30' }, { from: '2025-01-01' }]) {
      expect(() => validateExtraction({ ...point, from: '2026-08-01', to: '2026-09-29', ...patch }, now)).toThrow();
    }
  });
  it('has matching Spanish and English text keys', () => { expect(Object.keys(ecoEs).sort()).toEqual(Object.keys(ecoEn).sort()); });
  it('reproduces the real downloaded demo sample without converting its native daily ET', () => {
    const s = JSON.parse(readFileSync(new URL('../../public/data/ecostress-anatuya-example-2026-09.json', import.meta.url), 'utf8'));
    expect(s.unit).toBe(ECOSTRESS_UNIT); expect(s.unit).toBe('mm/day');
    expect(createHash('sha256').update(s.csv).digest('hex')).toBe(s.csvSha256);
    const data = parseEcostressCsv(s.csv, point);
    expect(data.observations).toEqual([{ date: '2026-09-25', etMmDay: 3.33834171295166 }, { date: '2026-09-02', etMmDay: 1.4364924430847168 }]);
    expect(data.rejected.missing).toBe(3);
  });
  it('limits the shipped sample to its own analysis point', () => {
    expect(hasEcostressSnapshot(point)).toBe(true);
    expect(hasEcostressSnapshot({ lat: -27.7834, lon: -64.2642 })).toBe(false);
  });
});
