import { CalendarCheck, Droplets, Layers, ScanSearch, Sprout } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import type { StrategyResult } from '../../engine/domain/rotations';
import { planFieldChecks, type CheckKind } from '../../case/verification';
import { ProvTag } from '../ui';

const ICON: Record<CheckKind, typeof Sprout> = { preSowing: Sprout, peakStress: Droplets, residue: Layers, coverEnd: CalendarCheck };

/** What to verify in the field, and when, for the selected strategy. AgroField plans; a visit or a drone flight confirms. */
export function VerificationPanel({ strategy, onPickMonth }: { strategy: StrategyResult; onPickMonth: (m: number) => void }) {
  const { t, months, crop } = useLang();
  const checks = planFieldChecks(strategy);
  const when = (i: number) => {
    const c = strategy.timeline[i];
    return `${c ? (months[c.calendarMonth - 1] ?? '') : ''} · ${t('scene.year', { n: i < 12 ? 1 : 2 })}`;
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ProvTag kind="modeled" />
        <span className="text-xs text-[#3B2F20]/85">{t('verify.basis')}</span>
      </div>
      <ol className="space-y-2.5">
        {checks.map((c, i) => {
          const Icon = ICON[c.kind];
          const period = c.untilMonth !== undefined && c.untilMonth !== c.month ? `${when(c.month)} → ${when(c.untilMonth)}` : when(c.month);
          return (
            <li key={`${c.kind}-${i}`} className="flex gap-3 rounded-xl border border-[#DECFA7] bg-[#FEFAE0] p-3">
              <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#606C38]" />
              <div className="flex-1 text-sm">
                <button
                  type="button"
                  onClick={() => onPickMonth(c.month)}
                  className="font-bold text-[#9A5518] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#BC6C25] rounded"
                >
                  {period}
                </button>
                <p className="mt-0.5 text-[#3B2F20]">
                  {t(`verify.${c.kind}`, { crop: c.crop ? crop(c.crop) : '', deficit: c.deficitPct ?? 0 })}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="rounded-xl border-2 border-[#A3B18A] bg-[#E3EBDD] p-4 text-sm">
        <p className="flex items-center gap-2 font-bold text-[#283618]">
          <ScanSearch aria-hidden className="h-5 w-5" /> {t('verify.partnerTitle')}
        </p>
        <p className="mt-1 text-[#283618]">{t('verify.partnerText')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ProvTag kind="declared" />
          <span className="text-xs text-[#3B2F20]/85">{t('verify.partnerSource')}</span>
        </div>
      </div>
    </div>
  );
}
