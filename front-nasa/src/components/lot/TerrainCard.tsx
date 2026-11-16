import { useState } from 'react';
import { Loader2, RefreshCw, Upload } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { MIN_TERRAIN_SAMPLES, ringCentroid, type FarmCase } from '../../case/model';
import type { LotApi } from '../../case/lotApi';
import { areaHa } from '../../imagery/lotImport';
import { Notice, ProvTag, linkBtn, secondaryBtn } from '../ui';
import { useProfile } from '../../profile/ProfileContext';
import { DemoLock } from '../DemoLock';

function Row({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="rounded-lg bg-white border border-[#DECFA7] px-3 py-2">
      <dt className="text-xs font-bold text-[#3B2F20]/85">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold text-[#283618] tabular-nums">{children}</dd>
      {note && <dd className="text-[11px] text-[#3B2F20]/75">{note}</dd>}
    </div>
  );
}

/** "Datos del terreno": area, climate point and relief of the lot (NASA SRTM estimate or drone DSM). */
export function TerrainCard({ farmCase, lot }: { farmCase: FarmCase; lot: LotApi }) {
  const { demo } = useProfile();
  const { t, num } = useLang();
  const [dsmBusy, setDsmBusy] = useState(false);
  const [dsmErr, setDsmErr] = useState<string | null>(null);
  const ring = farmCase.lotPolygon;
  if (!ring) return null;
  const centre = ringCentroid(ring);
  const terrain = farmCase.terrain;

  const onDsm = async (file: File | undefined) => {
    if (!file) return;
    setDsmErr(null);
    setDsmBusy(true);
    try {
      const [dsm, drone] = await Promise.all([import('../../imagery/dsm'), import('../../imagery/drone')]);
      try {
        const res = await dsm.readDsm(file, ring);
        if (!res.stats || res.coverage < 0.05) {
          setDsmErr(t('terrain.dsm.noCover'));
          return;
        }
        const gsd = res.gsdM < 1 ? `${num(res.gsdM * 100, 1)} cm` : `${num(res.gsdM, 2)} m`;
        lot.setTerrain({
          source: 'drone',
          samples: res.stats.samples,
          meanM: res.stats.meanM,
          reliefM: res.stats.reliefM,
          slopePct: res.stats.slopePct,
          aspectDeg: res.stats.aspectDeg,
          slopeClass: res.stats.slopeClass,
          sources: [res.name, `EPSG:${res.epsg}`, gsd, String(Math.round(res.coverage * 100))],
        });
      } catch (err) {
        setDsmErr(
          err instanceof drone.DroneImageError
            ? t(`drone.err.${err.code}`, { detail: err.detail, max: Math.round(drone.MAX_FILE_BYTES / 1e8) / 10 })
            : String(err),
        );
      }
    } catch (err) {
      setDsmErr(t('drone.err.read', { detail: err instanceof Error ? err.message : String(err) }));
    } finally {
      setDsmBusy(false);
    }
  };

  const isDrone = terrain?.source === 'drone';
  const coverage = isDrone && terrain.sources[3] ? Number(terrain.sources[3]) : null;
  // Below ~0.5 % an SRTM plane is within the radar's noise: no drainage direction is claimed.
  const minAspectPct = isDrone ? 0.05 : 0.5;
  const dir = terrain?.aspectDeg != null && terrain.slopePct >= minAspectPct ? t(`terrain.dir.${Math.round(terrain.aspectDeg / 45) % 8}`) : null;
  const fewSamples = terrain?.source === 'srtm' && terrain.samples < MIN_TERRAIN_SAMPLES;
  const elevDigits = isDrone ? 2 : 0;
  const reliefDigits = isDrone ? 2 : 1;

  return (
    <section aria-labelledby="terrain-h" className="rounded-xl border-2 border-[#A3B18A] bg-[#F4F1E6] p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="terrain-h" className="text-lg font-bold text-[#283618]">
          {t('terrain.title')}
        </h2>
        {terrain && <ProvTag kind={isDrone ? 'measured' : 'source'} />}
      </div>

      <dl className="grid gap-2 grid-cols-2 lg:grid-cols-3">
        <Row label={t('terrain.area')}>{num(areaHa(ring), 1)} ha</Row>
        {centre && (
          <Row label={t('terrain.centre')}>
            <span className="text-base">
              {centre[0].toFixed(4)}, {centre[1].toFixed(4)}
            </span>
          </Row>
        )}
        {terrain && (
          <>
            <Row label={t('terrain.mean')}>{num(terrain.meanM, elevDigits)} m</Row>
            <Row label={t('terrain.relief')} note={t('terrain.reliefNote')}>
              {num(terrain.reliefM, reliefDigits)} m
            </Row>
            <Row label={t('terrain.slope')} note={t(`slope.${terrain.slopeClass}`)}>
              {num(terrain.slopePct, 1)} %
            </Row>
            <Row label={t('terrain.aspect')}>{dir ?? <span className="text-base">{t('terrain.noAspect')}</span>}</Row>
          </>
        )}
      </dl>

      {!terrain && lot.terrainStatus === 'loading' && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> {t('terrain.loading')}
        </p>
      )}
      {!terrain && lot.terrainStatus === 'error' && (
        <Notice tone="error">
          {t('terrain.error')}{' '}
          <button type="button" className={linkBtn} onClick={lot.retryTerrain}>
            <RefreshCw aria-hidden className="inline h-3.5 w-3.5" /> {t('terrain.retry')}
          </button>
        </Notice>
      )}

      {terrain && (
        <div className="space-y-2 text-xs text-[#3B2F20]/90">
          <p>
            {isDrone
              ? t('terrain.droneSource', { file: terrain.sources[0] ?? '', gsd: terrain.sources[2] ?? '', cov: coverage ?? '—' })
              : t('terrain.srtmSource', { sources: terrain.sources.join(', ') || 'SRTM', n: terrain.samples })}
          </p>
          {!isDrone && <p>{t('terrain.srtmCaveat')}</p>}
          {fewSamples && <Notice tone="warn">{t('terrain.fewSamples', { n: terrain.samples })}</Notice>}
          {isDrone && coverage !== null && coverage < 80 && <Notice tone="warn">{t('terrain.lowCoverage', { cov: coverage })}</Notice>}
          {farmCase.slope !== 'unknown' && farmCase.slopeSource && (
            <p className="text-sm text-[#283618]">
              <strong>{t('terrain.usedAs', { cls: t(`slope.${farmCase.slope}`), src: t(`terrain.src.${farmCase.slopeSource}`) })}</strong>
            </p>
          )}
          {farmCase.slopeSource === 'declared' && farmCase.slope !== terrain.slopeClass && !fewSamples && (
            <Notice tone="warn">
              {t('terrain.declaredDiffers', { declared: t(`slope.${farmCase.slope}`), measured: t(`slope.${terrain.slopeClass}`) })}{' '}
              <button type="button" className={linkBtn} onClick={() => lot.setSlope('unknown')}>
                {t('terrain.useMeasured')}
              </button>
            </Notice>
          )}
        </div>
      )}

      <div className="border-t border-[#DECFA7] pt-3 space-y-2">
        <h3 className="text-sm font-bold text-[#283618]">{t('terrain.dsm.title')}</h3>
        <p className="text-xs text-[#3B2F20]/90">{t('terrain.dsm.help')}</p>
        {demo ? <DemoLock what={t('demo.what.dsm')} compact /> : <div className="flex flex-wrap gap-2">
          <label className={`${secondaryBtn} cursor-pointer w-fit`}>
            {dsmBusy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Upload aria-hidden className="h-4 w-4" />}
            {dsmBusy ? t('terrain.dsm.reading') : t('terrain.dsm.upload')}
            <input
              type="file"
              accept=".tif,.tiff,image/tiff"
              className="sr-only"
              disabled={dsmBusy}
              onChange={(e) => {
                void onDsm(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {isDrone && (
            <button type="button" className={secondaryBtn} onClick={lot.dropDroneTerrain}>
              {t('terrain.dsm.remove')}
            </button>
          )}
        </div>}
        <p className="text-xs text-[#3B2F20]/80">{t('drone.privacy')}</p>
        {dsmErr && <Notice tone="error">{dsmErr}</Notice>}
      </div>
    </section>
  );
}
