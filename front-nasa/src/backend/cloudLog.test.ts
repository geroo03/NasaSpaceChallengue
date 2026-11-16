import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CASE, withLot, type FarmCase } from '../case/model';

// In-memory Web Storage for Node.
class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
Object.assign(globalThis, { localStorage: new MemStorage(), sessionStorage: new MemStorage() });

// Fake server: lots per user, and the user of the current session.
const server = vi.hoisted(() => ({ uid: 'u-ana', lots: new Map<string, { id: string; owner: string; geometry: { type: 'Polygon'; coordinates: [number, number][][] } }>(), seq: 0, analyses: [] as { owner: string; lote_id: string | null }[] }));

vi.mock('./supabase', () => ({ currentSession: async () => (server.uid ? { user: { id: server.uid }, access_token: 't' } : null) }));
vi.mock('./api', async (orig) => {
  const real = await orig<typeof import('./api')>();
  const own = (id: string | null) => !id || server.lots.get(id)?.owner === server.uid;
  return {
    ...real,
    listLots: vi.fn(async () => [...server.lots.values()].filter((l) => l.owner === server.uid).map((l) => ({ ...l, creado_en: '', actualizado_en: '' }))),
    createLot: vi.fn(async (p: { geometry: { type: 'Polygon'; coordinates: [number, number][][] } }) => {
      const id = `00000000-0000-4000-8000-${String(++server.seq).padStart(12, '0')}`;
      server.lots.set(id, { id, owner: server.uid, geometry: p.geometry });
      return id;
    }),
    createAnalysis: vi.fn(async (a: { lote_id: string | null }) => {
      if (!own(a.lote_id)) throw new real.ApiError(400, 'lote');
      server.analyses.push({ owner: server.uid, lote_id: a.lote_id });
    }),
    createRequest: vi.fn(async (p: { lote_id: string | null }) => {
      if (!own(p.lote_id)) throw new real.ApiError(400, 'lote');
    }),
  };
});

const { clearCloudCaches, ensureLot, forgetLot, lotFingerprint, logAnalysis, openRemoteLot } = await import('./cloudLog');
const api = await import('./api');

const ring: [number, number][] = [[-28.38, -62.74], [-28.38, -62.735], [-28.375, -62.735], [-28.375, -62.74]];
const lotCase: FarmCase = withLot({ ...DEFAULT_CASE }, ring, { kind: 'drawn' }, { movePoint: true });
const strat = (id: string) => ({ id, overall: 60, bareMonths: 3, suitable: true }) as never;

beforeEach(() => {
  server.uid = 'u-ana';
  server.lots.clear();
  server.analyses.length = 0;
  (localStorage as unknown as MemStorage).clear();
  (sessionStorage as unknown as MemStorage).clear();
  vi.clearAllMocks();
});

describe('cloud lots per user', () => {
  it('does not reuse another user\'s lot id on the same browser', async () => {
    await logAnalysis(lotCase, strat('a'), strat('b'));
    const anaLot = server.analyses[0]!.lote_id;
    server.uid = 'u-beto'; // someone else signs in on this browser
    await logAnalysis(lotCase, strat('a'), strat('b'));
    const beto = server.analyses.find((a) => a.owner === 'u-beto');
    expect(beto).toBeDefined();
    expect(beto!.lote_id).not.toBe(anaLot);
    expect(server.lots.get(beto!.lote_id!)!.owner).toBe('u-beto');
  });

  it('recreates a lot deleted in the cloud and saves the analysis anyway (one retry)', async () => {
    await logAnalysis(lotCase, strat('a'), strat('b'));
    server.lots.clear(); // deleted from "My fields" on another device
    sessionStorage.clear(); // a new visit
    await logAnalysis(lotCase, strat('a'), strat('c'));
    expect(server.analyses).toHaveLength(2);
    expect(server.lots.has(server.analyses[1]!.lote_id!)).toBe(true);
    expect(vi.mocked(api.createAnalysis)).toHaveBeenCalledTimes(3); // ok, stale, retry
  });

  it('reuses a lot saved from another device instead of duplicating it', async () => {
    const first = await ensureLot(lotCase, 'u-ana');
    localStorage.clear(); // other device: empty local map
    const second = await ensureLot(lotCase, 'u-ana');
    expect(second).toBe(first);
    expect(server.lots.size).toBe(1);
    expect(vi.mocked(api.createLot)).toHaveBeenCalledTimes(1);
  });

  it('clears the cloud maps on sign-out', async () => {
    await ensureLot(lotCase, 'u-ana');
    sessionStorage.setItem('agrofield.cloudSeen.u-ana', '{"x":"1"}');
    localStorage.setItem('agrofield.cloudLots', '{"legacy":"1"}');
    localStorage.setItem('field-shift-lab.lang', 'es');
    clearCloudCaches();
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)!);
    expect(keys).toEqual(['field-shift-lab.lang']);
    expect(sessionStorage.length).toBe(0);
  });

  it('treats an open and a closed ring as the same boundary', () => {
    expect(lotFingerprint([...ring, ring[0]!])).toBe(lotFingerprint(ring));
  });
});

describe('opening a saved lot', () => {
  const remote = (over: Partial<import('./api').RemoteLot>): import('./api').RemoteLot => ({
    id: 'l1', nombre: 'La Loma', creado_en: '', actualizado_en: '', centroid_lat: -28.3775, centroid_lng: -62.7375, area_ha: 24.5,
    geometry: { type: 'Polygon', coordinates: [[...ring.map(([la, lo]) => [lo, la] as [number, number]), [ring[0]![1], ring[0]![0]]]] },
    origen: 'kml', pendiente_pct: null, fuente_pendiente: null, agua_util_mm: null, fuente_suelo: null, ...over,
  });

  it('loads the same boundary (open ring) with its name as the parcel', () => {
    const o = openRemoteLot(remote({}));
    expect(o.ring).toEqual(ring);
    expect(o.source).toEqual({ kind: 'file', format: 'kml', fileName: 'La Loma', parcel: 'La Loma' });
    expect(o.soilPawDeclaredMm).toBeNull();
  });

  it('brings back a declared soil test, but not a SoilGrids estimate', () => {
    expect(openRemoteLot(remote({ agua_util_mm: 210, fuente_suelo: 'analisis' })).soilPawDeclaredMm).toBe(210);
    expect(openRemoteLot(remote({ agua_util_mm: 94, fuente_suelo: 'soilgrids' })).soilPawDeclaredMm).toBeNull();
  });

  it('maps drawn and example lots back to their kind', () => {
    expect(openRemoteLot(remote({ origen: 'dibujo' })).source).toEqual({ kind: 'drawn', parcel: 'La Loma' });
    expect(openRemoteLot(remote({ origen: 'ejemplo' })).source).toEqual({ kind: 'example' });
  });

  it('forgets a deleted lot so the next save does not hit the server with it', async () => {
    const id = await ensureLot(lotCase, 'u-ana');
    forgetLot('u-ana', id!);
    expect(localStorage.getItem('agrofield.cloudLots.u-ana')).toBe('{}');
  });
});
