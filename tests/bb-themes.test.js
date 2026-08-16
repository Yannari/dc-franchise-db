// The theme engine.
//
// A theme is a season author: it decides what the house looks like, who is
// taunting the houseguests, and which twists arrive in which week. The tests
// that matter are the ones that stop a theme from lying — booking a twist that
// does not exist, binding to a venue the format does not have, or naming a
// houseguest who is not in the house.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { seasonConfig, TWIST_CATALOG } from '../js/core.js';
import { settingsForFormat } from '../js/settings.js';
import { BB_THEMES, THEME_LIST, themeById, currentTheme, themeAccent } from '../js/bb/themes.js';

describe('theme registry', () => {
  beforeEach(() => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'none';
  });

  // THEME_LIST is a snapshot of the ids at module load. Later describes in
  // this file push test-only descriptors straight into BB_THEMES, so assert
  // what the list must CONTAIN rather than that it equals the live object.
  it('lists every registered theme', () => {
    expect(THEME_LIST.length).toBeGreaterThan(0);
    expect(THEME_LIST).toContain('summer-of-temptation');
    for (const id of THEME_LIST) expect(BB_THEMES[id]).toBeTruthy();
  });

  it('binds every theme to a house the format actually has', () => {
    const houses = settingsForFormat('big-brother');
    for (const id of THEME_LIST) {
      expect(houses, `${id} binds to a real house`).toContain(BB_THEMES[id].house);
    }
  });

  it('only books twists that exist in the catalog', () => {
    const ids = new Set(TWIST_CATALOG.map(c => c.id));
    for (const id of THEME_LIST) {
      for (const act of BB_THEMES[id].arc || []) {
        if (!act.book) continue;
        expect(ids, `${id} books a real twist`).toContain(act.book);
      }
    }
  });

  it('gives every theme a name, a tagline, an accent and an antagonist', () => {
    for (const id of THEME_LIST) {
      const t = BB_THEMES[id];
      expect(t.name).toBeTruthy();
      expect(t.tagline).toBeTruthy();
      expect(t.palette.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.antagonist.name).toBeTruthy();
    }
  });

  it('resolves nothing when the season has no theme', () => {
    expect(currentTheme()).toBeNull();
    expect(themeAccent()).toBe('#f0c040');
  });

  it('resolves nothing on a season that is not a house', () => {
    seasonConfig.format = 'total-drama';
    seasonConfig.theme = THEME_LIST[0];
    expect(currentTheme()).toBeNull();
  });

  it('resolves the descriptor for a themed house season', () => {
    seasonConfig.theme = THEME_LIST[0];
    expect(currentTheme().id).toBe(THEME_LIST[0]);
    expect(themeAccent()).toBe(BB_THEMES[THEME_LIST[0]].palette.accent);
  });

  it('resolves nothing for an unknown id', () => {
    seasonConfig.theme = 'not-a-theme';
    expect(currentTheme()).toBeNull();
    expect(themeById('not-a-theme')).toBeNull();
  });
});

import { gs, setGs, resolveTwistSchedule } from '../js/core.js';
import { themeScheduleEntries, installTheme, themeState, stampThemeArc, themeArcIsStamped,
  themeModeConflicts, reanchorThemeArc } from '../js/bb/themes.js';

const FIXTURE = {
  id: 'fixture', name: 'Fixture', tagline: 't', house: 'bb-house',
  palette: { accent: '#112233' }, fonts: { display: 'x', body: 'y' },
  antagonist: { name: 'Nobody', voice: {} },
  arc: [
    { at: { week: 2 }, book: 'bb-have-nots' },
    { at: { week: 4 }, book: 'bb-pandoras-box', options: { prize: 'diamond-veto' } },
    { at: { fromEnd: 1 }, book: 'bb-double-eviction' },
    { at: { week: 99 }, book: 'bb-roadkill' },
  ],
};

