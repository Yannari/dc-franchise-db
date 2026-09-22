// Deterministic synthetic casts for Perfect Match tests. Alternating f/m,
// straight, varied stats, archetypes drawn from the real fifteen.
import { rngFor } from '../../js/dr/rng.js';

const ARCH = ['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly',
  'loyal-soldier', 'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain',
  'goat', 'perceptive-player', 'showmancer'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness',
  'intuition', 'temperament'];

export function makeIslanders(n = 22, seed = 7) {
  const rng = rngFor(seed * 7919 + 13);
  return Array.from({ length: n }, (_, i) => ({
    name: `Isl${String(i + 1).padStart(2, '0')}`,
    gender: i % 2 === 0 ? 'f' : 'm',
    sexuality: 'straight',
    archetype: ARCH[Math.floor(rng() * ARCH.length)],
    stats: Object.fromEntries(KEYS.map(k => [k, 1 + Math.floor(rng() * 10)])),
  }));
}

/** First 10 start, next 6 are bombshells, the rest arrive with Casa Amor. */
export function roleSetup(names) {
  return Object.fromEntries(names.map((n, i) => [n, { role: i < 10 ? 'starter' : i < 16 ? 'bombshell' : 'casa' }]));
}
