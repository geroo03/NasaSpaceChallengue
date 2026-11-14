import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import type { StrategyResult } from '../../engine/domain/rotations';
import { CROP_COLORS, ProvTag } from '../ui';

const GRID = 8;
const TW = 44; // tile width
const TH = 22; // tile height
const DEPTH = 14;
const W = GRID * TW + 8;
const H = GRID * TH + DEPTH + 70;
const CX = W / 2;
const TOP = 56;

function iso(x: number, y: number): [number, number] {
  return [CX + ((x - y) * TW) / 2, TOP + ((x + y) * TH) / 2];
}

function shade(hex: string, f: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)));
  return `rgb(${c.join(',')})`;
}

/** Schematic isometric field driven by the modelled 24-month calendar. Illustrative, not an observation. */
export function FieldScene({ strategy, month, setMonth }: { strategy: StrategyResult; month: number; setMonth: (m: number) => void }) {
  const { t, months, crop, m } = useLang();
  const cell = strategy.timeline[month];
  const slot = strategy.slots.find((s) => s.months.includes(month));
  const stage = slot ? (slot.months.indexOf(month) + 1) / slot.months.length : 0;
  const isCover = slot?.crop.role === 'cover';
  const base = slot ? CROP_COLORS[slot.crop.id] : '#B08A5A';
  const calMonth = cell ? (months[cell.calendarMonth - 1] ?? '') : '';
  const year = month < 12 ? 1 : 2;
  const pressure = Math.round((cell?.pressure ?? 0) * 100);

  const tiles = useMemo(() => {
    const out: { x: number; y: number; jitter: number }[] = [];
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) out.push({ x, y, jitter: ((x * 7 + y * 13) % 5) / 10 });
    return out;
  }, []);

  const [lx, ly] = iso(0, GRID);
  const [rx, ry] = iso(GRID, 0);
  const [bx, by] = iso(GRID, GRID);

  const label = slot
    ? `${calMonth} · ${t('scene.year', { n: year })} · ${crop(slot.crop.id)} · ${t('scene.stage', { k: slot.months.indexOf(month) + 1, n: slot.months.length })}`
    : `${calMonth} · ${t('scene.year', { n: year })} · ${t('scene.empty')}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ProvTag kind="modeled" />
        <span className="text-xs text-[#3B2F20]/85">{t('scene.label')}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="mt-3 w-full max-w-[520px] mx-auto block">
        <defs>
          <pattern id="cover-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={shade(base, 0.35)} />
            <line x1="0" y1="0" x2="0" y2="6" stroke={shade(base, -0.15)} strokeWidth="2" />
          </pattern>
        </defs>
        {/* soil body */}
        <polygon points={`${lx},${ly} ${bx},${by} ${bx},${by + DEPTH} ${lx},${ly + DEPTH}`} fill="#7A5A36" />
        <polygon points={`${bx},${by} ${rx},${ry} ${rx},${ry + DEPTH} ${bx},${by + DEPTH}`} fill="#5E4428" />
        {tiles.map(({ x, y, jitter }) => {
          const [ax, ay] = iso(x, y);
          const [bx1, by1] = iso(x + 1, y);
          const [cx1, cy1] = iso(x + 1, y + 1);
          const [dx, dy] = iso(x, y + 1);
          const fill = slot ? (isCover ? 'url(#cover-hatch)' : shade(base, 0.25 - jitter * 0.2)) : shade('#B08A5A', jitter * 0.25);
          const [mx, my] = [(ax + cx1) / 2, (ay + cy1) / 2];
          const hgt = slot ? 4 + 18 * stage : 0;
          return (
            <g key={`${x}-${y}`}>
              <polygon points={`${ax},${ay} ${bx1},${by1} ${cx1},${cy1} ${dx},${dy}`} fill={fill} stroke="#FEFAE0" strokeOpacity={0.35} strokeWidth={0.8} />
              {slot && !isCover && (
                <>
                  <line x1={mx - 6} y1={my} x2={mx - 6} y2={my - hgt} stroke={shade(base, -0.35)} strokeWidth={2} strokeLinecap="round" />
                  <line x1={mx + 5} y1={my + 2} x2={mx + 5} y2={my + 2 - hgt * 0.85} stroke={shade(base, -0.2)} strokeWidth={2} strokeLinecap="round" />
                </>
              )}
            </g>
          );
        })}
        {/* pressure gauge */}
        <g transform={`translate(12, 12)`}>
          <rect width="120" height="8" rx="4" fill="#EFE3C2" />
          <rect width={(120 * pressure) / 100} height="8" rx="4" fill="#B5462F" />
        </g>
        <text x={12} y={36} fontSize="11" fill="#3B2F20" fontFamily="Raleway, sans-serif" fontWeight={700}>
          {t('cal.legendPressure')}: {pressure}/100
        </text>
      </svg>

      <div className="mt-3 rounded-xl bg-[#FEFAE0] border border-[#DECFA7] p-4" aria-live="polite">
        <p className="font-bold text-[#283618]">
          {calMonth} · {t('scene.year', { n: year })} — {slot ? crop(slot.crop.id) : t('scene.empty')}
          {isCover && <span className="ml-2 text-xs font-bold text-[#606C38]">({t('cal.legendCover')})</span>}
        </p>
        <p className="mt-1 text-sm text-[#3B2F20]/90">
          {slot ? t('scene.stage', { k: slot.months.indexOf(month) + 1, n: slot.months.length }) : t('scene.emptyNote')}
        </p>
        <p className="mt-1 text-xs text-[#3B2F20]/80">{t('scene.pressure', { v: pressure })}</p>
        {slot && slot.crop.role !== 'cover' && (
          <p className="mt-1 text-xs text-[#3B2F20]/80">
            {m({
              key: 'evidence.water',
              params: { crop: slot.crop.id, demand: Math.round(slot.demandMm), supply: Math.round(slot.supplyMm), deficit: Math.round(slot.deficitRatio * 100) },
            })}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMonth(Math.max(0, month - 1))}
          disabled={month === 0}
          aria-label={t('scene.prev')}
          className="h-11 w-11 shrink-0 rounded-full border-2 border-[#283618] flex items-center justify-center disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#BC6C25]"
        >
          <ChevronLeft aria-hidden className="h-5 w-5" />
        </button>
        <label className="flex-1">
          <span className="sr-only">{t('scene.month')}</span>
          <input
            type="range"
            min={0}
            max={23}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            aria-valuetext={label}
            className="w-full accent-[#BC6C25]"
          />
        </label>
        <button
          type="button"
          onClick={() => setMonth(Math.min(23, month + 1))}
          disabled={month === 23}
          aria-label={t('scene.next')}
          className="h-11 w-11 shrink-0 rounded-full border-2 border-[#283618] flex items-center justify-center disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#BC6C25]"
        >
          <ChevronRight aria-hidden className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
