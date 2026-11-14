import area from '@turf/area';
import kinks from '@turf/kinks';
import centroid from '@turf/centroid';
import { polygon as turfPolygon } from '@turf/helpers';
import { unzipSync, strFromU8 } from 'fflate';
import proj4 from 'proj4';
import { decidePosgarAxes, proj4DefFor } from './crs';
import type { LatLon } from './flightOrder';

/**
 * Lot boundaries from survey documents (cadastre exports, surveyor plans, Google Earth files).
 * Every format ends as a list of candidate polygons in WGS84 [lat, lon]; the user picks one.
 * Validation follows the same rules as AgroCordS (min 0.5 ha, max 5 000 ha, no self-intersection).
 */

export type ImportFormat = 'kml' | 'kmz' | 'geojson' | 'shp' | 'dxf';

export interface CandidatePolygon {
  name: string;
  ring: LatLon[]; // open ring (first vertex not repeated)
  areaHa: number;
  /** Set when the shape can never be a lot regardless of its geometry (e.g. a multi-part parcel). */
  blocked?: LotProblem;
}

/** Translatable notice about how a file was interpreted. */
export interface ImportNotice {
  key: 'axesSwapped' | 'stripCorrected' | 'dxfLooksLatLon';
  params?: Record<string, string | number>;
}

export type ImportErrorCode = 'format' | 'empty' | 'projected' | 'needCrs' | 'parse' | 'tooBig' | 'noShp' | 'noPrj';

export const MAX_IMPORT_BYTES = 30 * 1024 * 1024;

export class LotImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    readonly detail = '',
  ) {
    super(`${code}${detail ? `: ${detail}` : ''}`);
    this.name = 'LotImportError';
  }
}

export const AREA_MIN_HA = 0.5;
export const AREA_MAX_HA = 5000;

export type LotProblem = 'tooFewVertices' | 'selfIntersection' | 'tooSmall' | 'tooLarge' | 'multiPart';

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function closed(ring: LatLon[]): [number, number][] {
  const lonLat = ring.map(([lat, lon]) => [lon, lat] as [number, number]);
  const first = lonLat[0];
  if (first) lonLat.push([first[0], first[1]]);
  return lonLat;
}

export function areaHa(ring: LatLon[]): number {
  if (ring.length < 3) return 0;
  return area(turfPolygon([closed(ring)])) / 10_000;
}

/** Centroid of the lot as [lat, lon]: used as the analysis point when a lot exists. */
export function lotCentroid(ring: LatLon[]): LatLon {
  const [lon, lat] = centroid(turfPolygon([closed(ring)])).geometry.coordinates as [number, number];
  return [lat, lon];
}

export function validateLot(ring: LatLon[]): LotProblem | null {
  if (ring.length < 3) return 'tooFewVertices';
  if (kinks(turfPolygon([closed(ring)])).features.length > 0) return 'selfIntersection';
  const ha = areaHa(ring);
  if (ha < AREA_MIN_HA) return 'tooSmall';
  if (ha > AREA_MAX_HA) return 'tooLarge';
  return null;
}

