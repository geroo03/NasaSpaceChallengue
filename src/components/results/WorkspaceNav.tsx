import { CloudSun, GitCompareArrows, MapPinned } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';

const VIEWS = [
  { id: 'compare', icon: GitCompareArrows },
  { id: 'lot', icon: MapPinned },
  { id: 'climate', icon: CloudSun },
] as const;

export type ResultView = (typeof VIEWS)[number]['id'];

/** Three tasks with proper keyboard navigation; field tools stay out of the comparison. */
export function WorkspaceNav({ active, onChange }: { active: ResultView; onChange: (view: ResultView) => void }) {
  const { t } = useLang();
  return (
    <div role="tablist" aria-label={t('workspace.label')} className="grid grid-cols-3 gap-2 rounded-2xl border border-[#DECFA7] bg-white/70 p-2">
      {VIEWS.map(({ id, icon: Icon }, index) => (
        <button
          key={id}
          id={`workspace-tab-${id}`}
          type="button"
          role="tab"
          aria-selected={active === id}
          aria-controls={`workspace-panel-${id}`}
          tabIndex={active === id ? 0 : -1}
          onClick={() => onChange(id)}
          onKeyDown={(event) => {
            const next = event.key === 'ArrowRight' ? (index + 1) % VIEWS.length
              : event.key === 'ArrowLeft' ? (index + VIEWS.length - 1) % VIEWS.length
                : event.key === 'Home' ? 0 : event.key === 'End' ? VIEWS.length - 1 : null;
            if (next === null) return;
            event.preventDefault();
            onChange(VIEWS[next]!.id);
            document.getElementById(`workspace-tab-${VIEWS[next]!.id}`)?.focus();
          }}
          className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25] sm:flex-row sm:gap-2 ${active === id ? 'bg-[#283618] text-white' : 'text-[#283618] hover:bg-[#E3EBDD]'}`}
        >
          <Icon aria-hidden className="h-5 w-5 shrink-0" />
          {t(`workspace.${id}`)}
        </button>
      ))}
    </div>
  );
}
