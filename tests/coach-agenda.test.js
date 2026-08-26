import { describe, expect, it } from 'vitest';
import { agendaMix, dominantAgenda } from '../js/coach-agenda.js';

const stats = over => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...over,
});

describe('what a coach wants is a mix, not a label', () => {
  it('gives every coach some of all five', () => {
    const mix = agendaMix({ stats: stats(), archetype: 'hero', vulnerability: 0 });
    for (const k of ['control', 'win', 'support', 'survive', 'disrupt']) {
      expect(mix[k], k).toBeGreaterThanOrEqual(0);
    }
  });

  it("collapses a loyal mastermind's appetite for control", () => {
    // The correction that matters: archetype leans, stats decide. A mastermind
    // at loyalty 9 has the mind for control and no appetite for the betrayal
    // it needs.
    const ruthless = agendaMix({ stats: stats({ strategic: 9, loyalty: 1 }), archetype: 'mastermind', vulnerability: 0 });
    const loyal = agendaMix({ stats: stats({ strategic: 9, loyalty: 9 }), archetype: 'mastermind', vulnerability: 0 });
    expect(loyal.control).toBeLessThan(ruthless.control);
    expect(loyal.support).toBeGreaterThan(ruthless.support);
  });

  it('gives a strategic hero real control without making him a villain', () => {
    const plain = agendaMix({ stats: stats({ strategic: 2 }), archetype: 'hero', vulnerability: 0 });
    const sharp = agendaMix({ stats: stats({ strategic: 9 }), archetype: 'hero', vulnerability: 0 });
    expect(sharp.control).toBeGreaterThan(plain.control);
  });

  it('drifts everybody toward survival as the vote closes in', () => {
    const safe = agendaMix({ stats: stats(), archetype: 'hero', vulnerability: 0 });
    const doomed = agendaMix({ stats: stats(), archetype: 'hero', vulnerability: 1 });
    expect(doomed.survive).toBeGreaterThan(safe.survive);
  });

  it('reads Ara as almost pure control', () => {
    // schemer, strategic 8, loyalty 1, temperament 2 — every stat agrees with
    // the archetype instead of pulling against it.
    const ara = agendaMix({
      stats: stats({ strategic: 8, loyalty: 1, boldness: 9, temperament: 2, social: 5 }),
      archetype: 'schemer', vulnerability: 0,
    });
    expect(dominantAgenda(ara)).toBe('control');
  });
});
