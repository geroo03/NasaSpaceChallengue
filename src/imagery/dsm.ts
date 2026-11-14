import { fromBlob } from 'geotiff';
import proj4 from 'proj4';
import { proj4DefFor } from './crs';
import { DroneImageError, MAX_FILE_BYTES } from './drone';
import type { LatLon } from './flightOrder';
import { gridInside, terrainStats, type TerrainSample, type TerrainStats } from './terrain';

/**
 * Reads a drone elevation model (DSM/DTM GeoTIFF, one band, metres) in the browser and samples it inside
 * the lot with the same statistics used for SRTM, so both can be compared side by side.
 * With RTK the vertical error is centimetres; SRTM's is metres.
 */

export interface DsmResult {
  name: string;
  epsg: number;
  /** Ground resolution of the original file, metres per pixel. */
  gsdM: number;
  /** Share of lot sample points that fell on valid DSM pixels (0–1). */
  coverage: number;
  stats: TerrainStats | null;
}

const MAX_READ = 1500; // px on the long side: enough for a lot-wide plane fit, small enough for memory

function epsgOf(geoKeys: Record<string, unknown>): number | null {
  const projected = geoKeys['ProjectedCSTypeGeoKey'];
  if (typeof projected === 'number' && projected !== 32767) return projected;
  const geographic = geoKeys['GeographicTypeGeoKey'];
  if (typeof geographic === 'number' && geographic !== 32767) return geographic;
  return null;
}

/** Samples a north-up raster (bbox in its own CRS) at lat/lon points. Exported for tests. */
export function sampleRaster(
  raster: ArrayLike<number>,
  width: number,
  height: number,
  bbox: [number, number, number, number],
  toNative: (lon: number, lat: number) => [number, number],
  points: LatLon[],
  nodata: number | null,
): { samples: TerrainSample[]; hits: number } {
  const [minX, minY, maxX, maxY] = bbox;
  const samples: TerrainSample[] = [];
  let hits = 0;
  for (const [lat, lon] of points) {
    const [x, y] = toNative(lon, lat);
    const col = Math.floor(((x - minX) / (maxX - minX)) * width);
    const row = Math.floor(((maxY - y) / (maxY - minY)) * height);
    if (col < 0 || row < 0 || col >= width || row >= height) continue;
    const v = raster[row * width + col]!;
    if (!Number.isFinite(v) || (nodata !== null && v === nodata) || v < -500 || v > 9000) continue;
    hits++;
    samples.push({ lat, lon, elev: v });
  }
  return { samples, hits };
}

export async function readDsm(file: File, ring: LatLon[]): Promise<DsmResult> {
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
  if (image.getSamplesPerPixel() !== 1) throw new DroneImageError('dsmBands', String(image.getSamplesPerPixel()));

  let bbox: [number, number, number, number];
  try {
    bbox = image.getBoundingBox() as [number, number, number, number];
  } catch {
    throw new DroneImageError('noGeo');
  }
  const w = image.getWidth();
  const h = image.getHeight();
  const scale = Math.min(1, MAX_READ / Math.max(w, h));
  const rw = Math.max(1, Math.round(w * scale));
  const rh = Math.max(1, Math.round(h * scale));
  let raster: ArrayLike<number>;
  try {
    const r = await image.readRasters({ width: rw, height: rh, samples: [0], resampleMethod: 'nearest' });
    raster = (r as unknown as ArrayLike<number>[])[0]!;
  } catch (err) {
    throw new DroneImageError('read', err instanceof Error ? err.message : String(err));
  }
  const nodataRaw = image.getGDALNoData();
  const nodata = typeof nodataRaw === 'number' ? nodataRaw : null;
  const toNative = epsg === 4326 ? (lon: number, lat: number): [number, number] => [lon, lat] : (lon: number, lat: number) => proj4('EPSG:4326', def, [lon, lat]) as [number, number];

  const points = gridInside(ring, 2500, 2);
  const { samples, hits } = sampleRaster(raster, rw, rh, bbox, toNative, points, nodata);
  const pixelX = (bbox[2] - bbox[0]) / w;
  const gsdM = epsg === 4326 ? pixelX * 111_320 * Math.cos((((bbox[1] + bbox[3]) / 2) * Math.PI) / 180) : pixelX;
  return {
    name: file.name,
    epsg,
    gsdM,
    coverage: points.length ? hits / points.length : 0,
    stats: terrainStats(samples, 'drone'),
  };
}
