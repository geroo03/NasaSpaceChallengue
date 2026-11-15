import { fromBlob } from 'geotiff';
import proj4 from 'proj4';
import { proj4DefFor } from './crs';
import { DroneImageError, MAX_FILE_BYTES } from './drone';
import type { LatLon } from './flightOrder';
import { pointInRing } from './terrain';

/**
 * Drone vigour map → zones → variable-rate prescription, the workflow Vuelo Verde runs in DJI SmartFarm:
 *  - read an index GeoTIFF (NDVI/NDRE exported by DJI Terra or SmartFarm), or compute NDVI from a
 *    multispectral GeoTIFF ((NIR − Red) / (NIR + Red));
 *  - keep the pixels inside the lot, split them into equal-area classes (quantiles) and measure each zone;
 *  - give each zone a rate and export a grid prescription (GeoJSON) with zone and rate per cell.
 * Everything runs in the browser: the file is never uploaded.
 */

export interface VigorRaster {
  name: string;
  epsg: number;
  width: number;
  height: number;
  /** Index value per pixel (row-major, north-up); NaN = no data or outside the lot. */
  values: Float32Array;
  bbox: [number, number, number, number];
  /** Ground area of one pixel of `values`, m². */
  pixelAreaM2: number;
  source: 'index' | 'computed';
}

/** NDVI from red and near-infrared reflectance; NaN when both are 0 or missing. */
export function ndvi(red: number, nir: number): number {
  const s = nir + red;
  if (!Number.isFinite(s) || s === 0) return NaN;
  return (nir - red) / s;
}

/** Equal-area class limits (n − 1 thresholds) from the valid values. */
export function quantileThresholds(values: ArrayLike<number>, n: number): number[] {
  const v: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const x = values[i]!;
    if (Number.isFinite(x)) v.push(x);
  }
  v.sort((a, b) => a - b);
  if (!v.length) return [];
  const out: number[] = [];
  for (let k = 1; k < n; k++) out.push(v[Math.min(v.length - 1, Math.floor((v.length * k) / n))]!);
  return out;
}

/** Class 0 = lowest vigour … n−1 = highest; −1 = no data. */
export function classify(value: number, thresholds: number[]): number {
  if (!Number.isFinite(value)) return -1;
  let c = 0;
  while (c < thresholds.length && value >= thresholds[c]!) c++;
  return c;
}

export interface ZoneStats {
  zone: number;
  min: number;
  max: number;
  mean: number;
  areaHa: number;
}

export function zoneStats(r: VigorRaster, thresholds: number[]): ZoneStats[] {
  const n = thresholds.length + 1;
  const acc = Array.from({ length: n }, () => ({ min: Infinity, max: -Infinity, sum: 0, count: 0 }));
  for (let i = 0; i < r.values.length; i++) {
    const c = classify(r.values[i]!, thresholds);
    if (c < 0) continue;
    const a = acc[c]!;
    const v = r.values[i]!;
    a.min = Math.min(a.min, v);
    a.max = Math.max(a.max, v);
    a.sum += v;
    a.count++;
  }
  return acc.map((a, zone) => ({
    zone,
    min: a.count ? a.min : NaN,
    max: a.count ? a.max : NaN,
    mean: a.count ? a.sum / a.count : NaN,
    areaHa: (a.count * r.pixelAreaM2) / 10_000,
  }));
}

export interface PrescriptionCell {
  zone: number;
  rate: number;
  /** Cell corners as [lon, lat], closed ring. */
  ring: [number, number][];
}

/**
 * Grid prescription: cells of about `cellM` metres; each takes the most common zone of its pixels
 * and that zone's rate. Corners are converted from the file's CRS to WGS 84.
 */
