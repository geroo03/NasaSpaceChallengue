import { ZodError, type ZodType } from 'zod';
import type { Repo } from './repo.ts';
import { analisisIn, dronIn, dronPatch, loteIn, lotePatch, pedidoEstado, pedidoIn, perfilIn, uuid } from './schemas.ts';

export interface ApiRequest {
  method: string;
  /** Path after /api/v1, e.g. "/lotes/123". */
  path: string;
  query: URLSearchParams;
  token: string | null;
  body: unknown;
}
export interface ApiResponse {
  status: number;
  body: unknown;
}
export type VerifyToken = (token: string) => Promise<string | null>;

class HttpError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
  }
}
const notFound = () => new HttpError(404, 'notFound');
function parse<T>(schema: ZodType<T>, v: unknown): T {
  return schema.parse(v);
}
const limit = (q: URLSearchParams, def: number) => Math.max(1, Math.min(200, Number(q.get('limite')) || def));
function id(v: string | undefined): string {
  if (!v || !uuid.safeParse(v).success) throw notFound();
  return v;
}

/**
 * AgroField API v1. Every route needs a signed-in user (magic link → Supabase JWT in
 * Authorization: Bearer). The user id comes ONLY from the verified token, never from the body.
 *
 *   GET/PUT          /perfil
 *   GET/POST         /drones          PATCH/DELETE /drones/:id
 *   GET/POST         /lotes           GET/PATCH/DELETE /lotes/:id
 *   GET/POST         /analisis        (?lote=:id)
 *   GET/POST         /pedidos         PATCH /pedidos/:id   {estado}
 *   GET              /actividad       (history, newest first)
 */
