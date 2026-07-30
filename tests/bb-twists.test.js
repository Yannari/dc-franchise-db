import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { BB_TWIST_CATALOG, getBBTwist, simulateDoubleEviction } from '../js/bb/bb-twists.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  ['A', 'mastermind'], ['B', 'social-butterfly'], ['C', 'challenge-beast'], ['D', 'schemer'],
  ['E', 'hero'], ['F', 'floater'], ['G', 'villain'], ['H', 'loyal-soldier'],
].map(([name, archetype]) => ({ name, archetype }));

function seededRng(seed = 91) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

describe('Big Brother twist catalog', () => {
  beforeEach(() => seedGame(CAST, { episode: 4, eliminated: [], namedAlliances: [] }));

  it('is format-scoped and advertises only implemented twists as implemented', () => {
    expect(BB_TWIST_CATALOG.every(twist => twist.format === 'big-brother')).toBe(true);
    expect(getBBTwist('double-eviction')).toMatchObject({ implemented: true });
    expect(BB_TWIST_CATALOG.filter(twist => twist.implemented).map(twist => twist.id))
      .toEqual(['double-eviction']);
    expect(getBBTwist('not-real')).toBeNull();
  });

  it('runs two complete boots while advancing one episode', () => {
    const result = simulateDoubleEviction({ rng: seededRng() });
    expect(result.weeks).toHaveLength(2);
    expect(result.evicted).toHaveLength(2);
    expect(new Set(result.evicted).size).toBe(2);
    expect(result.weeks.every(week => week.acts.length >= 6)).toBe(true);
    expect(gs.activePlayers).toHaveLength(6);
    expect(gs.eliminated).toEqual(expect.arrayContaining(result.evicted));
    expect(gs.episode).toBe(5);
    expect(gs.bb.weeks).toHaveLength(2);
  });

  it('marks only the second week as compressed live-show beats', () => {
    const result = simulateDoubleEviction({ rng: seededRng(12) });
    expect(result.weeks[0].compressed).not.toBe(true);
    expect(result.weeks[1]).toMatchObject({ compressed: true, twist: 'double-eviction' });
    expect(result.weeks[1].acts.map(act => act.liveShowBeat)).toEqual(result.weeks[1].acts.map((_, index) => index + 1));
    expect(result.weeks[1].acts.every(act => act.compressed)).toBe(true);
  });

  it('exercises all seven settled interception points during the compressed week', () => {
    const result = simulateDoubleEviction({ rng: seededRng(4) });
    expect(result.hookAudit).toEqual(expect.arrayContaining([
      'hohResult', 'nominationResult', 'vetoParticipants', 'vetoOutcome',
      'replacementChoice', 'voteEligibility', 'evictionResult',
    ]));
  });

  it('tracks final-block appearances separately from nomination ceremonies', () => {
    const result = simulateDoubleEviction({ rng: seededRng(37) });
    for (const week of result.weeks) {
      for (const nominee of week.finalNominees) {
        expect(gs.bb.stats[nominee].timesOnTheBlock).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
