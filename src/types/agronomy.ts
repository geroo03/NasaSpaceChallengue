export enum AppScreen {
  LOTES = 'lotes',
  SATELITE = 'satelite',
  CUADERNO = 'cuaderno',
  HISTORIA = 'historia',
}

export enum SegmentType {
  COSECHA = 'cosecha',
  COBERTURA = 'cobertura',
  BARBECHO = 'barbecho',
}

export enum DataSourceType {
  NASA_POWER = 'NASA POWER (Clima)',
  GIBS = 'GIBS (Satélite)',
  CAMPO = 'Campo (Aforo real)',
}

export enum StressLevel {
  OPTIMO = 'Óptimo',
  MODERADO = 'Moderado',
  CRITICO = 'Crítico',
}

export interface CropSegment {
  id: string;
  type: SegmentType;
  code: string;
  label: string;
  startMonth: number; // 0 = Jun ... 11 = May
  spanMonths: number; // 1..12
  waterImpactMm: number; // positive = capture/efficiency, negative = crop demand
  nitrogenBalanceKgHa: number;
  estimatedYieldTHa?: number;
  notes?: string;
}

export interface MonthlyClimatePoint {
  monthIndex: number; // 0..11
  monthLabel: string; // 'Jun', 'Jul', ...
  precipitationMm: number;
  etoMm: number;
  soilMoistureMm: number;
  ndvi: number;
}

export interface SatellitePass {
  id: string;
  lotId: string;
  date: string;
  sensor: string;
  source: DataSourceType;
  cloudCoverPct: number;
  ndviMean: number;
  ndwiMoisture: number;
  surfaceTempC: number;
  anomalyNote: string;
}

export interface FieldDiaryEntry {
  id: string;
  lotId: string;
  lotName: string;
  date: string;
  observer: string;
  stage: string;
  soilMoisturePct: number;
  measuredYieldTHa: number | null;
  biomassKgHa: number;
  source: DataSourceType;
  alertLevel: StressLevel;
  notes: string;
}

export interface FieldLot {
  id: string;
  code: string;
  name: string;
  region: string;
  coordinates: string;
  hectares: number;
  soilType: string;
  usableWaterCapacityMm: number;
  initialMoistureMm: number;
  currentNdvi: number;
  segments: CropSegment[];
  climateSeries: MonthlyClimatePoint[];
}

export interface SimulationResult {
  lotId: string;
  finalMoistureMm: number;
  moistureDeltaMm: number;
  projectedYieldTHa: number;
  nitrogenNetKgHa: number;
  coverCropSharePct: number;
  stressLevel: StressLevel;
  waterDeficitMm: number;
  monthlyMoistureCurve: number[];
  summaryText: string;
}

export interface EvidencePayload {
  title: string;
  subtitle: string;
  source: DataSourceType;
  timestamp: string;
  coordinates: string;
  metrics: Array<{ label: string; value: string }>;
  interpretation: string;
}
