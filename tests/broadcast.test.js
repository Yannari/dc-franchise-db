import { describe, it, expect } from 'vitest';
import {
  THEME_KEY, normalizeTheme, loadTheme, saveTheme,
  broadcastState, clockString,
} from '../js/broadcast.js';

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}

describe('broadcast theme', () => {
  it('normalizeTheme only allows light/dark, default dark', () => {
    expect(normalizeTheme('light')).toBe('light');
    expect(normalizeTheme('dark')).toBe('dark');
    expect(normalizeTheme('purple')).toBe('dark');
    expect(normalizeTheme(undefined)).toBe('dark');
  });
  it('loadTheme reads storage, defaults dark', () => {
    expect(loadTheme(fakeStorage())).toBe('dark');
    expect(loadTheme(fakeStorage({ [THEME_KEY]: 'light' }))).toBe('light');
    expect(loadTheme(fakeStorage({ [THEME_KEY]: 'nonsense' }))).toBe('dark');
  });
  it('saveTheme persists a normalized value', () => {
    const s = fakeStorage();
    saveTheme('light', s); expect(s.getItem(THEME_KEY)).toBe('light');
    saveTheme('bogus', s); expect(s.getItem(THEME_KEY)).toBe('dark');
  });
});

describe('broadcastState', () => {
  it('OFF AIR with no season', () => {
    const st = broadcastState({ initialized: false }, {});
    expect(st.onAir).toBe(false);
    expect(st.season).toBeNull();
    expect(st.episode).toBeNull();
  });
  it('ON AIR shows season name + episode', () => {
    const st = broadcastState({ initialized: true, episode: 7 }, { name: 'Cursed Island' });
    expect(st.onAir).toBe(true);
    expect(st.season).toBe('Cursed Island');
    expect(st.episode).toBe(7);
    expect(st.network).toBe('DC FRANCHISE NETWORK');
  });
  it('ON AIR before first episode shows no ep number', () => {
    const st = broadcastState({ initialized: true, episode: 0 }, { name: 'S1' });
    expect(st.onAir).toBe(true);
    expect(st.episode).toBeNull();
  });
  it('initialized season with no name falls back', () => {
    expect(broadcastState({ initialized: true, episode: 1 }, {}).season).toBe('Untitled Season');
  });
});

describe('clockString', () => {
  it('zero-pads HH:MM', () => {
    expect(clockString(new Date(2026, 0, 1, 9, 4))).toBe('09:04');
    expect(clockString(new Date(2026, 0, 1, 21, 41))).toBe('21:41');
    expect(clockString(new Date(2026, 0, 1, 0, 0))).toBe('00:00');
  });
});
