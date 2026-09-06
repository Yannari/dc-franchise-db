// ══════════════════════════════════════════════════════════════════════
// dr-registry.test.js — the fourth show EXISTS, and speaks its own words
// ══════════════════════════════════════════════════════════════════════
//
// Everything a registered show gets for free depends on this entry being
// right: thirty-five modules read js/shows.js and need nothing else from a
// new format. What they cannot check for themselves is that the entry says
// the true thing about the show, so this does.
import { describe, expect, it } from 'vitest';
import { SHOWS, showWords, exitVerbs, formatPrefix, seasonId } from '../js/shows.js';
import { formatIsRunnable, SEASON_FORMATS } from '../js/core.js';
import { words as socialWords } from '../js/social/adapter.js';
import { VOCAB } from './helpers/show-vocabulary.js';
import { hostOptionsForFormat, SHOWS as PICKER } from '../js/quick-setup.js';
import { settingsForFormat } from '../js/settings.js';

describe('drag-race registry entry', () => {
  it('is registered with prefix dr', () => {
    expect(SHOWS['drag-race']).toBeTruthy();
    expect(formatPrefix('drag-race')).toBe('dr');
    expect(seasonId('drag-race', 1)).toBe('dr-1');
    expect(SEASON_FORMATS).toContain('drag-race');
  });

  it('speaks its own words', () => {
    const w = showWords('drag-race');
    expect(w.player).toBe('queen');
    expect(w.players).toBe('queens');
    expect(w.round).toBe('Episode');
    expect(w.exit).toBe('sashayed away');
    expect(w.challenge).toBe('maxi challenge');
    expect(w.audienceAward).toBe('Miss Congeniality');
    // Two doors out: the lip sync, and a disqualification. The registry owns
    // both verbs so no screen ever prints one over the other.
    expect(exitVerbs('drag-race')).toEqual(['sashayed away', 'disqualified']);
  });

  it('declares an audience overlay, career stats and polls', () => {
    const s = SHOWS['drag-race'];
    expect(s.audience.mess).toBeGreaterThan(1);
    expect(s.careerStats.map(([k]) => k)).toContain('dr.wins');
    expect(s.polls.length).toBeGreaterThanOrEqual(3);
  });

  it('is not runnable until the engine sets the flag', () => {
    const prior = globalThis.window;
    delete globalThis.window;
    expect(formatIsRunnable('drag-race')).toBe(false);
    if (prior !== undefined) globalThis.window = prior;
  });

  it('has social vocabulary, guard vocabulary, a host, and a setting', () => {
    expect(socialWords('drag-race').eliminated).toBe('sashayed away');
    expect(socialWords('drag-race').nominationLabel).toBe(null);
    expect(VOCAB['drag-race'].own).toContain('lip sync');
    expect(hostOptionsForFormat('drag-race')[0]).toEqual({ value: 'RuPaul', label: 'RuPaul' });
    expect(settingsForFormat('drag-race')).toEqual(['dr-werkroom']);
    expect(PICKER.find(p => p.id === 'drag-race')?.tag).toMatch(/runway/i);
  });
});
