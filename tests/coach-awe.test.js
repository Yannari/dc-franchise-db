// tests/coach-awe.test.js
import { describe, expect, it } from 'vitest';
import { aweOf } from '../js/coach-agenda.js';

const stats = over => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...over,
});

describe('being impressed by a famous coach', () => {
  it('does nothing between equals', () => {
    expect(aweOf({ gap: 0, stats: stats(), archetype: 'goat' })).toBe(0);
  });

  it('lands hardest on someone looking for a leader', () => {
    const goat = aweOf({ gap: 5, stats: stats({ strategic: 2, boldness: 2, intuition: 2 }), archetype: 'goat' });
    const beast = aweOf({ gap: 5, stats: stats({ strategic: 2, boldness: 2, intuition: 2 }), archetype: 'challenge-beast' });
    expect(goat).toBeGreaterThan(beast);
  });

  it('inverts for the strategic — a résumé, not a hero', () => {
    // The same gap that makes a goat deferential makes a mastermind target him,
    // because a five-star finalist is the most dangerous person in camp.
    expect(aweOf({ gap: 5, stats: stats(), archetype: 'mastermind' })).toBeLessThan(0);
    expect(aweOf({ gap: 5, stats: stats(), archetype: 'perceptive-player' })).toBeLessThan(0);
  });

  it('is proportional, not a lookup — stats move it inside one archetype', () => {
    const dim = aweOf({ gap: 5, stats: stats({ strategic: 2 }), archetype: 'goat' });
    const sharp = aweOf({ gap: 5, stats: stats({ strategic: 8 }), archetype: 'goat' });
    expect(sharp).toBeLessThan(dim);
    expect(sharp, 'a sharp goat is still a goat, not a mastermind').toBeGreaterThan(0);
  });

  it('scales with the size of the gap', () => {
    const small = aweOf({ gap: 1, stats: stats({ strategic: 2 }), archetype: 'underdog' });
    const large = aweOf({ gap: 5, stats: stats({ strategic: 2 }), archetype: 'underdog' });
    expect(large).toBeGreaterThan(small);
  });
});
