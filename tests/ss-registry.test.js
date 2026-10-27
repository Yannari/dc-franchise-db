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

  it('draws the Big Brother engine twists', () => {
    const ids = twistsForFormat({ format: 'secret-story' }).map(t => t.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toEqual(twistsForFormat({ format: 'big-brother' }).map(t => t.id));
  });

  it('opens an old Big Brother save that ran the Secret Story theme as Secret Story', () => {
    expect(seasonFormat({ format: 'big-brother', theme: 'secret-story' })).toBe('secret-story');
    expect(seasonFormat({ format: 'big-brother', bbSecretStory: 'on' })).toBe('secret-story');
    expect(seasonFormat({ format: 'big-brother', theme: 'temptation' })).toBe('big-brother');
    expect(seasonFormat({ format: 'big-brother' })).toBe('big-brother');
  });
});
