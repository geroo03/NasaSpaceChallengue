import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSoilgrids, SoilError, soilgridsUrl, textureClass } from './soil';

const saved = JSON.parse(readFileSync(new URL('../../public/data/soilgrids-anatuya-example.json', import.meta.url), 'utf8'));

describe('SoilGrids soil for the lot', () => {
  it('asks for water retention, texture and carbon down to one metre', () => {
    const url = soilgridsUrl(-28.38175, -62.73655);
    expect(url).toContain('property=wv0033');
    expect(url).toContain('property=wv1500');
    expect(url).toContain('depth=60-100cm');
  });

  it('computes plant-available water of the example lot from field capacity minus wilting point', () => {
    const s = parseSoilgrids(saved, -28.38175, -62.73655, '2026-11-14');
    // (22.4−13.2)%·50 + (21.9−13.1)%·100 + (22.1−14.0)%·150 + (22.9−13.1)%·300 + (22.7−12.9)%·400 ≈ 94 mm
    expect(s.pawMm).toBeGreaterThan(90);
    expect(s.pawMm).toBeLessThan(98);
    expect(s.layers).toHaveLength(5);
    expect(s.texture).toBe('loam');
    expect(s.sandPct + s.clayPct + s.siltPct).toBeCloseTo(100, 6);
  });

  it('refuses points without soil (water, cities) instead of inventing one', () => {
    const empty = { properties: { layers: [{ name: 'wv0033', depths: [{ label: '0-5cm', values: { mean: null } }] }] } };
    expect(() => parseSoilgrids(empty, 0, 0, '')).toThrow(SoilError);
  });

  it('collapses the USDA triangle into sandy / loam / clay', () => {
    expect(textureClass(85, 5)).toBe('sandy');
    expect(textureClass(60, 12)).toBe('sandy');
    expect(textureClass(38, 20)).toBe('loam');
    expect(textureClass(20, 45)).toBe('clay');
  });
});
