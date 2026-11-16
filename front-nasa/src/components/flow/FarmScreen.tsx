import { ArrowLeft, Satellite } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import type { FarmCase } from '../../case/model';
import { Collapsible, primaryBtn, secondaryBtn } from '../ui';
import { StepCrop } from './StepCrop';
import { IrrigationQuestion, MachineryList } from './StepResources';
import { StepPriorities } from './StepPriorities';
import { ScreenGuide } from '../guide/Guide';

function Section({ n, title, help, children }: { n: number; title: string; help: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`farm-${n}`} className="space-y-3">
      <div>
        <h2 id={`farm-${n}`} className="text-xl sm:text-2xl font-bold text-[#283618]">
          <span className="mr-2 text-[#BC6C25]">{n}.</span>
          {title}
        </h2>
        <p className="mt-1 text-sm text-[#3B2F20]/90">{help}</p>
      </div>
      {children}
    </section>
  );
}

/** Screen 2: what you grow, whether you can irrigate and what matters to you, on one page. */
export function FarmScreen({
  value,
  onChange,
  onBack,
  onRun,
}: {
  value: FarmCase;
  onChange: (patch: Partial<FarmCase>) => void;
  onBack: () => void;
  onRun: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="fs-enter max-w-3xl mx-auto space-y-10">
      <header>
        <h1 className="headline-display headline-display--bold text-3xl sm:text-4xl text-[#283618]">{t('farm.title')}</h1>
        <p className="mt-2 text-[#3B2F20]/90">{t('farm.help')}</p>
      </header>
      <ScreenGuide id="farm" steps={3} video="campana" />
      <Section n={1} title={t('crop.q')} help={t('crop.help')}>
        <StepCrop value={value} onChange={onChange} />
      </Section>
      <Section n={2} title={t('farm.water')} help={t('farm.waterHelp')}>
        <IrrigationQuestion value={value} onChange={onChange} />
      </Section>
      <Section n={3} title={t('prio.q')} help={t('prio.help')}>
        <StepPriorities value={value} onChange={onChange} />
      </Section>
      <Collapsible title={t('farm.machinery')}>
        <MachineryList value={value} onChange={onChange} />
      </Collapsible>
      <div className="flex flex-row items-center justify-between gap-3 sm:pt-6 sticky bottom-0 z-[1050] -mx-4 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-[#f0ede4]/95 backdrop-blur-sm border-t border-[#DECFA7] sm:static sm:mx-0 sm:px-0 sm:pb-0 sm:bg-transparent sm:backdrop-blur-none">
        <button type="button" className={secondaryBtn} onClick={onBack}>
          <ArrowLeft aria-hidden className="h-4 w-4" /> {t('flow.backLot')}
        </button>
        <button type="button" className={primaryBtn} onClick={onRun}>
          <Satellite aria-hidden className="h-4 w-4" /> {t('flow.run')}
        </button>
      </div>
    </div>
  );
}
