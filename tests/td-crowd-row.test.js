// @vitest-environment jsdom
// A crowd on a narrow strip of ground is one row, not a staircase (the user, 2026-10-16, The Fishing Spot: "why are
// they positioned like this"). keepDry's back-row rule took six people standing side by side, each under .08 apart, as
// each one behind the last, and stepped every one of them up the hill.
import { describe, it, expect } from 'vitest';
import { placeScene } from '../js/vp-td-ep/steps.js';
import { TD_MARKS } from '../js/vp-td-ep/marks.js';

const NAMES = ['Manu', 'Oliwia', 'Lake', 'Sami', 'Grett', 'Bruno'];

describe('a crowd of up to six', () => {
  it('stands in one row at the fishing spot', () => {
    const o = placeScene('survival-island/fishing-area-day', NAMES);
    const vs = NAMES.map(n => o[n].v);
    expect(Math.max(...vs) - Math.min(...vs)).toBeLessThan(.02);
  });
  it('never climbs the frame on any plate that has no water under it', () => {
    const bad = [];
    for (const key of Object.keys(TD_MARKS)) {
      const o = placeScene(key, NAMES);
      const vs = NAMES.map(n => o[n]?.v).filter(v => v != null);
      // a staircase: every person a step above the one before
      const steps = vs.slice(1).filter((v, i) => vs[i] - v > .03).length;
      if (steps >= 4) bad.push(`${key} ${vs.map(v => v.toFixed(2)).join(' ')}`);
    }
    expect(bad).toEqual([]);
  });
});
