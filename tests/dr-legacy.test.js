// ══════════════════════════════════════════════════════════════════════
// tests/dr-legacy.test.js — the power ledger and the legacy choice
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { powerMind, timesSpared, recordUse, initLedger } from '../js/dr/power.js';
import { holderMind, timesSaved } from '../js/dr/saves.js';

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
