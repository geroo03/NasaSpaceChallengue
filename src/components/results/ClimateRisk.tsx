import { useState } from 'react';
import { Droplets, Thermometer, Waves } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import type { DailyWaterBalance, EnsoPhase, FloweringHeat, PhaseSummary } from '../../case/climateRisk';
import { ONI_SOURCE } from '../../data/oni';
import type { StrategyResult } from '../../engine/domain/rotations';
import { secondaryBtn } from '../ui';

const C_REF = '#2F7BB8'; // validated pair (dataviz validator, light surface): reference
const C_OPT = '#BC6C25'; // option

const SEASON_MONTHS: Record<string, [number, number]> = {
  DJF: [12, 2], JFM: [1, 3], FMA: [2, 4], MAM: [3, 5], AMJ: [4, 6], MJJ: [5, 7],
  JJA: [6, 8], JAS: [7, 9], ASO: [8, 10], SON: [9, 11], OND: [10, 12], NDJ: [11, 1],
};

/** Observed ENSO state (NOAA ONI) and what past campaigns of the same phase did at this point. */
export function EnsoBanner({
  latest,
  summaries,
  onCompare,
}: {
  latest: { season: string; year: number; anom: number; phase: EnsoPhase; strength: string };
  summaries: PhaseSummary[];
  onCompare: (phase: EnsoPhase) => void;
}) {
  const { t, num, months } = useLang();
  const [a, b] = SEASON_MONTHS[latest.season] ?? [1, 3];
  const same = summaries.find((s) => s.phase === latest.phase);
  const neutral = summaries.find((s) => s.phase === 'neutral');
  const tone = latest.phase === 'neutral' ? 'border-[#A3B18A] bg-[#E3EBDD]' : 'border-[#2F7BB8] bg-[#E6F0F8]';
  return (
    <section aria-labelledby="enso-h" className={`rounded-2xl border-2 p-5 ${tone}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Waves aria-hidden className="h-5 w-5 text-[#1F4E73]" />
        <h2 id="enso-h" className="font-bold text-[#1F3A52]">
          {t(`enso.now.${latest.phase}`, { strength: t(`enso.strength.${latest.strength}`) })}
        </h2>
        <span className="inline-flex items-center rounded-full border border-[#1F4E73] bg-white px-2 py-0.5 text-[11px] font-bold text-[#1F4E73]">{t('enso.tag')}</span>
      </div>
      <p className="mt-1 text-sm text-[#1F3A52]">
        {t('enso.nowDetail', {
          anom: `${latest.anom > 0 ? '+' : ''}${num(latest.anom, 2)}`,
          from: months[a - 1] ?? '',
          to: months[b - 1] ?? '',
          year: latest.year,
          date: ONI_SOURCE.lastModified,
        })}
      </p>
      {same && same.campaigns.length > 0 && latest.phase !== 'neutral' && neutral && (
        <p className="mt-2 text-sm text-[#1F3A52]">
          <strong>
            {t('enso.past', {
              phase: t(`enso.phase.${latest.phase}`),
              n: same.campaigns.length,
              rain: num(same.rainOctMarMm),
              neutral: num(neutral.rainOctMarMm),
              heat: num(same.heatDays),
              heatN: num(neutral.heatDays),
            })}
          </strong>
        </p>
      )}
      <p className="mt-2 text-xs text-[#1F3A52]/90">{t('enso.notForecast')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {latest.phase !== 'neutral' && same && same.campaigns.length >= 2 && (
          <button type="button" className={secondaryBtn} onClick={() => onCompare(latest.phase)}>
            {t('enso.compare', { phase: t(`enso.phase.${latest.phase}`) })}
          </button>
        )}
        <a className={secondaryBtn} href="https://www.smn.gob.ar/pronostico-trimestral" target="_blank" rel="noreferrer">
          {t('enso.official')}
        </a>
      </div>
    </section>
  );
}

export function EnsoTable({ summaries }: { summaries: PhaseSummary[] }) {
  const { t, num } = useLang();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <caption className="text-left text-xs text-[#3B2F20]/85 pb-2">{t('enso.tableCaption')}</caption>
        <thead>
          <tr className="text-left text-xs text-[#3B2F20]/80">
            <th className="py-1 pr-2 font-bold">{t('enso.col.phase')}</th>
            <th className="py-1 pr-2 font-bold text-right">{t('enso.col.rain')}</th>
            <th className="py-1 pr-2 font-bold text-right">{t('enso.col.rainSummer')}</th>
            <th className="py-1 pr-2 font-bold text-right">{t('enso.col.heat')}</th>
            <th className="py-1 font-bold text-right">{t('enso.col.waves')}</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => (
            <tr key={s.phase} className="border-t border-[#EFE3C2]">
              <th scope="row" className="py-1.5 pr-2 text-left font-bold text-[#283618]">
                {t(`enso.phase.${s.phase}`)}
                <span className="block text-[11px] font-normal text-[#3B2F20]/80">
                  {s.campaigns.length ? s.campaigns.map((y) => `${y}/${String(y + 1).slice(2)}`).join(' · ') : '—'}
                </span>
              </th>
              <td className="py-1.5 pr-2 text-right tabular-nums">{s.campaigns.length ? `${num(s.rainMm)} mm` : '—'}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{s.campaigns.length ? `${num(s.rainOctMarMm)} mm` : '—'}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{s.campaigns.length ? num(s.heatDays) : '—'}</td>
              <td className="py-1.5 text-right tabular-nums">{s.campaigns.length ? num(s.heatwaves, 1) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LEVEL_STYLE = {
  high: 'bg-[#FDE8E4] border-[#B5462F] text-[#6E2414]',
  medium: 'bg-[#FBE9D0] border-[#DDA15E] text-[#5C3209]',
  low: 'bg-[#E3EBDD] border-[#A3B18A] text-[#283618]',
} as const;

export function FloweringHeatList({ items, title }: { items: FloweringHeat[]; title: string }) {
  const { t, num, crop, months } = useLang();
  return (
    <div>
      <p className="text-sm font-bold text-[#283618]">{title}</p>
      {!items.length && <p className="text-sm">—</p>}
      <ul className="mt-1.5 space-y-1.5">
        {items.map((h) => (
          <li key={`${h.crop}-${h.index}`} className={`rounded-lg border px-3 py-2 text-sm ${LEVEL_STYLE[h.level]}`}>
            <span className="flex flex-wrap items-center gap-2 font-bold">
              <Thermometer aria-hidden className="h-4 w-4" />
              {crop(h.crop)} · {t('heat.flowers', { month: months[h.calendarMonth - 1] ?? '', year: h.index < 12 ? 1 : 2 })}
              <span className="rounded-full border border-current px-2 text-[11px]">{t(`heat.level.${h.level}`)}</span>
            </span>
            <span className="mt-0.5 block">
              {t('heat.detail', { days: num(h.hotDays, 1), c: h.heatC, spells: h.yearsWithSpell, years: h.years })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Median soil water at the end of each month for two rotations, with the option's middle-half band. */
export function SoilWaterChart({
  reference,
  option,
  refStrategy,
  optStrategy,
  refLabel,
  optLabel,
}: {
  reference: DailyWaterBalance;
  option: DailyWaterBalance | null;
  refStrategy: StrategyResult;
  optStrategy: StrategyResult | null;
  refLabel: string;
  optLabel: string;
}) {
  const { t, num, months, crop } = useLang();
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 230;
  const pad = { l: 44, r: 12, t: 12, b: 44 };
  const paw = Math.max(reference.pawMm, 1);
  const x = (i: number) => pad.l + ((i + 0.5) / 24) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - Math.min(1, Math.max(0, v / paw))) * (H - pad.t - pad.b);
  const line = (b: DailyWaterBalance) => b.monthly.map((m, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(m.median).toFixed(1)}`).join(' ');
  const band = (b: DailyWaterBalance) =>
    `${b.monthly.map((m, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(m.p75).toFixed(1)}`).join(' ')} ${[...b.monthly]
      .reverse()
      .map((m) => `L${x(m.index).toFixed(1)},${y(m.p25).toFixed(1)}`)
      .join(' ')} Z`;
  const ticks = [0, 0.5, 1].map((f) => f * paw);
  const cropAt = (s: StrategyResult | null, i: number) => {
    const c = s?.timeline[i]?.crop;
    return c ? crop(c) : t('scene.empty');
  };
  const hm = hover !== null ? { r: reference.monthly[hover], o: option?.monthly[hover] } : null;

  return (
    <figure className="space-y-2">
      <div className="flex flex-wrap gap-4 text-xs text-[#3B2F20]">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-0.5 w-5" style={{ background: C_REF }} /> {refLabel}
        </span>
        {option && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0.5 w-5" style={{ background: C_OPT }} /> {optLabel}
            <span aria-hidden className="inline-block h-2.5 w-4 rounded-sm" style={{ background: C_OPT, opacity: 0.15 }} /> {t('water.band')}
          </span>
        )}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={t('water.chartLabel')}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#3B2F20" strokeOpacity={0.12} />
              <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#3B2F20" fillOpacity={0.75}>
                {num(v)}
              </text>
            </g>
          ))}
          {refStrategy.timeline.map((c, i) => (
            <text key={i} x={x(i)} y={H - pad.b + 16} textAnchor="middle" fontSize="10" fill="#3B2F20" fillOpacity={0.75}>
              {(months[c.calendarMonth - 1] ?? '').slice(0, 1)}
            </text>
          ))}
          <text x={x(5.5)} y={H - 8} textAnchor="middle" fontSize="11" fill="#3B2F20" fillOpacity={0.8}>
            {t('scene.year', { n: 1 })}
          </text>
          <text x={x(17.5)} y={H - 8} textAnchor="middle" fontSize="11" fill="#3B2F20" fillOpacity={0.8}>
            {t('scene.year', { n: 2 })}
          </text>
          <line x1={x(11.5)} x2={x(11.5)} y1={pad.t} y2={H - pad.b} stroke="#3B2F20" strokeOpacity={0.2} strokeDasharray="3 3" />
          {option && <path d={band(option)} fill={C_OPT} fillOpacity={0.15} stroke="none" />}
          <path d={line(reference)} fill="none" stroke={C_REF} strokeWidth={2} strokeLinejoin="round" />
          {option && <path d={line(option)} fill="none" stroke={C_OPT} strokeWidth={2} strokeLinejoin="round" />}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#3B2F20" strokeOpacity={0.35} />
          )}
          {hover !== null && hm?.r && <circle cx={x(hover)} cy={y(hm.r.median)} r={4} fill={C_REF} stroke="#fff" strokeWidth={2} />}
          {hover !== null && hm?.o && <circle cx={x(hover)} cy={y(hm.o.median)} r={4} fill={C_OPT} stroke="#fff" strokeWidth={2} />}
          {Array.from({ length: 24 }, (_, i) => (
            <rect
              key={i}
              x={x(i) - (W - pad.l - pad.r) / 48}
              y={pad.t}
              width={(W - pad.l - pad.r) / 24}
              height={H - pad.t - pad.b}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(i)}
            />
          ))}
        </svg>
        {hover !== null && hm?.r && (
          <div
            className="pointer-events-none absolute top-1 rounded-lg border border-[#DECFA7] bg-white px-3 py-2 text-xs shadow"
            style={{ left: `${Math.min(70, Math.max(2, (x(hover) / W) * 100 - 12))}%` }}
          >
            <p className="font-bold">
              {months[(refStrategy.timeline[hover]?.calendarMonth ?? 1) - 1]} · {t('scene.year', { n: hover < 12 ? 1 : 2 })}
            </p>
            <p>
              <span style={{ color: C_REF }}>■</span> {refLabel}: {num(hm.r.median)} mm · {cropAt(refStrategy, hover)}
            </p>
            {hm.o && (
              <p>
                <span style={{ color: C_OPT }}>■</span> {optLabel}: {num(hm.o.median)} mm · {cropAt(optStrategy, hover)}
              </p>
            )}
          </div>
        )}
      </div>
      <figcaption className="text-xs text-[#3B2F20]/85">{t('water.caption', { paw: num(paw), cycles: reference.cycles })}</figcaption>
      <details className="text-xs">
        <summary className="cursor-pointer font-bold text-[#283618]">{t('water.table')}</summary>
        <div className="overflow-x-auto">
          <table className="mt-1 min-w-[420px] text-xs tabular-nums">
            <thead>
              <tr>
                <th className="pr-3 text-left">{t('scene.month')}</th>
                <th className="pr-3 text-right">{refLabel}</th>
                {option && <th className="text-right">{optLabel}</th>}
              </tr>
            </thead>
            <tbody>
              {reference.monthly.map((m, i) => (
                <tr key={i}>
                  <td className="pr-3">
                    {months[(refStrategy.timeline[i]?.calendarMonth ?? 1) - 1]} · {t('scene.year', { n: i < 12 ? 1 : 2 })}
                  </td>
                  <td className="pr-3 text-right">{num(m.median)} mm</td>
                  {option && <td className="text-right">{num(option.monthly[i]?.median ?? 0)} mm</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export function SowingWaterList({ balance, label, strategy }: { balance: DailyWaterBalance; label: string; strategy: StrategyResult }) {
  const { t, num, crop, months } = useLang();
  return (
    <div>
      <p className="text-sm font-bold text-[#283618]">{label}</p>
      <ul className="mt-1.5 space-y-1.5">
        {balance.sowing.map((s) => {
          const low = Math.round(s.lowShare * s.values.length);
          return (
            <li key={`${s.crop}-${s.index}`} className="rounded-lg border border-[#DECFA7] bg-white px-3 py-2 text-sm">
              <span className="flex items-center gap-2 font-bold text-[#283618]">
                <Droplets aria-hidden className="h-4 w-4 text-[#2F7BB8]" />
                {crop(s.crop)} · {t('water.sowIn', { month: months[(strategy.timeline[s.index]?.calendarMonth ?? 1) - 1] ?? '', year: s.index < 12 ? 1 : 2 })}
              </span>
              <span className="mt-0.5 block">
                {t('water.atSowing', { mm: num(s.medianMm), paw: num(balance.pawMm), low, n: s.values.length })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
