// How often do houseguests actually get together?
//
// Two opposite failures, and the same test catches both.
//
// The played house was producing six and a half showmances a season, in every
// season, with pairs forming off a bond threshold alone and no scene behind
// them. Meanwhile a headless season measured zero, because simulateBBSeason()
// skipped the setup that gives the house an array for `gs.tribes` and the whole
// shared pipeline died on `gs.tribes.some(...)` — thrown, caught, discarded. So
// the format looked romance-less to anybody measuring it and romance-saturated
// to anybody watching it, which is how it stayed wrong in both directions.
//
// Unit tests saw neither. Each function worked when called directly; what was
// wrong was the volume in one path and the shape of the world in the other. So
// this plays whole seasons and counts, and it counts `gs.showmances` rather
// than sparks or badges — a spark is not a couple, and the badge used to say
// it was.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Wayne', 'Raj'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'chaos-agent', 'hero'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: i % 6 === 0 ? 'bi' : 'straight', archetype: ARCH[i],
}));

function playSeason() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal,
    getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'every-week', bbDepartures: 'off', romance: 'enabled',
    setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
  let guard = 0;
  while (!houseIsAtFinale() && guard++ < 20) { if (!simulateBBEpisode()) break; }
  return {
    showmances: [...(gs.showmances || [])],
    sparks: [...(gs.romanticSparks || [])],
    failures: [...(gs.bb?.romanceFailures || [])],
  };
}

// The pipeline is not seeded — romance.js rolls Math.random directly — so every
// assertion here is a range over many seasons rather than an exact count.
const SEASONS = 12;
const runs = Array.from({ length: SEASONS }, () => playSeason());
const total = runs.reduce((sum, run) => sum + run.showmances.length, 0);

describe('the house reaches a showmance', () => {
  it('forms real couples, not just sparks', () => {
    // Zero is what a broken pipeline looks like from the outside.
    expect(total).toBeGreaterThan(0);
    // And most seasons should manage at least one. A house of fourteen over
    // eleven weeks that never once pairs anybody off is the old bug wearing a
    // smaller number.
    const seasonsWithOne = runs.filter(run => run.showmances.length > 0).length;
    expect(seasonsWithOne).toBeGreaterThanOrEqual(Math.ceil(SEASONS * 0.5));
  });

  it('does not turn the house into a dating show', () => {
    // The failure that was actually shipping: 6.5 a season, up to nine, every
    // season. The no-spark route at bond >= 6 fires constantly in a house,
    // because a house runs far hotter than the beach that threshold was set for
    // — a quarter of all pairs finish above it.
    const perSeason = total / SEASONS;
    expect(perSeason).toBeLessThan(4.5);
  });

  it('grows couples out of sparks rather than out of nowhere', () => {
    // A pairing with no scene behind it reads as arbitrary. The spark-fed routes
    // should dominate the cold bond-threshold one.
    const all = runs.flatMap(run => run.showmances);
    const cold = all.filter(showmance => showmance.origin === 'camp-organic').length;
    expect(cold).toBeLessThan(all.length * 0.5);
  });

  it('runs the whole pipeline without swallowing an error', () => {
    // The handler around the romance pipeline records what it catches instead of
    // discarding it. Anything in here means a stage is dying silently again.
    const failures = runs.flatMap(run => run.failures);
    expect(failures).toEqual([]);
  });

  it('runs the same pipeline from the headless entry point', () => {
    // simulateBBSeason() is what every probe and most tests call, and it used to
    // skip prepareHouse() and therefore hand the romance pipeline a `gs.tribes`
    // it could not read. A measurement path that silently disagrees with the
    // played game is worse than no measurement path.
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(seasonConfig, { format: 'big-brother', romance: 'enabled', setting: 'bb-house' });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.showmances = []; gs.romanticSparks = []; gs.tribes = {}; gs.isMerged = undefined;
    simulateBBSeason({ finaleSize: 3 });
    expect(gs.bb.romanceFailures || []).toEqual([]);
    expect(Array.isArray(gs.tribes)).toBe(true);
  });

  it('clears sparks that went nowhere', () => {
    // Sparks accumulating forever was the symptom that gave the bug away: the
    // culling step sits after the line that was throwing.
    const stranded = runs.reduce((sum, run) => sum + run.sparks.length, 0) / SEASONS;
    expect(stranded).toBeLessThan(4);
  });
});
