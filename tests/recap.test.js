import { describe, it, expect, beforeEach } from 'vitest';
import { seedGs } from './helpers/setup.js';
import { gs } from '../js/core.js';
import {
  _scoreAtEp, _powerShiftEp,
  recapWinnerJourney, recapBlindsides, recapAlliances, recapRelationships,
  recapAvailable, buildSeasonRecap,
} from '../js/recap.js';

// A complete-season gs fixture with the fields the recap reads.
function completeSeason(overrides = {}) {
  seedGs({
    phase: 'complete',
    finaleResult: { winner: 'Alice', votes: { Alice: 5, Bob: 2 },
      reasoning: [{ juror: 'Carl', votedFor: 'Alice' }] },
    popularityArcs: {
      Alice: [{ ep: 1, delta: 1, score: 2 }, { ep: 3, delta: 3, score: 6 }, { ep: 5, delta: 2, score: 9 }],
      Bob:   [{ ep: 1, delta: 2, score: 4 }, { ep: 3, delta: -1, score: 3 }],
    },
    episodeHistory: [
      { num: 1, eliminated: 'Dana', immunityWinner: 'Alice', votingLog: [
        { voter: 'Alice', voted: 'Dana' }, { voter: 'Bob', voted: 'Dana' }, { voter: 'Dana', voted: 'Alice' }] },
      { num: 3, eliminated: 'Eve', immunityWinner: 'Bob', votingLog: [
        { voter: 'Alice', voted: 'Eve' }, { voter: 'Bob', voted: 'Eve' }, { voter: 'THE GAME', voted: 'Eve' }] },
      { num: 5, eliminated: 'Frank', immunityWinner: 'Alice', votingLog: [
        { voter: 'Alice', voted: 'Frank' }] },
    ],
    advantages: [{ holder: 'Frank', type: 'idol', foundEp: 2 }],
    namedAlliances: [
      { name: 'The Core', members: ['Alice', 'Bob', 'Carl'], formed: 1, active: true,
        betrayals: [{ player: 'Carl', ep: 4, votedFor: 'Bob', severity: 'major' }] },
      { name: 'Outsiders', members: ['Dana', 'Eve'], formed: 1, active: false, betrayals: [] },
    ],
    heroVillainRivalries: [{ hero: 'Alice', villain: 'Bob' }],
    showmances: [{ players: ['Alice', 'Carl'], broken: false, phase: 'showmance' }],
    ...overrides,
  });
}

describe('recap data layer', () => {
  beforeEach(() => completeSeason());

  describe('_scoreAtEp', () => {
    it('returns the most recent arc point at or before ep', () => {
      expect(_scoreAtEp(gs, 'Alice', 1)).toBe(2);
      expect(_scoreAtEp(gs, 'Alice', 2)).toBe(2); // carry forward
      expect(_scoreAtEp(gs, 'Alice', 5)).toBe(9);
    });
    it('returns 0 for unknown player or before any data', () => {
      expect(_scoreAtEp(gs, 'Nobody', 5)).toBe(0);
      expect(_scoreAtEp(gs, 'Alice', 0)).toBe(0);
    });
  });

  describe('_powerShiftEp', () => {
    it('finds the episode the lead changed hands', () => {
      // ep1: Bob 4 > Alice 2 (Bob leads). ep3: Alice 6 > Bob 3 (lead flips to Alice).
      const shift = _powerShiftEp(gs);
      expect(shift).toEqual({ ep: 3, from: 'Bob', to: 'Alice' });
    });
    it('returns null with fewer than two tracked players', () => {
      seedGs({ popularityArcs: { Alice: [{ ep: 1, score: 2 }] } });
      expect(_powerShiftEp(gs)).toBeNull();
    });
  });

  describe('recapWinnerJourney', () => {
    it('builds the winner arc + immunity count + jury vote', () => {
      const w = recapWinnerJourney(gs);
      expect(w.winner).toBe('Alice');
      expect(w.arc).toEqual([{ ep: 1, score: 2 }, { ep: 3, score: 6 }, { ep: 5, score: 9 }]);
      expect(w.immunityWins).toBe(2); // ep1 + ep5
      expect(w.juryVote).toEqual({ Alice: 5, Bob: 2 });
    });
    it('returns null when there is no winner', () => {
      seedGs({ phase: 'merge', finaleResult: null });
      expect(recapWinnerJourney(gs)).toBeNull();
    });
  });

  describe('recapBlindsides', () => {
    it('ranks the idol-holder boot highest and excludes THE GAME votes', () => {
      const b = recapBlindsides(gs);
      expect(b.length).toBeGreaterThan(0);
      expect(b[0].booted).toBe('Frank');         // held an unplayed idol → top upset
      expect(b[0].heldAdvantage).toBe(true);
      const eve = b.find(x => x.booted === 'Eve');
      expect(eve.totalVoters).toBe(2);            // THE GAME filtered out
    });
    it('returns at most 3', () => {
      expect(recapBlindsides(gs).length).toBeLessThanOrEqual(3);
    });
  });

  describe('recapAlliances', () => {
    it('lists alliances, picks the dominant one, and normalizes betrayals', () => {
      const a = recapAlliances(gs);
      expect(a.alliances).toHaveLength(2);
      expect(a.dominant.name).toBe('The Core'); // 3 members > 2
      expect(a.alliances[0].betrayals[0]).toEqual({ player: 'Carl', ep: 4, severity: 'major' });
    });
  });

  describe('recapRelationships', () => {
    it('maps rivalries and dedupes showmances', () => {
      const r = recapRelationships(gs);
      expect(r.rivalries).toEqual([{ a: 'Alice', b: 'Bob', kind: 'hero-villain' }]);
      expect(r.showmances).toEqual([{ players: ['Alice', 'Carl'], broken: false, phase: 'showmance' }]);
    });
    it('dedupes the same pair regardless of order', () => {
      seedGs({ showmances: [
        { players: ['Alice', 'Carl'], broken: false },
        { players: ['Carl', 'Alice'], broken: true },
      ] });
      expect(recapRelationships(gs).showmances).toHaveLength(1);
    });
  });

  describe('recapAvailable / buildSeasonRecap', () => {
    it('available only when complete with a winner', () => {
      expect(recapAvailable(gs)).toBe(true);
      seedGs({ phase: 'merge', finaleResult: null });
      expect(recapAvailable(gs)).toBe(false);
    });
    it('buildSeasonRecap bundles all beats on a complete season', () => {
      const r2 = buildSeasonRecap(gs);
      expect(r2.winner.winner).toBe('Alice');
      expect(r2.blindsides.length).toBeGreaterThan(0);
      expect(r2.alliances.alliances).toHaveLength(2);
      expect(r2.relationships.rivalries).toHaveLength(1);
    });
    it('buildSeasonRecap returns null when unavailable', () => {
      seedGs({ phase: 'merge', finaleResult: null });
      expect(buildSeasonRecap(gs)).toBeNull();
    });
  });
});
