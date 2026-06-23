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

  // Full persistence flow: saveGameState does prepGsForSave -> JSON clone, then
  // repairGsSets to restore the live Sets; loadAll does JSON.parse -> repairGsSets.
  // This guards against silent data loss across a real save/load cycle.
  describe('save -> JSON -> load round-trip', () => {
    const ALL_SET_FIELDS = ['blowupHeatNextEp', 'knownIdolHoldersThisEp', 'knownIdolHoldersPersistent',
      'knownAmuletHoldersThisEp', 'knownAmuletHoldersPersistent', 'socialBombHeatThisEp', 'injuredThisEp',
      'scramblingThisEp', 'beastDrillsThisEp', 'lieTargetsThisEp', 'knownTeamSwapHolders', 'knownVoteBlockHolders',
      'knownVoteStealHolders', 'knownSafetyNoPowerHolders', 'knownSoleVoteHolders', 'shotInDarkUsed', '_volunteerExileUsed'];

    it('restores every Set field and preserves nested data through a clone', () => {
      const original = {
        episode: 7, phase: 'merge', isMerged: true,
        activePlayers: ['Alice', 'Bob', 'Carl'],
        eliminated: ['Dana'],
        bonds: { 'Alice|Bob': 4, 'Bob|Carl': -2 },
        advantages: [{ holder: 'Alice', type: 'idol', foundEp: 3 }],
        episodeHistory: [{ num: 1, eliminated: 'Eve', votes: { Eve: 4 } }],
        popularity: { Alice: 9 },
      };
      // populate every Set field with a value so we can verify restoration
      ALL_SET_FIELDS.forEach((f, i) => { original[f] = new Set([`p${i}`]); });

      // 1. save: convert Sets -> arrays (in place), then deep-clone as JSON would
      prepGsForSave(original);
      ALL_SET_FIELDS.forEach(f => expect(Array.isArray(original[f]), `${f} should be array after prep`).toBe(true));
      const cloned = JSON.parse(JSON.stringify(original));

      // 2. load: restore Sets on the clone
      repairGsSets(cloned);

      // every Set field is a Set again with its value intact
      ALL_SET_FIELDS.forEach((f, i) => {
        expect(cloned[f], `${f} restored`).toBeInstanceOf(Set);
        expect(cloned[f].has(`p${i}`), `${f} value preserved`).toBe(true);
      });
      // nested non-Set data survived untouched
      expect(cloned.episode).toBe(7);
      expect(cloned.bonds['Alice|Bob']).toBe(4);
      expect(cloned.advantages[0]).toEqual({ holder: 'Alice', type: 'idol', foundEp: 3 });
      expect(cloned.episodeHistory[0].votes).toEqual({ Eve: 4 });
      expect(cloned.activePlayers).toEqual(['Alice', 'Bob', 'Carl']);
    });

    it('round-trips a gs that was never given any Set fields (fresh save)', () => {
      const original = { episode: 0, activePlayers: [], bonds: {}, episodeHistory: [] };
      prepGsForSave(original);
      const cloned = JSON.parse(JSON.stringify(original));
      repairGsSets(cloned);
      // missing Set fields are created as empty Sets, not left undefined
      ALL_SET_FIELDS.forEach(f => {
        expect(cloned[f], `${f} created empty`).toBeInstanceOf(Set);
        expect(cloned[f].size).toBe(0);
      });
    });
  });
});
