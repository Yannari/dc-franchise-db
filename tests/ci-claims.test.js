import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { newState, addScene, bump, rel } from '../js/ci/state.js';
import { belief } from '../js/ci/beliefs.js';
import { initMind } from '../js/ci/mind.js';
import { makeClaim, learn, knows, passOnWeight, contradictions, claimById } from '../js/ci/claims.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

function room() {
  const s = newState(1);
  for (const n of ['A', 'B', 'C', 'D']) {
    s.people[n] = { name: n, archetype: 'floater', stats: { temperament: 5, intuition: 5, loyalty: 5 } };
    s.profiles[`@${n.toLowerCase()}`] = { handle: `@${n.toLowerCase()}`, players: [n], mode: 'honest', gap: 0 };
    initMind(s, `@${n.toLowerCase()}`);
  }
  s.active = ['@a', '@b', '@c', '@d'];
  return s;
}

describe('claims', () => {
  it('hurts more when a trusted friend says it', () => {
    const s = room();
    bump('@c', '@a', 'trust', 8);   // C trusts A
    bump('@d', '@b', 'trust', -8);  // D distrusts B
    const c1 = makeClaim(s, { kind: 'distrusts', holder: '@x', about: '@c', truth: true, by: '@a' });
    const c2 = makeClaim(s, { kind: 'distrusts', holder: '@x', about: '@d', truth: true, by: '@b' });
    learn(s, '@c', c1, '@a', addScene(s, 'chat', ['@a', '@c']));
    learn(s, '@d', c2, '@b', addScene(s, 'chat', ['@b', '@d']));
    expect(belief(s, '@c', '@x').likesMe).toBeLessThan(belief(s, '@d', '@x').likesMe);
  });

  it('is learned once and remembers who said it', () => {
    const s = room();
    const c = makeClaim(s, { kind: 'catfish', holder: '@a', about: '@d', truth: false, by: '@a' });
    const sc = addScene(s, 'chat', ['@a', '@b']);
    const before = belief(s, '@b', '@d').real;
    expect(learn(s, '@b', c, '@a', sc)).toBe(true);
    expect(learn(s, '@b', c, '@a', sc)).toBe(false);
    expect(knows(s, '@b', c.id)).toBe(true);
    expect(s.know['@b'][c.id]).toEqual({ from: '@a', day: 0 });
    expect(belief(s, '@b', '@d').real).toBeLessThan(before);
    expect(claimById(s, c.id)).toBe(c);
  });

  it('is repeated to its target more readily than to a stranger, and never if it is public', () => {
    const s = room();
    bump('@b', '@c', 'affection', 5);
    bump('@b', '@d', 'affection', 5);
    const c = makeClaim(s, { kind: 'distrusts', holder: '@a', about: '@c', truth: true, by: '@a' });
    expect(passOnWeight(s, '@b', c, '@c')).toBeGreaterThan(passOnWeight(s, '@b', c, '@d'));
    const pub = makeClaim(s, { kind: 'catfish', holder: '@a', about: '@c', truth: false, secrecy: 'public', by: '@a' });
    expect(passOnWeight(s, '@b', pub, '@c')).toBe(0);
  });

  it('finds two stories that cannot both be true', () => {
    const s = room();
    const saved = makeClaim(s, { kind: 'saved', holder: '@a', about: '@c', truth: false, by: '@a' });
    const target = makeClaim(s, { kind: 'targeting', holder: '@a', about: '@c', truth: true, by: '@b' });
    const sc = addScene(s, 'chat', ['@a', '@b', '@c']);
    learn(s, '@c', saved, '@a', sc);
    expect(contradictions(s, '@c')).toEqual([]);
    learn(s, '@c', target, '@b', sc);
    expect(contradictions(s, '@c')).toEqual([{ a: saved, b: target }]);
  });

  it('makes a third party trust the one being warned about a little less', () => {
    const s = room();
    bump('@c', '@a', 'trust', 6);
    const c = makeClaim(s, { kind: 'distrusts', holder: '@a', about: '@d', truth: true, secrecy: 'public', by: '@a' });
    learn(s, '@c', c, '@a', addScene(s, 'goodbye', ['@a'], {}, ['@c', '@d']));
    expect(rel('@c', '@d', 'trust')).toBeLessThan(0);
  });

  it('makes a hero who is told they were saved feel they owe it', () => {
    const s = room();
    const c = makeClaim(s, { kind: 'saved', holder: '@a', about: '@c', truth: true, by: '@a' });
    learn(s, '@c', c, '@a', addScene(s, 'chat', ['@a', '@c']));
    expect(rel('@c', '@a', 'obligation')).toBeGreaterThan(0);
  });
});
