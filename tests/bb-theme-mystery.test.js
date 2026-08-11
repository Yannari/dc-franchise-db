// A Summer of Mystery, played.
//
// The third theme, and the first whose endgame is an ARGUMENT rather than a
// list: the Mastermind states on the broadcast that he will take three people
// out so that three are left on finale night, and this arc has to make that
// arithmetic true at every cast size rather than at the one it was written for.
//
// So most of what is asserted here is counting. One eviction at a final nine
// plus two at a final seven is three sacrifices and a final five, and if either
// anchor drifts the theme is telling the audience a number it does not deliver.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setGs, TWIST_CATALOG,
  twistModeClashes, resolveTwistSchedule } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { BB_THEMES, currentTheme, themeScheduleEntries, stampThemeArc, installTheme,
  themeVoice, themeState, advanceThemeArc, reanchorThemeArc } from '../js/bb/themes.js';
import { BB_POWER_DEFINITIONS } from '../js/bb/powers.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Dave', 'Ella', 'Frank', 'Gina', 'Hal'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'perceptive-player', 'chaos-agent', 'challenge-beast', 'floater', 'hero'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

const THEME = () => BB_THEMES['summer-of-mystery'];

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme: 'summer-of-mystery' }, extra);
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
}

beforeEach(() => house());
afterEach(() => { setGs({ ...gs, bb: null }); });

describe('the theme is a theme the engine already knows how to run', () => {
  it('is registered and carries the four things a theme is', () => {
    const t = THEME();
    expect(t).toBeTruthy();
    expect(t.antagonist.name).toBe('The Mastermind');
    expect(t.arc.length).toBeGreaterThan(4);
    expect(t.palette.accent).toBeTruthy();
    // The default venue is never touched by a theme — the house stays the house.
    expect(t.house).toBe('bb-house');
    expect(Object.keys(t).some(k => k === 'setting')).toBe(false);
  });

  it('books only cards that exist', () => {
    for (const act of THEME().arc) {
      if (!act.book) continue;
      expect(TWIST_CATALOG.find(c => c.id === act.book), `${act.book} is not in the catalogue`)
        .toBeTruthy();
    }
  });

  it('asks for powers that are actually on the shelf', () => {
    // The three Week 2 powers are the real ones from the broadcast, and every
    // one of them was already built. If a rename ever orphans one, the door
    // opens on nothing and the week is silently poorer.
    const comp = THEME().arc.find(a => a.book === 'bb-secret-power-comp');
    expect(comp.options.doors).toEqual(['hoh-interrogation', 'mystery-competitor', 'mystery-veto']);
    for (const id of comp.options.doors) {
      expect(BB_POWER_DEFINITIONS[id], `${id} is not a registered power`).toBeTruthy();
    }
  });

  // The whole reason this theme is third: the user runs the Block Buster every
  // season, and BB27 is the season that ran it past the jury. A Summer of
  // Mystery that had to be turned off to keep it would be pointless here.
  it('survives the Block Buster, which is the season it was written for', () => {
    const cfg = { ...seasonConfig, bbSafetyMode: 'block-buster' };
    for (const act of THEME().arc) {
      if (!act.book) continue;
      const card = TWIST_CATALOG.find(c => c.id === act.book);
      expect(twistModeClashes(card, cfg), `${act.book} is refused under the Block Buster`)
        .toEqual([]);
      expect(resolveTwistSchedule([act.book], cfg)).toEqual([act.book]);
    }
  });
});

describe('the Month of Mayhem arithmetic', () => {
  it('takes three people, and leaves five', () => {
    // The claim the antagonist makes out loud. One at a final nine, two at a
    // final seven — three sacrifices, and a final five to play it out.
    const arc = THEME().arc.filter(a => a.book);
    const instant = arc.find(a => a.book === 'bb-white-locust');
    const double = arc.find(a => a.book === 'bb-double-eviction');
    expect(instant.at.fromEnd + 3).toBe(9);        // fromEnd n is a house of n+3
    expect(double.at.fromEnd + 3).toBe(7);
    const taken = 1 + 2;
    expect(taken).toBe(3);
    expect(7 - 2).toBe(5);
  });

  it('collects on the count at a final five, and stops there', () => {
    // The three sacrifices leave five, and the Sanctum is what he does with
    // them. Nothing after it — a device past the finale is an author who
    // cannot stop talking.
    const last = [...THEME().arc].filter(a => a.book).pop();
    expect(last.book).toBe('bb-sanctum-week');
    expect(last.at.fromEnd + 3).toBe(5);
    expect(THEME().arc.some(a => a.book && a.at?.fromEnd < 2)).toBe(false);
  });

  it('lands those anchors on the real house, not on a counted-back week', () => {
    stampThemeArc(17);
    const de = seasonConfig.twistSchedule.find(t => t.type === 'bb-double-eviction');
    const ie = seasonConfig.twistSchedule.find(t => t.type === 'bb-white-locust');
    expect(ie.atHouse).toBe(9);
    expect(de.atHouse).toBe(7);
    // A season that runs long must not fire them on the predicted week.
    expect(reanchorThemeArc(Number(ie.episode), 11)).toEqual([]);
    expect(reanchorThemeArc(Number(ie.episode) + 2, 9).map(e => e.type))
      .toEqual(['bb-white-locust']);
  });
});

