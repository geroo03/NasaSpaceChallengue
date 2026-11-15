import { createHmac, timingSafeEqual } from 'node:crypto';
import { appeearsTask, ECOSTRESS_LAYERS, ECOSTRESS_PRODUCT, ECOSTRESS_UNIT, EcostressError, MAX_CSV_BYTES, parseEcostressCsv, validateExtraction, type Extraction } from '../src/ecostress/data.ts';
import { extractDirect } from './ecostress-direct.ts';

const BASE = 'https://appeears.earthdatacloud.nasa.gov/api';
export interface EcostressEnv { APPEEARS_TOKEN?: string; EARTHDATA_TOKEN?: string; EARTHDATA_USERNAME?: string; EARTHDATA_PASSWORD?: string; APPEEARS_JOB_SECRET?: string }
interface Ticket extends Extraction { id: string; expires: number }
export type JobResult = { status: 'pending'; job: string } | { status: 'done'; csv: string; source?: 'earthdata'; granules?: string[] };

/** Server-only NASA credentials. The client receives a scoped, expiring job ticket, never the bearer token. */
export function createEcostressService(env: EcostressEnv, fetchImpl: typeof fetch = fetch) {
  const configured = Boolean(env.EARTHDATA_TOKEN || env.APPEEARS_TOKEN || (env.EARTHDATA_USERNAME && env.EARTHDATA_PASSWORD));
  const secret = env.APPEEARS_JOB_SECRET || env.APPEEARS_TOKEN || `${env.EARTHDATA_USERNAME ?? ''}:${env.EARTHDATA_PASSWORD ?? ''}`;
  let login: { token: string; until: number } | null = null;
  const active = new Map<string, { ticket: string; expires: number }>();
  const sign = (s: string) => createHmac('sha256', secret).update(s).digest('base64url');
  const seal = (t: Ticket) => { const s = Buffer.from(JSON.stringify(t)).toString('base64url'); return `${s}.${sign(s)}`; };
  function open(ticket: string): Ticket {
    if (ticket.length > 2000) throw new EcostressError('job');
    const [body, sig, extra] = ticket.split('.');
    if (!body || !sig || extra) throw new EcostressError('job');
    const expected = Buffer.from(sign(body)); const received = Buffer.from(sig);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new EcostressError('job');
    let t: Ticket;
    try { t = JSON.parse(Buffer.from(body, 'base64url').toString()) as Ticket; } catch { throw new EcostressError('job'); }
    if (typeof t.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(t.id) || !Number.isFinite(t.expires) || t.expires < Date.now()) throw new EcostressError('job');
    validateExtraction(t);
    return t;
  }
  async function token(): Promise<string> {
    if (!configured) throw new EcostressError('notConfigured');
    if (env.APPEEARS_TOKEN) return env.APPEEARS_TOKEN;
    if (login && login.until > Date.now()) return login.token;
    const auth = Buffer.from(`${env.EARTHDATA_USERNAME}:${env.EARTHDATA_PASSWORD}`).toString('base64');
    const r = await fetchImpl(`${BASE}/login`, { method: 'POST', headers: { Authorization: `Basic ${auth}` }, signal: AbortSignal.timeout(20_000) });
    if (!r.ok) throw new EcostressError(r.status === 401 || r.status === 403 ? 'auth' : 'network');
    const value = await r.json() as { token?: string; expiration?: string };
    if (typeof value.token !== 'string' || !value.token) throw new EcostressError('auth');
    const expiry = value.expiration ? Date.parse(value.expiration) : NaN;
    login = { token: value.token, until: Math.min(Date.now() + 3600_000, Number.isFinite(expiry) ? expiry - 60_000 : Infinity) };
    return login.token;
  }
  async function request(path: string, init?: RequestInit): Promise<Response> {
    const r = await fetchImpl(`${BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` }, signal: AbortSignal.timeout(20_000) });
    if (!r.ok) { if (r.status === 401 || r.status === 403) login = null; throw new EcostressError(r.status === 401 || r.status === 403 ? 'auth' : 'network'); }
    return r;
  }
  async function start(value: unknown): Promise<JobResult> {
    const x = validateExtraction(value);
    if (!configured) throw new EcostressError('notConfigured');
    if (env.EARTHDATA_TOKEN) return { status: 'done', source: 'earthdata', ...await extractDirect(x, env.EARTHDATA_TOKEN, fetchImpl) };
    const cacheKey = JSON.stringify(x); const prev = active.get(cacheKey);
    if (prev && prev.expires > Date.now()) return { status: 'pending', job: prev.ticket };
    // Guard against a changed/deprecated product schema rather than silently changing scientific units.
    const schema = await (await request(`/product/${ECOSTRESS_PRODUCT}`)).json() as Record<string, { Units?: string; Available?: boolean; ScaleFactor?: number; AddOffset?: number }>;
    // AppEEARS still labels this layer W/m²; the C2 algorithm guide and science validation specify
    // ETdaily in mm/day. Values are preserved, never converted by a latent-heat flux factor.
    if (![ECOSTRESS_UNIT, 'W/m²'].includes(schema.ETdaily?.Units ?? '') || schema.ETdaily?.ScaleFactor !== 1 || schema.ETdaily?.AddOffset !== 0 || ECOSTRESS_LAYERS.some((k) => !schema[k]?.Available)) throw new EcostressError('product');
    const job = await (await request('/task', { method: 'POST', body: JSON.stringify(appeearsTask(x)) })).json() as { task_id?: string };
    if (!job.task_id || !/^[a-zA-Z0-9-]{1,80}$/.test(job.task_id)) throw new EcostressError('network');
    const expires = Date.now() + 48 * 3600_000;
    const ticket = seal({ ...x, id: job.task_id, expires });
    for (const [key, v] of active) if (v.expires < Date.now()) active.delete(key);
    if (active.size >= 100) active.delete(active.keys().next().value!);
    active.set(cacheKey, { ticket, expires });
    return { status: 'pending', job: ticket };
  }
  async function poll(ticket: string): Promise<JobResult> {
    const t = open(ticket);
    const state = await (await request(`/task/${t.id}`)).json() as { status?: string };
    if (state.status === 'error' || state.status === 'failed') throw new EcostressError('task');
    if (state.status !== 'done') return { status: 'pending', job: ticket };
    const bundle = await (await request(`/bundle/${t.id}`)).json() as { files?: { file_id: string; file_name: string; file_size: number }[] };
    const file = bundle.files?.find((f) => /ECO[_-]L3T[_-]JET[_-]002.*results\.csv$/i.test(f.file_name));
    if (!file) throw new EcostressError('empty');
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(file.file_id) || file.file_size > MAX_CSV_BYTES) throw new EcostressError('large');
    const r = await request(`/bundle/${t.id}/${file.file_id}`);
    if (Number(r.headers.get('content-length')) > MAX_CSV_BYTES) throw new EcostressError('large');
    // AppEEARS point results are bounded by one point and 181 calendar days; parser also enforces bytes.
    const csv = await r.text();
    parseEcostressCsv(csv, t);
    return { status: 'done', csv };
  }
  return { configured, start, poll };
}