describe('theme arc scheduler', () => {
  // `gs` starts as null in core.js — a real season only has one after the cast
  // is built. The install tests need somewhere for the theme to live, so stand
  // up the bare minimum a prepared house would have.
  beforeEach(() => { setGs({ bb: { weeks: [] } }); });

  it('lays booked twists onto the weeks the arc names', () => {
    const out = themeScheduleEntries(FIXTURE, { weeks: 9, existing: [] });
    expect(out.map(e => [e.episode, e.type])).toEqual([
      [2, 'bb-have-nots'],
      [4, 'bb-pandoras-box'],
      [9, 'bb-double-eviction'],
    ]);
  });

  it('drops acts that fall outside the season', () => {
    const out = themeScheduleEntries(FIXTURE, { weeks: 3, existing: [] });
    expect(out.map(e => e.type)).not.toContain('bb-roadkill');
    expect(out.map(e => e.type)).not.toContain('bb-pandoras-box');
  });

  it('carries the act options onto the entry', () => {
    const box = themeScheduleEntries(FIXTURE, { weeks: 9, existing: [] })
      .find(e => e.type === 'bb-pandoras-box');
    expect(box.prize).toBe('diamond-veto');
  });

  it('tags every entry so a theme booking is distinguishable from yours', () => {
    for (const e of themeScheduleEntries(FIXTURE, { weeks: 9, existing: [] })) {
      expect(e.source).toBe('theme');
      expect(e.id).toBeTruthy();
    }
  });

  it('leaves a week you booked yourself alone', () => {
    const existing = [{ id: 'mine', episode: 2, type: 'bb-roadkill' }];
    const out = themeScheduleEntries(FIXTURE, { weeks: 9, existing });
    expect(out.some(e => e.episode === 2)).toBe(false);
    expect(out.some(e => e.episode === 4)).toBe(true);
  });

  it('emits nothing that the incompatibility resolver would throw away', () => {
    const cfg = { format: 'big-brother' };
    const out = themeScheduleEntries(FIXTURE, { weeks: 9, existing: [] });
    for (const e of out) {
      expect(resolveTwistSchedule([e.type], cfg)).toEqual([e.type]);
    }
  });

  it('installs once and is idempotent', () => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = THEME_LIST[0];
    seasonConfig.twistSchedule = [];
    gs.bb = { weeks: [] };
    const first = installTheme(12);
    const count = seasonConfig.twistSchedule.length;
    const second = installTheme(12);
    expect(second).toBe(first);
    expect(seasonConfig.twistSchedule.length).toBe(count);
    expect(themeState().id).toBe(THEME_LIST[0]);
  });

  it('never changes the venue — the house is the default and the user picks it', () => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = THEME_LIST[0];
    seasonConfig.setting = 'bb-house';
    seasonConfig.twistSchedule = [];
    gs.bb = { weeks: [] };
    installTheme(12);
    expect(seasonConfig.setting).toBe('bb-house');
  });

  it('leaves a venue the user chose alone, even one the theme was not written for', () => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = THEME_LIST[0];
    seasonConfig.setting = 'bb-manor';
    seasonConfig.twistSchedule = [];
    gs.bb = { weeks: [] };
    installTheme(12);
    expect(seasonConfig.setting).toBe('bb-manor');
  });

  it('keeps the house as the format default', async () => {
    const { defaultSettingFor } = await import('../js/settings.js');
    expect(defaultSettingFor('big-brother')).toBe('bb-house');
  });

  // "Installs nothing" is now the narrower claim: no theme state is created and
  // no arc is booked. It is NOT "touches nothing" — an unthemed season still has
  // to sweep up a previous theme's leavings, which the describe below pins.
  it('installs nothing on an unthemed season', () => {
    seasonConfig.theme = 'none';
    seasonConfig.twistSchedule = [];
    gs.bb = { weeks: [] };
    expect(installTheme(12)).toBeNull();
    expect(seasonConfig.twistSchedule).toEqual([]);
    expect(themeState()).toBeNull();
  });

  it('leaves the weeks you booked yourself alone on an unthemed season', () => {
    seasonConfig.theme = 'none';
    seasonConfig.twistSchedule = [{ id: 'mine', episode: 2, type: 'bb-roadkill' }];
    gs.bb = { weeks: [] };
    installTheme(12);
    expect(seasonConfig.twistSchedule).toEqual([{ id: 'mine', episode: 2, type: 'bb-roadkill' }]);
  });
});

// The install tests above run against the only REGISTERED theme, whose arc is
// empty until Task 7 writes one — so they prove only that install caches an
// object. They would all still pass if the append to `twistSchedule` were
// deleted outright. These run against a test-only descriptor with a real arc,
// which is what actually holds the write down.
describe('theme arc install', () => {
  const INSTALLED = { ...FIXTURE, id: 'fixture-installed' };
  const ALL_THREE = ['bb-have-nots', 'bb-pandoras-box', 'bb-double-eviction'];

  beforeEach(() => {
    BB_THEMES[INSTALLED.id] = INSTALLED;
    setGs({ bb: { weeks: [] } });
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = INSTALLED.id;
    seasonConfig.twistSchedule = [];
  });
  afterEach(() => { delete BB_THEMES[INSTALLED.id]; });

  // A cast of 12 ends at three, so nine weeks — the arc's `fromEnd: 1` act
  // lands on week 9.
  it('writes the arc onto the season schedule for real', () => {
    installTheme(12);
    const mine = seasonConfig.twistSchedule.filter(t => t.source === 'theme');
    expect(mine.map(t => [t.episode, t.type])).toEqual([
      [2, 'bb-have-nots'],
      [4, 'bb-pandoras-box'],
      [9, 'bb-double-eviction'],
    ]);
    expect(mine.find(t => t.type === 'bb-pandoras-box').prize).toBe('diamond-veto');
    expect(themeState().booked).toEqual(ALL_THREE);
  });

  it('does not book the arc a second time when install runs again', () => {
    installTheme(12);
    const before = JSON.stringify(seasonConfig.twistSchedule);
    installTheme(12);
    expect(JSON.stringify(seasonConfig.twistSchedule)).toBe(before);
  });

  // The UI persists `twistSchedule`, so season two opens with season one's
  // theme entries already on it. Untagged, they would read as weeks the user
  // booked, the arc would decline every one of them, and the theme would end up
  // claiming credit for nothing while its twists ran regardless.
  it('rebooks its own arc on a saved config instead of reading it as yours', () => {
    seasonConfig.twistSchedule = [{ id: 'mine', episode: 2, type: 'bb-roadkill' }];
    installTheme(12);
    const saved = JSON.parse(JSON.stringify(seasonConfig.twistSchedule));
    expect(themeState().booked).toEqual(['bb-pandoras-box', 'bb-double-eviction']);

    // Season two: a fresh house, the same saved config.
    setGs({ bb: { weeks: [] } });
    seasonConfig.twistSchedule = saved;
    installTheme(12);

    const mine = seasonConfig.twistSchedule.filter(t => t.source === 'theme');
    expect(mine.map(t => [t.episode, t.type])).toEqual([
      [4, 'bb-pandoras-box'],
      [9, 'bb-double-eviction'],
    ]);
    expect(themeState().booked).toEqual(['bb-pandoras-box', 'bb-double-eviction']);
    // And the week the user booked is still theirs, exactly once.
    expect(seasonConfig.twistSchedule.filter(t => t.id === 'mine')).toHaveLength(1);
  });

  // Turning the theme OFF is the other half of the same problem, and the worse
  // half: `twistSchedule` is persisted, so the previous theme's bookings are
  // still sitting on the saved config with nothing left to own them. Install
  // used to return early on an unthemed season — before the strip — so the user
  // switched the picker to "No theme" and the theme kept playing.
  it('sweeps up the last theme\'s bookings when the picker is set back to none', () => {
    seasonConfig.twistSchedule = [{ id: 'mine', episode: 2, type: 'bb-roadkill' }];
    installTheme(12);
    const saved = JSON.parse(JSON.stringify(seasonConfig.twistSchedule));
    expect(saved.some(t => t.source === 'theme')).toBe(true);

    // Season two, same saved config, theme switched off.
    setGs({ bb: { weeks: [] } });
    seasonConfig.theme = 'none';
    seasonConfig.twistSchedule = saved;
    expect(installTheme(12)).toBeNull();

    expect(seasonConfig.twistSchedule.some(t => t.source === 'theme')).toBe(false);
    expect(seasonConfig.twistSchedule).toEqual([{ id: 'mine', episode: 2, type: 'bb-roadkill' }]);
    // And nothing claims to be running.
    expect(themeState()).toBeNull();
  });
});

