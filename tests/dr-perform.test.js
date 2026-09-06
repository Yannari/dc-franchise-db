// ══════════════════════════════════════════════════════════════════════
// dr-perform.test.js — step 1 of three: what she actually DID
// ══════════════════════════════════════════════════════════════════════
//
// Ground truth. Nothing in this file knows a judge exists, and that is the
// property worth guarding: the moment a "the judges would like this" term
// appears here, the three steps collapse into one and the panel becomes an
// expensive re-ranking of these numbers.
import { describe, expect, it } from 'vitest';
import { performQueen, runwayScore, nervesFor, blendScore, ROLE_RANGES, noise } from '../js/dr/perform.js';
import { rngFor } from '../js/dr/rng.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { seededRandom } from './helpers/rng.js';

const q = (drag, stats = {}) => ({
  name: 'Q', archetype: 'hero', drag,
  stats: { boldness: 5, temperament: 5, mental: 5, strategic: 5, ...stats },
});
const mean = (f, n = 400) => { let s = 0; for (let i = 0; i < n; i++) s += f(i); return s / n; };
const sd = (f, n = 400) => {
  const xs = Array.from({ length: n }, (_, i) => f(i));
  const m = xs.reduce((a, b) => a + b, 0) / n;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / n);
};

describe('the dice', () => {
  it('are the same stream the tests use, so the two cannot drift', () => {
    const a = rngFor(12345);
    const b = seededRandom(12345);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });
});

describe('noise', () => {
  it('is symmetric and bounded', () => {
    const xs = Array.from({ length: 3000 }, (_, i) => noise(rngFor(i), 2.5));
    expect(Math.max(...xs)).toBeLessThanOrEqual(2.5);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-2.5);
    expect(Math.abs(xs.reduce((a, b) => a + b, 0) / xs.length)).toBeLessThan(0.15);
  });
});

