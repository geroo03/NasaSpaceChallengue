import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useProfile } from '../../profile/ProfileContext';

/**
 * Small built-in tutorial: one guide per screen and one tip per results section. Each one is shown
 * ONCE per device: it is marked as seen as soon as it appears (it stays on screen for that visit) and
 * never comes back, even if it wasn't closed. "Guide" in the header shows everything again.
 */
const KEY = 'agrofield.guide.v1';

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
  const { profile, guest, editing } = useProfile();
  const paused = editing || (!profile && !guest);
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
