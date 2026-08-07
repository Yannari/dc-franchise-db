// Fan Pulse, per week rather than per season.
//
// The debug panel has had a week switcher the whole time. It was useless,
// because nothing in the house ever wrote a per-week popularity snapshot and
// snapshotGameState does not carry popularity either — so every week fell
// through the fallback chain to the LIVE score and eleven weeks drew the same
// board. The roster did the same thing, which is why week three used to list
// the final three and nobody else.
//
// Both halves are asserted here: that the data is stored, and that it actually
// differs from week to week. A snapshot that exists but never changes would
// pass a naive "is it defined" check and still be the bug.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i], stats: spread(i + 1),
}));

function playSeason() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = []; gs.episodeHistory = [];
  Object.assign(seasonConfig, { format: 'big-brother', romance: 'enabled',
    finaleSize: 3, jurySize: 7, twistSchedule: [] });
  for (let i = 0; i < 20; i++) {
    let ep = null;
    try { ep = simulateBBEpisode(); } catch { break; }
    if (!ep) break;
  }
  return (gs.episodeHistory || []).filter(e => e.format === 'big-brother');
}

describe('fan pulse per week', () => {
  it('records what the fans thought at the end of each week', () => {
    const history = playSeason();
    expect(history.length).toBeGreaterThan(5);
    for (const ep of history) {
      expect(ep.popularitySnapshot, `week ${ep.num} has no snapshot`).toBeTruthy();
    }
  });

  it('does not draw the same board every week', () => {
    const history = playSeason();
    const shapes = new Set(history.map(ep => JSON.stringify(ep.popularitySnapshot)));
    // Eleven copies of the live score was the bug. Distinct weeks, distinct
    // boards — allowing for the odd genuinely-identical quiet week.
    expect(shapes.size).toBeGreaterThan(history.length * 0.6);
  });

  it('keeps a snapshot frozen once it is written', () => {
    const history = playSeason();
    const early = history[1];
    const before = JSON.stringify(early.popularitySnapshot);
    // Whatever happens later in the season, week two's numbers are week two's.
    gs.popularity.Bowie = (gs.popularity.Bowie || 0) + 999;
    expect(JSON.stringify(early.popularitySnapshot)).toBe(before);
  });

  it('carries the roster that was in the house that week', () => {
    const history = playSeason();
    const early = history[1];
    const late = history[history.length - 1];
    const rosterOf = ep => ep.houseAtEnd || ep.houseAtStart || [];
    // The board is drawn from the episode's own roster, so an early week must
    // list more people than the endgame does — it used to show the final three
    // on every screen because it read the live roster.
    expect(rosterOf(early).length).toBeGreaterThan(rosterOf(late).length);
  });
});
