import { useEffect, useRef, useState } from 'react';
import L from '../../lib/leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Eraser, MapPin, PenLine, SquarePen } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { PLACE_PRESETS, type LotSource } from '../../case/model';
import type { LatLon } from '../../imagery/flightOrder';
import { validateLot } from '../../imagery/lotImport';
import { LotDocsPanel } from '../results/LotDocsPanel';
import { Notice, secondaryBtn } from '../ui';

const ESRI_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LOT_STYLE: L.PathOptions = { color: '#DDA15E', weight: 3, fillColor: '#DDA15E', fillOpacity: 0.15 };

function ringOf(layer: L.Polygon): LatLon[] {
  const rings = layer.getLatLngs() as L.LatLng[][];
  return (rings[0] ?? []).map((p) => [Number(p.lat.toFixed(7)), Number(p.lng.toFixed(7))] as LatLon);
}
function sameRing(a: LatLon[], b: LatLon[]): boolean {
  return a.length === b.length && a.every((p, i) => Math.abs(p[0] - b[i]![0]) < 1e-7 && Math.abs(p[1] - b[i]![1]) < 1e-7);
}

/**
 * Screen 1 ("Your field"): trace the lot on high-resolution imagery (Geoman, like AgroCordS) or import
 * the survey plan / cadastre file. The lot centre becomes the climate point (App does that).
 */
export function LotStart({
  lat,
  lon,
  polygon,
  source,
  onLot,
}: {
  lat: number;
  lon: number;
  polygon: LatLon[] | null;
  source: LotSource | null;
  onLot: (ring: LatLon[] | null, source: LotSource | null) => void;
}) {
  const { t, lang } = useLang();
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const polyLayer = useRef<L.Polygon | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const onLotRef = useRef(onLot);
  onLotRef.current = onLot;
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const [editing, setEditing] = useState(false);
  const [lotErr, setLotErr] = useState<string | null>(null);

  useEffect(() => {
    if (!host.current || map.current) return;
    const m = L.map(host.current, { scrollWheelZoom: false, maxZoom: 19 }).setView([lat, lon], polygon ? 14 : 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, zIndex: 0, attribution: '© OpenStreetMap' }).addTo(m);
    L.tileLayer(ESRI_URL, { maxNativeZoom: 17, maxZoom: 19, zIndex: 1, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' }).addTo(m);
    L.control.scale({ metric: true, imperial: false }).addTo(m);
    marker.current = L.circleMarker([lat, lon], { radius: 6, color: '#FEFAE0', weight: 2, fillColor: '#BC6C25', fillOpacity: 1, pmIgnore: true }).addTo(m);
    m.pm.addControls({
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
      layer.remove(); // rendered from state
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
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current?.pm.setLang(lang === 'es' ? 'es' : 'en', lang === 'es' ? { actions: { removeLastVertex: 'Deshacer' } } : undefined, 'en');
  }, [lang]);

  useEffect(() => {
    marker.current?.setLatLng([lat, lon]);
  }, [lat, lon]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const current = polyLayer.current;
    if (current && polygon && sameRing(ringOf(current), polygon)) return;
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
      onLotRef.current(ring, src?.kind === 'file' ? { ...src, edited: true } : { kind: 'drawn' });
    });
    polyLayer.current = layer;
    m.fitBounds(layer.getBounds(), { padding: [28, 28], animate: false });
  }, [polygon]);

  const startDraw = () => {
    setLotErr(null);
    map.current?.pm.enableDraw('Polygon');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-[#283618]">{t('start.goTo')}</span>
          {PLACE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => map.current?.setView([p.lat, p.lon], 14)}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-[#DECFA7] bg-white px-3 font-bold text-[#3B2F20] hover:border-[#A3B18A] focus-visible:outline-2 focus-visible:outline-[#BC6C25]"
            >
              <MapPin aria-hidden className="h-4 w-4" /> {t(`loc.place.${p.id}`)}
            </button>
          ))}
        </div>
        <div ref={host} role="application" aria-label={t('start.mapLabel')} className="h-[380px] sm:h-[460px] w-full rounded-xl border border-[#DECFA7] z-0" />
        <p className="mt-1 text-xs text-[#3B2F20]/80">{t('start.imagery')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={secondaryBtn} onClick={startDraw}>
            <PenLine aria-hidden className="h-4 w-4" /> {polygon ? t('lot.redraw') : t('lot.draw')}
          </button>
          {polygon && (
            <button type="button" className={secondaryBtn} aria-pressed={editing} onClick={() => map.current?.pm.toggleGlobalEditMode()}>
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
        {!polygon && !lotErr && <p className="mt-2 text-sm font-bold text-[#7A3F0C]">{t('start.empty')}</p>}
      </div>
      <LotDocsPanel
        onLot={(ring, src) => {
          setLotErr(null);
          onLot(ring, src);
        }}
      />
    </div>
  );
}
