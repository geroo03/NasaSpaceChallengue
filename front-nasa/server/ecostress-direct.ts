import { fromUrl } from 'geotiff';
import proj4 from 'proj4';
import { catalogUrl, ECOSTRESS_LAYERS, EcostressError, parseEcostressCsv, type Extraction, type Point } from '../src/ecostress/data.ts';

export interface Pixel { value: number; col: number; row: number; epsg: number; pixelLat: number; pixelLon: number; resolutionM: number }
export interface DirectScene { id: string; granule: string; acquiredAt: string; assets: Record<string, string> }
export interface DirectResult { csv: string; granules: string[] }
const HOST = 'data.lpdaac.earthdatacloud.nasa.gov';

/** NASA C2 may encode a user-defined CRS (32767) with an explicit WGS84 / UTM citation. */
export function utmEpsg(keys: Record<string, unknown>): number {
  const code = Number(keys.ProjectedCSTypeGeoKey);
  if ((code >= 32601 && code <= 32660) || (code >= 32701 && code <= 32760)) return code;
  const citation = String(keys.GTCitationGeoKey ?? keys.PCSCitationGeoKey ?? '');
  const m = /^WGS 84 \/ UTM zone (\d{1,2})([NS])$/.exec(citation.trim());
  if (code !== 32767 || !m || Number(m[1]) < 1 || Number(m[1]) > 60 || Number(keys.ProjLinearUnitsGeoKey) !== 9001) throw new EcostressError('crs');
  return (m[2] === 'S' ? 32700 : 32600) + Number(m[1]);
}
export function pixelWindow(point: Point, epsg: number, origin: number[], resolution: number[], width: number, height: number) {
  if (origin.length < 2 || resolution.length < 2 || !origin.slice(0, 2).every(Number.isFinite) || !resolution.slice(0, 2).every(Number.isFinite) || resolution[0]! <= 0 || resolution[1]! >= 0) throw new EcostressError('crs');
  const south = epsg >= 32700; const zone = epsg - (south ? 32700 : 32600);
  const def = `+proj=utm +zone=${zone} ${south ? '+south' : ''} +datum=WGS84 +units=m +no_defs`;
  const [x, y] = proj4('EPSG:4326', def, [point.lon, point.lat]) as [number, number];
  const col = Math.floor((x - origin[0]!) / resolution[0]!); const row = Math.floor((y - origin[1]!) / resolution[1]!);
  if (!Number.isFinite(col) || !Number.isFinite(row) || col < 0 || row < 0 || col >= width || row >= height) throw new EcostressError('outside');
  const [pixelLon, pixelLat] = proj4(def, 'EPSG:4326', [origin[0]! + (col + 0.5) * resolution[0]!, origin[1]! + (row + 0.5) * resolution[1]!]) as [number, number];
  return { col, row, pixelLat, pixelLon, resolutionM: Math.abs(resolution[0]!) };
}
export function parseDirectScenes(value: unknown): DirectScene[] {
  const entries = (value as { feed?: { entry?: unknown[] } })?.feed?.entry;
  if (!Array.isArray(entries)) throw new EcostressError('network');
  const scenes: DirectScene[] = [];
  for (const entry of entries) {
    const e = entry as { id?: string; title?: string; time_start?: string; links?: { href?: string; inherited?: boolean }[] };
    if (!e.id || !e.title || !/^ECOv002_L3T_JET_[\w]+$/.test(e.title) || !e.time_start || !Number.isFinite(Date.parse(e.time_start))) continue;
    const assets: Record<string, string> = {};
    for (const link of e.links ?? []) {
      if (!link.href || link.inherited) continue;
      let u: URL; try { u = new URL(link.href); } catch { continue; }
      if (u.protocol !== 'https:' || u.hostname !== HOST || u.port || u.username || u.password || !u.pathname.startsWith(`/lp-prod-protected/ECO_L3T_JET.002/${e.title}/`)) continue;
      for (const layer of ECOSTRESS_LAYERS) if (u.pathname.endsWith(`/${e.title}_${layer}.tif`)) assets[layer] = u.href;
    }
    if (ECOSTRESS_LAYERS.every((layer) => assets[layer])) scenes.push({ id: e.id, granule: e.title, acquiredAt: e.time_start, assets });
  }
  return scenes.sort((a, b) => b.acquiredAt.localeCompare(a.acquiredAt)).slice(0, 5);
}

/** Range-read one native-resolution pixel; never requests an out-of-bounds window (geotiff fills it with 0). */
export async function readEcostressPixel(url: string, token: string, point: Point, signal: AbortSignal): Promise<Pixel> {
  const tiff = await fromUrl(url, { headers: { Authorization: `Bearer ${token}` }, allowFullFile: false }, signal);
  try {
    const image = await tiff.getImage();
    if (image.getSamplesPerPixel() !== 1 || image.getFileDirectory().ModelTransformation) throw new EcostressError('crs');
    const epsg = utmEpsg(image.getGeoKeys() as Record<string, unknown>);
    const p = pixelWindow(point, epsg, image.getOrigin(), image.getResolution(), image.getWidth(), image.getHeight());
    const rasters = await image.readRasters({ window: [p.col, p.row, p.col + 1, p.row + 1], samples: [0], signal });
    const raw = Number((rasters[0] as ArrayLike<number>)[0]); const nodata = image.getGDALNoData();
    return { ...p, epsg, value: nodata !== null && raw === nodata ? NaN : raw };
  } finally { await tiff.close(); }
}

export async function extractDirect(x: Extraction, token: string, fetchImpl: typeof fetch = fetch, readPixel = readEcostressPixel): Promise<DirectResult> {
  const signal = AbortSignal.timeout(50_000);
  const response = await fetchImpl(catalogUrl(x), { signal });
  if (!response.ok) throw new EcostressError('network');
  const scenes = parseDirectScenes(await response.json());
  if (!scenes.length) throw new EcostressError('empty');
  const rows: string[] = [];
  for (let start = 0; start < scenes.length; start += 2) {
    const batch = await Promise.all(scenes.slice(start, start + 2).map(async (scene) => {
      const pixels = await Promise.all(ECOSTRESS_LAYERS.map((layer) => readPixel(scene.assets[layer]!, token, x, signal)));
      const et = pixels[0]!;
      if (pixels.some((p) => p.epsg !== et.epsg || p.col !== et.col || p.row !== et.row || Math.abs(p.pixelLat - et.pixelLat) > 1e-8 || Math.abs(p.pixelLon - et.pixelLon) > 1e-8 || p.resolutionM !== et.resolutionM)) throw new EcostressError('crs');
      return ['field-shift', x.lat, x.lon, scene.acquiredAt.slice(0, 10), ...pixels.map((p) => Number.isFinite(p.value) ? p.value : 'NaN'), scene.granule, scene.acquiredAt, et.epsg, et.col, et.row, et.pixelLat, et.pixelLon].join(',');
    }));
    rows.push(...batch);
  }
  const header = 'ID,Latitude,Longitude,Date,ECO_L3T_JET_002_ETdaily,ECO_L3T_JET_002_cloud,ECO_L3T_JET_002_water,Granule,AcquiredAtUTC,EPSG,PixelColumn,PixelRow,PixelLatitude,PixelLongitude';
  const csv = [header, ...rows].join('\n');
  parseEcostressCsv(csv, x);
  return { csv, granules: scenes.map((s) => s.granule) };
}
