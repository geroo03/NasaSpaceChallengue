import { lazy, Suspense, useState } from 'react';
import { ArrowRight, Crosshair, Loader2, MapPin, PenLine, Sparkles } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { EXAMPLE_LOT, PLACE_PRESETS, type FarmCase, type Slope, type SoilTexture } from '../../case/model';
import type { LotApi } from '../../case/lotApi';
import { ChoiceCard, Collapsible, Notice, ProvTag, primaryBtn, secondaryBtn } from '../ui';
import { SoilCard } from '../lot/SoilCard';
import { MyLots } from '../lot/MyLots';
import { ScreenGuide } from '../guide/Guide';
import { DemoBanner } from '../DemoLock';
import { useProfile } from '../../profile/ProfileContext';
import { openRemoteLot, rememberLot } from '../../backend/cloudLog';
import { currentSession } from '../../backend/supabase';
import type { RemoteLot } from '../../backend/api';

// Lot editor, importers and terrain tools load only when this step shows them.
// The point-mode map (Leaflet) loads only when someone chooses "just a point".
const MapPicker = lazy(() => import('./MapPicker').then((m) => ({ default: m.MapPicker })));
const LotStep = lazy(() => import('../lot/LotStep').then((m) => ({ default: m.LotStep })));

/** The farmer answered the slope (older saved cases have no source but a concrete answer). */
export function slopeDeclared(c: FarmCase): boolean {
  return c.slopeSource === 'declared' || (c.slopeSource === null && c.slope !== 'unknown');
}

export function coordsValid(c: FarmCase): boolean {
  return Number.isFinite(c.lat) && Number.isFinite(c.lon) && c.lat >= -60 && c.lat <= 75 && c.lon >= -180 && c.lon <= 180;
}

