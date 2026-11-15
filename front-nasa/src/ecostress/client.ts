import { EcostressError, type Extraction } from './data';
export interface JobReply { status: 'pending' | 'done'; job?: string; csv?: string; source?: 'earthdata' }
export async function ecostressApi(init: RequestInit = {}, job?: string): Promise<JobReply & { configured?: boolean }> {
  const res = await fetch(`/api/ecostress${job ? `?job=${encodeURIComponent(job)}` : ''}`, { ...init, headers: { 'Content-Type': 'application/json' } });
  const body = await res.json().catch(() => null) as (JobReply & { configured?: boolean; error?: string }) | null;
  if (!res.ok || !body) throw new EcostressError(body?.error ?? 'network');
  return body;
}
export function startEcostress(x: Extraction, signal: AbortSignal) {
  return ecostressApi({ method: 'POST', body: JSON.stringify(x), signal });
}
