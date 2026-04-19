import { describe, it, expect, beforeEach } from 'vitest';
import { repairGsSets, prepGsForSave } from '../js/core.js';
import { seedGs } from './helpers/setup.js';
import { gs, setGs } from '../js/core.js';

describe('core.js — serialization', () => {
  beforeEach(() => {
    seedGs();
  });

  describe('repairGsSets', () => {
    it('converts arrays back to Sets for known fields', () => {
      const g = { blowupHeatNextEp: ['Alice'], injuredThisEp: ['Bob'] };
      repairGsSets(g);
      expect(g.blowupHeatNextEp).toBeInstanceOf(Set);
      expect(g.blowupHeatNextEp.has('Alice')).toBe(true);
      expect(g.injuredThisEp).toBeInstanceOf(Set);
    });

    it('creates empty Sets for missing fields', () => {
      const g = {};
      repairGsSets(g);
      expect(g.blowupHeatNextEp).toBeInstanceOf(Set);
      expect(g.blowupHeatNextEp.size).toBe(0);
    });

    it('preserves existing Sets', () => {
      const g = { blowupHeatNextEp: new Set(['a']) };
      repairGsSets(g);
      expect(g.blowupHeatNextEp).toBeInstanceOf(Set);
      expect(g.blowupHeatNextEp.has('a')).toBe(true);
    });

    it('handles null gracefully', () => {
      expect(() => repairGsSets(null)).not.toThrow();
    });
  });

  describe('prepGsForSave', () => {
    it('converts Sets to arrays for JSON serialization', () => {
      const g = { blowupHeatNextEp: new Set(['x', 'y']), activePlayers: ['A'] };
      const saved = prepGsForSave(g);
      expect(Array.isArray(saved.blowupHeatNextEp)).toBe(true);
      expect(saved.blowupHeatNextEp).toContain('x');
      const json = JSON.stringify(saved);
      expect(json).toBeDefined();
    });

    it('returns null for null input', () => {
      expect(prepGsForSave(null)).toBeNull();
    });
  });
});
