import { getCrop, type CropId } from '../engine/domain/crops';
import type { StrategyResult } from '../engine/domain/rotations';
import { planFieldChecks } from './verification';

/**
 * What agricultural drones do on a lot, planned from the chosen rotation:
 *  - mapping (survey before sowing): a lawn-mower flight over the boundary and what it yields;
 *  - broadcast seeding of the rotation's cover crops;
 *  - spraying (cover-crop termination, fallow weed control) — product and dose come from the
 *    agronomist's prescription, never from AgroField.
 * Every number is a planning estimate for the pilot to confirm; defaults are marked as examples.
 */

type LatLon = [number, number];

// --- Mapping -----------------------------------------------------------------------------------------

export interface MappingCamera {
  /** Ground sample distance per metre of height (cm/px per m). */
  gsdCmPerM: number;
  imageWidthPx: number;
  imageHeightPx: number;
}

/** DJI Mavic 3 Multispectral RGB camera, the drone named in Vuelo Verde's report (GSD = H/36.5 cm). */
export const M3M_RGB: MappingCamera = { gsdCmPerM: 1 / 36.5, imageWidthPx: 5280, imageHeightPx: 3956 };

export interface MappingInput {
  heightM: number;
  frontOverlap: number; // 0–1
  sideOverlap: number; // 0–1
  speedMs: number;
  /** Usable flight time per battery, minutes (assumption the pilot adjusts). */
  batteryMin: number;
  camera: MappingCamera;
}

export const MAPPING_DEFAULTS: MappingInput = { heightM: 100, frontOverlap: 0.8, sideOverlap: 0.7, speedMs: 10, batteryMin: 25, camera: M3M_RGB };

export interface FlightPlan {
  gsdCm: number;
  lineSpacingM: number;
  photoSpacingM: number;
  lines: { a: [number, number]; b: [number, number] }[]; // local metres (x east, y north)
  outline: [number, number][]; // lot in the same local metres
  lineLengthM: number;
  totalPathM: number;
  photos: number;
  minutes: number;
  batteries: number;
  bearingDeg: number;
}

/** Lat/lon ring → local metres around its first vertex (equirectangular; fine for a field). */
export function toLocal(ring: LatLon[]): [number, number][] {
  const [lat0, lon0] = ring[0]!;
  const k = Math.cos((lat0 * Math.PI) / 180);
  return ring.map(([lat, lon]) => [(lon - lon0) * 111_320 * k, (lat - lat0) * 110_574]);
}

/** Lawn-mower lines along the lot's longest edge, spaced `spacing` m, clipped to the polygon. */
export function lawnmower(poly: [number, number][], spacing: number): { lines: { a: [number, number]; b: [number, number] }[]; bearingDeg: number } {
  if (poly.length < 3 || spacing <= 0) return { lines: [], bearingDeg: 0 };
  // Longest edge sets the flight direction (fewer turns).
  let best = 0;
  let ang = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]!;
    const [x2, y2] = poly[(i + 1) % poly.length]!;
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > best) {
      best = len;
      ang = Math.atan2(y2 - y1, x2 - x1);
    }
  }
  const cos = Math.cos(-ang);
  const sin = Math.sin(-ang);
  const rot = poly.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos] as [number, number]);
  const back = (x: number, y: number): [number, number] => [x * Math.cos(ang) - y * Math.sin(ang), x * Math.sin(ang) + y * Math.cos(ang)];
  const ys = rot.map((p) => p[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const lines: { a: [number, number]; b: [number, number] }[] = [];
  let flip = false;
  for (let y = minY + spacing / 2; y < maxY; y += spacing) {
    const xs: number[] = [];
    for (let i = 0; i < rot.length; i++) {
      const [x1, y1] = rot[i]!;
      const [x2, y2] = rot[(i + 1) % rot.length]!;
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const [xa, xb] = flip ? [xs[i + 1]!, xs[i]!] : [xs[i]!, xs[i + 1]!];
      lines.push({ a: back(xa, y), b: back(xb, y) });
    }
    flip = !flip;
  }
  // Bearing clockwise from north of the flight direction.
  const bearingDeg = (((90 - (ang * 180) / Math.PI) % 180) + 180) % 180;
  return { lines, bearingDeg };
}

export function planMapping(ring: LatLon[], input: MappingInput = MAPPING_DEFAULTS): FlightPlan {
  const outline = toLocal(ring);
  const gsdCm = input.heightM * input.camera.gsdCmPerM;
  const footprintAcross = (input.camera.imageWidthPx * gsdCm) / 100;
  const footprintAlong = (input.camera.imageHeightPx * gsdCm) / 100;
  const lineSpacingM = footprintAcross * (1 - input.sideOverlap);
  const photoSpacingM = footprintAlong * (1 - input.frontOverlap);
  const { lines, bearingDeg } = lawnmower(outline, lineSpacingM);
  const lineLengthM = lines.reduce((acc, l) => acc + Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]), 0);
  // Turns: one line spacing between consecutive lines.
  const totalPathM = lineLengthM + Math.max(0, lines.length - 1) * lineSpacingM;
  const minutes = totalPathM / input.speedMs / 60;
  return {
    gsdCm,
    lineSpacingM,
    photoSpacingM,
    lines,
    outline,
    lineLengthM,
    totalPathM,
    photos: Math.ceil(lineLengthM / Math.max(photoSpacingM, 0.1)) + lines.length,
    minutes,
    batteries: Math.max(1, Math.ceil(minutes / Math.max(input.batteryMin, 1))),
    bearingDeg,
  };
}

