import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRouter, type ApiRequest } from './router.ts';
import { supabaseAdmin, supabaseAuth, supabaseRepo } from './supabaseRepo.ts';
import type { Repo } from './repo.ts';

export interface BackendEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  [k: string]: string | undefined;
}

const MAX_BODY = 256 * 1024; // a lot boundary from a survey plan fits comfortably

/** Node adapter (Vercel function and Vite dev middleware) around the pure router. */
export function createBackendHandler(env: BackendEnv, inject?: { repo: Repo; verify: (t: string) => Promise<string | null> }) {
  let route: ReturnType<typeof createRouter> | null = null;
  const configured = Boolean(inject || (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY));
  if (inject) route = createRouter(inject.repo, inject.verify);
  else if (configured) {
    const db = supabaseAdmin(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
    route = createRouter(supabaseRepo(db), supabaseAuth(db));
  }

  return async (req: IncomingMessage & { body?: unknown }, res: ServerResponse) => {
    const send = (status: number, value: unknown) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(status === 204 ? '' : JSON.stringify(value));
    };
    try {
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, { error: 'origin' });
      const url = new URL(req.url ?? '/', 'http://local');
      // vercel.json rewrites /api/v1/<path> → /api/v1?ruta=<path>; the dev server passes the path as is.
      const ruta = url.searchParams.get('ruta');
      url.searchParams.delete('ruta');
      const path = ruta !== null ? `/${ruta.replace(/^\/+/, '')}` : url.pathname.replace(/^\/api\/v1/, '') || '/';
      if (path === '/' || path === '/estado') return send(200, { configured });
      if (!route) return send(503, { error: 'notConfigured' });

      let body: unknown = req.body;
      const method = (req.method ?? 'GET').toUpperCase();
      if (method !== 'GET' && method !== 'DELETE') {
        if (body === undefined) {
          let raw = '';
          for await (const chunk of req) {
            raw += String(chunk);
            if (raw.length > MAX_BODY) return send(413, { error: 'large' });
          }
          body = raw ? JSON.parse(raw) : {};
        } else if (typeof body === 'string') {
          if (body.length > MAX_BODY) return send(413, { error: 'large' });
          body = body ? JSON.parse(body) : {};
        }
      }
      const auth = req.headers.authorization ?? '';
      const token = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim() ?? null;
      const apiReq: ApiRequest = { method, path, query: url.searchParams, token, body };
      const out = await route(apiReq);
      return send(out.status, out.body);
    } catch (err) {
      if (err instanceof SyntaxError) return send(400, { error: 'json' });
      console.error('[api/v1]', err);
      return send(500, { error: 'server' });
    }
  };
}
