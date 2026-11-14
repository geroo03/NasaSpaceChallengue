import type { TerrainSummary } from './model';

/**
 * Survey request for a drone service provider, modelled on Vuelo Verde's technical report
 * (altimetry with DSM + RTK and contour lines for surface irrigation; RGB orthomosaic; delivery in
 * POSGAR 2007 faja 4 or WGS 84). Field Shift only writes the request: price, dates and flight plan are
 * agreed with the provider.
 */

export const SURVEY_SERVICES = ['altimetry', 'ortho', 'multispectral'] as const;
export type SurveyService = (typeof SURVEY_SERVICES)[number];

export const SURVEY_WINDOWS = ['asap', 'beforeSowing', 'afterHarvest', 'toAgree'] as const;
export type SurveyWindow = (typeof SURVEY_WINDOWS)[number];

export interface SurveyRequest {
  services: SurveyService[];
  window: SurveyWindow;
  notes: string;
  areaHa: number;
  centre: [number, number];
  posgar: { faja: number; epsg: number; x: number; y: number } | null;
  terrain: TerrainSummary | null;
  lotLabel: string | null;
}

type T = (key: string, params?: Record<string, string | number>) => string;
type Num = (v: number, digits?: number) => string;

/** Plain text, ready to paste into WhatsApp or an email. */
export function buildSurveyText(r: SurveyRequest, t: T, num: Num): string {
  const lines: string[] = [t('req.text.hello'), ''];
  lines.push(t('req.text.lot', { ha: num(r.areaHa, 1) }) + (r.lotLabel ? ` (${r.lotLabel})` : ''));
  lines.push(t('req.text.centre', { lat: r.centre[0].toFixed(5), lon: r.centre[1].toFixed(5) }));
  if (r.posgar) lines.push(t('req.text.posgar', { faja: r.posgar.faja, epsg: r.posgar.epsg, x: num(Math.round(r.posgar.x)), y: num(Math.round(r.posgar.y)) }));
  if (r.terrain) {
    lines.push(
      t(r.terrain.source === 'drone' ? 'req.text.terrainDrone' : 'req.text.terrainSrtm', {
        relief: num(r.terrain.reliefM, 1),
        slope: num(r.terrain.slopePct, 1),
      }),
    );
  }
  lines.push('', t('req.text.services'));
  for (const s of r.services) lines.push(`• ${t(`req.svc.${s}`)} — ${t(`req.svc.${s}.deliver`)}`);
  lines.push('', r.posgar ? t('req.text.crs', { faja: r.posgar.faja }) : t('req.text.crsWgs'));
  lines.push(t('req.text.when', { when: t(`req.when.${r.window}`) }));
  if (r.notes.trim()) lines.push(t('req.text.notes', { notes: r.notes.trim() }));
  lines.push('', t('req.text.kml'), t('req.text.sign'));
  return lines.join('\n');
}

/** wa.me link; the number comes from configuration, never invented. */
export function whatsappLink(phone: string, text: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
