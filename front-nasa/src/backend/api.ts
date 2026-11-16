import { currentSession } from './supabase';
import type { OwnDrone, Profile } from '../profile/profile';

/** Typed calls to api/v1 with the signed-in user's token. All of them fail soft: the app keeps working offline. */
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const s = await currentSession();
  if (!s) throw new ApiError(401, 'auth');
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${s.access_token}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, json.error ?? 'server');
  return json as T;
}

export interface RemoteDrone {
  id: string;
  modelo: string;
  camara_mapeo: OwnDrone['mapping'];
  bateria_min: number;
  pulveriza: OwnDrone['spray'];
  siembra: OwnDrone['seed'];
  activo: boolean;
}
export interface Activity {
  id: number;
  tipo: string;
  detalle: Record<string, unknown>;
  lote_id: string | null;
  creado_en: string;
}
export interface RemoteRequest {
  id: string;
  trabajo: string;
  ejecutor: 'propio' | 'vuelo_verde';
  canal: string;
  estado: 'enviado' | 'aceptado' | 'hecho' | 'cancelado';
  creado_en: string;
  lote_id: string | null;
}

const toOwn = (d: RemoteDrone): OwnDrone => ({ model: d.modelo, mapping: d.camara_mapeo, batteryMin: Number(d.bateria_min) || 0, spray: d.pulveriza, seed: d.siembra });
const fromOwn = (d: OwnDrone) => ({ modelo: d.model, camara_mapeo: d.mapping, bateria_min: d.batteryMin, pulveriza: d.spray, siembra: d.seed });

/** Profile + active drone from the cloud, or null when the user has no profile yet. */
export async function loadRemoteProfile(): Promise<{ profile: Profile | null; droneId: string | null }> {
  const [{ perfil }, { drones }] = await Promise.all([
    call<{ perfil: { nombre: string; establecimiento: string } | null }>('GET', '/perfil'),
    call<{ drones: RemoteDrone[] }>('GET', '/drones'),
  ]);
  if (!perfil) return { profile: null, droneId: null };
  const active = drones.find((d) => d.activo) ?? null;
  return { profile: { name: perfil.nombre, farm: perfil.establecimiento, drone: active ? toOwn(active) : null }, droneId: active?.id ?? null };
}

/** Save profile and the active drone. Returns the active drone id (or null). */
export async function saveRemoteProfile(p: Profile, lang: 'es' | 'en', droneId: string | null): Promise<string | null> {
  await call('PUT', '/perfil', { nombre: p.name, establecimiento: p.farm, idioma: lang });
  if (p.drone) {
    if (droneId) {
      await call('PATCH', `/drones/${droneId}`, { ...fromOwn(p.drone), activo: true });
      return droneId;
    }
    const { dron } = await call<{ dron: RemoteDrone }>('POST', '/drones', { ...fromOwn(p.drone), activo: true });
    return dron.id;
  }
  if (droneId) await call('PATCH', `/drones/${droneId}`, { activo: false });
  return null;
}

export interface LotPayload {
  nombre: string;
  geometry: { type: 'Polygon'; coordinates: [number, number][][] };
  centroid_lat: number;
  centroid_lng: number;
  area_ha: number;
  origen: 'dibujo' | 'kml' | 'shp' | 'geojson' | 'dxf' | 'ejemplo';
  pendiente_pct: number | null;
  fuente_pendiente: 'srtm' | 'dsm' | 'declarada' | null;
  agua_util_mm: number | null;
  fuente_suelo: 'soilgrids' | 'analisis' | 'supuesto' | null;
}
export const createLot = (l: LotPayload) => call<{ lote: { id: string } }>('POST', '/lotes', l).then((r) => r.lote.id);

/** A lot as the server returns it (server/v1/schemas.ts + timestamps). */
export interface RemoteLot extends LotPayload {
  id: string;
  creado_en: string;
  actualizado_en: string;
}
export type LotChanges = Partial<Pick<LotPayload, 'nombre' | 'pendiente_pct' | 'fuente_pendiente' | 'agua_util_mm' | 'fuente_suelo'>>;
export const listLots = () => call<{ lotes: RemoteLot[] }>('GET', '/lotes').then((r) => r.lotes);
export const getLot = (id: string) => call<{ lote: RemoteLot }>('GET', `/lotes/${encodeURIComponent(id)}`).then((r) => r.lote);
export const updateLot = (id: string, changes: LotChanges) => call<{ lote: RemoteLot }>('PATCH', `/lotes/${encodeURIComponent(id)}`, changes).then((r) => r.lote);
export const deleteLot = (id: string) => call<void>('DELETE', `/lotes/${encodeURIComponent(id)}`);

/** A saved analysis: what was entered and what the app showed, never recalculated. */
export interface RemoteAnalysis {
  id: string;
  lote_id: string | null;
  lat: number;
  lng: number;
  entrada: Record<string, unknown>;
  resultado: Record<string, unknown>;
  creado_en: string;
}
export const listAnalyses = (loteId?: string, limit = 20) =>
  call<{ analisis: RemoteAnalysis[] }>('GET', `/analisis?limite=${limit}${loteId ? `&lote=${encodeURIComponent(loteId)}` : ''}`).then((r) => r.analisis);
export const createAnalysis = (a: { lote_id: string | null; lat: number; lng: number; entrada: Record<string, unknown>; resultado: Record<string, unknown> }) => call('POST', '/analisis', a);
export const createRequest = (p: { lote_id: string | null; dron_id: string | null; trabajo: string; ejecutor: 'propio' | 'vuelo_verde'; canal: string; plan: Record<string, unknown>; texto: string }) => call('POST', '/pedidos', p);
export const listActivity = () => call<{ actividad: Activity[] }>('GET', '/actividad?limite=30').then((r) => r.actividad);
export const listRequests = () => call<{ pedidos: RemoteRequest[] }>('GET', '/pedidos?limite=30').then((r) => r.pedidos);
export const setRequestStatus = (id: string, estado: RemoteRequest['estado']) => call('PATCH', `/pedidos/${id}`, { estado });
