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

  it('installs nothing on an unthemed season', () => {
    seasonConfig.theme = 'none';
    seasonConfig.twistSchedule = [];
    gs.bb = { weeks: [] };
    expect(installTheme(12)).toBeNull();
    expect(seasonConfig.twistSchedule).toEqual([]);
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
});
