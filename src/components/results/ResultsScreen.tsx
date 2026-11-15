import { lazy, Suspense, useMemo, useState } from 'react';
import { ArrowRight, FileText, Loader2, Pencil, RefreshCw } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { applyScenario, buildClimateProfile, hargreavesEt0, type Scenario } from '../../engine/analysis/climate';
import { compareStrategiesDetailed, DEFAULT_PAW_MM, GLOBAL_GAPS, type StrategyResult } from '../../engine/domain/rotations';
import { campaignStats, dailyWaterBalance, floweringHeat, latestEnso, seriesForCampaigns, summarizeByPhase } from '../../case/climateRisk';
import type { DailyRecord } from '../../engine/data/power';
import { EnsoBanner, EnsoTable, FloweringHeatList, SoilWaterChart, SowingWaterList } from './ClimateRisk';
import { distanceKm, ringCentroid, toFarmContext, type FarmCase } from '../../case/model';
import { SAVED_SNAPSHOT, type LoadedSeries } from '../../case/climateSource';
import type { LotApi } from '../../case/lotApi';
import { planFieldChecks } from '../../case/verification';
import { Card, Collapsible, CROP_COLORS, Notice, SectionTitle, cropAbbr, primaryBtn, secondaryBtn, textOn } from '../ui';
import { FieldScene } from './FieldScene';
import { RotationCalendar } from './RotationCalendar';
import { StrategyPanel } from './StrategyPanel';
import { ClimatePanel } from './ClimatePanel';
import { VerificationPanel } from './VerificationPanel';
import { AssumptionList, DiscardedList, SensitivityPanel } from './ContextPanels';
import { FieldSheet } from './FieldSheet';
// Map tools (Geoman, Turf, file importers) load only when someone opens them.
const LotImagery = lazy(() => import('./LotImagery').then((m) => ({ default: m.LotImagery })));
const DroneRequestPanel = lazy(() => import('../lot/DroneRequestPanel').then((m) => ({ default: m.DroneRequestPanel })));
const TerrainCard = lazy(() => import('../lot/TerrainCard').then((m) => ({ default: m.TerrainCard })));

export type LoadState =
  | { status: 'loading'; saved: boolean }
  | { status: 'error'; message: string; canUseSaved: boolean }
  | { status: 'ready'; data: LoadedSeries };

interface Props {
  farmCase: FarmCase;
  onLot: (p: FarmCase['lotPolygon'], source: FarmCase['lotSource']) => void;
  onAnalyseAt: (lat: number, lon: number) => void;
  load: LoadState;
  onEdit: (view: 'lot' | 'farm') => void;
  onRetry: () => void;
  lot: LotApi;
}

/** Year presets instead of free sliders: perturbations of the historical series, never forecasts. */
const YEARS: { id: string; scenario: Scenario; phase?: 'nino' | 'nina' }[] = [
  { id: 'history', scenario: { precipPct: 0, tempC: 0 } },
  { id: 'nino', scenario: { precipPct: 0, tempC: 0 }, phase: 'nino' },
  { id: 'nina', scenario: { precipPct: 0, tempC: 0 }, phase: 'nina' },
  { id: 'dry', scenario: { precipPct: -30, tempC: 0 } },
  { id: 'hot', scenario: { precipPct: 0, tempC: 2 } },
];

export function ResultsScreen({ farmCase, onLot, onAnalyseAt, load, onEdit, onRetry, lot }: Props) {
  const { t } = useLang();
  if (load.status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center" role="status" aria-live="polite">
        <Loader2 aria-hidden className="mx-auto h-10 w-10 animate-spin text-[#606C38] motion-reduce:animate-none" />
        <p className="mt-4 font-bold text-[#283618]">{t('load.loading', { years: farmCase.years })}</p>
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
        <p className="text-sm">{t('load.noSaved')}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" className={primaryBtn} onClick={onRetry}>
            <RefreshCw aria-hidden className="h-4 w-4" /> {t('load.retry')}
          </button>
          <button type="button" className={secondaryBtn} onClick={() => onEdit('farm')}>
            <Pencil aria-hidden className="h-4 w-4" /> {t('res.editData')}
          </button>
        </div>
      </div>
    );
  }
  return <Results farmCase={farmCase} data={load.data} onEdit={onEdit} onLot={onLot} onAnalyseAt={onAnalyseAt} lot={lot} />;
}

