// ══════════════════════════════════════════════════════════════════════
// dr-chal-lalaparuza.test.js — the bracket, and who names whom
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { runMaxi, applyEvents } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
});
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
const seeded = i => rngFor(i * 7919 + 13);

function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)]))) {
  const bonds = {};
  return {
    living: Object.keys(players), players, maxi: maxiById('lipsync-challenge'), rng: seeded(seed),
    state: {
      record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {},
      lipsyncRecord: Object.fromEntries(Object.keys(players).map(n => [n, []])),
    },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: (a, b, d) => {
      const k = [a, b].sort().join('|');
      bonds[k] = (bonds[k] || 0) + d;
    },
    popDelta: () => {}, miniWinner: 'Ada', mini: null, cfg: {},
  };
}

const duelsOf = out => out.tournamentExit.duels;

describe('the choosing', () => {
  it('everybody names somebody, and the mini winner names first', () => {
    const out = runMaxi(ctx(1));
    expect(runMaxi(ctx(1)).assignment.order[0]).toBe('Ada');
    expect(Object.keys(out.assignment.picks).length).toBe(6);
  });

  it('the weakest lip syncer in the room is the one who gets named', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { lipsync: n === 'Fay' ? 1 : 9 })]));
    const picks = runMaxi(ctx(1, p)).assignment.picks;
    expect(picks.Ada.choice).toBe('Fay');
  });

  it('a bold villain targets front-runners or rivals, not the weakest', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, {
      lipsync: n === 'Ada' ? 5 : n === 'Fay' ? 1 : 5,
    })]));
    p.Ada = { ...p.Ada, archetype: 'villain', stats: { ...p.Ada.stats, boldness: 10 } };
    let boldPicks = 0;
    for (let i = 0; i < 40; i++) {
      const c = ctx(i, p);
      c.state.record = { Bee: ['WIN', 'WIN', 'HIGH'], Cleo: ['SAFE'], Dot: ['SAFE'], Eve: ['SAFE'], Fay: ['LOW'], Ada: ['SAFE'] };
      const out = runMaxi(c);
      const strat = out.assignment.strategies?.Ada;
      if (strat === 'frontrunner' || strat === 'rival') boldPicks++;
    }
    expect(boldPicks / 40).toBeGreaterThan(0.3);
  });

  it('nice archetypes always play safe', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n)]));
    p.Ada = { ...p.Ada, archetype: 'hero', stats: { ...p.Ada.stats, boldness: 10 } };
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx(i, p));
      expect(out.assignment.strategies?.Ada, `seed ${i}`).toBe('safe');
    }
  });

  it('being named twice is an event that costs the choosers', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { lipsync: n === 'Fay' ? 1 : 9 })]));
    let picked = null;
    for (let i = 0; i < 30 && !picked; i++) {
      picked = runMaxi(ctx(i, p)).events.find(e => e.type === 'picked-on');
    }
    expect(picked, 'the weakest lip syncer was never named twice in thirty rooms').toBeTruthy();
    expect(picked.pop[picked.players[0]]).toBeGreaterThan(0);
    for (const [, , d] of picked.bond) expect(d).toBeLessThan(0);
  });
});

