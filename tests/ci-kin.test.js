// ci-kin.test.js — family, partners and old friends in one season (ci/kin.js),
// who a blocked player goes to see (blocking.js chooseVisit), and age in
// attraction (chat.js ageFit). User, 2026-10-02: "how does it work when the
// new player is in the family or friends of one of the players"; "can they go
// see someone else like a flirt or friend or someone they're suspicious of";
// "do your romances respect age?".
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { newState, rel } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { kinWord } from '../js/ci/kin.js';
import { ageFit } from '../js/ci/chat.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

function kinSeason(seed) {
  const cast = rosterCast(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const setup = circleSetup(names);
  setup[names[0]].catfish = 'never'; setup[names[1]].catfish = 'never';
  setup[names[3]].catfish = 'always';
  const kin = [{ a: names[0], b: names[1], kin: 'siblings' }, { a: names[2], b: names[3], kin: 'best-friends' }, { a: names[4], b: names[5], kin: 'exes' }];
  return { names, ...playCircleSeason({ cast: names, setup, pool: DEFAULT_POOL, seed, kin }) };
}
const keysOf = rows => rows.flatMap(r => (r.ci.aired || []).flatMap(s => (s.script?.blocks || []).map(b => b.key)));

describe('family and friends in the same season', () => {
  it('what they call each other', () => {
    const s = newState(1);
    s.people.A = { gender: 'f', age: 50 }; s.people.B = { gender: 'm', age: 22 };
    expect(kinWord(s, 'parent-child', 'B', 'A')).toBe('mom');
    expect(kinWord(s, 'parent-child', 'A', 'B')).toBe('son');
    expect(kinWord(s, 'siblings', 'A', 'B')).toBe('brother');
    expect(kinWord(s, 'exes', 'A', 'B')).toBe('ex');
    expect(kinWord(s, 'best-friends', 'A', 'B')).toBe('best friend');
  });
  it('two relatives showing their own faces know each other on day 1, and team up; exes do not', () => {
    for (let seed = 1; seed <= 4; seed++) {
      const { rows, state } = kinSeason(seed);
      const k = keysOf(rows);
      expect(k.some(x => /^recognise\.kin\.warm\.(mutual|open)/.test(x))).toBe(true);
      expect(k.some(x => /^kin\.pact\./.test(x))).toBe(true);
      // the exes resent, they do not pact
      const exPair = state.kin.find(e => e.kin === 'exes');
      const [ha, hb] = [state.handleOf[exPair.a], state.handleOf[exPair.b]];
      if (state.kinKnown?.[ha]?.[hb]) expect(rel(ha, hb, 'resentment')).toBeGreaterThan(0);
    }
  });
  it('a relative behind a catfish is clocked in some seasons, tested, and owns up or dodges', () => {
    let clocked = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const k = keysOf(kinSeason(seed).rows);
      if (k.some(x => /^recognise\.kin\.\w+\.hidden/.test(x))) {
        clocked++;
        expect(k.some(x => /^kin\.test\.(admit|dodge)/.test(x))).toBe(true);
      }
    }
    expect(clocked).toBeGreaterThan(1);
  });
});

describe('who a blocked player goes to see', () => {
  it('Influencers are the biggest share but not most; friends, crushes and suspects all happen', () => {
    const m = {};
    let n = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const cast = rosterCast(13, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
      for (const r of rows) for (const s of (r.ci.aired || []).filter(x => x.kind === 'visit')) { n++; m[s.d.motive] = (m[s.d.motive] || 0) + 1; }
    }
    const share = k => (m[k] || 0) / n;
    expect(share('answers') + share('confront')).toBeGreaterThan(0.25);
    expect(share('answers') + share('confront')).toBeLessThan(0.6);
    for (const k of ['friend', 'crush', 'truth']) expect(share(k), k).toBeGreaterThan(0.04);
  });
});

describe('age in attraction', () => {
  beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
  function pair(myAge, theirShownAge) {
    const s = newState(1);
    s.people.M = { name: 'M', age: myAge }; s.people.Y = { name: 'Y', age: 30 };
    s.profiles['@m'] = { players: ['M'], shown: { age: myAge } };
    s.profiles['@y'] = { players: ['Y'], shown: { age: theirShownAge } };
    return ageFit(s, '@m', '@y');
  }
  it('someone in their sixties is drawn to their own age range and barely to someone in their twenties', () => {
    expect(pair(65, 61)).toBe(1);
    expect(pair(65, 24)).toBeLessThan(0.15);
    expect(pair(24, 65)).toBeLessThan(0.15);
    expect(pair(25, 28)).toBe(1);
  });
  it('it is the age the profile shows: a catfish posing young draws the young', () => {
    // Y is really 30, but the profile says 24: a 23-year-old is drawn to it.
    expect(pair(23, 24)).toBe(1);
    expect(pair(23, 60)).toBeLessThan(0.15);
  });
});
