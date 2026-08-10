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
  themeState, themeModeConflicts, stampThemeArc, themeArcIsStamped } from '../js/bb/themes.js';
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

// ── the AI Instigator ───────────────────────────────────────────────────
//
// BB26's instigator was an audience-picked houseguest who spent a week framing
// the others while the house knew only that somebody was doing it. That is the
// Saboteur, which this game already has, so the theme turns the existing one on
// rather than building the same twist a second time.
//
// The capability that needed building was not a card: it was an arc being able
// to reach a SEASON KNOB at all. Without it the Instigator was a comment in a
// descriptor and nothing else.
describe('the theme turns on the season-long twist it needs', () => {
  beforeEach(() => house({ bbSaboteur: 'off' }));

  it('declares the Saboteur rather than a second saboteur', () => {
    expect(THEME().seasonKnobs?.bbSaboteur).toBe('random');
  });

  it('switches it on when the arc is stamped', () => {
    expect(seasonConfig.bbSaboteur).toBe('off');
    stampThemeArc(17);
    expect(seasonConfig.bbSaboteur).toBe('random');
    expect(Number(seasonConfig.bbSaboteurBankWeek)).toBe(6);
  });

  it('banks before CORA turns, so the season is not one quiet half and one loud one', () => {
    const weeks = 17 - 3;
    let turn = null;
    for (const a of THEME().arc) {
      if (!a.mood) continue;
      const w = resolveArcWeek(a.at, weeks);
      if (w >= 1 && w <= weeks) turn = turn === null ? w : Math.min(turn, w);
    }
    expect(Number(THEME().seasonKnobs.bbSaboteurBankWeek)).toBeLessThanOrEqual(turn);
  });

  // `stampThemeArc` IS the deliberate "lay the theme down" action — it is what
  // the picker and the reset link call — so re-applying the knob there is
  // correct. What protects a setting you changed is the stamp guard: a redraw
  // only stamps when nothing has been stamped yet.
  it('is re-applied by an explicit reset, which is what a reset means', () => {
    stampThemeArc(17);
    seasonConfig.bbSaboteur = 'off';
    stampThemeArc(17);
    expect(seasonConfig.bbSaboteur).toBe('random');
  });

  it('survives a redraw, because a redraw does not re-stamp', () => {
    stampThemeArc(17);
    seasonConfig.bbSaboteur = 'off';          // the user turns it back off
    // what renderTimeline does on every draw: stamp only if nothing is stamped
    if (!themeArcIsStamped()) stampThemeArc(17);
    expect(seasonConfig.bbSaboteur).toBe('off');
  });

  it('actually installs a saboteur in a played season', () => {
    stampThemeArc(17);
    withSeededRandom(11, () => simulateBBEpisode());
    expect(gs.bb.saboteur?.player, 'no saboteur was cast').toBeTruthy();
  });
});

// ── how the Deepfake reaches the house ──────────────────────────────────
//
// BB26 gave it away in the premiere's Upgrade Competition — pick a side blind,
// winners walk out with a power. The Whacktivity is that shape already, so the
// arc stocks its doors instead of a second competition being written to do the
// same job.
describe('CORA hands out the Deepfake', () => {
  beforeEach(() => house());

  it('stocks the week-two doors rather than taking the default three', () => {
    const whack = THEME().arc.find(a => a.book === 'bb-whacktivity');
    expect(whack?.options?.doors).toContain('deepfake-hoh');
    expect(whack.options.doors.length).toBe(3);
  });

  it('only stocks powers that exist', async () => {
    const { BB_POWER_DEFINITIONS } = await import('../js/bb/powers.js');
    for (const a of THEME().arc) {
      for (const id of a.options?.doors || []) {
        expect(BB_POWER_DEFINITIONS[id], `${id} is not a real power`).toBeTruthy();
      }
      if (a.options?.prize) {
        expect(BB_POWER_DEFINITIONS[a.options.prize], `${a.options.prize} is not a real power`).toBeTruthy();
      }
    }
  });

  it('carries the doors onto the stamped card, where you can change them', () => {
    stampThemeArc(17);
    const card = seasonConfig.twistSchedule.find(t => t.type === 'bb-whacktivity');
    expect(card, 'the Whacktivity was never booked').toBeTruthy();
    expect(card.doors).toContain('deepfake-hoh');
  });

  // The power runs four weeks from week two, so it expires around the turn:
  // spent while CORA is still helpful, or dead the week she stops.
  it('expires near the turn rather than outliving it', async () => {
    const { BB_POWER_DEFINITIONS } = await import('../js/bb/powers.js');
    const weeks = 17 - 3;
    let turn = null;
    for (const a of THEME().arc) {
      if (!a.mood) continue;
      const w = resolveArcWeek(a.at, weeks);
      if (w >= 1 && w <= weeks) turn = turn === null ? w : Math.min(turn, w);
    }
    const expires = 2 + BB_POWER_DEFINITIONS['deepfake-hoh'].windowWeeks;
    expect(Math.abs(expires - turn), 'the Deepfake outlives the turn by a long way')
      .toBeLessThanOrEqual(3);
  });
});
