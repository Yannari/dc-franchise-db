// The Ridonculous Race: what the Don writer's read found (dialogue plan, Task 8).
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { rolesOf } from '../js/rr/script/roles.js';
import { factsFor } from '../js/rr/script/facts.js';
import { POOLS } from '../js/rr/script/lines/index.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr: Don, the twists, and fair picking', () => {
  let res, vote;
  beforeAll(() => {
    const { cast, teams } = raceCast(12, 3);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 3, options: { twists: { 3: 'boomerang', 5: 'boomerang-vote', 7: 'yield' } } });
    airSeason(res);
    const { cast: c2, teams: t2 } = raceCast(10, 8);
    setPlayers(c2);
    vote = playRaceSeason({ teams: t2, seed: 8, options: { twists: { 3: 'boomerang-vote' } } });
    setPlayers(cast);
  });

  it("Don's rule speech knows which twist it is", () => {
    const st = res.state;
    const rules = st.scenes.filter(s => s.kind === 'don-rule');
    expect(rules.length).toBeGreaterThan(0);
    for (const s of rules) expect(['boomerang', 'yield', 'boomerang-vote']).toContain(factsFor(s, rolesOf(s, st), st).rule);
  });

  it('when everybody picks one team, that team is cast first, and its trip back knows why', () => {
    const st = vote.state;
    const sc = st.scenes.find(s => s.kind === 'boomerang-vote');
    expect(sc).toBeTruthy();
    const t = st.teams[sc.data.target];
    expect([t.a, t.b]).toContain(sc.who[0]);
    const hit = st.scenes.find(s => s.kind === 'boomerang-hit' && s.data.team === sc.data.target);
    if (hit) expect(factsFor(hit, rolesOf(hit, st), st).byVote).toBe(true);
  });

  it("Don's mat lines know the placing, and he isn't always plain", () => {
    const st = res.state;
    const places = st.scenes.filter(s => s.kind === 'don-place');
    for (const s of places) expect(['first', 'top', 'mid', 'bottom', 'last']).toContain(s.data.matPlace);
    const endings = new Set(places.map(s => s.data.ending));
    expect(endings.size).toBeGreaterThanOrEqual(3);
  });

  it('no entry airs far more often than the rest of its pool', () => {
    const uses = res.state.lineLedger.uses;
    for (const [k, list] of Object.entries(POOLS)) {
      const counts = list.map(e => uses[e.id] || 0);
      const total = counts.reduce((a, b) => a + b, 0);
      if (total < 10) continue;
      const mean = total / list.length;
      for (const [i, n] of counts.entries()) expect(n, `${k} ${list[i].id}: ${n} of ${total}`).toBeLessThanOrEqual(Math.ceil(mean * 3) + 2);
    }
  });
});
