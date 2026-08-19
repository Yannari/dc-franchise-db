// The timeline's house-size projection has to agree with the engine.
//
// `buildEpisodeMap` predicts how many houseguests are left at the top of each
// episode, and every twist that takes MORE than one is listed there by name.
// The Camp Director was not, so a season that evicts twice on night one — Hit
// The Road before the first crown, then the ordinary vote — was projected as
// evicting once, and every house size below it was one too high for the rest
// of the season.
//
// Reported from a real 19-cast season: the timeline said eighteen were left at
// episode two when the engine had seventeen.
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const ROSTER = JSON.parse(readFileSync(resolve(process.cwd(), 'franchise_roster.json'), 'utf8'));
const POOL = (Array.isArray(ROSTER) ? ROSTER : ROSTER.players || Object.values(ROSTER)[0])
  .filter(p => p?.stats && p.name);
const castOf = n => Array.from({ length: n }, (_, i) => POOL[(i * 11 + 3) % POOL.length])
  .map(p => ({ name: p.name, archetype: p.archetype || 'floater', gender: p.gender || 'm',
    sexuality: p.sexuality || 'straight', stats: { ...p.stats } }));

function seat(n) {
  seedGame(castOf(n), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [{ id: 'cd-1', episode: 1, type: 'bb-camp-director' }];
}

describe('the Camp Director in the house-size projection', () => {
  beforeEach(() => seat(19));

  it('really does take two on night one, at the cast that was reported', () => {
    const before = gs.activePlayers.length;
    expect(before).toBe(19);
    withSeededRandom(4141, () => simulateBBEpisode());
    const week = gs.bb.weeks[gs.bb.weeks.length - 1];
    expect(week?.campDirector, 'the twist did not run at all').toBeTruthy();
    // Hit The Road took one before the crown; the vote took another.
    expect(week.campDirector.evicted).toBeTruthy();
    expect(week.evicted, 'the ordinary eviction did not happen').toBeTruthy();
    expect(week.evicted).not.toBe(week.campDirector.evicted);
    expect(gs.activePlayers.length, 'episode two does not start on seventeen').toBe(17);
    expect(gs.eliminated).toHaveLength(2);
  });

  it('stands down on a house too small, and then takes only one', () => {
    // `runCampDirector` refuses under eight, so the projection's guard has to
    // refuse there too or it is wrong in the other direction.
    seat(7);
    seasonConfig.finaleSize = 3;
    withSeededRandom(4141, () => simulateBBEpisode());
    const week = gs.bb.weeks[gs.bb.weeks.length - 1];
    expect(week?.campDirector, 'it ran on a house of seven').toBeFalsy();
    expect(gs.activePlayers.length, 'a stood-down twist still took two').toBe(6);
  });
});
