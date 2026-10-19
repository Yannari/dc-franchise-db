// A couple can propose on the mat (the user, 2026-10-19: "couples on the race... maybe a proposal at the finish line").
// Only a couple who are not married or engaged yet, only when they're close, and only after a win: rarely after a leg
// win, more often at the finish. A yes makes them engaged; a 'not yet' costs them.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

function coupleSeason(seed) {
  const { cast, teams } = raceCast(8, seed);
  for (const t of teams) { t.rel = 'dating'; t.identity = null; t.name = `${t.a} & ${t.b}`; }
  setPlayers(cast);
  // close: carried bonds, the way a season starts from the franchise's history
  const res = playRaceSeason({ teams, seed, carried: { sums: teams.map(t => ({ a: t.a, b: t.b, delta: 6 })) } });
  return { res, eps: airSeason(res) };
}

describe('rr proposal', () => {
  it('a close couple who win can propose on the mat; it airs, in their words, and a yes makes them engaged', () => {
    let found = 0;
    for (let seed = 1; seed <= 12 && found < 2; seed++) {
      const { res, eps } = coupleSeason(seed);
      for (const sc of res.state.scenes.filter(s => s.kind === 'proposal')) {
        found++;
        const t = res.state.teams[sc.data.team];
        expect(['dating', 'newly-dating', 'on-off', 'once-engaged']).toContain(t.rel);
        const seg = eps.flatMap(e => e.segments).find(s => s.scene === sc.id);
        expect(seg, 'the proposal aired').toBeTruthy();
        expect(seg.lines.length).toBeGreaterThanOrEqual(4);
        // the leg it happened on, not their history: the premiere, written after the season, still meets a dating couple
        if (sc.data.ending === 'yes') expect(t.engagedAt).toBe(sc.leg);
        else expect(t.engagedAt).toBeFalsy();
        expect(t.history?.engaged).not.toBe(true);
        // after a win: the leg's first team, or the finale's winners
        const leg = res.legs.find(l => l.n === sc.leg);
        expect(leg.order[0]).toBe(sc.data.team);
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it('never between partners who are family, married or already engaged', () => {
    for (const rel of ['married', 'siblings', 'bffs']) {
      const { cast, teams } = raceCast(8, 2);
      for (const t of teams) t.rel = rel;
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed: 2, carried: { sums: teams.map(t => ({ a: t.a, b: t.b, delta: 6 })) } });
      expect(res.state.scenes.filter(s => s.kind === 'proposal').length, rel).toBe(0);
    }
  });
});
