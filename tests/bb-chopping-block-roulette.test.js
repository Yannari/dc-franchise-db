// The spin nobody chose.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs } from '../js/core.js';
import { playRoulette, runRoulette, spinReplacement } from '../js/bb/chopping-block-roulette.js';
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

// It is a competition, not a turnstile. Alyssa won it alone because she was the
// only one who PAID — not because everybody who clears a bar gets a prize.
describe('one winner at most', () => {
  const field = (rng, entrants = ['Zee', 'Scary', 'Nichelle', 'Axel']) => runRoulette({
    entrants, house: NAMES, nominees: ['Chase', 'Ripper'], hoh: 'Bowie',
    protectedNames: ['Bowie'], rng,
  });

  it('never crowns two, however big the field', () => {
    let wins = 0;
    for (let s = 0; s < 80; s++) {
      const r = field(seq([s / 80, ((s * 3) % 80) / 80, ((s * 7) % 80) / 80, ((s * 11) % 80) / 80, 0.5]));
      const won = Object.values(r.results).filter(x => x.won);
      expect(won.length).toBeLessThanOrEqual(1);
      if (r.winner) {
        expect(won).toHaveLength(1);
        expect(r.results[r.winner].won).toBe(true);
        wins++;
      }
      // Exactly one entry may carry the two names, and only the winner's.
      const carriers = Object.entries(r.results).filter(([, x]) => x.removed || x.replacement);
      expect(carriers.length).toBeLessThanOrEqual(1);
      if (carriers.length) expect(carriers[0][0]).toBe(r.winner);
    }
    expect(wins).toBeGreaterThan(0);   // and it is winnable at all
  });

  it('the loser of a field is a loss, not a lower placing', () => {
    const r = field(seq([0.01, 0.9, 0.9, 0.9, 0.4]));
    if (!r.winner) return;
    for (const [name, res] of Object.entries(r.results)) {
      if (name === r.winner) continue;
      expect(res.won).toBe(false);
      expect(res.removed).toBeNull();
      expect(res.replacement).toBeNull();
    }
  });

  it('produces NO winner when the whole field falls short', () => {
    const r = field(() => 0.999);
    expect(r.winner).toBeNull();
    expect(r.removed).toBeNull();
    expect(r.replacement).toBeNull();
    Object.values(r.results).forEach(x => expect(x.won).toBe(false));
    expect(r.beats.length).toBeGreaterThan(0);   // the night is still narrated
  });

  it('a lone entrant is a field of one — Alyssa\'s week', () => {
    const r = field(seq([0.01, 0.3, 0.5]), ['Zee']);
    if (!r.winner) return;
    expect(r.winner).toBe('Zee');
    expect(r.replacement).toBeTruthy();
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
