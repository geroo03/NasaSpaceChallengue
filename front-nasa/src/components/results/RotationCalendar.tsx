import { useEffect, useRef } from 'react';
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
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scroll.current;
    const cell = document.getElementById(`calendar-${selectedId}-${month}`);
    if (!container?.clientWidth || !cell) return;
    const left = cell.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
    if (left < container.scrollLeft || left + cell.clientWidth > container.scrollLeft + container.clientWidth) {
      container.scrollLeft = Math.max(0, left - container.clientWidth / 2);
    }
  }, [selectedId, month]);
  const axis = strategies[0]?.timeline ?? [];
  let alt = 0;
  return (
    <div>
      <p className="mb-3 text-xs font-bold text-[#606C38]">{t('cal.scrollHelp')}</p>
      <div ref={scroll} className="max-w-full overflow-x-auto rounded-xl pb-2">
      <div className="grid min-w-[1152px] grid-cols-[minmax(0,1fr)] gap-3">
        <div className="grid grid-cols-24 gap-[2px] px-3 text-[10px] font-bold text-[#3B2F20]/70" aria-hidden>
          {axis.map((c) => (
            <span key={c.index} className={`text-center ${c.index === month ? 'text-[#BC6C25]' : ''}`}>
              {months[c.calendarMonth - 1]}
              <span className="block text-[9px]">{t('scene.year', { n: c.index < 12 ? 1 : 2 })}</span>
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
                className="sticky left-3 mb-1.5 block max-w-[280px] rounded text-left text-sm font-bold text-[#283618] focus-visible:outline-2 focus-visible:outline-[#BC6C25] sm:max-w-none"
              >
                <span className="text-xs uppercase tracking-wide text-[#606C38]">{strategyLabel(t, s, n)}</span>
                <span className="block">{t(`template.${s.templateId}`)}</span>
                <span className="sr-only">: {summary}</span>
              </button>
              <div className="grid grid-cols-24 gap-[2px]" role="group" aria-label={t(`template.${s.templateId}`)}>
                {s.timeline.map((c) => {
                  const color = c.crop ? CROP_COLORS[c.crop] : null;
                  const slot = s.slots.find((a) => a.months.includes(c.index));
                  const isStart = slot?.months[0] === c.index;
                  const cover = slot?.crop.role === 'cover';
                  return (
                    <button
                      key={c.index}
                      id={`calendar-${s.id}-${c.index}`}
                      type="button"
                      tabIndex={selected && c.index === month ? 0 : -1}
                      aria-pressed={selected && c.index === month}
                      aria-label={t('cal.monthLabel', { month: months[c.calendarMonth - 1] ?? '', year: c.index < 12 ? 1 : 2, crop: c.crop ? crop(c.crop) : t('timeline.bare'), pressure: Math.round(c.pressure * 100) })}
                      onClick={() => onSelect(s.id, c.index)}
                      onKeyDown={(event) => {
                        const index = strategies.indexOf(s);
                        const targetMonth = event.key === 'ArrowLeft' ? Math.max(0, c.index - 1)
                          : event.key === 'ArrowRight' ? Math.min(23, c.index + 1)
                            : event.key === 'Home' ? 0 : event.key === 'End' ? 23 : c.index;
                        const targetStrategy = event.key === 'ArrowUp' ? strategies[Math.max(0, index - 1)]!
                          : event.key === 'ArrowDown' ? strategies[Math.min(strategies.length - 1, index + 1)]! : s;
                        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
                        event.preventDefault();
                        onSelect(targetStrategy.id, targetMonth);
                        document.getElementById(`calendar-${targetStrategy.id}-${targetMonth}`)?.focus({ preventScroll: true });
                      }}
                      title={`${months[c.calendarMonth - 1]} · ${c.crop ? crop(c.crop) : t('timeline.bare')} · ${Math.round(c.pressure * 100)}/100`}
                      className={`relative flex h-11 items-center justify-center overflow-hidden rounded-[3px] text-[10px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#283618] ${
                        c.index === month ? 'ring-2 ring-[#BC6C25] ring-offset-1 z-10' : ''
                      } ${!color ? 'empty-month' : ''} ${cover ? 'cover-crop-hatch' : ''}`}
                      style={color && !cover ? { background: color, color: textOn(color) } : cover ? { color: '#283618' } : undefined}
                    >
                      {isStart && c.crop ? <span>{cropAbbr(lang, c.crop)}</span> : null}
                      <span className="absolute bottom-0 left-0 right-0 bg-[#B5462F]" style={{ height: `${Math.round(c.pressure * 6)}px` }} />
                    </button>
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
