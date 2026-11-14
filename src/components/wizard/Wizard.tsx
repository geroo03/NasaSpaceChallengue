import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Database, Satellite } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import type { FarmCase } from '../../case/model';
import type { LotApi } from '../../case/lotApi';
import { snapshotMatches } from '../../case/climateSource';
import { primaryBtn, secondaryBtn } from '../ui';
import { StepLocation, coordsValid } from './StepLocation';
import { StepCrop } from './StepCrop';
import { StepResources } from './StepResources';
import { StepPriorities } from './StepPriorities';
import { StepReview } from './StepReview';

const STEPS = ['location', 'crop', 'resources', 'priorities', 'review'] as const;
const QUESTIONS = ['loc.q', 'crop.q', 'res.q', 'prio.q', 'review.q'];
const HELP = ['loc.help', 'crop.help', 'res.help', 'prio.help', 'review.help'];

export function Wizard({
  value,
  onChange,
  step,
  setStep,
  onRun,
  lot,
}: {
  value: FarmCase;
  onChange: (patch: Partial<FarmCase>) => void;
  step: number;
  setStep: (n: number) => void;
  onRun: (useSaved: boolean) => void;
  lot: LotApi;
}) {
  const { t } = useLang();
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    // Move focus to the new question so keyboard and screen-reader users follow the step change.
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const isLast = step === STEPS.length - 1;
  const canAdvance = step !== 0 || coordsValid(value);

  return (
    <div className={step === 0 ? 'max-w-5xl mx-auto' : 'max-w-3xl mx-auto'}>
      <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#283618]">{t('wizard.title')}</p>

      <nav aria-label={t('wizard.progress', { n: step + 1, total: STEPS.length })} className="mt-4">
        <ol className="grid grid-cols-5 gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                aria-label={t(`wizard.step.${s}`)}
                disabled={i > step && !canAdvance}
                onClick={() => (i <= step || canAdvance ? setStep(i) : undefined)}
                aria-current={i === step ? 'step' : undefined}
                className="flex min-h-[44px] w-full flex-col justify-center text-left focus-visible:outline-2 focus-visible:outline-[#BC6C25] rounded disabled:opacity-50"
              >
                <span className={`block h-1.5 w-full rounded-full ${i <= step ? 'bg-[#BC6C25]' : 'bg-[#A89F8B]'}`} />
                <span className={`mt-1.5 hidden sm:block text-xs font-bold ${i === step ? 'text-[#283618]' : 'text-[#3B2F20]/90'}`}>
                  {t(`wizard.step.${s}`)}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs font-bold text-[#3B2F20]/80 sm:hidden">
          {t('wizard.progress', { n: step + 1, total: STEPS.length })} · {t(`wizard.step.${STEPS[step]}`)}
        </p>
      </nav>

      <h1 ref={heading} tabIndex={-1} className="headline-display headline-display--bold mt-6 text-3xl sm:text-4xl text-[#283618] outline-none">
        {t(QUESTIONS[step] ?? '')}
      </h1>
      <p className="mt-2 mb-6 text-[#3B2F20]/90 leading-relaxed">{t(HELP[step] ?? '')}</p>

      {step === 0 && <StepLocation value={value} onChange={onChange} lot={lot} />}
      {step === 1 && <StepCrop value={value} onChange={onChange} />}
      {step === 2 && <StepResources value={value} onChange={onChange} />}
      {step === 3 && <StepPriorities value={value} onChange={onChange} />}
      {step === 4 && <StepReview value={value} goTo={setStep} />}

      <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        {step > 0 ? (
          <button type="button" className={secondaryBtn} onClick={() => setStep(step - 1)}>
            <ArrowLeft aria-hidden className="h-4 w-4" /> {t('wizard.back')}
          </button>
        ) : (
          <span />
        )}
        {!isLast ? (
          <button type="button" className={primaryBtn} disabled={!canAdvance} onClick={() => setStep(step + 1)}>
            {t('wizard.next')} <ArrowRight aria-hidden className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            {snapshotMatches(value.lat, value.lon) && (
              <button type="button" className={secondaryBtn} onClick={() => onRun(true)}>
                <Database aria-hidden className="h-4 w-4" /> {t('review.goSaved')}
              </button>
            )}
            <button type="button" className={primaryBtn} disabled={!coordsValid(value)} onClick={() => onRun(false)}>
              <Satellite aria-hidden className="h-4 w-4" /> {t('review.go')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
