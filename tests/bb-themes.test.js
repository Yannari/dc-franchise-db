// The theme engine.
//
// A theme is a season author: it decides what the house looks like, who is
// taunting the houseguests, and which twists arrive in which week. The tests
// that matter are the ones that stop a theme from lying — booking a twist that
// does not exist, binding to a venue the format does not have, or naming a
// houseguest who is not in the house.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
import { themeScheduleEntries, installTheme, themeState } from '../js/bb/themes.js';

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
