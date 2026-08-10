// The Machine Summer.
//
// The second theme, and the first one that had to prove the engine works for
// somebody other than the theme it was built alongside. Everything structural
// here — the cadence, the proportional turn, the endgame anchored to house
// size, the finale hooks, the mood on the reader — was written for Summer of
// Temptation. If CORA needs any of it changed, the engine was never an engine.
//
// The other thing this pins is the reason CORA exists at all: the Block Buster
// IS the AI Arena under a different name, so a Machine Summer that could not
// run beside it would be a joke at its own expense.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG,
  twistModeClashes, resolveTwistSchedule } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { BB_THEMES, themeScheduleEntries, resolveArcWeek, expandArc,
  themeState, themeModeConflicts } from '../js/bb/themes.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const THEME = () => BB_THEMES['machine-summer'];
const NAMES = Array.from({ length: 17 }, (_, i) => 'H' + (i + 1));
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer',
    'schemer', 'floater', 'villain', 'loyal-soldier'][i % 8],
}));

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9,
    bbHaveNots: 'off', bbSafetyMode: 'block-buster', theme: 'machine-summer' }, extra);
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
}

const CASTS = [12, 14, 16, 17, 18, 19, 20];

describe('the Machine Summer runs on a Block Buster season', () => {
  beforeEach(() => house());

  // The reason this theme was built for this user's seasons at all.
  it('books nothing the Block Buster refuses', () => {
    const on = { format: 'big-brother', bbSafetyMode: 'block-buster' };
    const booked = [...new Set(expandArc(THEME().arc, 14).filter(a => a.book).map(a => a.book))];
    expect(booked.length).toBeGreaterThan(3);
    for (const id of booked) {
      const card = TWIST_CATALOG.find(c => c.id === id);
      expect(card, `${id} is not in the catalog`).toBeTruthy();
      expect(twistModeClashes(card, on), `${id} clashes with the Block Buster`).toEqual([]);
      expect(resolveTwistSchedule([id], on), `${id} is dropped at scheduling`).toEqual([id]);
    }
  });

  it('reports no mode conflict, so the picker stays quiet', () => {
    expect(themeModeConflicts(seasonConfig)).toEqual({ modes: [], cards: [] });
  });
});

describe('its arc holds shape at every cast size', () => {
  beforeEach(() => house());

  it.each(CASTS)('cast %i: one booking a week, in the authored order', size => {
    const weeks = size - 3;
    const out = themeScheduleEntries(THEME(), { weeks, existing: [] });
    const byWeek = out.map(e => Number(e.episode));

    expect(new Set(byWeek).size, `two acts share a week: ${byWeek}`).toBe(byWeek.length);
    for (const [i, ep] of byWeek.entries()) {
      expect(ep).toBeGreaterThanOrEqual(1);
      expect(ep).toBeLessThanOrEqual(weeks);
      if (i) expect(ep, 'the arc ran backwards').toBeGreaterThan(byWeek[i - 1]);
    }

    // A prefix-preserving subsequence of the authored running order: acts may
    // be dropped on a season with no room for them, never reordered.
    const ORDER = expandArc(THEME().arc, weeks).filter(a => a.book).map(a => a.book);
    let at = 0;
    for (const type of out.map(e => e.type)) {
      const found = ORDER.indexOf(type, at);
      expect(found, `${type} arrived out of order at cast ${size}`).toBeGreaterThanOrEqual(0);
      at = found + 1;
    }
  });

  // The failure the cadence exists to prevent: a fixed list of acts leaves a
  // long season empty through the middle. Reported off a real timeline before
  // the engine could recur an act at all.
  it.each(CASTS)('cast %i: never goes quiet for more than three weeks', size => {
    const weeks = size - 3;
    const eps = themeScheduleEntries(THEME(), { weeks, existing: [] }).map(e => Number(e.episode));
    let worst = 0, run = 0;
    for (let w = 1; w <= weeks; w++) { if (eps.includes(w)) run = 0; else worst = Math.max(worst, ++run); }
    expect(worst, `a ${weeks}-week season is empty for ${worst} in a row`).toBeLessThanOrEqual(3);
  });

  it.each(CASTS)('cast %i: turns before its own endgame', size => {
    const weeks = size - 3;
    let turn = null;
    for (const a of THEME().arc) {
      if (!a.mood) continue;
      const w = resolveArcWeek(a.at, weeks);
      if (w >= 1 && w <= weeks) turn = turn === null ? w : Math.min(turn, w);
    }
    expect(turn, 'the theme never hardens').toBeTruthy();
    const firstEndgame = themeScheduleEntries(THEME(), { weeks, existing: [] })
      .map(e => Number(e.episode))
      .find(ep => ep >= weeks - 4);
    if (firstEndgame) {
      expect(turn, 'CORA hardened after the endgame had already begun')
        .toBeLessThanOrEqual(firstEndgame);
    }
  });

  it('ends at a final five, and books nothing at the finale', () => {
    const last = [...THEME().arc].filter(a => a.book).pop();
    expect(last.at?.fromEnd).toBe(2);
    expect(THEME().arc.some(a => a.book && a.at?.fromEnd === 1)).toBe(false);
  });
});

describe('CORA speaks', () => {
  beforeEach(() => house());

  it('declares all six hooks, in both registers, with room to vary', () => {
    const voice = THEME().antagonist.voice;
    for (const hook of ['open', 'noms', 'veto', 'vote', 'finale', 'crown']) {
      expect(voice[hook], `${hook} is missing`).toBeTruthy();
      for (const mood of ['neutral', 'hostile']) {
        expect(voice[hook][mood]?.length, `${hook}/${mood} has too few variants`)
          .toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('never repeats a line inside one hook and mood', () => {
    const voice = THEME().antagonist.voice;
    for (const hook of Object.keys(voice)) {
      for (const mood of Object.keys(voice[hook])) {
        const pool = voice[hook][mood];
        expect(new Set(pool).size, `${hook}/${mood} repeats itself`).toBe(pool.length);
      }
    }
  });

  it('turns partway through a played season and stays turned', () => {
    withSeededRandom(2026, () => {
      let n = 0;
      while ((gs.activePlayers || []).length > 3 && n < 20) { if (!simulateBBEpisode()) break; n++; }
      runBBFinale();
    });
    const moods = gs.episodeHistory.map(e => e.themeMood);
    expect(moods[0]).toBe('neutral');
    expect(moods[moods.length - 1]).toBe('hostile');
    // one turn, not a flicker
    const flips = moods.filter((m, i) => i && m !== moods[i - 1]).length;
    expect(flips, 'the mood changed more than once').toBe(1);
  });

  it('is there on the last night, which the weekly hooks never reach', () => {
    withSeededRandom(2026, () => {
      let n = 0;
      while ((gs.activePlayers || []).length > 3 && n < 20) { if (!simulateBBEpisode()) break; n++; }
      runBBFinale();
    });
    const fin = gs.episodeHistory[gs.episodeHistory.length - 1];
    const hooks = (fin.acts || []).filter(a => a.type === 'theme-beat').map(a => a.hook);
    expect(hooks).toContain('finale');
    expect(hooks).toContain('crown');
    expect(fin.themeMood, 'the finale dropped out of the escalated room').toBe('hostile');
  });

  it('installs and books its arc for real', () => {
    withSeededRandom(7, () => simulateBBEpisode());
    expect(themeState().id).toBe('machine-summer');
    expect(themeState().booked).toContain('bb-whacktivity');
    expect(themeState().booked).toContain('bb-invisible-hoh');
  });
});
