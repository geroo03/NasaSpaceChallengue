import { describe, expect, it } from 'vitest';
import { buildSurveyText, whatsappLink, type SurveyRequest } from './droneRequest';
import { toPosgar } from '../imagery/crs';

const t = (key: string, p: Record<string, string | number> = {}) => `${key}${Object.keys(p).length ? JSON.stringify(p) : ''}`;
const num = (v: number, d = 0) => v.toFixed(d);

describe('drone survey request', () => {
  it('places Añatuya in POSGAR 2007 faja 4 with the official false easting', () => {
    const p = toPosgar(-28.4606, -62.8347)!;
    expect(p.faja).toBe(4);
    expect(p.epsg).toBe(5346);
    expect(p.x).toBeGreaterThan(4_500_000); // east of the −63° central meridian
    expect(p.x).toBeLessThan(4_520_000);
    expect(p.y).toBeGreaterThan(6_800_000);
    expect(toPosgar(-28, 10)).toBeNull();
  });

  const req: SurveyRequest = {
    services: ['altimetry', 'ortho'],
    window: 'beforeSowing',
    notes: '  riego por surcos  ',
    areaHa: 36.04,
    centre: [-28.4606, -62.8347],
    posgar: toPosgar(-28.4606, -62.8347),
    terrain: { source: 'srtm', samples: 400, meanM: 162, reliefM: 2.1, slopePct: 0.2, aspectDeg: null, slopeClass: 'flat', sources: [] },
    lotLabel: 'Lote 21',
  };

  it('lists the lot, its coordinates, the chosen services and the SRTM estimate as such', () => {
    const text = buildSurveyText(req, t, num);
    expect(text).toContain('req.text.lot{"ha":"36.0"} (Lote 21)');
    expect(text).toContain('"faja":4');
    expect(text).toContain('req.text.terrainSrtm');
    expect(text).toContain('req.svc.altimetry');
    expect(text).not.toContain('req.svc.multispectral');
    expect(text).toContain('"notes":"riego por surcos"');
  });

  it('only builds a WhatsApp link from a configured number', () => {
    expect(whatsappLink('', 'hola')).toBeNull();
    expect(whatsappLink('+54 9 385 000-0000', 'a b')).toBe('https://wa.me/5493850000000?text=a%20b');
  });
});
