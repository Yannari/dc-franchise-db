// ══════════════════════════════════════════════════════════════════════
// dr-judging.test.js — steps 2 and 3: how it was seen, and what was done
// ══════════════════════════════════════════════════════════════════════
//
// The bounds are the important assertions here. A host who can do anything is
// not a host, he is a random number generator with a name; a host who can do
// nothing makes the panel the whole show. Everything below is about where that
// line sits and proving it holds under a hostile agenda.
import { describe, expect, it } from 'vitest';
import { judgeViews, panelRanking, isSplitPanel, hostBend, callWeek, judgeMemoryAfter } from '../js/dr/judging.js';
import { panelFor } from '../js/dr/judges.js';
import { rngFor } from '../js/dr/rng.js';

const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const entries = names.map((name, i) => ({
  name, style: 'comedy', perf: 10 - i * 0.6, runway: 5 + (i % 3), risk: 0.5, polish: 5,
}));
const panel = panelFor({ rotatingId: 'law' });

describe('judgeViews and panelRanking', () => {
  it('ranks every entry per judge, best first, and merges', () => {
    const v = judgeViews(panel, entries, {}, rngFor(1));
    expect(Object.keys(v)).toEqual(['rupaul', 'michelle', 'law']);
    expect(v.rupaul.length).toBe(12);
    expect(v.rupaul[0].rank).toBe(1);
    expect(v.rupaul.map(r => r.rank)).toEqual(names.map((_, i) => i + 1));
    const r = panelRanking(v);
    expect(r[0].panelRank).toBe(1);
    expect(r.length).toBe(12);
    expect(r.find(x => x.name === 'A').meanRank).toBeLessThan(r.find(x => x.name === 'L').meanRank);
  });

  it('a fashion judge lifts a runway queen the comedy judge does not', () => {
    // The disagreement is the product. If these two agree, step 2 is pointless.
    const e = [
      { name: 'Look', style: 'fashion', perf: 5, runway: 10, risk: 0.2, polish: 8 },
      { name: 'Bit', style: 'comedy', perf: 9, runway: 3, risk: 0.8, polish: 3 },
    ];
    expect(judgeViews(panelFor({ rotatingId: 'law' }), e, {}, rngFor(3)).law[0].name).toBe('Look');
    expect(judgeViews(panelFor({ rotatingId: 'ross' }), e, {}, rngFor(3)).ross[0].name).toBe('Bit');
  });

  it('memory drags a repeat bottom down', () => {
    const e = [
      { name: 'X', style: 'camp', perf: 6, runway: 6, risk: 0.5, polish: 5 },
      { name: 'Y', style: 'camp', perf: 6, runway: 6, risk: 0.5, polish: 5 },
    ];
    const mem = { rupaul: { X: -1.2 }, michelle: { X: -1.2 }, law: { X: -1.2 } };
    expect(judgeViews(panel, e, mem, rngFor(4)).rupaul[0].name).toBe('Y');
  });

  it('records the spread, which is what makes a week "split"', () => {
    const r = panelRanking(judgeViews(panel, entries, {}, rngFor(5)));
    for (const row of r) expect(row.spread).toBeGreaterThanOrEqual(0);
    expect(typeof isSplitPanel(r)).toBe('boolean');
  });
});

