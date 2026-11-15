import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parsePowerResponse } from '../engine/data/power';
import { buildClimateProfile } from '../engine/analysis/climate';
import { compareStrategiesDetailed } from '../engine/domain/rotations';
import { EXAMPLE_LOT } from './model';
import { droneCalendar, lawnmower, MAPPING_DEFAULTS, planApplication, planMapping, SPRAY_DEFAULTS, toLocal } from './droneOps';
import { polygonAreaHa } from '../imagery/flightOrder';

describe('mapping flight plan', () => {
  it('derives GSD and line spacing from height and overlap (Mavic 3M RGB: H/36.5 cm)', () => {
    const p = planMapping(EXAMPLE_LOT);
    expect(p.gsdCm).toBeCloseTo(100 / 36.5, 3); // ≈ 2.74 cm at 100 m
    expect(p.lineSpacingM).toBeCloseTo(5280 * (100 / 36.5 / 100) * 0.3, 3); // ≈ 43 m
    expect(p.lines.length).toBeGreaterThanOrEqual(6); // ~320 m wide lot / 43 m
    expect(p.lines.length).toBeLessThanOrEqual(9);
    expect(p.batteries).toBe(1);
  });

  it('flies along the longest edge and covers the lot length', () => {
    const local = toLocal(EXAMPLE_LOT);
    const { lines, bearingDeg } = lawnmower(local, 40);
    // The example lot is ~1.44 km east–west: lines run east–west (bearing ≈ 90°).
    expect(Math.abs(bearingDeg - 90)).toBeLessThan(2);
    const len = Math.hypot(lines[0]!.b[0] - lines[0]!.a[0], lines[0]!.b[1] - lines[0]!.a[1]);
    expect(len).toBeGreaterThan(1400);
  });

  it('needs more lines and photos when flying lower', () => {
    const high = planMapping(EXAMPLE_LOT, MAPPING_DEFAULTS);
    const low = planMapping(EXAMPLE_LOT, { ...MAPPING_DEFAULTS, heightM: 60 });
    expect(low.lines.length).toBeGreaterThan(high.lines.length);
    expect(low.photos).toBeGreaterThan(high.photos);
    expect(low.gsdCm).toBeLessThan(high.gsdCm);
  });
});

describe('seeding and spraying', () => {
  it('uses the report’s spraying parameters: 8 m × 20 km/h, 25 L/ha', () => {
    const area = polygonAreaHa(EXAMPLE_LOT); // ≈ 46 ha
    const p = planApplication({ areaHa: area, ...SPRAY_DEFAULTS });
    expect(p.total).toBeCloseTo(area * 25, 6);
    expect(p.loads).toBe(Math.ceil((area * 25) / 40));
    expect(p.haPerHour).toBeCloseTo((8 * 20 * 1000 * 0.6) / 10_000, 6); // 9.6 ha/h effective
  });
});

describe('drone calendar from the rotation', () => {
  const json = JSON.parse(readFileSync(new URL('../../public/data/power-anatuya-2011-2025.json', import.meta.url), 'utf8'));
  const profile = buildClimateProfile(parsePowerResponse(json, -28.38175, -62.73655, 2011, 2025));
  const farm = { irrigationMm: 0, slope: 'flat' as const, priorities: { waterSecurity: 5, waterUse: 4, climateRisk: 2, soil: 4, erosion: 5, pests: 2, income: 2 } };
  const { strategies } = compareStrategiesDetailed(profile, farm, { currentTemplate: 'soy_maize_fallow' });

  it('maps before sowing and, with cover crops, seeds and terminates them by drone', () => {
    const withCover = strategies.find((s) => s.slots.some((a) => a.crop.role === 'cover'))!;
    const tasks = droneCalendar(withCover);
    expect(tasks[0]?.job === 'map' || tasks.some((t) => t.job === 'map')).toBe(true);
    expect(tasks.some((t) => t.job === 'seed' && t.reason === 'coverSeeding')).toBe(true);
    expect(tasks.some((t) => t.job === 'spray' && t.reason === 'coverTermination')).toBe(true);
    expect(tasks.map((t) => t.month)).toEqual([...tasks.map((t) => t.month)].sort((a, b) => a - b));
  });

  it('does not seed by drone when the rotation has no cover crop', () => {
    const plain = strategies.find((s) => !s.slots.some((a) => a.crop.role === 'cover'));
    if (plain) expect(droneCalendar(plain).some((t) => t.job === 'seed')).toBe(false);
  });
});
