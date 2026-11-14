import { fromBlob } from 'geotiff';
import { bboxToLatLon, boundsSizeM, proj4DefFor, type LatLonBounds } from './crs';

/**
 * Reads a drone orthomosaic (GeoTIFF / COG) entirely in the browser: the file is never uploaded.
 * Produces a downsampled RGB preview and its lat/lon bounds so it can be laid over the lot map.
 * The preview is placed by its bounding box (no per-pixel reprojection): fine for a field-sized area,
 * and stated in the UI.
 */

export interface Orthomosaic {
  name: string;
  bounds: LatLonBounds;
  epsg: number;
  /** PNG data URL of the preview. */
  preview: string;
  sourceWidth: number;
  sourceHeight: number;
  /** Ground sample distance of the original file, metres per pixel. */
  gsdM: number;
  areaHa: number;
}

export class DroneImageError extends Error {
  constructor(
    readonly code: 'notTiff' | 'noGeo' | 'crs' | 'bands' | 'dsmBands' | 'tooBig' | 'read',
    readonly detail = '',
  ) {
    super(`${code}${detail ? `: ${detail}` : ''}`);
    this.name = 'DroneImageError';
  }
}

export const MAX_FILE_BYTES = 1_500_000_000; // 1.5 GB: beyond this the browser tab is likely to run out of memory
const MAX_PREVIEW = 2048;

/** Stretch any numeric band to 0–255 using the 2nd–98th percentile (handles 8-bit, 16-bit and float). */
export function stretchTo8bit(values: ArrayLike<number>, nodata: number | null): Uint8ClampedArray {
  const sample: number[] = [];
  const step = Math.max(1, Math.floor(values.length / 50_000));
  for (let i = 0; i < values.length; i += step) {
    const v = values[i]!;
    if (Number.isFinite(v) && v !== nodata) sample.push(v);
  }
  sample.sort((a, b) => a - b);
  const lo = sample[Math.floor(sample.length * 0.02)] ?? 0;
  const hi = sample[Math.floor(sample.length * 0.98)] ?? 255;
  const already8 = lo >= 0 && hi <= 255 && sample.every((v) => Number.isInteger(v));
  const out = new Uint8ClampedArray(values.length);
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    out[i] = already8 ? v : hi > lo ? ((v - lo) / (hi - lo)) * 255 : 0;
  }
  return out;
}

function epsgOf(geoKeys: Record<string, unknown>): number | null {
  const projected = geoKeys['ProjectedCSTypeGeoKey'];
  if (typeof projected === 'number' && projected !== 32767) return projected;
  const geographic = geoKeys['GeographicTypeGeoKey'];
  if (typeof geographic === 'number' && geographic !== 32767) return geographic === 4326 ? 4326 : geographic;
  return null;
}

export async function readOrthomosaic(file: File): Promise<Orthomosaic> {
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
  if (epsg === null || !proj4DefFor(epsg)) throw new DroneImageError('crs', epsg === null ? '?' : `EPSG:${epsg}`);

  let bbox: number[];
  try {
    bbox = image.getBoundingBox();
  } catch {
    throw new DroneImageError('noGeo');
  }
  const bounds = bboxToLatLon(bbox as [number, number, number, number], epsg);

  const w = image.getWidth();
  const h = image.getHeight();
  const spp = image.getSamplesPerPixel();
  if (spp < 3) throw new DroneImageError('bands', String(spp));
  const scale = Math.min(1, MAX_PREVIEW / Math.max(w, h));
  const pw = Math.max(1, Math.round(w * scale));
  const ph = Math.max(1, Math.round(h * scale));

  let rasters;
  try {
    // geotiff.js uses internal overviews when present (COG), so large files stay manageable.
    rasters = await tiff.readRasters({ width: pw, height: ph, samples: spp >= 4 ? [0, 1, 2, 3] : [0, 1, 2], resampleMethod: 'nearest' });
  } catch (err) {
    throw new DroneImageError('read', err instanceof Error ? err.message : String(err));
  }
  const bands = rasters as unknown as ArrayLike<number>[];
  const nodataRaw = image.getGDALNoData();
  const nodata = typeof nodataRaw === 'number' ? nodataRaw : null;
  const [r, g, b] = [stretchTo8bit(bands[0]!, nodata), stretchTo8bit(bands[1]!, nodata), stretchTo8bit(bands[2]!, nodata)];
  const alpha = bands[3];

  const canvas = document.createElement('canvas');
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new DroneImageError('read', 'canvas');
  const img = ctx.createImageData(pw, ph);
  for (let i = 0; i < pw * ph; i++) {
    const raw0 = bands[0]![i]!;
    const transparent = (alpha !== undefined && alpha[i] === 0) || (nodata !== null && raw0 === nodata);
    img.data[i * 4] = r[i]!;
    img.data[i * 4 + 1] = g[i]!;
    img.data[i * 4 + 2] = b[i]!;
    img.data[i * 4 + 3] = transparent ? 0 : 255;
  }
  ctx.putImageData(img, 0, 0);

  const size = boundsSizeM(bounds);
  return {
    name: file.name,
    bounds,
    epsg,
    preview: canvas.toDataURL('image/png'),
    sourceWidth: w,
    sourceHeight: h,
    gsdM: size.widthM / w,
    areaHa: (size.widthM * size.heightM) / 10_000,
  };
}
