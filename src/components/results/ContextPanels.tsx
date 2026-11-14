import { RotateCcw } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import type { Scenario } from '../../engine/analysis/climate';
import type { DiscardedStrategy } from '../../engine/domain/rotations';
import { Notice, ProvTag, secondaryBtn } from '../ui';

export function SensitivityPanel({ scenario, onChange }: { scenario: Scenario; onChange: (s: Scenario) => void }) {
  const { t, num } = useLang();
  const isBase = scenario.precipPct === 0 && scenario.tempC === 0;
  return (
    <div className="space-y-4">
      <p className="inline-flex rounded-lg bg-[#FBE9D0] border border-[#DDA15E] px-3 py-1.5 text-sm font-bold text-[#5C3209]">{t('sens.label')}</p>
      <p className="text-sm text-[#3B2F20]/90">{t('sens.help')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="flex justify-between text-sm font-bold">
            <span>{t('sens.precip')}</span>
            <output className="tabular-nums">
              {scenario.precipPct > 0 ? '+' : ''}
              {scenario.precipPct} %
            </output>
          </span>
          <input
            type="range"
            min={-40}
            max={40}
            step={5}
            value={scenario.precipPct}
            onChange={(e) => onChange({ ...scenario, precipPct: Number(e.target.value) })}
            className="w-full accent-[#BC6C25]"
          />
        </label>
        <label className="block">
          <span className="flex justify-between text-sm font-bold">
            <span>{t('sens.temp')}</span>
            <output className="tabular-nums">
              {scenario.tempC > 0 ? '+' : scenario.tempC < 0 ? '−' : ''}
              {num(Math.abs(scenario.tempC), 1)} °C
            </output>
          </span>
          <input
            type="range"
            min={-1}
            max={4}
            step={0.5}
            value={scenario.tempC}
            onChange={(e) => onChange({ ...scenario, tempC: Number(e.target.value) })}
            className="w-full accent-[#BC6C25]"
          />
        </label>
      </div>
      <button type="button" className={secondaryBtn} disabled={isBase} onClick={() => onChange({ precipPct: 0, tempC: 0 })}>
        <RotateCcw aria-hidden className="h-4 w-4" /> {t('sens.reset')}
      </button>
    </div>
  );
}

export function DiscardedList({ items }: { items: DiscardedStrategy[] }) {
  const { t, m, num } = useLang();
  if (!items.length) return null;
  const order = { unsuitable: 0, noSchedule: 1, outranked: 2 } as const;
  return (
    <ul className="space-y-2">
      {[...items]
        .sort((a, b) => order[a.reason] - order[b.reason])
        .map((d) => (
          <li key={d.templateId} className="rounded-xl border border-[#DECFA7] bg-[#FEFAE0] p-3 text-sm">
            <p className="font-bold text-[#283618]">{t(`template.${d.templateId}`)}</p>
            {d.reason === 'noSchedule' && <p>{t('disc.noSchedule')}</p>}
            {d.reason === 'outranked' && <p>{t('disc.outranked', { v: num(d.overall ?? 0) })}</p>}
            {d.reason === 'unsuitable' && (
              <>
                <p>{t('disc.unsuitable')}</p>
                <ul className="list-disc pl-5">
                  {d.messages.map((x, i) => (
                    <li key={i}>{m(x)}</li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
    </ul>
  );
}

export function AssumptionList({ keys }: { keys: string[] }) {
  const { t } = useLang();
  if (!keys.length) return null;
  return (
    <Notice tone="warn">
      <strong className="block mb-1">{t('res.assumptions')}</strong>
      <ul className="list-disc pl-5 space-y-0.5">
        {keys.map((a) => (
          <li key={a}>{t(`assume.${a}`)}</li>
        ))}
      </ul>
    </Notice>
  );
}
