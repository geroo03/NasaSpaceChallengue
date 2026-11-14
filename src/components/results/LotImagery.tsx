import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Download, Eraser, Loader2, MousePointerClick, PenLine, Upload, X } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { bestScene, hlsTileUrl, searchHlsScenes, type HlsScene } from '../../imagery/hls';
import type { Orthomosaic } from '../../imagery/drone';
import { buildFlightGeoJson, buildFlightKml, polygonAreaHa, type LatLon } from '../../imagery/flightOrder';
import { planFieldChecks } from '../../case/verification';
import type { StrategyResult } from '../../engine/domain/rotations';
import { Notice, ProvTag, secondaryBtn } from '../ui';

type Overlay = 'ndvi' | 'smap';

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
  onPolygon,
  strategy,
}: {
  lat: number;
  lon: number;
  polygon: LatLon[] | null;
  onPolygon: (p: LatLon[] | null) => void;
  strategy: StrategyResult;
}) {
  const { t, months, crop } = useLang();
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const hlsLayer = useRef<L.TileLayer | null>(null);
  const overlayLayers = useRef<Partial<Record<Overlay, L.TileLayer>>>({});
  const droneLayer = useRef<L.ImageOverlay | null>(null);
  const polyLayer = useRef<L.Polygon | L.Polyline | null>(null);

  const [scenes, setScenes] = useState<HlsScene[] | null>(null);
  const [sceneErr, setSceneErr] = useState<string | null>(null);
  const [scene, setScene] = useState<HlsScene | null>(null);
  const [overlays, setOverlays] = useState<Record<Overlay, boolean>>({ ndvi: false, smap: false });
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<LatLon[]>([]);
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
    L.circleMarker([lat, lon], { radius: 7, color: '#BC6C25', weight: 3, fillColor: '#FEFAE0', fillOpacity: 0.9 }).addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current?.setView([lat, lon], map.current.getZoom());
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
    const m = map.current;
    if (!m) return;
    hlsLayer.current?.remove();
    hlsLayer.current = null;
    if (scene) {
      hlsLayer.current = L.tileLayer(hlsTileUrl(scene.sensor, scene.date), {
        maxNativeZoom: 12,
        maxZoom: 19,
        zIndex: 1,
        attribution: `NASA HLS ${scene.sensor} · ${scene.date}`,
      }).addTo(m);
    }
  }, [scene]);

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
    ], { opacity: droneOpacity, interactive: false }).addTo(m);
    m.fitBounds([
      [b.south, b.west],
      [b.north, b.east],
    ], { padding: [20, 20] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drone]);

  useEffect(() => {
    droneLayer.current?.setOpacity(droneOpacity);
  }, [droneOpacity]);

  // --- lot polygon ---------------------------------------------------------------------------
  const shown = drawing ? draft : (polygon ?? []);
  useEffect(() => {
    const m = map.current;
    polyLayer.current?.remove();
    polyLayer.current = null;
    if (!m || shown.length === 0) return;
    const style = { color: '#BC6C25', weight: 3, fillColor: '#BC6C25', fillOpacity: 0.12, dashArray: drawing ? '6 6' : undefined };
    polyLayer.current = (drawing || shown.length < 3 ? L.polyline(shown, style) : L.polygon(shown, style)).addTo(m);
  }, [shown, drawing]);

  useEffect(() => {
    const m = map.current;
    if (!m || !drawing) return;
    const onClick = (e: L.LeafletMouseEvent) => setDraft((d) => [...d, [Number(e.latlng.lat.toFixed(7)), Number(e.latlng.lng.toFixed(7))]]);
    m.on('click', onClick);
    m.getContainer().style.cursor = 'crosshair';
    return () => {
      m.off('click', onClick);
      m.getContainer().style.cursor = '';
    };
  }, [drawing]);

  const startDraw = () => {
    setDraft([]);
    setDrawing(true);
  };
  const finishDraw = () => {
    setDrawing(false);
    if (draft.length >= 3) onPolygon(draft);
  };

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
        const cell = strategy.timeline[c.month];
        const when = `${cell ? months[cell.calendarMonth - 1] : ''} · ${t('scene.year', { n: c.month < 12 ? 1 : 2 })}`;
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
          <div ref={host} role="application" aria-label={t('lot.mapLabel')} className="h-[380px] sm:h-[460px] w-full rounded-xl border border-[#DECFA7] z-0" />
          <div className="mt-2 flex flex-wrap gap-2">
            {!drawing ? (
              <button type="button" className={secondaryBtn} onClick={startDraw}>
                <PenLine aria-hidden className="h-4 w-4" /> {polygon ? t('lot.redraw') : t('lot.draw')}
              </button>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#283618]">
                  <MousePointerClick aria-hidden className="h-4 w-4" /> {t('lot.drawHint', { n: draft.length })}
                </span>
                <button type="button" className={secondaryBtn} disabled={draft.length < 3} onClick={finishDraw}>
                  {t('lot.finish')}
                </button>
                <button type="button" className={secondaryBtn} onClick={() => setDrawing(false)}>
                  {t('lot.cancel')}
                </button>
              </>
            )}
            {polygon && !drawing && (
              <button type="button" className={secondaryBtn} onClick={() => onPolygon(null)}>
                <Eraser aria-hidden className="h-4 w-4" /> {t('lot.clear')}
              </button>
            )}
          </div>
          {polygon && !drawing && (
            <p className="mt-2 text-sm">
              <ProvTag kind="declared" /> {t('lot.area', { ha: polygonAreaHa(polygon).toFixed(1) })}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <fieldset>
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
        <label className={`${secondaryBtn} cursor-pointer w-fit`}>
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
        </label>
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
                  onPolygon([
                    [drone.bounds.south, drone.bounds.west],
                    [drone.bounds.south, drone.bounds.east],
                    [drone.bounds.north, drone.bounds.east],
                    [drone.bounds.north, drone.bounds.west],
                  ])
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
