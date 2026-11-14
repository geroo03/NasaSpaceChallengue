import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLang } from '../../i18n/LangContext';
import { DIMENSIONS, type StrategyResult } from '../../engine/domain/rotations';
import type { FarmContext } from '../../engine/domain/rotations';
import { Notice, ProvTag, linkBtn } from '../ui';
import { strategyLabel } from './RotationCalendar';

function cashCrops(s: StrategyResult): Set<string> {
  return new Set(s.slots.filter((a) => a.crop.role !== 'cover').map((a) => a.crop.id));
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-bold uppercase tracking-[0.06em] text-[#606C38]">{title}</h4>
      <div className="mt-1.5 text-sm text-[#3B2F20] leading-relaxed">{children}</div>
    </div>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-[#3B2F20]/70">{empty}</p>;
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

export function StrategyTabs({ strategies, selectedId, onSelect }: { strategies: StrategyResult[]; selectedId: string; onSelect: (id: string) => void }) {
  const { t } = useLang();
  let alt = 0;
  return (
    <div role="tablist" aria-label={t('cmp.choose')} className="flex gap-1.5 overflow-x-auto rounded-xl bg-[#EFE3C2]/70 border border-[#DECFA7] p-1.5">
      {strategies.map((s) => {
        const n = s.isCurrent ? 0 : ++alt;
        const active = s.id === selectedId;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(s.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-bold focus-visible:outline-2 focus-visible:outline-[#BC6C25] ${
              active ? 'bg-[#283618] text-[#FEFAE0]' : 'text-[#3B2F20] hover:bg-[#FEFAE0]/70'
            }`}
          >
            {s.isCurrent ? t('cmp.tabRef') : t('cmp.tabAlt', { n })}
          </button>
        );
      })}
    </div>
  );
}

export function StrategyPanel({ strategy, reference, altIndex, farm }: { strategy: StrategyResult; reference: StrategyResult; altIndex: number; farm: FarmContext }) {
  const { t, m, crop, months } = useLang();
  const [open, setOpen] = useState(false);
  const s = strategy;

  // 1. What changes, derived from the two calendars (no new modelling).
  const changes: string[] = [];
  if (s.isCurrent) {
    changes.push(t('cmp.same'));
  } else {
    const mine = cashCrops(s);
    const ref = cashCrops(reference);
    const adds = [...mine].filter((c) => !ref.has(c)).map(crop);
    const drops = [...ref].filter((c) => !mine.has(c)).map(crop);
    if (adds.length) changes.push(t('cmp.adds', { list: adds.join(', ') }));
    if (drops.length) changes.push(t('cmp.drops', { list: drops.join(', ') }));
    if (!adds.length && !drops.length) changes.push(t('cmp.noCropChange'));
  }
  const covers = [...new Set(s.slots.filter((a) => a.crop.role === 'cover').map((a) => crop(a.crop.id)))];
  if (covers.length && !s.isCurrent) changes.push(t('cmp.coversAdded', { list: covers.join(', ') }));

  const schedule = [...s.slots]
    .sort((a, b) => a.startIndex - b.startIndex)
    .map((a) => {
      const first = s.timeline[a.months[0] ?? 0];
      const last = s.timeline[a.months[a.months.length - 1] ?? 0];
      return t('schedule.item', {
        crop: a.crop.id,
        sow: first ? (months[first.calendarMonth - 1] ?? '') : '',
        end: last ? (months[last.calendarMonth - 1] ?? '') : '',
        months: a.months.length,
      });
    });

  return (
    <article className={`rounded-2xl border-2 p-5 sm:p-6 bg-white/80 shadow-earth-card ${s.isCurrent ? 'border-[#A3B18A]' : 'border-[#283618]'}`}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#606C38]">{strategyLabel(t, s, altIndex)}</p>
          <h3 className="mt-1 text-xl sm:text-2xl font-bold text-[#283618]">{t(`template.${s.templateId}`)}</h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-[#283618]">
            {Math.round(s.overall)}
            <span className="text-sm font-bold text-[#3B2F20]/70">/100</span>
          </p>
          <p className="text-xs font-bold text-[#3B2F20]/80">{t('cmp.index')}</p>
        </div>
      </header>
      <p className="mt-2 text-xs text-[#3B2F20]/80">{t('cmp.indexNote')}</p>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Block title={`1. ${t('cmp.change')}`}>
          <List items={changes} empty="—" />
        </Block>
        <Block title={`2. ${t('cmp.why')}`}>
          <List items={s.rationale.map(m)} empty="—" />
        </Block>
        <Block title={`3. ${t('cmp.needs')}`}>
          <p className="font-bold text-[#7A3F0C]">{t('res.pending')}</p>
          {farm.irrigationMm > 0 && <p className="mt-1">{t('cmp.irrigationUsed', { mm: farm.irrigationMm })}</p>}
        </Block>
        <Block title={`4. ${t('cmp.verify')}`}>
          <List items={[...s.risks.map(m), ...s.gaps.map(m)]} empty="—" />
        </Block>
      </div>

      {!s.suitable && (
        <div className="mt-4">
          <Notice tone="error">
            <strong>{t('strategy.unsuitable')}</strong>
            <List items={s.unsuitable.map(m)} empty="" />
          </Notice>
        </div>
      )}

      <button type="button" className={`${linkBtn} mt-5 text-sm`} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? t('cmp.hide') : t('cmp.details')}
      </button>

      {open && (
        <div className="mt-4 grid gap-5 md:grid-cols-2 border-t border-[#EFE3C2] pt-4">
          <Block title={t('strategy.schedule')}>
            <List items={schedule} empty="—" />
          </Block>
          <Block title={t('strategy.evidence')}>
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              <ProvTag kind="source" />
              <ProvTag kind="modeled" />
              <ProvTag kind="assumed" />
            </div>
            <List items={s.evidence.map(m)} empty="—" />
          </Block>
          {!s.isCurrent && (
            <>
              <Block title={t('strategy.benefits')}>
                <List items={s.benefits.map(m)} empty="—" />
              </Block>
              <Block title={t('strategy.tradeoffs')}>
                <List items={s.tradeoffs.map(m)} empty="—" />
              </Block>
            </>
          )}
          <div className="md:col-span-2">
            <Block title={t('cmp.scores')}>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {DIMENSIONS.map((d) => {
                  const v = Math.round(s.scores[d]);
                  const delta = Math.round(s.scores[d] - reference.scores[d]);
                  return (
                    <div key={d}>
                      <div className="flex justify-between text-xs font-bold">
                        <span>{t(`dim.${d}`)}</span>
                        <span className="tabular-nums">
                          {v}
                          {!s.isCurrent && delta !== 0 && (
                            <span className={delta > 0 ? 'text-[#3F6B2A]' : 'text-[#9A3412]'}>
                              {' '}
                              ({delta > 0 ? '+' : '−'}
                              {Math.abs(delta)})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-[#EFE3C2]" aria-hidden>
                        <div className="h-2 rounded-full bg-[#606C38]" style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Block>
          </div>
        </div>
      )}
    </article>
  );
}
