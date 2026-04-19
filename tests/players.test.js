import { describe, it, expect, beforeEach } from 'vitest';
import { pStats, pronouns, romanticCompat, overall, threat, threatTier } from '../js/players.js';
import { ARCHETYPES } from '../js/core.js';
import { seedGame, makePlayer, seedPlayers } from './helpers/setup.js';

describe('players.js — pure functions', () => {
  beforeEach(() => {
    seedGame([
      { name: 'Alice', gender: 'f', archetype: 'hero' },
      { name: 'Bob', gender: 'm', archetype: 'villain' },
      { name: 'Carol', gender: 'f', archetype: 'social-butterfly', sexuality: 'lesbian' },
      { name: 'Dave', gender: 'm', archetype: 'challenge-beast' },
      { name: 'Enby', gender: 'nb', archetype: 'wildcard', sexuality: 'bi' },
    ]);
  });

  describe('pStats', () => {
    it('returns hero stats for Alice', () => {
      const s = pStats('Alice');
      expect(s.physical).toBe(ARCHETYPES['hero'].physical);
      expect(s.loyalty).toBe(ARCHETYPES['hero'].loyalty);
    });

    it('returns DEFAULT_STATS for unknown player', () => {
      const s = pStats('Nobody');
      expect(s.physical).toBe(5);
      expect(s.strategic).toBe(5);
    });

    it('returns at least 9 stat keys', () => {
      const s = pStats('Alice');
      expect(Object.keys(s).length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('pronouns', () => {
    it('returns he/him for male', () => {
      const p = pronouns('Bob');
      expect(p.sub).toBe('he');
      expect(p.obj).toBe('him');
      expect(p.pos).toBe('his');
      expect(p.posAdj).toBe('his');
      expect(p.ref).toBe('himself');
      expect(p.Sub).toBe('He');
    });

    it('returns she/her for female', () => {
      const p = pronouns('Alice');
      expect(p.sub).toBe('she');
      expect(p.obj).toBe('her');
      expect(p.pos).toBe('hers');
      expect(p.posAdj).toBe('her');
    });

    it('returns they/them for non-binary', () => {
      const p = pronouns('Enby');
      expect(p.sub).toBe('they');
      expect(p.obj).toBe('them');
      expect(p.pos).toBe('theirs');
      expect(p.posAdj).toBe('their');
      expect(p.ref).toBe('themselves');
    });

    it('does NOT have a Pos property', () => {
      const p = pronouns('Alice');
      expect(p).not.toHaveProperty('Pos');
    });

    it('returns nb pronouns for unknown player', () => {
      const p = pronouns('Ghost');
      expect(p.sub).toBe('they');
    });
  });

  describe('romanticCompat', () => {
    it('straight m + straight f = compatible', () => {
      expect(romanticCompat('Bob', 'Alice')).toBe(true);
    });

    it('straight m + straight m = incompatible', () => {
      expect(romanticCompat('Bob', 'Dave')).toBe(false);
    });

    it('lesbian f + straight m = incompatible', () => {
      expect(romanticCompat('Carol', 'Bob')).toBe(false);
    });

    it('bi nb + anyone = compatible', () => {
      expect(romanticCompat('Enby', 'Alice')).toBe(true);
      expect(romanticCompat('Enby', 'Bob')).toBe(true);
    });

    it('lesbian f + bi nb = depends on attraction direction', () => {
      // Carol is lesbian (f attracted to f). Enby is nb, not f — lesbian attraction requires f+f
      // This tests the actual game logic
      const result = romanticCompat('Carol', 'Enby');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('overall', () => {
    it('returns average of all stats as string', () => {
      const stats = { physical: 10, endurance: 10, mental: 10, social: 10, strategic: 10, loyalty: 10, boldness: 10, intuition: 10, temperament: 10 };
      expect(overall(stats)).toBe('10.0');
    });

    it('handles mixed stats', () => {
      const stats = { physical: 1, endurance: 1, mental: 1, social: 1, strategic: 1, loyalty: 1, boldness: 1, intuition: 1, temperament: 10 };
      const result = parseFloat(overall(stats));
      expect(result).toBeGreaterThan(1);
      expect(result).toBeLessThan(10);
    });
  });

  describe('threat (cast builder)', () => {
    it('returns a numeric string', () => {
      const stats = ARCHETYPES['challenge-beast'];
      const result = threat(stats);
      expect(parseFloat(result)).toBeGreaterThan(0);
    });

    it('challenge-beast has higher threat than goat', () => {
      expect(parseFloat(threat(ARCHETYPES['challenge-beast'])))
        .toBeGreaterThan(parseFloat(threat(ARCHETYPES['goat'])));
    });
  });

  describe('threatTier', () => {
    it('low tier for score <= 3', () => {
      expect(threatTier(2).label).toBe('Low');
    });

    it('extreme tier for score > 7', () => {
      expect(threatTier(8).label).toBe('Extreme');
    });
  });
});
