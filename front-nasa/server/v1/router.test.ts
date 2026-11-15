import { describe, expect, it } from 'vitest';
import { createRouter } from './router.ts';
import { memoryRepo } from './repo.ts';
import { createBackendHandler } from './http.ts';
import { PassThrough } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';

const TOKENS: Record<string, string> = { 'tok-ana': 'u-ana', 'tok-beto': 'u-beto' };
const verify = async (t: string) => TOKENS[t] ?? null;
const ring = [[-62.74, -28.38], [-62.73, -28.38], [-62.73, -28.37], [-62.74, -28.37], [-62.74, -28.38]];
const lote = { nombre: 'Lote 4', geometry: { type: 'Polygon', coordinates: [ring] }, centroid_lat: -28.375, centroid_lng: -62.735, area_ha: 46.2, origen: 'kml' };
const t50 = { modelo: 'DJI Agras T50', camara_mapeo: 'none', pulveriza: { tankL: 40, swathM: 9, speedKmh: 20 }, siembra: null };

function setup() {
  const repo = memoryRepo();
  const route = createRouter(repo, verify);
  const call = (token: string | null, method: string, path: string, body?: unknown, q = '') =>
    route({ token, method, path, body, query: new URLSearchParams(q) });
  return { repo, call };
}

describe('api v1', () => {
  it('requires a valid session', async () => {
    const { call } = setup();
    expect((await call(null, 'GET', '/lotes')).status).toBe(401);
    expect((await call('forged', 'GET', '/lotes')).status).toBe(401);
  });

  it('saves the profile and logs it in the history', async () => {
    const { call } = setup();
    const r = await call('tok-ana', 'PUT', '/perfil', { nombre: ' Ana ', establecimiento: 'La Esperanza' });
    expect(r.status).toBe(200);
    expect((r.body as { perfil: { nombre: string } }).perfil.nombre).toBe('Ana');
    const h = (await call('tok-ana', 'GET', '/actividad')).body as { actividad: { tipo: string }[] };
    expect(h.actividad.map((a) => a.tipo)).toEqual(['perfil.guardado']);
  });

  it('keeps each user in their own data', async () => {
    const { call } = setup();
    const created = (await call('tok-ana', 'POST', '/lotes', lote)).body as { lote: { id: string } };
    expect((await call('tok-beto', 'GET', '/lotes')).body).toEqual({ lotes: [] });
    expect((await call('tok-beto', 'GET', `/lotes/${created.lote.id}`)).status).toBe(404);
    expect((await call('tok-beto', 'DELETE', `/lotes/${created.lote.id}`)).status).toBe(404);
    expect((await call('tok-beto', 'POST', '/analisis', { lote_id: created.lote.id, lat: 0, lng: 0, entrada: {}, resultado: {} })).status).toBe(400);
    expect((await call('tok-ana', 'GET', `/lotes/${created.lote.id}`)).status).toBe(200);
  });

  it('ignores a user_id sent in the body', async () => {
    const { call, repo } = setup();
    await call('tok-ana', 'POST', '/lotes', { ...lote, user_id: 'u-beto' });
    expect(repo.tablas.lotes[0]!.user_id).toBe('u-ana');
  });

  it('rejects invalid lots', async () => {
    const { call } = setup();
    const r = await call('tok-ana', 'POST', '/lotes', { ...lote, area_ha: -1, geometry: { type: 'Polygon', coordinates: [[[0, 0]]] } });
    expect(r.status).toBe(400);
    expect((r.body as { error: string }).error).toBe('validation');
  });

  it('keeps a single active drone', async () => {
    const { call, repo } = setup();
    const a = (await call('tok-ana', 'POST', '/drones', { modelo: 'DJI Mavic 3 Multispectral', camara_mapeo: 'multispectral', bateria_min: 35 })).body as { dron: { id: string } };
    await call('tok-ana', 'POST', '/drones', t50);
    expect(repo.tablas.drones.filter((d) => d.activo).map((d) => d.modelo)).toEqual(['DJI Agras T50']);
    await call('tok-ana', 'PATCH', `/drones/${a.dron.id}`, { activo: true });
    expect(repo.tablas.drones.filter((d) => d.activo).map((d) => d.modelo)).toEqual(['DJI Mavic 3 Multispectral']);
  });

  it('records drone requests and their status', async () => {
    const { call } = setup();
    const l = ((await call('tok-ana', 'POST', '/lotes', lote)).body as { lote: { id: string } }).lote;
    const own = await call('tok-ana', 'POST', '/pedidos', { lote_id: l.id, trabajo: 'spray', ejecutor: 'propio', canal: 'copiado', texto: 'plan' });
    expect(own.status).toBe(400); // "propio" needs one of the user's drones
    const p = await call('tok-ana', 'POST', '/pedidos', { lote_id: l.id, trabajo: 'map', ejecutor: 'vuelo_verde', canal: 'whatsapp', texto: 'Hola Vuelo Verde', plan: { ha: 46.2 } });
    expect(p.status).toBe(201);
    const id = (p.body as { pedido: { id: string; estado: string } }).pedido.id;
    expect((await call('tok-beto', 'PATCH', `/pedidos/${id}`, { estado: 'hecho' })).status).toBe(404);
    const done = await call('tok-ana', 'PATCH', `/pedidos/${id}`, { estado: 'hecho' });
    expect((done.body as { pedido: { estado: string } }).pedido.estado).toBe('hecho');
    const h = (await call('tok-ana', 'GET', '/actividad')).body as { actividad: { tipo: string }[] };
    expect(h.actividad.map((a) => a.tipo)).toEqual(['pedido.estado', 'pedido.creado', 'lote.creado']);
  });

  it('answers 404/405 for unknown routes and methods', async () => {
    const { call } = setup();
    expect((await call('tok-ana', 'GET', '/nada')).status).toBe(404);
    expect((await call('tok-ana', 'DELETE', '/perfil')).status).toBe(405);
    expect((await call('tok-ana', 'GET', '/lotes/no-es-uuid')).status).toBe(404);
  });
});

