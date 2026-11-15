import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parsePowerResponse } from '../engine/data/power';
import { buildClimateProfile, hargreavesEt0 } from '../engine/analysis/climate';
import { compareStrategiesDetailed } from '../engine/domain/rotations';
import {
  campaignPhase,
  campaignStats,
  countSpells,
  ensoEpisodes,
  floweringHeat,
  latestEnso,
  dailyWaterBalance,
  seriesForCampaigns,
  summarizeByPhase,
} from './climateRisk';

const json = JSON.parse(readFileSync(new URL('../../public/data/power-anatuya-2011-2025.json', import.meta.url), 'utf8'));
const series = parsePowerResponse(json, -28.38175, -62.73655, 2011, 2025);
const farm = { irrigationMm: 0, slope: 'flat' as const, priorities: { waterSecurity: 5, waterUse: 4, climateRisk: 2, soil: 4, erosion: 5, pests: 2, income: 2 } };

describe('ENSO phase of each campaign (NOAA ONI, 5-season rule)', () => {
  const ep = ensoEpisodes();
  it('matches the well-known episodes', () => {
    expect(campaignPhase(2015, ep)).toBe('nino'); // 2015/16 very strong El Niño
    expect(campaignPhase(2023, ep)).toBe('nino');
    expect(campaignPhase(2011, ep)).toBe('nina');
    expect(campaignPhase(2020, ep)).toBe('nina');
    expect(campaignPhase(2022, ep)).toBe('nina');
    expect(campaignPhase(2013, ep)).toBe('neutral');
    expect(campaignPhase(2024, ep)).toBe('neutral'); // ONI never reached −0.5 for 5 seasons
  });
  it('does not classify a campaign the record does not cover yet', () => {
    expect(campaignPhase(2026, ep)).toBeNull();
  });
  it('reports the latest observed value, not a forecast', () => {
    const l = latestEnso();
    expect(l.season).toBe('ASO');
    expect(l.year).toBe(2026);
    expect(l.phase).toBe('nino');
    expect(l.strength).toBe('veryStrong');
  });
});

describe('what happened at the example lot in each phase', () => {
  const stats = campaignStats(series);
  it('uses only complete campaigns (Jul–Jun)', () => {
    expect(stats[0]!.start).toBe(2011);
    expect(stats[stats.length - 1]!.start).toBe(2024);
    expect(stats).toHaveLength(14);
  });
  it('summarises each phase from real campaigns', () => {
    const s = summarizeByPhase(stats);
    expect(s.map((x) => x.campaigns.length).reduce((a, b) => a + b, 0)).toBe(14);
    for (const x of s) if (x.campaigns.length) expect(x.rainMm).toBeGreaterThan(200);
  });
  it('builds a climate profile from only the Niño campaigns', () => {
    const nino = stats.filter((x) => x.phase === 'nino').map((x) => x.start);
    const profile = buildClimateProfile(seriesForCampaigns(series, nino));
    expect(profile.yearsAnalysed).toEqual(nino);
  });
});

describe('heat at flowering and month-by-month water', () => {
  const profile = buildClimateProfile(series);
  const { strategies } = compareStrategiesDetailed(profile, farm, { currentTemplate: 'soy_maize_fallow' });
  const current = strategies[0]!;

  it('counts hot spells of three or more days', () => {
    const d = (tmax: number) => ({ date: '', year: 2020, month: 1, doy: 1, tmax, tmin: 20, precip: 0, rootWetness: null, topWetness: null });
    expect(countSpells([36, 36, 36, 30, 36, 36].map(d), 35)).toBe(1);
    expect(countSpells([36, 36, 36, 36, 36, 36].map(d), 35)).toBe(1);
  });

  it('finds the flowering month of each cash crop and how often it was hot', () => {
    const h = floweringHeat(current, series);
    expect(h.length).toBeGreaterThanOrEqual(2);
    for (const x of h) {
      expect(x.years).toBeGreaterThanOrEqual(14);
      expect(x.yearsWithSpell).toBeLessThanOrEqual(x.years);
    }
  });

  it('keeps soil water between 0 and the available water, and more soil stores more', () => {
    const et0 = (d: { tmax: number; tmin: number; doy: number }) => hargreavesEt0(d.tmax, d.tmin, series.lat, d.doy);
    const small = dailyWaterBalance(current, series, 60, et0 as never);
    const big = dailyWaterBalance(current, series, 180, et0 as never);
    expect(small.monthly).toHaveLength(24);
    expect(small.monthly.every((m) => m.p25 >= 0 && m.p75 <= 60 + 1e-9)).toBe(true);
    expect(small.sowing.length).toBeGreaterThanOrEqual(2);
    for (const s of small.sowing) expect(s.values.length).toBeGreaterThanOrEqual(10); // ~14 campaigns, both alignments
    expect(big.sowing[0]!.medianMm).toBeGreaterThanOrEqual(small.sowing[0]!.medianMm);
    expect(dailyWaterBalance(current, series, 0, et0 as never).monthly.every((m) => m.median === 0)).toBe(true);
  });
});
