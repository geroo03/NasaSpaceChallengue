import { describe, expect, it } from 'vitest';
import { DRONE_PRESETS, ownCan, validProfile } from './profile';

describe('own drone', () => {
  it('routes each job by what the drone can do', () => {
    const m3m = DRONE_PRESETS['DJI Mavic 3 Multispectral']!;
    const t50 = DRONE_PRESETS['DJI Agras T50']!;
    const m3e = DRONE_PRESETS['DJI Mavic 3 Enterprise']!;
    expect([ownCan(m3m, 'map'), ownCan(m3m, 'vra'), ownCan(m3m, 'spray')]).toEqual([true, true, false]);
    expect([ownCan(t50, 'map'), ownCan(t50, 'seed'), ownCan(t50, 'spray')]).toEqual([false, true, true]);
    expect(ownCan(m3e, 'vra')).toBe(false);
    expect(ownCan(null, 'map')).toBe(false);
  });
  it('rejects a profile without a name', () => {
    expect(validProfile({ name: ' ', farm: '', drone: null })).toBe(false);
    expect(validProfile({ name: 'Ana', farm: 'La Esperanza', drone: null })).toBe(true);
  });
});
