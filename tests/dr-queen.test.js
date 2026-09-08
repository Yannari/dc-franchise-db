// ══════════════════════════════════════════════════════════════════════
// dr-queen.test.js — what a queen is made of
// ══════════════════════════════════════════════════════════════════════
//
// Two layers, and keeping them apart is the whole design. The nine roster
// stats are the PERSON and drive the werk room; the seven craft stats are what
// the judges score. Star power is neither: it is computed once a season, shown
// to nobody, and must never reach the performance step — a hidden number that
// decides what she DID rather than how she is SEEN would collapse the three
// steps into one.
import { describe, expect, it } from 'vitest';
import { DRAG_STATS, DRAG_STYLES, dragOf, craftMean, starPower } from '../js/dr/queen.js';
import { seededRandom } from './helpers/rng.js';

const base = {
  name: 'Q', archetype: 'villain', age: 22,
  stats: { physical: 5, endurance: 5, mental: 5, social: 8, strategic: 5,
    loyalty: 3, boldness: 9, intuition: 5, temperament: 5 },
};

describe('dragOf', () => {
  it('fills every craft stat at 5 when absent and clamps 1..10', () => {
    const d = dragOf(base);
    for (const k of DRAG_STATS) expect(d[k], k).toBe(5);
    expect(dragOf({ ...base, drag: { comedy: 14, dance: -2 } }).comedy).toBe(10);
    expect(dragOf({ ...base, drag: { comedy: 14, dance: -2 } }).dance).toBe(1);
  });

  it('never throws on a malformed record', () => {
    for (const bad of [null, undefined, {}, { drag: null }, { drag: 'nonsense' }, { drag: { acting: 'x' } }]) {
      expect(() => dragOf(bad), JSON.stringify(bad)).not.toThrow();
    }
    expect(dragOf(null).acting).toBe(5);
  });

  it('does not mutate the player it is given', () => {
    const p = { ...base, drag: { comedy: 9 } };
    const before = JSON.stringify(p);
    dragOf(p);
    expect(JSON.stringify(p)).toBe(before);
  });

  it('derives a style when none is authored, and keeps an authored one', () => {
    expect(DRAG_STYLES).toContain(dragOf({ ...base, drag: { comedy: 9 } }).style);
    expect(dragOf({ ...base, drag: { comedy: 9 } }).style).toBe('comedy');
    expect(dragOf({ ...base, drag: { style: 'spooky' } }).style).toBe('spooky');
    // An authored style that is not a real style is not honoured.
    expect(dragOf({ ...base, drag: { style: 'nonsense' } }).style).not.toBe('nonsense');
    expect(DRAG_STYLES).toContain(dragOf({ ...base, drag: { style: 'nonsense' } }).style);
  });

  it('keeps at most three real traits', () => {
    const d = dragOf({ ...base, drag: { traits: ['padded', 'bearded', 'wit', 'big-wigs', 'nonsense'] } });
    expect(d.traits.length).toBeLessThanOrEqual(3);
    expect(d.traits).not.toContain('nonsense');
  });

  it('craftMean averages the seven', () => {
    expect(craftMean({ ...base, drag: Object.fromEntries(DRAG_STATS.map(k => [k, 10])) })).toBe(10);
    expect(craftMean(base)).toBe(5);
  });
});

describe('starPower', () => {
  it('is hidden-shaped: proportional, bounded, seeded', () => {
    const a = starPower({ ...base, drag: { comedy: 9, acting: 9, lipsync: 9 } }, seededRandom(7));
    const b = starPower({
      ...base, archetype: 'floater', age: 30,
      stats: { ...base.stats, social: 2, boldness: 2 },
      drag: { comedy: 2, acting: 2, lipsync: 2 },
    }, seededRandom(7));
    expect(a).toBeGreaterThan(b);
    expect(a).toBeLessThanOrEqual(10);
    expect(b).toBeGreaterThanOrEqual(0);
    // Same seed, same answer; different seed, different answer. The roll is
    // what makes the same queen a darling one season and ignored the next.
    expect(starPower(base, seededRandom(3))).toBe(starPower(base, seededRandom(3)));
    expect(starPower(base, seededRandom(3))).not.toBe(starPower(base, seededRandom(4)));
  });

  it('bumps the very young and the veteran, not the middle', () => {
    const at = age => starPower({ ...base, age }, seededRandom(1));
    expect(at(21)).toBeGreaterThan(at(30));
    expect(at(41)).toBeGreaterThan(at(30));
  });

  it('prices archetype: a villain is television, a floater is not', () => {
    const arch = a => starPower({ ...base, archetype: a }, seededRandom(2));
    expect(arch('villain')).toBeGreaterThan(arch('floater'));
    expect(arch('chaos-agent')).toBeGreaterThan(arch('goat'));
  });

  it('is proportional throughout — no thresholds', () => {
    // A one-point stat change must always move it a little, never not at all
    // and never off a cliff.
    const at = social => starPower({ ...base, stats: { ...base.stats, social } }, seededRandom(5));
    const steps = [];
    for (let s = 1; s <= 10; s++) steps.push(at(s));
    for (let i = 1; i < steps.length; i++) {
      const d = steps[i] - steps[i - 1];
      expect(d, `social ${i} -> ${i + 1} did not move`).toBeGreaterThan(0);
      expect(d, `social ${i} -> ${i + 1} is a cliff`).toBeLessThan(1);
    }
  });
});
