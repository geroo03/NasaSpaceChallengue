import { useEffect, useId, useState } from 'react';
import { Compass, Lightbulb, PlayCircle, X } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { useGuide } from './GuideContext';

/** Short screen recording of the real app (16–20 s, no sound), in the visitor's language. */
function TutorialVideo({ name, label }: { name: string; label: string }) {
  const { lang } = useLang();
  const src = `/tutorial/${name}-${lang === 'es' ? 'es' : 'en'}`;
  return (
    <figure className="mx-auto w-full max-w-[260px]">
      <div className="overflow-hidden rounded-[22px] border-[6px] border-[#283618] bg-[#283618] shadow-lg">
        <video key={src} src={`${src}.mp4`} poster={`${src}.jpg`} autoPlay muted loop playsInline controls preload="metadata" aria-label={label} className="block aspect-[390/844] w-full bg-[#f0ede4]" />
      </div>
    </figure>
  );
}

/** Screen guide: what this screen is for and the steps to follow, numbered, with an optional short video. */
export function ScreenGuide({ id, steps, video }: { id: string; steps: number; video?: string }) {
  const { t } = useLang();
  const guide = useGuide();
  const headingId = useId();
  const [watching, setWatching] = useState(false);
  const open = guide.isOpen(id);
  const { markSeen } = guide;
  useEffect(() => {
    if (open) markSeen(id);
  }, [open, id, markSeen]);
  if (!open) return null;
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
      <div className={watching && video ? 'mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_260px] sm:items-start' : ''}>
      <ol className={watching && video ? 'space-y-2' : 'mt-3 space-y-2'}>
        {Array.from({ length: steps }, (_, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#283618] text-xs font-bold text-[#FEFAE0]">{i + 1}</span>
            <span>{t(`guide.${id}.${i + 1}`)}</span>
          </li>
        ))}
      </ol>
      {watching && video && <TutorialVideo name={video} label={t(`guide.${id}.title`)} />}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {video && (
          <button
            type="button"
            aria-expanded={watching}
            onClick={() => setWatching((w) => !w)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-[#283618] bg-white px-4 text-sm font-bold text-[#283618] hover:bg-[#F4F1E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25]"
          >
            <PlayCircle aria-hidden className="h-5 w-5" /> {watching ? t('guide.hideVideo') : t('guide.watch')}
          </button>
        )}
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
  const open = guide.isOpen(`tip.${id}`);
  const { markSeen } = guide;
  useEffect(() => {
    if (open) markSeen(`tip.${id}`);
  }, [open, id, markSeen]);
  if (!open) return null;
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
