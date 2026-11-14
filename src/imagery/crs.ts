import proj4 from 'proj4';

/**
 * Coordinate systems we accept for drone orthomosaics. Drone suites (DJI Terra, Pix4D, etc.) usually
 * export WGS84 UTM; Argentine surveys often use POSGAR 2007 Gauss–Krüger fajas. Anything else is
 * rejected with a clear message instead of being placed in the wrong spot.
 */
export function proj4DefFor(epsg: number): string | null {
  if (epsg === 4326) return '+proj=longlat +datum=WGS84 +no_defs';
  if (epsg === 3857) return '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +no_defs';
  if (epsg >= 32601 && epsg <= 32660) return `+proj=utm +zone=${epsg - 32600} +datum=WGS84 +units=m +no_defs`;
  if (epsg >= 32701 && epsg <= 32760) return `+proj=utm +zone=${epsg - 32700} +south +datum=WGS84 +units=m +no_defs`;
  // POSGAR 2007 / Argentina 1–7 (EPSG:5343–5349): faja n has central meridian −72 + 3(n−1)
  // and false easting n·1 000 000 + 500 000 (faja 4 → 4 500 000 m), origin at the South Pole.
  if (epsg >= 5343 && epsg <= 5349) {
    const faja = epsg - 5342;
    return `+proj=tmerc +lat_0=-90 +lon_0=${-72 + 3 * (faja - 1)} +k=1 +x_0=${faja * 1_000_000 + 500_000} +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs`;
  }
  return null;
}

export interface LatLonBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Projects the four corners of a native bbox [minX, minY, maxX, maxY] to a lat/lon bounding box. */
export function bboxToLatLon(bbox: [number, number, number, number], epsg: number): LatLonBounds {
  const def = proj4DefFor(epsg);
  if (!def) throw new Error(`EPSG:${epsg}`);
  const [minX, minY, maxX, maxY] = bbox;
  const corners: [number, number][] = [
    [minX, minY],
    [minX, maxY],
    [maxX, minY],
    [maxX, maxY],
  ];
  const ll = epsg === 4326 ? corners : corners.map((c) => proj4(def, 'EPSG:4326', c) as [number, number]);
  const lons = ll.map((p) => p[0]);
  const lats = ll.map((p) => p[1]);
  const b = { south: Math.min(...lats), west: Math.min(...lons), north: Math.max(...lats), east: Math.max(...lons) };
  if (![b.south, b.west, b.north, b.east].every(Number.isFinite) || b.south < -90 || b.north > 90 || b.west < -180 || b.east > 180) {
    throw new Error('Out-of-range bounds');
  }
  return b;
}

/** Approximate ground size of a lat/lon box in metres (for showing resolution and area). */
export function boundsSizeM(b: LatLonBounds): { widthM: number; heightM: number } {
  const midLat = ((b.south + b.north) / 2) * (Math.PI / 180);
  return {
    widthM: (b.east - b.west) * 111_320 * Math.cos(midLat),
    heightM: (b.north - b.south) * 110_574,
  };
}

/**
 * The POSGAR false easting encodes the strip in its millions digit (4 5xx xxx m → faja 4), and a real
 * easting sits within ~250 km of its strip's central meridian. Returns that strip, or null.
 * (Ported from the AgroCordS-based Field Shift lot module.)
 */
export function posgarStripFromEasting(easting: number): number | null {
  const faja = Math.floor(easting / 1_000_000);
  if (faja < 1 || faja > 7) return null;
  return Math.abs(easting - (faja * 1_000_000 + 500_000)) <= 250_000 ? faja : null;
}

/** Northings of POSGAR Gauss–Krüger in Argentina (origin at the South Pole): ≈ 3.5 to 7.8 million m. */
function looksLikeNorthing(v: number): boolean {
  return v >= 3_500_000 && v <= 7_800_000;
}

/**
 * Argentine survey plans often write Gauss–Krüger as X = north, Y = east (the reverse of CAD's x = east).
 * Decides from one sample vertex, preferring the strip the user chose.
 */
export function decidePosgarAxes(x: number, y: number, chosenStrip: number): { swap: boolean; strip: number | null } {
  const fx = posgarStripFromEasting(x);
  const fy = posgarStripFromEasting(y);
  if (fx === chosenStrip && looksLikeNorthing(y)) return { swap: false, strip: fx };
  if (fy === chosenStrip && looksLikeNorthing(x)) return { swap: true, strip: fy };
  if (fx !== null && looksLikeNorthing(y)) return { swap: false, strip: fx };
  if (fy !== null && looksLikeNorthing(x)) return { swap: true, strip: fy };
  return { swap: false, strip: null };
}

/** POSGAR 2007 strip (1–7) whose central meridian is closest to a longitude; null outside Argentina's strips. */
export function posgarStripForLon(lon: number): number | null {
  const f = Math.round((lon + 72) / 3) + 1;
  return f >= 1 && f <= 7 ? f : null;
}

/** Lat/lon → POSGAR 2007 Gauss–Krüger coordinates in the lot's own strip (what Argentine surveyors use). */
export function toPosgar(lat: number, lon: number): { faja: number; epsg: number; x: number; y: number } | null {
  const faja = posgarStripForLon(lon);
  if (faja === null) return null;
  const epsg = 5342 + faja;
  const [x, y] = proj4('EPSG:4326', proj4DefFor(epsg)!, [lon, lat]) as [number, number];
  return { faja, epsg, x, y };
}
