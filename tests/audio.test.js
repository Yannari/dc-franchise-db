// tests/audio.test.js
import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_PREFS, STORAGE_KEY, clampVolume, parsePrefs, serializePrefs } from '../js/audio.js';
import { CUE_CATALOG, BED_CATALOG, resolveCue, resolveBed } from '../js/audio.js';
import { duckGain } from '../js/audio.js';
import { AudioEngine } from '../js/audio.js';
import { FakeAudioContext, fakeStorage } from './helpers/fakeAudioContext.js';

function makeEngine(over = {}) {
  const ctxFactory = () => new FakeAudioContext();
  return new AudioEngine({ ctxFactory, storage: fakeStorage(), ...over });
}

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

describe('duckGain', () => {
  it('returns base when not ducking', () => { expect(duckGain(1, false)).toBe(1); });
  it('reduces by amount when ducking', () => { expect(duckGain(1, true, 0.5)).toBe(0.5); });
  it('clamps amount to [0,1]', () => {
    expect(duckGain(1, true, 2)).toBe(0);
    expect(duckGain(1, true, -1)).toBe(1);
  });
});

describe('AudioEngine state', () => {
  it('loads defaults when storage empty', () => {
    const e = makeEngine();
    expect(e.isMuted()).toBe(false);
    expect(e.getVolume()).toBe(0.7);
    expect(e.isUnlocked()).toBe(false);
  });
  it('loads persisted prefs', () => {
    const storage = fakeStorage();
    storage.setItem('dc_audio', '{"muted":true,"volume":0.2}');
    const e = new AudioEngine({ ctxFactory: () => new FakeAudioContext(), storage });
    expect(e.isMuted()).toBe(true);
    expect(e.getVolume()).toBe(0.2);
  });
  it('setVolume/setMuted persist and clamp', () => {
    const storage = fakeStorage();
    const e = new AudioEngine({ ctxFactory: () => new FakeAudioContext(), storage });
    e.setVolume(5); expect(e.getVolume()).toBe(1);
    e.setMuted(true); expect(e.isMuted()).toBe(true);
    expect(JSON.parse(storage.getItem('dc_audio'))).toEqual({ muted: true, volume: 1 });
  });
  it('unlock creates context once and resumes', () => {
    const e = makeEngine();
    e.unlock();
    expect(e.isUnlocked()).toBe(true);
    e.unlock(); // idempotent
    expect(e.isUnlocked()).toBe(true);
  });
});

describe('AudioEngine.sfx', () => {
  it('no-op when not unlocked', () => {
    const e = makeEngine();
    let called = 0; e._ctxFactory = () => new FakeAudioContext();
    e.sfx('reveal-whoosh'); // not unlocked
    expect(e.isUnlocked()).toBe(false);
  });
  it('no-op when muted', () => {
    const e = makeEngine(); e.setMuted(true); e.unlock();
    const before = e._ctx.created.length;
    e.sfx('reveal-whoosh');
    expect(e._ctx.created.length).toBe(before); // built nothing
  });
  it('invokes the cue build fn when unlocked + unmuted', () => {
    const e = makeEngine(); e.unlock();
    const spy = vi.fn();
    e._catalogOverride = { 'spy-cue': { duck: false, build: spy } };
    e.sfx('spy-cue');
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('warns once on unknown cue, never throws', () => {
    const e = makeEngine(); e.unlock();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => { e.sfx('does-not-exist'); e.sfx('does-not-exist'); }).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
  it('ducks bed gain for duck cues', () => {
    const e = makeEngine(); e.unlock();
    e._bedGain.gain.value = 1;
    e._catalogOverride = { 'duck-cue': { duck: true, build: () => {} } };
    e.sfx('duck-cue');
    expect(e._bedGain.gain.value).toBeLessThan(1);
  });
});

describe('AudioEngine.ambient', () => {
  it('queues bed when not unlocked, plays on unlock', () => {
    const e = makeEngine();
    e.ambient('camp-day');
    expect(e._currentBed).toBe(null);
    e.unlock();
    expect(e._currentBed).toBe('camp-day');
  });
  it('switching beds updates currentBed; same bed is a no-op', () => {
    const e = makeEngine(); e.unlock();
    e.ambient('camp-day'); expect(e._currentBed).toBe('camp-day');
    const builtA = e._ctx.created.length;
    e.ambient('camp-day'); // no-op
    expect(e._ctx.created.length).toBe(builtA);
    e.ambient('tribal-tension'); expect(e._currentBed).toBe('tribal-tension');
  });
  it('ambient(null) clears current bed', () => {
    const e = makeEngine(); e.unlock();
    e.ambient('victory'); expect(e._currentBed).toBe('victory');
    e.ambient(null); expect(e._currentBed).toBe(null);
  });
  it('unknown bed is ignored', () => {
    const e = makeEngine(); e.unlock();
    e.ambient('nope'); expect(e._currentBed).toBe(null);
  });
});
