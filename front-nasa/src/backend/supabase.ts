import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

/**
 * The only browser-side boundary with Supabase Auth (same rule as AgroCordS src/lib/supabaseClient.ts).
 * Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY the app runs in local mode: profile on the device,
 * no account. That is exactly the same path as "nobody signed in".
 */
let client: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  // PKCE puts the code in ?code=…, so it doesn't clash with the app's #/hash routes.
  client = url && key ? createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } }) : null;
  return client;
}

export const cloudEnabled = () => supabase() !== null;

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const sb = supabase();
  if (!sb) return { error: 'notConfigured' };
  const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/`, shouldCreateUser: true } });
  return { error: error ? error.message : null };
}

export async function currentSession(): Promise<Session | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function signOut(): Promise<void> {
  await supabase()?.auth.signOut();
}

/** Fires on app start (INITIAL_SESSION), sign-in and sign-out; token refreshes are ignored. */
export function onSessionChange(cb: (s: Session | null, signedInNow: boolean) => void): () => void {
  const sb = supabase();
  if (!sb) return () => undefined;
  const { data } = sb.auth.onAuthStateChange((e, s) => {
    if (e === 'INITIAL_SESSION' || e === 'SIGNED_IN' || e === 'SIGNED_OUT') cb(s, e !== 'SIGNED_OUT');
  });
  return () => data.subscription.unsubscribe();
}

/** Tutorial progress kept in the account (Supabase user metadata), so it follows the user across devices. */
export interface GuideProgress {
  off: boolean;
  seen: string[];
}
const GUIDE_META = 'agrofield_guide';

export async function loadGuideProgress(): Promise<GuideProgress | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  const v = (data.user.user_metadata as Record<string, unknown> | undefined)?.[GUIDE_META] as Partial<GuideProgress> | undefined;
  if (!v || !Array.isArray(v.seen)) return { off: false, seen: [] };
  return { off: Boolean(v.off), seen: v.seen.filter((x): x is string => typeof x === 'string').slice(0, 200) };
}

export async function saveGuideProgress(v: GuideProgress): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  await sb.auth.updateUser({ data: { [GUIDE_META]: { off: v.off, seen: v.seen.slice(0, 200) } } });
}
