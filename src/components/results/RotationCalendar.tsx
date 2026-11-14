import { useLang } from '../../i18n/LangContext';
import type { StrategyResult } from '../../engine/domain/rotations';
import { CROP_COLORS, cropAbbr, textOn } from '../ui';

export function strategyLabel(t: (k: string, p?: Record<string, string | number>) => string, s: StrategyResult, altIndex: number): string {
  return s.isCurrent ? t('strategy.current') : t('strategy.alt', { n: altIndex });
}

/** Flat 24-month view of every strategy on a common axis. The accessible alternative to the field scene. */
export function RotationCalendar({
  strategies,
  selectedId,
  month,
  onSelect,
}: {
  strategies: StrategyResult[];
  selectedId: string;
  month: number;
  onSelect: (id: string, month?: number) => void;
}) {
  const { t, lang, months, crop } = useLang();
  const axis = strategies[0]?.timeline ?? [];
  let alt = 0;
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <div className="hidden sm:grid grid-cols-24 gap-[2px] pl-0 text-[10px] font-bold text-[#3B2F20]/70" aria-hidden>
          {axis.map((c) => (
            <span key={c.index} className={`text-center ${c.index === month ? 'text-[#BC6C25]' : ''}`}>
              {months[c.calendarMonth - 1]?.charAt(0)}
            </span>
          ))}
        </div>
        {strategies.map((s) => {
          const n = s.isCurrent ? 0 : ++alt;
          const selected = s.id === selectedId;
          const summary = [...s.slots]
            .sort((a, b) => a.startIndex - b.startIndex)
            .map((a) => `${crop(a.crop.id)} (${months[(s.timeline[a.months[0] ?? 0]?.calendarMonth ?? 1) - 1]}, ${a.months.length})`)
            .join(', ');
          return (
            <div key={s.id} className={`rounded-xl p-2.5 border-2 ${selected ? 'border-[#283618] bg-[#E3EBDD]/60' : 'border-transparent'}`}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-pressed={selected}
                className="w-full text-left text-sm font-bold text-[#283618] mb-1.5 rounded focus-visible:outline-2 focus-visible:outline-[#BC6C25]"
              >
                <span className="text-xs uppercase tracking-wide text-[#606C38]">{strategyLabel(t, s, n)}</span>
                <span className="block">{t(`template.${s.templateId}`)}</span>
                <span className="sr-only">: {summary}</span>
              </button>
              <div className="grid grid-cols-24 gap-[2px]" aria-hidden>
                {s.timeline.map((c) => {
                  const color = c.crop ? CROP_COLORS[c.crop] : null;
                  const slot = s.slots.find((a) => a.months.includes(c.index));
                  const isStart = slot?.months[0] === c.index;
                  const cover = slot?.crop.role === 'cover';
                  return (
                    <span
                      key={c.index}
                      onClick={() => onSelect(s.id, c.index)}
                      title={`${months[c.calendarMonth - 1]} · ${c.crop ? crop(c.crop) : t('timeline.bare')} · ${Math.round(c.pressure * 100)}/100`}
                      className={`relative h-9 sm:h-10 rounded-[3px] cursor-pointer flex items-center justify-center text-[9px] sm:text-[10px] font-bold overflow-hidden ${
                        c.index === month ? 'ring-2 ring-[#BC6C25] ring-offset-1 z-10' : ''
                      } ${!color ? 'empty-month' : ''} ${cover ? 'cover-crop-hatch' : ''}`}
                      style={color && !cover ? { background: color, color: textOn(color) } : cover ? { color: '#283618' } : undefined}
                    >
                      {isStart && c.crop ? <span className="hidden sm:inline">{cropAbbr(lang, c.crop)}</span> : null}
                      <span className="absolute bottom-0 left-0 right-0 bg-[#B5462F]" style={{ height: `${Math.round(c.pressure * 6)}px` }} />
                    </span>
                  );
                })}
              </div>
              <div className="mt-1 grid grid-cols-2 text-[10px] font-bold text-[#3B2F20]/70" aria-hidden>
                <span>{t('scene.year', { n: 1 })}</span>
                <span className="border-l border-[#DECFA7] pl-1">{t('scene.year', { n: 2 })}</span>
              </div>
            </div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#3B2F20]/90">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-5 rounded-sm empty-month" /> {t('cal.legendEmpty')}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-5 rounded-sm cover-crop-hatch" /> {t('cal.legendCover')}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-1.5 w-5 bg-[#B5462F]" /> {t('cal.legendPressure')}
        </li>
      </ul>
    </div>
  );
}
