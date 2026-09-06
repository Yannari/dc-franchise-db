// ══════════════════════════════════════════════════════════════════════
// dr-chal-girl-group.test.js — verses, the booth, and who takes the front
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
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
// Spread seeds — consecutive ones barely move this LCG's first draw.
const seeded = i => rngFor(i * 7919 + 13);

function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])),
  maxiId = 'girl-group', over = {}) {
  const bonds = {};
  return {
    living: Object.keys(players), players, maxi: maxiById(maxiId), rng: seeded(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: (a, b, d) => {
      const k = [a, b].sort().join('|');
      bonds[k] = (bonds[k] || 0) + d;
    },
    popDelta: () => {}, miniWinner: 'Ada', mini: null, cfg: {}, ...over,
  };
}

describe('the parts', () => {
  it('splits into teams and gives every queen a role and a verse', () => {
    const out = runMaxi(ctx());
    expect(out.assignment.teams.length).toBe(2);
    expect(out.assignment.teams.flat().sort()).toEqual([...NAMES].sort());
    for (const n of NAMES) {
      expect(out.performances[n].role, n).toBeTruthy();
      expect(typeof out.performances[n].detail.verse, n).toBe('number');
    }
  });

  it('gives each team its own lead rather than stacking one team', () => {
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx(i));
      for (const t of out.assignment.teams) {
        const leads = t.filter(n => out.assignment.roles[n] === 'lead');
        expect(leads.length, `seed ${i}`).toBe(1);
      }
    }
  });

  it('spends a mini captaincy on building the team', () => {
    const out = runMaxi(ctx(1, undefined, 'girl-group', { mini: { buys: 'captain' } }));
    expect(out.assignment.teams.some(t => t[0] === 'Ada')).toBe(true);
    expect(out.assignment.teams.flat().sort()).toEqual([...NAMES].sort());
  });
});

describe('the booth', () => {
  it('notes a queen who cannot sing and one who can, and nobody in between', () => {
    const mixed = Object.fromEntries(NAMES.map((n, i) =>
      [n, mk(n, { singing: [1, 5, 5, 5, 5, 10][i] })]));
    const booths = runMaxi(ctx(1, mixed)).events.filter(e => e.type === 'booth');
    expect(booths.map(e => e.players[0]).sort()).toEqual(['Ada', 'Fay']);
    expect(booths.find(e => e.players[0] === 'Ada').pop.Ada).toBeLessThan(0);
    expect(booths.find(e => e.players[0] === 'Fay').pop.Fay).toBeGreaterThan(0);
  });

  it('still adjusts everybody, event or not: the booth is a mechanic', () => {
    // Same seed, same cast, differing only in singing. The prep the booth
    // wrote has to reach the number even for the queens it says nothing about.
    const at = singing => {
      const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { singing })]));
      return runMaxi(ctx(4, p)).performances.Ada.parts.prep;
    };
    expect(at(7)).toBeGreaterThan(at(5));
  });
});

describe('the number', () => {
  it('a singer beats a designer here', () => {
    const p = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, n === 'Cleo' ? { singing: 10, dance: 9 } : { singing: 3, dance: 3, design: 10 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, p));
      if (Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Cleo') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.5);
  });

  it('a bold villain hogs the spotlight, and her whole team pays for it', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, {}, n === 'Bee'
      ? { archetype: 'villain', stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } }
      : {})]));
    let found = null;
    for (let i = 0; i < 40 && !found; i++) {
      found = runMaxi(ctx(i, p)).events.find(e => e.type === 'spotlight-hog');
    }
    expect(found, 'a 10-boldness villain never once took the front').toBeTruthy();
    expect(found.players[0]).toBe('Bee');
    expect(found.pop.Bee).toBeLessThan(0);
    expect(found.bond.length).toBeGreaterThan(0);
    for (const [, , d] of found.bond) expect(d).toBeLessThan(0);
  });

  it('and a room of heroes never hogs it, whatever their boldness', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, {},
      { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } })]));
    for (let i = 0; i < 30; i++) {
      expect(runMaxi(ctx(i, p)).events.some(e => e.type === 'spotlight-hog'), `seed ${i}`).toBe(false);
    }
  });

  it('pays the queen who carries a passenger', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Dot'
      ? { singing: 1, dance: 1, comedy: 1, runway: 1 }
      : { singing: 10, dance: 10, comedy: 10, runway: 10 })]));
    let carried = null;
    for (let i = 0; i < 40 && !carried; i++) {
      carried = runMaxi(ctx(i, p)).events.find(e => e.type === 'carried');
    }
    expect(carried, 'nobody was ever carried by a team of tens').toBeTruthy();
    expect(carried.pop[carried.players[0]]).toBeGreaterThan(0);
    expect(carried.pop[carried.players[1]]).toBeLessThan(0);
  });

  it('a standout on the losing team still out-scores a passenger on the winning one', () => {
    const p = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, n === 'Fay' ? { singing: 10, dance: 10, comedy: 10, runway: 10 } : { singing: 4, dance: 4 })]));
    let beat = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, p));
      const fi = out.assignment.teams.findIndex(t => t.includes('Fay'));
      const other = out.assignment.teams[1 - fi] || [];
      if (other.some(n => out.performances.Fay.perf > out.performances[n].perf)) beat++;
    }
    expect(beat).toBeGreaterThan(30);
  });

  it('serves the rumix and the music video from the same mechanic', () => {
    for (const id of ['rumix', 'music-video']) {
      const out = runMaxi(ctx(1, undefined, id));
      expect(Object.keys(out.performances).length, id).toBe(6);
      expect(out.performances.Ada.detail.verse, id).not.toBeNull();
    }
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });
});
