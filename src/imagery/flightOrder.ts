/**
 * Flight order for a drone pilot: the lot polygon the farmer drew + what to check and when.
 * Exported as KML (importable as a mapping area in DJI Pilot 2 and most GIS tools) and GeoJSON.
 * Field Shift does not plan the flight itself (altitude, overlap): the pilot does.
 */

export type LatLon = [number, number]; // [lat, lon]

export interface FlightCheck {
  when: string;
  what: string;
}

export interface FlightOrder {
  title: string;
  polygon: LatLon[];
  checks: FlightCheck[];
  createdOn: string; // YYYY-MM-DD
  notes: string[];
}

/**
 * Area of a lat/lon polygon in hectares on a sphere of mean Earth radius (same formula and radius as @turf/area),
 * so every screen and export reports the same number without loading Turf.
 */
export function polygonAreaHa(poly: LatLon[]): number {
  if (poly.length < 3) return 0;
  const R = 6_371_008.8; // mean Earth radius, as Turf 7
  const rad = Math.PI / 180;
  let total = 0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const lower = poly[i]!;
    const middle = poly[(i + 1) % n]!;
    const upper = poly[(i + 2) % n]!;
    total += (upper[1] * rad - lower[1] * rad) * Math.sin(middle[0] * rad);
  }
  return Math.abs((total * R * R) / 2) / 10_000;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ring(poly: LatLon[]): LatLon[] {
  const first = poly[0];
  const last = poly[poly.length - 1];
  if (!first || !last) return poly;
  return first[0] === last[0] && first[1] === last[1] ? poly : [...poly, first];
}

export function buildFlightKml(o: FlightOrder): string {
  if (o.polygon.length < 3) throw new Error('polygon needs 3+ vertices');
  const coords = ring(o.polygon)
    .map(([lat, lon]) => `${lon.toFixed(7)},${lat.toFixed(7)},0`)
    .join(' ');
  const desc = [
    `Área aproximada: ${polygonAreaHa(o.polygon).toFixed(1)} ha`,
    ...o.checks.map((c) => `• ${c.when}: ${c.what}`),
    ...o.notes,
    `Generado por Field Shift Lab el ${o.createdOn}.`,
  ].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${esc(o.title)}</name>
    <Placemark>
      <name>${esc(o.title)}</name>
      <description>${esc(desc)}</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coords}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>
`;
}

export function buildFlightGeoJson(o: FlightOrder): string {
  if (o.polygon.length < 3) throw new Error('polygon needs 3+ vertices');
  return JSON.stringify(
    {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            title: o.title,
            areaHa: Number(polygonAreaHa(o.polygon).toFixed(2)),
            checks: o.checks,
            notes: o.notes,
            createdOn: o.createdOn,
            generator: 'Field Shift Lab',
          },
          geometry: { type: 'Polygon', coordinates: [ring(o.polygon).map(([lat, lon]) => [lon, lat])] },
        },
      ],
    },
    null,
    2,
  );
}
