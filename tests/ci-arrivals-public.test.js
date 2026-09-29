import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, addScene, rel } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { arrive } from '../js/ci/arrivals.js';
import { openLedger, noteJoin, airDay, fanFavorite, sceneApproval } from '../js/ci/public.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(names, active = names) {
  const s = newState(1);
  s.day = 3;
  for (const n of names) {
    s.people[n] = { name: n, gender: 'f', sexuality: 'straight', archetype: 'floater', stats: { ...STATS }, age: 25 };
    const h = `@${n.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [n], mode: 'honest', gap: 0, reason: null, tells: [], shown: { gender: 'f', age: 25 } };
  }
  for (const n of active) { const h = `@${n.toLowerCase()}`; s.active.push(h); initMind(s, h); }
  return s;
}

describe('newcomers', () => {
  it('join immune and unrated, announced to everyone, and pick one player for the after-party', () => {
    const s = room(['A', 'B', 'N'], ['A', 'B']);
    arrive(s, streamFor(3, 'arrive'), ['@n']);
    expect(s.active).toContain('@n');
    expect(s.immuneNext['@n']).toBe(true);
    expect(s.unratedNext['@n']).toBe(true);
    expect(s.joinedDay['@n']).toBe(3);
    expect(s.mind['@n']).toBeTruthy();
    const arrival = s.scenes.find(x => x.kind === 'arrival');
    expect(arrival.seenBy.sort()).toEqual(['@a', '@b', '@n']);
    const party = s.scenes.find(x => x.kind === 'after-party');
    const pick = party.data.chosen;
    expect(['@a', '@b']).toContain(pick);
    expect(rel('@n', pick, 'affection')).toBeGreaterThan(0);
    expect(rel(pick, '@n', 'affection')).toBeGreaterThan(0);
  });
});

describe('the public', () => {
  it('rewards a warm check-in and punishes a planted rumour', () => {
    const s = room(['A', 'B', 'C']);
    const kind = addScene(s, 'chat', ['@a', '@b'], { intent: 'checkin', ending: 'warm' });
    const mean = addScene(s, 'chat', ['@c', '@b'], { intent: 'plant', ending: 'warm' });
    expect(sceneApproval(s, kind)['@a']).toBeGreaterThan(0);
    expect(sceneApproval(s, mean)['@c']).toBeLessThan(0);
  });

  it('feels for an honest player blocked for being "fake"', () => {
    const s = room(['A', 'B']);
    const sc = addScene(s, 'blocking', ['@a', '@b'], { target: '@b', reason: 'fake' });
    expect(sceneApproval(s, sc)['@b']).toBeGreaterThan(sceneApproval(s, addScene(s, 'blocking', ['@a', '@b'], { target: '@b', reason: 'threat' }))['@b']);
  });

  it('airs today\'s scenes into the ledger and names a Fan Favorite', () => {
    const s = room(['A', 'B', 'C']);
    openLedger(s);
    for (const h of s.active) noteJoin(s, h);
    for (let i = 0; i < 4; i++) addScene(s, 'chat', ['@a', '@b'], { intent: 'checkin', ending: 'warm' });
    addScene(s, 'chat', ['@c', '@b'], { intent: 'plant', ending: 'warm' });
    const out = airDay(s);
    expect(out.A.approval).toBeGreaterThan(out.C.approval);
    expect(out.A.fame).toBeGreaterThan(0);
    expect(fanFavorite(s)).toBe('A');
  });
});
