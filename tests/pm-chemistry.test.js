import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, gs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { RELATIONSHIP_DIMENSIONS, getRelationshipDimension } from '../js/relationships.js';
import { attractionOf, typeFit, ickHit, interestBonus, seedAttraction, attr,
  nudgeAttraction } from '../js/pm/chemistry.js';

const base = (name, gender, over = {}) => ({
  name, gender, sexuality: 'straight', archetype: 'floater',
  stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5,
    boldness: 5, intuition: 5, temperament: 5 },
  type: { looks: [], vibes: ['funny'] }, looks: [], icks: [], interests: ['food', 'travel'],
  bonusInterest: null, ...over,
});

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {} }));

describe('the shared store is widened, not forked', () => {
  it('has a love dimension that defaults to 0', () => {
    expect(RELATIONSHIP_DIMENSIONS).toContain('love');
    expect(getRelationshipDimension('A', 'B', 'love')).toBe(0);
  });
});

describe('attraction', () => {
  it('is null when romanticCompat says no', () => {
    expect(attractionOf(base('A', 'm'), base('B', 'm'), streamFor(1, 'x'))).toBeNull();
    expect(attractionOf(base('A', 'm'), base('A', 'f'), streamFor(1, 'x'))).toBeNull();
  });

  it('a shared bonus interest raises it and an ick lowers it, same spark', () => {
    const me = base('Theo', 'm', { bonusInterest: 'animals' });
    const lover = base('Sam', 'f', { interests: ['animals', 'food'] });
    const other = base('Sam', 'f', { interests: ['gaming', 'fashion'] });
    expect(interestBonus(me, lover)).toBeGreaterThan(interestBonus(me, other));
    expect(attractionOf(me, lover, streamFor(3, 's'))).toBeGreaterThan(attractionOf(me, other, streamFor(3, 's')));
    const picky = base('Priya', 'f', { icks: ['nonchalant'] });
    const flat = base('Jo', 'm', { stats: { ...base('x').stats, boldness: 1, social: 1 } });
    expect(ickHit(picky, flat)).toBeGreaterThan(0.5);
  });

  it('matching the look type raises type fit proportionally', () => {
    const me = base('A', 'f', { type: { looks: ['tall', 'tattoos'], vibes: [] } });
    expect(typeFit(me, base('B', 'm', { looks: ['tall', 'tattoos'] })))
      .toBeGreaterThan(typeFit(me, base('C', 'm', { looks: ['tall'] })));
    expect(typeFit(me, base('C', 'm', { looks: ['tall'] })))
      .toBeGreaterThan(typeFit(me, base('D', 'm', { looks: [] })));
  });

  it('seeds both directions INTO js/relationships.js, one-way each', () => {
    const state = { villa: ['A', 'B'],
      profiles: { A: base('A', 'm'), B: base('B', 'f'), C: base('C', 'f') } };
    seedAttraction(state, 'B', 1);
    state.villa.push('C');
    seedAttraction(state, 'C', 1);
    for (const [a, b] of [['A', 'B'], ['B', 'A'], ['A', 'C'], ['C', 'A']]) {
      expect(attr(state, a, b)).toBeGreaterThanOrEqual(0);
      expect(attr(state, a, b)).toBeLessThanOrEqual(10);
      expect(gs.relationshipDimensions[`${a}→${b}`].attraction).toBe(attr(state, a, b));
    }
    expect(attr(state, 'A', 'B')).not.toBe(attr(state, 'B', 'A'));   // not bilateral
    expect(attr(state, 'B', 'C')).toBeNull();                          // incompatible
    nudgeAttraction(state, 'A', 'B', 50);
    expect(attr(state, 'A', 'B')).toBe(10);
  });
});
