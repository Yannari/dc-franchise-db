import { describe, it, expect, beforeEach } from 'vitest';
import { STATS, ARCHETYPES, ARCHETYPE_NAMES, DEFAULT_STATS, ADVANTAGES, THREAT_TIERS } from '../js/core.js';

describe('core.js — constants', () => {
  it('exports exactly 9 stats', () => {
    expect(STATS).toHaveLength(9);
    const keys = STATS.map(s => s.key);
    expect(keys).toContain('physical');
    expect(keys).toContain('strategic');
    expect(keys).toContain('temperament');
  });

  it('exports 15 archetypes', () => {
    const keys = Object.keys(ARCHETYPES);
    expect(keys).toHaveLength(15);
  });

  it('every archetype has all 9 stat keys', () => {
    const statKeys = STATS.map(s => s.key);
    for (const [archName, stats] of Object.entries(ARCHETYPES)) {
      for (const key of statKeys) {
        expect(stats, `${archName} missing ${key}`).toHaveProperty(key);
        expect(typeof stats[key], `${archName}.${key} not a number`).toBe('number');
      }
    }
  });

  it('every archetype has a display name', () => {
    for (const key of Object.keys(ARCHETYPES)) {
      expect(ARCHETYPE_NAMES, `missing name for ${key}`).toHaveProperty(key);
    }
  });

  it('DEFAULT_STATS has all 9 keys at value 5', () => {
    const statKeys = STATS.map(s => s.key);
    for (const key of statKeys) {
      expect(DEFAULT_STATS[key]).toBe(5);
    }
  });

  it('THREAT_TIERS are sorted ascending by max', () => {
    for (let i = 1; i < THREAT_TIERS.length; i++) {
      expect(THREAT_TIERS[i].max).toBeGreaterThan(THREAT_TIERS[i - 1].max);
    }
  });

  it('ADVANTAGES each have key and label', () => {
    expect(ADVANTAGES.length).toBeGreaterThan(0);
    for (const adv of ADVANTAGES) {
      expect(adv).toHaveProperty('key');
      expect(adv).toHaveProperty('label');
    }
  });
});
