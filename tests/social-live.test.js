// Keeping a season's feed in line with the season.
//
// The reconciler exists because there is no single place an episode is written:
// four push sites in episode.js, a separate Big Brother week ledger, and a
// replay path that rewinds the season and re-runs it. These tests cover the
// three things that go wrong when you hook those sites instead — a night with
// no reactions, a night with two sets of them, and reactions to a night that
// was replaced.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureFeeds, episodeRecords, feedSeed } from '../js/social/live.js';
import { postsForEpisode, storeOf } from '../js/social/store.js';

const season = JSON.parse(
  readFileSync(join(process.cwd(), 'data/seasons/bb-1-data.json'), 'utf8'));

/** A game state holding the Big Brother season that actually shipped. */
const playedHouse = (upTo = season.weeks.length) => ({
  bb: { weeks: season.weeks.slice(0, upTo).map(w => ({ ...w, num: w.week })) },
  popularity: {},
});

const bb = { format: 'big-brother', season: 1 };

describe('finding the episodes', () => {
  it('reads a Big Brother house from its week ledger', () => {
    expect(episodeRecords(playedHouse(3), 'big-brother').map(r => r.episode))
      .toEqual([1, 2, 3]);
  });

  it('reads a Total Drama season from its episode history', () => {
    const gs = { episodeHistory: [{ num: 1 }, { num: 2 }] };
    expect(episodeRecords(gs, 'total-drama').map(r => r.episode)).toEqual([1, 2]);
  });

  it('numbers an episode that never got one, rather than dropping it', () => {
    const gs = { episodeHistory: [{}, {}] };
    expect(episodeRecords(gs, 'total-drama').map(r => r.episode)).toEqual([1, 2]);
  });

  it('says nothing about a season that has not started', () => {
    expect(episodeRecords({}, 'big-brother')).toEqual([]);
    expect(episodeRecords(null, 'total-drama')).toEqual([]);
  });
});

describe('bringing the feed up to date', () => {
  it('writes a feed for every episode played so far', () => {
    const gs = playedHouse(3);
    const { built } = ensureFeeds(gs, bb);
    expect(built).toEqual([1, 2, 3]);
    expect(postsForEpisode(gs, 2).length).toBeGreaterThan(20);
  });

  it('costs nothing to call twice', () => {
    // The reconciler runs after every episode AND before every sync. If a second
    // call rebuilt the season, engagement accumulated on existing posts would be
    // thrown away each time — the counters would reset every time you pressed
    // sync, which reads as the feature not working.
    const gs = playedHouse(3);
    ensureFeeds(gs, bb);
    const before = storeOf(gs).posts.map(p => p.id + p.text);
    const { built } = ensureFeeds(gs, bb);
    expect(built).toEqual([]);
    expect(storeOf(gs).posts.map(p => p.id + p.text)).toEqual(before);
  });

  it('only writes the new night when one more episode is played', () => {
    const gs = playedHouse(3);
    ensureFeeds(gs, bb);
    gs.bb.weeks.push({ ...season.weeks[3], num: 4 });
    expect(ensureFeeds(gs, bb).built).toEqual([4]);
  });

  it('backfills a season that was played before the feed existed', () => {
    // The whole reason for reconciling: a house already fifteen weeks deep gets
    // its audience retroactively, instead of the feature starting to work only
    // for seasons begun after it shipped.
    const gs = playedHouse();
    const { built, posts } = ensureFeeds(gs, bb);
    expect(built).toHaveLength(season.weeks.length);
    expect(posts).toBeGreaterThan(1000);
  });
});

describe('a season that changes underneath it', () => {
  it('forgets the reactions to a night that was replaced', () => {
    // Replaying episode 2 rewinds the season: episode 3 stops existing. Its
    // posts must go with it, or the audience remembers an eviction that was
    // never aired.
    const gs = playedHouse(3);
    ensureFeeds(gs, bb);
    gs.bb.weeks = gs.bb.weeks.slice(0, 2);
    const { dropped } = ensureFeeds(gs, bb);
    expect(dropped).toEqual([3]);
    expect(postsForEpisode(gs, 3)).toEqual([]);
    expect(postsForEpisode(gs, 1).length).toBeGreaterThan(0);
  });

  it('rewrites a night that was re-run under the same number', () => {
    const gs = playedHouse(2);
    ensureFeeds(gs, bb);
    const before = postsForEpisode(gs, 2).length;
    gs.bb.weeks[1] = { ...gs.bb.weeks[1], evicted: 'Somebody Else', voteChanges: 9 };
    const { built } = ensureFeeds(gs, { ...bb, rebuild: true });
    expect(built).toEqual([1, 2]);
    const after = postsForEpisode(gs, 2);
    expect(after.some(p => p.subject === 'somebody-else')).toBe(true);
    expect(after.length).not.toBe(0);
    expect(before).toBeGreaterThan(0);
  });
});

describe('what the audience reacts to', () => {
  it('is the same feed every time it is rebuilt', () => {
    // A viewer reloading must not find the audience said different things about
    // a night they already watched.
    const a = playedHouse(2); ensureFeeds(a, bb);
    const b = playedHouse(2); ensureFeeds(b, bb);
    expect(storeOf(a).posts.map(p => p.text)).toEqual(storeOf(b).posts.map(p => p.text));
    expect(feedSeed(1, 2)).not.toBe(feedSeed(2, 1));   // and seasons do not collide
  });

  it('uses the real popularity the simulator has been writing all along', () => {
    const hated = playedHouse(2);
    hated.popularity = { [season.weeks[0].evicted || 'x']: -100, [season.weeks[0].hoh]: 100 };
    ensureFeeds(hated, bb);
    const plain = playedHouse(2);
    ensureFeeds(plain, bb);

    const eng = gs => storeOf(gs).posts.reduce((n, p) => n + p.likes + p.tomatoes, 0);
    expect(eng(hated)).not.toBe(eng(plain));
  });
});
