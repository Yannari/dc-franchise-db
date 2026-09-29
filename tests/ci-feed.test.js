import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, bump, rel } from '../js/ci/state.js';
import { initMind, mood } from '../js/ci/mind.js';
import { belief } from '../js/ci/beliefs.js';
import { morningFeed, runCircleChat } from '../js/ci/feed.js';

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

describe('the morning feed', () => {
  it('posts one status each, seen by everyone', () => {
    const s = room(['A', 'B', 'C']);
    morningFeed(s, streamFor(1, 'feed'));
    const statuses = s.scenes.filter(x => x.kind === 'status');
    expect(statuses).toHaveLength(3);
    for (const st of statuses) expect(st.seenBy.sort()).toEqual(['@a', '@b', '@c']);
  });

  it('a like warms the liked toward the liker, and is counted', () => {
    const s = room(['A', 'B', 'C']);
    bump('@a', '@b', 'affection', 8);
    morningFeed(s, streamFor(2, 'feed'));
    expect(s.scenes.at(-1).data.likes['@a']).toContain('@b');
    expect(rel('@b', '@a', 'affection')).toBeGreaterThan(0);
    expect(s.likesCount['@b']).toBeGreaterThanOrEqual(1);
  });
});

describe('Circle Chat', () => {
  it('takes a theory public: everyone learns it, the accused resents it', () => {
    const s = room(['A', 'B', 'C', 'D'], { A: { boldness: 10 } });
    belief(s, '@a', '@d').real = 0.1;
    const sc = runCircleChat(s, () => 0, {});
    expect(sc.data.theories[0]).toMatchObject({ by: '@a', about: '@d' });
    const id = sc.data.theories[0].claim;
    for (const h of ['@b', '@c', '@d']) expect(s.know[h][id].from).toBe('@a');
    expect(rel('@d', '@a', 'resentment')).toBeGreaterThan(0);
  });

  it('eases loneliness, a party most of all', () => {
    const quiet = room(['A', 'B']), party = room(['A', 'B']);
    quiet.mind['@a'].loneliness = 8; party.mind['@a'].loneliness = 8;
    runCircleChat(quiet, streamFor(3, 'c'), {});
    runCircleChat(party, streamFor(3, 'c'), { party: true });
    expect(mood(party, '@a', 'loneliness')).toBeLessThan(mood(quiet, '@a', 'loneliness'));
    expect(mood(quiet, '@a', 'loneliness')).toBeLessThan(8);
  });
});