describe('the bracket', () => {
  it('is built from the picks, not from the roster order', () => {
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx(i));
      const opening = duelsOf(out).filter(d => d.round === 1);
      expect(opening.some(d => d.chosen), `seed ${i}: nobody faced who they named`).toBe(true);
      for (const d of opening.filter(x => x.chosen)) {
        expect(out.assignment.picks[d.a].choice, `seed ${i}`).toBe(d.b);
      }
    }
  });

  it('three rounds: everybody, then losers, then sudden death', () => {
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx(i));
      const d = duelsOf(out);
      const rounds = [...new Set(d.map(x => x.round))].sort();
      expect(rounds, `seed ${i}`).toEqual([1, 2, 3]);
      expect(d.filter(x => x.round === 1).length, `seed ${i}: R1`).toBe(3);
      expect(d.filter(x => x.round === 3).length, `seed ${i}: R3`).toBeGreaterThanOrEqual(1);
      for (const x of d) expect(x.song, `seed ${i}`).toBeTruthy();
    }
  });

  it('R1 winners have 0 losses, eliminated queen has the most', () => {
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx(i));
      const rows = out.performances;
      const te = out.tournamentExit;
      for (const n of te.r1Winners) {
        expect(rows[n].detail.losses, `seed ${i}: ${n}`).toBe(0);
      }
      const elimLosses = rows[te.eliminated].detail.losses;
      for (const [name, r] of Object.entries(rows)) {
        if (name !== te.eliminated) {
          expect(r.detail.losses, `seed ${i}: ${name}`).toBeLessThanOrEqual(elimLosses);
        }
      }
    }
  });

  it('scores R1 winners above R2 safe above last survivor above eliminated', () => {
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx(i));
      const rows = out.performances;
      const te = out.tournamentExit;
      const best = te.bestDuelWinner;
      if (best) {
        expect(rows[best].perf, `seed ${i}: best`).toBeGreaterThanOrEqual(9);
      }
      if (te.eliminated && te.lastSurvivor) {
        expect(rows[te.lastSurvivor].perf, `seed ${i}`).toBeGreaterThan(rows[te.eliminated].perf);
      }
    }
  });

  it('no queen accumulates 2+ wins now that R3 is a single event', () => {
    // Triple lip sync means R3 is one duel (or one triple). Each queen
    // fights at most once per round, so the maximum individual wins is 1.
    const big = Object.fromEntries(
      ['Ada','Bee','Cleo','Dot','Eve','Fay','Gem','Hua','Ivy','Joy','Kay','Lea','Mia','Nia']
        .map(n => [n, mk(n)]));
    for (let i = 0; i < 50; i++) {
      const out = runMaxi(ctx(i, big));
      const a = out.events.find(e => e.type === 'assassin');
      expect(a, `seed ${i}: assassin should not fire`).toBeFalsy();
    }
  });

  it('a great lip syncer wins R1 far more often than a bad one', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { lipsync: n === 'Cleo' ? 10 : 3, dance: n === 'Cleo' ? 10 : 3 })]));
    let r1wins = 0;
    for (let i = 0; i < 40; i++) {
      const te = runMaxi(ctx(i, p)).tournamentExit;
      if (te.r1Winners.includes('Cleo')) r1wins++;
    }
    expect(r1wins / 40).toBeGreaterThan(0.4);
  });

  it('copes with an odd room by giving somebody a bye', () => {
    const five = Object.fromEntries(['Ada', 'Bee', 'Cleo', 'Dot', 'Eve'].map(n => [n, mk(n)]));
    const out = runMaxi(ctx(1, five));
    expect(Object.keys(out.performances).length).toBe(5);
    const te = out.tournamentExit;
    expect(te.r1Winners.length + te.r1Losers.length).toBe(5);
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });

  it('fatigue reduces adjusted scores for repeated lip syncs', () => {
    for (let i = 0; i < 10; i++) {
      const d = duelsOf(runMaxi(ctx(i)));
      const r3 = d.filter(x => x.round === 3);
      for (const duel of r3) {
        expect(duel.fatigue[duel.a], `seed ${i}`).toBeLessThan(1.0);
        expect(duel.fatigue[duel.b], `seed ${i}`).toBeLessThan(1.0);
      }
    }
  });

  it('generates prose scenes for every duel', () => {
    for (let i = 0; i < 10; i++) {
      const out = runMaxi(ctx(i));
      const prose = out.scenes.filter(s => /^tournament-/.test(s.kind));
      expect(prose.length, `seed ${i}`).toBeGreaterThanOrEqual(6);
      for (const s of prose) expect(s.text, `seed ${i}: ${s.kind}`).toBeTruthy();
    }
  });
});
