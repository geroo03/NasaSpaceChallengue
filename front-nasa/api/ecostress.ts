import type { IncomingMessage, ServerResponse } from 'node:http';
import { EcostressError } from '../src/ecostress/data.ts';
import { createEcostressService, type EcostressEnv } from '../server/ecostress.ts';

export function createHandler(env: EcostressEnv) {
  const service = createEcostressService(env);
  return async (req: IncomingMessage & { body?: unknown }, res: ServerResponse) => {
    const send = (status: number, value: unknown) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    try {
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, { error: 'origin' });
      if (req.method === 'GET') {
        const job = new URL(req.url ?? '/', 'http://local').searchParams.get('job');
        return send(200, job ? await service.poll(job) : { configured: service.configured });
      }
      if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(405, { error: 'method' }); }
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
