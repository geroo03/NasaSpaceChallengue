import { useEffect, useMemo, useRef, useState } from 'react';
import L from '../../lib/leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Download, Eraser, Loader2, Maximize2, Minimize2, PenLine, SquarePen, Upload, X } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { bestScene, hlsTileUrl, searchHlsScenes, type HlsScene } from '../../imagery/hls';
import type { Orthomosaic } from '../../imagery/drone';
import { buildFlightGeoJson, buildFlightKml, type LatLon } from '../../imagery/flightOrder';
import { areaHa, validateLot } from '../../imagery/lotImport';
import type { LotSource } from '../../case/model';
import { LotDocsPanel } from './LotDocsPanel';
import { planFieldChecks } from '../../case/verification';
import type { StrategyResult } from '../../engine/domain/rotations';
import { Notice, ProvTag, secondaryBtn } from '../ui';
import { useProfile } from '../../profile/ProfileContext';
import { DemoLock } from '../DemoLock';

type Overlay = 'ndvi' | 'smap';
type Base = 'hls' | 'esri';

const ESRI_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LOT_STYLE: L.PathOptions = { color: '#BC6C25', weight: 3, fillColor: '#BC6C25', fillOpacity: 0.12 };

function ringOf(layer: L.Polygon): LatLon[] {
  const rings = layer.getLatLngs() as L.LatLng[][];
  return (rings[0] ?? []).map((p) => [Number(p.lat.toFixed(7)), Number(p.lng.toFixed(7))] as LatLon);
}
function sameRing(a: LatLon[], b: LatLon[]): boolean {
  return a.length === b.length && a.every((p, i) => Math.abs(p[0] - b[i]![0]) < 1e-7 && Math.abs(p[1] - b[i]![1]) < 1e-7);
}

