// The feed against a season actually being played.
//
// Everything under js/social is tested against data — fixtures, then the
// published season file. None of that proves the feature is REACHABLE, and this
// repo's most expensive bug class is code that is written, correct, and wired to
// nothing: a Big Brother export that no button called, five twists with no VP
// screen, an [AI_FILL] path nothing entered.
//
// So this plays a real house on the PLAYED path (simulateBBEpisode, the same
// call the run tab makes) and then calls refreshSocialFeed — the function the
// run tab and the sync button both call — with nothing stubbed in between. If
// the live game state and the published season document ever stop having the
// same shape, this fails and the fixture-driven tests do not.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { refreshSocialFeed, socialPublishPayload, currentFormat, currentSeasonNumber }
  from '../js/social/session.js';
import { postsForEpisode, storeOf } from '../js/social/store.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

/** Four weeks of a real house, played the way the run tab plays it. */
beforeAll(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.jury = []; gs.jurorHistory = {};
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, seasonNumber: 1 });

  withSeededRandom(21, () => {
    let guard = 0;
    while (gs.bb.weeks.length < 4 && !houseIsAtFinale() && guard++ < 20) simulateBBEpisode();
  });
});

describe('the season the simulator has open', () => {
  it('knows which show and season it is', () => {
    expect(currentFormat()).toBe('big-brother');
    expect(currentSeasonNumber()).toBe(1);
  });

  it('played a real house before any of this ran', () => {
    expect(gs.bb.weeks.length).toBeGreaterThanOrEqual(4);
    expect(gs.bb.weeks[0].evicted, 'nobody was evicted — the house did not play').toBeTruthy();
  });
});

describe('refreshing the feed', () => {
  it('gives every week played an audience', () => {
    // THE REACHABILITY TEST. A live gs.bb week is not the published week shape —
    // it is numbered `num` rather than `week` and carries far more besides. If
    // the extractor only ever understood the published file, this is empty.
    const { built } = refreshSocialFeed();
    expect(built.length, 'no week produced a feed from a played house')
      .toBe(gs.bb.weeks.length);
    expect(postsForEpisode(gs, 1).length).toBeGreaterThan(20);
  });

  it('reacts to what actually happened in the house', () => {
    refreshSocialFeed();
    const evicted = gs.bb.weeks[0].evicted.toLowerCase();
    const about = postsForEpisode(gs, 1).filter(p => p.subject === evicted);
    expect(about.length, `nobody said anything about ${evicted} going home`)
      .toBeGreaterThan(0);
  });

  it('adds nothing on a second call', () => {
    refreshSocialFeed();
    const before = storeOf(gs).posts.length;
    expect(refreshSocialFeed().built).toEqual([]);
    expect(storeOf(gs).posts.length).toBe(before);
  });

  it('survives a season it cannot read, rather than taking the episode with it', () => {
    // Called straight after "next episode". A feed that throws must never be
    // able to lose somebody the night they just played.
    const weeks = gs.bb.weeks;
    gs.bb.weeks = [{ get num() { throw new Error('boom'); } }];
    expect(() => refreshSocialFeed()).not.toThrow();
    gs.bb.weeks = weeks;
  });
});

describe('what gets sent to the site', () => {
  it('carries the whole season\'s feed, tagged with its show', () => {
    refreshSocialFeed();
    const payload = socialPublishPayload();
    expect(payload.format).toBe('big-brother');
    expect(payload.season).toBe(1);
    expect(payload.posts.length).toBeGreaterThan(100);
    // Every field the worker binds must be present, or the row lands short.
    const p = payload.posts[0];
    for (const field of ['id', 'episode', 'stream', 'text', 'at']) {
      expect(p[field], `posts are missing ${field}`).not.toBe(undefined);
    }
  });
});
