import type { AnalisisIn, DronIn, LoteIn, PedidoIn, PerfilIn } from './schemas.ts';

export type Row = Record<string, unknown> & { id?: string | number };
export type Tabla = 'perfiles' | 'drones' | 'lotes' | 'analisis' | 'pedidos_dron' | 'actividad';
export type TipoActividad =
  | 'perfil.guardado' | 'dron.creado' | 'dron.actualizado' | 'dron.borrado'
  | 'lote.creado' | 'lote.actualizado' | 'lote.borrado'
  | 'analisis.creado' | 'pedido.creado' | 'pedido.estado';

/**
 * Everything the API needs from the database, always scoped to one user.
 * Two implementations: Supabase (production) and memory (tests, local dev without Supabase).
 * Every method takes the user id first and must never return or touch another user's rows.
 */
export interface Repo {
  perfil(uid: string): Promise<Row | null>;
  guardarPerfil(uid: string, p: PerfilIn): Promise<Row>;
  drones(uid: string): Promise<Row[]>;
  dron(uid: string, id: string): Promise<Row | null>;
  crearDron(uid: string, d: DronIn): Promise<Row>;
  actualizarDron(uid: string, id: string, d: Partial<DronIn>): Promise<Row | null>;
  /** Unique index: one active drone per user. Deactivate the rest before activating one. */
  desactivarDrones(uid: string, salvo?: string): Promise<void>;
  borrarDron(uid: string, id: string): Promise<boolean>;
  lotes(uid: string): Promise<Row[]>;
  lote(uid: string, id: string): Promise<Row | null>;
  crearLote(uid: string, l: LoteIn): Promise<Row>;
  actualizarLote(uid: string, id: string, l: Partial<LoteIn>): Promise<Row | null>;
  borrarLote(uid: string, id: string): Promise<boolean>;
  analisis(uid: string, loteId?: string, limite?: number): Promise<Row[]>;
  crearAnalisis(uid: string, a: AnalisisIn): Promise<Row>;
  pedidos(uid: string, limite?: number): Promise<Row[]>;
  crearPedido(uid: string, p: PedidoIn): Promise<Row>;
  estadoPedido(uid: string, id: string, estado: string): Promise<Row | null>;
  actividad(uid: string, limite?: number): Promise<Row[]>;
  registrar(uid: string, tipo: TipoActividad, detalle?: Record<string, unknown>, loteId?: string | null): Promise<void>;
}

/** In-memory repo with the same per-user scoping. */
export function memoryRepo(): Repo & { tablas: Record<Tabla, Row[]> } {
  const tablas: Record<Tabla, Row[]> = { perfiles: [], drones: [], lotes: [], analisis: [], pedidos_dron: [], actividad: [] };
  let seq = 0;
  const now = () => new Date(Date.UTC(2026, 10, 15, 12, 0, seq++)).toISOString();
  const id = () => crypto.randomUUID();
  const mine = (t: Tabla, uid: string) => tablas[t].filter((r) => r.user_id === uid);
  const find = (t: Tabla, uid: string, rid: string) => tablas[t].find((r) => r.user_id === uid && r.id === rid) ?? null;
  const newest = (rows: Row[], n = 100) => [...rows].sort((a, b) => String(b.creado_en).localeCompare(String(a.creado_en))).slice(0, n);
  const patch = (t: Tabla, uid: string, rid: string, v: Record<string, unknown>) => {
    const r = find(t, uid, rid);
    if (!r) return null;
    Object.assign(r, v, { actualizado_en: now() });
    return r;
  };
  const drop = (t: Tabla, uid: string, rid: string) => {
    const before = tablas[t].length;
    tablas[t] = tablas[t].filter((r) => !(r.user_id === uid && r.id === rid));
    return tablas[t].length < before;
  };
  return {
    tablas,
    perfil: async (uid) => tablas.perfiles.find((r) => r.user_id === uid) ?? null,
    guardarPerfil: async (uid, p) => {
      const ex = tablas.perfiles.find((r) => r.user_id === uid);
      if (ex) return Object.assign(ex, p, { actualizado_en: now() });
      const r = { user_id: uid, ...p, creado_en: now(), actualizado_en: now() };
      tablas.perfiles.push(r);
      return r;
    },
    drones: async (uid) => newest(mine('drones', uid)),
    dron: async (uid, rid) => find('drones', uid, rid),
    crearDron: async (uid, d) => {
      const r = { id: id(), user_id: uid, ...d, creado_en: now(), actualizado_en: now() };
      tablas.drones.push(r);
      return r;
    },
    actualizarDron: async (uid, rid, d) => patch('drones', uid, rid, d),
    desactivarDrones: async (uid, salvo) => {
      for (const r of mine('drones', uid)) if (r.id !== salvo) r.activo = false;
    },
    borrarDron: async (uid, rid) => drop('drones', uid, rid),
    lotes: async (uid) => newest(mine('lotes', uid)),
    lote: async (uid, rid) => find('lotes', uid, rid),
    crearLote: async (uid, l) => {
      const r = { id: id(), user_id: uid, ...l, creado_en: now(), actualizado_en: now() };
      tablas.lotes.push(r);
      return r;
    },
    actualizarLote: async (uid, rid, l) => patch('lotes', uid, rid, l),
    borrarLote: async (uid, rid) => drop('lotes', uid, rid),
    analisis: async (uid, loteId, n) => newest(mine('analisis', uid).filter((r) => !loteId || r.lote_id === loteId), n),
    crearAnalisis: async (uid, a) => {
      const r = { id: id(), user_id: uid, ...a, creado_en: now() };
      tablas.analisis.push(r);
      return r;
    },
    pedidos: async (uid, n) => newest(mine('pedidos_dron', uid), n),
    crearPedido: async (uid, p) => {
      const r = { id: id(), user_id: uid, estado: 'enviado', ...p, creado_en: now(), actualizado_en: now() };
      tablas.pedidos_dron.push(r);
      return r;
    },
    estadoPedido: async (uid, rid, estado) => patch('pedidos_dron', uid, rid, { estado }),
    actividad: async (uid, n) => newest(mine('actividad', uid), n),
    registrar: async (uid, tipo, detalle = {}, loteId = null) => {
      tablas.actividad.push({ id: ++seq, user_id: uid, tipo, detalle, lote_id: loteId, creado_en: now() });
    },
  };
}
