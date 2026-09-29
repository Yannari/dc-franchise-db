import { describe, expect, it } from 'vitest';
import { newState, addScene } from '../js/ci/state.js';
import { belief, nudgeBelief, setBelief, noteAlly, suspicion } from '../js/ci/beliefs.js';
import { initMind, feel, driftMind, mood } from '../js/ci/mind.js';

function twoPlayers(temperA = 5, temperB = 5) {
  const s = newState(1);
  s.people.A = { name: 'A', archetype: 'floater', stats: { temperament: temperA, intuition: 5, loyalty: 5 } };
  s.people.B = { name: 'B', archetype: 'floater', stats: { temperament: temperB, intuition: 5, loyalty: 5 } };
  s.profiles['@a'] = { handle: '@a', players: ['A'], mode: 'honest', gap: 0 };
  s.profiles['@b'] = { handle: '@b', players: ['B'], mode: 'catfish', gap: 2 };
  s.active = ['@a', '@b'];
  initMind(s, '@a'); initMind(s, '@b');
  return s;
}

describe('beliefs', () => {
  it('starts trusting, less so for a paranoid observer', () => {
    const calm = twoPlayers(9), jumpy = twoPlayers(1);
    expect(belief(calm, '@a', '@b').real).toBeGreaterThan(belief(jumpy, '@a', '@b').real);
    expect(belief(calm, '@a', '@b')).toMatchObject({ threat: 3, likesMe: 0, alliesOf: [], guessOf: null });
  });

  it('only moves for a player who saw the scene, and logs the cause', () => {
    const s = twoPlayers();
    const seen = addScene(s, 'chat', ['@a', '@b']);
    const unseen = addScene(s, 'chat', ['@b'], {}, ['@b']);
    nudgeBelief(s, '@a', '@b', 'real', -0.3, seen);
    expect(suspicion(s, '@a', '@b')).toBeGreaterThan(0.3);
    expect(() => nudgeBelief(s, '@a', '@b', 'real', -0.3, unseen)).toThrow(/did not see/);
    expect(s.beliefLog.at(-1)).toMatchObject({ obs: '@a', target: '@b', field: 'real', scene: seen.id });
  });

  it('clamps each field to its range', () => {
    const s = twoPlayers();
    const sc = addScene(s, 'chat', ['@a', '@b']);
    nudgeBelief(s, '@a', '@b', 'real', -5, sc);
    nudgeBelief(s, '@a', '@b', 'likesMe', 50, sc);
    expect(belief(s, '@a', '@b').real).toBe(0);
    expect(belief(s, '@a', '@b').likesMe).toBe(10);
    setBelief(s, '@a', '@b', 'guessOf', 'a man', sc);
    noteAlly(s, '@a', '@b', '@c', sc);
    noteAlly(s, '@a', '@b', '@c', sc);
    expect(belief(s, '@a', '@b')).toMatchObject({ guessOf: 'a man', alliesOf: ['@c'] });
  });
});

describe('the mind', () => {
  it('gets lonelier every day with nothing to lift it', () => {
    const s = twoPlayers();
    const start = mood(s, '@a', 'loneliness');
    for (let d = 0; d < 5; d++) driftMind(s, '@a');
    expect(mood(s, '@a', 'loneliness')).toBeGreaterThan(start);
  });

  it('lets a calm player feel less of the same blow', () => {
    const s = twoPlayers(10, 1);
    feel(s, '@a', 'stress', 4); feel(s, '@b', 'stress', 4);
    expect(mood(s, '@a', 'stress')).toBeLessThan(mood(s, '@b', 'stress'));
  });

  it('builds guilt in a loyal catfish over the days', () => {
    const s = twoPlayers();
    s.people.B.stats.loyalty = 9;
    for (let d = 0; d < 4; d++) driftMind(s, '@b');
    expect(mood(s, '@b', 'guilt')).toBeGreaterThan(0);
    expect(mood(s, '@a', 'guilt')).toBe(0);
  });
});
