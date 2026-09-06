// ══════════════════════════════════════════════════════════════════════
// dr-week.test.js — one episode, end to end
// ══════════════════════════════════════════════════════════════════════
//
// The spine that assembles the three steps into a week and writes the row the
// whole site reads. Two properties matter more than the rest: the row must
// carry `eliminated: null` with departures on `exits[]` — this show has no
// vote and every existing reader of `eliminated` means one — and the same seed
// must produce a byte-identical episode, because re-airing one is how the
// viewing party works.
import { describe, expect, it } from 'vitest';
import { initDragState } from '../js/dr/state.js';
import { runDragWeek, reactionFor, SCENE_STEPS } from '../js/dr/week.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];

function cast(n = 12, seed = 1) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: ['f', 'm', 'nb'][i % 3],
    archetype: i % 2 ? 'villain' : 'hero', age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

const ctxFor = (c, seed = 3) => ({
  rng: rngFor(seed),
  players: Object.fromEntries(c.map(p => [p.name, p])),
  bond: () => 0,
  addBond: () => {},
  popDelta: () => {},
});

const cfg = (over = {}) => ({
  num: 1, maxiId: 'acting', miniId: 'reading', rotatingId: 'ross', guest: null,
  songTitle: 'Toxic', judgeWeights: {}, immunity: false,
  allowDoubleShantay: false, allowDoubleSashay: false, ...over,
});

describe('initDragState', () => {
  it('seats the cast, rolls star power once, and stays serialisable', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    expect(st.living.length).toBe(12);
    expect(Object.keys(st.star).length).toBe(12);
    // Nothing here may be a function, a Set or a Map: it goes into the save.
    expect(JSON.parse(JSON.stringify(st))).toEqual(st);
  });
});

