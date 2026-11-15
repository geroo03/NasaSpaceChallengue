import { useMemo, useState } from 'react';
import { Check, Copy, Map as MapIcon, SprayCan, Sprout } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { ringCentroid, type FarmCase } from '../../case/model';
import { droneCalendar, MAPPING_DEFAULTS, planApplication, planMapping, SEED_DEFAULTS, SPRAY_DEFAULTS, type DroneJob } from '../../case/droneOps';
import { polygonAreaHa } from '../../imagery/flightOrder';
import { toPosgar } from '../../imagery/crs';
import type { StrategyResult } from '../../engine/domain/rotations';
import { Notice, primaryBtn, secondaryBtn } from '../ui';

const JOBS: { id: DroneJob; Icon: typeof MapIcon }[] = [
  { id: 'map', Icon: MapIcon },
  { id: 'seed', Icon: Sprout },
  { id: 'spray', Icon: SprayCan },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#DECFA7] bg-white px-3 py-2">
      <p className="text-xs font-bold text-[#3B2F20]/85">{label}</p>
      <p className="text-lg font-bold tabular-nums text-[#283618]">{value}</p>
    </div>
  );
}

function NumberField({ label, value, onChange, unit, step = 1, min = 0, max = 1000, note }: { label: string; value: number; onChange: (v: number) => void; unit: string; step?: number; min?: number; max?: number; note?: string }) {
  return (
    <label className="block text-sm font-bold text-[#283618]">
      {label}
      <span className="mt-1 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
          className="w-24 min-h-[44px] rounded-lg border border-[#DECFA7] bg-white px-2 tabular-nums font-normal"
        />
        <span className="font-normal text-[#3B2F20]">{unit}</span>
      </span>
      {note && <span className="block text-[11px] font-normal text-[#7A3F0C]">{note}</span>}
    </label>
  );
}