const gibsDate = new Date(Date.now() - 20 * 86_400_000).toISOString().slice(0, 10);
const OVERLAY_URL: Record<Overlay, { url: string; native: number }> = {
  ndvi: {
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_NDVI_16Day/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
    native: 9,
  },
  smap: {
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Root_Zone_Soil_Moisture/default/${gibsDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
    native: 6,
  },
};

function download(name: string, mime: string, text: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function LotImagery({
  lat,
  lon,
  polygon,
  source,
  onLot,
  strategy,
}: {
  lat: number;
  lon: number;
  polygon: LatLon[] | null;
  source: LotSource | null;
  onLot: (p: LatLon[] | null, source: LotSource | null) => void;
  strategy: StrategyResult;
}) {
  const { t, months, crop, lang, num } = useLang();
  const { demo } = useProfile();
  const demoRef = useRef(demo);
  demoRef.current = demo;
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const hlsLayer = useRef<L.TileLayer | null>(null);
  const overlayLayers = useRef<Partial<Record<Overlay, L.TileLayer>>>({});
  const droneLayer = useRef<L.ImageOverlay | null>(null);
  const polyLayer = useRef<L.Polygon | null>(null);
  const baseLayer = useRef<L.TileLayer | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const onLotRef = useRef(onLot);
  onLotRef.current = onLot;
  const sourceRef = useRef(source);
  sourceRef.current = source;

  const [scenes, setScenes] = useState<HlsScene[] | null>(null);
  const [sceneErr, setSceneErr] = useState<string | null>(null);
  const [scene, setScene] = useState<HlsScene | null>(null);
  const [overlays, setOverlays] = useState<Record<Overlay, boolean>>({ ndvi: false, smap: false });
  const [base, setBase] = useState<Base>('hls');
  const [editing, setEditing] = useState(false);
  const [big, setBig] = useState(false);
  const [lotErr, setLotErr] = useState<string | null>(null);
  const [drone, setDrone] = useState<Orthomosaic | null>(null);
  const [droneBusy, setDroneBusy] = useState(false);
  const [droneErr, setDroneErr] = useState<string | null>(null);
  const [droneOpacity, setDroneOpacity] = useState(1);

  // --- map setup ---------------------------------------------------------------------------
  useEffect(() => {
    if (!host.current || map.current) return;
    const m = L.map(host.current, { scrollWheelZoom: false, maxZoom: 19 }).setView([lat, lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, zIndex: 0, attribution: '© OpenStreetMap' }).addTo(m);
    L.control.scale({ metric: true, imperial: false }).addTo(m);
    marker.current = L.circleMarker([lat, lon], { radius: 7, color: '#BC6C25', weight: 3, fillColor: '#FEFAE0', fillOpacity: 0.9, pmIgnore: true }).addTo(m);
    // Drawing like AgroCordS: Geoman polygon tool with finish / undo / cancel actions on the map.
    if (!demoRef.current) m.pm.addControls({
      position: 'topleft',
      drawPolygon: true,
      drawMarker: false,
      drawCircleMarker: false,
      drawCircle: false,
      drawPolyline: false,
      drawRectangle: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
      rotateMode: false,
    });
    m.pm.setGlobalOptions({ allowSelfIntersection: false, snappable: false, pathOptions: LOT_STYLE });
    m.on('pm:create', (e: { layer: L.Layer }) => {
      const layer = e.layer as L.Polygon;
      const ring = ringOf(layer);
      layer.remove(); // the lot is rendered from state
      const problem = validateLot(ring);
      if (problem) {
        setLotErr(problem);
        return;
      }
      setLotErr(null);
      onLotRef.current(ring, { kind: 'drawn' });
    });
    m.on('pm:globaleditmodetoggled', (e: { enabled: boolean }) => setEditing(e.enabled));
    map.current = m;
    // The workspace keeps this map mounted when another view is open.
    const resize = new ResizeObserver(() => {
      if (host.current?.clientWidth) m.invalidateSize();
    });
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    marker.current?.setLatLng([lat, lon]);
    if (!polyLayer.current) map.current?.setView([lat, lon], map.current.getZoom());
  }, [lat, lon]);

  // --- HLS scenes ----------------------------------------------------------------------------
  useEffect(() => {
    let alive = true;
    setScenes(null);
    setSceneErr(null);
    searchHlsScenes(lat, lon)
      .then((list) => {
        if (!alive) return;
        setScenes(list);
        setScene(bestScene(list) ?? list[0] ?? null);
      })
      .catch((err: unknown) => alive && setSceneErr(err instanceof Error ? err.message : String(err)));
    return () => {
      alive = false;
    };
  }, [lat, lon]);

  useEffect(() => {
    map.current?.pm.setLang(lang === 'es' ? 'es' : 'en', lang === 'es' ? { actions: { removeLastVertex: 'Deshacer' } } : undefined, 'en');
  }, [lang]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    baseLayer.current?.remove();
    baseLayer.current = null;
    if (base === 'esri') {
      baseLayer.current = L.tileLayer(ESRI_URL, { maxNativeZoom: 17, maxZoom: 19, zIndex: 1, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' }).addTo(m);
    }
  }, [base]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    hlsLayer.current?.remove();
    hlsLayer.current = null;
    if (scene && base === 'hls') {
      hlsLayer.current = L.tileLayer(hlsTileUrl(scene.sensor, scene.date), {
        maxNativeZoom: 12,
        maxZoom: 19,
        zIndex: 1,
        attribution: `NASA HLS ${scene.sensor} · ${scene.date}`,
      }).addTo(m);
    }
  }, [scene, base]);

  // --- regional overlays ---------------------------------------------------------------------
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    (Object.keys(OVERLAY_URL) as Overlay[]).forEach((k) => {
      const on = overlays[k];
      const existing = overlayLayers.current[k];
      if (on && !existing) {
        overlayLayers.current[k] = L.tileLayer(OVERLAY_URL[k].url, { maxNativeZoom: OVERLAY_URL[k].native, maxZoom: 19, opacity: 0.6, zIndex: 2 }).addTo(m);
      } else if (!on && existing) {
        existing.remove();
        delete overlayLayers.current[k];
      }
    });
  }, [overlays]);

  // --- drone overlay -------------------------------------------------------------------------
  useEffect(() => {
    const m = map.current;
    droneLayer.current?.remove();
    droneLayer.current = null;
    if (!m || !drone) return;
    const b = drone.bounds;
    droneLayer.current = L.imageOverlay(drone.preview, [
      [b.south, b.west],
      [b.north, b.east],
    ], { opacity: droneOpacity, interactive: false, pmIgnore: true }).addTo(m);
    m.fitBounds([
      [b.south, b.west],
      [b.north, b.east],
    ], { padding: [20, 20] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drone]);

  useEffect(() => {
    droneLayer.current?.setOpacity(droneOpacity);
  }, [droneOpacity]);

  // --- enlarged map (Esc closes) -----------------------------------------------------------
  useEffect(() => {
    const t1 = setTimeout(() => {
      const m = map.current;
      if (!m) return;
      m.invalidateSize();
      const lot = polyLayer.current;
      if (lot) m.fitBounds(lot.getBounds(), { padding: [32, 32] });
    }, 60);
    if (!big) return () => clearTimeout(t1);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBig(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t1);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [big]);

  // --- lot polygon ---------------------------------------------------------------------------
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const current = polyLayer.current;
    if (current && polygon && sameRing(ringOf(current), polygon)) return; // edit already reflected
    current?.remove();
    polyLayer.current = null;
    if (!polygon || polygon.length < 3) return;
    const layer = L.polygon(polygon, LOT_STYLE).addTo(m);
    layer.on('pm:edit', () => {
      const ring = ringOf(layer);
      const problem = validateLot(ring);
      if (problem) {
        setLotErr(problem);
        return;
      }
      setLotErr(null);
      const src = sourceRef.current;
      // An imported boundary stays 'file' but is marked as hand-edited, so its provenance stays honest.
      onLotRef.current(ring, src?.kind === 'file' ? { ...src, edited: true } : { kind: 'drawn' });
    });
    polyLayer.current = layer;
    if (!m.getBounds().contains(layer.getBounds())) m.fitBounds(layer.getBounds(), { padding: [24, 24], animate: false });
  }, [polygon]);

  const startDraw = () => {
    setLotErr(null);
    map.current?.pm.enableDraw('Polygon');
  };
  const toggleEdit = () => map.current?.pm.toggleGlobalEditMode();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setDroneErr(null);
    setDroneBusy(true);
    try {
      // geotiff + proj4 are only downloaded when someone actually loads a drone image.
      const mod = await import('../../imagery/drone');
      try {
        setDrone(await mod.readOrthomosaic(file));
      } catch (err) {
        setDroneErr(
          err instanceof mod.DroneImageError
            ? t(`drone.err.${err.code}`, { detail: err.detail, max: Math.round(mod.MAX_FILE_BYTES / 1e8) / 10 })
            : String(err),
        );
      }
    } catch (err) {
      setDroneErr(t('drone.err.read', { detail: err instanceof Error ? err.message : String(err) }));
    } finally {
      setDroneBusy(false);
    }
  };

  // --- flight order --------------------------------------------------------------------------
  const checks = useMemo(
    () =>
      planFieldChecks(strategy).map((c) => {
        const monthLabel = (index: number) => {
          const cell = strategy.timeline[index];
          return `${cell ? months[cell.calendarMonth - 1] : ''} · ${t('scene.year', { n: index < 12 ? 1 : 2 })}`;
        };
        const when = c.untilMonth !== undefined && c.untilMonth !== c.month
          ? `${monthLabel(c.month)} → ${monthLabel(c.untilMonth)}` : monthLabel(c.month);
        return { when, what: t(`verify.${c.kind}`, { crop: c.crop ? crop(c.crop) : '', deficit: c.deficitPct ?? 0 }) };
      }),
    [strategy, months, t, crop],
  );
  const exportOrder = (fmt: 'kml' | 'geojson') => {
    if (!polygon) return;
    const order = {
      title: t('flight.fileTitle', { template: t(`template.${strategy.templateId}`) }),
      polygon,
      checks,
      createdOn: new Date().toISOString().slice(0, 10),
      notes: [t('flight.pilotNote')],
    };
    const stamp = order.createdOn;
    if (fmt === 'kml') download(`orden-de-vuelo-${stamp}.kml`, 'application/vnd.google-earth.kml+xml', buildFlightKml(order));
    else download(`orden-de-vuelo-${stamp}.geojson`, 'application/geo+json', buildFlightGeoJson(order));
  };

  const clearList = scenes?.filter((s) => s.cloudPct !== null && s.cloudPct <= 60).slice(0, 8) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <ProvTag kind="source" />
        <ProvTag kind="notUsed" />
        <span className="text-xs text-[#3B2F20]/85">{t('lot.help')}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div>
          <div className={big ? 'fixed inset-0 z-[1500] bg-fondo p-2 sm:p-4 flex flex-col' : 'relative'}>
            {/* className must stay constant: Leaflet adds its own classes to this element and React would wipe them. */}
            <div className={big ? 'flex-1 min-h-0' : 'h-[380px] sm:h-[460px]'}>
              <div ref={host} role="application" aria-label={t('lot.mapLabel')} className="h-full w-full rounded-xl border border-[#DECFA7] z-0" />
            </div>
            <button
              type="button"
              onClick={() => setBig(!big)}
              aria-pressed={big}
              className={`absolute ${big ? 'top-5 right-5 sm:top-7 sm:right-7' : 'top-3 right-3'} z-[1000] inline-flex items-center gap-1.5 rounded-lg bg-white/95 border border-[#DECFA7] px-3 py-2 text-sm font-bold text-[#283618] shadow focus-visible:outline-2 focus-visible:outline-[#BC6C25]`}
            >
              {big ? <Minimize2 aria-hidden className="h-4 w-4" /> : <Maximize2 aria-hidden className="h-4 w-4" />}
              {big ? t('lot.closeMap') : t('lot.bigMap')}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={startDraw}>
              <PenLine aria-hidden className="h-4 w-4" /> {polygon ? t('lot.redraw') : t('lot.draw')}
            </button>
            {polygon && (
              <button type="button" className={secondaryBtn} aria-pressed={editing} onClick={toggleEdit}>
                <SquarePen aria-hidden className="h-4 w-4" /> {editing ? t('lot.editDone') : t('lot.edit')}
              </button>
            )}
            {polygon && (
              <button type="button" className={secondaryBtn} onClick={() => onLot(null, null)}>
                <Eraser aria-hidden className="h-4 w-4" /> {t('lot.clear')}
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-[#3B2F20]/85">{t('lot.drawHelp')}</p>
          {lotErr && (
            <div className="mt-2">
              <Notice tone="error">{t(`lot.problem.${lotErr}`)}</Notice>
            </div>
          )}
          {polygon && (
            <p className="mt-2 text-sm flex flex-wrap items-center gap-2">
              <ProvTag kind="declared" />
              <span>
                {t('lot.area', { ha: num(areaHa(polygon), 1) })}{' '}
                {source && t(`lot.source.${source.kind}`, { file: source.parcel && source.parcel !== source.fileName ? `${source.fileName ?? ''} · ${source.parcel}` : (source.fileName ?? '') })}
                {source?.edited && ` ${t('lot.source.edited')}`}
              </span>
            </p>
          )}
          <div className="mt-4">
            {demo ? <DemoLock what={t('demo.what.plan')} /> : <LotDocsPanel onLot={(ring, src) => { setLotErr(null); onLot(ring, src); }} />}
          </div>
        </div>

        <div className="space-y-4">
          <fieldset>
            <legend className="text-sm font-bold text-[#283618]">{t('lot.base')}</legend>
            {(['hls', 'esri'] as Base[]).map((b) => (
              <label key={b} className="mt-1.5 flex items-start gap-2 text-sm">
                <input type="radio" name="lot-base" className="mt-1 accent-[#BC6C25]" checked={base === b} onChange={() => setBase(b)} />
                <span>
                  {t(`lot.base.${b}`)}
                  <span className="block text-xs text-[#3B2F20]/75">{t(`lot.base.${b}.d`)}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset disabled={base !== 'hls'} className="disabled:opacity-50">
            <legend className="text-sm font-bold text-[#283618]">{t('lot.scenes')}</legend>
            <p className="text-xs text-[#3B2F20]/80 mt-0.5">{t('lot.scenesHelp')}</p>
            {!scenes && !sceneErr && (
              <p className="mt-2 flex items-center gap-2 text-sm" role="status">
                <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> {t('lot.loadingScenes')}
              </p>
            )}
            {sceneErr && <p className="mt-2 text-sm text-[#6E2414]">{t('lot.scenesError')}</p>}
            {scenes && clearList.length === 0 && <p className="mt-2 text-sm">{t('lot.noScenes')}</p>}
            <div className="mt-2 space-y-1.5" role="radiogroup" aria-label={t('lot.scenes')}>
              {clearList.map((s) => (
                <button
                  key={`${s.date}-${s.sensor}`}
                  type="button"
                  role="radio"
                  aria-checked={scene?.date === s.date && scene.sensor === s.sensor}
                  onClick={() => setScene(s)}
                  className={`w-full flex justify-between rounded-lg border px-3 py-2 text-sm text-left focus-visible:outline-2 focus-visible:outline-[#BC6C25] ${
                    scene?.date === s.date && scene.sensor === s.sensor ? 'border-[#283618] bg-[#E3EBDD] font-bold' : 'border-[#DECFA7] bg-white'
                  }`}
                >
                  <span>
                    {s.date} · {t(`lot.sensor.${s.sensor}`)}
                  </span>
                  <span className="tabular-nums">{t('lot.cloud', { v: Math.round(s.cloudPct ?? 0) })}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#3B2F20]/80">{t('lot.hlsNote')}</p>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold text-[#283618]">{t('lot.regional')}</legend>
            {(['ndvi', 'smap'] as Overlay[]).map((k) => (
              <label key={k} className="mt-1.5 flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 accent-[#BC6C25]" checked={overlays[k]} onChange={(e) => setOverlays({ ...overlays, [k]: e.target.checked })} />
                <span>
                  {t(`sat.${k}`)}
                  <span className="block text-xs text-[#3B2F20]/75">{t(`lot.${k}Res`)}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      </div>

      {/* Drone orthomosaic */}
      <div className="rounded-xl border border-[#DECFA7] bg-[#FEFAE0] p-4 space-y-3">
        <h3 className="font-bold text-[#283618]">{t('drone.title')}</h3>
        <p className="text-sm text-[#3B2F20]/90">{t('drone.help')}</p>
        {demo ? <DemoLock what={t('demo.what.ortho')} /> : <label className={`${secondaryBtn} cursor-pointer w-fit`}>
          {droneBusy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Upload aria-hidden className="h-4 w-4" />}
          {droneBusy ? t('drone.reading') : t('drone.upload')}
          <input
            type="file"
            accept=".tif,.tiff,image/tiff"
            className="sr-only"
            disabled={droneBusy}
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>}
        <p className="text-xs text-[#3B2F20]/80">{t('drone.privacy')}</p>
        {droneErr && <Notice tone="error">{droneErr}</Notice>}
        {drone && (
          <div className="rounded-lg border border-[#A3B18A] bg-white p-3 text-sm space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-[#283618] break-all">{drone.name}</p>
                <p className="text-xs text-[#3B2F20]/85">
                  {t('drone.meta', {
                    epsg: drone.epsg,
                    gsd: drone.gsdM < 1 ? `${(drone.gsdM * 100).toFixed(1)} cm` : `${drone.gsdM.toFixed(2)} m`,
                    ha: drone.areaHa.toFixed(1),
                    w: drone.sourceWidth,
                    h: drone.sourceHeight,
                  })}
                </p>
              </div>
              <button type="button" aria-label={t('drone.remove')} onClick={() => setDrone(null)} className="rounded p-1 hover:bg-[#EFE3C2]">
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <label className="block text-xs font-bold">
              {t('drone.opacity')}
              <input type="range" min={0.2} max={1} step={0.1} value={droneOpacity} onChange={(e) => setDroneOpacity(Number(e.target.value))} className="w-full accent-[#BC6C25]" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryBtn}
                onClick={() =>
                  onLot(
                    [
                      [drone.bounds.south, drone.bounds.west],
                      [drone.bounds.south, drone.bounds.east],
                      [drone.bounds.north, drone.bounds.east],
                      [drone.bounds.north, drone.bounds.west],
                    ],
                    { kind: 'drone', fileName: drone.name },
                  )
                }
              >
                {t('drone.useAsLot')}
              </button>
            </div>
            <p className="text-xs text-[#3B2F20]/75">{t('drone.placement')}</p>
          </div>
        )}
      </div>

      {/* Flight order */}
      <div className="rounded-xl border-2 border-[#A3B18A] bg-[#E3EBDD] p-4 space-y-3">
        <h3 className="font-bold text-[#283618]">{t('flight.title')}</h3>
        <p className="text-sm text-[#283618]">{t('flight.help')}</p>
        {!polygon ? (
          <p className="text-sm font-bold text-[#7A3F0C]">{t('flight.needPolygon')}</p>
        ) : (
          <>
            <ul className="list-disc pl-5 text-sm space-y-0.5">
              {checks.map((c, i) => (
                <li key={i}>
                  <strong>{c.when}:</strong> {c.what}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={secondaryBtn} onClick={() => exportOrder('kml')}>
                <Download aria-hidden className="h-4 w-4" /> {t('flight.kml')}
              </button>
              <button type="button" className={secondaryBtn} onClick={() => exportOrder('geojson')}>
                <Download aria-hidden className="h-4 w-4" /> {t('flight.geojson')}
              </button>
            </div>
          </>
        )}
        <p className="text-xs text-[#283618]/85">{t('flight.pilotNote')}</p>
      </div>
    </div>
  );
}
