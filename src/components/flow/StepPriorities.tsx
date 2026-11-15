import { CloudSun, Droplets, Bug, Layers, Sprout, Store, type LucideIcon } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { GOALS, prioritiesFromGoals, type FarmCase, type Goal } from '../../case/model';
import { DIMENSIONS } from '../../engine/domain/rotations';
import { ChoiceCard, Collapsible } from '../ui';

const ICONS: Record<Goal, LucideIcon> = { water: Droplets, cover: Layers, climate: CloudSun, soil: Sprout, income: Store, pests: Bug };

export function StepPriorities({ value, onChange }: { value: FarmCase; onChange: (patch: Partial<FarmCase>) => void }) {
  const { t } = useLang();
  const toggle = (g: Goal) => {
    const goals = value.goals.includes(g) ? value.goals.filter((x) => x !== g) : [...value.goals, g];
    onChange({ goals, priorities: prioritiesFromGoals(goals), customPriorities: false });
  };
  return (
    <div className="space-y-5">
      <div role="group" aria-label={t('prio.q')} className="grid gap-3 sm:grid-cols-2">
        {GOALS.map((g) => {
          const Icon = ICONS[g];
          return (
            <ChoiceCard
              key={g}
              role="checkbox"
              selected={value.goals.includes(g)}
              onSelect={() => toggle(g)}
              icon={<Icon aria-hidden className="h-5 w-5" />}
              title={t(`goal.${g}`)}
              description={t(`goal.${g}.d`)}
            />
          );
        })}
      </div>
      <Collapsible title={t('prio.fine')}>
        <p className="mb-3 text-xs text-[#3B2F20]/85">{t('prio.fineNote')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIMENSIONS.map((d) => (
            <label key={d} className="block">
              <span className="flex justify-between text-sm font-bold">
                <span>{t(`dim.${d}`)}</span>
                <output className="tabular-nums">{value.priorities[d]}</output>
              </span>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={value.priorities[d]}
                onChange={(e) => onChange({ priorities: { ...value.priorities, [d]: Number(e.target.value) }, customPriorities: true })}
                className="w-full accent-[#BC6C25]"
              />
            </label>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}