/** Mapping, seeding and spraying by drone, planned from the chosen rotation (Vuelo Verde operates). */
export function DroneServices({ farmCase, strategy }: { farmCase: FarmCase; strategy: StrategyResult }) {
  const { t, num, months, crop } = useLang();
  const [job, setJob] = useState<DroneJob>('map');
  const [height, setHeight] = useState(MAPPING_DEFAULTS.heightM);
  const [side, setSide] = useState(Math.round(MAPPING_DEFAULTS.sideOverlap * 100));
  const [seed, setSeed] = useState(SEED_DEFAULTS);
  const [spray, setSpray] = useState(SPRAY_DEFAULTS);
  const [copied, setCopied] = useState(false);
  const ring = farmCase.lotPolygon;
  const tasks = useMemo(() => droneCalendar(strategy), [strategy]);
  const when = (i: number) => `${months[(strategy.timeline[i]?.calendarMonth ?? 1) - 1]} · ${t('scene.year', { n: i < 12 ? 1 : 2 })}`;
  const area = ring ? polygonAreaHa(ring) : 0;
  const plan = useMemo(() => (ring ? planMapping(ring, { ...MAPPING_DEFAULTS, heightM: height, sideOverlap: side / 100 }) : null), [ring, height, side]);
  const seedPlan = planApplication({ areaHa: area, ...seed });
  const sprayPlan = planApplication({ areaHa: area, ...spray });
  const covers = tasks.filter((x) => x.job === 'seed');

  const orderText = () => {
    if (!ring) return '';
    const c = ringCentroid(ring) ?? [farmCase.lat, farmCase.lon];
    const pg = toPosgar(c[0], c[1]);
    const lines = [t(`ops.text.hello.${job}`), '', t('req.text.lot', { ha: num(area, 1) }), t('req.text.centre', { lat: c[0].toFixed(5), lon: c[1].toFixed(5) })];
    if (pg) lines.push(t('req.text.posgar', { faja: pg.faja, epsg: pg.epsg, x: num(Math.round(pg.x)), y: num(Math.round(pg.y)) }));
    lines.push('', t('ops.text.when'));
    tasks.filter((x) => x.job === job).forEach((x) => lines.push(`• ${when(x.month)}: ${t(`ops.reason.${x.reason}`, { crop: x.crop ? crop(x.crop) : '' })}`));
    lines.push('');
    if (job === 'map' && plan) lines.push(t('ops.text.map', { h: height, side, gsd: num(plan.gsdCm, 1), lines: plan.lines.length, km: num(plan.totalPathM / 1000, 1), min: num(plan.minutes), photos: num(plan.photos) }));
    if (job === 'seed') lines.push(t('ops.text.seed', { rate: seed.ratePerHa, total: num(seedPlan.total), loads: seedPlan.loads, hours: num(seedPlan.hours, 1) }));
    if (job === 'spray') lines.push(t('ops.text.spray', { rate: spray.ratePerHa, total: num(sprayPlan.total), loads: sprayPlan.loads, hours: num(sprayPlan.hours, 1) }), t('ops.text.prescription'));
    lines.push('', t('req.text.kml'), t('req.text.sign'));
    return lines.join('\n');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // Flight-plan preview, fitted to a 600×300 box.
  const view = useMemo(() => {
    if (!plan) return null;
    const xs = plan.outline.map((p) => p[0]);
    const ys = plan.outline.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const W = 600;
    const H = 300;
    const s = Math.min((W - 40) / Math.max(x1 - x0, 1), (H - 40) / Math.max(y1 - y0, 1));
    const ox = (W - (x1 - x0) * s) / 2;
    const oy = (H - (y1 - y0) * s) / 2;
    const px = ([x, y]: [number, number]) => [ox + (x - x0) * s, H - (oy + (y - y0) * s)] as const;
    const poly = plan.outline.map((p) => px(p).join(',')).join(' ');
    const path = plan.lines.map((l, i) => `${i ? 'L' : 'M'}${px(l.a).join(',')} L${px(l.b).join(',')}`).join(' ');
    return { W, H, poly, path };
  }, [plan]);

  return (
    <section aria-labelledby="ops-h" className="space-y-4">
      <div>
        <h2 id="ops-h" className="text-xl sm:text-2xl font-bold text-[#283618]">
          {t('ops.title')}
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-[#3B2F20]">{t('ops.help')}</p>
      </div>

      <ol className="fs-stagger grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {tasks.map((x, i) => {
          const J = JOBS.find((j) => j.id === x.job)!;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setJob(x.job)}
                className={`fs-press flex w-full min-h-[64px] items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-[#BC6C25] ${x.job === job ? 'border-[#283618] bg-[#E3EBDD]' : 'border-[#DECFA7] bg-white'}`}
              >
                <J.Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#606C38]" />
                <span>
                  <strong className="block text-[#283618]">{when(x.month)}</strong>
                  {t(`ops.reason.${x.reason}`, { crop: x.crop ? crop(x.crop) : '' })}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div role="tablist" aria-label={t('ops.title')} className="flex flex-wrap gap-2">
        {JOBS.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`ops-tab-${id}`}
            aria-selected={job === id}
            aria-controls="ops-panel"
            onClick={() => setJob(id)}
            className={`fs-press inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-[#BC6C25] ${job === id ? 'border-[#283618] bg-[#283618] text-[#FEFAE0]' : 'border-[#DECFA7] bg-white text-[#3B2F20]'}`}
          >
            <Icon aria-hidden className="h-4 w-4" /> {t(`ops.job.${id}`)}
          </button>
        ))}
      </div>

      <div id="ops-panel" role="tabpanel" aria-labelledby={`ops-tab-${job}`} className="fs-enter rounded-2xl border border-[#DECFA7] bg-[#FEFAE0] p-4 sm:p-5 space-y-4" key={job}>
        {!ring ? (
          <p className="text-sm font-bold text-[#7A3F0C]">{t('req.needLot')}</p>
        ) : (
          <>
            {job === 'map' && plan && view && (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
                <figure>
                  <svg viewBox={`0 0 ${view.W} ${view.H}`} className="w-full h-auto rounded-xl border border-[#DECFA7] bg-[#E3EBDD]" role="img" aria-label={t('ops.map.preview', { n: plan.lines.length })}>
                    <polygon points={view.poly} fill="#DDA15E" fillOpacity={0.25} stroke="#BC6C25" strokeWidth={2} />
                    <path d={view.path} pathLength={1} className="fs-draw" fill="none" stroke="#283618" strokeWidth={1.5} strokeDasharray="1" />
                  </svg>
                  <figcaption className="mt-1 text-xs text-[#3B2F20]/85">{t('ops.map.caption', { bearing: Math.round(plan.bearingDeg) })}</figcaption>
                </figure>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Stat label={t('ops.map.gsd')} value={`${num(plan.gsdCm, 1)} cm`} />
                    <Stat label={t('ops.map.lines')} value={num(plan.lines.length)} />
                    <Stat label={t('ops.map.distance')} value={`${num(plan.totalPathM / 1000, 1)} km`} />
                    <Stat label={t('ops.map.time')} value={`${num(plan.minutes)} min`} />
                    <Stat label={t('ops.map.photos')} value={num(plan.photos)} />
                    <Stat label={t('ops.map.batteries')} value={num(plan.batteries)} />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <NumberField label={t('ops.map.height')} value={height} onChange={setHeight} unit="m" step={10} min={30} max={120} />
                    <NumberField label={t('ops.map.side')} value={side} onChange={setSide} unit="%" step={5} min={50} max={90} />
                  </div>
                  <p className="text-xs text-[#3B2F20]/85">{t('ops.map.note')}</p>
                </div>
              </div>
            )}

            {job === 'seed' && (
              <div className="space-y-3">
                {covers.length === 0 ? (
                  <Notice>{t('ops.seed.none')}</Notice>
                ) : (
                  <p className="text-sm text-[#283618]">{t('ops.seed.help', { list: covers.map((c) => `${crop(c.crop!)} (${when(c.month)})`).join(', ') })}</p>
                )}
                <div className="flex flex-wrap gap-4">
                  <NumberField label={t('ops.seed.rate')} value={seed.ratePerHa} onChange={(v) => setSeed({ ...seed, ratePerHa: v })} unit="kg/ha" note={t('ops.example')} />
                  <NumberField label={t('ops.seed.load')} value={seed.loadCapacity} onChange={(v) => setSeed({ ...seed, loadCapacity: v })} unit="kg" note={t('ops.example')} />
                  <NumberField label={t('ops.swath')} value={seed.swathM} onChange={(v) => setSeed({ ...seed, swathM: v })} unit="m" note={t('ops.example')} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Stat label={t('ops.seed.total')} value={`${num(seedPlan.total)} kg`} />
                  <Stat label={t('ops.loads')} value={num(seedPlan.loads)} />
                  <Stat label={t('ops.rate')} value={`${num(seedPlan.haPerHour, 1)} ha/h`} />
                  <Stat label={t('ops.hours')} value={`${num(seedPlan.hours, 1)} h`} />
                </div>
                <p className="text-xs text-[#3B2F20]/85">{t('ops.seed.note')}</p>
              </div>
            )}

            {job === 'spray' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4">
                  <NumberField label={t('ops.spray.rate')} value={spray.ratePerHa} onChange={(v) => setSpray({ ...spray, ratePerHa: v })} unit="L/ha" note={t('ops.fromReport')} />
                  <NumberField label={t('ops.spray.load')} value={spray.loadCapacity} onChange={(v) => setSpray({ ...spray, loadCapacity: v })} unit="L" note={t('ops.example')} />
                  <NumberField label={t('ops.swath')} value={spray.swathM} onChange={(v) => setSpray({ ...spray, swathM: v })} unit="m" note={t('ops.fromReport')} />
                  <NumberField label={t('ops.speed')} value={spray.speedKmh} onChange={(v) => setSpray({ ...spray, speedKmh: v })} unit="km/h" note={t('ops.fromReport')} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Stat label={t('ops.spray.total')} value={`${num(sprayPlan.total)} L`} />
                  <Stat label={t('ops.loads')} value={num(sprayPlan.loads)} />
                  <Stat label={t('ops.rate')} value={`${num(sprayPlan.haPerHour, 1)} ha/h`} />
                  <Stat label={t('ops.hours')} value={`${num(sprayPlan.hours, 1)} h`} />
                </div>
                <Notice tone="warn">{t('ops.spray.rules')}</Notice>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="button" className={primaryBtn} onClick={() => void copy()}>
                {copied ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />} {copied ? t('req.copied') : t('ops.copy', { job: t(`ops.job.${job}`).toLowerCase() })}
              </button>
              <a className={secondaryBtn} href="#req-h">
                {t('ops.toRequest')}
              </a>
            </div>
            <span aria-live="polite" className="sr-only">
              {copied ? t('req.copied') : ''}
            </span>
            <p className="text-xs text-[#3B2F20]/85">{t('ops.disclaimer')}</p>
          </>
        )}
      </div>
    </section>
  );
}
