import { useMemo, useState } from 'react';
import { Database, Loader2, Pencil, RefreshCw } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { applyScenario, buildClimateProfile, type Scenario } from '../../engine/analysis/climate';
import { compareStrategiesDetailed, GLOBAL_GAPS } from '../../engine/domain/rotations';
import { toFarmContext, type FarmCase } from '../../case/model';
import type { LoadedSeries } from '../../case/climateSource';
import { Card, Collapsible, Notice, SectionTitle, primaryBtn, secondaryBtn } from '../ui';
import { FieldScene } from './FieldScene';
import { RotationCalendar } from './RotationCalendar';
import { StrategyPanel, StrategyTabs } from './StrategyPanel';
import { ClimatePanel } from './ClimatePanel';
import { VerificationPanel } from './VerificationPanel';
import { AssumptionList, DiscardedList, SensitivityPanel } from './ContextPanels';
import { LotImagery } from './LotImagery';
import { snapshotMatches } from '../../case/climateSource';

export type LoadState =
  | { status: 'loading'; saved: boolean }
  | { status: 'error'; message: string; canUseSaved: boolean }
  | { status: 'ready'; data: LoadedSeries };

interface Props {
  farmCase: FarmCase;
  onPolygon: (p: FarmCase['lotPolygon']) => void;
  load: LoadState;
  onEdit: () => void;
  onRetry: () => void;
  onUseSaved: () => void;
}

export function ResultsScreen({ farmCase, onPolygon, load, onEdit, onRetry, onUseSaved }: Props) {
  const { t } = useLang();

  if (load.status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center" role="status" aria-live="polite">
        <Loader2 aria-hidden className="mx-auto h-10 w-10 animate-spin text-[#606C38] motion-reduce:animate-none" />
        <p className="mt-4 font-bold text-[#283618]">{load.saved ? t('load.loadingSaved') : t('load.loading', { years: farmCase.years })}</p>
      </div>
    );
  }
  if (load.status === 'error') {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-4">
        <Notice tone="error">
          <strong className="block">{t('load.error')}</strong>
          {t('load.errorDetail', { msg: load.message })}
        </Notice>
        {!load.canUseSaved && <p className="text-sm">{t('load.noSaved')}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" className={primaryBtn} onClick={onRetry}>
            <RefreshCw aria-hidden className="h-4 w-4" /> {t('load.retry')}
          </button>
          {load.canUseSaved && (
            <button type="button" className={secondaryBtn} onClick={onUseSaved}>
              <Database aria-hidden className="h-4 w-4" /> {t('load.useSaved')}
            </button>
          )}
          <button type="button" className={secondaryBtn} onClick={onEdit}>
            <Pencil aria-hidden className="h-4 w-4" /> {t('res.editData')}
          </button>
        </div>
      </div>
    );
  }
  return <Results farmCase={farmCase} data={load.data} onEdit={onEdit} onPolygon={onPolygon} />;
}

