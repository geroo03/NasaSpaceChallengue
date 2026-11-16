import { describe, expect, it } from 'vitest';
import { PassThrough } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHandler } from '../api/ecostress.ts';

const verify = async (t: string) => (t === 'tok-ana' ? 'u-ana' : null);
function req(method: string, url: string, headers: Record<string, string> = {}, body = '') {
  const s = new PassThrough() as unknown as IncomingMessage;
  Object.assign(s, { method, url, headers: { host: 'agrofield.test', ...headers } });
  (s as unknown as PassThrough).end(body);
  return s;
}
function res() {
  const out = { status: 0, body: '' };
  const r = { statusCode: 0, setHeader() {}, end(b: string) { out.status = r.statusCode; out.body = b; } } as unknown as ServerResponse & { statusCode: number };
  return { r, out };
}
const point = JSON.stringify({ lat: -28.38175, lon: -62.73655, from: '2026-09-01', to: '2026-09-30' });

describe('ECOSTRESS live extraction needs a session when the backend is on', () => {
  it('rejects anonymous extraction and job polling', async () => {
    const h = createHandler({}, verify);
    const a = res();
    await h(req('POST', '/api/ecostress', {}, point), a.r);
    expect(a.out.status).toBe(401);
    expect(JSON.parse(a.out.body)).toEqual({ error: 'session' });
    const b = res();
    await h(req('GET', '/api/ecostress?job=abc', { authorization: 'Bearer forged' }), b.r);
    expect(b.out.status).toBe(401);
  });
  it('lets a signed-in user through (here the NASA side is not configured)', async () => {
    const h = createHandler({}, verify);
    const a = res();
    await h(req('POST', '/api/ecostress', { authorization: 'Bearer tok-ana' }, point), a.r);
    expect(a.out.status).toBe(503);
    expect(JSON.parse(a.out.body)).toEqual({ error: 'notConfigured' });
  });
  it('keeps the public status check and the old behaviour without a backend', async () => {
    const s = res();
    await h0(req('GET', '/api/ecostress'), s.r);
    expect(JSON.parse(s.out.body)).toEqual({ configured: false, session: false });
    const p = res();
    await h0(req('POST', '/api/ecostress', {}, point), p.r);
    expect(p.out.status).toBe(503);
  });
});
const h0 = createHandler({}, null);
