import type { FarmCase } from '../case/model';
import type { StrategyResult } from '../engine/domain/rotations';
import { polygonAreaHa } from '../imagery/flightOrder';
import { ringCentroid } from '../case/model';
import { createAnalysis, createLot, createRequest, type LotPayload } from './api';
import { currentSession } from './supabase';

/**
 * Fire-and-forget writes to the user's history. Nothing here blocks or breaks the app:
 * no session, no network or a server error simply means the entry isn't saved.
 */
const LOTS_KEY = 'agrofield.cloudLots'; // polygon fingerprint → remote lot id
const SEEN_KEY = 'agrofield.cloudSeen'; // analyses already saved this session

function readMap(key: string, storage: Storage): Record<string, string> {
  try {
    return JSON.parse(storage.getItem(key) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}
function writeMap(key: string, storage: Storage, v: Record<string, string>) {
  try {
    storage.setItem(key, JSON.stringify(v));
  } catch {
    // quota or private mode: we may save a duplicate later, nothing worse
  }
}

export function lotFingerprint(ring: [number, number][]): string {
  return ring.map(([a, b]) => `${a.toFixed(6)},${b.toFixed(6)}`).join(';');
}

export function lotPayload(c: FarmCase): LotPayload | null {
  const ring = c.lotPolygon;
  if (!ring || ring.length < 3) return null;
  const closed = [...ring.map(([lat, lon]) => [lon, lat] as [number, number])];
  const [f, l] = [closed[0]!, closed[closed.length - 1]!];
  if (f[0] !== l[0] || f[1] !== l[1]) closed.push([f[0], f[1]]);
  const centre = ringCentroid(ring) ?? [c.lat, c.lon];
  const src = c.lotSource;
  const fmt = (src?.format ?? src?.fileName?.split('.').pop() ?? '').toLowerCase();
  const origen: LotPayload['origen'] =
    src?.kind === 'example' ? 'ejemplo'
      : src?.kind === 'file' ? (fmt.startsWith('km') ? 'kml' : fmt === 'zip' || fmt === 'shp' ? 'shp' : fmt.includes('json') ? 'geojson' : fmt === 'dxf' ? 'dxf' : 'dibujo')
        : 'dibujo';
  const slope = c.terrain ? c.terrain.slopePct : null;
  const paw = c.soilPawDeclaredMm ?? c.soil?.pawMm ?? null;
  return {
    nombre: src?.parcel || src?.fileName || (src?.kind === 'example' ? 'Lote de ejemplo · Añatuya' : `Lote ${centre[0].toFixed(3)}, ${centre[1].toFixed(3)}`),
    geometry: { type: 'Polygon', coordinates: [closed] },
    centroid_lat: centre[0],
    centroid_lng: centre[1],
    area_ha: Math.max(0.01, Math.round(polygonAreaHa(ring) * 100) / 100),
    origen,
    pendiente_pct: slope !== null && Number.isFinite(slope) ? Math.min(100, Math.max(0, slope)) : null,
    fuente_pendiente: c.slopeSource === 'drone' ? 'dsm' : c.slopeSource === 'srtm' ? 'srtm' : c.slopeSource === 'declared' ? 'declarada' : null,
    agua_util_mm: paw !== null && Number.isFinite(paw) ? Math.round(paw) : null,
    fuente_suelo: c.soilPawDeclaredMm !== null ? 'analisis' : c.soil ? 'soilgrids' : null,
  };
}

/** Remote id of the current lot, creating it the first time this boundary is seen. */
export async function ensureLot(c: FarmCase): Promise<string | null> {
  const p = lotPayload(c);
  if (!p || !c.lotPolygon) return null;
  const key = lotFingerprint(c.lotPolygon);
  const map = readMap(LOTS_KEY, localStorage);
  if (map[key]) return map[key]!;
  const id = await createLot(p);
  writeMap(LOTS_KEY, localStorage, { ...readMap(LOTS_KEY, localStorage), [key]: id });
  return id;
}

export async function logAnalysis(c: FarmCase, reference: StrategyResult, best: StrategyResult): Promise<void> {
  try {
    if (!(await currentSession())) return;
    const entrada = {
      rotacion_actual: c.currentTemplate,
      eleccion: c.currentChoice,
      riego_mm: c.irrigationMm,
      sistema_riego: c.irrigationSystem,
      prioridades: c.priorities,
      objetivos: c.goals,
      anios: c.years,
    };
    const key = JSON.stringify([c.lotPolygon ? lotFingerprint(c.lotPolygon) : `${c.lat.toFixed(4)},${c.lon.toFixed(4)}`, entrada, best.id]);
    const seen = readMap(SEEN_KEY, sessionStorage);
    if (seen[key]) return;
    const loteId = await ensureLot(c);
    await createAnalysis({
      lote_id: loteId,
      lat: c.lat,
      lng: c.lon,
      entrada,
      resultado: {
        hoy: { id: reference.id, puntaje: reference.overall, meses_sin_cultivo: reference.bareMonths },
        alternativa: { id: best.id, puntaje: best.overall, meses_sin_cultivo: best.bareMonths, apta: best.suitable },
      },
    });
    writeMap(SEEN_KEY, sessionStorage, { ...seen, [key]: '1' });
  } catch {
    // history is best effort
  }
}

export async function logDroneRequest(
  c: FarmCase,
  r: { trabajo: 'map' | 'vra' | 'seed' | 'spray' | 'survey'; ejecutor: 'propio' | 'vuelo_verde'; canal: 'whatsapp' | 'email' | 'compartir' | 'copiado'; texto: string; plan?: Record<string, unknown>; droneId: string | null },
): Promise<void> {
  try {
    if (r.ejecutor === 'propio' && !r.droneId) return; // own drone not synced yet
    if (!(await currentSession())) return;
    const loteId = await ensureLot(c);
    await createRequest({
      lote_id: loteId,
      dron_id: r.ejecutor === 'propio' ? r.droneId : null,
      trabajo: r.trabajo,
      ejecutor: r.ejecutor,
      canal: r.canal,
      plan: r.plan ?? {},
      texto: r.texto.slice(0, 8000),
    });
  } catch {
    // history is best effort
  }
}
