import {
  CropSegment,
  FieldLot,
  SegmentType,
  SimulationResult,
  StressLevel,
} from '../types/agronomy';

export const CAMPAIGN_MONTHS = [
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
];

export function simulateRotation(lot: FieldLot): SimulationResult {
  let runningMoisture = lot.initialMoistureMm;
  let nitrogenNetKgHa = 0;
  let harvestYieldSum = 0;
  let harvestCount = 0;
  let coverMonths = 0;
  let totalScheduledMonths = 0;

  const monthlyMoistureCurve: number[] = [];

  for (let m = 0; m < 12; m++) {
    const climate = lot.climateSeries[m] ?? {
      monthIndex: m,
      monthLabel: CAMPAIGN_MONTHS[m],
      precipitationMm: 60,
      etoMm: 75,
      soilMoistureMm: runningMoisture,
      ndvi: 0.45,
    };

    const activeSegments = lot.segments.filter(
      (seg) => m >= seg.startMonth && m < seg.startMonth + seg.spanMonths,
    );

    let monthCoeff = 0.25; // bare soil evaporation baseline
    let coverRetentionBonus = 0;

    for (const seg of activeSegments) {
      if (seg.type === SegmentType.BARBECHO) {
        monthCoeff = 0.22;
        coverRetentionBonus += seg.waterImpactMm / Math.max(1, seg.spanMonths);
      } else if (seg.type === SegmentType.COBERTURA) {
        monthCoeff = 0.58;
        coverRetentionBonus += (seg.waterImpactMm / Math.max(1, seg.spanMonths)) * 0.65;
      } else if (seg.type === SegmentType.COSECHA) {
        monthCoeff = 0.92;
      }
    }

    const effectiveRain = climate.precipitationMm * 0.78 + coverRetentionBonus;
    const cropEvap = climate.etoMm * monthCoeff;
    runningMoisture = Math.max(
      28,
      Math.min(lot.usableWaterCapacityMm, runningMoisture + (effectiveRain - cropEvap) * 0.55),
    );
    monthlyMoistureCurve.push(Math.round(runningMoisture));
  }

  for (const seg of lot.segments) {
    totalScheduledMonths += seg.spanMonths;
    nitrogenNetKgHa += seg.nitrogenBalanceKgHa;

    if (seg.type === SegmentType.COBERTURA) {
      coverMonths += seg.spanMonths;
    }

    if (seg.type === SegmentType.COSECHA) {
      harvestCount += 1;
      const baseYield = seg.estimatedYieldTHa ?? 6.5;
      const moistureFactor = Math.max(0.76, Math.min(1.16, runningMoisture / 155));
      const coverBonus = coverMonths > 0 ? 1.07 : 0.96;
      harvestYieldSum += baseYield * moistureFactor * coverBonus;
    }
  }

  const finalMoistureMm =
    monthlyMoistureCurve[monthlyMoistureCurve.length - 1] ?? lot.initialMoistureMm;
  const moistureDeltaMm = Math.round(finalMoistureMm - lot.initialMoistureMm);
  const waterDeficitMm = Math.min(0, Math.round(finalMoistureMm - 165));

  let stressLevel = StressLevel.OPTIMO;
  if (finalMoistureMm < 115 || waterDeficitMm <= -30) {
    stressLevel = StressLevel.CRITICO;
  } else if (finalMoistureMm < 155 || waterDeficitMm < 0) {
    stressLevel = StressLevel.MODERADO;
  }

  const projectedYieldTHa =
    harvestCount > 0 ? Number((harvestYieldSum / harvestCount).toFixed(1)) : 0;
  const coverCropSharePct =
    totalScheduledMonths > 0
      ? Math.round((coverMonths / Math.min(12, totalScheduledMonths)) * 100)
      : 0;

  let summaryText =
    'Balance hídrico equilibrado. La secuencia conserva lámina útil para llenado de grano.';
  if (stressLevel === StressLevel.MODERADO) {
    summaryText =
      'Déficit hídrico moderado en ventana estival. Considere adelantar fecha de secado de cobertura.';
  } else if (stressLevel === StressLevel.CRITICO) {
    summaryText =
      'Alerta de estrés hídrico severo. Amplíe el barbecho químico o reduzca densidad de siembra.';
  }

  return {
    lotId: lot.id,
    finalMoistureMm: Math.round(finalMoistureMm),
    moistureDeltaMm,
    projectedYieldTHa,
    nitrogenNetKgHa: Math.round(nitrogenNetKgHa),
    coverCropSharePct,
    stressLevel,
    waterDeficitMm,
    monthlyMoistureCurve,
    summaryText,
  };
}

