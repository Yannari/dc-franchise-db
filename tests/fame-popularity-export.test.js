// tests/fame-popularity-export.test.js
// Popularity was live-only: gs.popularity never reached players_database.json,
// so "how the audience received you" — the biggest single input to fame — was
// unavailable to every page. Verified absent from a real Big Brother export
// before this was written.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { simulateBBFinale } from '../js/bb-finale.js';
import { buildBigBrotherSeasonDocument, mergeBigBrotherSeason } from '../js/stats-export.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

describe('popularity survives the export', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.episodeHistory = []; gs.jury = []; gs.jurorHistory = {};
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
    withSeededRandom(11, () => {
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 40) simulateBBEpisode();
      simulateBBFinale();
    });
  });

  it('writes each houseguest\'s popularity into their season detail', () => {
    const doc = buildBigBrotherSeasonDocument(1);
    const db = mergeBigBrotherSeason({ franchise: {}, players: [] }, doc);
    const rated = db.players.filter(p =>
      Number.isFinite(p.seasonDetails.find(d => d.format === 'big-brother')?.popularity));
    expect(rated.length, 'no popularity reached the career database').toBe(db.players.length);
  });

  it('records different numbers for different players', () => {
    // A constant would satisfy the test above and tell fame nothing.
    const doc = buildBigBrotherSeasonDocument(1);
    const db = mergeBigBrotherSeason({ franchise: {}, players: [] }, doc);
    const values = db.players.map(p =>
      p.seasonDetails.find(d => d.format === 'big-brother').popularity);
    expect(new Set(values).size, 'every player got the same popularity').toBeGreaterThan(1);
  });
});
