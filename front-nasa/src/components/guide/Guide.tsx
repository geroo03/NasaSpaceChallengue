import { useId } from 'react';
import { Compass, Lightbulb, X } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { useGuide } from './GuideContext';

/** Screen guide: what this screen is for and the steps to follow, numbered. */
export function ScreenGuide({ id, steps }: { id: string; steps: number }) {
  const { t } = useLang();
  const guide = useGuide();
  const headingId = useId();
  if (!guide.isOpen(id)) return null;
  return (
    <section aria-labelledby={headingId} className="fs-enter relative rounded-2xl border-2 border-[#606C38] bg-[#E3EBDD] p-4 sm:p-5 text-[#283618]">
      <button
        type="button"
        onClick={() => guide.dismiss(id)}
        aria-label={t('guide.close')}
        className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-lg hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-[#BC6C25]"
      >
        <X aria-hidden className="h-5 w-5" />
      </button>
      <h2 id={headingId} className="flex items-center gap-2 pr-10 text-base sm:text-lg font-bold">
        <Compass aria-hidden className="h-5 w-5 shrink-0 text-[#606C38]" /> {t(`guide.${id}.title`)}
      </h2>
      <ol className="mt-3 space-y-2">
        {Array.from({ length: steps }, (_, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#283618] text-xs font-bold text-[#FEFAE0]">{i + 1}</span>
            <span>{t(`guide.${id}.${i + 1}`)}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => guide.dismiss(id)}
          className="min-h-[44px] rounded-xl bg-[#283618] px-4 text-sm font-bold text-[#FEFAE0] hover:bg-[#1d2711] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25]"
        >
          {t('guide.ok')}
        </button>
        <button type="button" onClick={guide.dismissAll} className="min-h-[44px] text-sm font-bold text-[#3B2F20] underline underline-offset-2">
          {t('guide.off')}
        </button>
      </div>
    </section>
  );
}

/** One-line tip at the top of a results section: what to look at and what to do with it. */
export function SectionTip({ id }: { id: string }) {
  const { t } = useLang();
  const guide = useGuide();
  if (!guide.isOpen(`tip.${id}`)) return null;
  return (
    <p role="note" className="fs-enter flex items-start gap-2 rounded-xl border border-[#DDA15E] bg-[#FEFAE0] px-3 py-2 text-sm text-[#3B2F20]">
      <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#BC6C25]" />
      <span className="flex-1">
        <strong className="text-[#283618]">{t('guide.tipLabel')}</strong> {t(`guide.tip.${id}`)}
      </span>
      <button
        type="button"
        onClick={() => guide.dismiss(`tip.${id}`)}
        aria-label={t('guide.closeTip')}
        className="-my-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-[#F3E6C4] focus-visible:outline-2 focus-visible:outline-[#BC6C25]"
      >
        <X aria-hidden className="h-4 w-4" />
      </button>
    </p>
  );
}
