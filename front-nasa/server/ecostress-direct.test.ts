import { describe, expect, it, vi } from 'vitest';
import { extractDirect, parseDirectScenes, pixelWindow, utmEpsg } from './ecostress-direct';
import { parseEcostressCsv } from '../src/ecostress/data';
const point = { lat: -28.38175, lon: -62.73655 };
const granule = 'ECOv002_L3T_JET_46688_028_20JNP_20260929T114626_0713_01';
const entry = { id: 'G4356141210-LPCLOUD', title: granule, time_start: '2026-09-29T11:46:26.742Z', links: ['ETdaily', 'cloud', 'water'].map((layer) => ({ href: `https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/ECO_L3T_JET.002/${granule}/${granule}_${layer}.tif` })) };
describe('direct authenticated ECOSTRESS extraction', () => {
  it('resolves the user-defined WGS84 UTM CRS used by the real NASA COG', () => {
    expect(utmEpsg({ ProjectedCSTypeGeoKey: 32767, GTCitationGeoKey: 'WGS 84 / UTM zone 20S', ProjLinearUnitsGeoKey: 9001 })).toBe(32720);
    expect(utmEpsg({ ProjectedCSTypeGeoKey: 32615 })).toBe(32615);
    expect(() => utmEpsg({ ProjectedCSTypeGeoKey: 32767, GTCitationGeoKey: 'unknown', ProjLinearUnitsGeoKey: 9001 })).toThrow('crs');
  });
  it('locates the native pixel from verified georeferencing and refuses out-of-bounds instead of zero fill', () => {
    const p = pixelWindow(point, 32720, [499980, 6900040], [70, -70], 1568, 1568);
    expect(p.col).toBe(369); expect(p.row).toBe(565); expect(p.resolutionM).toBe(70);
    expect(Math.abs(p.pixelLat - point.lat)).toBeLessThan(0.001);
    expect(() => pixelWindow({ lat: 0, lon: 0 }, 32720, [499980, 6900040], [70, -70], 1568, 1568)).toThrow('outside');
  });
  it('accepts complete NASA bundles and refuses alternate hosts and product paths', () => {
    expect(parseDirectScenes({ feed: { entry: [entry] } })).toHaveLength(1);
    const other = { ...entry, links: entry.links.map((x) => ({ href: x.href.replace('data.lpdaac.earthdatacloud.nasa.gov', 'example.com') })) };
    expect(parseDirectScenes({ feed: { entry: [other] } })).toEqual([]);
    expect(parseDirectScenes({ feed: { entry: [{ ...entry, links: entry.links.slice(0, 2) }] } })).toEqual([]);
  });
  it('combines the same native pixel and masks in a traceable, compatible numerical CSV', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ feed: { entry: [entry] } })));
    const reader = vi.fn(async (url: string) => ({ value: url.endsWith('_ETdaily.tif') ? 123.5 : 0, col: 369, row: 565, epsg: 32720, pixelLat: -28.3818, pixelLon: -62.7365, resolutionM: 70 }));
    const result = await extractDirect({ ...point, from: '2026-08-17', to: '2026-11-15' }, 'private-test-token', fetcher, reader);
    expect(reader).toHaveBeenCalledTimes(3); expect(result.csv).not.toContain('private-test-token'); expect(result.csv).toContain(granule);
    expect(parseEcostressCsv(result.csv, point).observations[0]?.etMmDay).toBe(123.5);
  });
  it('rejects a mask from a different grid instead of applying it to the ET pixel', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ feed: { entry: [entry] } })));
    const reader = vi.fn(async (url: string) => ({ value: 0, col: url.endsWith('_cloud.tif') ? 1 : 2, row: 565, epsg: 32720, pixelLat: -28.3818, pixelLon: -62.7365, resolutionM: 70 }));
    await expect(extractDirect({ ...point, from: '2026-08-17', to: '2026-11-15' }, 'test', fetcher, reader)).rejects.toThrow('crs');
  });
});
