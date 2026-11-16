import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useProfile } from '../../profile/ProfileContext';
import { loadGuideProgress, saveGuideProgress } from '../../backend/supabase';

/**
 * Small built-in tutorial: one guide per screen and one tip per results section. Each one is shown
 * ONCE: it is marked as seen as soon as it appears (it stays on screen for that visit) and never comes
 * back, even if it wasn't closed. Signed in, "seen" belongs to the ACCOUNT (Supabase user metadata) and
 * follows the user across devices; without a session it is kept on this device. "Guide" in the header
 * shows everything again.
 */
// v2: guides changed with the demo mode; everyone sees them once more.
const KEY = 'agrofield.guide.v2';

interface GuideApi {
  isOpen: (id: string) => boolean;
  /** Records that a guide or tip was shown, without hiding it during this visit. */
  markSeen: (id: string) => void;
  dismiss: (id: string) => void;
  /** Hide every guide and tip ("don't show guides again"). */
  dismissAll: () => void;
  /** Show every guide and tip again. */
  reset: () => void;
}

type Saved = { off: boolean; seen: string[] };

/** Device and account progress together: seen anywhere = seen; turned off anywhere = off. */
export function mergeGuide(a: Saved, b: Saved): Saved {
  return { off: a.off || b.off, seen: [...new Set([...a.seen, ...b.seen])] };
}
const same = (a: Saved, b: Saved) => a.off === b.off && a.seen.length === b.seen.length && a.seen.every((x) => b.seen.includes(x));

function read(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null;
    return v && Array.isArray(v.seen) ? { off: Boolean(v.off), seen: v.seen.filter((x) => typeof x === 'string') } : { off: false, seen: [] };
  } catch {
    return { off: false, seen: [] };
  }
}
function write(v: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // private mode: guides come back next visit, nothing worse
  }
}

const Ctx = createContext<GuideApi | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Saved>(read);
  // What had already been seen when this visit started: those stay hidden. Guides seen during this
  // visit are saved right away but keep showing until the visitor closes them or leaves.
  const [hiddenNow, setHiddenNow] = useState<string[]>(() => read().seen);
  // While the sign-in dialog covers the screen nothing counts as seen (nor is shown behind it).
  const { profile, guest, editing, email } = useProfile();
  // Signed in: wait until the account's progress arrives (or fails) before showing anything.
  const [accountReady, setAccountReady] = useState<string | null>(null);
  const paused = editing || (!profile && !guest) || (email !== null && accountReady !== email);

  // Account sync. Until the account's progress has been read, nothing is written to it, so a device
  // with little progress never overwrites what the account already had.
  const synced = useRef<string | null>(null);
  useEffect(() => {
    synced.current = null;
    if (!email) return;
    let live = true;
    const ready = () => live && setAccountReady(email);
    const timer = window.setTimeout(ready, 4000); // slow network: don't hold the guides forever
    loadGuideProgress()
      .then((remote) => {
        if (!live || !remote) return;
        setState((local) => {
          const merged = mergeGuide(local, remote);
          write(merged);
          if (!same(merged, remote)) void saveGuideProgress(merged).catch(() => undefined);
          return merged;
        });
        // Seen on another device: hide now (guides already on screen in this visit stay).
        setHiddenNow((h) => [...new Set([...h, ...remote.seen])]);
        synced.current = email;
      })
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(timer);
        ready();
      });
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [email]);
  useEffect(() => {
    if (!email || synced.current !== email) return;
    const timer = window.setTimeout(() => void saveGuideProgress(state).catch(() => undefined), 800);
    return () => window.clearTimeout(timer);
  }, [state, email]);
  const update = useCallback((f: (s: Saved) => Saved) => {
    setState((s) => {
      const next = f(s);
      write(next);
      return next;
    });
  }, []);
  const api = useMemo<GuideApi>(
    () => ({
      isOpen: (id) => !paused && !state.off && !hiddenNow.includes(id),
      markSeen: (id) => update((s) => (s.seen.includes(id) ? s : { ...s, seen: [...s.seen, id] })),
      dismiss: (id) => {
        update((s) => (s.seen.includes(id) ? s : { ...s, seen: [...s.seen, id] }));
        setHiddenNow((h) => (h.includes(id) ? h : [...h, id]));
      },
      dismissAll: () => update((s) => ({ ...s, off: true })),
      reset: () => {
        update(() => ({ off: false, seen: [] }));
        setHiddenNow([]);
      },
    }),
    [state, hiddenNow, paused, update],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGuide(): GuideApi {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGuide outside GuideProvider');
  return c;
}
