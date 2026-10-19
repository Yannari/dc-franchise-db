// The race's fandom reaches the feed as the race (js/social/packs/ridonculous-race.js). Measured 2026-10-19 before
// the pack existed: the shared library, written for shows a room votes on, fed a race season posts about the veto,
// the jury and "this house" (20 such posts in one season), and the only events it found were evictions.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { raceRows } from '../js/rr-run.js';
import { extractEvents } from '../js/social/events.js';
import { buildEpisodeFeed } from '../js/social/feed.js';
import { episodeRecords, feedSeed } from '../js/social/live.js';
import { packFor } from '../js/social/packs/index.js';
import { RACE_FORMAT } from '../js/shows.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { raceCast } from './helpers/rr-cast.js';

const F = RACE_FORMAT;
const SEASONS = [7, 11].map(seed => {
  const { cast, teams } = raceCast(12, seed); setPlayers(cast);
  const res = playRaceSeason({ teams, seed });
  return { seed, state: { episodeHistory: raceRows(res, airSeason(res)) } };
});

describe('the race reaches the feed as the race', () => {
  it('has a pack, and reads every aired leg', () => {
    expect(packFor(F)).toBeTruthy();
    for (const { state } of SEASONS) expect(episodeRecords(state, F).length).toBe(state.episodeHistory.length);
  });

  it("produces the race's own moments, and none from a show with a vote", () => {
    const seen = new Set();
    for (const { state } of SEASONS) for (const rec of episodeRecords(state, F))
      for (const e of extractEvents(rec.record, { format: F, season: 1, episode: rec.episode }, packFor(F).context(state))) seen.add(e.kind);
    for (const k of ['leg-won', 'race-out', 'team-meltdown', 'race-sabotage', 'finale']) expect(seen.has(k), `no "${k}"`).toBe(true);
    for (const k of ['nomination', 'blindside', 'veto-used', 'eviction']) expect(seen.has(k), `a race produced a "${k}"`).toBe(false);
  });

  it("speaks the race's words: no house, no jury, no vote", () => {
    const bad = [];
    for (const { seed, state } of SEASONS) for (const rec of episodeRecords(state, F)) {
      const ev = extractEvents(rec.record, { format: F, season: 1, episode: rec.episode }, packFor(F).context(state));
      for (const p of buildEpisodeFeed(ev, { seed: feedSeed(1, rec.episode) })) {
        const text = [p.text, p.body, ...(p.replies || []).map(r => r.text)].filter(Boolean).join(' ');
        const foreign = foreignWordsIn(text.toLowerCase(), F);
        if (foreign.length) bad.push(`seed ${seed} leg ${rec.episode}: ${foreign.join(',')} | ${text.slice(0, 120)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
