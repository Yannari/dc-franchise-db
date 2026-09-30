import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { playCircleSeason, applyCarried } from '../js/ci/season.js';
import { placementsOf } from '../js/ci/finale.js';
import { newState, rel } from '../js/ci/state.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

function play(n = 13, seed = 5, { newcomers = 5, pool = makePool(6, seed), options = {} } = {}) {
  const cast = makePlayers(n, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers }), pool, options, seed });
}

describe('a whole season', () => {
  it('plays to a winner with five finalists, one row a day, stamped with the format', () => {
    const { rows, state, result } = play();
    expect(rows.length).toBe(13);
    for (const r of rows) expect(r.format).toBe('the-circle');
    expect(gs.episodeHistory).toHaveLength(rows.length);
    expect(state.active).toHaveLength(5);
    expect(state.blocked).toHaveLength(8);
    expect(result.placements.map(p => p.profile).sort()).toEqual([...state.active].sort());
    expect(result.winner.place).toBe(1);
    expect(Object.keys(state.people)).toContain(result.fanFavorite);
  });

  it('reveals every finalist to every other at the meet', () => {
    const { state } = play();
    for (const a of state.active) for (const b of state.active) {
      if (a !== b) expect(state.revealed[a]?.[b]).toBe(true);
    }
  });

  it('plays nothing on finale day but the meet and the placements', () => {
    const { state, rows } = play();
    const last = rows.at(-1).day;
    expect([...new Set(state.scenes.filter(s => s.day === last).map(s => s.kind))].sort()).toEqual(['meet', 'reveal']);
  });

  it('replays identically from its seed, and a persona\'s bio changes nothing', () => {
    const one = play(13, 11);
    const two = play(13, 11);
    expect(JSON.stringify(two.rows)).toBe(JSON.stringify(one.rows));
    const pool = makePool(6, 11).map(p => ({ ...p, bio: 'rewritten by the author' }));
    const three = play(13, 11, { pool });
    // The row shows each profile's bio (the arrival screens); the game is the rest.
    const game = rows => JSON.stringify(rows, (k, v) => (k === 'bio' ? undefined : v));
    expect(game(three.rows)).toBe(game(one.rows));
  });

  for (const [n, newcomers] of [[7, 2], [18, 10]]) {
    it(`finishes a ${n}-player season with five`, () => {
      const { state } = play(n, 3, { newcomers });
      expect(state.active).toHaveLength(5);
    });
  }

  it('plays with an empty Catfish Pool', () => {
    const { state } = play(13, 6, { pool: [] });
    expect(Object.values(state.profiles).some(p => p.mode === 'catfish')).toBe(false);
    expect(state.active).toHaveLength(5);
  });

  it('keeps state plain JSON', () => {
    const { state } = play(10, 2, { newcomers: 3 });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});

describe('the finale', () => {
  it('breaks a tie in the final ratings on first places over the season', () => {
    const s = newState(1);
    s.profiles = { '@a': { players: ['A'] }, '@b': { players: ['B'] } };
    s.firstPlaces = { '@a': 2, '@b': 5 };
    const p = placementsOf(s, { results: [{ profile: '@a', avg: 1.5 }, { profile: '@b', avg: 1.5 }] });
    expect(p[0]).toMatchObject({ profile: '@b', place: 1, people: ['B'] });
  });
});

describe('carried bonds', () => {
  it('lets an honest alum\'s old grudge walk in, but not through a catfish\'s face', () => {
    setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });   // no numbers left from a played season
    const s = newState(1);
    s.people = { A: { name: 'A' }, B: { name: 'B' }, C: { name: 'C' } };
    s.profiles = {
      '@a': { handle: '@a', players: ['A'], mode: 'honest', shown: {} },
      '@b': { handle: '@b', players: ['B'], mode: 'honest', shown: {} },
      '@kate': { handle: '@kate', players: ['C'], mode: 'catfish', shown: {} },
    };
    s.handleOf = { A: '@a', B: '@b', C: '@kate' };
    applyCarried(s, { sums: [{ a: 'A', b: 'B', delta: -6 }, { a: 'A', b: 'C', delta: -6 }] });
    expect(rel('@a', '@b', 'affection')).toBeLessThan(0);
    expect(rel('@a', '@kate', 'affection')).toBe(0);     // A has no idea Kate is C
    expect(rel('@kate', '@a', 'affection')).toBeLessThan(0);  // C knows exactly who A is
  });
});

describe('games, parties and apartment life in a season (Plan 3a)', () => {
  it('plays a game on every game day, a party on every party day, and videos from home', () => {
    const { rows, state } = play();
    const sched = rows.map(r => r.day);
    const gamesOn = new Set(state.scenes.filter(s => s.kind === 'game').map(s => s.day));
    const partiesOn = new Set(state.scenes.filter(s => s.kind === 'party').map(s => s.day));
    const days = state.schedule;
    for (const d of days) {
      if (d.game) expect(gamesOn.has(d.day), `game on day ${d.day}`).toBe(true);
      if (d.party) expect(partiesOn.has(d.day), `party on day ${d.day}`).toBe(true);
      if (d.final || d.finale) expect(gamesOn.has(d.day)).toBe(false);
    }
    expect(new Set(state.gamesPlayed).size).toBe(state.gamesPlayed.length);
    const homeDay = days.find(d => d.homeVideos).day;
    const videos = state.scenes.filter(s => s.kind === 'home-video');
    for (const h of state.scenes.find(s => s.day === homeDay && s.kind === 'status')?.seenBy || []) {
      expect(videos.some(v => v.who[0] === h && v.day <= homeDay)).toBe(true);
    }
    expect(state.scenes.filter(s => s.kind === 'life').length).toBeGreaterThanOrEqual(sched.length);
  });
});

// Plan 4: re-running an episode turns that day's dice again, and only that day's.
import { makePlayers as _mp, makePool as _pool, circleSetup as _setup } from './helpers/ci-cast.js';
import { setPlayers as _sp } from '../js/core.js';
import { playCircleSeason as _play } from '../js/ci/season.js';
describe('re-running an episode', () => {
  it('leaves every earlier day identical and deals the re-run day again', () => {
    const cast = _mp(13, 4); _sp(cast);
    const names = cast.map(p => p.name);
    const sig = r => JSON.stringify([r.ci.blocked, r.ci.aired.map(s => [s.kind, s.who])]);
    const a = _play({ cast: names, setup: _setup(names, { newcomers: 5 }), pool: _pool(6, 4), seed: 4, options: { script: false } });
    const b = _play({ cast: names, setup: _setup(names, { newcomers: 5 }), pool: _pool(6, 4), seed: 4, options: { script: false, rerolls: { 4: 1 } } });
    for (let d = 0; d < 3; d++) expect(sig(b.rows[d])).toBe(sig(a.rows[d]));
    expect(sig(b.rows[3])).not.toBe(sig(a.rows[3]));
  });
});