import { themeVoice, setThemeMood, themeBeat } from '../js/bb/themes.js';

const VOICED = {
  id: 'voiced', name: 'Voiced', tagline: 't', house: 'bb-house',
  palette: { accent: '#112233' }, fonts: { display: 'x', body: 'y' },
  antagonist: {
    name: 'The Voice',
    mood: 'neutral',
    voice: {
      open:  { neutral: ['Week {week}. Begin.'], hostile: ['Week {week}. Suffer.'] },
      noms:  { neutral: ['{hoh} has chosen {nominees}.'] },
      veto:  { neutral: ['The veto changes nothing.'] },
      vote:  { neutral: ['{evicted} is gone.'] },
    },
  },
  arc: [], books: [], weights: {}, bans: [], exclusive: [],
};

function voicedSeason() {
  BB_THEMES.voiced = VOICED;
  seasonConfig.format = 'big-brother';
  seasonConfig.theme = 'voiced';
  gs.bb = { weeks: [], theme: { id: 'voiced', mood: 'neutral', booked: [], said: [] } };
  gs.activePlayers = ['Bowie', 'Chase', 'Ripper'];
}

describe('the antagonist', () => {
  beforeEach(voicedSeason);
  // THEME_LIST is a load-time snapshot, but the registry tests read BB_THEMES
  // through it — so a test-only descriptor left behind would outlive the file
  // it was written for.
  afterEach(() => { delete BB_THEMES.voiced; });

  it('speaks at every declared hook', () => {
    const ctx = { week: 3, hoh: 'Bowie', nominees: ['Chase', 'Ripper'], evicted: 'Chase' };
    for (const hook of ['open', 'noms', 'veto', 'vote']) {
      const said = themeVoice(hook, ctx);
      expect(said, hook).not.toBeNull();
      expect(said.speaker).toBe('The Voice');
      expect(said.line.length).toBeGreaterThan(0);
    }
  });

  it('fills the tokens with what actually happened', () => {
    const said = themeVoice('noms', { week: 3, hoh: 'Bowie', nominees: ['Chase', 'Ripper'] });
    expect(said.line).toBe('Bowie has chosen Chase and Ripper.');
  });

  it('never names somebody who is not in the house', () => {
    const said = themeVoice('noms', { week: 3, hoh: 'Ghost', nominees: ['Chase'] });
    expect(said).toBeNull();
  });

  // THE ONE THAT MATTERS. An Invisible HOH week hands the hook a null name on
  // purpose, and the antagonist is the last thing in the building that could
  // still read the sealed winner out loud. The week engine's guard is only half
  // the fix; this is the other half, and it is pinned here rather than in
  // bb-invisible-hoh.test.js because that file never builds a themed season and
  // so cannot see this code at all.
  it('will not name a Head of Household the game has sealed', () => {
    expect(themeVoice('noms', { week: 3, hoh: null, nominees: ['Chase', 'Ripper'] })).toBeNull();
  });

  it('refuses a block containing somebody who is not in the house', () => {
    expect(themeVoice('noms', { week: 3, hoh: 'Bowie', nominees: ['Chase', 'Ghost'] })).toBeNull();
  });

  it('announces no departure on a night nobody left', () => {
    expect(themeVoice('vote', { week: 3, evicted: null })).toBeNull();
    expect(themeVoice('vote', { week: 3 })).toBeNull();
  });

  it('says nothing at a hook the theme did not declare', () => {
    expect(themeVoice('nonsense', { week: 1 })).toBeNull();
  });

  it('changes register with the mood', () => {
    const calm = themeVoice('open', { week: 3 });
    setThemeMood('hostile');
    const cross = themeVoice('open', { week: 3 });
    expect(calm.line).toBe('Week 3. Begin.');
    expect(cross.line).toBe('Week 3. Suffer.');
    expect(cross.mood).toBe('hostile');
  });

  it('falls back to neutral when a mood has no lines of its own', () => {
    setThemeMood('hostile');
    expect(themeVoice('veto', { week: 3 }).line).toBe('The veto changes nothing.');
  });

  it('is silent on an unthemed season', () => {
    seasonConfig.theme = 'none';
    gs.bb.theme = null;
    expect(themeVoice('open', { week: 1 })).toBeNull();
  });

  it('is deterministic for the same week and hook', () => {
    const ctx = { week: 5, hoh: 'Bowie', nominees: ['Chase'] };
    expect(themeVoice('noms', ctx).line).toBe(themeVoice('noms', ctx).line);
  });

  // Every field asserted, because the handoff to Task 6 tells the transcripts
  // and the VP screen to read exactly these — `line` rather than `text`, an
  // always-empty `players`, and `themeId`/`mood` as the styling handles. A test
  // that checks half of them lets the other half be renamed.
  it('wraps a line into an act the transcripts can read', () => {
    const act = themeBeat('open', { week: 2 });
    expect(act.type).toBe('theme-beat');
    expect(act.hook).toBe('open');
    expect(act.speaker).toBe('The Voice');
    expect(act.line).toBe('Week 2. Begin.');
    expect(act.mood).toBe('neutral');
    expect(act.themeId).toBe('voiced');
    expect(act.players).toEqual([]);
    expect(act.badgeText).toBe('The Voice');
    expect(act.badgeClass).toBe('badge-twist');
  });

  it('wraps nothing when there was nothing to say', () => {
    expect(themeBeat('noms', { week: 2, hoh: null, nominees: ['Chase'] })).toBeNull();
  });

  it('carries the mood it was speaking in onto the act', () => {
    setThemeMood('hostile');
    expect(themeBeat('open', { week: 2 }).mood).toBe('hostile');
  });
});