export function prescriptionGrid(r: VigorRaster, thresholds: number[], rates: number[], cellM: number): PrescriptionCell[] {
  const [minX, minY, maxX, maxY] = r.bbox;
  const def = proj4DefFor(r.epsg);
  const toLonLat = r.epsg === 4326 || !def ? (x: number, y: number): [number, number] => [x, y] : (x: number, y: number) => proj4(def, 'EPSG:4326', [x, y]) as [number, number];
  const pxW = (maxX - minX) / r.width;
  const pxH = (maxY - minY) / r.height;
  const pxSideM = Math.sqrt(r.pixelAreaM2);
  const step = Math.max(1, Math.round(cellM / Math.max(pxSideM, 1e-6)));
  const n = thresholds.length + 1;
  const cells: PrescriptionCell[] = [];
  for (let row = 0; row < r.height; row += step) {
    for (let col = 0; col < r.width; col += step) {
      const counts = new Array<number>(n).fill(0);
      for (let dy = 0; dy < step && row + dy < r.height; dy++) {
        for (let dx = 0; dx < step && col + dx < r.width; dx++) {
          const c = classify(r.values[(row + dy) * r.width + col + dx]!, thresholds);
          if (c >= 0) counts[c]!++;
        }
      }
      let zone = -1;
      let best = 0;
      counts.forEach((k, z) => {
        if (k > best) {
          best = k;
          zone = z;
        }
      });
      if (zone < 0) continue;
      const x0 = minX + col * pxW;
      const x1 = minX + Math.min(r.width, col + step) * pxW;
      const y0 = maxY - row * pxH;
      const y1 = maxY - Math.min(r.height, row + step) * pxH;
      const ring = [toLonLat(x0, y0), toLonLat(x1, y0), toLonLat(x1, y1), toLonLat(x0, y1)];
      cells.push({ zone, rate: rates[zone] ?? 0, ring: [...ring, ring[0]!] });
    }
  }
  return cells;
}

export function prescriptionGeoJson(cells: PrescriptionCell[], meta: { name: string; unit: string; createdOn: string }): string {
  return JSON.stringify({
    type: 'FeatureCollection',
    name: meta.name,
    features: cells.map((c) => ({
      type: 'Feature',
      properties: { zona: c.zone + 1, dosis: c.rate, unidad: meta.unit },
      geometry: { type: 'Polygon', coordinates: [c.ring.map(([x, y]) => [Number(x.toFixed(7)), Number(y.toFixed(7))])] },
    })),
    generator: 'AgroField',
    createdOn: meta.createdOn,
  });
}

const MAX_SIDE = 700; // px on the long side: enough to zone a lot, light enough for a phone

function epsgOf(geoKeys: Record<string, unknown>): number | null {
  const projected = geoKeys['ProjectedCSTypeGeoKey'];
  if (typeof projected === 'number' && projected !== 32767) return projected;
  const geographic = geoKeys['GeographicTypeGeoKey'];
  if (typeof geographic === 'number' && geographic !== 32767) return geographic;
  return null;
}

/**
 * Reads a vigour GeoTIFF. One band: an index already computed (values must look like an index, −1…1).
 * Several bands: NDVI from `redBand` and `nirBand` (0-based; defaults fit a G, R, RE, NIR stack).
 */