function fakeReq(method: string, url: string, headers: Record<string, string>, body?: string) {
  const s = new PassThrough() as unknown as IncomingMessage;
  Object.assign(s, { method, url, headers: { host: 'agrofield.test', ...headers } });
  (s as unknown as PassThrough).end(body ?? '');
  return s;
}
function fakeRes() {
  const out = { status: 0, body: '' };
  const res = { statusCode: 0, setHeader() {}, end(b: string) { out.status = res.statusCode; out.body = b; } } as unknown as ServerResponse & { statusCode: number };
  return { res, out };
}

describe('http adapter', () => {
  it('says whether the backend is configured', async () => {
    const h = createBackendHandler({});
    const { res, out } = fakeRes();
    await h(fakeReq('GET', '/api/v1/estado', {}), res);
    expect(JSON.parse(out.body)).toEqual({ configured: false });
    const r2 = fakeRes();
    await h(fakeReq('GET', '/api/v1?ruta=lotes', { authorization: 'Bearer x' }), r2.res);
    expect(r2.out.status).toBe(503);
  });

  it('routes the Vercel rewrite and blocks other origins', async () => {
    const repo = memoryRepo();
    const h = createBackendHandler({}, { repo, verify });
    const a = fakeRes();
    await h(fakeReq('POST', '/api/v1?ruta=lotes', { authorization: 'Bearer tok-ana', 'content-type': 'application/json' }, JSON.stringify(lote)), a.res);
    expect(a.out.status).toBe(201);
    const b = fakeRes();
    await h(fakeReq('GET', '/api/v1/lotes', { authorization: 'Bearer tok-ana', origin: 'https://evil.example' }), b.res);
    expect(b.out.status).toBe(403);
    const c = fakeRes();
    await h(fakeReq('POST', '/api/v1/lotes', { authorization: 'Bearer tok-ana' }, '{bad'), c.res);
    expect(c.out.status).toBe(400);
  });
});
