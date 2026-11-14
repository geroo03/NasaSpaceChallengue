import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parsePowerResponse } from './field-shift/src/data/power';
import { buildClimateProfile, applyScenario } from './field-shift/src/analysis/climate';
import { compareStrategies, type FarmContext } from './field-shift/src/domain/rotations';

// Revisión del punto predeterminado del ZIP; no representa un lote confirmado.
const folder = new URL('../Field Shift - Obsidian/99 Recursos/Revision prototipo/', import.meta.url);
const raw = JSON.parse(readFileSync(new URL('power-punto-prototipo-2011-2025.json', folder), 'utf8'));
const series = parsePowerResponse(raw, -27.7834, -64.2642, 2011, 2025);
const farm: FarmContext = {
  irrigationMm: 0,
  slope: 'gentle',
  priorities: { waterSecurity: 4, waterUse: 3, climateRisk: 3, soil: 4, erosion: 3, pests: 2, income: 3 },
};
const summarize = (scenario: { precipPct: number; tempC: number }) => {
  const profile = buildClimateProfile(applyScenario(series, scenario));
  return {
    scenario,
    annual: profile.annual,
    years: profile.yearsAnalysed,
    strategies: compareStrategies(profile, farm, { currentTemplate: 'soy_maize_fallow' }).map(s => ({
      id: s.id, isCurrent: s.isCurrent, overall: s.overall,
      suitableByPrototypeRules: s.suitable,
      monthsWithoutScheduledCrop: s.bareMonths,
      scores: s.scores,
      slots: s.slots.map(a => ({ crop: a.crop.id, months: a.months, demandMm: a.demandMm, supplyMm: a.supplyMm })),
    })),
  };
};
const result = {
  fecha_revision: '2026-11-14',
  caso: 'Punto predeterminado del prototipo; no lote confirmado de Añatuya',
  coordinates: { lat: series.lat, lon: series.lon },
  days: series.days.length, droppedDays: series.droppedDays, farm,
  fieldValidated: false,
  runs: [summarize({ precipPct: 0, tempC: 0 }), summarize({ precipPct: -20, tempC: 2 })],
};
const target = new URL('resultado-motor.json', folder);
writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
console.log('Guardado en', fileURLToPath(target));
