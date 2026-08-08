// Twelve alumni, one opinion.
//
// `hostLens` returned the first predicate that matched and stopped. That reads
// as harmless ordering and was not: `competitions` expertise is the most common
// thing on a record — anybody with challenge wins has it — so it swallowed the
// panel. Measured against the real database, EIGHT of twelve hosts came out
// `challenge-beast`, three villains, one strategist, and `goat`, `underdog` and
// `social` were unreachable for that panel.
//
// A lens pool holds four to six lines. Eight people sharing five sentences is
// not a room of alumni, it is one commentator with eight portraits, and no
// amount of freshness memory fixes it because there is nothing else in there to
// reach for. The audit measured the cost: the room was 55% distinct across a
// season and 39% distinct by sentence shape. Spreading the panel took those to
// 72% and 61% without a word being written.
import { describe, expect, it } from 'vitest';
import { LENS_TAKES, assignLenses, lensRanking } from '../js/social/chat.js';

/** A host record shaped the way `eligibleHosts` builds them. */
const host = (slug, over = {}) => ({
  slug, name: slug, voice: '', expertise: [], wins: 0, bestPlacement: null,
  seasonsPlayed: 2, ...over,
});

/** The trait that used to swallow everybody. */
const beast = n => host(`beast${n}`, { expertise: ['competitions'] });

describe('one trait cannot take the whole panel', () => {
  it('spreads twelve hosts with the same record across angles', () => {
    const panel = Array.from({ length: 12 }, (_, i) => beast(i));
    const lensOf = assignLenses(panel);
    const counts = new Map();
    for (const l of lensOf.values()) counts.set(l, (counts.get(l) || 0) + 1);
    expect(counts.get('challenge-beast') ?? 0,
      'one lens still holds most of the panel').toBeLessThan(panel.length / 2);
    expect(lensOf.size).toBe(12);
  });

  it('caps a lens at what it has words for', () => {
    // Six lines of material does not support six hosts. The cap is derived from
    // the pool, so writing more takes into a lens widens it automatically.
    const panel = Array.from({ length: 20 }, (_, i) => beast(i));
    const counts = new Map();
    for (const l of assignLenses(panel).values()) counts.set(l, (counts.get(l) || 0) + 1);
    for (const [lens, kinds] of Object.entries(LENS_TAKES)) {
      const lines = Object.values(kinds).reduce((n, arr) => n + arr.length, 0);
      expect(counts.get(lens) ?? 0, `${lens} is oversubscribed for ${lines} lines`)
        .toBeLessThanOrEqual(Math.max(1, Math.round(lines / 6)));
    }
  });

  it('gives the strongest claim to the person who has it', () => {
    // Spreading must not mean shuffling: a genuine villain keeps `villain`, and
    // the person who merely lacked another trait is the one who moves.
    const panel = [
      host('vil', { voice: 'ruthless manipulator', expertise: ['competitions'] }),
      ...Array.from({ length: 8 }, (_, i) => beast(i)),
    ];
    expect(assignLenses(panel).get('vil')).toBe('villain');
  });

  it('sends the overflow somewhere WIDER, not somewhere worse', () => {
    // `strategist`, `underdog` and `social` have no takes of their own, so a
    // host on one of them draws from the general pool — which is four times
    // bigger than any lens pool. Overflow landing there is the point, not a
    // consolation.
    const panel = Array.from({ length: 12 }, (_, i) => beast(i));
    const overflow = [...assignLenses(panel).values()].filter(l => !LENS_TAKES[l]);
    expect(overflow.length).toBeGreaterThan(0);
  });
});

describe('the ranking behind it', () => {
  it('offers every lens, best fit first', () => {
    const ranked = lensRanking(host('x', { expertise: ['competitions'] }));
    expect(ranked[0]).toBe('challenge-beast');
    // A second choice must exist, or there is nothing to move somebody to.
    expect(ranked.length).toBeGreaterThan(1);
    expect(new Set(ranked).size).toBe(ranked.length);
  });

  it('always ends somewhere, for a record with no distinguishing trait', () => {
    const ranked = lensRanking(host('nobody'));
    expect(ranked[0]).toBe('social');
  });

  it('does not rank competitions above a genuine villain read', () => {
    // The bug in one line: the old order asked about `competitions` second, so
    // a villain who had also won challenges came out a challenge-beast.
    const ranked = lensRanking(host('v', {
      voice: 'cutthroat schemer', expertise: ['competitions', 'alliances'],
    }));
    expect(ranked[0]).toBe('villain');
  });
});
