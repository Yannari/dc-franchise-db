// @vitest-environment jsdom
// Narrative regression: strategic explanations should stay accurate without one
// stock loyalty or consistency line dominating complete seasons.
import { describe, it, expect } from 'vitest';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

const OVERUSED_STEMS = [
  'this vote makes sense',
  'the plan still needs people to hold',
  'no reason to deviate',
  'going along with it',
  'has the numbers and this is clean',
  'gets the vote this round',
];

describe('strategy prose variety', () => {
  it('does not let legacy stock lines dominate season-long ballot explanations', () => {
    const reasons = [];
    seededRun(() => {
      for (let s = 0; s < 10; s++) {
        runOneSeason({ advantages: { idol: { enabled: true } } });
        (core.gs.episodeHistory || []).forEach(h =>
          (h.votingLog || []).forEach(v => { if (v.reason) reasons.push(v.reason.toLowerCase()); }));
      }
    }, 20260717);

    expect(reasons.length).toBeGreaterThan(500);
    OVERUSED_STEMS.forEach(stem => {
      const share = reasons.filter(r => r.includes(stem)).length / reasons.length;
      expect(share, `stock line "${stem}" occupied ${(share * 100).toFixed(1)}% of ballots`).toBeLessThan(0.08);
    });

    const held = reasons.filter(r => r.startsWith('[held commitment]'));
    expect(held.length).toBeGreaterThan(5);
    const originalHeld = held.filter(r => r.includes('no credible late coalition or disruption justified')).length;
    expect(originalHeld / held.length).toBeLessThan(0.60);
  }, 180000);
});