// The fixture above gives every hook exactly ONE line, which makes it useless
// for the only non-trivial thing `themeVoice` does: pick from a pool, and walk
// past what it cannot say. Those tests pass against `Math.random()`, against
// `pool[0]`, and against a stub. This fixture has pools worth drawing from.
const CHATTY = {
  id: 'chatty', name: 'Chatty', tagline: 't', house: 'bb-house',
  palette: { accent: '#112233' }, fonts: { display: 'x', body: 'y' },
  antagonist: {
    name: 'The Chorus',
    mood: 'neutral',
    voice: {
      open: { neutral: ['One.', 'Two.', 'Three.', 'Four.', 'Five.', 'Six.'] },
      // Five of the six need a Head of Household by name. On a sealed week the
      // walk has to step over whichever ones it lands on to reach the sixth,
      // from any starting point in the pool.
      noms: { neutral: [
        '{hoh} went first.', '{hoh} went second.', '{hoh} went third.',
        '{hoh} went fourth.', '{hoh} went fifth.',
        'Two chairs are filled and nobody will say by whom.',
      ] },
    },
  },
  arc: [], books: [], weights: {}, bans: [], exclusive: [],
};

describe('the antagonist picking what to say', () => {
  beforeEach(() => {
    BB_THEMES.chatty = CHATTY;
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'chatty';
    gs.bb = { weeks: [], seasonSalt: 1234,
      theme: { id: 'chatty', mood: 'neutral', booked: [], said: [] } };
    gs.activePlayers = ['Bowie', 'Chase', 'Ripper'];
  });
  afterEach(() => { delete BB_THEMES.chatty; });

  it('draws from the whole pool rather than always opening with the same line', () => {
    const lines = new Set();
    for (let w = 1; w <= 12; w++) lines.add(themeVoice('open', { week: w }).line);
    expect(lines.size).toBeGreaterThan(1);
  });

  // The property `stableRng` exists to deliver, and the one a bare
  // `Math.random()` would fail: whether the antagonist says a particular thing
  // must not depend on how many unrelated dice were rolled before it.
  it('says the same thing however many other dice were rolled in between', () => {
    const first = themeVoice('open', { week: 4 }).line;
    for (let i = 0; i < 50; i++) Math.random();
    expect(themeVoice('open', { week: 4 }).line).toBe(first);
    for (let i = 0; i < 50; i++) Math.random();
    expect(themeVoice('open', { week: 4 }).line).toBe(first);
  });

  it('keys the draw to the week and the mood, not to the call', () => {
    const w4 = themeVoice('open', { week: 4 }).line;
    themeVoice('open', { week: 9 });
    themeVoice('noms', { week: 4, hoh: 'Bowie', nominees: ['Chase'] });
    expect(themeVoice('open', { week: 4 }).line).toBe(w4);
  });

  // The pool walk. Whichever line the seed lands on, five of the six are
  // unsayable on a sealed week and the sixth must still be found — from every
  // starting point, not just the lucky one.
  it('walks past the lines it cannot fill instead of going silent', () => {
    for (let week = 1; week <= 12; week++) {
      const said = themeVoice('noms', { week, hoh: null, nominees: ['Chase', 'Ripper'] });
      expect(said, `week ${week}`).not.toBeNull();
      expect(said.line, `week ${week}`).toBe('Two chairs are filled and nobody will say by whom.');
    }
  });

  // The salt is what stops a theme having a script instead of a voice: two
  // seasons of the same theme should not open week 4 with the same sentence.
  it('gives two seasons of the same theme different lines', () => {
    const sweep = () => Array.from({ length: 12 }, (_, i) => themeVoice('open', { week: i + 1 }).line);
    gs.bb.seasonSalt = 1;
    const first = sweep();
    gs.bb.seasonSalt = 2;
    expect(sweep()).not.toEqual(first);
  });

  it('still speaks on a season that has not drawn a salt yet', () => {
    delete gs.bb.seasonSalt;
    expect(themeVoice('open', { week: 1 })).not.toBeNull();
  });
});

import { summariseWeek } from '../js/bb-run.js';
import { rpBuildBBThemeBeat } from '../js/vp-screens.js';
import { BED_CATALOG } from '../js/audio.js';

