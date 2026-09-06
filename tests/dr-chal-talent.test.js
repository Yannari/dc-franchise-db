// ══════════════════════════════════════════════════════════════════════
// dr-chal-talent.test.js — she picks the act, and the pick is the test
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { TALENTS, chooseTalent } from '../js/dr/chal/talent-show.js';
import { DRAG_STATS } from '../js/dr/queen.js';
import { runMaxi, applyEvents } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
  ...over,
});
const bold = n => ({ stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: n } });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
const seeded = i => rngFor(i * 7919 + 13);

function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)]))) {
  return {
    living: Object.keys(players), players, maxi: maxiById('talent-show'), rng: seeded(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: () => 0, addBond: () => {}, popDelta: () => {}, miniWinner: null, mini: null, cfg: {},
  };
}

describe('the acts', () => {
  it('are eight, each a blend of real stats with a risk attached', () => {
    expect(TALENTS.length).toBe(8);
    expect(new Set(TALENTS.map(t => t.id)).size).toBe(8);
    for (const t of TALENTS) {
      const w = Object.values(t.blend).reduce((a, b) => a + b, 0);
      expect(w, `${t.id} blend does not sum to 1`).toBeCloseTo(1);
      for (const k of Object.keys(t.blend)) expect(DRAG_STATS, `${t.id} wants "${k}"`).toContain(k);
      expect(t.risk, t.id).toBeGreaterThan(0);
      expect(t.risk, t.id).toBeLessThanOrEqual(1);
    }
  });

  it('cover every craft, so no queen is left without an act', () => {
    const used = new Set(TALENTS.flatMap(t => Object.keys(t.blend)));
    // Design is the one craft a stage act mostly cannot show, and the
    // quick-change is exactly the act that shows it.
    for (const k of DRAG_STATS) expect(used, `no act uses ${k}`).toContain(k);
  });
});

describe('choosing', () => {
  it('a singer sings and a dancer dances', () => {
    expect(chooseTalent(mk('S', { singing: 10 }), rngFor(1)).id).toBe('live-vocal');
    expect(chooseTalent(mk('D', { dance: 10, lipsync: 8 }), rngFor(1)).id).toBe('dance-number');
    expect(chooseTalent(mk('C', { comedy: 10 }), rngFor(1)).id).toBe('comedy-set');
  });

  it('a bold queen reaches past her safest act far more often than a timid one', () => {
    const reachRate = boldness => {
      const p = mk('X', { dance: 8, runway: 7, lipsync: 7 }, bold(boldness));
      const safe = chooseTalent(p, () => 1).id;
      let reached = 0;
      for (let i = 0; i < 200; i++) if (chooseTalent(p, seeded(i)).id !== safe) reached++;
      return reached / 200;
    };
    expect(reachRate(10)).toBeGreaterThan(reachRate(1) + 0.1);
  });

  it('and never reaches for something safer than what she had', () => {
    const p = mk('X', { dance: 8, runway: 7, lipsync: 7 }, bold(10));
    const safe = chooseTalent(p, () => 1);
    for (let i = 0; i < 100; i++) {
      const got = chooseTalent(p, seeded(i));
      if (got.id !== safe.id) expect(got.risk, `${got.id} is not a reach`).toBeGreaterThan(safe.risk);
    }
  });
});

describe('the night', () => {
  it('gives every queen an act and says whether she landed it', () => {
    const out = runMaxi(ctx(1));
    for (const n of NAMES) {
      expect(out.performances[n].detail.talent, n).toBeTruthy();
      expect(typeof out.performances[n].detail.landed, n).toBe('boolean');
    }
  });

  it('a risky act spreads wider than a safe one at the same craft', () => {
    // The point of risk is the SHAPE of the outcome, not its mean, so the test
    // is the spread. A queen flat at six across every craft can be steered
    // into either act by which stats she is strong in, so instead this runs a
    // varied cast and buckets what actually happened by the risk of the act
    // each queen chose.
    const buckets = { safe: [], risky: [] };
    for (let i = 0; i < 120; i++) {
      const r = rngFor(i * 7919 + 13);
      const roll = () => 1 + Math.floor(r() * 10);
      const players = Object.fromEntries(NAMES.map(n =>
        [n, mk(n, Object.fromEntries(DRAG_STATS.map(k => [k, roll()])))]));
      const out = runMaxi(ctx(i, players));
      for (const row of Object.values(out.performances)) {
        const t = TALENTS.find(x => x.id === row.detail.talentId);
        // Measured against the craft she brought, so a strong queen scoring
        // high is not mistaken for a risky act paying off.
        buckets[t.risk >= 0.7 ? 'risky' : 'safe'].push(row.perf - row.parts.craft);
      }
    }
    const sd = v => {
      const m = v.reduce((a2, b2) => a2 + b2, 0) / v.length;
      return Math.sqrt(v.reduce((a2, b2) => a2 + (b2 - m) ** 2, 0) / v.length);
    };
    expect(buckets.safe.length).toBeGreaterThan(100);
    expect(buckets.risky.length).toBeGreaterThan(100);
    expect(sd(buckets.risky), 'the risky acts are no more volatile than the safe ones')
      .toBeGreaterThan(sd(buckets.safe));
  });

  it('landing a real stunt is worth something; dropping it costs', () => {
    // Dance 10, runway 8, lipsync 1 makes the aerial her best act outright.
    // Flat tens do not: every act scores ten and she takes the safe one, which
    // is correct behaviour and simply not what this test is about.
    const daring = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, { dance: 10, runway: 8, lipsync: 1 }, bold(10))]));
    let landed = null;
    let failed = null;
    for (let i = 0; i < 40 && !(landed && failed); i++) {
      const evs = runMaxi(ctx(i, daring)).events;
      landed = landed || evs.find(e => e.type === 'stunt-landed');
      const weak = Object.fromEntries(NAMES.map(n => [n, mk(n, { dance: 1, runway: 1, lipsync: 1 }, bold(10))]));
      failed = failed || runMaxi(ctx(i, weak)).events.find(e => e.type === 'stunt-failed');
    }
    expect(landed, 'nobody with 10 dance ever landed an aerial').toBeTruthy();
    expect(Object.values(landed.pop)[0]).toBeGreaterThan(0);
    expect(failed, 'nobody with 1 dance ever dropped one').toBeTruthy();
    expect(Object.values(failed.pop)[0]).toBeLessThan(0);
  });

  it('picking an act you cannot do is its own note, separate from failing it', () => {
    const weak = Object.fromEntries(NAMES.map(n => [n, mk(n, Object.fromEntries(DRAG_STATS.map(k => [k, 2])))]));
    const evs = runMaxi(ctx(1, weak)).events;
    const wrong = evs.find(e => e.type === 'wrong-talent');
    expect(wrong, 'a queen at 2 across the board picked an act she could do').toBeTruthy();
    expect(Object.values(wrong.pop)[0]).toBeLessThan(0);
  });

  it('a queen good at her act beats one who is not', () => {
    const p = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, n === 'Dot' ? { dance: 10, lipsync: 9 } : Object.fromEntries(DRAG_STATS.map(k => [k, 3])))]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, p));
      if (Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Dot') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.6);
  });

  it('runs on two queens, because it is also the finale performance round', () => {
    const two = { Ada: mk('Ada'), Bee: mk('Bee') };
    const out = runMaxi(ctx(1, two));
    expect(Object.keys(out.performances).length).toBe(2);
    expect(out.performances.Ada.detail.talent).toBeTruthy();
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });
});
