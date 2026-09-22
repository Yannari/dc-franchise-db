// pm-registry.test.js — the fifth show exists and speaks its own words.
import { describe, expect, it } from 'vitest';
import { SHOWS, showWords, exitVerbs, formatPrefix, seasonId, roundShape,
  PERFECT_MATCH_FORMAT } from '../js/shows.js';
import { formatIsRunnable, SEASON_FORMATS } from '../js/core.js';
import { words as socialWords } from '../js/social/adapter.js';
import { VOCAB } from './helpers/show-vocabulary.js';
import { hostOptionsForFormat, SHOWS as PICKER } from '../js/quick-setup.js';
import { settingsForFormat } from '../js/settings.js';

describe('perfect-match registry entry', () => {
  it('is registered with prefix pm', () => {
    expect(PERFECT_MATCH_FORMAT).toBe('perfect-match');
    expect(formatPrefix('perfect-match')).toBe('pm');
    expect(seasonId('perfect-match', 1)).toBe('pm-1');
    expect(SEASON_FORMATS).toContain('perfect-match');
    expect(roundShape('perfect-match')).toBe('ballots');
    expect(SHOWS['perfect-match'].hasJury).toBe(false);
  });

  it('speaks its own words, with two doors out', () => {
    const w = showWords('perfect-match');
    expect(w.player).toBe('islander');
    expect(w.players).toBe('islanders');
    expect(w.exit).toBe('dumped');
    expect(w.audienceAward).toBe('Fan Favourite Islander');
    expect(w.host).toBe('Dior');
    expect(exitVerbs('perfect-match')).toEqual(['dumped', 'walked']);
    // A one-door show still has one door.
    expect(exitVerbs('total-drama')).toHaveLength(1);
  });

  it('declares audience, career stats, article stats and polls', () => {
    const s = SHOWS['perfect-match'];
    expect(s.audience.showmance).toBeGreaterThan(1);
    expect(s.careerStats.length).toBeGreaterThan(0);
    for (const k of ['career', 'season', 'comps']) expect(s.articleStats[k].length).toBeGreaterThan(0);
    expect(s.polls.length).toBeGreaterThanOrEqual(3);
  });

  it('is not runnable until the engine sets the flag', () => {
    const prior = globalThis.window;
    delete globalThis.window;
    expect(formatIsRunnable('perfect-match')).toBe(false);
    if (prior !== undefined) globalThis.window = prior;
  });

  it('has social words, guard words, a host, a setting and a picker tag', () => {
    expect(socialWords('perfect-match').eliminated).toBe('dumped');
    expect(socialWords('perfect-match').jury).toBeTruthy();
    expect(VOCAB['perfect-match'].own).toContain('recoupling');
    expect(hostOptionsForFormat('perfect-match')[0]).toEqual({ value: 'Dior', label: 'Dior' });
    expect(settingsForFormat('perfect-match')).toEqual(['pm-villa']);
    expect(PICKER.find(p => p.id === 'perfect-match')?.tag).toMatch(/villa/i);
  });
});
