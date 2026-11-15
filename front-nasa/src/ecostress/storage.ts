import { isoDate, parseEcostressCsv, type Point } from './data';
export interface SavedEcostress { csv?: string; source?: 'file' | 'appeears' | 'earthdata' | 'saved'; fileName?: string; retrievedOn?: string; job?: string }
export const ecostressKey = ({ lat, lon }: Point) => `field-shift.ecostress.${lat.toFixed(5)},${lon.toFixed(5)}`;
export function readEcostress(point: Point): SavedEcostress {
  try {
    const s = JSON.parse(localStorage.getItem(ecostressKey(point)) ?? '{}') as SavedEcostress;
    const out: SavedEcostress = {};
    if (typeof s.csv === 'string' && ['file', 'appeears', 'earthdata', 'saved'].includes(s.source ?? '') && typeof s.retrievedOn === 'string' && isoDate(s.retrievedOn)) {
      parseEcostressCsv(s.csv, point);
      Object.assign(out, { csv: s.csv, source: s.source, retrievedOn: s.retrievedOn, fileName: typeof s.fileName === 'string' ? s.fileName : undefined });
    }
    if (typeof s.job === 'string' && s.job.length < 2000) out.job = s.job;
    return out;
  } catch { return {}; }
}
export function persistEcostress(point: Point, saved: SavedEcostress): void {
  try { localStorage.setItem(ecostressKey(point), JSON.stringify(saved)); } catch { /* Still usable in memory. */ }
}