function Results({ farmCase, data, onEdit, onPolygon }: { farmCase: FarmCase; data: LoadedSeries; onEdit: () => void; onPolygon: Props['onPolygon'] }) {
  const { t, m, num } = useLang();
  const [scenario, setScenario] = useState<Scenario>({ precipPct: 0, tempC: 0 });
  const [selectedId, setSelectedId] = useState('current');
  const [month, setMonth] = useState(19); // February of year 2 in the south: summer crops on the field

  const { farm, assumptions } = useMemo(() => toFarmContext(farmCase), [farmCase]);
  const computed = useMemo(() => {
    try {
      const profile = buildClimateProfile(applyScenario(data.series, scenario));
      const outcome = compareStrategiesDetailed(profile, farm, { currentTemplate: farmCase.currentTemplate });
      return { profile, outcome, error: null as string | null };
    } catch (err) {
      return { profile: null, outcome: null, error: err instanceof Error ? err.message : String(err) };
    }
  }, [data, scenario, farm, farmCase.currentTemplate]);

  if (!computed.profile || !computed.outcome) {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-4">
        <Notice tone="error">
          {t('load.empty')} {computed.error}
        </Notice>
        <button type="button" className={secondaryBtn} onClick={onEdit}>
          {t('res.editData')}
        </button>
      </div>
    );
  }

  const { profile, outcome } = computed;
  const strategies = outcome.strategies;
  const selected = strategies.find((s) => s.id === selectedId) ?? strategies[0]!;
  const reference = strategies[0]!;
  const altIndex = strategies.filter((s) => !s.isCurrent).indexOf(selected) + 1;
  const nAlt = strategies.length - 1;
  const years = profile.yearsAnalysed;
  const from = years[0] ?? data.startYear;
  const to = years[years.length - 1] ?? data.endYear;
  const scenarioOn = scenario.precipPct !== 0 || scenario.tempC !== 0;
  const place = farmCase.placeId ? t(`loc.place.${farmCase.placeId}`) : t('loc.place.custom');

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="headline-display text-3xl sm:text-4xl text-[#283618]">{t('res.title')}</h1>
          <p className="mt-2 text-sm text-[#3B2F20]">
            <strong>{place}</strong> · {t('res.point', { lat: farmCase.lat.toFixed(4), lon: farmCase.lon.toFixed(4) })} · {t('review.current')}:{' '}
            {farmCase.currentChoice === 'other' && farmCase.otherCrop ? `${farmCase.otherCrop} → ` : ''}
            {t(`template.${farmCase.currentTemplate}`)}
          </p>
          <p className="mt-1 text-xs text-[#3B2F20]/85">
            {data.origin === 'saved'
              ? t('res.dataSaved', { from, to, date: data.retrievedOn })
              : t('res.dataLive', { from, to, date: data.retrievedOn })}{' '}
            · {t('res.days', { days: num(data.series.days.length) })} · <strong>{t('res.illustrative')}</strong>
          </p>
        </div>
        <button type="button" className={secondaryBtn} onClick={onEdit}>
          <Pencil aria-hidden className="h-4 w-4" /> {t('res.editData')}
        </button>
      </div>

      {scenarioOn && (
        <div role="status" className="rounded-xl bg-[#FBE9D0] border-2 border-[#DDA15E] px-4 py-3 text-sm font-bold text-[#5C3209]">
          {t('res.scenarioOn', {
            p: `${scenario.precipPct > 0 ? '+' : ''}${scenario.precipPct}`,
            t: `${scenario.tempC > 0 ? '+' : ''}${num(scenario.tempC, 1)}`,
          })}
        </div>
      )}
      <AssumptionList keys={assumptions} />

      {nAlt === 0 && <Notice tone="warn">{t('cmp.none')}</Notice>}
      {nAlt > 0 && nAlt < 3 && <Notice tone="warn">{t('cmp.fewer', { n: nAlt })}</Notice>}

      <section aria-labelledby="scene-h" className="space-y-4">
        <h2 id="scene-h" className="text-xl sm:text-2xl font-bold text-[#283618]">
          {t('scene.title')}
        </h2>
        <StrategyTabs strategies={strategies} selectedId={selected.id} onSelect={setSelectedId} />
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <Card className="lg:col-span-5" as="div">
            <FieldScene strategy={selected} month={month} setMonth={setMonth} />
          </Card>
          <div className="lg:col-span-7">
            <StrategyPanel strategy={selected} reference={reference} altIndex={altIndex} farm={farm} />
          </div>
        </div>
        <Card>
          <SectionTitle sub={t('verify.help')}>{t('verify.title')}</SectionTitle>
          <VerificationPanel strategy={selected} onPickMonth={setMonth} />
        </Card>
      </section>

      <Card>
        <SectionTitle sub={t('cal.help')}>{t('cal.title')}</SectionTitle>
        <RotationCalendar
          strategies={strategies}
          selectedId={selected.id}
          month={month}
          onSelect={(id, mm) => {
            setSelectedId(id);
            if (mm !== undefined) setMonth(mm);
          }}
        />
      </Card>

      <Card>
        <SectionTitle>{t('sens.title')}</SectionTitle>
        <SensitivityPanel scenario={scenario} onChange={setScenario} />
      </Card>

      <Card>
        <SectionTitle sub={t('clim.help')}>{t('clim.title')}</SectionTitle>
        <ClimatePanel profile={profile} from={from} to={to} />
      </Card>

      <Card>
        <SectionTitle>{t('lot.title')}</SectionTitle>
        {snapshotMatches(farmCase.lat, farmCase.lon) && !farmCase.lotPolygon && (
          <div className="mb-4">
            <Notice tone="warn">{t('lot.cityWarn')}</Notice>
          </div>
        )}
        <LotImagery lat={farmCase.lat} lon={farmCase.lon} polygon={farmCase.lotPolygon} onPolygon={onPolygon} strategy={selected} />
      </Card>

      {outcome.discarded.length > 0 && (
        <Collapsible title={`${t('disc.title')} (${outcome.discarded.length})`} defaultOpen={nAlt < 3}>
          <DiscardedList items={outcome.discarded} />
        </Collapsible>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-[#283618] mb-2">{t('gaps.title')}</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {GLOBAL_GAPS.map((g) => (
              <li key={g.key}>{m(g)}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-lg font-bold text-[#283618] mb-2">{t('sources.title')}</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {['source.power', 'source.gibs', 'source.fao'].map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
