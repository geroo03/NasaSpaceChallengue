import { Lock } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { useProfile } from '../profile/ProfileContext';

/**
 * Demo mode (backend on, nobody signed in): only the example field can be explored. Anything that
 * uses the visitor's own data or sends something real is replaced by this invitation to sign in.
 */
export function DemoLock({ what, compact = false }: { what: string; compact?: boolean }) {
  const { t } = useLang();
  const { setEditing } = useProfile();
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-[#A3B18A] bg-[#F4F1E6] text-sm text-[#283618] ${compact ? 'px-3 py-2' : 'p-3'}`}>
      <Lock aria-hidden className="h-4 w-4 shrink-0 text-[#606C38]" />
      <span className="min-w-0 flex-1">{t('demo.lock', { what })}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="min-h-[40px] rounded-lg bg-[#283618] px-3 text-sm font-bold text-[#FEFAE0] hover:bg-[#1d2711] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25]"
      >
        {t('demo.signIn')}
      </button>
    </div>
  );
}

/** Banner at the top of each screen while in demo mode. */
export function DemoBanner() {
  const { t } = useLang();
  const { setEditing } = useProfile();
  return (
    <div role="status" className="flex flex-col gap-3 rounded-2xl border-2 border-[#DDA15E] bg-[#FEFAE0] p-4 sm:flex-row sm:items-center">
      <p className="flex-1 text-sm text-[#3B2F20]">
        <strong className="block text-[#283618]">{t('demo.title')}</strong>
        {t('demo.text')}
      </p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="min-h-[44px] shrink-0 rounded-xl bg-[#9A5518] px-4 font-bold text-white hover:bg-[#7A4310] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#283618]"
      >
        {t('demo.cta')}
      </button>
    </div>
  );
}
