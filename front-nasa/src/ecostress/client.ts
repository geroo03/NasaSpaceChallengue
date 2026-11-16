import { EcostressError, type Extraction } from './data';
import { currentSession } from '../backend/supabase';
export interface JobReply { status: 'pending' | 'done'; job?: string; csv?: string; source?: 'earthdata' }
export async function ecostressApi(init: RequestInit = {}, job?: string): Promise<JobReply & { configured?: boolean }> {
  // Live extraction needs the signed-in user's token (the server checks it when the backend is on).
  const session = await currentSession().catch(() => null);
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) };
  const res = await fetch(`/api/ecostress${job ? `?job=${encodeURIComponent(job)}` : ''}`, { ...init, headers });
  const body = await res.json().catch(() => null) as (JobReply & { configured?: boolean; error?: string }) | null;
  if (!res.ok || !body) throw new EcostressError(body?.error ?? 'network');
  return body;
}
export function startEcostress(x: Extraction, signal: AbortSignal) {
  return ecostressApi({ method: 'POST', body: JSON.stringify(x), signal });
}
