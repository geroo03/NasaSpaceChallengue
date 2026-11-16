import type { RemoteAnalysis } from './api';

/**
 * A saved analysis read back for display, exactly as stored (never recalculated). Snapshots are free
 * JSON on the server, so every field is checked and unknown values stay null instead of breaking the view.
 */
export interface AnalysisView {
  id: string;
  createdOn: string;
  lotId: string | null;
  lat: number;
  lng: number;
  current: { template: string | null; score: number | null; bareMonths: number | null };
  alternative: { template: string | null; score: number | null; bareMonths: number | null; suitable: boolean | null };
  irrigationMm: number | null;
  irrigationSystem: string | null;
  years: number | null;
  /** Priorities with weight > 0, highest first. */
  priorities: { key: string; weight: number }[];
}

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

export function readAnalysis(a: RemoteAnalysis): AnalysisView {
  const e = obj(a.entrada);
  const r = obj(a.resultado);
  const hoy = obj(r.hoy);
  const alt = obj(r.alternativa);
  const prio = obj(e.prioridades);
  return {
    id: a.id,
    createdOn: a.creado_en,
    lotId: a.lote_id,
    lat: a.lat,
    lng: a.lng,
    // Older rows have no "plantilla": today's rotation is the one the farmer entered; the alternative's id is its template.
    current: { template: str(hoy.plantilla) ?? str(e.rotacion_actual), score: num(hoy.puntaje), bareMonths: num(hoy.meses_sin_cultivo) },
    alternative: { template: str(alt.plantilla) ?? str(alt.id), score: num(alt.puntaje), bareMonths: num(alt.meses_sin_cultivo), suitable: typeof alt.apta === 'boolean' ? alt.apta : null },
    irrigationMm: num(e.riego_mm),
    irrigationSystem: str(e.sistema_riego),
    years: num(e.anios),
    priorities: Object.entries(prio)
      .map(([key, w]) => ({ key, weight: num(w) ?? 0 }))
      .filter((p) => p.weight > 0)
      .sort((x, y) => y.weight - x.weight),
  };
}