export async function readVigor(file: File, ring: LatLon[] | null, bands: { red: number; nir: number } = { red: 1, nir: 3 }): Promise<VigorRaster> {
  if (file.size > MAX_FILE_BYTES) throw new DroneImageError('tooBig');
  if (!/\.(tif|tiff)$/i.test(file.name)) throw new DroneImageError('notTiff');
  let tiff;
  try {
    tiff = await fromBlob(file);
  } catch (err) {
    throw new DroneImageError('read', err instanceof Error ? err.message : String(err));
  }
  const image = await tiff.getImage();
  const geoKeys = image.getGeoKeys() as Record<string, unknown> | null;
  if (!geoKeys) throw new DroneImageError('noGeo');
  const epsg = epsgOf(geoKeys);
  const def = epsg === null ? null : proj4DefFor(epsg);
  if (epsg === null || !def) throw new DroneImageError('crs', epsg === null ? '?' : `EPSG:${epsg}`);
  const bbox = image.getBoundingBox() as [number, number, number, number];
  const w = image.getWidth();
  const h = image.getHeight();
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const rw = Math.max(1, Math.round(w * scale));
  const rh = Math.max(1, Math.round(h * scale));
  const spp = image.getSamplesPerPixel();
  const nodataRaw = image.getGDALNoData();
  const nodata = typeof nodataRaw === 'number' ? nodataRaw : null;
  const values = new Float32Array(rw * rh);
  let source: VigorRaster['source'];
  try {
    if (spp === 1) {
      const r = (await image.readRasters({ width: rw, height: rh, samples: [0], resampleMethod: 'nearest' })) as unknown as ArrayLike<number>[];
      const band = r[0]!;
      for (let i = 0; i < values.length; i++) {
        const v = band[i]!;
        values[i] = nodata !== null && v === nodata ? NaN : v;
      }
      source = 'index';
    } else if (spp - alphaSamples(image) > Math.max(bands.red, bands.nir)) {
      const r = (await image.readRasters({ width: rw, height: rh, samples: [bands.red, bands.nir], resampleMethod: 'nearest' })) as unknown as ArrayLike<number>[];
      for (let i = 0; i < values.length; i++) {
        const red = r[0]![i]!;
        const nir = r[1]![i]!;
        values[i] = nodata !== null && (red === nodata || nir === nodata) ? NaN : ndvi(red, nir);
      }
      source = 'computed';
    } else {
      throw new DroneImageError('vigorBands', String(spp));
    }
  } catch (err) {
    if (err instanceof DroneImageError) throw err;
    throw new DroneImageError('read', err instanceof Error ? err.message : String(err));
  }
  // An index lives in −1…1. A colour-mapped picture (0–255) is not an index and would give fake zones.
  let inRange = 0;
  let valid = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (!Number.isFinite(v)) continue;
    valid++;
    if (v >= -1.0001 && v <= 1.0001) inRange++;
    else values[i] = NaN;
  }
  if (!valid || inRange / valid < 0.9) throw new DroneImageError('notIndex');
  // Keep only the lot.
  if (ring) {
    const toLonLat = epsg === 4326 ? (x: number, y: number): [number, number] => [x, y] : (x: number, y: number) => proj4(def, 'EPSG:4326', [x, y]) as [number, number];
    const pxW = (bbox[2] - bbox[0]) / rw;
    const pxH = (bbox[3] - bbox[1]) / rh;
    for (let row = 0; row < rh; row++) {
      for (let col = 0; col < rw; col++) {
        const i = row * rw + col;
        if (!Number.isFinite(values[i]!)) continue;
        const [lon, lat] = toLonLat(bbox[0] + (col + 0.5) * pxW, bbox[3] - (row + 0.5) * pxH);
        if (!pointInRing(lat, lon, ring)) values[i] = NaN;
      }
    }
  }
  const pxW = (bbox[2] - bbox[0]) / rw;
  const pxH = (bbox[3] - bbox[1]) / rh;
  const midLat = epsg === 4326 ? ((bbox[1] + bbox[3]) / 2) * (Math.PI / 180) : 0;
  const pixelAreaM2 = epsg === 4326 ? pxW * 111_320 * Math.cos(midLat) * pxH * 110_574 : pxW * pxH;
  return { name: file.name, epsg, width: rw, height: rh, values, bbox, pixelAreaM2, source };
}

/** Alpha channels (TIFF ExtraSamples 1 or 2) are transparency, not a near-infrared band: an RGBA photo has no NIR. */
function alphaSamples(image: { getFileDirectory(): Record<string, unknown> }): number {
  const extra = image.getFileDirectory().ExtraSamples;
  const list = Array.isArray(extra) || ArrayBuffer.isView(extra) ? Array.from(extra as ArrayLike<number>) : typeof extra === 'number' ? [extra] : [];
  return list.filter((v) => v === 1 || v === 2).length;
}
