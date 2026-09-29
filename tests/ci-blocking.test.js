import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, bump, rel, makePact } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { belief } from '../js/ci/beliefs.js';
import { isRevealed } from '../js/ci/reveal.js';
import { blockScore, deliberate } from '../js/ci/hangout.js';
import { atRiskOf, standardBlocking, runVisit, deliverReports, goodbyeVideo } from '../js/ci/blocking.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(names, over = {}, modes = {}) {
  const s = newState(1);
  s.day = 4;
  for (const n of names) {
    s.people[n] = { name: n, gender: 'f', sexuality: 'straight', archetype: (over[n] || {}).archetype || 'floater',
      stats: { ...STATS, ...((over[n] || {}).stats || {}) }, age: 25 };
    const h = `@${n.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [n], mode: modes[n] || 'honest', gap: modes[n] === 'catfish' ? 2 : 0,
      tells: [], shown: { gender: 'f', age: 25 } };
    s.active.push(h);
    initMind(s, h);
  }
  return s;
}
const always = v => () => v;

describe('the Hangout', () => {
  it('protects a pact partner', () => {
    const s = room(['I', 'X', 'Y']);
    const before = blockScore(s, '@i', '@x').total;
    makePact(s, 'protect', '@i', '@x');
    expect(blockScore(s, '@i', '@x').total).toBeLessThan(before);
  });

  it('agrees at once when both pick the same player, and gives the reason', () => {
    const s = room(['I', 'J', 'X', 'Y']);
    belief(s, '@i', '@x').real = 0.05; belief(s, '@j', '@x').real = 0.05;
    const d = deliberate(s, streamFor(1, 'h'), ['@i', '@j'], ['@x', '@y']);
    expect(d.target).toBe('@x');
    expect(d.reason).toBe('fake');
    expect(d.yielded).toBeNull();
    expect(d.views.map(v => v.handle).sort()).toEqual(['@x', '@y']);
  });

  it('when they disagree, one of them gives way', () => {
    const s = room(['I', 'J', 'X', 'Y']);
    bump('@i', '@x', 'resentment', 9);
    bump('@j', '@y', 'resentment', 9);
    const d = deliberate(s, streamFor(2, 'h'), ['@i', '@j'], ['@x', '@y']);
    expect(['@i', '@j']).toContain(d.yielded);
    expect(d.target).toBe(d.yielded === '@i' ? '@y' : '@x');
  });
});

describe('the blocking', () => {
  it('spares a newcomer — unless nobody else could go', () => {
    const s = room(['I', 'J', 'N', 'X']);
    s.immuneNext['@n'] = true;
    expect(atRiskOf(s, ['@i', '@j'])).toEqual(['@x']);
    s.immuneNext['@x'] = true;
    expect(atRiskOf(s, ['@i', '@j']).sort()).toEqual(['@n', '@x']);
  });

  it('removes the blocked player, visits, queues the goodbye, and clears immunity', () => {
    const s = room(['I', 'J', 'X', 'Y', 'N']);
    s.immuneNext['@n'] = true;
    const out = standardBlocking(s, streamFor(3, 'b'), { influencers: ['@i', '@j'] });
    expect(s.active).not.toContain(out.target);
    expect(s.blocked.at(-1)).toMatchObject({ handle: out.target, channel: 'influencers', by: ['@i', '@j'] });
    expect(s.pendingGoodbyes).toEqual([out.target]);
    expect(s.immuneNext['@n']).toBeUndefined();
    expect(out.announcement.seenBy).toContain(out.target);
    expect(rel(out.target, '@i', 'resentment')).toBeGreaterThan(0);
  });
});

describe('a tie that crowns everyone', () => {
  it('lets the top two decide when three influencers leave nobody at risk', () => {
    const s = room(['I', 'J', 'K']);
    const out = standardBlocking(s, streamFor(6, 'b'), { influencers: ['@i', '@j', '@k'] });
    expect(out.target).toBe('@k');
    expect(s.active.sort()).toEqual(['@i', '@j']);
  });
});

describe('the visit', () => {
  it('reveals both people to each other and hands over a suspicion', () => {
    const s = room(['X', 'F', 'C'], {}, { C: 'catfish' });
    bump('@x', '@f', 'affection', 9);
    belief(s, '@x', '@c').real = 0.1;
    s.active = ['@f', '@c'];
    const before = belief(s, '@f', '@c').real;
    const sc = runVisit(s, streamFor(4, 'v'), '@x', ['@c']);
    expect(sc.who).toEqual(['@x', '@f']);
    expect(isRevealed(s, '@f', '@x') && isRevealed(s, '@x', '@f')).toBe(true);
    expect(sc.data.handed).toBeTruthy();
    expect(belief(s, '@f', '@c').real).toBeLessThan(before);
  });

  it('a scheming visited player may lie about it the next day', () => {
    const s = room(['X', 'V', 'R', 'A'], { V: { archetype: 'villain', stats: { strategic: 10, loyalty: 1 } } });
    bump('@x', '@v', 'affection', 9);
    bump('@v', '@r', 'resentment', 9);
    bump('@v', '@a', 'affection', 9);
    s.active = ['@v', '@r', '@a'];
    runVisit(s, always(0), '@x', ['@r']);
    expect(s.pendingReports).toHaveLength(1);
    s.day = 5;
    deliverReports(s, always(0));
    const report = s.scenes.find(x => x.kind === 'report');
    expect(report.who).toEqual(['@v', '@a']);
    const c = s.claims.find(x => x.id === report.data.claim);
    expect(c).toMatchObject({ kind: 'visitSaid', holder: '@r', about: '@a' });
    expect(c.origin.by).toBe('@v');
  });
});

describe('the goodbye video', () => {
  it('reveals the truth to everyone and can warn them about someone', () => {
    const s = room(['X', 'A', 'B', 'S']);
    bump('@x', '@s', 'resentment', 9);
    s.active = ['@a', '@b', '@s'];
    const sc = goodbyeVideo(s, streamFor(5, 'g'), '@x');
    for (const h of ['@a', '@b', '@s']) expect(isRevealed(s, h, '@x')).toBe(true);
    expect(sc.data.warning.about).toBe('@s');
    expect(s.know['@a'][sc.data.warning.claim].from).toBe('@x');
    expect(rel('@a', '@s', 'trust')).toBeLessThan(0);
  });
});
