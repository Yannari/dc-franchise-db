// ci-registry.test.js — the sixth show exists, speaks its own words, and cannot be run yet.
import { describe, expect, it } from 'vitest';
import { SHOWS, showWords, exitVerbs, formatPrefix, seasonId, roundShape,
  CIRCLE_FORMAT } from '../js/shows.js';
import { formatIsRunnable, SEASON_FORMATS } from '../js/core.js';
import { words as socialWords } from '../js/social/adapter.js';
import { VOCAB } from './helpers/show-vocabulary.js';
import { hostOptionsForFormat, SHOWS as PICKER } from '../js/quick-setup.js';
import { settingsForFormat } from '../js/settings.js';

describe('the-circle registry entry', () => {
  it('is registered with prefix ci and ballot-shaped rounds', () => {
    expect(CIRCLE_FORMAT).toBe('the-circle');
    expect(formatPrefix('the-circle')).toBe('ci');
    expect(seasonId('the-circle', 1)).toBe('ci-1');
    expect(SEASON_FORMATS).toContain('the-circle');
    expect(roundShape('the-circle')).toBe('ballots');
    expect(SHOWS['the-circle'].hasJury).toBe(false);
  });

  it('speaks its own words', () => {
    const w = showWords('the-circle');
    expect(w.player).toBe('player');
    expect(w.exit).toBe('blocked');
    expect(w.audienceAward).toBe('Fan Favorite');
    expect(w.host).toBeNull();
    expect(exitVerbs('the-circle')).toEqual(['blocked']);
  });

  it('declares audience, career stats, article stats and polls', () => {
    const s = SHOWS['the-circle'];
    expect(s.audience.twist).toBeGreaterThan(1);
    expect(s.careerStats.length).toBeGreaterThan(0);
    for (const k of ['career', 'season', 'comps']) expect(s.articleStats[k].length).toBeGreaterThan(0);
    expect(s.polls.length).toBeGreaterThanOrEqual(3);
  });

  it('is not runnable: the flag is only set by js/ci-run.js (Plan 4)', () => {
    const prior = globalThis.window;
    delete globalThis.window;
    expect(formatIsRunnable('the-circle')).toBe(false);
    if (prior !== undefined) globalThis.window = prior;
  });

  it('never borrows Total Drama\'s host, and has a setting, social words and guard words', () => {
    // hostOptionsForFormat falls back to Total Drama's hosts for a show it does
    // not know — a Circle season would have been hosted by Chris.
    const hosts = hostOptionsForFormat('the-circle');
    expect(hosts).toEqual([{ value: '', label: 'No host chosen yet' }]);
    expect(settingsForFormat('the-circle')).toEqual(['ci-apartments']);
    expect(socialWords('the-circle').eliminated).toBe('blocked');
    expect(VOCAB['the-circle'].own).toContain('circle chat');
    expect(PICKER.find(p => p.id === 'the-circle')?.tag).toMatch(/apartment/i);
  });
});