describe('theme acts reach the audience', () => {
  const week = {
    num: 3, acts: [{
      type: 'theme-beat', hook: 'open', speaker: 'The Voice',
      line: 'Week 3. Begin.', mood: 'neutral', themeId: 'voiced',
      players: [], badgeText: 'The Voice', badgeClass: 'badge-twist',
    }],
  };

  it('writes the line into the week summary', () => {
    // `summariseWeek` returns the finished transcript as one string — it joins
    // its own lines. (The brief's draft called `.join` on the result.)
    const text = summariseWeek(week);
    // Attributed and quoted. The speaker heads its own block in caps, the same
    // as every other heading this writer emits, so the match is on the name
    // rather than on its casing.
    expect(text).toMatch(/the voice/i);
    expect(text).toContain('Week 3. Begin.');
  });

  it('builds a screen that shows the speaker and the line', () => {
    const html = rpBuildBBThemeBeat({ episode: 3 }, week.acts[0]);
    expect(html).toContain('The Voice');
    expect(html).toContain('Week 3. Begin.');
    expect(html).toContain('rp-page');
  });

  // `bedForScreen` passes an explicit `data-ambient` through verbatim, and
  // `resolveBed` returns null for a name the catalogue does not have — at which
  // point `_applyAmbient` stops whatever was playing and leaves the screen in
  // silence. A misspelt bed is therefore WORSE than no bed at all, and it
  // cannot be seen by looking at the screen.
  it('asks for a bed the audio catalogue actually has', () => {
    const html = rpBuildBBThemeBeat({ num: 3 }, week.acts[0]);
    const bed = (html.match(/data-ambient="([^"]+)"/) || [])[1];
    expect(bed, 'the screen names no bed at all').toBeTruthy();
    expect(Object.keys(BED_CATALOG)).toContain(bed);
  });
});

import { players, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

// The three integration points, exercised through the doors a user actually
// arrives on rather than by calling the builder directly. Calling
// `rpBuildBBThemeBeat` proves the function works; it does not prove anything
// ever calls it, and `buildVPScreens`/`generateSummaryText` are where a
// forgotten `case` goes silent. Deleting either case turns this red.
describe('the antagonist reaches the reader and the backlog', () => {
  const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
    'Hicks', 'Emmah', 'Millie', 'Caleb'];
  const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
    'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
  const CAST = NAMES.map((name, i) => ({
    name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
  }));

  // House life beats can end up ON this act. `_attachRomance` hosts them on the
  // last `'house'` act, and a compressed cycle — the back half of a double
  // eviction — has none, so it falls back to the last act on the week. The
  // antagonist's vote line is pushed before romance is attached, which makes it
  // exactly that act. Whichever writer drops them, drops a showmance forming.
  const BEAT = { badgeText: 'SHOWMANCE', badgeClass: 'badge-romance',
    text: 'Bowie and Chase sat up talking long after the lights went out.' };
  const themeAct = () => ({
    type: 'theme-beat', hook: 'open', speaker: 'The Voice',
    line: 'Week 3. Begin.', mood: 'hostile', themeId: 'voiced',
    players: [], badgeText: 'The Voice', badgeClass: 'badge-twist',
    socialBeats: [{ ...BEAT }],
  });

  /** A real played week, so the writers get an episode with everything on it. */
  function playedWeek() {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
      ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
      bbHaveNots: 'off', bbSafetyMode: 'off', twistSchedule: [] });
    const ep = withSeededRandom(17, () => simulateBBEpisode());
    ep.acts.unshift(themeAct());
    return ep;
  }

  it('draws a screen for it in the viewing party', () => {
    const screens = buildVPScreens(playedWeek()) || [];
    expect(screens.some(s => s.label === 'The Voice'), 'no screen for the voice').toBe(true);
    const html = screens.map(s => s.html || '').join('');
    expect(html).toContain('Week 3. Begin.');
  });

  it('does not lose the house life the week hung on that act', () => {
    const html = (buildVPScreens(playedWeek()) || []).map(s => s.html || '').join('');
    expect(html, 'the beats hosted on the theme act were dropped').toContain(BEAT.text);
  });

  it('writes it into the in-app backlog', () => {
    const text = generateSummaryText(playedWeek());
    expect(text).toMatch(/the voice/i);
    expect(text).toContain('Week 3. Begin.');
    expect(text, 'the beats hosted on the theme act were dropped').toContain(BEAT.text);
  });
});

import { defaultConfig } from '../js/core.js';

describe('theme config', () => {
  it('defaults to no theme, so every existing season is unchanged', () => {
    expect(defaultConfig().theme).toBe('none');
  });

  // The picker is a hard-coded list in the HTML, the same as the venue select,
  // so the thing that can rot is a theme registered in code with no way to pick
  // it. THEME_LIST is the load-time snapshot, so the test-only descriptors other
  // describes push into BB_THEMES never reach it — this reads the real registry
  // and nothing else.
  it('offers an option in the markup for every registered theme', async () => {
    const fs = await import('node:fs');
    const html = fs.readFileSync('simulator.html', 'utf8');
    const select = html.match(/<select id="cfg-theme"[\s\S]*?<\/select>/);
    expect(select).not.toBeNull();
    expect(select[0]).toContain('value="none"');
    // Guard against passing vacuously: an empty registry would satisfy the loop
    // below without asserting anything, and the option this names is the one a
    // careless edit to the markup would take away.
    expect(THEME_LIST.length).toBeGreaterThan(0);
    expect(select[0]).toContain('value="summer-of-temptation"');
    for (const id of THEME_LIST) {
      expect(select[0], `${id} has an option`).toContain(`value="${id}"`);
    }
    // And the check discriminates: an id nobody registered has no option, so a
    // green run above means the markup really was searched.
    expect(select[0]).not.toContain('value="not-a-theme"');
  });
});

