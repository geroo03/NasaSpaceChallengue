import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, Upload } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import type { FarmCase } from '../../case/model';
import type { VigorRaster } from '../../imagery/vigor';
import { Notice, primaryBtn, secondaryBtn } from '../ui';
import { useProfile } from '../../profile/ProfileContext';
import { DemoLock } from '../DemoLock';

type VigorModule = typeof import('../../imagery/vigor');
type DroneModule = typeof import('../../imagery/drone');

/** Low → high vigour: red, yellow, green (as in DJI SmartFarm), with text labels beside each colour. */
const RAMP: [number, number, number][] = [
  [181, 70, 47],
  [232, 197, 71],
  [63, 107, 42],
];
function rampAt(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  const f = x - i;
  const a = RAMP[i]!;
  const b = RAMP[i + 1]!;
  return [0, 1, 2].map((k) => Math.round(a[k]! + (b[k]! - a[k]!) * f)) as [number, number, number];
}
const zoneColor = (z: number, n: number) => rampAt(n === 1 ? 0.5 : z / (n - 1));
const hex = ([r, g, b]: [number, number, number]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

function download(name: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** NDVI map from the drone → vigour zones → rate per zone → grid prescription for variable-rate application. */
export function VigorPrescription({ farmCase }: { farmCase: FarmCase }) {
  const { demo } = useProfile();
  const { t, num } = useLang();
  const [mod, setMod] = useState<VigorModule | null>(null);
  const [raster, setRaster] = useState<VigorRaster | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [classes, setClasses] = useState(3);
  const [view, setView] = useState<'index' | 'zones'>('zones');
  const [rates, setRates] = useState<number[]>([0, 0, 0, 0, 0]);
  const [unit, setUnit] = useState('L/ha');
  const [cellM, setCellM] = useState(10);
  const canvas = useRef<HTMLCanvasElement>(null);

  const thresholds = useMemo(() => (mod && raster ? mod.quantileThresholds(raster.values, classes) : []), [mod, raster, classes]);
  const zones = useMemo(() => (mod && raster ? mod.zoneStats(raster, thresholds) : []), [mod, raster, thresholds]);
  const range = useMemo(() => {
    if (!raster) return [0, 1] as const;
    const v = Array.from(raster.values).filter(Number.isFinite).sort((a, b) => a - b);
    return [v[Math.floor(v.length * 0.02)] ?? 0, v[Math.floor(v.length * 0.98)] ?? 1] as const;
  }, [raster]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !raster || !mod) return;
    c.width = raster.width;
    c.height = raster.height;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(raster.width, raster.height);
    for (let i = 0; i < raster.values.length; i++) {
      const v = raster.values[i]!;
      if (!Number.isFinite(v)) continue;
      const rgb = view === 'zones' ? zoneColor(mod.classify(v, thresholds), classes) : rampAt((v - range[0]) / Math.max(1e-6, range[1] - range[0]));
      img.data.set([...rgb, 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
  }, [raster, mod, view, thresholds, classes, range]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setBusy(true);
    let drone: DroneModule | null = null;
    try {
      const [m, d] = await Promise.all([import('../../imagery/vigor'), import('../../imagery/drone')]);
      drone = d;
      setMod(m);
      const r = await m.readVigor(file, farmCase.lotPolygon);
      if (!Array.from(r.values).some(Number.isFinite)) throw new d.DroneImageError('read', t('vra.outside'));
      setRaster(r);
    } catch (e) {
      setErr(drone && e instanceof drone.DroneImageError ? t(`drone.err.${e.code}`, { detail: e.detail, max: Math.round(drone.MAX_FILE_BYTES / 1e8) / 10 }) : String(e));
    } finally {
      setBusy(false);
    }
  };

  // Totals come from the same cells that are exported, so the screen and the file match.
  const cells = useMemo(() => (mod && raster ? mod.prescriptionGrid(raster, thresholds, rates.slice(0, classes), cellM) : []), [mod, raster, thresholds, rates, classes, cellM]);
  const { total, appliedHa, areaHa: lotHa } = mod ? mod.prescriptionTotals(cells) : { total: 0, appliedHa: 0, areaHa: 0 };
  const exportGrid = () => {
    if (!mod || !raster) return;
    const createdOn = new Date().toISOString().slice(0, 10);
    download(`prescripcion-${createdOn}.geojson`, 'application/geo+json', mod.prescriptionGeoJson(cells, { name: t('vra.fileName'), unit, createdOn }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#283618]">{t('vra.help')}</p>
      {demo ? <DemoLock what={t('demo.what.vigor')} /> : <div className="flex flex-wrap items-center gap-2">
        <label className={`${secondaryBtn} cursor-pointer`}>
          {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Upload aria-hidden className="h-4 w-4" />}
          {busy ? t('vra.reading') : t('vra.upload')}
          <input
            type="file"
            accept=".tif,.tiff,image/tiff"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        <span className="text-xs text-[#3B2F20]/85">{t('drone.privacy')}</span>
      </div>}
      {!farmCase.lotPolygon && <Notice tone="warn">{t('vra.noLot')}</Notice>}
      {err && <Notice tone="error">{err}</Notice>}

      {raster && mod && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
          <figure className="space-y-2">
            <div role="group" aria-label={t('vra.view')} className="flex gap-2">
              {(['zones', 'index'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`fs-press min-h-[40px] rounded-full border-2 px-4 text-sm font-bold ${view === v ? 'border-[#283618] bg-[#283618] text-[#FEFAE0]' : 'border-[#DECFA7] bg-white text-[#3B2F20]'}`}
                >
                  {t(`vra.view.${v}`)}
                </button>
              ))}
            </div>
            <canvas
              ref={canvas}
              role="img"
              aria-label={t('vra.mapLabel', { n: classes })}
              className="w-full rounded-xl border border-[#DECFA7] bg-[#E3EBDD]"
              style={{ imageRendering: 'pixelated', aspectRatio: `${raster.width} / ${raster.height}` }}
            />
            <figcaption className="text-xs text-[#3B2F20]/85">
              {t(raster.source === 'index' ? 'vra.sourceIndex' : 'vra.sourceComputed', { file: raster.name, epsg: raster.epsg })}
              {view === 'index' && ` ${t('vra.rampNote', { lo: num(range[0], 2), hi: num(range[1], 2) })}`}
            </figcaption>
          </figure>

          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm font-bold text-[#283618]">
                {t('vra.classes')}
                <select value={classes} onChange={(e) => setClasses(Number(e.target.value))} className="mt-1 block min-h-[44px] rounded-lg border border-[#DECFA7] bg-white px-2 font-normal">
                  {[2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold text-[#283618]">
                {t('vra.unit')}
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 block min-h-[44px] rounded-lg border border-[#DECFA7] bg-white px-2 font-normal">
                  <option value="L/ha">L/ha</option>
                  <option value="kg/ha">kg/ha</option>
                </select>
              </label>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#DECFA7] bg-white">
              <table className="w-full min-w-[420px] text-sm tabular-nums">
                <thead>
                  <tr className="text-left text-xs text-[#3B2F20]/80">
                    <th className="px-3 py-2 font-bold">{t('vra.col.zone')}</th>
                    <th className="px-3 py-2 font-bold text-right">{t('vra.col.ndvi')}</th>
                    <th className="px-3 py-2 font-bold text-right">{t('vra.col.area')}</th>
                    <th className="px-3 py-2 font-bold text-right">{t('vra.col.rate', { unit })}</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.zone} className="border-t border-[#EFE3C2]">
                      <th scope="row" className="px-3 py-2 text-left font-bold text-[#283618]">
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: hex(zoneColor(z.zone, classes)) }} />
                          {t(z.zone === 0 ? 'vra.zone.low' : z.zone === classes - 1 ? 'vra.zone.high' : 'vra.zone.mid', { n: z.zone + 1 })}
                        </span>
                      </th>
                      <td className="px-3 py-2 text-right">{Number.isFinite(z.mean) ? `${num(z.min, 2)}–${num(z.max, 2)}` : '—'}</td>
                      <td className="px-3 py-2 text-right">≈ {num(z.areaHa, 2)} ha</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step={0.5}
                          aria-label={t('vra.rateFor', { n: z.zone + 1 })}
                          value={rates[z.zone] ?? 0}
                          onChange={(e) => setRates(rates.map((r, i) => (i === z.zone ? Math.max(0, Number(e.target.value) || 0) : r)))}
                          className="w-20 min-h-[40px] rounded-lg border border-[#DECFA7] px-2 text-right"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-[#283618]">
              <strong>{t('vra.total', { total: num(total, 1), unit: unit.replace('/ha', ''), ha: num(appliedHa, 2), lot: num(lotHa, 2) })}</strong>
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm font-bold text-[#283618]">
                {t('vra.cell')}
                <select value={cellM} onChange={(e) => setCellM(Number(e.target.value))} className="mt-1 block min-h-[44px] rounded-lg border border-[#DECFA7] bg-white px-2 font-normal">
                  {[5, 8, 10, 20].map((m) => (
                    <option key={m} value={m}>
                      {m} m
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className={primaryBtn} onClick={exportGrid}>
                <Download aria-hidden className="h-4 w-4" /> {t('vra.export')}
              </button>
            </div>
            <p className="text-xs text-[#3B2F20]/85">{t('vra.note')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
