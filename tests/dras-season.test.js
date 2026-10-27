// An All Stars season plays as its own show on the Drag Race engine.
// Plan: docs/superpowers/plans/2026-10-27-drag-race-all-stars-own-show.md (Task 2)
import { describe, it, expect } from 'vitest';
import { seasonFormat, engineFormat, isSpinOffSeason } from '../js/core.js';
import { drAllStarsFor } from '../js/dr-run.js';
import { episodeKey } from '../js/episode-store.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer', 'mastermind', 'underdog'];

function bareCast(n, seed) {
  const rng = rngFor(seed * 7919 + 13); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ARCH[i % ARCH.length], age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
  }));
}

describe('an All Stars season under its own show', () => {
  const config = { format: 'drag-race-all-stars', seasonNumber: 1 };

  it('is a drag season whose identity is the spin-off', () => {
    expect(seasonFormat(config)).toBe('drag-race-all-stars');
    expect(engineFormat(config)).toBe('drag-race');
    expect(isSpinOffSeason(config)).toBe(true);
    expect(drAllStarsFor(config)).toBe(true);
    expect(episodeKey(1, 1, seasonFormat(config))).toBe('dras_episode_s1_e1');
  });

  it('plays a full season with the legacy rule and engine-stamped rows', () => {
    const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
    const res = playDragSeason({
      cast: bareCast(10, 3), seed: 307,
      config: { drAllStars: drAllStarsFor(config) },
      bond: (a, b) => bonds[key(a, b)] || 0,
      addBond: (a, b, d) => { bonds[key(a, b)] = (bonds[key(a, b)] || 0) + d; },
      popDelta: () => {},
    });
    expect(res.state.allStars).toBeTruthy();
    expect(res.rows.length).toBeGreaterThan(5);
    expect(res.rows.every(r => r.format === 'drag-race')).toBe(true);
    expect(res.rows.some(r => r.dr?.lipsync?.legacy)).toBe(true);
  });
});

describe('a config written before All Stars had its own show', () => {
  it('legacy all-stars config is read as the spin-off', () => {
    const old = { format: 'drag-race', drAllStars: true, drAllStarsRule: 'save' };
    expect(seasonFormat(old)).toBe('drag-race-all-stars');
    expect(drAllStarsFor(old)).toBe(true);
  });

  it('drag race never carries all-stars rules', () => {
    expect(drAllStarsFor({ format: 'drag-race' })).toBe(false);
    expect(drAllStarsFor({ format: 'drag-race', drAllStars: false })).toBe(false);
    expect(isSpinOffSeason({ format: 'drag-race' })).toBe(false);
    expect(drAllStarsFor({ format: 'big-brother', drAllStars: true })).toBe(false);
  });
});
