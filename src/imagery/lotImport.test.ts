import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import proj4 from 'proj4';
import DxfParser from 'dxf-parser';
import { proj4DefFor } from './crs';
import {
  areaHa,
  formatOf,
  LotImportError,
  polygonsFromDxfEntities,
  polygonsFromGeoJson,
  polygonsFromKml,
  polygonsFromKmz,
  validateLot,
} from './lotImport';
import type { LatLon } from './flightOrder';

// ~1 km × 1 km (≈100 ha) near Añatuya
const lat = -28.47;
const lon = -62.85;
const dLat = 1000 / 110_574;
const dLon = 1000 / (111_320 * Math.cos((lat * Math.PI) / 180));
const square: LatLon[] = [
  [lat, lon],
  [lat, lon + dLon],
  [lat + dLat, lon + dLon],
  [lat + dLat, lon],
];
const kmlCoords = [...square, square[0]!].map(([a, o]) => `${o},${a},0`).join(' ');
const kml = `<?xml version="1.0"?><kml><Document>
  <Placemark><name><![CDATA[Parcela 123-45]]></name><Polygon><outerBoundaryIs><LinearRing><coordinates>
    ${kmlCoords}
  </coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
  <Placemark><name>Camino</name><LineString><coordinates>-62.8,-28.4,0 -62.7,-28.4,0</coordinates></LineString></Placemark>
</Document></kml>`;

describe('lot validation (same rules as AgroCordS)', () => {
  it('measures area geodesically', () => {
    expect(areaHa(square)).toBeGreaterThan(99);
    expect(areaHa(square)).toBeLessThan(101);
  });

  it('accepts a normal lot and rejects self-intersecting, tiny or huge ones', () => {
    expect(validateLot(square)).toBeNull();
    const bowtie: LatLon[] = [square[0]!, square[2]!, square[1]!, square[3]!];
    expect(validateLot(bowtie)).toBe('selfIntersection');
    expect(validateLot(square.map(([a, o]) => [lat + (a - lat) / 20, lon + (o - lon) / 20] as LatLon))).toBe('tooSmall');
    expect(validateLot(square.map(([a, o]) => [lat + (a - lat) * 10, lon + (o - lon) * 10] as LatLon))).toBe('tooLarge');
    expect(validateLot(square.slice(0, 2))).toBe('tooFewVertices');
  });
});

describe('survey document import', () => {
  it('reads polygons from KML, keeps names and ignores lines', () => {
    const polys = polygonsFromKml(kml);
    expect(polys).toHaveLength(1);
    expect(polys[0]?.name).toBe('Parcela 123-45');
    expect(polys[0]?.ring).toHaveLength(4); // closing vertex dropped
    expect(polys[0]?.ring[0]?.[0]).toBeCloseTo(lat, 6);
  });

  it('reads the KML inside a KMZ', () => {
    const kmz = zipSync({ 'doc.kml': strToU8(kml) });
    expect(polygonsFromKmz(kmz)[0]?.name).toBe('Parcela 123-45');
  });

  it('reads GeoJSON features, multipolygons and cadastre-style names', () => {
    const ring = [...square, square[0]!].map(([a, o]) => [o, a]);
    const fc = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { NOMENCLATURA: '07-01-123' }, geometry: { type: 'Polygon', coordinates: [ring] } },
        { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: [[ring], [ring]] } },
      ],
    };
    const polys = polygonsFromGeoJson(fc);
    expect(polys).toHaveLength(3);
    expect(polys[0]?.name).toBe('07-01-123');
  });

  it('refuses projected coordinates in GeoJSON instead of misplacing them', () => {
    const projected = { type: 'Polygon', coordinates: [[[4400000, 6850000], [4401000, 6850000], [4401000, 6851000], [4400000, 6850000]]] };
    expect(() => polygonsFromGeoJson(projected)).toThrow(LotImportError);
  });

  it('reads a closed polyline from a real DXF in POSGAR 2007 faja 4', () => {
    const def = proj4DefFor(5346)!;
    const pts = square.map(([a, o]) => proj4('EPSG:4326', def, [o, a]) as [number, number]);
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'LWPOLYLINE', '8', 'MENSURA', '90', String(pts.length), '70', '1',
      ...pts.flatMap(([x, y]) => ['10', x.toFixed(3), '20', y.toFixed(3)]),
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const parsed = new DxfParser().parseSync(dxf) as unknown as { entities: never[] };
    const polys = polygonsFromDxfEntities(parsed.entities, 5346);
    expect(polys).toHaveLength(1);
    expect(polys[0]?.name).toContain('MENSURA');
    expect(polys[0]?.ring[0]?.[0]).toBeCloseTo(lat, 5);
    expect(polys[0]?.ring[0]?.[1]).toBeCloseTo(lon, 5);
    expect(polys[0]?.areaHa).toBeGreaterThan(99);
  });

  it('maps file extensions to formats', () => {
    expect(formatOf('Plano Mensura.DXF')).toBe('dxf');
    expect(formatOf('catastro.zip')).toBe('shp');
    expect(formatOf('lote.kmz')).toBe('kmz');
    expect(formatOf('plano.pdf')).toBeNull();
  });
});
