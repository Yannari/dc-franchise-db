// ══════════════════════════════════════════════════════════════════════
// tests/dr-past.test.js — what a queen already did (js/dr/past.js)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { queenPast, derivedCraft, castPasts, craftIsFlat, sharedHistory } from '../js/dr/past.js';
import { DRAG_STATS } from '../js/dr/queen.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

function queen(name, over = {}) {
  return {
    name, slug: name.toLowerCase(), archetype: 'wildcard', age: 28,
    stats: Object.fromEntries(STATS.map((k, i) => [k, ((i * 3 + name.length) % 10) + 1])),
    ...over,
  };
}

describe('an invented past', () => {
  it('is the same past every time, for the same queen and seed', () => {
    const a = castPasts({ cast: [queen('Ripper'), queen('Brightly')], seed: 7 });
    const b = castPasts({ cast: [queen('Ripper'), queen('Brightly')], seed: 7 });
    expect(a).toEqual(b);
    expect(a.Ripper.real).toBe(false);
  });

  it('never makes her a former winner — only a real season can do that', () => {
    for (let s = 1; s <= 40; s++) {
      const p = castPasts({ cast: [queen(`Q${s}`)], seed: s })[`Q${s}`];
      expect(p.rank).toBeGreaterThan(1);
    }
  });

  it('gives her a season, a field size her rank fits in, and unfinished business', () => {
    const p = castPasts({ cast: [queen('Ripper')], seed: 3 }).Ripper;
    expect(p.season).toBeGreaterThan(0);
    expect(p.rank).toBeLessThanOrEqual(p.of);
    expect(typeof p.business).toBe('string');
    expect(p.business.length).toBeGreaterThan(0);
  });
});

describe('a real past', () => {
  const seasons = [{
    season: 1,
    placements: [
      { name: 'Ripper', place: 1, wins: 3 },
      { name: 'Brightly', place: 2, wins: 1 },
      { name: 'MK', place: 3, wins: 0 },
    ],
  }];

  it('is read from the stored season, winner and all', () => {
    const p = queenPast(queen('Ripper'), { seasons });
    expect(p).toMatchObject({ real: true, season: 1, rank: 1, of: 3, wins: 3 });
  });

  it('beats an invented one', () => {
    const p = castPasts({ cast: [queen('Ripper'), queen('Nobody')], seasons, seed: 5 });
    expect(p.Ripper.real).toBe(true);
    expect(p.Nobody.real).toBe(false);
  });
});

describe('derived craft', () => {
  it('is never flat — seven fives is not a queen', () => {
    for (let i = 0; i < 30; i++) {
      const d = derivedCraft(queen(`Q${i}`));
      const vals = DRAG_STATS.map(k => d[k]);
      expect(new Set(vals).size).toBeGreaterThan(1);
      for (const v of vals) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(10); }
    }
  });

  it('is deterministic', () => {
    expect(derivedCraft(queen('Ripper'))).toEqual(derivedCraft(queen('Ripper')));
  });

  it('spots the flat default block it exists to prevent', () => {
    expect(craftIsFlat({ name: 'X' })).toBe(true);
    expect(craftIsFlat({ name: 'X', drag: Object.fromEntries(DRAG_STATS.map(k => [k, 5])) })).toBe(true);
    expect(craftIsFlat({ name: 'X', drag: { ...Object.fromEntries(DRAG_STATS.map(k => [k, 5])), dance: 9 } })).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
// It never asserts what the record cannot show
// ══════════════════════════════════════════════════════════════════════
describe('a real returnee', () => {
  const seasons = [{
    season: 1, winsKnown: false,
    placements: [
      { name: 'Ripper', place: 1, wins: 0 },
      { name: 'Brightly', place: 2, wins: 0 },
      { name: 'MK', place: 5, wins: 0 },
    ],
  }];

  it('is never told she won nothing when the source cannot count wins', () => {
    const p = queenPast(queen('Ripper'), { seasons });
    expect(p.real).toBe(true);
    expect(p.winsKnown).toBe(false);
    /* Her line may say she WON THE SEASON -- that is her placement, which
       the record does show. What it must never do is claim a maxi-win count
       the source cannot count. */
    expect(p.business).not.toMatch(/no wins|maxi win|won more than/i);

    const mid = queenPast(queen('MK'), { seasons });
    expect(mid.business).not.toMatch(/no wins|maxi win|won more than/i);
  });

  it('keeps the wins when the source really does know them', () => {
    const known = [{ season: 1, placements: [{ name: 'Ripper', place: 4, wins: 3 }] }];
    const p = queenPast(queen('Ripper'), { seasons: known });
    expect(p.winsKnown).toBe(true);
    expect(p.wins).toBe(3);
  });

  it('never invents a history with another queen who really was there', () => {
    const cast = [queen('Ripper'), queen('Brightly'), queen('MK')];
    const pasts = Object.fromEntries(cast.map(p => [p.name, queenPast(p, { seasons })]));
    const h = sharedHistory({ cast, pasts, players: Object.fromEntries(cast.map(p => [p.name, p])) });
    // Same real season, nothing on record between them: the only claim made
    // is the one that is true — they were there at the same time.
    for (const x of h) expect(x.kind).toBe('mates');
    expect(h.length).toBeGreaterThan(0);
  });

  it('uses the recorded relationship when there is one', () => {
    const cast = [queen('Ripper'), queen('Brightly')];
    const pasts = Object.fromEntries(cast.map(p => [p.name, queenPast(p, { seasons })]));
    const h = sharedHistory({
      cast, pasts, players: Object.fromEntries(cast.map(p => [p.name, p])),
      real: [{ a: 'Ripper', b: 'Brightly', kind: 'rival', season: 1 }],
    });
    expect(h.find(x => x.kind === 'rival')).toBeTruthy();
    expect(h.filter(x => x.a === 'Ripper' && x.b === 'Brightly')).toHaveLength(1);
  });

  it('still invents freely for a queen with no real past', () => {
    const cast = [queen('Ripper'), queen('Nobody'), queen('Alsonobody')];
    const pasts = Object.fromEntries(cast.map(p => [p.name, queenPast(p, { seasons })]));
    const h = sharedHistory({ cast, pasts, players: Object.fromEntries(cast.map(p => [p.name, p])) });
    // Nothing asserts a real pair, but an invented pair may have any history.
    for (const x of h) {
      if (x.real) expect(x.kind).toBe('mates');
    }
  });
});
