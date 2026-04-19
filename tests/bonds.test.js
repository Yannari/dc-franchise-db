import { describe, it, expect, beforeEach } from 'vitest';
import { getBond, setBond, addBond, bKey, getPerceivedBond } from '../js/bonds.js';
import { seedGame } from './helpers/setup.js';
import { gs } from '../js/core.js';

describe('bonds.js', () => {
  beforeEach(() => {
    seedGame([
      { name: 'Alice', gender: 'f', archetype: 'hero' },
      { name: 'Bob', gender: 'm', archetype: 'villain' },
      { name: 'Carol', gender: 'f', archetype: 'floater' },
    ]);
  });

  describe('bKey', () => {
    it('produces consistent sorted key', () => {
      expect(bKey('Alice', 'Bob')).toBe(bKey('Bob', 'Alice'));
    });

    it('contains both names', () => {
      const key = bKey('Alice', 'Bob');
      expect(key).toContain('Alice');
      expect(key).toContain('Bob');
    });
  });

  describe('getBond / setBond', () => {
    it('defaults to 0 for unknown pair', () => {
      expect(getBond('Alice', 'Bob')).toBe(0);
    });

    it('setBond stores and getBond retrieves', () => {
      setBond('Alice', 'Bob', 5);
      expect(getBond('Alice', 'Bob')).toBe(5);
      expect(getBond('Bob', 'Alice')).toBe(5); // symmetric
    });

    it('clamps to [-10, +10]', () => {
      setBond('Alice', 'Bob', 15);
      expect(getBond('Alice', 'Bob')).toBe(10);
      setBond('Alice', 'Bob', -15);
      expect(getBond('Alice', 'Bob')).toBe(-10);
    });
  });

  describe('addBond', () => {
    it('adds to existing bond', () => {
      setBond('Alice', 'Bob', 3);
      addBond('Alice', 'Bob', 2);
      expect(getBond('Alice', 'Bob')).toBeGreaterThan(3);
    });

    it('villain positive bonds form slower (0.7x)', () => {
      // Bob is villain — positive delta should be dampened
      setBond('Bob', 'Carol', 0);
      addBond('Bob', 'Carol', 2);
      const villainBond = getBond('Bob', 'Carol');
      // Reset
      setBond('Bob', 'Carol', 0);
      // Carol is floater — no modifier
      setBond('Alice', 'Carol', 0);
      addBond('Alice', 'Carol', 2);
      const heroBond = getBond('Alice', 'Carol');
      // Hero bonds should be >= villain bonds (heroes get 1.15x boost)
      expect(heroBond).toBeGreaterThan(villainBond);
    });

    it('respects clamp after addition', () => {
      setBond('Alice', 'Bob', 9);
      addBond('Alice', 'Bob', 5);
      expect(getBond('Alice', 'Bob')).toBe(10);
    });
  });

  describe('getPerceivedBond', () => {
    it('returns actual bond when no perceived override', () => {
      setBond('Alice', 'Bob', 4);
      expect(getPerceivedBond('Alice', 'Bob')).toBe(4);
    });

    it('returns perceived value when set and differs from actual', () => {
      setBond('Alice', 'Bob', 4);
      gs.perceivedBonds['Alice→Bob'] = { perceived: 7, reason: 'test' };
      // perceived=7, actual=4, diff=3 >= 0.3 so perceived wins
      expect(getPerceivedBond('Alice', 'Bob')).toBe(7);
    });

    it('falls back to actual when perceived is close to actual', () => {
      setBond('Alice', 'Bob', 4);
      gs.perceivedBonds['Alice→Bob'] = { perceived: 4.1, reason: 'test' };
      // diff=0.1 < 0.3, so actual wins
      expect(getPerceivedBond('Alice', 'Bob')).toBe(4);
    });
  });
});
