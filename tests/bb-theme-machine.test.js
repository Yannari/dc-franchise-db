// The Machine Summer: Big Brother 26, 1:1 (user, 2026-10-24).
//
// Pins BB26's running order, from the wiki: the seventeenth-houseguest test on
// night one (Upgrades for the yes-voters, Mascots for the no-voters), the AI
// Arena (the engine's Block Buster) until ten remain, the AI Instigator voted in
// by America for week six, JANKIE World at a final eight, and Evil AINSLEY's
// double eviction at a final seven.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG,
  twistModeClashes, resolveTwistSchedule } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { BB_THEMES, themeScheduleEntries, resolveArcWeek, expandArc,
  themeState, themeModeConflicts, stampThemeArc, themeArcIsStamped } from '../js/bb/themes.js';
import { BB_POWER_DEFINITIONS } from '../js/bb/powers.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const THEME = () => BB_THEMES['machine-summer'];
const NAMES = Array.from({ length: 16 }, (_, i) => 'H' + (i + 1));
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer',
    'schemer', 'floater', 'villain', 'loyal-soldier'][i % 8],
}));

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'block-buster', theme: 'machine-summer', bbSaboteur: 'off' }, extra);
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
}

const CASTS = [12, 14, 16, 17, 18, 19, 20];

describe('the Machine Summer runs on the AI Arena', () => {
  beforeEach(() => house());

  it('books nothing the AI Arena (the Block Buster) refuses', () => {
    const on = { format: 'big-brother', bbSafetyMode: 'block-buster' };
    const booked = [...new Set(expandArc(THEME().arc, 13).filter(a => a.book).map(a => a.book))];
    expect(booked).toEqual(['bb-machine-premiere', 'bb-jankie-world', 'bb-double-eviction']);
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

  it('runs the AI Arena until ten remain, as BB26 did through week seven', () => {
    expect(THEME().seasonKnobs.bbSafetyMode).toBe('block-buster');
    expect(THEME().seasonKnobs.bbSafetyStopsAt).toBe(9);
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
    expect(out.map(e => e.type)).toEqual(['bb-machine-premiere', 'bb-jankie-world', 'bb-double-eviction']);
  });

  it.each(CASTS)('cast %i: AINSLEY turns evil on the week of her double', size => {
    const weeks = size - 3;
    const turn = THEME().arc.filter(a => a.mood === 'hostile').map(a => resolveArcWeek(a.at, weeks));
    const dbl = themeScheduleEntries(THEME(), { weeks, existing: [] }).find(e => e.type === 'bb-double-eviction');
    expect(turn).toEqual([Number(dbl.episode)]);
  });

  it('puts JANKIE World at a final eight and the double at a final seven', () => {
    const jw = THEME().arc.find(a => a.book === 'bb-jankie-world');
    const de = THEME().arc.find(a => a.book === 'bb-double-eviction');
    expect(jw.at.fromEnd + 3).toBe(8);
    expect(de.at.fromEnd + 3).toBe(7);
    expect(THEME().arc.some(a => a.book && a.at?.fromEnd === 1)).toBe(false);
  });
});

describe('AINSLEY speaks', () => {
  beforeEach(() => house());

  it('declares all six hooks, in both registers, with room to vary', () => {
    const voice = THEME().antagonist.voice;
    expect(THEME().antagonist.name).toBe('AINSLEY');
    for (const hook of ['open', 'noms', 'veto', 'vote', 'finale', 'crown']) {
      expect(voice[hook], `${hook} is missing`).toBeTruthy();
      for (const mood of ['neutral', 'hostile']) {
        expect(voice[hook][mood]?.length, `${hook}/${mood} has too few variants`).toBeGreaterThanOrEqual(4);
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

  it('turns once in a played season, and is there on the last night', () => {
    withSeededRandom(2026, () => {
      let n = 0;
      while ((gs.activePlayers || []).length > 3 && n < 20) { if (!simulateBBEpisode()) break; n++; }
      runBBFinale();
    });
    const moods = gs.episodeHistory.map(e => e.themeMood);
    expect(moods[0]).toBe('neutral');
    expect(moods[moods.length - 1]).toBe('hostile');
    expect(moods.filter((m, i) => i && m !== moods[i - 1]).length, 'the mood changed more than once').toBe(1);
    const fin = gs.episodeHistory[gs.episodeHistory.length - 1];
    const hooks = (fin.acts || []).filter(a => a.type === 'theme-beat').map(a => a.hook);
    expect(hooks).toContain('finale');
    expect(hooks).toContain('crown');
  });
});

describe('night one: the seventeenth houseguest', () => {
  beforeEach(() => house());

  it('hands the yes-voters their Upgrades and makes the no-voters Mascots', () => {
    const ep = withSeededRandom(7, () => simulateBBEpisode());
    expect(themeState().booked).toContain('bb-machine-premiere');
    const act = (ep.acts || []).find(a => a.type === 'machine-premiere');
    expect(act, 'the premiere never ran').toBeTruthy();
    expect(act.yes + act.no).toBe(16);
    for (const u of act.upgrades.filter(x => x.winner)) {
      expect(act.votes[u.winner]).toBe('yes');
      expect(['americas-veto', 'deepfake-hoh']).toContain(u.power);
    }
    for (const n of act.mascots) expect(act.votes[n]).toBe('no');
    // a Mascot plays for nothing and votes for nobody
    const hoh = (ep.acts || []).find(a => a.type === 'hoh');
    for (const n of act.mascots) {
      expect(hoh.competition?.participants || [], `${n} played for HOH`).not.toContain(n);
      expect(Object.keys(ep.votes || {}), `${n} voted`).not.toContain(n);
    }
  });

  it('gives both Upgrades four weeks, as the show did', () => {
    expect(BB_POWER_DEFINITIONS['americas-veto'].windowWeeks).toBe(4);
    expect(BB_POWER_DEFINITIONS['deepfake-hoh'].windowWeeks).toBe(4);
  });
});

describe('the AI Instigator', () => {
  beforeEach(() => house());

  it('is the Saboteur, voted in by America for week six and paid at the end of it', () => {
    expect(THEME().seasonKnobs).toMatchObject({ bbSaboteur: 'instigator', bbSaboteurStartWeek: 6, bbSaboteurBankWeek: 7 });
  });

  it('is switched on when the arc is stamped, and survives a redraw', () => {
    stampThemeArc(16);
    expect(seasonConfig.bbSaboteur).toBe('instigator');
    seasonConfig.bbSaboteur = 'off';
    if (!themeArcIsStamped()) stampThemeArc(16);
    expect(seasonConfig.bbSaboteur).toBe('off');
  });

  it('is not cast before week six', () => {
    stampThemeArc(16);
    withSeededRandom(11, () => { for (let w = 0; w < 5; w++) simulateBBEpisode(); });
    expect(gs.bb.saboteur, 'cast before America voted').toBeFalsy();
    withSeededRandom(12, () => simulateBBEpisode());
    expect(gs.bb.saboteur?.player, 'no Instigator in week six').toBeTruthy();
    expect(gs.bb.saboteur.instigator).toBe(true);
    expect(gs.bb.saboteur.prize).toBe(20000);
  });
});
