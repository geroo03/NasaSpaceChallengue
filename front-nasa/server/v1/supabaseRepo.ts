import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Repo, Row } from './repo.ts';

/**
 * The only file that talks to Supabase (same rule as AgroCordS server/src/lib/supabase.ts).
 * Uses the SERVICE ROLE key: the API already verified the user's JWT and filters by user_id
 * in every query; Row Level Security stays as defence in depth.
 */
export function supabaseAdmin(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

class DbError extends Error {}
function ok<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new DbError(r.error.message);
  return r.data;
}

export function supabaseRepo(db: SupabaseClient): Repo {
  const one = async (t: string, uid: string, id: string) => ok(await db.from(t).select('*').eq('user_id', uid).eq('id', id).maybeSingle()) as Row | null;
  const list = async (t: string, uid: string, n = 100) => ok(await db.from(t).select('*').eq('user_id', uid).order('creado_en', { ascending: false }).limit(n)) as Row[];
  const insert = async (t: string, v: Record<string, unknown>) => ok(await db.from(t).insert(v).select('*').single()) as Row;
  const update = async (t: string, uid: string, id: string, v: Record<string, unknown>) =>
    ok(await db.from(t).update(v).eq('user_id', uid).eq('id', id).select('*').maybeSingle()) as Row | null;
  const remove = async (t: string, uid: string, id: string) => (ok(await db.from(t).delete().eq('user_id', uid).eq('id', id).select('id')) as Row[]).length > 0;

  return {
    perfil: async (uid) => ok(await db.from('perfiles').select('*').eq('user_id', uid).maybeSingle()) as Row | null,
    guardarPerfil: async (uid, p) => ok(await db.from('perfiles').upsert({ user_id: uid, ...p }).select('*').single()) as Row,
    drones: (uid) => list('drones', uid),
    dron: (uid, id) => one('drones', uid, id),
    crearDron: (uid, d) => insert('drones', { user_id: uid, ...d }),
    actualizarDron: (uid, id, d) => update('drones', uid, id, d),
    desactivarDrones: async (uid, salvo) => {
      let q = db.from('drones').update({ activo: false }).eq('user_id', uid).eq('activo', true);
      if (salvo) q = q.neq('id', salvo);
      ok(await q);
    },
    borrarDron: (uid, id) => remove('drones', uid, id),
    lotes: (uid) => list('lotes', uid),
    lote: (uid, id) => one('lotes', uid, id),
    crearLote: (uid, l) => insert('lotes', { user_id: uid, ...l }),
    actualizarLote: (uid, id, l) => update('lotes', uid, id, l),
    borrarLote: (uid, id) => remove('lotes', uid, id),
    analisis: async (uid, loteId, n = 50) => {
      let q = db.from('analisis').select('*').eq('user_id', uid);
      if (loteId) q = q.eq('lote_id', loteId);
      return ok(await q.order('creado_en', { ascending: false }).limit(n)) as Row[];
    },
    crearAnalisis: (uid, a) => insert('analisis', { user_id: uid, ...a }),
    pedidos: (uid, n) => list('pedidos_dron', uid, n),
    crearPedido: (uid, p) => insert('pedidos_dron', { user_id: uid, ...p }),
    estadoPedido: (uid, id, estado) => update('pedidos_dron', uid, id, { estado }),
    actividad: (uid, n) => list('actividad', uid, n),
    registrar: async (uid, tipo, detalle = {}, loteId = null) => {
      ok(await db.from('actividad').insert({ user_id: uid, tipo, detalle, lote_id: loteId }));
    },
  };
}

/** Verifies a Supabase access token (from the magic-link session) and returns the user id. */
export function supabaseAuth(db: SupabaseClient) {
  return async (token: string): Promise<string | null> => {
    const { data, error } = await db.auth.getUser(token);
    return error || !data.user ? null : data.user.id;
  };
}