describe('hostBend', () => {
  const ranking = names.map((name, i) => ({ name, panelRank: i + 1, meanRank: i + 1, spread: 0 }));

  it('never lifts a panel bottom-two to the win', () => {
    const star = Object.fromEntries(names.map(n => [n, n === 'L' ? 10 : 0]));
    const out = hostBend(ranking, { star, storylineNeed: { L: 1 }, trackPull: { L: 1 }, split: true });
    expect(out.find(x => x.name === 'L').finalRank).toBeGreaterThan(1);
  });

  it('never drops the panel\'s first into the bottom two', () => {
    const out = hostBend(ranking, { star: { A: 0 }, storylineNeed: { A: -1 }, trackPull: { A: -1 }, split: true });
    expect(out.find(x => x.name === 'A').finalRank).toBeLessThan(11);
  });

  it('moves at most two places, three on a split week', () => {
    const star = Object.fromEntries(names.map(n => [n, n === 'F' ? 10 : 0]));
    const calm = hostBend(ranking, { star, storylineNeed: { F: 1 }, trackPull: { F: 1 }, split: false });
    const split = hostBend(ranking, { star, storylineNeed: { F: 1 }, trackPull: { F: 1 }, split: true });
    expect(6 - calm.find(x => x.name === 'F').finalRank).toBeLessThanOrEqual(2);
    expect(6 - split.find(x => x.name === 'F').finalRank).toBeLessThanOrEqual(3);
    expect(6 - split.find(x => x.name === 'F').finalRank).toBeGreaterThanOrEqual(1);
  });

  it('holds the bounds for EVERYBODY at once under a maximal agenda', () => {
    // The bound has to survive a whole cast being bent, not just one queen.
    const hostile = {
      star: Object.fromEntries(names.map((n, i) => [n, i % 2 ? 10 : 0])),
      storylineNeed: Object.fromEntries(names.map((n, i) => [n, i % 2 ? 1 : -1])),
      trackPull: Object.fromEntries(names.map((n, i) => [n, i % 2 ? 1 : -1])),
      split: true,
    };
    const out = hostBend(ranking, hostile);
    for (const x of out) {
      expect(Math.abs(x.finalRank - x.panelRank), `${x.name} moved too far`).toBeLessThanOrEqual(3);
    }
    expect(out.find(x => x.panelRank === 1).finalRank).toBeLessThan(11);
    expect(out.find(x => x.finalRank === 1).panelRank).toBeLessThan(11);
  });

  it('always returns a clean permutation — every place used exactly once', () => {
    for (let s = 0; s < 30; s++) {
      const rnd = rngFor(s);
      const out = hostBend(ranking, {
        star: Object.fromEntries(names.map(n => [n, rnd() * 10])),
        storylineNeed: Object.fromEntries(names.map(n => [n, rnd() * 2 - 1])),
        trackPull: Object.fromEntries(names.map(n => [n, rnd() * 2 - 1])),
        split: s % 2 === 0,
      });
      expect(out.map(x => x.finalRank).sort((a, b) => a - b)).toEqual(names.map((_, i) => i + 1));
      expect(new Set(out.map(x => x.name)).size).toBe(12);
    }
  });

  it('with no agenda the ranking is untouched', () => {
    const out = hostBend(ranking, { star: {}, storylineNeed: {}, trackPull: {}, split: false });
    expect(out.map(x => x.finalRank)).toEqual(names.map((_, i) => i + 1));
    expect(out.map(x => x.name)).toEqual(names);
  });
});

describe('callWeek', () => {
  // Generated rather than sliced from `names`, which only has twelve entries:
  // the first version of this fixture handed cast sizes 13 and 14 a couple of
  // `undefined` queens and the "accounts for everybody" assertion caught it.
  const fr = n => Array.from({ length: n }, (_, i) => ({
    name: names[i] || `Q${i + 1}`, finalRank: i + 1,
  }));

  it('sizes the tops and bottoms by cast', () => {
    expect(callWeek(fr(12), { castSize: 12 })).toEqual({
      win: ['A'], high: ['B', 'C'], safe: ['D', 'E', 'F', 'G', 'H', 'I'], low: ['J'], bottom: ['K', 'L'],
    });
    const ten = callWeek(fr(10), { castSize: 10 });
    expect(ten.win).toEqual(['A']);
    expect(ten.high).toEqual(['B']);
    expect(ten.bottom).toEqual(['I', 'J']);
    const six = callWeek(fr(6), { castSize: 6 });
    expect(six.high).toEqual(['B']);
    expect(six.low).toEqual([]);
    expect(six.bottom).toEqual(['E', 'F']);
  });

  it('accounts for everybody exactly once, at every cast size', () => {
    for (let n = 4; n <= 14; n++) {
      const c = callWeek(fr(n), { castSize: n });
      const all = [...c.win, ...c.high, ...c.safe, ...c.low, ...c.bottom];
      expect(all.length, `cast ${n} lost or duplicated somebody`).toBe(n);
      expect(new Set(all).size).toBe(n);
      expect(c.win.length).toBe(1);
      expect(c.bottom.length).toBeLessThanOrEqual(2);
    }
  });

  it('immunity lifts a queen out of the bottom and pulls the next one in', () => {
    const c = callWeek(fr(12), { castSize: 12, immune: ['L'] });
    expect(c.bottom).toEqual(['J', 'K']);
    expect(c.safe).toContain('L');
    expect([...c.win, ...c.high, ...c.safe, ...c.low, ...c.bottom].length).toBe(12);
  });

  it('an immune queen who was going to WIN still wins', () => {
    const c = callWeek(fr(12), { castSize: 12, immune: ['A'] });
    expect(c.win).toEqual(['A']);
  });
});

describe('judgeMemoryAfter', () => {
  it('decays, then records tonight', () => {
    const m = judgeMemoryAfter({ rupaul: { A: 1 } }, panel,
      { win: ['B'], bottom: ['A'], high: [], low: [], safe: [] });
    expect(m.rupaul.A).toBeCloseTo(1 * 0.7 - 0.4);
    expect(m.michelle.B).toBeCloseTo(0.3);
  });

  it('fades to nothing rather than accumulating forever', () => {
    let m = { rupaul: { A: -1 } };
    for (let i = 0; i < 12; i++) {
      m = judgeMemoryAfter(m, panel, { win: [], bottom: [], high: [], low: [], safe: [] });
    }
    expect(Math.abs(m.rupaul.A)).toBeLessThan(0.05);
  });
});
