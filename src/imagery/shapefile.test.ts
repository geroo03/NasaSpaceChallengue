import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import shp from 'shpjs';
import { polygonsFromGeoJson } from './lotImport';

/** Minimal single-polygon shapefile writer (just enough to exercise the real shpjs reader). */
function shapefileZip(ring: [number, number][], prj: string, name: string): ArrayBuffer {
  const pts = [...ring, ring[0]!];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const contentLen = 4 + 32 + 4 + 4 + 4 + pts.length * 16; // shapeType + box + numParts + numPoints + parts + points
  const recLen = 8 + contentLen;
  const header = (fileLenBytes: number) => {
    const b = new DataView(new ArrayBuffer(100));
    b.setInt32(0, 9994);
    b.setInt32(24, fileLenBytes / 2);
    b.setInt32(28, 1000, true);
    b.setInt32(32, 5, true);
    bbox.forEach((v, i) => b.setFloat64(36 + i * 8, v!, true));
    return new Uint8Array(b.buffer);
  };
  const shpBuf = new DataView(new ArrayBuffer(100 + recLen));
  new Uint8Array(shpBuf.buffer).set(header(100 + recLen));
  let o = 100;
  shpBuf.setInt32(o, 1); shpBuf.setInt32(o + 4, contentLen / 2); o += 8;
  shpBuf.setInt32(o, 5, true); o += 4;
  bbox.forEach((v) => { shpBuf.setFloat64(o, v!, true); o += 8; });
  shpBuf.setInt32(o, 1, true); shpBuf.setInt32(o + 4, pts.length, true); shpBuf.setInt32(o + 8, 0, true); o += 12;
  pts.forEach(([x, y]) => { shpBuf.setFloat64(o, x, true); shpBuf.setFloat64(o + 8, y, true); o += 16; });
  const shx = new DataView(new ArrayBuffer(108));
  new Uint8Array(shx.buffer).set(header(108));
  shx.setInt32(100, 50); shx.setInt32(104, contentLen / 2);
  // dBase III with one C(20) field "NOMBRE"
  const dbf = new DataView(new ArrayBuffer(32 + 32 + 1 + 21 + 1));
  dbf.setUint8(0, 3); dbf.setInt32(4, 1, true); dbf.setInt16(8, 65, true); dbf.setInt16(10, 21, true);
  strToU8('NOMBRE').forEach((c, i) => dbf.setUint8(32 + i, c));
  dbf.setUint8(43, 'C'.charCodeAt(0)); dbf.setUint8(48, 20);
  dbf.setUint8(64, 0x0d); dbf.setUint8(65, 0x20);
  strToU8(name.padEnd(20)).forEach((c, i) => dbf.setUint8(66 + i, c));
  dbf.setUint8(86, 0x1a);
  const zip = zipSync({
    'parcela.shp': new Uint8Array(shpBuf.buffer),
    'parcela.shx': new Uint8Array(shx.buffer),
    'parcela.dbf': new Uint8Array(dbf.buffer),
    'parcela.prj': strToU8(prj),
  });
  return zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer;
}

const UTM20S =
  'PROJCS["WGS_1984_UTM_Zone_20S",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",10000000.0],PARAMETER["Central_Meridian",-63.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]';

describe('cadastre shapefile import (real shpjs reader)', () => {
  it('reprojects a UTM 20S parcel using its .prj and keeps the attribute name', async () => {
    // 1 km square in UTM 20S around -28.47, -62.85 (Añatuya area)
    const x0 = 612000;
    const y0 = 6850000;
    const zip = shapefileZip([[x0, y0], [x0, y0 + 1000], [x0 + 1000, y0 + 1000], [x0 + 1000, y0]], UTM20S, 'Parcela 07-01-123');
    const polys = polygonsFromGeoJson(await shp(zip));
    expect(polys).toHaveLength(1);
    expect(polys[0]!.name).toBe('Parcela 07-01-123');
    const [la, lo] = polys[0]!.ring[0]!;
    expect(la).toBeGreaterThan(-28.6);
    expect(la).toBeLessThan(-28.3);
    expect(lo).toBeGreaterThan(-62.5);
    expect(lo).toBeLessThan(-61.5);
    expect(polys[0]!.areaHa).toBeGreaterThan(99);
    expect(polys[0]!.areaHa).toBeLessThan(101);
  });
});
