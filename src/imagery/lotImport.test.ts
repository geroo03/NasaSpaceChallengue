import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import proj4 from 'proj4';
import DxfParser from 'dxf-parser';

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

  // Survey plan in POSGAR 2007 faja 4, built with the official parameters written out by hand
  // (not with the app's own definition), so a wrong false easting in the app would fail here.
  const OFFICIAL_FAJA4 = '+proj=tmerc +lat_0=-90 +lon_0=-63 +k=1 +x_0=4500000 +y_0=0 +ellps=GRS80 +units=m +no_defs';
  const planPts = square.map(([a, o]) => proj4('EPSG:4326', OFFICIAL_FAJA4, [o, a]) as [number, number]);
  const dxfOf = (pts: [number, number][]) =>
    [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'LWPOLYLINE', '8', 'MENSURA', '90', String(pts.length), '70', '1',
      ...pts.flatMap(([x, y]) => ['10', x.toFixed(3), '20', y.toFixed(3)]),
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
  const entitiesOf = (pts: [number, number][]) => (new DxfParser().parseSync(dxfOf(pts)) as unknown as { entities: never[] }).entities;

  it('places a real DXF in POSGAR 2007 faja 4 where it belongs', () => {
    expect(planPts[0]![0]).toBeGreaterThan(4_000_000); // sanity: easting carries the strip in its millions
    const { polygons, notices } = polygonsFromDxfEntities(entitiesOf(planPts), 5346);
    expect(polygons).toHaveLength(1);
    expect(polygons[0]?.name).toContain('MENSURA');
    expect(polygons[0]?.ring[0]?.[0]).toBeCloseTo(lat, 5);
    expect(polygons[0]?.ring[0]?.[1]).toBeCloseTo(lon, 5);
    expect(polygons[0]?.areaHa).toBeGreaterThan(99);
    expect(notices).toEqual([]);
  });

  it('fixes surveyor plans written as X = north, Y = east, and says so', () => {
    const swapped = planPts.map(([x, y]) => [y, x] as [number, number]);
    const { polygons, notices } = polygonsFromDxfEntities(entitiesOf(swapped), 5346);
    expect(polygons[0]?.ring[0]?.[0]).toBeCloseTo(lat, 5);
    expect(notices.map((n) => n.key)).toContain('axesSwapped');
  });

  it('corrects a wrongly chosen strip from the easting and says so', () => {
    const { polygons, notices } = polygonsFromDxfEntities(entitiesOf(planPts), 5347); // user picked faja 5
    expect(polygons[0]?.ring[0]?.[1]).toBeCloseTo(lon, 5);
    expect(notices).toContainEqual({ key: 'stripCorrected', params: { chosen: 5, detected: 4 } });
  });

  it('blocks multi-part parcels and accepts closed lines from cadastre exports', () => {
    const ring = [...square, square[0]!].map(([a, o]) => [o, a]);
    const multi = polygonsFromGeoJson({ type: 'MultiPolygon', coordinates: [[ring], [ring]] });
    expect(multi.every((p) => p.blocked === 'multiPart')).toBe(true);
    const single = polygonsFromGeoJson({ type: 'MultiPolygon', coordinates: [[ring]] });
    expect(single[0]?.blocked).toBeUndefined();
    const line = polygonsFromGeoJson({ type: 'Feature', properties: { PARCELA: 'A-1' }, geometry: { type: 'LineString', coordinates: ring } });
    expect(line[0]?.name).toBe('A-1');
    const open = polygonsFromGeoJson({ type: 'LineString', coordinates: ring.slice(0, 3) });
    expect(open).toHaveLength(0);
  });

  it('maps file extensions to formats', () => {
    expect(formatOf('Plano Mensura.DXF')).toBe('dxf');
    expect(formatOf('catastro.zip')).toBe('shp');
    expect(formatOf('lote.kmz')).toBe('kmz');
    expect(formatOf('plano.pdf')).toBeNull();
  });
});
