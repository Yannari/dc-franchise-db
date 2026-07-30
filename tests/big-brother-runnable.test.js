// Phase 1: a Big Brother season must be playable, not merely simulatable.
//
// The engine finished seasons in vitest for a week while being unreachable from
// the app — nothing dispatched it, and it took its event library as an argument
// that defaulted to empty, so even a dispatched season would have run in
// silence. These tests cover that gap specifically.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import {
  isBigBrotherSeason, simulateBBEpisode, weekToEpisode, summariseWeek,
  prepareHouse, houseIsAtFinale, houseFinaleSize,
} from '../js/bb-run.js';
import { HOUSE_EVENTS, assertUniqueEventIds } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

function reset(format = 'big-brother') {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.popularity = {};
  gs.showmances = [];
  gs.romanticSparks = [];
  seasonConfig.format = format;
  seasonConfig.finaleSize = 3;
  seasonConfig.romance = 'enabled';
}

describe('a Big Brother season can actually be played', () => {
  beforeEach(() => reset());

  it('knows which show it is running', () => {
    expect(isBigBrotherSeason()).toBe(true);
    reset('total-drama');
    expect(isBigBrotherSeason()).toBe(false);
  });

  it('declares the runnable flag the Show selector reads', () => {
    // Importing the module is what makes the format playable, so the selector
    // must stop warning that Run falls back to Total Drama.
    expect(window._bbRunnable).toBe(true);
  });

  it('registers every event exactly once', () => {
    expect(HOUSE_EVENTS.length).toBeGreaterThan(15);
    expect(assertUniqueEventIds()).toBe(true);
  });

  it('opens with a house rather than tribes', () => {
    prepareHouse();
    expect(gs.isMerged).toBe(true);
    expect(gs.mergeName).toBeTruthy();
  });

  it('runs one week, evicts somebody, and records it', () => {
    const before = gs.activePlayers.length;
    const ep = simulateBBEpisode();

    expect(ep).toBeTruthy();
    expect(ep.format).toBe('big-brother');
    expect(ep.eliminated).toBeTruthy();
    expect(gs.activePlayers).toHaveLength(before - 1);
    expect(gs.activePlayers).not.toContain(ep.eliminated);
    expect(gs.episodeHistory).toHaveLength(1);
    expect(gs.episodeHistory[0].num).toBe(ep.num);
  });

  // The bug this whole phase exists for: the house was silent because nothing
  // ever handed the engine its library.
  it('gives the engine its events, so the house is not silent', () => {
    const ep = simulateBBEpisode();
    const beats = (ep.acts || []).flatMap(a => a.socialBeats || []);
    expect(beats.length).toBeGreaterThan(0);
    for (const beat of beats) {
      expect(beat.text).toBeTruthy();
      expect(beat.badgeText).toBeTruthy();
    }
  });

  it('never fakes Total Drama structure onto a house', () => {
    const ep = simulateBBEpisode();
    expect(ep.challengeType).toBeNull();
    expect(ep.isMerge).toBe(false);
    expect(ep.tribesAtStart).toEqual([]);
    expect(ep.riChoice).toBeNull();
  });

  it('plays a whole season down to the finalists', () => {
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 40) {
      const ep = simulateBBEpisode();
      expect(ep, 'a week returned nothing before the finale').toBeTruthy();
    }
    expect(houseIsAtFinale()).toBe(true);
    expect(gs.activePlayers).toHaveLength(houseFinaleSize());
    expect(gs.episodeHistory.length).toBe(CAST.length - houseFinaleSize());
    // Everyone evicted exactly once, nobody twice.
    const evicted = gs.episodeHistory.map(e => e.eliminated);
    expect(new Set(evicted).size).toBe(evicted.length);
  });

  it('stops instead of evicting the finalists', () => {
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 40) simulateBBEpisode();
    expect(simulateBBEpisode()).toBeNull();
  });

  it('writes a readable transcript of the week', () => {
    const ep = simulateBBEpisode();
    const text = ep.summaryText;
    expect(text).toContain('HEAD OF HOUSEHOLD');
    expect(text).toContain('NOMINATION CEREMONY');
    expect(text).toContain('POWER OF VETO');
    expect(text).toContain('LIVE EVICTION');
    expect(text).toContain(ep.eliminated);
    // House life appears in the transcript too, not only in the visual player.
    expect(text).toMatch(/\[[A-Z ·']+\]/);
  });

  it('summarises a week with no acts without throwing', () => {
    expect(() => summariseWeek({ num: 1, acts: [] })).not.toThrow();
    expect(weekToEpisode({ num: 2 }).num).toBe(2);
  });
});
