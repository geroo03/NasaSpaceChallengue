import type { LotSource, Slope, TerrainSummary } from './model';

/** Lot and terrain actions owned by App, shared by the wizard and the results "My field" view. */
export interface LotApi {
  terrainStatus: 'idle' | 'loading' | 'error';
  retryTerrain: () => void;
  setLot: (ring: [number, number][] | null, source: LotSource | null, movePoint: boolean) => void;
  setTerrain: (t: TerrainSummary) => void;
  /** Drops a drone DSM so the SRTM estimate is computed again. */
  dropDroneTerrain: () => void;
  setSlope: (s: Slope) => void;
  /** SoilGrids read for the analysis point. */
  soilStatus: 'idle' | 'loading' | 'error' | 'noData';
  retrySoil: () => void;
}