describe('runDragWeek', () => {
  it('plays one week and writes a row the site can read', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const row = runDragWeek(st, cfg(), ctxFor(c));

    expect(row.format).toBe('drag-race');
    // The vote field this show does not have.
    expect(row.eliminated).toBe(null);
    expect(row.exits.length).toBe(1);
    expect(row.exits[0].verb).toBe('sashayed away');
    expect(row.exits[0].channel).toBe('lipsync');
    expect(row.exits[0].slug).toBeTruthy();

    expect(row.dr.call.win.length).toBe(1);
    expect(row.dr.call.bottom.length).toBe(2);
    expect(row.dr.call.bottom).toContain(row.exits[0].name);

    expect(st.living.length).toBe(11);
    expect(st.record[row.dr.call.win[0]]).toEqual(['WIN']);
    expect(st.record[row.exits[0].name]).toEqual(['ELIM']);
    expect(st.out).toEqual([row.exits[0].name]);
    expect(row.dr.lipsync.song).toBe('Toxic');
    expect(row.houseAtStart.length).toBe(12);
    expect(row.dr.panel.ranking.length).toBe(12);
    expect(row.dr.bend.length).toBe(12);
  });

  it('gives every living queen exactly one result', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    runDragWeek(st, cfg(), ctxFor(c));
    for (const p of c) {
      expect(st.record[p.name].length, `${p.name} got no result`).toBe(1);
      expect(['WIN', 'HIGH', 'SAFE', 'LOW', 'BTM', 'ELIM']).toContain(st.record[p.name][0]);
    }
  });

  it('runs the steps in the running order, and only the ones that happened', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const steps = runDragWeek(st, cfg(), ctxFor(c)).dr.scenes.map(s => s.step);
    // Every step drawn is a real step, and they are in order.
    for (const s of steps) expect(SCENE_STEPS).toContain(s);
    const idx = steps.map(s => SCENE_STEPS.indexOf(s));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
    // An 'acting' challenge is filmed before elimination day, so it plays in
    // the pre slot and the main-stage slot never happens.
    expect(steps).toContain('maxi-pre');
    expect(steps).not.toContain('maxi-main');
  });

  it('a main-stage maxi runs after the runway, a pre one before', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const steps = runDragWeek(st, cfg({ maxiId: 'roast' }), ctxFor(c)).dr.scenes.map(s => s.step);
    expect(steps.indexOf('maxi-main')).toBeGreaterThan(steps.indexOf('runway'));
    expect(steps).not.toContain('maxi-pre');
  });

  it('no mini means the host arrives at the maxi announcement', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const row = runDragWeek(st, cfg({ miniId: null }), ctxFor(c));
    expect(row.dr.mini).toBe(null);
    expect(row.dr.scenes.map(s => s.step)).not.toContain('mini');
  });

  it('a mini winner is a living queen, and the win buys something', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const row = runDragWeek(st, cfg(), ctxFor(c));
    expect(row.dr.living.concat(row.exits.map(x => x.name))).toContain(row.dr.mini.winner);
    expect(row.dr.mini.buys).toBeTruthy();
  });

  it('immunity keeps last week\'s winner out of the bottom', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const r1 = runDragWeek(st, cfg({ num: 1, immunity: true }), ctxFor(c, 1));
    const w = r1.dr.call.win[0];
    // Make her week as bad as it can possibly be and check she is still safe.
    for (const p of c) {
      if (p.name === w) p.drag = { acting: 1, comedy: 1, dance: 1, design: 1, runway: 1, lipsync: 1, singing: 1 };
    }
    const r2 = runDragWeek(st, cfg({ num: 2, immunity: true }), ctxFor(c, 2));
    expect(r2.dr.call.bottom).not.toContain(w);
    expect(r2.dr.call.safe).toContain(w);
  });

  it('is bit-identical on the same seed and different on another', () => {
    const play = seed => {
      const c = cast();
      return JSON.stringify(runDragWeek(initDragState({ cast: c, seed: 9, rng: rngFor(9) }), cfg(), ctxFor(c, seed)));
    };
    expect(play(9)).toBe(play(9));
    expect(play(9)).not.toBe(play(10));
  });

  it('reports the panel ranking beside the final one, so a bend is visible', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const row = runDragWeek(st, cfg(), ctxFor(c));
    for (const b of row.dr.bend) {
      expect(b.panelRank).toBeGreaterThan(0);
      expect(b.finalRank).toBeGreaterThan(0);
      expect(typeof b.bend).toBe('number');
    }
  });

  it('remembers the reaction of everybody who was critiqued', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const row = runDragWeek(st, cfg(), ctxFor(c));
    const critiqued = [...new Set([...row.dr.call.win, ...row.dr.call.high,
      ...row.dr.call.low, ...row.dr.call.bottom])];
    expect(Object.keys(row.dr.reactions).sort()).toEqual(critiqued.sort());
    for (const n of critiqued) expect(st.lastReaction[n]).toBeTruthy();
  });

  it('plays on down to a finale without crashing or losing anybody', () => {
    const c = cast(12);
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const ctx = ctxFor(c, 4);
    let n = 1;
    while (st.living.length > 4 && n < 30) runDragWeek(st, cfg({ num: n++ }), ctx);
    expect(st.living.length).toBe(4);
    expect(st.out.length).toBe(8);
    expect(new Set([...st.living, ...st.out]).size).toBe(12);
    // Everybody who left did so exactly once.
    expect(new Set(st.out).size).toBe(st.out.length);
  });

  it('three queens still make a bottom two — one wins, two lip sync', () => {
    // This is how a season reaches a final two at all. An earlier version
    // called two of three forward and left a single queen as "the bottom",
    // which made a top-2 finale unreachable: the weekly loop could never get
    // below three. callWeek drops to one win at four or fewer for that reason.
    const c = cast(3);
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const row = runDragWeek(st, cfg(), ctxFor(c));
    expect(row.dr.call.win.length).toBe(1);
    expect(row.dr.call.bottom.length).toBe(2);
    expect(row.dr.lipsync).toBeTruthy();
    expect(st.living.length).toBe(2);
  });

  it('two queens is the floor — no bottom two, so nobody goes home', () => {
    // The true boundary, and the finale's job from here. Asserted rather than
    // left to be discovered, because a silent no-op at the wrong size would be
    // a season that never ends.
    const c = cast(2);
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const row = runDragWeek(st, cfg(), ctxFor(c));
    expect(row.dr.call.bottom.length).toBeLessThan(2);
    expect(row.dr.lipsync).toBe(null);
    expect(row.exits).toEqual([]);
    expect(st.living.length).toBe(2);
  });
});

