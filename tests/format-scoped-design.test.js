// Designing a season is scoped to the show it belongs to.
//
// The format axis existed in core.js from phase one and nothing in the setup
// screen ever read it, so a Big Brother season was designed against a
// catalogue of tribe swaps and a venue list offering a summer camp. These
// cover the scoping itself rather than the widgets: what a format offers, and
// that the two shows never offer each other's content.
import { describe, expect, it } from 'vitest';
import { TWIST_CATALOG, twistFormat, twistsForFormat, SEASON_FORMATS } from '../js/core.js';
import { SEASON_SETTINGS, SETTINGS_BY_FORMAT, settingsForFormat, defaultSettingFor } from '../js/settings.js';

describe('format-scoped season design', () => {
  it('gives every show a venue list of its own', () => {
    for (const fmt of SEASON_FORMATS) {
      const ids = settingsForFormat(fmt);
      expect(ids.length, `${fmt} has no settings`).toBeGreaterThan(0);
      // Every listed venue is a real profile, not a dangling id.
      for (const id of ids) expect(SEASON_SETTINGS[id], `${id} has no profile`).toBeTruthy();
      expect(ids).toContain(defaultSettingFor(fmt));
    }
  });

  it('never offers one show the other show´s venues', () => {
    const td = new Set(SETTINGS_BY_FORMAT['total-drama']);
    const bb = new Set(SETTINGS_BY_FORMAT['big-brother']);
    for (const id of bb) expect(td.has(id), `${id} in both`).toBe(false);
    // The house is the Big Brother venue, and it is a complete profile.
    const house = SEASON_SETTINGS['bb-house'];
    expect(house.vocab.place).toBeTruthy();
    expect(house.atmosphere.length).toBeGreaterThan(0);
    expect(house.arrival.headline).toBeTruthy();
  });

  it('scopes the twist catalogue to the show being designed', () => {
    for (const fmt of SEASON_FORMATS) {
      const list = twistsForFormat(fmt);
      // Nothing from another show leaks in.
      for (const t of list) expect(twistFormat(t)).toBe(fmt);
    }
    // Every twist is claimed by exactly one show, so none are unreachable.
    const total = SEASON_FORMATS.reduce((n, f) => n + twistsForFormat(f).length, 0);
    expect(total).toBe(TWIST_CATALOG.length);
  });
});
