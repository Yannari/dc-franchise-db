// A penalty is told, and so is what it cost (the user, 2026-10-22: "we just passed from 2nd to 8th for no reason what
// happened??"). Natalia and Grett were caught turning a sign: Don stopped them on the course for "twenty minutes, right
// here, next to me", which was twenty minutes ON TOP of the hour every caught sabotage sits out at the Chill Zone; at
// the mat Don said "that little stool is for you", and the next anyone heard of them was eighth on the results card.
// What Don says is the penalty, served once, at the mat; and when it is served the team checks in, in its real place.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const seasons = [];
beforeAll(() => {
  for (const seed of [41, 42, 43, 44, 45, 46]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    seasons.push({ seed, res, eps: airSeason(res) });
  }
}, 600000);

describe('rr: a penalty is told, and so is what it cost', () => {
  it("Don's ruling on a caught sabotage adds no time of its own: the hour at the mat is the penalty", () => {
    let rulings = 0;
    const extra = [];
    for (const { seed, res } of seasons) for (const s of res.state.scenes.filter(x => x.kind === 'don-ruling')) {
      rulings++;
      if ((s.data.effects || []).some(e => e[0] === 'time')) extra.push(`seed ${seed} leg ${s.leg} ${s.data.ending}`);
    }
    expect(rulings).toBeGreaterThan(0);
    expect(extra).toEqual([]);
  });

  it('a team that serves a penalty at the mat checks in once it is served, in its real place, and that airs', () => {
    let served = 0;
    const missing = [];
    for (const { seed, res, eps } of seasons) res.legs.forEach((leg, i) => {
      if (leg.kind === 'final') return;
      for (const [id, p] of Object.entries(leg.penalties || {})) {
        if (!p || leg.eliminated?.includes(id) || leg.nonElim?.id === id) continue;
        served++;
        const place = leg.order.indexOf(id) + 1;
        const sc = res.state.scenes.find(s => s.leg === leg.n && s.kind === 'don-place' && s.data.team === id && s.data.ending === 'penalty-served');
        if (!sc) { missing.push(`seed ${seed} leg ${leg.n} ${id}: no check-in`); continue; }
        if (sc.data.place !== place || Math.round(sc.data.t) !== Math.round(leg.times[id])) missing.push(`seed ${seed} leg ${leg.n} ${id}: place ${sc.data.place}/${place} t ${sc.data.t}/${leg.times[id]}`);
        // the reveal says where they'd have been: their place on arrival, not the one after the penalty
        const rev = res.state.scenes.find(s => s.leg === leg.n && s.kind === 'don-place' && s.data.team === id && s.data.ending === 'penalty-reveal');
        const arrived = Object.keys(leg.times).filter(x => leg.times[x] - (leg.penalties[x] || 0) < leg.times[id] - p).length + 1;
        if (!rev || rev.data.place !== arrived) missing.push(`seed ${seed} leg ${leg.n} ${id}: reveal place ${rev?.data.place} not ${arrived}`);
        const aired = eps[i].segments.some(g => g.kind === 'don-place' && g.ending === 'penalty-served' && g.teams?.includes(id));
        if (!aired) missing.push(`seed ${seed} leg ${leg.n} ${id}: check-in not aired`);
      }
    });
    expect(served).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
});