// --- Seeding and spraying -------------------------------------------------------------------------------

export interface ApplicationInput {
  areaHa: number;
  /** L/ha (spraying) or kg/ha (seeding). */
  ratePerHa: number;
  /** Tank (L) or hopper (kg) per load. */
  loadCapacity: number;
  swathM: number;
  speedKmh: number;
  /** Share of time actually applying (turns, reloads, battery swaps). Assumption. */
  efficiency: number;
}

/** From Vuelo Verde's report (spraying, 2026): 20 km/h, 8 m swath, 25 L/ha. Tank size is an example. */
export const SPRAY_DEFAULTS: Omit<ApplicationInput, 'areaHa'> = { ratePerHa: 25, loadCapacity: 40, swathM: 8, speedKmh: 20, efficiency: 0.6 };
/** Seeding: rate, hopper and swath are EXAMPLES to confirm (the report gives no seeding parameters). */
export const SEED_DEFAULTS: Omit<ApplicationInput, 'areaHa'> = { ratePerHa: 30, loadCapacity: 40, swathM: 7, speedKmh: 20, efficiency: 0.6 };

export interface ApplicationPlan {
  total: number;
  loads: number;
  haPerHour: number;
  hours: number;
}

export function planApplication(i: ApplicationInput): ApplicationPlan {
  const total = i.areaHa * i.ratePerHa;
  const haPerHour = (i.swathM * i.speedKmh * 1000 * Math.max(0.05, Math.min(1, i.efficiency))) / 10_000;
  return {
    total,
    loads: i.loadCapacity > 0 ? Math.ceil(total / i.loadCapacity) : 0,
    haPerHour,
    hours: haPerHour > 0 ? i.areaHa / haPerHour : 0,
  };
}

// --- Drone work calendar for a rotation ----------------------------------------------------------------

export type DroneJob = 'map' | 'seed' | 'spray';

export interface DroneTask {
  job: DroneJob;
  /** Timeline index (0–23). */
  month: number;
  reason: 'beforeSowing' | 'coverSeeding' | 'coverTermination' | 'fallowWeeds';
  crop?: CropId;
}

/** When a drone helps in this rotation: survey before the first sowing, seed each cover crop, spray to end it and to keep fallows clean. */
export function droneCalendar(s: StrategyResult): DroneTask[] {
  const tasks: DroneTask[] = [];
  const checks = planFieldChecks(s);
  const pre = checks.find((c) => c.kind === 'preSowing');
  if (pre) tasks.push({ job: 'map', month: pre.month, reason: 'beforeSowing', crop: pre.crop });
  for (const a of [...s.slots].sort((x, y) => x.startIndex - y.startIndex)) {
    const crop = getCrop(a.crop.id);
    if (crop.role !== 'cover' || !a.months.length) continue;
    tasks.push({ job: 'seed', month: a.months[0]!, reason: 'coverSeeding', crop: crop.id });
    tasks.push({ job: 'spray', month: a.months[a.months.length - 1]!, reason: 'coverTermination', crop: crop.id });
  }
  const residue = checks.find((c) => c.kind === 'residue');
  if (residue) tasks.push({ job: 'spray', month: residue.month, reason: 'fallowWeeds' });
  return tasks.sort((a, b) => a.month - b.month);
}
