// ══════════════════════════════════════════════════════════════════════
// dr-chal-rusical.test.js — named parts, and whether she sings it live
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { RUSICALS } from '../js/dr/chal/rusical.js';
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
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
const seeded = i => rngFor(i * 7919 + 13);

function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])), cfg = {}) {
  return {
    living: Object.keys(players), players, maxi: maxiById('rusical'), rng: seeded(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: () => 0, addBond: () => {}, popDelta: () => {}, miniWinner: 'Ada', mini: null, cfg,
  };
}

describe('the shows', () => {
  it('are eight originals with one lead each and a mix of crafts', () => {
    expect(RUSICALS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(RUSICALS.map(r => r.id)).size).toBe(RUSICALS.length);
    for (const r of RUSICALS) {
      expect(r.parts.filter(p => p.role === 'lead').length, r.id).toBe(1);
      expect(r.parts.length, r.id).toBeGreaterThanOrEqual(6);
      expect(new Set(r.parts.map(p => p.name)).size, `${r.id} names a part twice`).toBe(r.parts.length);
      for (const p of r.parts) expect(['singing', 'acting', 'dance'], `${r.id}/${p.name}`).toContain(p.needs);
      // A show that wanted one craft all the way down would be the same night
      // every time it was booked.
      expect(new Set(r.parts.map(p => p.needs)).size, `${r.id} needs only one craft`).toBeGreaterThan(1);
    }
  });
});

describe('the casting', () => {
  it('puts every queen in a different named part', () => {
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx(i));
      const chosen = Object.values(out.assignment.picks).map(p => p.choice);
      expect(chosen.length, `seed ${i}`).toBe(6);
      expect(new Set(chosen).size, `seed ${i} double-cast a part`).toBe(6);
      for (const n of NAMES) expect(out.performances[n].detail.part, n).toBeTruthy();
    }
  });

  it('honours a booked show and otherwise picks one', () => {
    expect(runMaxi(ctx(1, undefined, { rusical: 'moulin-ru' })).performances.Ada.detail.showId)
      .toBe('moulin-ru');
    const seen = new Set();
    for (let i = 0; i < 30; i++) seen.add(runMaxi(ctx(i)).performances.Ada.detail.showId);
    expect(seen.size).toBeGreaterThan(3);
  });

  it('lets a dancer reach past the singing lead for a part she can land', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Ada' ? { dance: 10, singing: 1 } : {})]));
    const out = runMaxi(ctx(1, p, { rusical: 'moulin-ru' }));
    // The Sparkling Diamond is the singing lead; she should not want it.
    expect(out.assignment.picks.Ada.choice).not.toBe('The Sparkling Diamond');
  });

  it('casts a bigger room than the show by adding chorus, never by benching anyone', () => {
    const big = Object.fromEntries(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(n => [n, mk(n)]));
    const out = runMaxi(ctx(1, big));
    expect(Object.keys(out.performances).length).toBe(10);
    for (const n of Object.keys(big)) expect(out.performances[n].detail.part, n).toBeTruthy();
  });
});

describe('the live vocal', () => {
  it('is only an event when she actually goes live', () => {
    const mixed = Object.fromEntries(NAMES.map((n, i) =>
      [n, mk(n, { singing: i === 0 ? 10 : 2 }, { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])) } })]));
    const out = runMaxi(ctx(2, mixed));
    const ev = out.events.filter(e => e.type === 'live-vocal');
    expect(ev.length).toBe(1);
    expect(ev[0].players[0]).toBe('Ada');
    expect(ev[0].pop.Ada).toBeGreaterThan(0);
    expect(out.performances.Bee.detail.live).toBe(false);
  });

  it('a bold queen who cannot sing goes live and is punished for it', () => {
    const brave = Object.fromEntries(NAMES.map(n => [n, mk(n, { singing: 2 },
      n === 'Cleo' ? { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } } : {})]));
    const out = runMaxi(ctx(3, brave));
    const ev = out.events.find(e => e.type === 'live-vocal' && e.players[0] === 'Cleo');
    expect(ev, 'a 10-boldness queen never reached for the microphone').toBeTruthy();
    expect(ev.data.landed).toBe(false);
    expect(ev.pop.Cleo).toBeLessThan(0);
  });

  it('widens her swing: that is what the risk buys', () => {
    const spread = players => {
      const s = Array.from({ length: 60 }, (_, i) => runMaxi(ctx(i, players)).performances.Ada.perf);
      const m = s.reduce((a, b) => a + b, 0) / s.length;
      return Math.sqrt(s.reduce((a, b) => a + (b - m) ** 2, 0) / s.length);
    };
    const timid = Object.fromEntries(NAMES.map(n => [n, mk(n, { singing: 5 },
      { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 2 } })]));
    const live = Object.fromEntries(NAMES.map(n => [n, mk(n, { singing: 5 },
      { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } })]));
    expect(spread(live)).toBeGreaterThan(spread(timid));
  });
});

describe('the performance', () => {
  it('a singer with the lead can win big or bomb', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Ada' ? { singing: 9, acting: 8 } : {})]));
    const s = Array.from({ length: 60 }, (_, i) => runMaxi(ctx(i, p)).performances.Ada.perf);
    const m = s.reduce((a, b) => a + b, 0) / s.length;
    const sd = Math.sqrt(s.reduce((a, b) => a + (b - m) ** 2, 0) / s.length);
    expect(m).toBeGreaterThan(6);
    expect(sd).toBeGreaterThan(1.2);
  });

  it('an ensemble queen who does nothing is noted', () => {
    const weak = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, { singing: 1, acting: 1, dance: 1, runway: 1 })]));
    let seen = false;
    for (let i = 0; i < 30 && !seen; i++) {
      seen = runMaxi(ctx(i, weak)).events.some(e => e.type === 'invisible');
    }
    expect(seen).toBe(true);
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });
});