export interface SegmentValidationResult {
  valid: boolean;
  error?: string;
}

export function validateCropSegmentInput(input: {
  code: string;
  label: string;
  startMonth: number;
  spanMonths: number;
}): SegmentValidationResult {
  if (!input.code.trim()) {
    return { valid: false, error: 'Ingrese un código corto (ej. MZ-T o VV-C).' };
  }
  if (!input.label.trim()) {
    return { valid: false, error: 'Ingrese el nombre completo del cultivo o manejo.' };
  }
  if (input.startMonth < 0 || input.startMonth > 11) {
    return { valid: false, error: 'El mes de inicio debe estar entre Junio y Mayo.' };
  }
  if (input.spanMonths < 1 || input.startMonth + input.spanMonths > 12) {
    return {
      valid: false,
      error: 'La duración excede los 12 meses de la campaña actual.',
    };
  }
  return { valid: true };
}

export function validateDiaryEntryInput(input: {
  observer: string;
  stage: string;
  soilMoisturePct: string;
  biomassKgHa: string;
  notes: string;
}): SegmentValidationResult {
  if (!input.observer.trim()) {
    return { valid: false, error: 'Indique el responsable del relevamiento.' };
  }
  if (!input.stage.trim()) {
    return { valid: false, error: 'Especifique el estadio fenológico o labor.' };
  }
  const moisture = Number(input.soilMoisturePct);
  if (Number.isNaN(moisture) || moisture <= 0 || moisture > 100) {
    return { valid: false, error: 'La humedad gravimétrica debe estar entre 1% y 100%.' };
  }
  const biomass = Number(input.biomassKgHa);
  if (Number.isNaN(biomass) || biomass < 0) {
    return { valid: false, error: 'La biomasa estimada debe ser un número positivo.' };
  }
  if (!input.notes.trim() || input.notes.trim().length < 6) {
    return { valid: false, error: 'Agregue una observación técnica de al menos 6 caracteres.' };
  }
  return { valid: true };
}

export function validateNewLotInput(input: {
  code: string;
  name: string;
  region: string;
  hectares: string;
  soilType: string;
}): SegmentValidationResult {
  if (!input.code.trim()) {
    return { valid: false, error: 'Ingrese el identificador del lote (ej. L-15).' };
  }
  if (!input.name.trim()) {
    return { valid: false, error: 'Ingrese el nombre del lote o establecimiento.' };
  }
  if (!input.region.trim()) {
    return { valid: false, error: 'Indique la zona agroecológica.' };
  }
  const ha = Number(input.hectares);
  if (Number.isNaN(ha) || ha <= 0 || ha > 50000) {
    return { valid: false, error: 'La superficie debe ser mayor a 0 ha.' };
  }
  if (!input.soilType.trim()) {
    return { valid: false, error: 'Especifique la serie o textura de suelo.' };
  }
  return { valid: true };
}

export function formatMonthRange(startMonth: number, spanMonths: number): string {
  const startLabel = CAMPAIGN_MONTHS[startMonth] ?? 'Jun';
  const endIndex = Math.min(11, startMonth + spanMonths - 1);
  const endLabel = CAMPAIGN_MONTHS[endIndex] ?? 'May';
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}
