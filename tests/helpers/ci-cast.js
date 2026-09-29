// Deterministic synthetic casts and Catfish Pools for The Circle's tests.
// Ages spread 21-56 so the catfish motive has something to read; archetypes
// from the real fifteen; mostly straight, a few not.
import { rngFor } from '../../js/dr/rng.js';

const ARCH = ['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly',
  'loyal-soldier', 'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain',
  'goat', 'perceptive-player', 'showmancer'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness',
  'intuition', 'temperament'];
const HANDLES = ['Rebecca', 'Mercedeze', 'Adam', 'Carol', 'Nathan', 'Jared', 'Imani', 'Gianna',
  'Tierra', 'Andy', 'Felix', 'Gemma', 'Syed', 'Dorothy', 'Kate', 'Olivia', 'Paul', 'Brittney',
  'Bruno', 'Sasha'];
// A persona's pronouns follow its name: "Adam" is never "she".
const MALE_HANDLES = new Set(['Adam', 'Nathan', 'Jared', 'Andy', 'Felix', 'Syed', 'Paul', 'Bruno']);

export function makePlayers(n = 13, seed = 7) {
  const rng = rngFor(seed * 7919 + 13);
  return Array.from({ length: n }, (_, i) => ({
    name: `P${String(i + 1).padStart(2, '0')}`,
    gender: i % 2 === 0 ? 'f' : 'm',
    sexuality: i % 7 === 3 ? 'bi' : 'straight',
    age: rng() < 0.75 ? 21 + Math.floor(rng() * 12) : 33 + Math.floor(rng() * 26),
    archetype: ARCH[Math.floor(rng() * ARCH.length)],
    stats: Object.fromEntries(KEYS.map(k => [k, 1 + Math.floor(rng() * 10)])),
  }));
}

export function makePool(k = 6, seed = 7) {
  const rng = rngFor(seed * 104729 + 7);
  return Array.from({ length: k }, (_, i) => ({
    id: `persona-${i + 1}`,
    handle: HANDLES[i % HANDLES.length] + (i >= HANDLES.length ? String(i) : ''),
    face: `guest-${i + 1}`,
    age: 21 + Math.floor(rng() * 12),
    gender: MALE_HANDLES.has(HANDLES[i % HANDLES.length]) ? 'm' : 'f',
    job: ['student', 'nurse', 'personal trainer', 'bartender', 'teacher', 'model'][i % 6],
    hometown: null,
    status: 'Single',
    bio: '',
    reasons: [['strategic'], ['protective'], ['strategic', 'experimental'], ['family'], ['protective', 'family'], ['strategic']][i % 6],
    tells: [['golf'], ['periods'], ['makeup brands'], ['nursing'], [], ['college football']][i % 6],
    fits: {},
  }));
}

/** The first `n - newcomers` start on Day 1; the rest arrive later, in order. */
export function circleSetup(names, { newcomers = 5 } = {}) {
  return Object.fromEntries(names.map((n, i) => [n, { role: i < names.length - newcomers ? 'starter' : 'newcomer' }]));
}
