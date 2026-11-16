import type { IncomingMessage, ServerResponse } from 'node:http';
import { EcostressError } from '../src/ecostress/data.ts';
import { createEcostressService, type EcostressEnv } from '../server/ecostress.ts';
import { supabaseAdmin, supabaseAuth } from '../server/v1/supabaseRepo.ts';

type Verify = (token: string) => Promise<string | null>;

/**
 * With the AgroField backend configured, live extraction needs a signed-in user: it spends the team's
 * NASA Earthdata quota, so it must not be open to anyone who knows the URL. Without the backend
 * (local development), it stays as before.
 */
function sessionVerifier(env: EcostressEnv & { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string }): Verify | null {
  return env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAuth(supabaseAdmin(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)) : null;
}

export function createHandler(env: EcostressEnv & { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string }, verify: Verify | null = sessionVerifier(env)) {
  const service = createEcostressService(env);
  const signedIn = async (req: IncomingMessage) => {
    if (!verify) return true;
    const token = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? '')?.[1]?.trim();
    return Boolean(token && (await verify(token)));
  };
  return async (req: IncomingMessage & { body?: unknown }, res: ServerResponse) => {
    const send = (status: number, value: unknown) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    try {
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, { error: 'origin' });
      if (req.method === 'GET') {
        const job = new URL(req.url ?? '/', 'http://local').searchParams.get('job');
        if (!job) return send(200, { configured: service.configured, session: verify !== null });
        if (!(await signedIn(req))) return send(401, { error: 'session' });
        return send(200, await service.poll(job));
      }
      if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(405, { error: 'method' }); }
      if (!(await signedIn(req))) return send(401, { error: 'session' });
      if (!service.configured) return send(503, { error: 'notConfigured' });
      let body = req.body;
      if (body === undefined) {
        let raw = '';
        for await (const chunk of req) { raw += String(chunk); if (raw.length > 4096) throw new EcostressError('large'); }
        try { body = JSON.parse(raw); } catch { throw new EcostressError('request'); }
      } else if (typeof body === 'string') {
        if (body.length > 4096) throw new EcostressError('large');
        try { body = JSON.parse(body); } catch { throw new EcostressError('request'); }
      }
      const result = await service.start(body);
      return send(result.status === 'done' ? 200 : 202, result);
    } catch (err) {
      const code = err instanceof EcostressError ? err.code : 'network';
      return send(['point', 'dates', 'job', 'request', 'large'].includes(code) ? 400 : code === 'notConfigured' ? 503 : 502, { error: code });
    }
  };
}
export default createHandler(process.env);
