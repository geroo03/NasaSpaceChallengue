import { describe, expect, it } from 'vitest';
import { buildFlightGeoJson, buildFlightKml, polygonAreaHa, type FlightOrder, type LatLon } from './flightOrder';

// ~1 km × 1 km square near Santiago del Estero → ~100 ha
const lat = -27.9;
const dLat = 1000 / 110_574;
const dLon = 1000 / (111_320 * Math.cos((lat * Math.PI) / 180));
const square: LatLon[] = [
  [lat, -64.3],
  [lat, -64.3 + dLon],
  [lat + dLat, -64.3 + dLon],
  [lat + dLat, -64.3],
];

const order: FlightOrder = {
  title: 'Lote <norte> & sur',
  polygon: square,
  checks: [{ when: 'Nov · Año 1', what: 'Humedad y malezas antes de sembrar' }],
  createdOn: '2026-11-14',
  notes: [],
};

describe('flight order', () => {
  it('computes field-scale areas in hectares', () => {
    expect(polygonAreaHa(square)).toBeGreaterThan(99);
    expect(polygonAreaHa(square)).toBeLessThan(101);
    expect(polygonAreaHa(square.slice(0, 2))).toBe(0);
  });

  it('writes a closed KML ring in lon,lat order and escapes text', () => {
    const kml = buildFlightKml(order);
    const coords = kml.match(/<coordinates>([^<]+)<\/coordinates>/)?.[1]?.split(' ') ?? [];
    expect(coords).toHaveLength(5);
    expect(coords[0]).toBe(coords[4]);
    expect(coords[0]?.startsWith('-64.3000000,-27.9000000')).toBe(true);
    expect(kml).toContain('Lote &lt;norte&gt; &amp; sur');
    expect(kml).toContain('Nov · Año 1: Humedad y malezas');
  });

  it('writes valid GeoJSON with the same closed ring', () => {
    const gj = JSON.parse(buildFlightGeoJson(order));
    const ringCoords = gj.features[0].geometry.coordinates[0];
    expect(ringCoords).toHaveLength(5);
    expect(ringCoords[0]).toEqual([-64.3, -27.9]);
    expect(gj.features[0].properties.areaHa).toBeGreaterThan(99);
  });

  it('refuses a polygon with fewer than three vertices', () => {
    expect(() => buildFlightKml({ ...order, polygon: square.slice(0, 2) })).toThrow();
  });
});
