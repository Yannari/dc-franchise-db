// ══════════════════════════════════════════════════════════════════════
// tests/dr-legacy.test.js — the power ledger and the legacy choice
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { powerMind, timesSpared, recordUse, initLedger } from '../js/dr/power.js';
import { holderMind, timesSaved } from '../js/dr/saves.js';
import { chooseElimination } from '../js/dr/legacy.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const q = (name, archetype, over = {}) => ({
  name, archetype,
  stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), ...over },
});

describe('the power ledger', () => {
  it('counts who has been spared, whoever spared her', () => {
    const l = initLedger();
    recordUse(l, { ep: 2, holder: 'A', picks: [{ saved: 'B' }] });
    recordUse(l, { ep: 4, holder: 'C', picks: [{ saved: 'B' }] });
    expect(timesSpared(l, 'B')).toBe(2);
    expect(timesSpared(l, 'A')).toBe(0);
  });

  it('is the same ledger the save writes — one account, not two', () => {
    const l = initLedger();
    recordUse(l, { ep: 2, holder: 'A', picks: [{ saved: 'B' }] });
    expect(timesSaved(l, 'B')).toBe(timesSpared(l, 'B'));
  });
});

describe('powerMind', () => {
  it('is what holderMind was — the save keeps its name', () => {
    const p = q('A', 'villain', { strategic: 9, loyalty: 2 });
    expect(powerMind(p)).toEqual(holderMind(p));
  });

  it('never zeroes a pull: even a hero wants to win', () => {
    const m = powerMind(q('H', 'hero', { social: 9, loyalty: 9 }));
    expect(m.strategy).toBeGreaterThan(0);
    expect(m.strategy + m.merit + m.fair).toBeCloseTo(1, 6);
  });

  it('leans a villain toward strategy and a hero toward fair', () => {
    const v = powerMind(q('V', 'villain', { strategic: 8, loyalty: 3 }));
    const h = powerMind(q('H', 'hero', { strategic: 8, loyalty: 3 }));
    expect(v.strategy).toBeGreaterThan(h.strategy);
    expect(h.fair).toBeGreaterThan(v.fair);
  });
});

// ══════════════════════════════════════════════════════════════════════
// The choice itself
// ══════════════════════════════════════════════════════════════════════
const seeded = (s) => { let x = s + 1; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; };

function setup(over = {}) {
  const players = {
    Villain: q('Villain', 'villain', { strategic: 9, loyalty: 2, boldness: 8 }),
    Hero: q('Hero', 'hero', { social: 9, loyalty: 9 }),
    Threat: q('Threat', 'challenge-beast', { physical: 9 }),
    Weak: q('Weak', 'floater'),
    Friend: q('Friend', 'social-butterfly'),
  };
  return {
    players, bond: () => 0, ledger: initLedger(), pleas: {}, rng: () => 0.5,
    state: {
      record: {
        Threat: ['WIN', 'WIN', 'HIGH'], Weak: ['LOW', 'BTM2', 'SAFE'], Friend: ['SAFE', 'SAFE', 'LOW'],
      },
      allStars: { pasts: { Threat: { rank: 2, of: 12, wins: 3, real: false } } },
    },
    ...over,
  };
}

describe('the legacy choice', () => {
  it('always names somebody from the bottom, never one of the two who sang', () => {
    const r = chooseElimination({
      ...setup(), winner: 'Villain', pool: ['Threat', 'Weak', 'Friend'],
      panelOrder: ['Friend', 'Weak', 'Threat'],
    });
    expect(['Threat', 'Weak', 'Friend']).toContain(r.target);
    expect(r.target).not.toBe('Villain');
    expect(typeof r.reason).toBe('string');
    expect(r.reason.length).toBeGreaterThan(0);
  });

  it('is deterministic for the same night', () => {
    const args = { ...setup(), winner: 'Villain', pool: ['Threat', 'Weak'], panelOrder: ['Threat', 'Weak'] };
    expect(chooseElimination(args)).toEqual(chooseElimination(args));
  });

  it('sends the threat home more often for a villain than for a hero', () => {
    const count = (who) => {
      let n = 0;
      for (let s = 0; s < 60; s++) {
        const r = chooseElimination({
          ...setup(), winner: who, pool: ['Threat', 'Weak'],
          panelOrder: ['Threat', 'Weak'], rng: seeded(s),
        });
        if (r.target === 'Threat') n++;
      }
      return n;
    };
    expect(count('Villain')).toBeGreaterThan(count('Hero'));
  });

  it('takes the queen the panel ranked last more often for a hero', () => {
    let panelLast = 0;
    for (let s = 0; s < 60; s++) {
      const r = chooseElimination({
        ...setup(), winner: 'Hero', pool: ['Threat', 'Weak'],
        panelOrder: ['Threat', 'Weak'], rng: seeded(s + 7),
      });
      if (r.target === 'Weak') panelLast++;
    }
    expect(panelLast).toBeGreaterThan(30);
  });

  it('remembers who sent her home last time they were in a room together', () => {
    const run = (l) => {
      let n = 0;
      for (let s = 0; s < 60; s++) {
        const r = chooseElimination({
          ...setup(), ledger: l, winner: 'Villain', pool: ['Weak', 'Friend'],
          panelOrder: ['Friend', 'Weak'], rng: seeded(s + 3),
        });
        if (r.target === 'Weak') n++;
      }
      return n;
    };
    const withGrudge = initLedger();
    withGrudge.grudges.push({ by: 'Weak', against: 'Villain' });
    expect(run(withGrudge)).toBeGreaterThan(run(initLedger()));
  });

  it('spares a queen who worked her in Untucked', () => {
    const args = {
      ...setup(), winner: 'Villain', pool: ['Weak', 'Friend'], panelOrder: ['Friend', 'Weak'],
    };
    const noPlea = chooseElimination(args).target;
    const pleaded = chooseElimination({ ...args, pleas: { Villain: { [noPlea]: 6 } } }).target;
    expect(pleaded).not.toBe(noPlea);
  });
});
