import type { FarmCase } from '../case/model';
import type { StrategyResult } from '../engine/domain/rotations';
import { polygonAreaHa } from '../imagery/flightOrder';
import { ringCentroid } from '../case/model';
import { ApiError, createAnalysis, createLot, createRequest, listLots, type LotPayload, type RemoteLot } from './api';
import { currentSession } from './supabase';

/**
 * Fire-and-forget writes to the user's history. Nothing here blocks or breaks the app:
 * no session, no network or a server error simply means the entry isn't saved.
 */
// Polygon fingerprint → remote lot id, one map PER USER: another account on the same browser
// must never reuse ids that belong to someone else (the server would answer 400 "lote").
const LOTS_PREFIX = 'agrofield.cloudLots';
const lotsKey = (uid: string) => `${LOTS_PREFIX}.${uid}`;
const SEEN_KEY = 'agrofield.cloudSeen'; // analyses already saved this session

/** Removes every cloud cache on this device (call on sign-out). */
export function clearCloudCaches(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k === LOTS_PREFIX || k.startsWith(`${LOTS_PREFIX}.`))) localStorage.removeItem(k);
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && (k === SEEN_KEY || k.startsWith(`${SEEN_KEY}.`))) sessionStorage.removeItem(k);
    }
  } catch {
    // storage unavailable: nothing cached
  }
}

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

/** Same boundary → same key, whether or not the ring repeats its first vertex at the end. */
export function lotFingerprint(ring: [number, number][]): string {
  const open = ring.length > 1 && ring[0]![0] === ring[ring.length - 1]![0] && ring[0]![1] === ring[ring.length - 1]![1] ? ring.slice(0, -1) : ring;
  return open.map(([a, b]) => `${a.toFixed(6)},${b.toFixed(6)}`).join(';');
}

/** [lat, lon] ring of a lot stored as GeoJSON (lon, lat). */
export function remoteRing(l: Pick<RemoteLot, 'geometry'>): [number, number][] {
  return (l.geometry.coordinates[0] ?? []).map(([lon, lat]) => [lat, lon] as [number, number]);
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

function remember(uid: string, key: string, id: string | null) {
  const map = readMap(lotsKey(uid), localStorage);
  if (id) map[key] = id;
  else delete map[key];
  writeMap(lotsKey(uid), localStorage, map);
}

/** Records the remote id of a boundary (e.g. a lot just opened from "My fields"). */
export function rememberLot(uid: string, ring: [number, number][], id: string): void {
  remember(uid, lotFingerprint(ring), id);
}

/**
 * Remote id of the current lot for this user. Order: this device's map → the user's lots in the
 * cloud with the same boundary (another device saved it) → create it.
 */
export async function ensureLot(c: FarmCase, uid: string, opts: { skipCache?: boolean } = {}): Promise<string | null> {
  const p = lotPayload(c);
  if (!p || !c.lotPolygon) return null;
  const key = lotFingerprint(c.lotPolygon);
  if (!opts.skipCache) {
    const cached = readMap(lotsKey(uid), localStorage)[key];
    if (cached) return cached;
  }
  const existing = (await listLots()).find((l) => lotFingerprint(remoteRing(l)) === key);
  const id = existing ? existing.id : await createLot(p);
  remember(uid, key, id);
  return id;
}

const staleLot = (e: unknown) => e instanceof ApiError && ((e.status === 400 && e.code === 'lote') || e.status === 404);

/**
 * Runs `write` with the lot's remote id. If the server says that lot no longer exists for this user
 * (deleted, or an id from an old cache), forget it, recreate the lot and retry exactly once.
 */
export async function withLotId(c: FarmCase, uid: string, write: (loteId: string | null) => Promise<unknown>): Promise<void> {
  const id = await ensureLot(c, uid);
  try {
    await write(id);
  } catch (e) {
    if (!id || !c.lotPolygon || !staleLot(e)) throw e;
    remember(uid, lotFingerprint(c.lotPolygon), null);
    await write(await ensureLot(c, uid, { skipCache: true }));
  }
}

export async function logAnalysis(c: FarmCase, reference: StrategyResult, best: StrategyResult): Promise<void> {
  try {
    const session = await currentSession();
    if (!session) return;
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
    const seenKey = `${SEEN_KEY}.${session.user.id}`;
    const seen = readMap(seenKey, sessionStorage);
    if (seen[key]) return;
    await withLotId(c, session.user.id, (loteId) => createAnalysis({
      lote_id: loteId,
      lat: c.lat,
      lng: c.lon,
      entrada,
      resultado: {
        hoy: { id: reference.id, puntaje: reference.overall, meses_sin_cultivo: reference.bareMonths },
        alternativa: { id: best.id, puntaje: best.overall, meses_sin_cultivo: best.bareMonths, apta: best.suitable },
      },
    }));
    writeMap(seenKey, sessionStorage, { ...seen, [key]: '1' });
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
    const session = await currentSession();
    if (!session) return;
    await withLotId(c, session.user.id, (loteId) => createRequest({
      lote_id: loteId,
      dron_id: r.ejecutor === 'propio' ? r.droneId : null,
      trabajo: r.trabajo,
      ejecutor: r.ejecutor,
      canal: r.canal,
      plan: r.plan ?? {},
      texto: r.texto.slice(0, 8000),
    }));
  } catch {
    // history is best effort
  }
}
