import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { cropName, extendDict, MONTHS, msg, t as translate, type Lang } from './engineText';
import { uiEn, uiEs } from './ui';
import type { Msg } from '../engine/domain/rotations';

extendDict('es', uiEs);
extendDict('en', uiEn);

export type { Lang };

interface LangApi {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  m: (message: Msg) => string;
  crop: (id: string) => string;
  months: string[];
  num: (n: number, digits?: number) => string;
}

const LangCtx = createContext<LangApi | null>(null);

function initialLang(): Lang {
  try {
    const stored = window.localStorage.getItem('field-shift-lab.lang');
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // ignore
  }
  return 'es';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const api = useMemo<LangApi>(() => {
    const locale = lang === 'es' ? 'es-AR' : 'en-US';
    return {
      lang,
      setLang: (l) => {
        setLangState(l);
        document.documentElement.lang = l;
        try {
          window.localStorage.setItem('field-shift-lab.lang', l);
        } catch {
          // ignore
        }
      },
      t: (key, params) => translate(lang, key, params ?? {}),
      m: (message) => msg(lang, message),
      crop: (id) => cropName(lang, id),
      months: MONTHS[lang],
      num: (n, digits = 0) => n.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }),
    };
  }, [lang]);
  return <LangCtx.Provider value={api}>{children}</LangCtx.Provider>;
}

export function useLang(): LangApi {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error('useLang outside LangProvider');
  return ctx;
}
