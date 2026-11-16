import { describe, expect, it } from 'vitest';
import { readAnalysis } from './analysisView';

const base = { id: 'a1', lote_id: 'l1', lat: -28.38, lng: -62.74, creado_en: '2026-11-15T21:00:00Z' };

describe('reading a saved analysis', () => {
  it('shows what was entered and what the app answered, as stored', () => {
    const v = readAnalysis({
      ...base,
      entrada: { rotacion_actual: 'soy_maize_fallow', riego_mm: 0, sistema_riego: 'unknown', anios: 15, prioridades: { water: 3, soil: 2, market: 0 } },
      resultado: { hoy: { id: 'current', puntaje: 61.4, meses_sin_cultivo: 13 }, alternativa: { id: 'sorghum_soy', puntaje: 68.2, meses_sin_cultivo: 2, apta: true } },
    });
    expect(v.current).toEqual({ template: 'soy_maize_fallow', score: 61.4, bareMonths: 13 });
    expect(v.alternative).toEqual({ template: 'sorghum_soy', score: 68.2, bareMonths: 2, suitable: true });
    expect(v.priorities.map((p) => p.key)).toEqual(['water', 'soil']);
    expect(v.years).toBe(15);
  });

  it('prefers the stored template name and survives malformed snapshots', () => {
    const v = readAnalysis({ ...base, entrada: { prioridades: 'x' }, resultado: { hoy: null, alternativa: { id: 'alt-2', plantilla: 'cotton_maize', puntaje: 'NaN' } } });
    expect(v.alternative.template).toBe('cotton_maize');
    expect(v.alternative.score).toBeNull();
    expect(v.current).toEqual({ template: null, score: null, bareMonths: null });
    expect(v.priorities).toEqual([]);
  });
});
