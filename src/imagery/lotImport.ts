import area from '@turf/area';
import kinks from '@turf/kinks';
import { polygon as turfPolygon } from '@turf/helpers';
import { unzipSync, strFromU8 } from 'fflate';
import proj4 from 'proj4';
import { proj4DefFor } from './crs';
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
}

export type ImportErrorCode = 'format' | 'empty' | 'projected' | 'needCrs' | 'parse';

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

export type LotProblem = 'tooFewVertices' | 'selfIntersection' | 'tooSmall' | 'tooLarge';

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

function candidate(name: string, ring: LatLon[]): CandidatePolygon | null {
  const open = openRing(ring);
  if (open.length < 3) return null;
  assertGeographic(open);
  return { name, ring: open, areaHa: areaHa(open) };
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

function ringsFromGeometry(g: Geom | null | undefined): Pos[][] {
  if (!g) return [];
  if (g.type === 'Polygon') return [((g.coordinates as Pos[][]) ?? [])[0] ?? []];
  if (g.type === 'MultiPolygon') return ((g.coordinates as Pos[][][]) ?? []).map((p) => p[0] ?? []);
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
    rings.forEach((r, i) => {
      const name = featureName(o.properties, `${label} ${out.length + 1}`) + (rings.length > 1 ? ` (${i + 1})` : '');
      const c = candidate(name, r.map((p) => [Number(p[1]), Number(p[0])] as LatLon));
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

export function polygonsFromDxfEntities(entities: DxfEntity[], epsg: number): CandidatePolygon[] {
  const def = proj4DefFor(epsg);
  if (!def) throw new LotImportError('needCrs');
  const out: CandidatePolygon[] = [];
  for (const e of entities) {
    if (e.type !== 'LWPOLYLINE' && e.type !== 'POLYLINE') continue;
    const v = e.vertices ?? [];
    const first = v[0];
    const last = v[v.length - 1];
    const isClosed = e.shape || e.closed || (first && last && v.length > 3 && first.x === last.x && first.y === last.y);
    if (!isClosed || v.length < 3) continue;
    const ring = v.map((p) => {
      const [lon, lat] = (epsg === 4326 ? [p.x, p.y] : proj4(def, 'EPSG:4326', [p.x, p.y])) as [number, number];
      return [lat, lon] as LatLon;
    });
    const c = candidate(`${e.layer ?? 'DXF'} · ${out.length + 1}`, ring);
    if (c) out.push(c);
  }
  return out;
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

export async function importLotFile(file: File, dxfEpsg: number | null): Promise<{ format: ImportFormat; polygons: CandidatePolygon[] }> {
  const format = formatOf(file.name);
  if (!format) throw new LotImportError('format');
  let polygons: CandidatePolygon[];
  try {
    if (format === 'kml') polygons = polygonsFromKml(await file.text());
    else if (format === 'kmz') polygons = polygonsFromKmz(new Uint8Array(await file.arrayBuffer()));
    else if (format === 'geojson') polygons = polygonsFromGeoJson(JSON.parse(await file.text()));
    else if (format === 'shp') {
      // shpjs reads .shp/.dbf/.prj from the zip and reprojects to WGS84 using the .prj.
      const { default: shp } = await import('shpjs');
      polygons = polygonsFromGeoJson(await shp(await file.arrayBuffer()));
    } else {
      if (dxfEpsg === null) throw new LotImportError('needCrs');
      const { default: DxfParser } = await import('dxf-parser');
      const parsed = new DxfParser().parseSync(await file.text()) as { entities?: DxfEntity[] } | null;
      polygons = polygonsFromDxfEntities(parsed?.entities ?? [], dxfEpsg);
    }
  } catch (err) {
    if (err instanceof LotImportError) throw err;
    throw new LotImportError('parse', err instanceof Error ? err.message : String(err));
  }
  if (!polygons.length) throw new LotImportError('empty');
  return { format, polygons: polygons.sort((a, b) => b.areaHa - a.areaHa) };
}
