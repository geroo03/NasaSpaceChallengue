import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/** Point picker. Leaflet is driven imperatively; React only passes the point in and out. */
export function MapPicker({ lat, lon, label, onPick }: { lat: number; lon: number; label: string; onPick: (lat: number, lon: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    if (!host.current || map.current) return;
    const m = L.map(host.current, { scrollWheelZoom: false }).setView([lat, lon], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(m);
    marker.current = L.circleMarker([lat, lon], { radius: 9, color: '#BC6C25', weight: 3, fillColor: '#FEFAE0', fillOpacity: 0.9 }).addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => {
      const lng = L.Util.wrapNum(e.latlng.lng, [-180, 180], true);
      pickRef.current(Number(e.latlng.lat.toFixed(4)), Number(lng.toFixed(4)));
    });
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current || !marker.current) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    marker.current.setLatLng([lat, lon]);
    map.current.panTo([lat, lon]);
  }, [lat, lon]);

  return <div ref={host} role="application" aria-label={label} className="h-64 sm:h-80 w-full rounded-xl border border-[#DECFA7] z-0" />;
}
