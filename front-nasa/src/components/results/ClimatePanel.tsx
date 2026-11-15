import { useLang } from '../../i18n/LangContext';
import type { ClimateProfile } from '../../engine/analysis/climate';
import { Collapsible, ProvTag, type Provenance } from '../ui';

function Stat({ label, value, unit, note, prov }: { label: string; value: string; unit?: string; note?: string; prov: Provenance }) {
  return (
    <div className="rounded-xl border border-[#DECFA7] bg-[#FEFAE0] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-[#3B2F20]/80">{label}</p>
        <ProvTag kind={prov} />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[#283618]">
        {value}
        {unit && <span className="ml-1 text-sm">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-xs text-[#3B2F20]/80">{note}</p>}
    </div>
  );
}

const CW = 640;
const CH = 260;
const PAD = { l: 44, r: 44, t: 16, b: 34 };

function MonthlyChart({ p, startMonthIndex }: { p: ClimateProfile; startMonthIndex: number }) {
  const { t, months, num } = useLang();
  // Order months as a growing year (Jul→Jun in the south) so it reads like the rotation calendar.
  const order = Array.from({ length: 12 }, (_, i) => (startMonthIndex + i) % 12);
  const data = order.map((i) => p.monthly[i]).filter((x): x is NonNullable<typeof x> => x !== undefined);
  const max = Math.max(...data.map((d) => Math.max(d.precipMm, d.et0Mm)), 1);
  const step = max > 200 ? 50 : 25;
  const yMax = Math.ceil(max / step) * step;
  const iw = CW - PAD.l - PAD.r;
  const ih = CH - PAD.t - PAD.b;
  const bw = iw / 12;
  const y = (v: number) => PAD.t + ih - (v / yMax) * ih;
  const yW = (v: number) => PAD.t + ih - v * ih;
  const ticks = Array.from({ length: yMax / step + 1 }, (_, i) => step * i);
  const et0Path = data.map((d, i) => `${i ? 'L' : 'M'}${PAD.l + bw * i + bw / 2},${y(d.et0Mm)}`).join(' ');
  const wet = data.map((d, i) => (d.rootWetness === null ? null : ([PAD.l + bw * i + bw / 2, yW(d.rootWetness)] as const)));
  const wetPath = wet.filter((x): x is readonly [number, number] => x !== null).map(([x, yy], i) => `${i ? 'L' : 'M'}${x},${yy}`).join(' ');

  return (
    <figure>
      <svg viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label={t('clim.chartAlt')} className="w-full">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={CW - PAD.r} y1={y(v)} y2={y(v)} stroke="#DECFA7" strokeDasharray="3 3" />
            <text x={PAD.l - 6} y={y(v) + 4} fontSize="11" textAnchor="end" fill="#3B2F20">
              {num(v)}
            </text>
          </g>
        ))}
        <text x={12} y={PAD.t + ih / 2} fontSize="11" fill="#3B2F20" transform={`rotate(-90 12 ${PAD.t + ih / 2})`} textAnchor="middle">
          {t('unit.mmMonth')}
        </text>
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={CW - PAD.r + 6} y={yW(v) + 4} fontSize="11" fill="#2F6B3A">
            {num(v, 1)}
          </text>
        ))}
        {data.map((d, i) => (
          <g key={d.month}>
            <rect x={PAD.l + bw * i + bw * 0.18} y={y(d.precipMm)} width={bw * 0.64} height={PAD.t + ih - y(d.precipMm)} fill="#5B8FB9" rx="2" />
            <text x={PAD.l + bw * i + bw / 2} y={CH - 12} fontSize="11" textAnchor="middle" fill="#3B2F20">
              {months[d.month - 1]}
            </text>
          </g>
        ))}
        <path d={et0Path} fill="none" stroke="#B5462F" strokeWidth="2.5" />
        {data.map((d, i) => (
          <circle key={d.month} cx={PAD.l + bw * i + bw / 2} cy={y(d.et0Mm)} r="3" fill="#B5462F" />
        ))}
        {wetPath && <path d={wetPath} fill="none" stroke="#2F6B3A" strokeWidth="2" strokeDasharray="5 4" />}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#3B2F20]">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-3 rounded-sm bg-[#5B8FB9]" /> {t('clim.precipSeries')}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-0.5 w-5 bg-[#B5462F]" /> {t('clim.et0Series')}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block w-5 border-t-2 border-dashed border-[#2F6B3A]" /> {t('clim.wetSeries')}
        </span>
      </figcaption>
    </figure>
  );
}

export function ClimatePanel({ profile, from, to }: { profile: ClimateProfile; from: number; to: number }) {
  const { t, num, months } = useLang();
  const a = profile.annual;
  const start = profile.hemisphere === 'south' ? 6 : 0;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label={t('clim.precip')} value={num(a.precipMm)} unit={t('unit.mmYear')} prov="source" />
        <Stat label={t('clim.et0')} value={num(a.et0Mm)} unit={t('unit.mmYear')} note={t('clim.et0Method')} prov="modeled" />
        <Stat label={t('clim.aridity')} value={num(a.aridityIndex, 2)} note={t('clim.aridityNote')} prov="modeled" />
        <Stat label={t('clim.heat')} value={num(a.heatDays, 1)} unit={t('unit.daysYear')} prov="source" />
        <Stat label={t('clim.frost')} value={num(a.frostDays, 1)} unit={t('unit.daysYear')} note={t('clim.frostNote')} prov="source" />
      </div>
      <div>
        <h3 className="text-base font-bold text-[#283618] mb-2">{t('clim.chart')}</h3>
        <MonthlyChart p={profile} startMonthIndex={start} />
        <p className="mt-2 text-xs text-[#3B2F20]/80">{t('clim.source', { from, to })}</p>
      </div>
      <Collapsible title={t('clim.table')}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-left">
                <th className="py-1 pr-3">{t('clim.month')}</th>
                <th className="py-1 pr-3">{t('clim.precipSeries')}</th>
                <th className="py-1 pr-3">{t('clim.et0Series')}</th>
                <th className="py-1 pr-3">{t('clim.wetSeries')}</th>
                <th className="py-1">{t('chart.frost')}</th>
              </tr>
            </thead>
            <tbody>
              {profile.monthly.map((mc) => (
                <tr key={mc.month} className="border-t border-[#EFE3C2]">
                  <td className="py-1 pr-3 font-bold">{months[mc.month - 1]}</td>
                  <td className="py-1 pr-3">{num(mc.precipMm)}</td>
                  <td className="py-1 pr-3">{num(mc.et0Mm)}</td>
                  <td className="py-1 pr-3">{mc.rootWetness === null ? '—' : num(mc.rootWetness, 2)}</td>
                  <td className="py-1">{num(mc.frostProb, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Collapsible>
    </div>
  );
}
