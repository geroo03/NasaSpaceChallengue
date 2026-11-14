import { ArrowUpRight, MapPinned, Shovel, Tractor } from 'lucide-react';
import { RESOURCES, type FarmCase } from '../../case/model';
import { useLang } from '../../i18n/LangContext';

/** Follow-up actions reflect declarations, never an invented agronomic readiness score. */
export function DecisionChecklist({ farmCase, onLot, onEdit }: { farmCase: FarmCase; onLot: () => void; onEdit: (step?: number) => void }) {
  const { t } = useLang();
  const pending = RESOURCES.filter((r) => farmCase.resources[r] === 'unknown' ||
    (['shared', 'contracted'].includes(farmCase.resources[r]) && farmCase.availability[r] === 'pending')).length;
  const actions = [
    { id: 'lot', icon: MapPinned, note: t(farmCase.lotPolygon ? 'decision.lotReady' : 'decision.lotMissing'), run: onLot },
    { id: 'resources', icon: Tractor, note: t(pending ? 'decision.resourcesPending' : 'decision.resourcesDeclared', { n: pending }), run: () => onEdit(2) },
    { id: 'soil', icon: Shovel, note: t(farmCase.soilTexture === 'unknown' ? 'decision.soilMissing' : 'decision.soilDeclared'), run: () => onEdit(0) },
  ];
  return (
    <section aria-labelledby="decision-checklist-title" className="rounded-2xl border border-[#A3B18A] bg-[#E3EBDD]/60 p-5 sm:p-6">
      <h2 id="decision-checklist-title" className="text-xl font-bold text-[#283618]">{t('decision.title')}</h2>
      <p className="mt-1 text-sm text-[#3B2F20]">{t('decision.help')}</p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {actions.map(({ id, icon: Icon, note, run }) => (
          <button key={id} type="button" onClick={run} className="flex items-start gap-3 rounded-xl border border-[#A3B18A] bg-white p-4 text-left hover:border-[#283618] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25]">
            <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#606C38]" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-[#283618]">{t(`decision.${id}`)}</span>
              <span className="mt-1 block text-sm text-[#3B2F20]">{note}</span>
            </span>
            <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0 text-[#606C38]" />
          </button>
        ))}
      </div>
    </section>
  );
}
