// The spin nobody chose.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs } from '../js/core.js';
import { playRoulette, spinReplacement } from '../js/bb/chopping-block-roulette.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'hero', 'schemer', 'floater', 'villain', 'goat', 'underdog', 'hothead'][i],
}));

const seq = values => { let i = 0; return () => values[i++ % values.length]; };

beforeEach(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { ...(gs.bb || {}), weeks: [], bucks: {}, roomPlays: {}, seasonSalt: 7 };
});

const play = (rng, over = {}) => playRoulette({
  name: 'Zee', house: NAMES, nominees: ['Chase', 'Ripper'], hoh: 'Bowie',
  protectedNames: ['Bowie'], rng, ...over,
});

describe('the spin', () => {
  it('is uniform over the eligible set', () => {
    const eligible = ['Scary', 'Nichelle', 'Axel', 'Brightly'];
    const counts = {};
    for (let i = 0; i < 4000; i++) {
      const pick = spinReplacement({ eligible, rng: seq([i / 4000]) });
      counts[pick] = (counts[pick] || 0) + 1;
    }
    // Every eligible name comes up, and none takes more than 35% of 4000.
    eligible.forEach(n => expect(counts[n]).toBeGreaterThan(0));
    Object.values(counts).forEach(c => expect(c).toBeLessThan(1400));
  });

  it('never lands on the removed nominee', () => {
    for (let s = 0; s < 60; s++) {
      const r = play(seq([0.01, s / 60, (s * 7 % 60) / 60]));
      if (!r.won || !r.removed) continue;
      expect(r.replacement).not.toBe(r.removed);
    }
  });

  it('never lands on the winner, the HOH, or the remaining nominee', () => {
    for (let s = 0; s < 60; s++) {
      const r = play(seq([0.01, s / 60, (s * 3 % 60) / 60]));
      if (!r.won || !r.replacement) continue;
      expect(['Zee', 'Bowie']).not.toContain(r.replacement);
      expect(r.replacement).not.toBe(r.removed === 'Chase' ? 'Ripper' : 'Chase');
    }
  });

  it('takes one nominee down and puts exactly one up', () => {
    const r = play(seq([0.01, 0.3, 0.5]));
    if (!r.won) return;
    expect(['Chase', 'Ripper']).toContain(r.removed);
    expect(r.replacement).toBeTruthy();
  });
});

describe('losing it', () => {
  it('is possible — a paid seat is not a win', () => {
    let losses = 0;
    for (let s = 0; s < 60; s++) if (!play(seq([0.99, s / 60])).won) losses++;
    expect(losses).toBeGreaterThan(0);
  });

  it('changes nothing when lost', () => {
    const r = play(seq([0.999]));
    if (r.won) return;
    expect(r.removed).toBeNull();
    expect(r.replacement).toBeNull();
  });
});

describe('the empty board', () => {
  it('refuses rather than crashing when nobody is eligible for the chair', () => {
    const r = playRoulette({ name: 'Zee', house: ['Zee', 'Bowie', 'Chase', 'Ripper'],
      nominees: ['Chase', 'Ripper'], hoh: 'Bowie', protectedNames: ['Bowie'], rng: seq([0.01, 0.3]) });
    // Everybody left is the winner, the HOH or a nominee — no legal replacement.
    expect(r.replacement).toBeNull();
    expect(r.removed).toBeNull();
  });
});
