// tests/audio.test.js
import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, STORAGE_KEY, clampVolume, parsePrefs, serializePrefs } from '../js/audio.js';
import { CUE_CATALOG, BED_CATALOG, resolveCue, resolveBed } from '../js/audio.js';

describe('audio prefs', () => {
  it('STORAGE_KEY and defaults', () => {
    expect(STORAGE_KEY).toBe('dc_audio');
    expect(DEFAULT_PREFS).toEqual({ muted: false, volume: 0.7 });
  });
  it('clampVolume clamps to [0,1] and guards NaN', () => {
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(-2)).toBe(0);
    expect(clampVolume(9)).toBe(1);
    expect(clampVolume(NaN)).toBe(0.7);
    expect(clampVolume('x')).toBe(0.7);
  });
  it('parsePrefs handles null, junk, and valid', () => {
    expect(parsePrefs(null)).toEqual({ muted: false, volume: 0.7 });
    expect(parsePrefs('not json')).toEqual({ muted: false, volume: 0.7 });
    expect(parsePrefs('{"muted":true,"volume":0.3}')).toEqual({ muted: true, volume: 0.3 });
    expect(parsePrefs('{"volume":5}')).toEqual({ muted: false, volume: 1 });
  });
  it('serializePrefs round-trips through parsePrefs', () => {
    const s = serializePrefs({ muted: true, volume: 0.42 });
    expect(parsePrefs(s)).toEqual({ muted: true, volume: 0.42 });
  });
});

describe('audio catalogs', () => {
  const cueNames = ['reveal-whoosh','torch-snuff','idol-sting','vote-tick','tension-drum','win-fanfare','elimination-gong','screen-swoosh','tab-swoosh','button-tick','save-chime'];
  const bedNames = ['camp-day','camp-night','tribal-tension','victory'];
  it('every required cue exists with build fn + duck flag', () => {
    for (const n of cueNames) {
      expect(CUE_CATALOG[n], n).toBeDefined();
      expect(typeof CUE_CATALOG[n].build).toBe('function');
      expect(typeof CUE_CATALOG[n].duck).toBe('boolean');
    }
  });
  it('every required bed exists with build fn + file slot', () => {
    for (const n of bedNames) {
      expect(BED_CATALOG[n], n).toBeDefined();
      expect(typeof BED_CATALOG[n].build).toBe('function');
      expect('file' in BED_CATALOG[n]).toBe(true);
    }
  });
  it('resolveCue / resolveBed return null for unknown', () => {
    expect(resolveCue('reveal-whoosh')).toBe(CUE_CATALOG['reveal-whoosh']);
    expect(resolveCue('nope')).toBeNull();
    expect(resolveBed('camp-day')).toBe(BED_CATALOG['camp-day']);
    expect(resolveBed('nope')).toBeNull();
  });
});
