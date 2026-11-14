import { describe, expect, it } from 'vitest';
import { bboxToLatLon, boundsSizeM, proj4DefFor } from './crs';
import { stretchTo8bit } from './drone';

describe('drone orthomosaic coordinates', () => {
  it('accepts WGS84, Web Mercator, UTM north/south and POSGAR 2007, and rejects the rest', () => {
    expect(proj4DefFor(4326)).not.toBeNull();
    expect(proj4DefFor(3857)).not.toBeNull();
    expect(proj4DefFor(32620)).toContain('+zone=20');
    expect(proj4DefFor(32720)).toContain('+south');
    expect(proj4DefFor(5347)).toContain('+lon_0=-60'); // faja 5
    expect(proj4DefFor(22185)).toBeNull(); // Campo Inchauspe: not supported, must not be guessed
  });

  it('places a UTM 20S tile near Santiago del Estero', () => {
    // ~1 km box around -27.78, -64.26 in UTM zone 20S (EPSG:32720)
    const b = bboxToLatLon([377000, 6926000, 378000, 6927000], 32720);
    expect(b.south).toBeGreaterThan(-27.85);
    expect(b.north).toBeLessThan(-27.70);
    expect(b.west).toBeGreaterThan(-64.30);
    expect(b.east).toBeLessThan(-64.20);
    const { widthM, heightM } = boundsSizeM(b);
    expect(widthM).toBeGreaterThan(950);
    expect(widthM).toBeLessThan(1050);
    expect(heightM).toBeGreaterThan(950);
    expect(heightM).toBeLessThan(1050);
  });

  it('passes lat/lon boxes through and rejects impossible coordinates', () => {
    expect(bboxToLatLon([-64.3, -27.8, -64.2, -27.7], 4326)).toEqual({ south: -27.8, west: -64.3, north: -27.7, east: -64.2 });
    expect(() => bboxToLatLon([377000, 6926000, 378000, 6927000], 4326)).toThrow();
  });
});

describe('band stretch', () => {
  it('keeps 8-bit data unchanged', () => {
    expect([...stretchTo8bit([0, 10, 255, 128], null)]).toEqual([0, 10, 255, 128]);
  });

  it('stretches 16-bit reflectance into 0–255 and ignores nodata', () => {
    const values = Array.from({ length: 1000 }, (_, i) => 1000 + i * 10);
    values[0] = -9999;
    const out = stretchTo8bit(values, -9999);
    expect(out[500]!).toBeGreaterThan(100);
    expect(out[500]!).toBeLessThan(160);
    expect(out[999]).toBe(255);
  });
});
