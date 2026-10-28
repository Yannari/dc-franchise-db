// Drag Race All Stars is its own show on the Drag Race engine.
// Plan: docs/superpowers/plans/2026-10-27-drag-race-all-stars-own-show.md (Task 1)
import { describe, it, expect } from 'vitest';
import { parseSeasonRef, seasonId, showWords, engineOf, familyOf, familyMembers,
  seasonRowFormat, HOSTS_BY_FORMAT } from '../js/shows.js';
import { twistsForFormat, engineFormat } from '../js/core.js';
import { settingsForFormat } from '../js/settings.js';
import { words as socialWords } from '../js/social/adapter.js';

describe('Drag Race All Stars in the registry', () => {
  it('owns the dras prefix without taking dr', () => {
    expect(parseSeasonRef('dras-2')).toEqual({ format: 'drag-race-all-stars', number: 2 });
    expect(seasonId('drag-race-all-stars', 1)).toBe('dras-1');
    expect(parseSeasonRef('dr-1').format).toBe('drag-race');
  });

  it('runs on the drag engine and belongs to its family', () => {
    expect(engineOf('drag-race-all-stars')).toBe('drag-race');
    expect(engineOf('big-brother')).toBe('big-brother');
    expect(familyOf('drag-race-all-stars')).toBe('drag-race');
    expect(familyOf('traitors')).toBe('traitors');
    expect(familyMembers('drag-race-all-stars')).toEqual(['drag-race', 'drag-race-all-stars']);
    // (Big Brother's family has its own spin-off too: Secret Story, under Big Brother's tab)
    expect(familyMembers('big-brother')).toEqual(['big-brother', 'secret-story']);
    expect(engineFormat({ format: 'drag-race-all-stars' })).toBe('drag-race');
  });

  it('speaks Drag Race words', () => {
    expect(showWords('drag-race-all-stars').exit).toBe('sashayed away');
    expect(showWords('drag-race-all-stars').host).toBe('RuPaul');
  });

  it('draws the drag twists and nothing else', () => {
    const ids = twistsForFormat({ format: 'drag-race-all-stars' }).map(t => t.id);
    expect(ids).toContain('dr-legacy');
    expect(ids.every(id => id.startsWith('dr-'))).toBe(true);
  });

  it("takes its engine's venue and its family's social words", () => {
    expect(settingsForFormat('drag-race-all-stars')).toEqual(settingsForFormat('drag-race'));
    expect(socialWords('drag-race-all-stars')).toBe(socialWords('drag-race'));
  });

  it('is hosted by the drag hosts', () => {
    expect(HOSTS_BY_FORMAT['drag-race-all-stars']).toBe(HOSTS_BY_FORMAT['drag-race']);
  });

  it('reads a legacy all-stars row as the spin-off', () => {
    expect(seasonRowFormat({ format: 'drag-race', allStars: true })).toBe('drag-race-all-stars');
    expect(seasonRowFormat({ format: 'drag-race' })).toBe('drag-race');
    expect(seasonRowFormat({})).toBe('total-drama');
  });
});

// The calendar draws All Stars as its own show (Task 5).
import { buildModel } from '../js/calendar-view.js';

describe('the franchise calendar', () => {
  const row = (format, n, y, slot) => ({ format, seasonNumber: n, airYear: y, airSlot: slot,
    episodeCount: 12, castSize: 12, seasonId: seasonId(format, n) });
  const fx = [row('drag-race', 1, 2027, 'winter'), row('drag-race', 2, 2028, 'winter'),
    row('drag-race', 3, 2029, 'winter'), row('drag-race-all-stars', 1, 2029, 'summer')];

  it('labels an aired All Stars season by its own show', () => {
    const m = buildModel(fx);
    expect(m.runs.find(r => r.format === 'drag-race-all-stars').short).toBe('DRAS 1');
    expect(m.runs.filter(r => r.format === 'drag-race').map(r => r.short)).toEqual(['DR 1', 'DR 2', 'DR 3']);
  });

  it('projects exactly one next All Stars, the year after', () => {
    const stars = buildModel(fx).ghosts.filter(g => g.format === 'drag-race-all-stars');
    expect(stars).toHaveLength(1);
    expect(stars[0].short).toBe('DRAS 2');
    expect(stars[0].season).toMatchObject({ airYear: 2030, airSlot: 'summer' });
    expect(stars[0].possible).toBe(true);
  });

  it('reads an old allStars row the same way', () => {
    const old = [...fx.slice(0, 3), { ...row('drag-race', 4, 2029, 'summer'), allStars: true, seasonId: 'dr-4' }];
    expect(buildModel(old).runs.find(r => r.season.airSlot === 'summer').short).toBe('DRAS 1');
  });
});