export function createRouter(repo: Repo, verify: VerifyToken) {
  return async (req: ApiRequest): Promise<ApiResponse> => {
    try {
      if (!req.token) throw new HttpError(401, 'auth');
      const uid = await verify(req.token);
      if (!uid) throw new HttpError(401, 'auth');
      const [, recurso, rid, extra] = req.path.replace(/\/+$/, '').split('/');
      if (extra !== undefined) throw notFound();
      const m = req.method.toUpperCase();
      const done = (status: number, body: unknown): ApiResponse => ({ status, body });

      switch (recurso) {
        case 'perfil': {
          if (rid !== undefined) throw notFound();
          if (m === 'GET') return done(200, { perfil: await repo.perfil(uid) });
          if (m === 'PUT') {
            const p = await repo.guardarPerfil(uid, parse(perfilIn, req.body));
            await repo.registrar(uid, 'perfil.guardado', { nombre: p.nombre });
            return done(200, { perfil: p });
          }
          break;
        }
        case 'drones': {
          if (rid === undefined) {
            if (m === 'GET') return done(200, { drones: await repo.drones(uid) });
            if (m === 'POST') {
              const d = parse(dronIn, req.body);
              if (d.activo) await repo.desactivarDrones(uid);
              const r = await repo.crearDron(uid, d);
              await repo.registrar(uid, 'dron.creado', { dron_id: r.id, modelo: r.modelo });
              return done(201, { dron: r });
            }
            break;
          }
          const did = id(rid);
          if (m === 'PATCH') {
            const d = parse(dronPatch, req.body);
            if (!(await repo.dron(uid, did))) throw notFound();
            if (d.activo) await repo.desactivarDrones(uid, did);
            const r = await repo.actualizarDron(uid, did, d);
            if (!r) throw notFound();
            await repo.registrar(uid, 'dron.actualizado', { dron_id: did, modelo: r.modelo });
            return done(200, { dron: r });
          }
          if (m === 'DELETE') {
            if (!(await repo.borrarDron(uid, did))) throw notFound();
            await repo.registrar(uid, 'dron.borrado', { dron_id: did });
            return done(204, null);
          }
          break;
        }
        case 'lotes': {
          if (rid === undefined) {
            if (m === 'GET') return done(200, { lotes: await repo.lotes(uid) });
            if (m === 'POST') {
              const r = await repo.crearLote(uid, parse(loteIn, req.body));
              await repo.registrar(uid, 'lote.creado', { nombre: r.nombre, area_ha: r.area_ha, origen: r.origen }, String(r.id));
              return done(201, { lote: r });
            }
            break;
          }
          const lid = id(rid);
          if (m === 'GET') {
            const r = await repo.lote(uid, lid);
            if (!r) throw notFound();
            return done(200, { lote: r });
          }
          if (m === 'PATCH') {
            const r = await repo.actualizarLote(uid, lid, parse(lotePatch, req.body));
            if (!r) throw notFound();
            await repo.registrar(uid, 'lote.actualizado', { nombre: r.nombre }, lid);
            return done(200, { lote: r });
          }
          if (m === 'DELETE') {
            const r = await repo.lote(uid, lid);
            if (!r || !(await repo.borrarLote(uid, lid))) throw notFound();
            await repo.registrar(uid, 'lote.borrado', { nombre: r.nombre });
            return done(204, null);
          }
          break;
        }
        case 'analisis': {
          if (rid !== undefined) throw notFound();
          if (m === 'GET') {
            const lote = req.query.get('lote');
            return done(200, { analisis: await repo.analisis(uid, lote ? id(lote) : undefined, limit(req.query, 50)) });
          }
          if (m === 'POST') {
            const a = parse(analisisIn, req.body);
            if (a.lote_id && !(await repo.lote(uid, a.lote_id))) throw new HttpError(400, 'lote');
            const r = await repo.crearAnalisis(uid, a);
            await repo.registrar(uid, 'analisis.creado', { analisis_id: r.id }, a.lote_id);
            return done(201, { analisis: r });
          }
          break;
        }
        case 'pedidos': {
          if (rid === undefined) {
            if (m === 'GET') return done(200, { pedidos: await repo.pedidos(uid, limit(req.query, 100)) });
            if (m === 'POST') {
              const p = parse(pedidoIn, req.body);
              if (p.lote_id && !(await repo.lote(uid, p.lote_id))) throw new HttpError(400, 'lote');
              if (p.dron_id && !(await repo.dron(uid, p.dron_id))) throw new HttpError(400, 'dron');
              if (p.ejecutor === 'propio' && !p.dron_id) throw new HttpError(400, 'dron');
              const r = await repo.crearPedido(uid, p);
              await repo.registrar(uid, 'pedido.creado', { pedido_id: r.id, trabajo: p.trabajo, ejecutor: p.ejecutor, canal: p.canal }, p.lote_id);
              return done(201, { pedido: r });
            }
            break;
          }
          const pid = id(rid);
          if (m === 'PATCH') {
            const { estado } = parse(pedidoEstado, req.body);
            const r = await repo.estadoPedido(uid, pid, estado);
            if (!r) throw notFound();
            await repo.registrar(uid, 'pedido.estado', { pedido_id: pid, estado }, (r.lote_id as string | null) ?? null);
            return done(200, { pedido: r });
          }
          break;
        }
        case 'actividad': {
          if (rid !== undefined) throw notFound();
          if (m === 'GET') return done(200, { actividad: await repo.actividad(uid, limit(req.query, 100)) });
          break;
        }
        default:
          throw notFound();
      }
      throw new HttpError(405, 'method');
    } catch (err) {
      if (err instanceof HttpError) return { status: err.status, body: { error: err.code } };
      if (err instanceof ZodError) return { status: 400, body: { error: 'validation', issues: err.issues.slice(0, 10).map((i) => ({ path: i.path.join('.'), message: i.message })) } };
      if (err instanceof SyntaxError) return { status: 400, body: { error: 'json' } };
      // Never leak database messages to the client.
      console.error('[api/v1]', err);
      return { status: 500, body: { error: 'server' } };
    }
  };
}
