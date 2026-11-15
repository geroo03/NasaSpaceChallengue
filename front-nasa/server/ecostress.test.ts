import { describe, expect, it, vi } from 'vitest';
import { createEcostressService } from './ecostress';

const x = { lat: -28.38175, lon: -62.73655, from: '2025-08-01', to: '2025-09-29' };
const schema = { ETdaily: { Units: 'W/m²', ScaleFactor: 1, AddOffset: 0, Available: true }, cloud: { Available: true }, water: { Available: true } };
const csv = 'ID,Latitude,Longitude,Date,ECO_L3T_JET_002_ETdaily,ECO_L3T_JET_002_cloud,ECO_L3T_JET_002_water\nfield-shift,-28.38175,-62.73655,2025-09-29,123,0,0';
const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { 'Content-Type': 'application/json' } });

describe('server-side AppEEARS integration', () => {
  it('requires configuration without issuing a NASA request', async () => {
    const fetcher = vi.fn<typeof fetch>(); const api = createEcostressService({}, fetcher);
    expect(api.configured).toBe(false); await expect(api.start(x)).rejects.toThrow('notConfigured'); expect(fetcher).not.toHaveBeenCalled();
  });
  it('submits once, polls asynchronously, downloads and validates a point CSV without exposing the token', async () => {
    let complete = false;
    const fetcher = vi.fn<typeof fetch>(async (url, init) => {
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer private-test-token');
      if (String(url).includes('/product/')) return json(schema);
      if (String(url).endsWith('/task') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)); expect(body.params.layers).toHaveLength(3); expect(body.params.coordinates[0].longitude).toBe(x.lon); return json({ task_id: 'task-123' });
      }
      if (String(url).endsWith('/task/task-123')) return json({ status: complete ? 'done' : 'processing' });
      if (String(url).endsWith('/bundle/task-123')) return json({ files: [{ file_id: 'file-123', file_name: 'Field-Shift-ECO-L3T-JET-002-results.csv', file_size: csv.length }] });
      if (String(url).endsWith('/bundle/task-123/file-123')) return new Response(csv);
      throw new Error('Unexpected request');
    });
    const api = createEcostressService({ APPEEARS_TOKEN: 'private-test-token', APPEEARS_JOB_SECRET: 'test-secret' }, fetcher);
    const started = await api.start(x); expect(started.status).toBe('pending');
    if (started.status !== 'pending') throw new Error('Expected pending');
    expect(started.job).not.toContain('private-test-token');
    expect(await api.start(x)).toEqual(started);
    expect(await api.poll(started.job)).toEqual(started);
    const calls = fetcher.mock.calls.length;
    await expect(api.poll(started.job + 'tampered')).rejects.toThrow('job'); expect(fetcher).toHaveBeenCalledTimes(calls);
    complete = true; expect(await api.poll(started.job)).toEqual({ status: 'done', csv });
  });
  it('refuses a silently changed unit before creating a task', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => json({ ...schema, ETdaily: { ...schema.ETdaily, Units: 'kelvin' } }));
    const api = createEcostressService({ APPEEARS_TOKEN: 'test' }, fetcher);
    await expect(api.start(x)).rejects.toThrow('product'); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('authenticates Earthdata server-side and translates rejected credentials', async () => {
    const fetcher = vi.fn<typeof fetch>(async (url, init) => {
      expect(String(url)).toMatch(/\/login$/); expect(init?.method).toBe('POST'); expect(new Headers(init?.headers).get('Authorization')).toMatch(/^Basic /); return json({}, 401);
    });
    const api = createEcostressService({ EARTHDATA_USERNAME: 'user', EARTHDATA_PASSWORD: 'password' }, fetcher);
    await expect(api.start(x)).rejects.toThrow('auth');
  });
});
