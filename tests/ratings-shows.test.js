// ══════════════════════════════════════════════════════════════════════
// ratings-shows.test.js — four more shows' ratings read real signals
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors, The Challenge, Ridonculous Race and The Circle wrote none of
// what the vote, runway or villa readers look for, so every signal read zero and
// every season rated the same: The Circle measured 46.1 "Okay" on every seed
// (2026-10-22). Dramagram scales a cast's followers by that number, so each show
// now has its own reader (js/ratings-shows.js), and this asks each the same two
// questions pm-ratings.test.js asks the villa: does every signal sit inside the
// band CALIBRATION claims, and does it MOVE. Plus the one that caught the bug:
// do different seasons rate differently.
//
// Rows are built the way each show's run file builds them (challengeRows,
// raceRows, the Circle's own rows, the castle's episodeHistory), because a
// reader tested on a shape the app never writes measures nothing.
import { describe, expect, it } from 'vitest';
import roster from '../franchise_roster.json';
import { setPlayers, gs } from '../js/core.js';
import { SHOWS } from '../js/shows.js';
import { readSignals, ratingsForSeason, CALIBRATION } from '../js/ratings.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason as airChallenge } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { challengeCast } from './helpers/ch-cast.js';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason as airRace } from '../js/rr/episode.js';
import { raceRows } from '../js/rr-run.js';
import { raceCast } from './helpers/rr-cast.js';
import { playCircleSeason } from '../js/ci/season.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';
import { playTraitorsSeason } from '../js/tr/headless.js';

const SHOWS_UNDER_TEST = {
  traitors: {
    reader: 'castle',
    seasons: () => [[0, 11], [20, 12], [40, 13], [60, 14]].map(([off, seed]) => {
      globalThis.window ||= globalThis; window._trRunnable = true;
      const cast = roster.players.slice(off, off + 20); setPlayers(cast);
      playTraitorsSeason({ cast: cast.map(p => p.name), seed });
      return { rows: [...(gs.episodeHistory || [])], cast };
    }),
  },
  'the-challenge': {
    reader: 'challenge',
    // Two of the four with twists booked on the timeline: a plain season has
    // none, and the twist signal reads an honest zero on it.
    seasons: () => [611, 612, 613, 614].map(seed => {
      const { cast, names, background } = challengeCast(24, seed); setPlayers(cast);
      const res = playChallengeSeason({ cast: names, background, seed,
        options: seed % 2 ? { episodeTwists: { 3: 'double', 5: 'purge', 7: 'return' } } : {} });
      airChallenge(res.state);
      return { rows: challengeRows(res), cast };
    }),
  },
  'ridonculous-race': {
    reader: 'race',
    seasons: () => [[18, 8], [14, 21], [16, 5], [12, 11]].map(([n, seed]) => {
      const { cast, teams } = raceCast(n, seed); setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      return { rows: raceRows(res, airRace(res)), cast };
    }),
  },
  'the-circle': {
    reader: 'circle',
    seasons: () => [21, 22, 23, 24].map(seed => {
      const cast = makePlayers(13, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, seed), seed });
      return { rows, cast };
    }),
  },
};

// The two honest zeroes: a race and the Circle have no way back in.
const NEVER_MOVES = { 'ridonculous-race': ['returns'], 'the-circle': ['returns'], traitors: ['returns'] };

for (const [format, spec] of Object.entries(SHOWS_UNDER_TEST)) {
  describe(`${SHOWS[format].name} rates off its own rows`, () => {
    const seasons = spec.seasons();
    const seen = {};
    for (const { rows, cast } of seasons) {
      let prev = null;
      for (const row of rows) {
        prev = readSignals(row, prev, { format, players: cast });
        for (const k of Object.keys(CALIBRATION)) (seen[k] ||= []).push(prev[k]);
      }
    }
    const scores = seasons.map(({ rows, cast }) => ratingsForSeason(rows, { format, players: cast }).score);

    it('the registry names the reader', () => {
      expect(SHOWS[format].signals).toBe(spec.reader);
    });

    it('every signal stays in its band and moves', () => {
      for (const [key, vals] of Object.entries(seen)) {
        vals.sort((a, b) => a - b);
        expect(vals[0], `${key} below zero`).toBeGreaterThanOrEqual(0);
        expect(vals[vals.length - 1], `${key} above one`).toBeLessThanOrEqual(1);
        if ((NEVER_MOVES[format] || []).includes(key) || key === 'returns') continue;
        const [lo, hi] = CALIBRATION[key];
        const p90 = vals[Math.floor(vals.length * 0.9)];
        expect(p90, `${key}: p90 ${p90.toFixed(2)} never reaches its band`).toBeGreaterThan(lo + (hi - lo) * 0.15);
        const p50 = vals[Math.floor(vals.length * 0.5)];
        expect(p50, `${key}: p50 ${p50.toFixed(2)} is at the top of its band`).toBeLessThan(hi);
        expect(vals[vals.length - 1] - vals[0], `${key} never varied`).toBeGreaterThan(0.05);
      }
    });

    it('different seasons rate differently (one number for every season was the bug)', () => {
      expect(new Set(scores).size, `scores ${scores.join(' / ')}`).toBeGreaterThan(1);
      expect(Math.max(...scores) - Math.min(...scores), `scores ${scores.join(' / ')}`).toBeGreaterThan(1);
      for (const s of scores) expect(s).toBeGreaterThan(0);
    });
  });
}
