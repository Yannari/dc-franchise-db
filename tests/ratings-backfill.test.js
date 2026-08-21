// The backfill that puts a tier on seasons already played.
//
// The walk over IndexedDB is a thin wrapper; the judgement is all in
// `rateSave`, which is pure and is what this tests. What it has to get right
// is mostly refusals: a save with no season number, a save with no episodes,
// and the shape the seasons page reads back off the index.
import { describe, it, expect } from 'vitest';
import { rateSave, tierBadgeFor } from '../js/ratings-backfill.js';
import { TIERS } from '../js/ratings.js';

const HOUSE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function ep(n, format) {
  const gone = HOUSE[HOUSE.length - 1];
  return {
    num: n, format, houseAtStart: [...HOUSE], eliminated: gone,
    hoh: HOUSE[0], immunityWinner: HOUSE[0], twists: [], nominees: [],
    votingLog: HOUSE.slice(0, 5).map(v => ({ voter: v, voted: gone, changed: n % 2 === 0 })),
    acts: [{ type: 'house', beats: [{ badgeText: 'ALLIANCE' }, { badgeText: 'PRANK' }] }],
    campEvents: [], popularitySnapshot: {},
  };
}

const save = (over = {}) => ({
  name: 'My Season',
  config: { name: 'My Season', seasonNumber: 4, format: 'total-drama' },
  gs: { seasonNumber: 4, format: 'total-drama', phase: 'complete',
    finaleResult: { winner: 'A' },
    episodeHistory: [1, 2, 3, 4, 5].map(n => ep(n, 'total-drama')) },
  ...over,
});

describe('rating one saved season', () => {
  it('produces everything the badge reads', () => {
    const r = rateSave(save());
    expect(r.ok).toBe(true);
    expect(r.seasonId, 'a bare integer is Total Drama, permanently').toBe('td-4');
    expect(r.ratings.tier.label, 'the badge text').toBeTruthy();
    expect(r.ratings.tier.key, 'the badge colour class').toBeTruthy();
    expect(typeof r.ratings.score).toBe('number');
    expect(r.ratings.curve).toHaveLength(5);
    expect(r.ratings.complete).toBe(true);
    // and it survives the trip to disk and back
    expect(JSON.parse(JSON.stringify(r.ratings)).tier.key).toBe(r.ratings.tier.key);
  });

  it('gives a Big Brother save its own prefix', () => {
    const r = rateSave(save({
      config: { name: 'BB', seasonNumber: 2, format: 'big-brother' },
      gs: { seasonNumber: 2, format: 'big-brother', phase: 'complete',
        episodeHistory: [1, 2, 3].map(n => ep(n, 'big-brother')) },
    }));
    expect(r.seasonId).toBe('bb-2');
  });

  it('rates a season still being played, and says so', () => {
    const s = save();
    s.gs.phase = 'pre-merge';
    delete s.gs.finaleResult;
    const r = rateSave(s);
    expect(r.ok, 'the season you are in the middle of must not be the one with no tier').toBe(true);
    expect(r.complete).toBe(false);
    expect(r.ratings.throughEpisode).toBe(5);
  });

  it('refuses a save it cannot place, without taking the others down', () => {
    expect(rateSave({ name: 'empty', gs: { episodeHistory: [] } }).ok).toBe(false);
    const noNum = save();
    delete noNum.gs.seasonNumber;
    delete noNum.config.seasonNumber;
    const r = rateSave(noNum);
    expect(r.ok).toBe(false);
    expect(r.why, 'the refusal has to say which save and why').toMatch(/season number/i);
    expect(r.name).toBe('My Season');
  });

  it('reads a tier back off an index row', () => {
    const r = rateSave(save());
    const row = { seasonNumber: 4, seasonId: 'td-4', ratings: r.ratings };
    const badge = tierBadgeFor(row);
    expect(TIERS.some(t => t.key === badge.key), 'the badge is not a real tier').toBe(true);
    expect(tierBadgeFor({ seasonNumber: 9 }), 'an unrated season shows nothing').toBe(null);
  });
});
