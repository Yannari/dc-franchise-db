// The narrative-fill worker writes every episode's text into one prompt, and the
// API refuses one over 1,048,576 characters: a 25-player Total Drama season with
// Redemption Island sent 2,119,299 and the export died on a 400 (2026-10-19).
// _fitEpisodesToBudget trims, and must never trim an episode's vote away.
import { describe, it, expect } from 'vitest';
import { _fitEpisodesToBudget } from '../js/stats-export.js';

const scene = (i, n) => `- [SCENE ${i}] ` + `P${n} says something long about the vote and the plan. `.repeat(20);
const episode = n => ({
  episode: n,
  summary: [
    '=== META ===', `EPISODE ${n} - "Title ${n}"`, '',
    '=== CAST (ALL) ===', ...Array.from({ length: 25 }, (_, i) => `P${i + 1}`), '',
    '=== COLD OPEN ===', ...Array.from({ length: 30 }, (_, i) => `Chris: recap line ${i}`), '',
    '=== CAMP — PRE-CHALLENGE ===', ...Array.from({ length: 60 }, (_, i) => scene(i, n)),
    '  Off camera:', ...Array.from({ length: 20 }, (_, i) => `  · [CAMP LIFE] off-camera ${i} `.repeat(5)), '',
    '=== WHERE THEIR HEADS ARE AT — GAME PLANS ===', ...Array.from({ length: 40 }, (_, i) => scene(i, n)), '',
    '=== THE VOTES ===', `P${n} voted out ${n}-2.`, '',
  ].join('\n'),
});

describe('narrative text budget', () => {
  it('a season that fits is sent exactly as it was', () => {
    const eps = [episode(1), episode(2)];
    expect(_fitEpisodesToBudget(eps, 10_000_000)).toBe(eps);
  });

  it('a season twice over the ceiling fits, and every episode keeps its title and its vote', () => {
    const eps = Array.from({ length: 30 }, (_, i) => episode(i + 1));
    const total = eps.reduce((n, e) => n + e.summary.length, 0);
    const budget = Math.floor(total / 2.4);
    const fit = _fitEpisodesToBudget(eps, budget);
    expect(fit.reduce((n, e) => n + e.summary.length + 40, 0)).toBeLessThanOrEqual(budget);
    fit.forEach((e, i) => {
      expect(e.summary).toContain(`EPISODE ${i + 1} - "Title ${i + 1}"`);
      expect(e.summary).toContain(`=== THE VOTES ===\nP${i + 1} voted out`);
      expect(e.summary).not.toContain('Off camera');
    });
    // the cast list stays on episode 1 only: it is where the worker reads the cast from
    expect(fit[0].summary).toContain('=== CAST (ALL) ===');
    expect(fit[1].summary).not.toContain('=== CAST (ALL) ===');
  });

  it('a season far over the ceiling is cut down evenly rather than failing', () => {
    const eps = Array.from({ length: 30 }, (_, i) => episode(i + 1));
    const fit = _fitEpisodesToBudget(eps, 60_000);
    expect(fit.reduce((n, e) => n + e.summary.length + 40, 0)).toBeLessThanOrEqual(60_000);
    fit.forEach(e => expect(e.summary).toContain('=== THE VOTES ==='));
  });
});
