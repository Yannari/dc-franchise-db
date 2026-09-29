import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, bump, makePact } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { belief } from '../js/ci/beliefs.js';
import { styleOf, ballot, results, influencersFrom, revealOrder, ratedPool, runRating } from '../js/ci/ratings.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(names, over = {}) {
  const s = newState(1);
  for (const n of names) {
    s.people[n] = { name: n, gender: 'f', sexuality: 'straight', archetype: 'floater', stats: { ...STATS, ...(over[n] || {}) }, age: 25 };
    const h = `@${n.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [n], mode: 'honest', gap: 0, tells: [], shown: { gender: 'f', age: 25 } };
    s.active.push(h);
    initMind(s, h);
  }
  return s;
}
const B = (voter, order) => ({ voter, order, reasons: [] });

describe('styles and ballots', () => {
  it('reads a style from the strongest leaning', () => {
    const s = room(['L', 'T'], { L: { loyalty: 10 }, T: { strategic: 10 } });
    expect(styleOf(s, '@l')).toBe('heart');
    expect(styleOf(s, '@t')).toBe('strategist');
  });

  it('ranks everyone but the voter, friends high and suspects low', () => {
    const s = room(['A', 'B', 'C', 'D']);
    bump('@a', '@b', 'affection', 9);
    belief(s, '@a', '@d').real = 0.05;
    const b = ballot(s, streamFor(1, 'r'), '@a', ['@a', '@b', '@c', '@d']);
    expect(b.order).not.toContain('@a');
    expect(b.order[0]).toBe('@b');
    expect(b.order.at(-1)).toBe('@d');
    expect(b.reasons).toHaveLength(3);
  });

  it('a loyal voter keeps a rating pact', () => {
    const s = room(['A', 'B', 'C', 'D'], { A: { loyalty: 10 } });
    bump('@a', '@c', 'affection', 4);
    makePact(s, 'rate', '@a', '@d');
    expect(ballot(s, streamFor(2, 'r'), '@a', ['@b', '@c', '@d']).order[0]).toBe('@d');
  });
});

describe('results', () => {
  it('shares a place on a tie and makes three influencers on a tie for second', () => {
    const t = ['@a', '@b', '@c', '@d'];
    // @a is everyone's first (avg 1). @b places 1, 2, 3 and @c places 2, 2, 2:
    // both average 2, a joint second. @d is last everywhere.
    const ballots = [B('@a', ['@b', '@c', '@d']), B('@b', ['@a', '@c', '@d']), B('@c', ['@a', '@b', '@d']), B('@d', ['@a', '@c', '@b'])];
    const res = results(ballots, t);
    expect(res[0]).toMatchObject({ profile: '@a', place: 1, avg: 1, firsts: 3 });
    expect(res.filter(r => r.place === 2).map(r => r.profile).sort()).toEqual(['@b', '@c']);
    expect(res.find(r => r.profile === '@d').place).toBe(4);
    expect(influencersFrom(res).sort()).toEqual(['@a', '@b', '@c']);
  });

  it('reveals from the bottom in pairs, then one at a time, then the influencers', () => {
    const res = ['@1', '@2', '@3', '@4', '@5', '@6', '@7', '@8'].map((p, i) => ({ profile: p, avg: i + 1, place: i + 1, firsts: 0 }));
    expect(revealOrder(res)).toEqual([['@8', '@7'], ['@6', '@5'], ['@4'], ['@3'], ['@1', '@2']]);
  });
});

describe('a rating night', () => {
  it('keeps a newcomer off the board but lets them vote, by default', () => {
    const s = room(['A', 'B', 'C', 'N']);
    s.unratedNext['@n'] = true;
    expect(ratedPool(s)).toEqual({ voters: ['@a', '@b', '@c', '@n'], targets: ['@a', '@b', '@c'] });
    s.options.newcomerRule = 'none';
    expect(ratedPool(s).voters).not.toContain('@n');
    s.options.newcomerRule = 'full';
    expect(ratedPool(s).targets).toContain('@n');
  });

  it('writes a row and a scene everyone saw, names influencers, counts firsts, clears the newcomer flag', () => {
    const s = room(['A', 'B', 'C', 'D', 'E']);
    s.day = 3;
    s.unratedNext['@e'] = true;
    const row = runRating(s, streamFor(3, 'rating'));
    expect(row.influencers.length).toBeGreaterThanOrEqual(2);
    expect(row.targets).not.toContain('@e');
    expect(s.unratedNext['@e']).toBeUndefined();
    const sc = s.scenes.find(x => x.id === row.sceneId);
    expect(sc.kind).toBe('ratings');
    expect(sc.seenBy.sort()).toEqual(['@a', '@b', '@c', '@d', '@e']);
    expect(Object.values(s.firstPlaces).reduce((a, b) => a + b, 0)).toBe(5);
    for (const i of row.influencers) expect(s.influencerCount[i]).toBe(1);
  });

  it('final ratings name no influencers', () => {
    const s = room(['A', 'B', 'C', 'D', 'E']);
    const row = runRating(s, streamFor(9, 'final'), { final: true });
    expect(row.influencers).toEqual([]);
    expect(s.scenes.find(x => x.id === row.sceneId).kind).toBe('final-ratings');
  });

  it('lets a player suspect a pact partner who put them low — rightly or not', () => {
    let inferred = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const s = room(['A', 'B', 'C', 'D', 'E'], { A: { intuition: 10 }, B: { loyalty: 1 } });
      makePact(s, 'rate', '@a', '@b');
      bump('@b', '@c', 'affection', 9); bump('@b', '@d', 'affection', 9);
      bump('@c', '@a', 'resentment', 9); bump('@d', '@a', 'resentment', 9); bump('@e', '@a', 'resentment', 9);
      const row = runRating(s, streamFor(seed * 31, 'rating'));
      inferred += row.inferred.filter(x => x.by === '@a' && x.suspects === '@b').length;
    }
    expect(inferred).toBeGreaterThan(0);
  });
});
