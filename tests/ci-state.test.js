import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { newState, addScene, clamp, rel, bump, S, schemeEligible, peopleOf, isActive, makePact } from '../js/ci/state.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

describe('ci state', () => {
  it('starts empty, JSON-clean, with the default options', () => {
    const s = newState(9, { finalists: 4 });
    expect(s.options).toEqual({ pickBy: 'stats', newcomerRule: 'rate-not-rated', finalists: 4, days: null });
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('numbers scenes and defaults seenBy to who', () => {
    const s = newState(1);
    s.day = 3;
    const a = addScene(s, 'chat', ['@a', '@b'], { intent: 'bond' });
    const b = addScene(s, 'goodbye', ['@c'], {}, ['@a', '@b', '@d']);
    expect(a).toMatchObject({ id: 1, day: 3, kind: 'chat', who: ['@a', '@b'], seenBy: ['@a', '@b'], aired: true });
    expect(b.seenBy).toEqual(['@a', '@b', '@d']);
    expect(s.scenes).toHaveLength(2);
  });

  it('keeps relationships in the shared store, keyed by handle', () => {
    bump('@a', '@b', 'trust', 4);
    expect(rel('@a', '@b', 'trust')).toBe(4);
    expect(rel('@b', '@a', 'trust')).toBe(0);
    expect(clamp(12, -10, 10)).toBe(10);
  });

  it('reads a shared profile\'s stats as the mean of its players, and eligibility as all of them', () => {
    const s = newState(1);
    s.people.A = { name: 'A', archetype: 'villain', stats: { strategic: 8, loyalty: 2 } };
    s.people.B = { name: 'B', archetype: 'hero', stats: { strategic: 4, loyalty: 8 } };
    s.profiles['@ab'] = { handle: '@ab', players: ['A', 'B'] };
    s.profiles['@a'] = { handle: '@a', players: ['A'] };
    s.active = ['@a'];
    expect(S(s, '@ab', 'strategic')).toBe(6);
    expect(schemeEligible(s, '@a')).toBe(true);
    expect(schemeEligible(s, '@ab')).toBe(false);
    expect(peopleOf(s, '@ab')).toEqual(['A', 'B']);
    expect(isActive(s, '@a')).toBe(true);
    expect(isActive(s, '@ab')).toBe(false);
    expect(makePact(s, 'rate', '@a', '@ab')).toBe('k1');
    expect(s.pacts[0]).toEqual({ id: 'k1', kind: 'rate', a: '@a', b: '@ab', day: 0, kept: [] });
  });

  it('builds deterministic casts and pools', () => {
    expect(makePlayers(10, 3)).toEqual(makePlayers(10, 3));
    expect(makePlayers(10, 3)).toHaveLength(10);
    const pool = makePool(6, 3);
    expect(pool).toHaveLength(6);
    expect(new Set(pool.map(p => p.handle)).size).toBe(6);
    const setup = circleSetup(makePlayers(12, 3).map(p => p.name), { newcomers: 4 });
    expect(Object.values(setup).filter(x => x.role === 'newcomer')).toHaveLength(4);
  });
});