/** Drops the repeated closing vertex and consecutive duplicates. */
function openRing(coords: LatLon[]): LatLon[] {
  const out: LatLon[] = [];
  for (const p of coords) {
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  const first = out[0];
  const last = out[out.length - 1];
  if (out.length > 1 && first && last && first[0] === last[0] && first[1] === last[1]) out.pop();
  return out;
}

function assertGeographic(ring: LatLon[]): void {
  if (ring.some(([lat, lon]) => !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)) {
    throw new LotImportError('projected');
  }
}

function candidate(name: string, ring: LatLon[], blocked?: LotProblem): CandidatePolygon | null {
  const open = openRing(ring);
  if (open.length < 3) return null;
  assertGeographic(open);
  return blocked ? { name, ring: open, areaHa: areaHa(open), blocked } : { name, ring: open, areaHa: areaHa(open) };
}

// ---------------------------------------------------------------------------
// GeoJSON (also the output of shpjs)
// ---------------------------------------------------------------------------

type Pos = number[];
interface Geom {
  type: string;
  coordinates?: unknown;
  geometries?: Geom[];
}

/** Outer rings of a geometry. A multipolygon with several parts is flagged: a lot is one piece of land. */
function ringsFromGeometry(g: Geom | null | undefined): { ring: Pos[]; multiPart: boolean }[] {
  if (!g) return [];
  if (g.type === 'Polygon') return [{ ring: ((g.coordinates as Pos[][]) ?? [])[0] ?? [], multiPart: false }];
  if (g.type === 'MultiPolygon') {
    const parts = (g.coordinates as Pos[][][]) ?? [];
    return parts.map((p) => ({ ring: p[0] ?? [], multiPart: parts.length > 1 }));
  }
  if (g.type === 'LineString') {
    // Cadastre exports often store parcels as closed lines.
    const c = (g.coordinates as Pos[]) ?? [];
    const a = c[0];
    const z = c[c.length - 1];
    return c.length >= 4 && a && z && a[0] === z[0] && a[1] === z[1] ? [{ ring: c, multiPart: false }] : [];
  }
  if (g.type === 'GeometryCollection') return (g.geometries ?? []).flatMap(ringsFromGeometry);
  return [];
}

function featureName(props: Record<string, unknown> | null | undefined, fallback: string): string {
  if (!props) return fallback;
  const key = Object.keys(props).find((k) => /^(name|nombre|nomenclatura|partida|parcela|lote|id)$/i.test(k));
  const v = key ? props[key] : undefined;
  return typeof v === 'string' || typeof v === 'number' ? String(v) : fallback;
}

export function polygonsFromGeoJson(json: unknown, label = 'Polígono'): CandidatePolygon[] {
  const out: CandidatePolygon[] = [];
  const visit = (obj: unknown) => {
    if (Array.isArray(obj)) return obj.forEach(visit); // shpjs returns an array for multi-layer zips
    const o = obj as { type?: string; features?: unknown[]; geometry?: Geom; properties?: Record<string, unknown> };
    if (!o || typeof o !== 'object') return;
    if (o.type === 'FeatureCollection') return (o.features ?? []).forEach(visit);
    const geom = o.type === 'Feature' ? o.geometry : (o as Geom);
    const rings = ringsFromGeometry(geom);
    rings.forEach(({ ring: r, multiPart }, i) => {
      const name = featureName(o.properties, `${label} ${out.length + 1}`) + (rings.length > 1 ? ` (${i + 1})` : '');
      const c = candidate(name, r.map((p) => [Number(p[1]), Number(p[0])] as LatLon), multiPart ? 'multiPart' : undefined);
      if (c) out.push(c);
    });
  };
  visit(json);
  return out;
}

// ---------------------------------------------------------------------------
// KML / KMZ (KML is always WGS84 lon,lat[,alt])
// ---------------------------------------------------------------------------

export function polygonsFromKml(kml: string): CandidatePolygon[] {
  const out: CandidatePolygon[] = [];
  const placemarks = kml.match(/<Placemark[\s\S]*?<\/Placemark>/gi) ?? [];
  const blocks = placemarks.length ? placemarks : [kml];
  for (const pm of blocks) {
    const name = pm.match(/<name>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/name>/i)?.[1]?.trim() || `Polígono ${out.length + 1}`;
    const outers = pm.match(/<outerBoundaryIs>[\s\S]*?<\/outerBoundaryIs>/gi) ?? [];
    outers.forEach((ob, i) => {
      const coords = ob.match(/<coordinates>([\s\S]*?)<\/coordinates>/i)?.[1] ?? '';
      const ring = coords
        .trim()
        .split(/\s+/)
        .map((tuple) => tuple.split(',').map(Number))
        .filter((p) => p.length >= 2)
        .map((p) => [p[1]!, p[0]!] as LatLon);
      const c = candidate(outers.length > 1 ? `${name} (${i + 1})` : name, ring);
      if (c) out.push(c);
    });
  }
  return out;
}

export function polygonsFromKmz(bytes: Uint8Array): CandidatePolygon[] {
  const files = unzipSync(bytes);
  const kmlName = Object.keys(files).find((n) => /(^|\/)doc\.kml$/i.test(n)) ?? Object.keys(files).find((n) => /\.kml$/i.test(n));
  if (!kmlName) throw new LotImportError('empty');
  return polygonsFromKml(strFromU8(files[kmlName]!));
}

// ---------------------------------------------------------------------------
// DXF (surveyor plans): projected coordinates, CRS chosen by the user
// ---------------------------------------------------------------------------

interface DxfVertex {
  x: number;
  y: number;
}
interface DxfEntity {
  type: string;
  layer?: string;
  vertices?: DxfVertex[];
  shape?: boolean;
  closed?: boolean;
}

export function polygonsFromDxfEntities(entities: DxfEntity[], epsg: number): { polygons: CandidatePolygon[]; notices: ImportNotice[] } {
  const closedPolys = entities.filter((e) => {
    if (e.type !== 'LWPOLYLINE' && e.type !== 'POLYLINE') return false;
    const v = e.vertices ?? [];
    const first = v[0];
    const last = v[v.length - 1];
    return v.length >= 3 && Boolean(e.shape || e.closed || (first && last && v.length > 3 && first.x === last.x && first.y === last.y));
  });
  const notices: ImportNotice[] = [];
  let used = epsg;
  let swap = false;
  const sample = closedPolys[0]?.vertices?.[0];
  if (sample && epsg >= 5343 && epsg <= 5349) {
    const chosen = epsg - 5342;
    const d = decidePosgarAxes(sample.x, sample.y, chosen);
    swap = d.swap;
    if (swap) notices.push({ key: 'axesSwapped' });
    if (d.strip !== null && d.strip !== chosen) {
      used = 5342 + d.strip;
      notices.push({ key: 'stripCorrected', params: { chosen, detected: d.strip } });
    }
  } else if (sample && epsg !== 4326 && Math.abs(sample.x) <= 180 && Math.abs(sample.y) <= 90) {
    // Numbers this small are degrees, not metres: the plan is already in lat/lon.
    used = 4326;
    notices.push({ key: 'dxfLooksLatLon' });
  }
  const def = proj4DefFor(used);
  if (!def) throw new LotImportError('needCrs');
  const polygons: CandidatePolygon[] = [];
  for (const e of closedPolys) {
    const ring = (e.vertices ?? []).map((p) => {
      const [ex, ny] = swap ? [p.y, p.x] : [p.x, p.y];
      const [lon, lat] = (used === 4326 ? [ex, ny] : proj4(def, 'EPSG:4326', [ex, ny])) as [number, number];
      return [lat, lon] as LatLon;
    });
    const c = candidate(`${e.layer && e.layer !== '0' ? e.layer : 'DXF'} · ${polygons.length + 1}`, ring);
    if (c) polygons.push(c);
  }
  return { polygons, notices };
}

// ---------------------------------------------------------------------------
// File entry point
// ---------------------------------------------------------------------------

export function formatOf(fileName: string): ImportFormat | null {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'kml') return 'kml';
  if (ext === 'kmz') return 'kmz';
  if (ext === 'geojson' || ext === 'json') return 'geojson';
  if (ext === 'zip') return 'shp';
  if (ext === 'dxf') return 'dxf';
  return null;
}

