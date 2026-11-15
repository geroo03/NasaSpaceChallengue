/**
 * The user's profile and, if they have one, their own drone.
 * Kept on this device (localStorage) until the backend adds real accounts:
 * no password, nothing leaves the browser.
 */
export type MappingSensor = 'none' | 'rgb' | 'multispectral';

export interface OwnDrone {
  model: string;
  mapping: MappingSensor;
  batteryMin: number; // usable flight minutes per battery, mapping
  spray: { tankL: number; swathM: number; speedKmh: number } | null;
  seed: { hopperKg: number; swathM: number; speedKmh: number } | null;
}

export interface Profile {
  name: string;
  farm: string;
  drone: OwnDrone | null; // null → jobs go to Vuelo Verde
}

/**
 * Starting points by model. Figures are typical manufacturer values rounded down for field use:
 * the owner edits them to match their own unit.
 */
export const DRONE_PRESETS: Record<string, OwnDrone> = {
  'DJI Mavic 3 Multispectral': { model: 'DJI Mavic 3 Multispectral', mapping: 'multispectral', batteryMin: 35, spray: null, seed: null },
  'DJI Mavic 3 Enterprise': { model: 'DJI Mavic 3 Enterprise', mapping: 'rgb', batteryMin: 35, spray: null, seed: null },
  'DJI Agras T50': { model: 'DJI Agras T50', mapping: 'none', batteryMin: 0, spray: { tankL: 40, swathM: 9, speedKmh: 20 }, seed: { hopperKg: 50, swathM: 7, speedKmh: 20 } },
  'DJI Agras T25': { model: 'DJI Agras T25', mapping: 'none', batteryMin: 0, spray: { tankL: 20, swathM: 7, speedKmh: 20 }, seed: { hopperKg: 25, swathM: 6, speedKmh: 20 } },
  other: { model: '', mapping: 'rgb', batteryMin: 25, spray: null, seed: null },
};

export type DroneJobKind = 'map' | 'vra' | 'seed' | 'spray';

/** Can the user's own drone do this job? (vra needs a multispectral camera.) */
export function ownCan(drone: OwnDrone | null, job: DroneJobKind): boolean {
  if (!drone) return false;
  if (job === 'map') return drone.mapping !== 'none';
  if (job === 'vra') return drone.mapping === 'multispectral';
  if (job === 'seed') return drone.seed !== null;
  return drone.spray !== null;
}

const KEY = 'field-shift-lab.profile';

export function validProfile(p: unknown): p is Profile {
  const x = p as Profile;
  return !!x && typeof x.name === 'string' && x.name.trim().length > 0 && typeof x.farm === 'string' && (x.drone === null || (typeof x.drone === 'object' && typeof x.drone.model === 'string'));
}

export function loadProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    const p: unknown = raw ? JSON.parse(raw) : null;
    return validProfile(p) ? p : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile | null): void {
  try {
    if (p) window.localStorage.setItem(KEY, JSON.stringify(p));
    else window.localStorage.removeItem(KEY);
  } catch {
    // private mode: the profile lives for this visit only
  }
}