// ── stamping: the arc as an editable starting point ────────────────────
//
// The arc used to materialise on episode one, so the Format Designer had
// nothing to show and a theme's twists were a black box until the season had
// already started. They were always REAL schedule entries — that is why the
// arc writes entries instead of intercepting the twist lookup — so the only
// thing between them and the designer was when they got written.
//
// Stamped at authoring time they are ordinary cards. The property that has to
// hold from then on is that nothing re-books them behind your back.
describe('stamping the arc for editing', () => {
  const ARC = {
    id: 'stampable', name: 'Stampable', tagline: 't', house: 'bb-house',
    palette: { accent: '#112233' }, fonts: { display: 'x', body: 'y' },
    antagonist: { name: 'Nobody', voice: {} },
    arc: [
      { at: { week: 2 }, book: 'bb-have-nots' },
      { at: { week: 4 }, book: 'bb-pandoras-box', options: { prize: 'diamond-veto' } },
      { at: { fromEnd: 1 }, book: 'bb-double-eviction' },
    ],
    books: [], weights: {}, bans: [], exclusive: [],
  };

  beforeEach(() => {
    BB_THEMES.stampable = ARC;
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'stampable';
    seasonConfig.themeArcStamped = '';
    seasonConfig.twistSchedule = [];
    setGs({ bb: { weeks: [] } });
  });
  afterEach(() => { delete BB_THEMES.stampable; });

  it('puts the arc on the schedule the moment a theme is picked', () => {
    const added = stampThemeArc(12);
    expect(added.length).toBe(3);
    expect(seasonConfig.twistSchedule.map(t => t.type))
      .toEqual(['bb-have-nots', 'bb-pandoras-box', 'bb-double-eviction']);
    expect(seasonConfig.themeArcStamped).toBe('stampable');
  });

  it('marks them so the designer can tell them from yours', () => {
    stampThemeArc(12);
    expect(seasonConfig.twistSchedule.every(t => t.source === 'theme')).toBe(true);
  });

  it('adds nothing without a cast, because the arc needs a season length', () => {
    expect(stampThemeArc(0)).toEqual([]);
    expect(seasonConfig.twistSchedule).toEqual([]);
    expect(seasonConfig.themeArcStamped).toBe('');
  });

  it('sweeps the old theme when you switch, and keeps what you booked', () => {
    stampThemeArc(12);
    seasonConfig.twistSchedule.push({ id: 'mine', episode: 6, type: 'bb-roadkill' });
    seasonConfig.theme = 'none';
    stampThemeArc(12);
    expect(seasonConfig.twistSchedule.map(t => t.id)).toEqual(['mine']);
    expect(seasonConfig.themeArcStamped).toBe('');
  });

  // The reason stamping needed a rule change rather than just earlier timing.
  it('does not re-book over your edits when the season starts', () => {
    stampThemeArc(12);
    // delete one, move one, change what is in the box
    seasonConfig.twistSchedule = seasonConfig.twistSchedule.filter(t => t.type !== 'bb-have-nots');
    const box = seasonConfig.twistSchedule.find(t => t.type === 'bb-pandoras-box');
    box.episode = 7; box.prize = 'halting-hex';
    const authored = JSON.parse(JSON.stringify(seasonConfig.twistSchedule));

    installTheme(12);

    expect(seasonConfig.twistSchedule).toEqual(authored);
    expect(themeState().id).toBe('stampable');
  });

  it('still tells the antagonist what is booked after your edits', () => {
    stampThemeArc(12);
    seasonConfig.twistSchedule = seasonConfig.twistSchedule.filter(t => t.type !== 'bb-have-nots');
    installTheme(12);
    expect(themeState().booked).toEqual(['bb-pandoras-box', 'bb-double-eviction']);
  });

  it('books the arc itself for a season that never went near the designer', () => {
    installTheme(12);
    expect(seasonConfig.twistSchedule.map(t => t.type))
      .toEqual(['bb-have-nots', 'bb-pandoras-box', 'bb-double-eviction']);
  });

  it('lays the theme default back down on reset', () => {
    stampThemeArc(12);
    seasonConfig.twistSchedule = [];
    seasonConfig.themeArcStamped = '';
    stampThemeArc(12);
    expect(seasonConfig.twistSchedule.map(t => t.type))
      .toEqual(['bb-have-nots', 'bb-pandoras-box', 'bb-double-eviction']);
  });
});

