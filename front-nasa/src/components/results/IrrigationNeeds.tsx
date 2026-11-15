import { Droplets } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { irrigationNeeds } from '../../case/irrigation';
import type { FarmCase } from '../../case/model';
import type { StrategyResult } from '../../engine/domain/rotations';
import { Notice } from '../ui';

function Table({ s, label, effectiveMm }: { s: StrategyResult; label: string; effectiveMm: number }) {
  const { t, num, crop, months } = useLang();
  const rows = irrigationNeeds(s, effectiveMm);
  return (
    <div className="min-w-0">
      <p className="text-sm font-bold text-[#283618]">{label}</p>
      <div className="mt-1.5 overflow-x-auto rounded-xl border border-[#DECFA7] bg-white">
        <table className="w-full min-w-[480px] text-sm tabular-nums">
          <thead>
            <tr className="text-left text-xs text-[#3B2F20]/80">
              <th className="px-3 py-2 font-bold">{t('irr.col.crop')}</th>
              <th className="px-3 py-2 font-bold text-right">{t('irr.col.gap')}</th>
              <th className="px-3 py-2 font-bold text-right">{t('irr.drip')}</th>
              <th className="px-3 py-2 font-bold text-right">{t('irr.sprinkler')}</th>
              <th className="px-3 py-2 font-bold text-right">{t('irr.surface')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.crop}-${r.index}`} className="border-t border-[#EFE3C2]">
                <th scope="row" className="px-3 py-2 text-left font-bold text-[#283618]">
                  {crop(r.crop)}
                  <span className="block text-[11px] font-normal text-[#3B2F20]/80">
                    {t('water.sowIn', { month: months[(s.timeline[r.index]?.calendarMonth ?? 1) - 1] ?? '', year: r.index < 12 ? 1 : 2 })}
                  </span>
                </th>
                <td className="px-3 py-2 text-right">{r.gapMm > 0 ? `${num(r.gapMm)} mm` : t('irr.noGap')}</td>
                <td className="px-3 py-2 text-right font-bold text-[#283618]">{r.gapMm > 0 ? `${num(r.applied.drip)} mm` : '—'}</td>
                <td className="px-3 py-2 text-right">{r.gapMm > 0 ? `${num(r.applied.sprinkler)} mm` : '—'}</td>
                <td className="px-3 py-2 text-right">{r.gapMm > 0 ? `${num(r.applied.surface)} mm` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** How much water each irrigation system must apply to close each crop's rainfed gap (season averages). */
export function IrrigationNeeds({ farmCase, reference, option, optLabel, effectiveMm }: { farmCase: FarmCase; reference: StrategyResult; option: StrategyResult | null; optLabel: string; effectiveMm: number }) {
  const { t } = useLang();
  const surfaceOnFlat = (farmCase.irrigationSystem ?? 'unknown') === 'surface' && farmCase.slope === 'flat';
  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 text-sm text-[#3B2F20]">
        <Droplets aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#2F7BB8]" /> {t('irr.help')}
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        <Table s={reference} label={t('hero.today')} effectiveMm={effectiveMm} />
        {option && <Table s={option} label={optLabel} effectiveMm={effectiveMm} />}
      </div>
      {surfaceOnFlat && <Notice tone="warn">{t('irr.flood')}</Notice>}
      <p className="text-xs text-[#3B2F20]/85">{t('irr.note')}</p>
    </div>
  );
}
