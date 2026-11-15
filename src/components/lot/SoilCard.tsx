import { Loader2, RefreshCw } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import type { FarmCase } from '../../case/model';
import type { LotApi } from '../../case/lotApi';
import { DEFAULT_PAW_MM } from '../../engine/domain/rotations';
import { Notice, ProvTag, linkBtn } from '../ui';

/** "Suelo del lote": SoilGrids texture, organic carbon and plant-available water, and what the calculation uses. */
export function SoilCard({ farmCase, lot, onChange }: { farmCase: FarmCase; lot: LotApi; onChange: (patch: Partial<FarmCase>) => void }) {
  const { t, num } = useLang();
  const s = farmCase.soil;
  const here = s !== null && Math.abs(s.lat - farmCase.lat) < 1e-4 && Math.abs(s.lon - farmCase.lon) < 1e-4 ? s : null;
  const declared = farmCase.soilPawDeclaredMm;
  const used = declared ?? (here ? Math.round(here.pawMm) : DEFAULT_PAW_MM);
  const maxLayer = here ? Math.max(...here.layers.map((l) => ((l.fcPct - l.wpPct) / 100) * l.thicknessMm), 1) : 1;

  return (
    <section aria-labelledby="soil-h" className="rounded-xl border-2 border-[#A3B18A] bg-[#F4F1E6] p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="soil-h" className="text-lg font-bold text-[#283618]">
          {t(farmCase.lotPolygon ? 'soil.title' : 'soil.titlePoint')}
        </h2>
        {here && <ProvTag kind="modeled" />}
      </div>

      {!here && lot.soilStatus === 'loading' && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> {t('soil.loading')}
        </p>
      )}
      {!here && lot.soilStatus === 'noData' && <Notice tone="warn">{t('soil.noData')}</Notice>}
      {!here && lot.soilStatus === 'error' && (
        <Notice tone="error">
          {t('soil.error')}{' '}
          <button type="button" className={linkBtn} onClick={lot.retrySoil}>
            <RefreshCw aria-hidden className="inline h-3.5 w-3.5" /> {t('terrain.retry')}
          </button>
        </Notice>
      )}

      {here && (
        <>
          <dl className="grid gap-2 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-lg bg-white border border-[#DECFA7] px-3 py-2">
              <dt className="text-xs font-bold text-[#3B2F20]/85">{t('soil.texture')}</dt>
              <dd className="mt-0.5 text-lg font-bold text-[#283618]">{t(`soil.${here.texture}`)}</dd>
              <dd className="text-[11px] text-[#3B2F20]/80">
                {t('soil.fractions', { sand: num(here.sandPct), silt: num(here.siltPct), clay: num(here.clayPct) })}
              </dd>
            </div>
            <div className="rounded-lg bg-white border border-[#DECFA7] px-3 py-2">
              <dt className="text-xs font-bold text-[#3B2F20]/85">{t('soil.om')}</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums text-[#283618]">≈ {num((here.socGkg * 1.724) / 10, 1)} %</dd>
              <dd className="text-[11px] text-[#3B2F20]/80">{t('soil.omNote', { soc: num(here.socGkg, 1) })}</dd>
            </div>
            <div className="rounded-lg bg-white border border-[#DECFA7] px-3 py-2">
              <dt className="text-xs font-bold text-[#3B2F20]/85">{t('soil.paw')}</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums text-[#283618]">{num(here.pawMm)} mm</dd>
              <dd className="text-[11px] text-[#3B2F20]/80">{t('soil.pawNote')}</dd>
            </div>
          </dl>

          <figure>
            <figcaption className="text-xs font-bold text-[#3B2F20]/85">{t('soil.profile')}</figcaption>
            <ul className="mt-1 space-y-1">
              {here.layers.map((l) => {
                const mm = ((l.fcPct - l.wpPct) / 100) * l.thicknessMm;
                return (
                  <li key={l.depth} className="grid grid-cols-[70px_minmax(0,1fr)_56px] items-center gap-2 text-xs">
                    <span className="tabular-nums">{l.depth.replace('cm', ' cm')}</span>
                    <span className="h-3 rounded-sm bg-[#EFE3C2]" aria-hidden>
                      <span className="block h-3 rounded-sm bg-[#606C38]" style={{ width: `${Math.round((mm / maxLayer) * 100)}%` }} />
                    </span>
                    <span className="text-right tabular-nums">{num(mm, 1)} mm</span>
                  </li>
                );
              })}
            </ul>
          </figure>
          <p className="text-xs text-[#3B2F20]/90">{t('soil.caveat', { date: here.retrievedOn })}</p>
          {farmCase.soilTexture !== 'unknown' && farmCase.soilTexture !== here.texture && (
            <Notice tone="warn">{t('soil.differs', { declared: t(`soil.${farmCase.soilTexture}`), map: t(`soil.${here.texture}`) })}</Notice>
          )}
        </>
      )}

      <p className="text-sm text-[#283618]">
        <strong>{t(declared !== null ? 'soil.usedTest' : here ? 'soil.usedMap' : 'soil.usedDefault', { mm: num(used), def: DEFAULT_PAW_MM })}</strong>
      </p>

      <div className="border-t border-[#DECFA7] pt-3">
        <label className="block text-sm font-bold text-[#283618]" htmlFor="soil-test">
          {t('soil.testQ')}
        </label>
        <p className="text-xs text-[#3B2F20]/85">{t('soil.testHelp')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            id="soil-test"
            type="number"
            min={0}
            max={400}
            step={5}
            value={declared ?? ''}
            placeholder={here ? String(Math.round(here.pawMm)) : String(DEFAULT_PAW_MM)}
            onChange={(e) => onChange({ soilPawDeclaredMm: e.target.value === '' ? null : Math.max(0, Math.min(400, Number(e.target.value) || 0)) })}
            className="w-28 rounded-lg border border-[#DECFA7] bg-white px-3 py-2 tabular-nums"
          />
          <span className="text-sm">{t('soil.testUnit')}</span>
          {declared !== null && (
            <button type="button" className={linkBtn} onClick={() => onChange({ soilPawDeclaredMm: null })}>
              {t('soil.testClear')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