describe('reactionFor', () => {
  it('reads the gap through temperament', () => {
    const r = (expected, received, temperament, seed = 1) =>
      reactionFor({ expected, received, temperament, boldness: 5, rng: rngFor(seed) });
    expect(['crash-out', 'blow-up', 'tears', 'sadness']).toContain(r(2, 11, 2));
    expect(['joy', 'relief']).toContain(r(6, 1, 6));
  });

  it('always returns a real reaction', () => {
    const all = ['crash-out', 'blow-up', 'tears', 'joy', 'sadness', 'relief', 'idgaf'];
    for (let i = 0; i < 200; i++) {
      const rng = rngFor(i);
      expect(all).toContain(reactionFor({
        expected: 1 + (i % 12), received: 1 + ((i * 7) % 12),
        temperament: 1 + (i % 10), boldness: 1 + (i % 10), rng,
      }));
    }
  });

  it('a bold queen blows up where a timid one crashes out', () => {
    const many = (boldness) => {
      const seen = new Set();
      for (let i = 0; i < 300; i++) {
        seen.add(reactionFor({ expected: 1, received: 12, temperament: 1, boldness, rng: rngFor(i) }));
      }
      return seen;
    };
    expect(many(10).has('blow-up')).toBe(true);
    expect(many(1).has('crash-out')).toBe(true);
  });
});

describe('the triple lip sync', () => {
  /* ── A CONTROL THAT DID NOTHING ─────────────────────────────────────
     Found by auditing Plan 1 rather than by playing: `drTripleLipsync` was on
     the setup screen, saved to the config, passed into dr-run's config
     object — and read by no line of the engine. CONFIG_SCOPE's whole rule is
     that a control is shown only if that format's engine reads the value, so a
     switch that does nothing is the same bug as a switch on the wrong show. */
  const castOf = n => cast(n);

  it('sends three to the stage when the bottom will not resolve into two', () => {
    let tripled = null;
    for (let s = 0; s < 60 && !tripled; s++) {
      const c = castOf(12);
      const st = initDragState({ cast: c, seed: s, rng: rngFor(s) });
      const row = runDragWeek(st, cfg({ num: 1, tripleOnTie: true }), ctxFor(c, s));
      if (row.dr.lipsync?.call === 'triple') tripled = { row, st };
    }
    expect(tripled, 'no triple in 60 seasons — the tie window is too tight').toBeTruthy();
    expect(tripled.row.dr.call.bottom.length).toBe(3);
    expect(Object.keys(tripled.row.dr.lipsync.scores).length).toBe(3);
    // One goes home, two are saved.
    expect(tripled.row.exits.length).toBe(1);
    expect(tripled.row.exits[0].name).toBe(tripled.row.dr.lipsync.loser);
    expect(tripled.st.living.length).toBe(11);
  });

  it('the lowest score is the one who goes', () => {
    for (let s = 0; s < 60; s++) {
      const c = castOf(12);
      const st = initDragState({ cast: c, seed: s, rng: rngFor(s) });
      const row = runDragWeek(st, cfg({ num: 1, tripleOnTie: true }), ctxFor(c, s));
      const ls = row.dr.lipsync;
      if (ls?.call !== 'triple') continue;
      const lowest = Object.entries(ls.scores).sort((a, b) => a[1] - b[1])[0][0];
      expect(ls.loser).toBe(lowest);
      expect(ls.winner).toBe(Object.entries(ls.scores).sort((a, b) => b[1] - a[1])[0][0]);
    }
  });

  it('never fires when the season did not ask for it', () => {
    for (let s = 0; s < 40; s++) {
      const c = castOf(12);
      const st = initDragState({ cast: c, seed: s, rng: rngFor(s) });
      const row = runDragWeek(st, cfg({ num: 1 }), ctxFor(c, s));
      expect(row.dr.call.bottom.length, `season ${s}`).toBeLessThanOrEqual(2);
      expect(row.dr.lipsync?.call).not.toBe('triple');
    }
  });
});

describe('a Ball week reaches the runway', () => {
  // The bug class this codebase keeps hitting: a system that runs, produces a
  // correct result, and reaches no screen. The Ball's whole point is three
  // walks, so the assertion is not that the module returns three — it is that
  // the WEEK scores three.
  it('scores three walks per queen instead of one, and names them', () => {
    const c = cast(8);
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const row = runDragWeek(st, cfg({ maxiId: 'ball' }), ctxFor(c));
    expect(row.dr.runway.walks.length).toBe(3);
    for (const n of st.living) {
      expect(row.dr.runway[n].walks.length, n).toBe(3);
    }
  });

  it('and an ordinary week still walks once', () => {
    const c = cast(8);
    const st = initDragState({ cast: c, seed: 5, rng: rngFor(5) });
    const row = runDragWeek(st, cfg({ maxiId: 'acting' }), ctxFor(c));
    expect(row.dr.runway.walks.length).toBe(1);
    expect(row.dr.runway[st.living[0]].walks.length).toBe(1);
  });
});
