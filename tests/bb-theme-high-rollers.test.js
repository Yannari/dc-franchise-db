// The money, in a real week.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { balance } from '../js/bb/bb-bucks.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house({ theme = 'high-rollers' } = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme });
  seasonConfig.twistSchedule = [];
}

describe('the floor pays every week', () => {
  it('pays the house on a High Roller\'s season', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) >= 50)).toBe(true);
    });
  });

  it('pays nobody on a season running another theme', () => {
    withSeededRandom(7, () => {
      house({ theme: 'summer-of-mystery' });
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) === 0)).toBe(true);
    });
  });

  it('pays nobody on an unthemed season', () => {
    withSeededRandom(7, () => {
      house({ theme: 'none' });
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) === 0)).toBe(true);
    });
  });

  it('emits the act into the week', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const week = gs.bb.weeks[0];
      expect(week.acts.some(a => a.type === 'bb-bucks')).toBe(true);
    });
  });

  it('snapshots the ledger onto the week, so a replay shows that week\'s money', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const one = gs.bb.weeks[0].bucksLedger;
      simulateBBEpisode();
      const two = gs.bb.weeks[1].bucksLedger;
      expect(one.find(l => l.name === 'Bowie').balance)
        .toBeLessThan(two.find(l => l.name === 'Bowie').balance);
    });
  });

  it('carries the snapshot onto the episode', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      expect(Array.isArray(ep.bucksLedger)).toBe(true);
      expect(ep.bucksLedger.length).toBe(NAMES.length);
    });
  });
});
