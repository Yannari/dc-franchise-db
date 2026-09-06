// ══════════════════════════════════════════════════════════════════════
// dr-chal-makeover.test.js — a partner, and a family resemblance
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { PARTNER_POOLS } from '../js/dr/chal/makeover.js';
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
    for (const key of ['pit-crew', 'family']) {
      expect(PARTNER_POOLS[key].length, key).toBeGreaterThanOrEqual(12);
      expect(new Set(PARTNER_POOLS[key].map(p => p.name)).size, key).toBe(PARTNER_POOLS[key].length);
      for (const p of PARTNER_POOLS[key]) {
        expect(p.ease, `${key}/${p.name}`).toBeGreaterThanOrEqual(1);
        expect(p.ease, `${key}/${p.name}`).toBeLessThanOrEqual(10);
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

  it('a pit crew is shared, so no two queens get the same man', () => {
    for (let i = 0; i < 20; i++) {
      const picks = Object.values(runMaxi(ctx(i)).assignment.picks).map(p => p.choice);
      expect(new Set(picks).size, `seed ${i}`).toBe(picks.length);
    }
  });

  it('...but family is not: two queens can both bring their mother', () => {
    // Twelve relationships and four queens, so a collision is not guaranteed
    // in any one season — it just has to be POSSIBLE, which a draft forbids.
    let collided = false;
    for (let i = 0; i < 60 && !collided; i++) {
      const picks = Object.values(runMaxi(ctx(i, undefined, { makeoverPool: 'family' })).assignment.picks)
        .map(p => p.choice);
      collided = new Set(picks).size < picks.length;
    }
    expect(collided, 'the family pool is being drafted as if there were one mother alive').toBe(true);
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
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const o = runMaxi(ctx(i, p));
      if (Object.entries(o.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Cleo') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.45);
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });
});
