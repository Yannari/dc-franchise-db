// ══════════════════════════════════════════════════════════════════════
// dr-chal-snatch.test.js — the character draft and the six-round taping
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { SNATCH_CHARACTERS } from '../js/dr/data/snatch-characters.js';
import { DRAG_STYLES } from '../js/dr/queen.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';
import { runMaxi, applyEvents } from '../js/dr/maxi.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
  ...over,
});
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
// Spread seeds: this LCG's first draw barely moves across consecutive ones.
const seeded = i => rngFor(i * 7919 + 13);

function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])), bonds = {}) {
  return {
    living: Object.keys(players), players, maxi: maxiById('snatch-game'), rng: seeded(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: () => {}, popDelta: () => {}, miniWinner: 'Ada', mini: null, cfg: {},
  };
}

describe('the character list', () => {
  it('is thirty fictional archetypes, graded, in styles a queen can have', () => {
    expect(SNATCH_CHARACTERS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(SNATCH_CHARACTERS.map(c => c.id)).size).toBe(SNATCH_CHARACTERS.length);
    for (const c of SNATCH_CHARACTERS) {
      expect(c.difficulty, c.id).toBeGreaterThanOrEqual(1);
      expect(c.difficulty, c.id).toBeLessThanOrEqual(5);
      expect(['comedy', 'acting'], c.id).toContain(c.needs);
      expect(DRAG_STYLES, `${c.id} has a style no queen can have`).toContain(c.style);
    }
  });

  it('names nobody real: every character is an archetype, not a person', () => {
    for (const c of SNATCH_CHARACTERS) {
      expect(c.name, `${c.id} does not read as an archetype`).toMatch(/^The /);
    }
    // Both halves of the difficulty range are stocked, or the draft has no
    // stakes: everybody would reach for the same easy shelf.
    const d = SNATCH_CHARACTERS.map(c => c.difficulty);
    expect(Math.min(...d)).toBe(1);
    expect(Math.max(...d)).toBe(5);
  });
});

describe('the draft', () => {
  it('every queen leaves with a different character', () => {
    for (let s = 0; s < 20; s++) {
      const chosen = Object.values(runMaxi(ctx(s)).assignment.picks).map(p => p.choice);
      expect(chosen.length).toBe(6);
      expect(new Set(chosen).size, `seed ${s} double-booked a character`).toBe(6);
    }
  });

  it('the first pick gets a first choice; somebody later does not', () => {
    const out = runMaxi(ctx(3));
    expect(out.assignment.picks.Ada.penalty).toBe(0);
    expect(Object.values(out.assignment.picks).some(p => p.penalty > 0)).toBe(true);
  });

  it('a queen reaches for a character in her own style', () => {
    const styled = Object.fromEntries(NAMES.map(n => [n, mk(n, { style: 'spooky' })]));
    const out = runMaxi(ctx(1, styled));
    const first = SNATCH_CHARACTERS.find(c => c.id === out.assignment.picks.Ada.choice);
    expect(first.style).toBe('spooky');
  });
});

describe('the taping', () => {
  it('records six rounds for everybody', () => {
    const out = runMaxi(ctx(2));
    for (const n of NAMES) expect(out.performances[n].detail.rounds.length, n).toBe(6);
  });

  it('a comedy queen beats a fashion queen at this, on average', () => {
    const funny = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, n === 'Bee' ? { comedy: 10, acting: 9 } : { comedy: 3, acting: 3 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, funny));
      const best = Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0];
      if (best === 'Bee') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.5);
  });

  // Measured, not assumed. A +2 edge wins most nights and loses some; parity
  // is a coin toss between six queens. Only a gap nobody real has is a lock,
  // which is the shape we want — craft decides Snatch Game, and it decides it
  // by degrees rather than by a switch.
  //
  //   craft edge over the room   +0    +1    +2    +3    +4    +5
  //   wins the taping           8.5%  37%   72%   92%   99%   100%
  it('scales with the gap: an edge is an edge, not a guarantee', () => {
    const rate = bonus => {
      const players = Object.fromEntries(NAMES.map(n =>
        [n, mk(n, n === 'Bee' ? { comedy: 5 + bonus, acting: 5 + bonus } : {})]));
      let w = 0;
      for (let i = 0; i < 200; i++) {
        const out = runMaxi(ctx(i, players));
        if (Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Bee') w++;
      }
      return w / 200;
    };
    const even = rate(0);
    const edge = rate(2);
    // At parity nobody is favoured: one queen in six.
    expect(even).toBeGreaterThan(0.03);
    expect(even).toBeLessThan(0.2);
    // Two points of craft is worth a lot, and still loses sometimes.
    expect(edge).toBeGreaterThan(0.55);
    expect(edge).toBeLessThan(0.9);
  });

  it('can kill somebody on the panel, and says which character did it', () => {
    const weak = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, n === 'Fay' ? { comedy: 1, acting: 1 } : { comedy: 8, acting: 8 })]));
    let died = null;
    for (let i = 0; i < 40 && !died; i++) {
      died = runMaxi(ctx(i, weak)).events.find(e => e.type === 'dying' && e.players[0] === 'Fay');
    }
    expect(died, 'a queen with 1 comedy survived forty tapings').toBeTruthy();
    expect(died.pop.Fay).toBe(-3);
    expect(died.data.character).toBeTruthy();
    expect(died.data.flops).toBeGreaterThanOrEqual(3);
  });

  it('does not kill the funniest queen in the room', () => {
    const strong = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 10, acting: 10 })]));
    for (let i = 0; i < 30; i++) {
      expect(runMaxi(ctx(i, strong)).events.some(e => e.type === 'dying'), `seed ${i}`).toBe(false);
    }
  });

  it('two friends sitting together build a bit, and both are paid for it', () => {
    const bonds = Object.fromEntries(
      NAMES.flatMap(a => NAMES.map(b => [[a, b].sort().join('|'), 8])));
    let act = null;
    for (let i = 0; i < 20 && !act; i++) {
      act = runMaxi(ctx(i, undefined, bonds)).events.find(e => e.type === 'double-act');
    }
    expect(act, 'a room that all like each other never once played off itself').toBeTruthy();
    expect(act.players.length).toBe(2);
    expect(act.pop[act.players[0]]).toBeGreaterThan(0);
    expect(act.pop[act.players[1]]).toBeGreaterThan(0);
    expect(act.bond[0][2]).toBeGreaterThan(0);
  });

  it('a room that hates each other never builds one', () => {
    const bonds = Object.fromEntries(
      NAMES.flatMap(a => NAMES.map(b => [[a, b].sort().join('|'), -8])));
    for (let i = 0; i < 20; i++) {
      expect(runMaxi(ctx(i, undefined, bonds)).events.some(e => e.type === 'double-act')).toBe(false);
    }
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });
});
