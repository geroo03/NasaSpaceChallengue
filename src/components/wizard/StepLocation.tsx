import { lazy, Suspense, useState } from 'react';
import { Crosshair, Loader2, MapPin, PenLine } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { PLACE_PRESETS, type FarmCase, type Slope, type SoilTexture } from '../../case/model';
import type { LotApi } from '../../case/lotApi';
import { ChoiceCard, Collapsible, Notice, ProvTag } from '../ui';
import { MapPicker } from './MapPicker';

// Lot editor, importers and terrain tools load only when this step shows them.
const LotStep = lazy(() => import('../lot/LotStep').then((m) => ({ default: m.LotStep })));

/** The farmer answered the slope (older saved cases have no source but a concrete answer). */
export function slopeDeclared(c: FarmCase): boolean {
  return c.slopeSource === 'declared' || (c.slopeSource === null && c.slope !== 'unknown');
}

export function coordsValid(c: FarmCase): boolean {
  return Number.isFinite(c.lat) && Number.isFinite(c.lon) && c.lat >= -60 && c.lat <= 75 && c.lon >= -180 && c.lon <= 180;
}

export function StepLocation({ value, onChange, lot }: { value: FarmCase; onChange: (patch: Partial<FarmCase>) => void; lot: LotApi }) {
  const { t } = useLang();
  const slopes: Slope[] = ['flat', 'gentle', 'steep', 'unknown'];
  const soils: SoilTexture[] = ['sandy', 'loam', 'clay', 'unknown'];
  const [mode, setMode] = useState<'lot' | 'point'>('lot');
  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label={t('loc.mode.label')} className="grid gap-3 sm:grid-cols-2">
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
      </div>

      {mode === 'lot' ? (
        <Suspense
          fallback={
            <p role="status" className="flex items-center gap-2 text-sm">
              <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> {t('start.loading')}
            </p>
          }
        >
          <LotStep farmCase={value} lot={lot} />
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
      <MapPicker
        lat={value.lat}
        lon={value.lon}
        label={t('loc.map')}
        onPick={(lat, lon) => (value.lotPolygon ? undefined : onChange({ lat, lon, placeId: null }))}
      />
      <p className="text-sm text-[#3B2F20]/85">
        {value.placeId === null && <strong className="text-[#283618]">{t('loc.place.custom')} · </strong>}
        {Number.isFinite(value.lat) ? value.lat.toFixed(4) : '—'}, {Number.isFinite(value.lon) ? value.lon.toFixed(4) : '—'} — {t('loc.pointNote')}
      </p>
      </>
      )}

      <Collapsible title={t('loc.details')}>
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
      </Collapsible>
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
