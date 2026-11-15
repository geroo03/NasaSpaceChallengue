import { Check } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';

export type FlowView = 'lot' | 'farm' | 'results';
const STEPS: FlowView[] = ['lot', 'farm', 'results'];

/** Three questions, always visible: where is it, what do you do, what are your options. */
export function StepNav({ view, onGo, canGo }: { view: FlowView; onGo: (v: FlowView) => void; canGo: boolean }) {
  const { t } = useLang();
  const at = STEPS.indexOf(view);
  return (
    <nav aria-label={t('flow.nav')} className="mb-8">
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => {
          const done = i < at;
          const current = i === at;
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => onGo(s)}
                disabled={!canGo && i > 0}
                aria-current={current ? 'step' : undefined}
                className={`fs-press transition-colors duration-300 flex w-full min-h-[52px] items-center gap-2 rounded-xl border-2 px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25] disabled:opacity-50 ${
                  current ? 'border-[#283618] bg-[#283618] text-[#FEFAE0]' : 'border-[#DECFA7] bg-white/80 text-[#283618] hover:border-[#A3B18A]'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    current ? 'bg-[#DDA15E] text-[#283618]' : done ? 'bg-[#606C38] text-white' : 'bg-[#EFE3C2] text-[#283618]'
                  }`}
                >
                  {done ? <Check aria-hidden className="h-4 w-4" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-tight">{t(`flow.${s}`)}</span>
                  <span className={`hidden sm:block text-xs ${current ? 'text-[#E3EBDD]' : 'text-[#3B2F20]/80'}`}>{t(`flow.${s}.q`)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