// ── the last night ──────────────────────────────────────────────────────
//
// The finale runs through its own simulator and its own act chains, so an
// antagonist wired only into the weekly hooks escalates for eight weeks, gets
// everybody to the end, and is then absent for the episode it was all building
// towards. Worse, the finale episode carried no mood, so the reader dropped out
// of the escalated room for the biggest screen of the season.
describe('the antagonist is present at the finale', () => {
  it('declares finale hooks the weekly loop never uses', async () => {
    const { BB_THEMES: T } = await import('../js/bb/themes.js');
    const voice = T['summer-of-temptation'].antagonist.voice;
    expect(Object.keys(voice)).toEqual(expect.arrayContaining(['finale', 'crown']));
    for (const hook of ['finale', 'crown']) {
      for (const mood of ['neutral', 'hostile']) {
        expect(voice[hook][mood].length, `${hook}/${mood} has variants`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('speaks at both finale hooks', () => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'summer-of-temptation';
    setGs({ bb: { weeks: [], theme: { id: 'summer-of-temptation', mood: 'hostile', booked: [] } },
      activePlayers: ['Bowie', 'Chase', 'Ripper'] });
    const open = themeBeat('finale', { week: 14, finalists: ['Bowie', 'Chase', 'Ripper'] });
    const crown = themeBeat('crown', { week: 14, finalists: ['Bowie', 'Chase'], winner: 'Bowie' });
    expect(open?.line).toBeTruthy();
    expect(crown?.line).toBeTruthy();
    expect(crown.mood).toBe('hostile');
  });

  // The guard refuses a LINE it cannot fill, not the hook: several finale lines
  // name nobody at all and stay perfectly sayable. What must never happen is a
  // name reaching the screen for somebody who is not there.
  it('never names a finalist who is not in the house', () => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'summer-of-temptation';
    setGs({ bb: { weeks: [], theme: { id: 'summer-of-temptation', mood: 'neutral', booked: [] } },
      activePlayers: ['Bowie', 'Chase'] });
    for (let week = 1; week <= 25; week++) {
      const said = themeBeat('finale', { week, finalists: ['Bowie', 'Ghost'] });
      if (said) expect(said.line, `week ${week}`).not.toContain('Ghost');
    }
  });

  // Both writers, again — the finale keeps a SEPARATE act chain from the
  // weekly switch, so being handled there proves nothing about here.
  it('is written by both transcript writers on the last night', () => {
    const backlog = fs.readFileSync('js/text-backlog.js', 'utf8');
    const finaleChain = backlog.slice(backlog.indexOf("act.type === 'theme-beat' && ep.isFinale"));
    expect(finaleChain.slice(0, 400)).toContain("act.type === 'finale-house'");
    const vp = fs.readFileSync('js/vp-screens.js', 'utf8');
    const vpChain = vp.slice(vp.indexOf("act.type === 'theme-beat' && ep.isFinale"));
    // The window is a proxy for "these two are the same chain", and it is
    // measured in CHARACTERS, so it fails on prose as readily as on code: a
    // six-line comment recording why this case must pass `ep` rather than
    // `view` — the bug that made a themed season's whole finale unrenderable —
    // pushed `finale-house` past a 500-char limit while changing nothing about
    // the behaviour it is guarding. Widened rather than made clever; if it
    // trips again for the same reason, the assertion wants rewriting to walk
    // the case labels instead of counting characters.
    expect(vpChain.slice(0, 1200)).toContain("act.type === 'finale-house'");
  });

  it('ends its arc at a final five, not at the finale', () => {
    const t = BB_THEMES['summer-of-temptation'];
    const last = [...t.arc].filter(a => a.book).pop();
    expect(last.at?.fromEnd).toBe(2);         // fromEnd 2 is a final five at every cast
    // Nothing books the last week — the Den stops dealing before the finale.
    expect(t.arc.some(a => a.book && a.at?.fromEnd === 1)).toBe(false);
  });
});

// A theme picked but never stamped.
//
// Stamping fired only on the picker's change event, which meant it never fired
// for the two cases that matter most: a season whose theme was saved before
// stamping existed, and any config restored on page load. The theme was set,
// the arc was nowhere, and the timeline showed an empty season — the double
// eviction the theme claims to book simply was not there.
describe('a theme that was picked but never stamped', () => {
  const ARC = {
    id: 'latestamp', name: 'Late', tagline: 't', house: 'bb-house',
    palette: { accent: '#112233' }, fonts: { display: 'x', body: 'y' },
    antagonist: { name: 'Nobody', voice: {} },
    arc: [{ at: { week: 2 }, book: 'bb-have-nots' },
          { at: { fromEnd: 3 }, book: 'bb-double-eviction' }],
    books: [], weights: {}, bans: [], exclusive: [],
  };
  beforeEach(() => {
    BB_THEMES.latestamp = ARC;
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'latestamp';
    seasonConfig.twistSchedule = [];
    setGs({ bb: { weeks: [] } });
  });
  afterEach(() => { delete BB_THEMES.latestamp; });

  it('is reported as unstamped, which is what the timeline checks', () => {
    seasonConfig.themeArcStamped = '';
    expect(themeArcIsStamped()).toBe(false);
    stampThemeArc(17);
    expect(themeArcIsStamped()).toBe(true);
  });

  it('is reported as unstamped when a DIFFERENT theme was the one stamped', () => {
    seasonConfig.themeArcStamped = 'summer-of-temptation';
    expect(themeArcIsStamped()).toBe(false);
  });

  it('books the double eviction at a final six once stamped', () => {
    seasonConfig.themeArcStamped = '';
    stampThemeArc(17);
    const de = seasonConfig.twistSchedule.find(t => t.type === 'bb-double-eviction');
    expect(de).toBeTruthy();
    // 17 cast is 14 weeks; the fixture's fromEnd 3 is week 12, where the house
    // is six — and the entry says so, so a season that runs long can correct it.
    expect(de.episode).toBe(12);
    expect(17 - (de.episode - 1)).toBe(6);
    expect(de.atHouse).toBe(6);
  });
});

// ── the endgame is a house size, and the week was only ever a guess ──────
//
// Measured off a played seventeen-cast season: sixteen weeks over fifteen
// episodes, two of which evicted nobody. A season is NOT `cast - 3` weeks, so
// every act counted back from an assumed finale aired one house size early —
// the double at a final eight, the closing act at a final six.
describe('end-anchored theme cards follow the house, not the calendar', () => {
  beforeEach(() => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'summer-of-temptation';
    seasonConfig.twistSchedule = [];
    seasonConfig.themeArcStamped = '';
    setGs({ ...gs, bb: null });
    stampThemeArc(17);
  });
  // The last test installs a theme onto `gs.bb`, and an installed theme is what
  // `currentTheme()` reads FIRST — left behind, it answers for every describe
  // below this one.
  afterEach(() => { setGs({ ...gs, bb: null }); });

  const de = () => seasonConfig.twistSchedule.find(t => t.type === 'bb-double-eviction');

  it('carries the house size it was written for', () => {
    expect(de().atHouse).toBe(7);
    expect(de().plannedEpisode).toBe(de().episode);
  });

  it('waits when the season runs long and the house is still too big', () => {
    // The predicted week arrives, but two weeks evicted nobody, so nine are
    // still standing. The card must not fire on the strength of the date.
    const moved = reanchorThemeArc(11, 9);
    expect(moved).toEqual([]);
    expect(de().episode).toBeGreaterThan(11);
    expect(de().themeFired).toBeFalsy();
  });

  it('fires on the week the house actually reaches the size', () => {
    reanchorThemeArc(11, 9);
    reanchorThemeArc(12, 8);   // Pandora's week — a final eight
    const fired = reanchorThemeArc(13, 7);
    expect(fired.map(m => m.type)).toEqual(['bb-double-eviction']);
    expect(de().episode).toBe(13);
    expect(de().themeFired).toBe(true);
  });

  it('still fires when the house jumps clean past the size', () => {
    // Somebody walked, or an earlier double took two: the house goes 8 -> 6
    // without ever standing at seven. An act that waits for exactly seven waits
    // for a week that does not exist.
    reanchorThemeArc(11, 8);   // Pandora
    const fired = reanchorThemeArc(12, 6);
    expect(fired.map(m => m.type)).toEqual(['bb-double-eviction']);
  });

  it('never fires two acts on one week, and keeps them in authored order', () => {
    // A house crossing several anchors at once must not collapse the whole
    // endgame into one night.
    const first = reanchorThemeArc(9, 5).map(m => m.type);
    const second = reanchorThemeArc(10, 5).map(m => m.type);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    // Larger anchor first — that is the earlier act.
    expect(first[0]).toBe('bb-pandoras-box');
    expect(second[0]).toBe('bb-double-eviction');
  });

  it('is put back on its predicted week when a new season installs the theme', () => {
    reanchorThemeArc(11, 8);
    reanchorThemeArc(12, 7);
    expect(de().themeFired).toBe(true);
    const planned = de().plannedEpisode;
    // A second season from the same saved config. Without the reset it opens
    // with every endgame card already marked as having fired.
    setGs({ ...gs, bb: { weeks: [] } });
    installTheme(17);
    expect(de().themeFired).toBeFalsy();
    expect(de().episode).toBe(planned);
  });
});

// ── when the season's settings refuse the theme's own twists ────────────
//
// The Den of Temptation seats a third nominee and so does the Block Buster, so
// they cannot both own the block — the catalogue has always said so. What it
// did not do was say so anywhere you could see it: the theme stamps three Den
// cards, they sit on the timeline looking exactly like cards that will run, and
// `bbTwistsForWeek` drops all three in silence.
describe('a theme whose twists the season will refuse', () => {
  beforeEach(() => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'summer-of-temptation';
    seasonConfig.bbSafetyMode = 'off';
  });
  afterEach(() => { seasonConfig.bbSafetyMode = 'off'; });

  it('is quiet when everything can run', () => {
    expect(themeModeConflicts(seasonConfig)).toEqual({ modes: [], cards: [] });
  });

  // Summer of Temptation no longer conflicts with anything — the curse takes a
  // chair rather than adding one — so the feature is exercised with a theme
  // that books a card which genuinely still clashes. Nine third-chair
  // mechanics remain incompatible with the Block Buster; the Den is simply not
  // one of them any more.
  it('names the mode and the twists it kills', () => {
    BB_THEMES.clashy = {
      id: 'clashy', name: 'Clashy', tagline: 't', house: 'bb-house',
      palette: { accent: '#112233' }, fonts: { display: 'x', body: 'y' },
      antagonist: { name: 'Nobody', voice: {} },
      arc: [{ at: { week: 2 }, book: 'bb-roadkill' }],
      books: [], weights: {}, bans: [], exclusive: [],
    };
    seasonConfig.theme = 'clashy';
    seasonConfig.bbSafetyMode = 'block-buster';
    try {
      const { modes, cards } = themeModeConflicts(seasonConfig);
      expect(modes).toContain('the Block Buster');
      expect(cards).toContain('BB Roadkill');
    } finally { delete BB_THEMES.clashy; }
  });

  it('is quiet for Summer of Temptation, which no longer collides with it', () => {
    seasonConfig.bbSafetyMode = 'block-buster';
    expect(themeModeConflicts(seasonConfig)).toEqual({ modes: [], cards: [] });
  });

  it('is derived from the arc, so it cannot go stale', () => {
    // The conflict is computed off the acts the theme actually books, not from
    // a list declared beside them — so an arc that gains an act cannot outrun
    // its own warning.
    BB_THEMES.clashy2 = {
      id: 'clashy2', name: 'Clashy2', tagline: 't', house: 'bb-house',
      palette: { accent: '#112233' }, fonts: { display: 'x', body: 'y' },
      antagonist: { name: 'Nobody', voice: {} },
      arc: [{ at: { week: 2 }, book: 'bb-roadkill' },
            { at: { week: 4 }, book: 'bb-hacker' },
            { at: { week: 6 }, book: 'bb-have-nots' }],
      books: [], weights: {}, bans: [], exclusive: [],
    };
    seasonConfig.theme = 'clashy2';
    seasonConfig.bbSafetyMode = 'block-buster';
    try {
      const booked = new Set(BB_THEMES.clashy2.arc.filter(a => a.book).map(a => a.book));
      const { cards } = themeModeConflicts(seasonConfig);
      expect(cards.length, 'the fixture books two cards the mode refuses').toBe(2);
      for (const name of cards) {
        const card = TWIST_CATALOG.find(c => (c.name || c.id) === name);
        expect(booked, `${name} is one of the theme's own bookings`).toContain(card.id);
      }
      // Have-Nots runs fine beside the mode, so it must not be listed.
      expect(cards).not.toContain('Have-Nots');
    } finally { delete BB_THEMES.clashy2; }
  });

  it('reports nothing at all for an unthemed season', () => {
    seasonConfig.theme = 'none';
    seasonConfig.bbSafetyMode = 'block-buster';
    expect(themeModeConflicts(seasonConfig)).toEqual({ modes: [], cards: [] });
  });

  // The half that made this worth building: the engine really does drop them.
  it('matches what the engine will actually do with the card', () => {
    const on = { format: 'big-brother', bbSafetyMode: 'block-buster' };
    // Still refused: Roadkill names the third chair, and so does the mode.
    expect(resolveTwistSchedule(['bb-roadkill'], on)).toEqual([]);
    // No longer refused: the Den takes a chair rather than adding one.
    expect(resolveTwistSchedule(['bb-den-of-temptation'], on))
      .toEqual(['bb-den-of-temptation']);
  });
});
