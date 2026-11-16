import { describe, expect, it } from 'vitest';
import { mergeGuide } from './GuideContext';

describe('tutorial progress across devices', () => {
  it('a guide seen on any device counts as seen in the account', () => {
    const phone = { off: false, seen: ['lot', 'farm'] };
    const account = { off: false, seen: ['lot', 'results', 'tip.forecast'] };
    const m = mergeGuide(phone, account);
    expect(m.off).toBe(false);
    expect([...m.seen].sort()).toEqual(['farm', 'lot', 'results', 'tip.forecast']);
  });
  it('turning guides off anywhere keeps them off', () => {
    expect(mergeGuide({ off: true, seen: [] }, { off: false, seen: ['lot'] }).off).toBe(true);
  });
});
