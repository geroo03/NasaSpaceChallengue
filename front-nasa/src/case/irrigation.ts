import type { CropId } from '../engine/domain/crops';
import type { StrategyResult } from '../engine/domain/rotations';

/**
 * Irrigation systems and how much of the applied water reaches the crop (application efficiency,
 * FAO Irrigation and Drainage Paper 24/56 orders of magnitude): drip ≈ 0.9, sprinkler ≈ 0.75,
 * surface / furrow / canal (acequia) ≈ 0.6. The rest is lost to runoff, deep drainage or evaporation;
 * on a flat lot, surface irrigation also risks waterlogging.
 */
export type IrrigationSystem = 'drip' | 'sprinkler' | 'surface' | 'unknown';
export const IRRIGATION_SYSTEMS: IrrigationSystem[] = ['drip', 'sprinkler', 'surface', 'unknown'];
export const EFFICIENCY: Record<Exclude<IrrigationSystem, 'unknown'>, number> = { drip: 0.9, sprinkler: 0.75, surface: 0.6 };

/** Unknown system → the least efficient one (acequia is the common case in Santiago del Estero). */
export function efficiencyOf(system: IrrigationSystem): number {
  return system === 'unknown' ? EFFICIENCY.surface : EFFICIENCY[system];
}

/** Water that reaches the crop from what is applied at the field (mm). */
export function effectiveIrrigation(appliedMm: number, system: IrrigationSystem): number {
  return Math.max(0, appliedMm) * efficiencyOf(system);
}

export interface IrrigationNeed {
  crop: CropId;
  index: number;
  demandMm: number;
  /** Water from rain and soil alone (irrigation the run already counted is taken out). */
  rainfedSupplyMm: number;
  gapMm: number;
  /** Water to apply at the field to close the gap, per system. */
  applied: Record<Exclude<IrrigationSystem, 'unknown'>, number>;
}

/** For each cash crop: how much water is missing in rainfed conditions, and how much each system must apply to cover it. */
export function irrigationNeeds(s: StrategyResult, effectiveIrrigationMm: number): IrrigationNeed[] {
  return [...s.slots]
    .filter((a) => a.crop.role !== 'cover')
    .sort((a, b) => a.startIndex - b.startIndex)
    .map((a) => {
      const rainfed = Math.max(0, a.supplyMm - effectiveIrrigationMm);
      const gap = Math.max(0, a.demandMm - rainfed);
      return {
        crop: a.crop.id,
        index: a.startIndex,
        demandMm: a.demandMm,
        rainfedSupplyMm: rainfed,
        gapMm: gap,
        applied: { drip: gap / EFFICIENCY.drip, sprinkler: gap / EFFICIENCY.sprinkler, surface: gap / EFFICIENCY.surface },
      };
    });
}