describe('performQueen', () => {
  const roast = maxiById('roast');

  it('is proportional to the blended craft', () => {
    const hi = mean(i => performQueen({ player: q({ comedy: 9, acting: 8 }), maxi: roast, rng: rngFor(i) }).perf);
    const lo = mean(i => performQueen({ player: q({ comedy: 2, acting: 3 }), maxi: roast, rng: rngFor(i) }).perf);
    expect(hi - lo).toBeGreaterThan(3);
  });

  it('a lead role widens the spread both ways; ensemble narrows it', () => {
    const rus = maxiById('rusical');
    const spread = role => sd(i => performQueen({ player: q({ singing: 5 }), maxi: rus, role, rng: rngFor(i) }).perf);
    expect(spread('lead')).toBeGreaterThan(spread('ensemble') * 1.3);
    expect(ROLE_RANGES.lead).toBeGreaterThan(ROLE_RANGES.ensemble);
  });

  it('a big role does NOT simply score higher — it swings', () => {
    // The user's correction: a role shifts probability, it never caps or
    // guarantees. A lead and an ensemble member of equal craft must have
    // roughly the same expected score, and very different variance.
    const rus = maxiById('rusical');
    const lead = mean(i => performQueen({ player: q({ singing: 6 }), maxi: rus, role: 'lead', rng: rngFor(i) }).perf, 600);
    const ens = mean(i => performQueen({ player: q({ singing: 6 }), maxi: rus, role: 'ensemble', rng: rngFor(i) }).perf, 600);
    expect(Math.abs(lead - ens), 'a lead is being handed points rather than a wider swing').toBeLessThan(0.6);
  });

  it('boldness widens variance; prep and chemistry add', () => {
    const acting = maxiById('acting');
    const bold = b => sd(i => performQueen({ player: q({ acting: 5 }, { boldness: b }), maxi: acting, rng: rngFor(i) }).perf);
    expect(bold(10)).toBeGreaterThan(bold(1));
    const base = performQueen({ player: q({ acting: 5 }), maxi: acting, rng: rngFor(1) }).perf;
    const boosted = performQueen({ player: q({ acting: 5 }), maxi: acting, prep: 1.5, chemistry: 1, rng: rngFor(1) }).perf;
    expect(boosted - base).toBeCloseTo(2.5, 5);
  });

  it('moments are rare and seeded', () => {
    const snatch = maxiById('snatch-game');
    let n = 0;
    for (let i = 0; i < 1500; i++) if (performQueen({ player: q({ comedy: 6 }), maxi: snatch, rng: rngFor(i) }).moment) n++;
    expect(n / 1500).toBeGreaterThan(0.04);
    expect(n / 1500).toBeLessThan(0.13);
    expect(performQueen({ player: q({}), maxi: snatch, rng: rngFor(9) }).perf)
      .toBe(performQueen({ player: q({}), maxi: snatch, rng: rngFor(9) }).perf);
  });

  it('reports its own arithmetic, so a screen can show why', () => {
    const r = performQueen({ player: q({ comedy: 8 }), maxi: roast, prep: 0.5, rng: rngFor(3) });
    expect(Object.keys(r.parts).sort())
      .toEqual(['base', 'chemistry', 'momentBonus', 'nerves', 'prep', 'range', 'swing']);
    expect(r.risk).toBeGreaterThanOrEqual(0);
    expect(r.risk).toBeLessThanOrEqual(1);
  });

  it('knows nothing about judges', async () => {
    // A source guard, because this is the property the whole design rests on.
    //
    // COMMENTS ARE STRIPPED FIRST. The file explains at length why it must not
    // reach for a judge or a host's bend, and a guard that reads its own
    // explanation as a violation punishes the documentation for describing the
    // rule it enforces. What matters is whether the CODE touches them.
    const raw = (await import('node:fs')).readFileSync('js/dr/perform.js', 'utf8');
    const code = raw
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .split('\n').filter(l => !l.trim().startsWith('//')).join('\n')
      .replace(/\/\/.*$/gm, ' ')
      .toLowerCase();
    for (const forbidden of ['judge', 'taste', 'panel', 'star', 'bend']) {
      expect(code, `perform.js reaches for ${forbidden}`).not.toMatch(
        new RegExp(`\\b${forbidden}\\w*\\s*[.(\\[]`));
    }
    // And the guard is only worth anything if it would fire: prove the pattern
    // matches the thing it is looking for.
    expect('const x = judge.taste;').toMatch(/\bjudge\w*\s*[.([]/);
  });
});

describe('runway and nerves', () => {
  it('scores the sewn look on design and the styled look on runway', () => {
    const p = q({ runway: 9, design: 2 });
    expect(runwayScore({ player: p, category: 'red', rng: rngFor(1) }).score)
      .toBeGreaterThan(runwayScore({ player: p, category: 'red', sewn: true, rng: rngFor(1) }).score);
  });

  it('a category that fits her style scores higher', () => {
    const p = q({ runway: 6, style: 'spooky' });
    const fit = runwayScore({ player: p, category: 'ghouls', categoryStyles: ['spooky'], rng: rngFor(2) });
    const miss = runwayScore({ player: p, category: 'pageant', categoryStyles: ['pageant'], rng: rngFor(2) });
    expect(fit.score).toBeGreaterThan(miss.score);
    expect(fit.fit).toBe(1);
    expect(miss.fit).toBe(0);
  });

  it('a themed runway with no declared styles is neutral for everybody', () => {
    const a = runwayScore({ player: q({ runway: 6, style: 'spooky' }), category: 'x', rng: rngFor(4) });
    const b = runwayScore({ player: q({ runway: 6, style: 'pageant' }), category: 'x', rng: rngFor(4) });
    expect(a.score).toBe(b.score);
    expect(a.fit).toBe(0.5);
  });

  it('nerves read the last two results through temperament', () => {
    expect(nervesFor(['SAFE', 'BTM'], 3)).toBeLessThan(0);
    expect(nervesFor(['SAFE', 'BTM'], 9)).toBeGreaterThan(nervesFor(['SAFE', 'BTM'], 3));
    expect(nervesFor(['WIN', 'WIN'], 5)).toBeGreaterThan(0);
    expect(nervesFor([], 5)).toBe(0);
    // Only the last two count: a bottom six weeks ago is not still rattling her.
    expect(nervesFor(['BTM', 'BTM', 'BTM', 'WIN', 'WIN'], 5)).toBe(nervesFor(['WIN', 'WIN'], 5));
  });
});

describe('blendScore', () => {
  it('weights the craft stats a challenge names and ignores the rest', () => {
    const d = { acting: 10, comedy: 2, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 };
    expect(blendScore(d, { acting: 1 })).toBe(10);
    expect(blendScore(d, { acting: 0.5, comedy: 0.5 })).toBe(6);
    expect(blendScore(d, {})).toBe(5);
  });
});
