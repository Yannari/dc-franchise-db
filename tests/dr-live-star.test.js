// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-live-star.test.js — the audience can change who the darling is
// ══════════════════════════════════════════════════════════════════════
//
// Star power was rolled once in js/dr/state.js and never moved. `hostBend`
// leans on it, so the queen who won the casting draw kept the benefit of the
// doubt for thirteen weeks no matter how the room reacted — and anything built
// on top of it (a Rigga Morris, a redemption, a room turning on somebody) had
// no brake, because nothing could ever change who the favourite was.
//
// `starBase` is the roll and never moves. `star` drifts, and refreshStar is
// how — relative to the LIVING room, ramped over the first four episodes,
// with no rng in it so a replay rebuilds the same darlings.
import { describe, expect, it } from 'vitest';
import { refreshStar } from '../js/dr/state.js';

const room = (pops, base = 5) => ({
  starBase: Object.fromEntries(Object.keys(pops).map(n => [n, base])),
  star: Object.fromEntries(Object.keys(pops).map(n => [n, base])),
  living: Object.keys(pops),
  popularity: pops,
  record: Object.fromEntries(Object.keys(pops).map(n => [n, ['SAFE', 'SAFE', 'SAFE', 'SAFE']])),
});

describe('star power after the audience has seen her', () => {
  it('lifts the queen the room likes and drops the one it does not', () => {
    const s = room({ A: 40, B: 10, C: -5 });
    refreshStar(s);
    expect(s.star.A).toBeGreaterThan(s.starBase.A);
    expect(s.star.C).toBeLessThan(s.starBase.C);
    expect(s.star.A).toBeGreaterThan(s.star.C);
  });

  it('is relative to the room, so a rising tide moves nobody', () => {
    /* THE DEFECT THIS AVOIDS is already documented on `relStar` in
       js/dr/judging.js: read raw, the term is always positive, lifts every
       queen at once and cancels out. Late in a season everyone's popularity is
       high; that must not make everyone a star. */
    const flat = room({ A: 60, B: 60, C: 60 });
    refreshStar(flat);
    for (const n of ['A', 'B', 'C']) expect(flat.star[n]).toBe(flat.starBase[n]);
  });

  it('ramps in, so the premiere still belongs to casting', () => {
    const s = room({ A: 40, B: 10, C: -5 });
    for (const n of s.living) s.record[n] = [];      // nothing aired yet
    refreshStar(s);
    for (const n of s.living) expect(s.star[n]).toBe(s.starBase[n]);
  });

  it('cannot erase what she was cast as', () => {
    // A whole season of adoration is worth about 1.2 star points, a little
    // over one standard deviation of star itself — enough to change who the
    // favourite is, not enough to make a wallflower the darling.
    const s = room({ A: 500, B: 0, C: 0 });
    refreshStar(s);
    // 1.2 plus a hair: the value is rounded to two places and 6.2 - 5 is
    // 1.2000000000000002, which is float arithmetic, not a cap being exceeded.
    expect(s.star.A - s.starBase.A).toBeLessThanOrEqual(1.2001);
    expect(s.star.A - s.starBase.A).toBeGreaterThan(1.1);
    expect(s.star.A).toBeLessThanOrEqual(10);
  });

  it('is pure — the same state twice gives the same darlings', () => {
    // No rng in it, which is what keeps a replayed season replayable.
    const a = room({ A: 40, B: 10, C: -5 });
    const b = room({ A: 40, B: 10, C: -5 });
    expect(JSON.stringify(refreshStar(a))).toBe(JSON.stringify(refreshStar(b)));
    const once = JSON.stringify(a.star);
    refreshStar(a);
    expect(JSON.stringify(a.star), 'calling it twice moved it').toBe(once);
  });

  it('leaves an eliminated queen on the number she left with', () => {
    const s = room({ A: 40, B: 10, C: -5 });
    s.living = ['A', 'B'];
    refreshStar(s);
    expect(s.star.C).toBe(s.starBase.C);
  });

  it('does nothing to a season with no base — the old-save arm', () => {
    const legacy = { star: { A: 6 }, living: ['A'], popularity: { A: 40 } };
    expect(() => refreshStar(legacy)).not.toThrow();
    expect(legacy.star.A).toBe(6);
  });
});
