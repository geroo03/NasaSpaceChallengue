import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parsePowerResponse } from '../engine/data/power';
import { buildClimateProfile } from '../engine/analysis/climate';
import { compareStrategiesDetailed } from '../engine/domain/rotations';
import { EFFICIENCY, effectiveIrrigation, irrigationNeeds } from './irrigation';

describe('irrigation systems', () => {
  it('delivers more of the applied water with drip than with a canal', () => {
    expect(effectiveIrrigation(100, 'drip')).toBeCloseTo(90, 6);
    expect(effectiveIrrigation(100, 'sprinkler')).toBeCloseTo(75, 6);
    expect(effectiveIrrigation(100, 'surface')).toBeCloseTo(60, 6);
    expect(effectiveIrrigation(100, 'unknown')).toBeCloseTo(60, 6);
  });

  it('turns each crop’s rainfed gap into the water each system must apply', () => {
    const json = JSON.parse(readFileSync(new URL('../../public/data/power-anatuya-2011-2025.json', import.meta.url), 'utf8'));
    const profile = buildClimateProfile(parsePowerResponse(json, -28.38175, -62.73655, 2011, 2025));
    const farm = { irrigationMm: 0, slope: 'flat' as const, priorities: { waterSecurity: 5, waterUse: 4, climateRisk: 2, soil: 4, erosion: 5, pests: 2, income: 2 } };
    const current = compareStrategiesDetailed(profile, farm, { currentTemplate: 'soy_maize_fallow' }).strategies[0]!;
    const needs = irrigationNeeds(current, 0);
    expect(needs.length).toBe(2);
    for (const n of needs) {
      expect(n.gapMm).toBeCloseTo(Math.max(0, n.demandMm - n.rainfedSupplyMm), 6);
      expect(n.applied.surface).toBeGreaterThan(n.applied.drip);
      expect(n.applied.drip).toBeCloseTo(n.gapMm / EFFICIENCY.drip, 6);
    }
    expect(needs.some((n) => n.gapMm > 0)).toBe(true); // secano in Añatuya: crops are short of water
  });
});
