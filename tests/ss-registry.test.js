// Secret Story is its own show on the Big Brother engine, filed under Big Brother.
// Spec: docs/superpowers/specs/2026-10-27-secret-story-show-design.md
import { describe, it, expect } from 'vitest';
import { SHOWS, parseSeasonRef, seasonId, showWords, engineOf, familyOf, familyMembers } from '../js/shows.js';
import { seasonFormat, engineFormat, twistsForFormat } from '../js/core.js';

describe('Secret Story in the registry', () => {
  it('owns the ss prefix', () => {
    expect(parseSeasonRef('ss-3')).toEqual({ format: 'secret-story', number: 3 });
    expect(seasonId('secret-story', 1)).toBe('ss-1');
    expect(parseSeasonRef('bb-1').format).toBe('big-brother');
  });

  it('runs on the Big Brother engine and sits in its family', () => {
    expect(engineOf('secret-story')).toBe('big-brother');
    expect(familyOf('secret-story')).toBe('big-brother');
    expect(familyMembers('big-brother')).toEqual(['big-brother', 'secret-story']);
    expect(SHOWS['secret-story'].familyTab).toBe('Secret Story');
    expect(SHOWS['big-brother'].familyTab).toBe('Big Brother');
    expect(engineFormat({ format: 'secret-story' })).toBe('big-brother');
  });

  it('is not a spin-off that waits for its flagship', () => {
    expect(SHOWS['secret-story'].spinOff).toBeUndefined();
    expect(SHOWS['secret-story'].airSlots).toEqual(['summer']);
  });

  it('speaks its own words, never Big Brother\'s', () => {
    const w = showWords('secret-story');
    expect(w.player).toBe('housemate');
    expect(w.players).toBe('housemates');
    expect(w.exit).toBe('eliminated');
    expect(SHOWS['secret-story'].hasJury).toBe(false);
    const all = JSON.stringify(SHOWS['secret-story'].words).toLowerCase();
    for (const bad of ['houseguest', 'veto', 'hoh', 'head of household', 'jury', 'evicted']) {
      expect(all, bad).not.toContain(bad);
    }
  });

  // (the user, 2026-10-28: "I'm still seeing Big Brother twists when Secret Story is selected, and no Secret Story
  // twists": it plays on Big Brother's engine, with twists of its own and none of Big Brother's)
  it('has twists of its own, and none of Big Brother\'s', () => {
    const ids = twistsForFormat({ format: 'secret-story' }).map(t => t.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every(id => id.startsWith('ss-'))).toBe(true);
    const bb = new Set(twistsForFormat({ format: 'big-brother' }).map(t => t.id));
    expect(ids.some(id => bb.has(id))).toBe(false);
  });

  it('opens an old Big Brother save that ran the Secret Story theme as Secret Story', () => {
    expect(seasonFormat({ format: 'big-brother', theme: 'secret-story' })).toBe('secret-story');
    expect(seasonFormat({ format: 'big-brother', bbSecretStory: 'on' })).toBe('secret-story');
    expect(seasonFormat({ format: 'big-brother', theme: 'temptation' })).toBe('big-brother');
    expect(seasonFormat({ format: 'big-brother' })).toBe('big-brother');
  });
});

// Careers, records and boards: Secret Story keeps its own; All Stars shares Drag Race's.
import { careerShowOf } from '../js/shows.js';
import { boardFile } from '../js/ranking-boards.js';
import { RU_SHOW } from '../js/rankings-update.js';

describe('where Secret Story is filed', () => {
  it('keeps its own career, unlike a spin-off', () => {
    expect(careerShowOf('secret-story')).toBe('secret-story');
    expect(careerShowOf('drag-race-all-stars')).toBe('drag-race');
    expect(careerShowOf('big-brother')).toBe('big-brother');
  });
  it('has its own board and its own rubric, not Big Brother\'s', () => {
    expect(boardFile('secret-story')).toBe('rankings_ss.json');
    expect(boardFile('drag-race-all-stars')).toBe('rankings_dr.json');
    expect(RU_SHOW['secret-story']).not.toBe(RU_SHOW['big-brother']);
    expect(RU_SHOW['secret-story'].read({ ss: { secretsFound: 2, secretKept: 1 }, bb: { hohWins: 3, timesNominated: 4 } }))
      .toMatchObject({ comp1: 2, comp2: 1, comp3: 3, social: 4 });
  });
});

// The calendar: its own summer, never counted in Big Brother's rhythm.
import { nextWindowFor } from '../js/franchise-calendar.js';
import { buildModel } from '../js/calendar-view.js';

describe('Secret Story on the calendar', () => {
  const row = (format, n, y, slot) => ({ format, seasonNumber: n, airYear: y, airSlot: slot, episodeCount: 12, castSize: 14, seasonId: seasonId(format, n) });
  const rows = [row('big-brother', 1, 2026, 'summer'), row('big-brother', 2, 2027, 'summer'), row('secret-story', 1, 2027, 'summer')];
  it('gives Big Brother its next summer without counting Secret Story', () => {
    expect(nextWindowFor(rows, 'big-brother')).toEqual(nextWindowFor(rows.slice(0, 2), 'big-brother'));
  });
  it('continues Secret Story from its own last season', () => {
    const w = nextWindowFor(rows, 'secret-story');
    expect(w.airSlot).toBe('summer');
    expect(w.airYear).toBeGreaterThan(2027);
  });
  it('draws a Secret Story season under its own name', () => {
    const m = buildModel(rows);
    const text = JSON.stringify(m);
    expect(text).toMatch(/SS ?1|Secret Story 1/);
  });
});

describe('who presents Secret Story', () => {
  it('Josh hosts the prime, never Big Brother\'s host', async () => {
    const { HOSTS_BY_FORMAT } = await import('../js/shows.js');
    expect(HOSTS_BY_FORMAT['secret-story'].map(h => h.value)).toEqual(['Josh']);
  });
  it('Josh and Blaineley present the After show', () => {
    expect(SHOWS['secret-story'].after).toEqual({ name: 'After Secret', hosts: ['Josh', 'Blaineley'] });
  });
});