describe('the arc at every cast this game casts', () => {
  for (const cast of [12, 14, 16, 17, 18, 20]) {
    it(`keeps its running order and fills the middle at ${cast}`, () => {
      const weeks = cast - 3;
      const entries = themeScheduleEntries(THEME(), { weeks });
      const eps = entries.map(e => Number(e.episode));
      // Chronological, and never two acts on one week.
      expect([...eps].sort((a, b) => a - b)).toEqual(eps);
      expect(new Set(eps).size).toBe(eps.length);
      // No nine-week silences in the middle — the failure the cadence exists
      // for, reported off a real timeline.
      const gaps = eps.slice(1).map((e, i) => e - eps[i]);
      if (cast >= 16) expect(Math.max(...gaps)).toBeLessThanOrEqual(3);
      expect(entries.length).toBeGreaterThanOrEqual(cast >= 16 ? 5 : 4);
    });
  }
});

describe('the Mastermind speaks', () => {
  beforeEach(() => {
    stampThemeArc(17);
    setGs({ ...gs, bb: { weeks: [], stats: {}, seasonSalt: 7 } });
    gs.activePlayers = [...NAMES];
    installTheme(NAMES.length);
  });

  it('has both registers on every hook, and never blanks one', () => {
    for (const hook of ['open', 'noms', 'veto', 'vote', 'finale', 'crown']) {
      for (const mood of ['neutral', 'hostile']) {
        const pool = THEME().antagonist.voice[hook][mood];
        expect(pool.length, `${hook}/${mood} is thin`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('refuses a line naming somebody who is not in the house', () => {
    themeState().mood = 'neutral';
    const said = themeVoice('noms', { week: 2, hoh: 'Bowie', nominees: ['Chase', 'Ghost'] });
    // Either a line that does not need the names, or nothing — never a taunt
    // aimed at a houseguest who is not there.
    if (said) expect(said.line).not.toContain('Ghost');
  });

  it('turns before the endgame it is announcing, at every cast', () => {
    for (const cast of [12, 14, 17, 20]) {
      setGs({ ...gs, bb: { weeks: [], stats: {}, seasonSalt: 3 } });
      seasonConfig.themeArcStamped = '';
      seasonConfig.twistSchedule = [];
      gs.activePlayers = NAMES.slice(0, cast);
      installTheme(cast);
      const weeks = cast - 3;
      let turned = null;
      for (let w = 1; w <= weeks; w++) {
        advanceThemeArc(w, weeks);
        if (!turned && themeState().mood === 'hostile') turned = w;
      }
      expect(turned, `never turned at ${cast}`).toBeTruthy();
      // The month has to start before the first sacrifice, or the antagonist
      // announces a takeover he has already begun.
      const firstSacrifice = weeks - 6 + 1;
      expect(turned, `turned after the first sacrifice at ${cast}`)
        .toBeLessThanOrEqual(firstSacrifice);
    }
  });
});

describe('a season that actually plays', () => {
  it('runs the arc, escalates, and reaches a final three', () => {
    house({ bbSafetyMode: 'block-buster' });
    stampThemeArc(NAMES.length);
    // The accomplice is a season knob the theme turns on rather than a card.
    expect(seasonConfig.bbSaboteur).toBe('random');
    expect(seasonConfig.bbSaboteurBankWeek).toBe(4);

    const fired = [];
    withSeededRandom(414, () => {
      for (let i = 0; i < 40; i++) {
        const before = (gs.activePlayers || []).length;
        const ep = simulateBBEpisode();
        if (!ep) break;
        for (const t of seasonConfig.twistSchedule || []) {
          if (t.source === 'theme' && Number(t.episode) === gs.episodeHistory.length) {
            fired.push({ type: t.type, house: before });
          }
        }
        if (gs.bb?.over) break;
      }
    });

    const at = type => fired.find(f => f.type === type);
    expect(at('bb-secret-power-comp'), 'the powers week never ran').toBeTruthy();
    expect(at('bb-hidden-power'), 'nothing was ever hidden in the house').toBeTruthy();
    // The two that carry the theme's stated promise.
    expect(at('bb-white-locust').house, 'the first sacrifice missed a final nine').toBe(9);
    expect(at('bb-double-eviction').house, 'the double missed a final seven').toBe(7);
    expect(themeState().mood, 'the Mastermind never took over').toBe('hostile');
  });
});
