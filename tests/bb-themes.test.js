// The theme engine.
//
// A theme is a season author: it decides what the house looks like, who is
// taunting the houseguests, and which twists arrive in which week. The tests
// that matter are the ones that stop a theme from lying — booking a twist that
// does not exist, binding to a venue the format does not have, or naming a
// houseguest who is not in the house.
import { beforeEach, describe, expect, it } from 'vitest';
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
