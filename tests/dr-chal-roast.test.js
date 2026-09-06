// ══════════════════════════════════════════════════════════════════════
// dr-chal-roast.test.js — the running order, and a room that cools
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { SLOT_DIFFICULTY } from '../js/dr/chal/roast.js';
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

function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])), maxiId = 'roast') {
  const bonds = {};
  return {
    living: Object.keys(players), players, maxi: maxiById(maxiId), rng: seeded(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: (a, b, d) => {
      const k = [a, b].sort().join('|');
      bonds[k] = (bonds[k] || 0) + d;
    },
    popDelta: () => {}, miniWinner: 'Ada', mini: null, cfg: {},
  };
}

describe('the running order', () => {
  it('gives every queen a different slot, and the mini winner picks first', () => {
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx(i));
      const slots = Object.values(out.performances).map(p => p.detail.slot);
      expect(slots.slice().sort((a, b) => a - b), `seed ${i}`).toEqual([1, 2, 3, 4, 5, 6]);
    }
    expect(runMaxi(ctx(1)).assignment.order[0]).toBe('Ada');
  });

  it('a bold queen reaches for the closer; a nervous one hides in the middle', () => {
    const at = boldness => {
      const p = Object.fromEntries(NAMES.map(n => [n, mk(n, {}, bold(n === 'Ada' ? boldness : 5))]));
      let sum = 0;
      for (let i = 0; i < 30; i++) sum += runMaxi(ctx(i, p)).performances.Ada.detail.slot;
      return sum / 30;
    };
    // Ada picks first either way, so the only thing moving is what she wants.
    expect(at(10)).toBeGreaterThan(at(1) + 1);
  });

  it('the ends swing harder than the middle, both ways', () => {
    expect(SLOT_DIFFICULTY.first).toBeGreaterThan(SLOT_DIFFICULTY.middle);
    expect(SLOT_DIFFICULTY.last).toBeGreaterThan(SLOT_DIFFICULTY.middle);
    const spreadAt = kind => {
      const vals = [];
      for (let i = 0; i < 60; i++) {
        for (const r of Object.values(runMaxi(ctx(i)).performances)) {
          if (r.detail.slotKind === kind) vals.push(r.perf);
        }
      }
      const m = vals.reduce((a, b) => a + b, 0) / vals.length;
      return Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length);
    };
    expect(spreadAt('first')).toBeGreaterThan(spreadAt('middle'));
  });
});

describe('the writing room', () => {
  it('writes three bits per queen', () => {
    const out = runMaxi(ctx(2));
    for (const n of NAMES) expect(out.performances[n].detail.bits.length, n).toBe(3);
  });

  it('a schemer next to a better set steals the angle, once, and pays', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Ada' ? { comedy: 10 } : { comedy: 2 },
      { archetype: 'villain' })]));
    let theft = null;
    for (let i = 0; i < 40 && !theft; i++) {
      const evs = runMaxi(ctx(i, p)).events.filter(e => e.type === 'stole-a-bit');
      expect(evs.length, `seed ${i} had a room full of thieves`).toBeLessThanOrEqual(1);
      theft = evs[0];
    }
    expect(theft, 'a room of villains never once took a better queen angle').toBeTruthy();
    expect(theft.bond[0][2]).toBeLessThan(0);
    expect(Object.values(theft.pop)[0]).toBeLessThan(0);
  });

  it('and a room of heroes never steals, however far behind they are', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Ada' ? { comedy: 10 } : { comedy: 1 })]));
    for (let i = 0; i < 30; i++) {
      expect(runMaxi(ctx(i, p)).events.some(e => e.type === 'stole-a-bit'), `seed ${i}`).toBe(false);
    }
  });
});

describe('the room', () => {
  it('carries forward: the first queen faces a cold room and cannot warm herself', () => {
    for (let i = 0; i < 20; i++) {
      const first = Object.values(runMaxi(ctx(i)).performances).find(r => r.detail.slot === 1);
      expect(first.detail.roomTemp, `seed ${i}`).toBe(0);
    }
  });

  it('a set after two great ones is warmer than one after two disasters', () => {
    // Measured across the whole order: when the room temperature moves it must
    // move WITH what came before, or it is a decoration rather than a term.
    let agree = 0;
    let n = 0;
    for (let i = 0; i < 60; i++) {
      const rows = Object.values(runMaxi(ctx(i)).performances).sort((a, b) => a.detail.slot - b.detail.slot);
      for (let k = 1; k < rows.length; k++) {
        const before = rows.slice(0, k);
        const good = before.filter(r => r.perf > 8).length;
        const bad = before.filter(r => r.perf < 4).length;
        if (good === bad) continue;
        n++;
        if (Math.sign(rows[k].detail.roomTemp) === Math.sign(good - bad)) agree++;
      }
    }
    expect(n).toBeGreaterThan(20);
    expect(agree / n).toBe(1);
  });

  it('never runs away with the night: the cap holds', () => {
    for (let i = 0; i < 40; i++) {
      for (const r of Object.values(runMaxi(ctx(i)).performances)) {
        expect(Math.abs(r.detail.roomTemp), `seed ${i}`).toBeLessThanOrEqual(1.2);
      }
    }
  });
});

describe('the sets', () => {
  it('a comic beats a seamstress here', () => {
    const p = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, n === 'Eve' ? { comedy: 10, acting: 9 } : { comedy: 3, design: 10 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, p));
      if (Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Eve') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.5);
  });

  it('three duds is a bomb with a cost', () => {
    const weak = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 1, acting: 1 })]));
    let bombed = null;
    for (let i = 0; i < 30 && !bombed; i++) {
      bombed = runMaxi(ctx(i, weak)).events.find(e => e.type === 'bombed');
    }
    expect(bombed, 'nobody with 1 comedy ever bombed a roast').toBeTruthy();
    expect(Object.values(bombed.pop)[0]).toBeLessThan(0);
  });

  it('a bold queen who lands it turns on the panel, and it is remembered', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 10, acting: 10 }, bold(10))]));
    let roasted = null;
    for (let i = 0; i < 30 && !roasted; i++) {
      roasted = runMaxi(ctx(i, p)).events.find(e => e.type === 'roasted-the-panel');
    }
    expect(roasted, 'a room of fearless comics never once turned on the judges').toBeTruthy();
    expect(roasted.state.panelRoasted).toBe(roasted.players[0]);
  });

  it('serves the stand-up challenge from the same mechanic', () => {
    const out = runMaxi(ctx(1, undefined, 'stand-up'));
    expect(Object.keys(out.performances).length).toBe(6);
    expect(out.performances.Ada.detail.bits.length).toBe(3);
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });
});
