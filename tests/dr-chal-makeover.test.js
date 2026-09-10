// ══════════════════════════════════════════════════════════════════════
// dr-chal-makeover.test.js — a partner, and a family resemblance
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { PARTNER_POOLS } from '../js/dr/chal/makeover.js';
import { GUEST_POOLS } from '../js/dr/data/partners.js';
import { runMaxi, applyEvents } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
});
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot'];
const seeded = i => rngFor(i * 7919 + 13);

function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])), cfg = {}, out = []) {
  const bonds = { 'Ada|Gone': 7 };
  return {
    living: Object.keys(players), players, maxi: maxiById('makeover'), rng: seeded(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {}, out },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: () => {}, popDelta: () => {}, miniWinner: 'Ada', mini: null, cfg,
  };
}

describe('the partner pools', () => {
  it('has a pit crew and a family pool, each graded by how well they take to it', () => {
    /* THE AUTHORED COHORTS MOVED TO js/dr/data/partners.js when they got
       faces. `loved-ones` stayed behind because it is relationships rather
       than people — "her aunt" has no portrait and should not have one. */
    const pools = { ...GUEST_POOLS, 'loved-ones': PARTNER_POOLS['loved-ones'] };
    for (const key of ['superfans', 'veterans', 'seniors', 'athletes', 'pit-crew', 'loved-ones']) {
      expect(pools[key].length, key).toBeGreaterThanOrEqual(12);
      expect(new Set(pools[key].map(p => p.name)).size, key).toBe(pools[key].length);
      for (const p of pools[key]) {
        expect(p.ease, `${key}/${p.name}`).toBeGreaterThanOrEqual(1);
        expect(p.ease, `${key}/${p.name}`).toBeLessThanOrEqual(10);
      }
    }

    /* AND NO TWO COHORTS ARE THE SAME PEOPLE, which is the whole reason this
       data moved. `superfans` and `pit-crew` shared all twelve names for as
       long as they both existed, so booking one got you the other at a
       different difficulty and nothing in the suite noticed. */
    const keys = Object.keys(GUEST_POOLS);
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = new Set(GUEST_POOLS[keys[i]].map(p => p.name));
        const shared = GUEST_POOLS[keys[j]].filter(p => a.has(p.name)).map(p => p.name);
        expect(shared, `${keys[i]} and ${keys[j]} share people`).toEqual([]);
      }
    }

    // Every authored guest has a face, and it is not in the players' directory.
    for (const [key, pool] of Object.entries(GUEST_POOLS)) {
      for (const p of pool) {
        expect(p.portrait, `${key}/${p.name} has no portrait`).toMatch(/^assets\/guests\//);
      }
    }
    // The returnee pool is built at run time from whoever has gone home.
    expect(PARTNER_POOLS.eliminated).toBe(null);
  });
});

describe('the pairing', () => {
  it('pairs everybody and walks the pair', () => {
    const out = runMaxi(ctx());
    expect(Object.keys(out.assignment.picks).length).toBe(4);
    expect(out.runwayOverride.walks.length).toBe(1);
    expect(out.performances.Ada.detail.partner).toBeTruthy();
    expect(typeof out.performances.Ada.detail.resemblance).toBe('number');
  });

  it('a themed cohort is shared, so no two queens get the same guest', () => {
    for (let i = 0; i < 20; i++) {
      const picks = Object.values(runMaxi(ctx(i)).assignment.picks).map(p => p.choice);
      expect(new Set(picks).size, `seed ${i}`).toBe(picks.length);
    }
  });

  it('...but loved ones are not: two queens can both bring their mother', () => {
    // Twelve relationships and four queens, so a collision is not guaranteed
    // in any one season — it just has to be POSSIBLE, which a draft forbids.
    let collided = false;
    for (let i = 0; i < 60 && !collided; i++) {
      const picks = Object.values(runMaxi(ctx(i, undefined, { makeoverPool: 'loved-ones' })).assignment.picks)
        .map(p => p.choice);
      collided = new Set(picks).size < picks.length;
    }
    expect(collided, 'loved ones are being drafted as if there were one mother alive').toBe(true);
  });

  it('eliminated queens can be the partners, and a friend coming back is a moment', () => {
    const out = runMaxi(ctx(1, undefined, { makeoverPool: 'eliminated' }, ['Gone', 'Past', 'Old', 'Older']));
    expect(['Gone', 'Past', 'Old', 'Older']).toContain(out.performances.Ada.detail.partner);
    if (out.performances.Ada.detail.partner === 'Gone') {
      const reunion = out.events.find(e => e.type === 'reunion');
      expect(reunion).toBeTruthy();
      expect(reunion.bond[0][2]).toBeGreaterThan(0);
      expect(Object.keys(reunion.pop).length).toBe(2);
    }
  });

  it('falls back rather than pairing everybody with nobody when none have gone home', () => {
    const out = runMaxi(ctx(1, undefined, { makeoverPool: 'eliminated' }, []));
    for (const n of NAMES) expect(out.performances[n].detail.partner, n).toBeTruthy();
  });
});

describe('the resemblance', () => {
  it('out-dressing your own sister is a note against you', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { runway: 10, design: 1 })]));
    let seen = null;
    for (let i = 0; i < 30 && !seen; i++) {
      seen = runMaxi(ctx(i, p)).events.find(e => e.type === 'dressed-herself-better');
    }
    expect(seen, 'a queen at 10 runway and 1 design never once outshone her partner').toBeTruthy();
    expect(Object.values(seen.pop)[0]).toBeLessThan(0);
  });

  it('a matched pair beats a great look standing next to a bad one', () => {
    // The gap IS the score. This is the rule that makes the makeover different
    // from every other runway night.
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n)]));
    const out = runMaxi(ctx(5, p));
    const rows = Object.values(out.performances);
    const gap = r => Math.abs(r.detail.ownLook - r.detail.partnerLook);
    const best = rows.slice().sort((a, b) => b.perf - a.perf)[0];
    const worst = rows.slice().sort((a, b) => a.perf - b.perf)[0];
    expect(gap(best)).toBeLessThan(gap(worst) + 3);
  });

  it('a strong designer makes the more convincing family', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Cleo' ? { design: 10 } : { design: 2 })]));
    /* A THOUSAND, NOT TWO HUNDRED — and this is the second time this guard has
       been widened for the same reason, which is the interesting part.

       At n=40 one standard error on a rate near 0.45 was about 0.08, so the
       assertion was a coin toss on the seed; it read 0.40 after an unrelated
       change shifted the draw by a few calls. Raised to 200. Then `riskFor`
       added one draw per queen in this module and it read exactly 0.450
       against a `> 0.45` threshold — red again, with the effect untouched.

       MEASURED, rather than guessed at this time: the true rate is 49.1%
       +/- 0.8 at n=4000, against 25% for chance. The effect is large and was
       never in doubt. At n=200 the standard error is 3.5 points, so a true
       rate of 0.489 lands at or under 0.45 about thirteen percent of the
       time — this guard flaked one run in eight and blamed whatever had most
       recently touched the rng.

       At n=1000 the error is 1.6 points and the threshold sits 2.4 standard
       errors away. THE THRESHOLD IS NOT THE THING TO MOVE: lowering it to
       admit the observed value would weaken the guard to fit the change that
       tripped it, which is how a test ends up passing against the bug it was
       written for. */
    const RUNS = 1000;
    let wins = 0;
    for (let i = 0; i < RUNS; i++) {
      const o = runMaxi(ctx(i, p));
      if (Object.entries(o.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Cleo') wins++;
    }
    expect(wins / RUNS).toBeGreaterThan(0.45);
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });
});
