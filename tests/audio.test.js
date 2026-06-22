// tests/audio.test.js
import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, STORAGE_KEY, clampVolume, parsePrefs, serializePrefs } from '../js/audio.js';

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
