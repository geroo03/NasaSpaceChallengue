import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Small built-in tutorial: one guide per screen and one tip per results section. What the visitor
 * already closed is remembered on this device; "Guide" in the header shows everything again.
 */
const KEY = 'agrofield.guide.v1';

interface GuideApi {
  isOpen: (id: string) => boolean;
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
  const update = useCallback((f: (s: Saved) => Saved) => {
    setState((s) => {
      const next = f(s);
      write(next);
      return next;
    });
  }, []);
  const api = useMemo<GuideApi>(
    () => ({
      isOpen: (id) => !state.off && !state.seen.includes(id),
      dismiss: (id) => update((s) => (s.seen.includes(id) ? s : { ...s, seen: [...s.seen, id] })),
      dismissAll: () => update((s) => ({ ...s, off: true })),
      reset: () => update(() => ({ off: false, seen: [] })),
    }),
    [state, update],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGuide(): GuideApi {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGuide outside GuideProvider');
  return c;
}
