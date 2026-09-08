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

const duelsOf = out => out.scenes.find(s => s.kind === 'bracket').data.duels;

describe('the choosing', () => {
  it('everybody names somebody, and the mini winner names first', () => {
    const out = runMaxi(ctx(1));
    expect(runMaxi(ctx(1)).assignment.order[0]).toBe('Ada');
    expect(Object.keys(out.assignment.picks).length).toBe(6);
  });

  it('the weakest lip syncer in the room is the one who gets named', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { lipsync: n === 'Fay' ? 1 : 9 })]));
    const picks = runMaxi(ctx(1, p)).assignment.picks;
    // Only one queen can have her, so the rest fall to second choices — but
    // whoever picks first goes straight for Fay.
    expect(picks.Ada.choice).toBe('Fay');
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
    // The failure this guards is the one that keeps happening in this
    // codebase: a choice the viewer watches somebody make that changes
    // nothing. At least one opening duel must be a duel somebody asked for.
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx(i));
      const opening = duelsOf(out).filter(d => d.round === 1);
      expect(opening.some(d => d.chosen), `seed ${i}: nobody faced who they named`).toBe(true);
      for (const d of opening.filter(x => x.chosen)) {
        expect(out.assignment.picks[d.a].choice, `seed ${i}`).toBe(d.b);
      }
    }
  });

  it('runs to exactly one unbeaten queen and loses nobody on the way', () => {
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx(i));
      const rows = Object.values(out.performances);
      expect(rows.length, `seed ${i}`).toBe(6);
      expect(rows.filter(r => r.detail.losses === 0).length, `seed ${i}`).toBe(1);
      // Single elimination: nobody loses twice.
      for (const r of rows) expect(r.detail.losses, `seed ${i}`).toBeLessThanOrEqual(1);
      const d = duelsOf(out);
      expect(d.length, `seed ${i}`).toBe(5);
      for (const x of d) expect(x.song, `seed ${i}`).toBeTruthy();
    }
  });

  it('scores winning above losing, every time', () => {
    for (let i = 0; i < 20; i++) {
      const rows = Object.values(runMaxi(ctx(i)).performances);
      const champ = rows.find(r => r.detail.losses === 0);
      for (const r of rows) {
        if (r !== champ) expect(champ.perf, `seed ${i}`).toBeGreaterThan(r.perf);
      }
    }
  });

  it('three wins in one night is an assassin', () => {
    let a = null;
    for (let i = 0; i < 20 && !a; i++) a = runMaxi(ctx(i)).events.find(e => e.type === 'assassin');
    expect(a, 'nobody in twenty brackets ever won three').toBeTruthy();
    expect(a.pop[a.players[0]]).toBeGreaterThan(0);
    expect(a.state.assassin).toBe(a.players[0]);
  });

  it('a great lip syncer wins the bracket far more often than a bad one', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { lipsync: n === 'Cleo' ? 10 : 3, dance: n === 'Cleo' ? 10 : 3 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const rows = runMaxi(ctx(i, p)).performances;
      if (rows.Cleo.detail.losses === 0) wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.4);
  });

  it('copes with an odd room by giving somebody a bye', () => {
    const five = Object.fromEntries(['Ada', 'Bee', 'Cleo', 'Dot', 'Eve'].map(n => [n, mk(n)]));
    const out = runMaxi(ctx(1, five));
    expect(Object.keys(out.performances).length).toBe(5);
    expect(Object.values(out.performances).filter(r => r.detail.losses === 0).length).toBe(1);
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });
});