/** Screen 1: the lot (drawn, imported or the demo example) or, failing that, a point. */
export function LotScreen({ value, onChange, lot, onNext }: { value: FarmCase; onChange: (patch: Partial<FarmCase>) => void; lot: LotApi; onNext: () => void }) {
  const { t } = useLang();
  const slopes: Slope[] = ['flat', 'gentle', 'steep', 'unknown'];
  const soils: SoilTexture[] = ['sandy', 'loam', 'clay', 'unknown'];
  const [mode, setMode] = useState<'lot' | 'point'>('lot');
  const isExample = value.lotSource?.kind === 'example';
  const { email, demo } = useProfile();
  const [openedId, setOpenedId] = useState<string | null>(null);
  const openSaved = (remote: RemoteLot) => {
    const { ring, source, soilPawDeclaredMm } = openRemoteLot(remote);
    setMode('lot');
    lot.setLot(ring, source, true);
    if (soilPawDeclaredMm !== null) onChange({ soilPawDeclaredMm });
    setOpenedId(remote.id);
    void currentSession().then((s) => s && rememberLot(s.user.id, ring, remote.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <div className="fs-enter max-w-5xl mx-auto space-y-5">
      <header>
        <h1 className="headline-display headline-display--bold text-3xl sm:text-4xl text-[#283618]">{t('loc.q')}</h1>
        <p className="mt-2 text-[#3B2F20]/90">{t(demo ? 'loc.helpDemo' : 'loc.help')}</p>
      </header>
      {demo && <DemoBanner />}
      <ScreenGuide id="lot" steps={4} video="lote" />
      {email && <MyLots onOpen={openSaved} activeId={openedId} />}
      {!isExample && !demo && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border-2 border-dashed border-[#DDA15E] bg-[#FEFAE0] p-4">
          <Sparkles aria-hidden className="h-6 w-6 shrink-0 text-[#BC6C25]" />
          <p className="flex-1 text-sm text-[#3B2F20]">
            <strong className="block text-[#283618]">{t('example.title')}</strong>
            {t('example.help')}
          </p>
          <button
            type="button"
            className={secondaryBtn}
            onClick={() => {
              setMode('lot');
              lot.setLot(EXAMPLE_LOT, { kind: 'example' }, true);
            }}
          >
            {t('example.load')}
          </button>
        </div>
      )}
      {isExample && <Notice>{t('example.loaded')}</Notice>}
      {!demo && <div role="radiogroup" aria-label={t('loc.mode.label')} className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard
          selected={mode === 'lot'}
          onSelect={() => setMode('lot')}
          icon={<PenLine aria-hidden className="h-5 w-5" />}
          title={t('loc.mode.lot')}
          description={t('loc.mode.lot.d')}
        />
        <ChoiceCard
          selected={mode === 'point'}
          onSelect={() => setMode('point')}
          icon={<Crosshair aria-hidden className="h-5 w-5" />}
          title={t('loc.mode.point')}
          description={t('loc.mode.point.d')}
        />
      </div>}

      {mode === 'lot' || demo ? (
        <Suspense
          fallback={
            <p role="status" className="flex items-center gap-2 text-sm">
              <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> {t('start.loading')}
            </p>
          }
        >
          <LotStep farmCase={value} lot={lot} readOnly={demo} />
        </Suspense>
      ) : (
      <>
      <div role="radiogroup" aria-label={t('loc.q')} className="grid gap-3 sm:grid-cols-2">
        {PLACE_PRESETS.map((p) => (
          <ChoiceCard
            key={p.id}
            selected={value.placeId === p.id}
            onSelect={() => onChange({ placeId: p.id, lat: p.lat, lon: p.lon, lotPolygon: null, lotSource: null })}
            icon={<MapPin aria-hidden className="h-5 w-5" />}
            title={t(`loc.place.${p.id}`)}
            description={t(`loc.place.${p.id}.note`)}
          />
        ))}
      </div>

      {value.lotPolygon && (
        <Notice>
          {t('lot.centroidNote')}{' '}
          <button type="button" className="font-bold underline" onClick={() => onChange({ lotPolygon: null, lotSource: null })}>
            {t('lot.clear')}
          </button>
        </Notice>
      )}
      <Suspense fallback={<div className="h-64 sm:h-80 w-full rounded-xl border border-[#DECFA7] bg-[#E3EBDD]" aria-hidden />}>
        <MapPicker
          lat={value.lat}
          lon={value.lon}
          label={t('loc.map')}
          onPick={(lat, lon) => (value.lotPolygon ? undefined : onChange({ lat, lon, placeId: null }))}
        />
      </Suspense>
      <p className="text-sm text-[#3B2F20]/85">
        {value.placeId === null && <strong className="text-[#283618]">{t('loc.place.custom')} · </strong>}
        {Number.isFinite(value.lat) ? value.lat.toFixed(4) : '—'}, {Number.isFinite(value.lon) ? value.lon.toFixed(4) : '—'} — {t('loc.pointNote')}
      </p>
      </>
      )}

      <SoilCard farmCase={value} lot={lot} onChange={onChange} />

      {!demo && <Collapsible title={t('loc.details')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <label className="block">
            <span className="block text-xs font-bold mb-1">{t('loc.lat')}</span>
            <input
              type="number"
              step="0.0001"
              min={-60}
              max={75}
              value={Number.isFinite(value.lat) ? value.lat : ''}
              readOnly={value.lotPolygon !== null}
              onChange={(e) => onChange({ lat: Number.parseFloat(e.target.value), placeId: null })}
              className="w-full rounded-lg border border-[#DECFA7] bg-white px-3 py-2 tabular-nums"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-bold mb-1">{t('loc.lon')}</span>
            <input
              type="number"
              step="0.0001"
              min={-180}
              max={180}
              value={Number.isFinite(value.lon) ? value.lon : ''}
              readOnly={value.lotPolygon !== null}
              onChange={(e) => onChange({ lon: Number.parseFloat(e.target.value), placeId: null })}
              className="w-full rounded-lg border border-[#DECFA7] bg-white px-3 py-2 tabular-nums"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-bold mb-1">{t('loc.years')}</span>
            <input
              type="number"
              min={5}
              max={30}
              value={value.years}
              onChange={(e) => onChange({ years: Math.min(30, Math.max(5, Math.round(Number(e.target.value) || 15))) })}
              className="w-full rounded-lg border border-[#DECFA7] bg-white px-3 py-2 tabular-nums"
            />
          </label>
        </div>
      </Collapsible>}
      {!coordsValid(value) && <Notice tone="error">{t('loc.invalid')}</Notice>}

      <Collapsible title={t('loc.terrain')}>
        <fieldset className="mt-1">
          <legend className="font-bold text-[#283618] mb-2 flex flex-wrap items-center gap-2">
            {t('loc.slope')}
            {value.slopeSource === 'srtm' && <ProvTag kind="source" />}
            {value.slopeSource === 'drone' && <ProvTag kind="measured" />}
          </legend>
          <div className="flex flex-wrap gap-2">
            {slopes.map((s) => (
              <Pill key={s} selected={slopeDeclared(value) ? value.slope === s : s === 'unknown'} onClick={() => lot.setSlope(s)}>
                {s === 'unknown' && value.terrain && !slopeDeclared(value) && value.slope !== 'unknown'
                  ? t('slope.unknownTerrain', { cls: t(`slope.${value.slope}`) })
                  : t(`slope.${s}`)}
              </Pill>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="font-bold text-[#283618] mb-2">{t('loc.soil')}</legend>
          <div className="flex flex-wrap gap-2">
            {soils.map((s) => (
              <Pill key={s} selected={value.soilTexture === s} onClick={() => onChange({ soilTexture: s })}>
                {t(`soil.${s}`)}
              </Pill>
            ))}
          </div>
          <p className="mt-2 text-xs text-[#3B2F20]/85">{t('loc.soilNote')}</p>
        </fieldset>
      </Collapsible>
      <div className="flex justify-end sm:pt-6 sticky bottom-0 z-[1050] -mx-4 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-[#f0ede4]/95 backdrop-blur-sm border-t border-[#DECFA7] sm:static sm:mx-0 sm:px-0 sm:pb-0 sm:bg-transparent sm:backdrop-blur-none">
        <button type="button" className={primaryBtn} disabled={!coordsValid(value)} onClick={onNext}>
          {t('flow.toFarm')} <ArrowRight aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Pill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 min-h-[44px] text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25] ${
        selected ? 'border-[#283618] bg-[#283618] text-[#FEFAE0]' : 'border-[#DECFA7] bg-white text-[#3B2F20] hover:border-[#A3B18A]'
      }`}
    >
      {children}
    </button>
  );
}
