import { describe, expect, it } from 'vitest';
import { bestScene, buildCmrUrl, hlsTileUrl, mergeScenes, parseCmrGranules } from './hls';

const cmr = {
  feed: {
    entry: [
      { time_start: '2026-10-25T14:20:41.000Z', cloud_cover: '100', title: 'HLS.S30.T20JLQ.2026298T142041.v2.0' },
      { time_start: '2026-09-23T14:17:11.000Z', cloud_cover: '0', title: 'HLS.S30.T20JLQ.2026266T141711.v2.0' },
      { time_start: 'not-a-date', cloud_cover: '5' },
      { time_start: '2026-09-15T14:20:51.000Z', title: 'no cloud field' },
    ],
  },
};

describe('HLS scene search', () => {
  it('builds a CMR query with lon,lat point order and the right collection', () => {
    const url = new URL(buildCmrUrl('L30', -27.78, -64.26, new Date('2026-08-01T00:00:00Z'), new Date('2026-11-14T00:00:00Z')));
    expect(url.searchParams.get('short_name')).toBe('HLSL30');
    expect(url.searchParams.get('point')).toBe('-64.26000,-27.78000');
    expect(url.searchParams.get('temporal')).toBe('2026-08-01T00:00:00Z,2026-11-14T00:00:00Z');
  });

  it('parses granules, skips malformed ones and keeps unknown cloud cover as null', () => {
    const scenes = parseCmrGranules(cmr, 'S30');
    expect(scenes.map((s) => s.date)).toEqual(['2026-10-25', '2026-09-23', '2026-09-15']);
    expect(scenes[2]?.cloudPct).toBeNull();
  });

  it('rejects a response without a feed', () => {
    expect(() => parseCmrGranules({ errors: ['x'] }, 'S30')).toThrow();
  });

  it('keeps the clearest scene per date and sorts newest first', () => {
    const merged = mergeScenes([
      [{ date: '2026-09-23', sensor: 'S30', cloudPct: 40, granule: 'a' }],
      [
        { date: '2026-09-23', sensor: 'L30', cloudPct: 5, granule: 'b' },
        { date: '2026-10-01', sensor: 'L30', cloudPct: 90, granule: 'c' },
      ],
    ]);
    expect(merged.map((s) => `${s.date}/${s.sensor}`)).toEqual(['2026-10-01/L30', '2026-09-23/L30']);
  });

  it('picks the newest scene under the cloud limit, or none', () => {
    const scenes = parseCmrGranules(cmr, 'S30');
    expect(bestScene(scenes)?.date).toBe('2026-09-23');
    expect(bestScene(scenes.slice(0, 1))).toBeNull();
  });

  it('points tiles at the GIBS HLS layer for the sensor and date', () => {
    expect(hlsTileUrl('S30', '2026-09-23')).toContain('HLS_S30_Nadir_BRDF_Adjusted_Reflectance/default/2026-09-23/GoogleMapsCompatible_Level12');
  });
});