/** Crop sequence of a strategy as coloured chips (sow month), read from its own calendar. */
export function StrategyChips({ s }: { s: StrategyResult }) {
  const { crop, lang, months } = useLang();
  const slots = [...s.slots].sort((a, b) => a.startIndex - b.startIndex);
  return (
    <span className="flex flex-wrap gap-1.5">
      {slots.map((a, i) => {
        const first = s.timeline[a.months[0] ?? 0];
        const bg = CROP_COLORS[a.crop.id];
        return (
          <span key={i} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold" style={{ background: bg, color: textOn(bg) }}>
            {cropAbbr(lang, a.crop.id)} · {crop(a.crop.id)} · {first ? months[first.calendarMonth - 1] : ''}
          </span>
        );
      })}
    </span>
  );
}

function OptionCard({ s, label, tone, delta }: { s: StrategyResult; label: string; tone: 'ref' | 'alt'; delta?: number }) {
  const { t } = useLang();
  return (
    <div className={`rounded-2xl border-2 p-5 ${tone === 'alt' ? 'border-[#283618] bg-white' : 'border-[#DECFA7] bg-white/70'}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.08em] ${tone === 'alt' ? 'text-[#BC6C25]' : 'text-[#606C38]'}`}>{label}</p>
      <h3 className="mt-1 text-xl font-bold text-[#283618]">{t(`template.${s.templateId}`)}</h3>
      <div className="mt-3">
        <StrategyChips s={s} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#EFE3C2] pt-3">
        <div>
          <dt className="text-xs font-bold text-[#3B2F20]/80">{t('cmp.index')}</dt>
          <dd className="text-2xl font-bold tabular-nums text-[#283618]">
            {Math.round(s.overall)}
            <span className="text-sm text-[#3B2F20]/70">/100</span>
            {delta !== undefined && delta !== 0 && (
              <span className={`ml-2 text-sm ${delta > 0 ? 'text-[#3F6B2A]' : 'text-[#9A3412]'}`}>
                {delta > 0 ? '+' : '−'}
                {Math.abs(delta)}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[#3B2F20]/80">{t('hero.bare')}</dt>
          <dd className="text-2xl font-bold tabular-nums text-[#283618]">
            {s.bareMonths}
            <span className="text-sm text-[#3B2F20]/70"> / 24</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Results({
  farmCase,
  data,
  onEdit,
  onLot,
  onAnalyseAt,
  lot,
}: {
  farmCase: FarmCase;
  data: LoadedSeries;
  onEdit: Props['onEdit'];
  onLot: Props['onLot'];
  onAnalyseAt: Props['onAnalyseAt'];
  lot: LotApi;
}) {
  const { t, m, num, months, crop } = useLang();
  const [yearId, setYearId] = useState('history');
  const [custom, setCustom] = useState<Scenario | null>(null);
  const scenario = custom ?? (YEARS.find((y) => y.id === yearId) ?? YEARS[0]!).scenario;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [month, setMonth] = useState(19); // February of year 2 in the south: summer crops on the field
  const [toolsOpen, setToolsOpen] = useState(false);
  const [sheet, setSheet] = useState(false);

  const { farm, assumptions } = useMemo(() => toFarmContext(farmCase), [farmCase]);
  // ENSO: phase of each past campaign (NOAA ONI) and what happened here in each phase.
  const campaigns = useMemo(() => campaignStats(data.series), [data.series]);
  const phases = useMemo(() => summarizeByPhase(campaigns), [campaigns]);
  const enso = useMemo(() => latestEnso(), []);
  const year = YEARS.find((y) => y.id === yearId) ?? YEARS[0]!;
  const phaseCampaigns = year.phase ? (phases.find((p) => p.phase === year.phase)?.campaigns ?? []) : [];
  const usedSeries = useMemo(() => {
    const base = year.phase && phaseCampaigns.length >= 2 ? seriesForCampaigns(data.series, phaseCampaigns) : data.series;
    return applyScenario(base, scenario);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.series, year.phase, phaseCampaigns.join(','), scenario]);
  const computed = useMemo(() => {
    try {
      const profile = buildClimateProfile(usedSeries);
      const outcome = compareStrategiesDetailed(profile, farm, { currentTemplate: farmCase.currentTemplate });
      return { profile, outcome, error: null as string | null };
    } catch (err) {
      return { profile: null, outcome: null, error: err instanceof Error ? err.message : String(err) };
    }
  }, [usedSeries, farm, farmCase.currentTemplate]);
  // The daily water balance needs consecutive days: full record (with the test scenario, if any).
  const waterSeries = useMemo(() => applyScenario(data.series, scenario), [data.series, scenario]);
  const et0 = useMemo(() => (d: DailyRecord) => hargreavesEt0(d.tmax, d.tmin, data.series.lat, d.doy), [data.series.lat]);
  const paw = farm.soilPawMm ?? DEFAULT_PAW_MM;
  // Climate panel and year labels always describe the whole record, even when the comparison uses ENSO campaigns.
  const recordProfile = useMemo(() => {
    try {
      return buildClimateProfile(waterSeries);
    } catch {
      return null;
    }
  }, [waterSeries]);
  const south = data.series.lat < 0;

  if (!computed.profile || !computed.outcome) {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-4">
        <Notice tone="error">
          {t('load.empty')} {computed.error}
        </Notice>
        <button type="button" className={secondaryBtn} onClick={() => onEdit('farm')}>
          {t('res.editData')}
        </button>
      </div>
    );
  }

  const { profile, outcome } = computed;
  const strategies = outcome.strategies;
  const reference = strategies[0]!;
  const alts = strategies.slice(1);
  const selected = alts.find((s) => s.id === selectedId) ?? alts[0] ?? reference;
  const shown = selected;
  const lotCentre = farmCase.lotPolygon ? ringCentroid(farmCase.lotPolygon) : null;
  const lotCentreKm = lotCentre ? distanceKm(lotCentre, [farmCase.lat, farmCase.lon]) : null;
  const years = (recordProfile ?? profile).yearsAnalysed;
  const from = years[0] ?? data.startYear;
  const to = years[years.length - 1] ?? data.endYear;
  const scenarioOn = scenario.precipPct !== 0 || scenario.tempC !== 0;
  const heatRef = floweringHeat(reference, usedSeries);
  const heatOpt = shown !== reference ? floweringHeat(shown, usedSeries) : [];
  const waterRef = dailyWaterBalance(reference, waterSeries, paw, et0);
  const waterOpt = shown !== reference ? dailyWaterBalance(shown, waterSeries, paw, et0) : null;
  const optLabel = alts.indexOf(shown) === 0 ? t('hero.bestShort') : t('hero.alt', { n: alts.indexOf(shown) + 1 });
  const place =
    lotCentreKm !== null && lotCentreKm <= 1
      ? t(farmCase.lotSource?.kind === 'example' ? 'example.name' : 'lot.centreLabel')
      : farmCase.placeId
        ? t(`loc.place.${farmCase.placeId}`)
        : t('loc.place.custom');
  const why = shown.rationale.map(m).slice(0, 3);
  const watch = [...shown.risks, ...shown.gaps].map(m).slice(0, 3);
  const checks = planFieldChecks(shown).map((c) => {
    const at = (i: number) => {
      const cell = shown.timeline[i];
      return `${cell ? months[cell.calendarMonth - 1] : ''} · ${t('scene.year', { n: i < 12 ? 1 : 2 })}`;
    };
    const when = c.untilMonth !== undefined && c.untilMonth !== c.month ? `${at(c.month)} → ${at(c.untilMonth)}` : at(c.month);
    return { when, what: t(`verify.${c.kind}`, { crop: c.crop ? crop(c.crop) : '', deficit: c.deficitPct ?? 0 }) };
  });

  if (sheet) {
    return (
      <FieldSheet
        farmCase={farmCase}
        data={data}
        from={from}
        to={to}
        scenario={scenarioOn ? scenario : null}
        subset={year.phase && !custom ? t('year.ensoNote', { list: phaseCampaigns.map((c) => `${c}/${String(c + 1).slice(2)}`).join(', ') }) : null}
        reference={reference}
        option={shown}
        why={why}
        watch={watch}
        checks={checks}
        assumptions={assumptions}
        alerts={{
          enso: t('sheet.enso', {
            now: `${t(`enso.now.${enso.phase}`, { strength: t(`enso.strength.${enso.strength}`) })} (ONI ${enso.anom > 0 ? '+' : ''}${num(enso.anom, 2)}, ${enso.season} ${enso.year})`,
            phase: t(`enso.phase.${enso.phase === 'neutral' ? 'nino' : enso.phase}`),
            rain: num(phases.find((p) => p.phase === (enso.phase === 'neutral' ? 'nino' : enso.phase))?.rainOctMarMm ?? NaN),
            neutral: num(phases.find((p) => p.phase === 'neutral')?.rainOctMarMm ?? NaN),
          }),
          heat: [...heatRef.map((h) => ({ h, who: t('hero.today') })), ...heatOpt.map((h) => ({ h, who: optLabel }))].map(
            ({ h, who }) => `${who} · ${crop(h.crop)} (${months[h.calendarMonth - 1]}): ${t(`heat.level.${h.level}`)} · ${t('heat.detail', { days: num(h.hotDays, 1), c: h.heatC, spells: h.yearsWithSpell, years: h.years })}`,
          ),
          water: [...waterRef.sowing.map((w) => ({ w, who: t('hero.today') })), ...(waterOpt?.sowing ?? []).map((w) => ({ w, who: optLabel }))].map(
            ({ w, who }) => `${who} · ${crop(w.crop)}: ${t('water.atSowing', { mm: num(w.medianMm), paw: num(paw), low: Math.round(w.lowShare * w.values.length), n: w.values.length })}`,
          ),
        }}
        onClose={() => setSheet(false)}
      />
    );
  }

  return (
    <div className="fs-enter space-y-8">
      {/* 1. Where, with which data */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="headline-display headline-display--bold text-3xl sm:text-4xl text-[#283618]">{t('hero.title')}</h1>
          <p className="mt-2 text-sm text-[#3B2F20]">
            <strong>{place}</strong> · {t('res.point', { lat: farmCase.lat.toFixed(4), lon: farmCase.lon.toFixed(4) })}
          </p>
          <p className="mt-1 text-xs text-[#3B2F20]/85">
            {data.origin === 'saved'
              ? t('res.dataSaved', { from: data.startYear, to: data.endYear, date: data.retrievedOn })
              : t('res.dataLive', { from: data.startYear, to: data.endYear, date: data.retrievedOn })}{' '}
            · {t('res.days', { days: num(data.series.days.length) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondaryBtn} onClick={() => onEdit('farm')}>
            <Pencil aria-hidden className="h-4 w-4" /> {t('res.editData')}
          </button>
          <button type="button" className={primaryBtn} onClick={() => setSheet(true)}>
            <FileText aria-hidden className="h-4 w-4" /> {t('sheet.open')}
          </button>
        </div>
      </div>
      {data.liveError && <Notice tone="warn">{t('res.fallback')}</Notice>}
      {data.deviceCachedOn && <Notice tone="warn">{t('res.deviceCache', { date: data.deviceCachedOn })}</Notice>}
      {lotCentreKm !== null && lotCentreKm > 1 && lotCentre && (
        <Notice tone="warn">
          <strong className="block">{t('lot.centroidTitle')}</strong>
          {t('lot.centroidText', { lat: farmCase.lat.toFixed(4), lon: farmCase.lon.toFixed(4), km: num(lotCentreKm, 1) })}
          <div className="mt-2">
            <button type="button" className={secondaryBtn} onClick={() => onAnalyseAt(Number(lotCentre[0].toFixed(5)), Number(lotCentre[1].toFixed(5)))}>
              {t('lot.centroidGo')}
            </button>
          </div>
        </Notice>
      )}
      {!farmCase.lotPolygon && Math.abs(farmCase.lat - SAVED_SNAPSHOT.lat) < 1e-4 && Math.abs(farmCase.lon - SAVED_SNAPSHOT.lon) < 1e-4 && (
        <Notice tone="warn">{t('lot.cityWarn')}</Notice>
      )}

      {south && (
      <EnsoBanner
        latest={enso}
        summaries={phases}
        onCompare={(phase) => {
          setCustom(null);
          setYearId(phase);
        }}
      />
      )}

      {/* 2. Which year */}
      <fieldset>
        <legend className="text-sm font-bold text-[#283618]">{t('year.q')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {YEARS.filter((y) => south || !y.phase).map((y) => {
            const active = !custom && yearId === y.id;
            return (
              <button
                key={y.id}
                type="button"
                aria-pressed={active}
                disabled={y.phase !== undefined && (phases.find((p) => p.phase === y.phase)?.campaigns.length ?? 0) < 2}
                onClick={() => {
                  setCustom(null);
                  setYearId(y.id);
                }}
                className={`rounded-full border-2 px-4 min-h-[44px] text-sm font-bold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25] ${
                  active ? 'border-[#283618] bg-[#283618] text-[#FEFAE0]' : 'border-[#DECFA7] bg-white text-[#3B2F20] hover:border-[#A3B18A]'
                }`}
              >
                {t(`year.${y.id}`, { n: phases.find((p) => p.phase === y.phase)?.campaigns.length ?? 0 })}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-[#3B2F20]/85">
          {year.phase && !custom
            ? t('year.ensoNote', { list: phaseCampaigns.map((c) => `${c}/${String(c + 1).slice(2)}`).join(', ') })
            : scenarioOn
              ? t('year.note')
              : t('year.historyNote', { from, to })}
        </p>
      </fieldset>

      {/* 3. The comparison */}
      {alts.length === 0 && <Notice tone="warn">{t('cmp.none')}</Notice>}
      {alts.length > 0 && alts.length < 3 && <Notice tone="warn">{t('cmp.fewer', { n: alts.length })}</Notice>}
      <section aria-labelledby="hero-h" className="space-y-4">
        <h2 id="hero-h" className="sr-only">
          {t('hero.title')}
        </h2>
        <div className="fs-stagger grid gap-4 md:grid-cols-2 items-stretch">
          <OptionCard s={reference} label={t('hero.today')} tone="ref" />
          {shown !== reference ? (
            <OptionCard
              s={shown}
              label={alts.indexOf(shown) === 0 ? t('hero.best') : t('hero.alt', { n: alts.indexOf(shown) + 1 })}
              tone="alt"
              delta={Math.round(shown.overall) - Math.round(reference.overall)}
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-[#DECFA7] p-5 text-sm">{t('cmp.none')}</div>
          )}
        </div>
        {alts.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-[#283618]">{t('hero.others')}</span>
            {alts.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s === shown}
                onClick={() => setSelectedId(s.id)}
                className={`rounded-full border px-3 min-h-[40px] font-bold focus-visible:outline-2 focus-visible:outline-[#BC6C25] ${
                  s === shown ? 'border-[#283618] bg-[#E3EBDD] text-[#283618]' : 'border-[#DECFA7] bg-white text-[#3B2F20] hover:border-[#A3B18A]'
                }`}
              >
                {i === 0 ? t('hero.bestShort') : t('hero.alt', { n: i + 1 })} · {Math.round(s.overall)}
              </button>
            ))}
          </div>
        )}
        {shown !== reference && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#E3EBDD] border border-[#A3B18A] p-5">
              <h3 className="font-bold text-[#283618]">{t('hero.why')}</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-[#283618]">
                {why.length ? why.map((x, i) => <li key={i}>{x}</li>) : <li>—</li>}
              </ul>
            </div>
            <div className="rounded-2xl bg-[#FBE9D0] border border-[#DDA15E] p-5">
              <h3 className="font-bold text-[#5C3209]">{t('hero.watch')}</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-[#5C3209]">
                {watch.length ? watch.map((x, i) => <li key={i}>{x}</li>) : <li>—</li>}
              </ul>
            </div>
          </div>
        )}
        <p className="text-xs text-[#3B2F20]/85">{t('cmp.indexNote')}</p>
      </section>

      {/* 3b. Heat and water alerts from the real record */}
      <section aria-labelledby="risk-h" className="space-y-4">
        <div>
          <h2 id="risk-h" className="text-xl sm:text-2xl font-bold text-[#283618]">
            {t('risk.title')}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-[#3B2F20]">{t('risk.help')}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 items-start">
          <Card className="min-w-0 space-y-4" as="div">
            <SectionTitle sub={t('heat.help')}>{t('heat.title')}</SectionTitle>
            <FloweringHeatList items={heatRef} title={t('hero.today')} />
            {shown !== reference && <FloweringHeatList items={heatOpt} title={optLabel} />}
            <p className="text-xs text-[#3B2F20]/85">{t('heat.note')}</p>
          </Card>
          <Card className="min-w-0 space-y-4" as="div">
            <SectionTitle sub={t('water.sowHelp')}>{t('water.sowTitle')}</SectionTitle>
            <SowingWaterList balance={waterRef} label={t('hero.today')} strategy={reference} />
            {waterOpt && <SowingWaterList balance={waterOpt} label={optLabel} strategy={shown} />}
          </Card>
        </div>
        <Card className="min-w-0" as="div">
          <SectionTitle sub={t('water.help')}>{t('water.title')}</SectionTitle>
          <SoilWaterChart reference={waterRef} option={waterOpt} refStrategy={reference} optStrategy={shown !== reference ? shown : null} refLabel={t('hero.today')} optLabel={optLabel} />
        </Card>
        {south && (
          <Collapsible title={t('enso.tableTitle')}>
            <EnsoTable summaries={phases} />
          </Collapsible>
        )}
      </section>

      {/* 4. The field, month by month */}
      <section aria-labelledby="scene-h" className="space-y-4">
        <h2 id="scene-h" className="text-xl sm:text-2xl font-bold text-[#283618]">
          {t('scene.title')}
        </h2>
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <Card className="min-w-0 lg:col-span-5" as="div">
            <FieldScene strategy={shown} month={month} setMonth={setMonth} />
          </Card>
          <Card className="min-w-0 lg:col-span-7" as="div">
            <SectionTitle sub={t('cal.help')}>{t('cal.title')}</SectionTitle>
            <RotationCalendar
              strategies={strategies}
              selectedId={shown.id}
              month={month}
              onSelect={(id, mm) => {
                if (id !== reference.id) setSelectedId(id);
                if (mm !== undefined) setMonth(mm);
              }}
            />
          </Card>
        </div>
      </section>

      {/* 5. Before sowing: what to check, and the drone flight that checks it */}
      <section aria-labelledby="verify-h" className="space-y-4">
        <h2 id="verify-h" className="text-xl sm:text-2xl font-bold text-[#283618]">
          {t('verify.titleShort')}
        </h2>
        <p className="max-w-3xl text-sm text-[#3B2F20]">{t('verify.help')}</p>
        <div className="grid gap-5 xl:grid-cols-2 items-start">
          <Card className="min-w-0" as="div">
            <VerificationPanel strategy={shown} onPickMonth={setMonth} />
          </Card>
          <Suspense fallback={null}>
            {farmCase.lotPolygon ? (
              <DroneRequestPanel farmCase={farmCase} checks={checks} />
            ) : (
              <div className="rounded-xl border border-[#DECFA7] bg-[#FEFAE0] p-4 text-sm">
                <p className="font-bold text-[#283618]">{t('req.title')}</p>
                <p className="mt-1">{t('req.needLot')}</p>
                <button type="button" className={`${secondaryBtn} mt-3`} onClick={() => onEdit('lot')}>
                  {t('decision.lot')} <ArrowRight aria-hidden className="h-4 w-4" />
                </button>
              </div>
            )}
          </Suspense>
        </div>
      </section>

      {/* 6. Everything behind the result, folded */}
      <section aria-labelledby="behind-h" className="space-y-3">
        <h2 id="behind-h" className="text-xl sm:text-2xl font-bold text-[#283618]">
          {t('behind.title')}
        </h2>
        {assumptions.length > 0 && <AssumptionList keys={assumptions} />}
        <Collapsible title={t('behind.option')}>
          <StrategyPanel strategy={shown} reference={reference} altIndex={Math.max(1, alts.indexOf(shown) + 1)} farm={farm} />
        </Collapsible>
        <Collapsible title={t('clim.title')}>
          <p className="mb-3 text-sm text-[#3B2F20]/90">{t('clim.help')}</p>
          <ClimatePanel profile={recordProfile ?? profile} from={from} to={to} />
        </Collapsible>
        <Collapsible title={t('behind.fine')}>
          <SensitivityPanel scenario={scenario} onChange={(sc) => setCustom(sc.precipPct === 0 && sc.tempC === 0 ? null : sc)} />
        </Collapsible>
        {outcome.discarded.length > 0 && (
          <Collapsible title={`${t('disc.title')} (${outcome.discarded.length})`} defaultOpen={alts.length < 3}>
            <DiscardedList items={outcome.discarded} />
          </Collapsible>
        )}
        <Collapsible title={t('gaps.title')}>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {GLOBAL_GAPS.map((g) => (
              <li key={g.key}>{m(g)}</li>
            ))}
          </ul>
        </Collapsible>
        <Collapsible title={t('sources.title')}>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {['source.power', 'source.srtm', 'source.soilgrids', 'source.oni', 'source.gibs', 'source.fao'].map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </Collapsible>
        <div className="rounded-2xl border border-[#DECFA7] bg-white/60">
          <button
            type="button"
            aria-expanded={toolsOpen}
            onClick={() => setToolsOpen(!toolsOpen)}
            className="w-full flex items-center justify-between px-5 py-4 text-left font-bold text-[#283618] focus-visible:outline-2 focus-visible:outline-[#BC6C25] rounded-2xl"
          >
            {t('behind.tools')}
            <span aria-hidden>{toolsOpen ? '−' : '+'}</span>
          </button>
          {toolsOpen && (
            <div className="px-5 pb-5 space-y-5">
              <p className="text-sm text-[#3B2F20]/90">{t('behind.toolsHelp')}</p>
              <Suspense
                fallback={
                  <p role="status" className="flex items-center gap-2 text-sm">
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> {t('lot.loadingMap')}
                  </p>
                }
              >
                {farmCase.lotPolygon && <TerrainCard farmCase={farmCase} lot={lot} />}
                <LotImagery lat={farmCase.lat} lon={farmCase.lon} polygon={farmCase.lotPolygon} source={farmCase.lotSource} onLot={onLot} strategy={shown} />
              </Suspense>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