export async function importLotFile(
  file: File,
  dxfEpsg: number | null,
): Promise<{ format: ImportFormat; polygons: CandidatePolygon[]; notices: ImportNotice[] }> {
  if (file.size > MAX_IMPORT_BYTES) throw new LotImportError('tooBig', String(MAX_IMPORT_BYTES / 1024 / 1024));
  const format = formatOf(file.name);
  if (!format) throw new LotImportError('format');
  let polygons: CandidatePolygon[];
  let notices: ImportNotice[] = [];
  try {
    if (format === 'kml') polygons = polygonsFromKml(await file.text());
    else if (format === 'kmz') polygons = polygonsFromKmz(new Uint8Array(await file.arrayBuffer()));
    else if (format === 'geojson') polygons = polygonsFromGeoJson(JSON.parse(await file.text()));
    else if (format === 'shp') {
      const buffer = await file.arrayBuffer();
      const listing = shapefileListing(new Uint8Array(buffer));
      if (!listing.shp) throw new LotImportError('noShp');
      // Without the .prj we cannot know the coordinate system; guessing would misplace the lot.
      if (!listing.prj) throw new LotImportError('noPrj');
      // shpjs reads .shp/.dbf/.prj from the zip and reprojects to WGS84 using the .prj.
      const { default: shp } = await import('shpjs');
      polygons = polygonsFromGeoJson(await shp(buffer));
    } else {
      if (dxfEpsg === null) throw new LotImportError('needCrs');
      const { default: DxfParser } = await import('dxf-parser');
      const parsed = new DxfParser().parseSync(await file.text()) as { entities?: DxfEntity[] } | null;
      ({ polygons, notices } = polygonsFromDxfEntities(parsed?.entities ?? [], dxfEpsg));
    }
  } catch (err) {
    if (err instanceof LotImportError) throw err;
    throw new LotImportError('parse', err instanceof Error ? err.message : String(err));
  }
  if (!polygons.length) throw new LotImportError('empty');
  return { format, polygons: polygons.sort((a, b) => b.areaHa - a.areaHa), notices };
}

/** Which shapefile parts a zip contains, without decompressing them. */
export function shapefileListing(zip: Uint8Array): { shp: boolean; prj: boolean } {
  const seen = { shp: false, prj: false };
  unzipSync(zip, {
    filter: (f) => {
      if (/\.shp$/i.test(f.name)) seen.shp = true;
      if (/\.prj$/i.test(f.name)) seen.prj = true;
      return false; // list only
    },
  });
  return seen;
}
