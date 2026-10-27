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
    expect(familyMembers('big-brother')).toEqual(['big-brother']);
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
