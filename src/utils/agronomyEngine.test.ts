import test from 'node:test';
import assert from 'node:assert/strict';
import {
  simulateRotation,
  validateCropSegmentInput,
  validateDiaryEntryInput,
  validateNewLotInput,
  formatMonthRange,
} from './agronomyEngine';
import { FieldLot, SegmentType, StressLevel } from '../types/agronomy';

const mockLot: FieldLot = {
  id: 'lot-test',
  code: 'L-01',
  name: 'Lote Ensayo',
  region: 'Zona Núcleo',
  coordinates: '33.74° S, 61.96° O',
  hectares: 120,
  soilType: 'Argiudol típico',
  usableWaterCapacityMm: 220,
  initialMoistureMm: 160,
  currentNdvi: 0.74,
  segments: [
    {
      id: 's1',
      type: SegmentType.BARBECHO,
      code: 'BAR',
      label: 'Barbecho · +38 mm',
      startMonth: 0,
      spanMonths: 2,
      waterImpactMm: 38,
      nitrogenBalanceKgHa: 12,
    },
    {
      id: 's2',
      type: SegmentType.COBERTURA,
      code: 'VV-C',
      label: 'Vicia villosa · cobertura',
      startMonth: 2,
      spanMonths: 3,
      waterImpactMm: 18,
      nitrogenBalanceKgHa: 64,
    },
    {
      id: 's3',
      type: SegmentType.COSECHA,
      code: 'MZ-T',
      label: 'MZ-T Maíz tardío',
      startMonth: 5,
      spanMonths: 6,
      waterImpactMm: -85,
      nitrogenBalanceKgHa: -42,
      estimatedYieldTHa: 9.2,
    },
  ],
  climateSeries: Array.from({ length: 12 }, (_, idx) => ({
    monthIndex: idx,
    monthLabel: `M${idx + 1}`,
    precipitationMm: 85,
    etoMm: 70,
    soilMoistureMm: 165,
    ndvi: 0.72,
  })),
};

test('simulateRotation computes positive moisture and yield for balanced rotation', () => {
  const result = simulateRotation(mockLot);
  assert.equal(result.monthlyMoistureCurve.length, 12);
  assert.ok(result.projectedYieldTHa > 8);
  assert.equal(result.nitrogenNetKgHa, 34);
  assert.equal(result.stressLevel, StressLevel.OPTIMO);
});

test('simulateRotation flags CRITICO stress under severe drought climate', () => {
  const dryLot: FieldLot = {
    ...mockLot,
    initialMoistureMm: 85,
    climateSeries: mockLot.climateSeries.map((c) => ({
      ...c,
      precipitationMm: 12,
      etoMm: 145,
    })),
  };
  const result = simulateRotation(dryLot);
  assert.equal(result.stressLevel, StressLevel.CRITICO);
  assert.ok(result.waterDeficitMm < 0);
});

test('validateCropSegmentInput enforces span bounds and non-empty fields', () => {
  assert.equal(
    validateCropSegmentInput({ code: '', label: 'Maíz', startMonth: 0, spanMonths: 3 }).valid,
    false,
  );
  assert.equal(
    validateCropSegmentInput({ code: 'MZ-T', label: 'Maíz tardío', startMonth: 9, spanMonths: 5 })
      .valid,
    false,
  );
  assert.equal(
    validateCropSegmentInput({ code: 'MZ-T', label: 'Maíz tardío', startMonth: 5, spanMonths: 5 })
      .valid,
    true,
  );
});

test('validateDiaryEntryInput rejects invalid moisture percentage', () => {
  assert.equal(
    validateDiaryEntryInput({
      observer: 'Ing. Ramos',
      stage: 'V6 Maíz',
      soilMoisturePct: '150',
      biomassKgHa: '3400',
      notes: 'Buen stand de plantas.',
    }).valid,
    false,
  );
  assert.equal(
    validateDiaryEntryInput({
      observer: 'Ing. Ramos',
      stage: 'V6 Maíz',
      soilMoisturePct: '64',
      biomassKgHa: '3400',
      notes: 'Buen stand de plantas.',
    }).valid,
    true,
  );
});

test('validateNewLotInput rejects zero hectares and empty name', () => {
  assert.equal(
    validateNewLotInput({
      code: 'L-14',
      name: '',
      region: 'Sur Córdoba',
      hectares: '110',
      soilType: 'Haplustol',
    }).valid,
    false,
  );
  assert.equal(
    validateNewLotInput({
      code: 'L-14',
      name: 'El Algarrobo',
      region: 'Sur Córdoba',
      hectares: '0',
      soilType: 'Haplustol',
    }).valid,
    false,
  );
  assert.equal(
    validateNewLotInput({
      code: 'L-14',
      name: 'El Algarrobo',
      region: 'Sur Córdoba',
      hectares: '110',
      soilType: 'Haplustol',
    }).valid,
    true,
  );
});

test('formatMonthRange renders single or ranged Spanish months', () => {
  assert.equal(formatMonthRange(0, 1), 'Jun');
  assert.equal(formatMonthRange(5, 6), 'Nov – Abr');
});
