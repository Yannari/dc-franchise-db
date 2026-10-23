// A challenge that is a ride or a journey along a path (the zipline over the lake, a raft, a swim, a tightrope) is seen
// being done by every team that does it (the user, 2026-10-22: "we dont see them zipline anymore in the home city
// challenge often when u use a new plate u erase a part of the challenge"). A new background for its start, the
// zipline's launch platform, had the checkpoint shot there, and a clean team was seen half the time only arriving at the
// start, standing on the platform; a team followed briefly was seen only landing.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { stretchPlates } from '../js/vp-rr-ep/plates.js';
import { PLACES } from '../js/rr/places.js';

const TASKS = ['allin', 'botch', 'either', 'route', 'superteam'];
// every challenge done along a path, its side for an Either/Or
const RIDES = Object.values(PLACES).flatMap(p => p.stretches.filter(s => TASKS.includes(s.kind))
  .flatMap(s => (s.sides ? s.sides.map(d => d.id) : [null]).filter(side => stretchPlates(p.id, s.id, side)?.act?.path).map(side => [p.id, s.id, side])));
const runs = [];
beforeAll(() => {
  const places = [...new Set(RIDES.map(([p]) => p))].filter(p => !PLACES[p].start);
  const plan = [[2, []]];
  for (let i = 0; i < places.length; i += 10) plan.push([71 + i, places.slice(i, i + 10)]);
  for (const [seed, chunk] of plan) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { pins: Object.fromEntries(chunk.map((p, k) => [k + 2, p])) } });
    const aired = airSeason(res);
    runs.push({ seed, res, eps: aired.map((_, i) => episodeScreens(res, aired, i)) });
  }
}, 1800000);

describe('rr: a ride is seen being ridden', () => {
  it('shows every team that did a challenge along a path doing it', () => {
    let teams = 0;
    const unseen = [];
    for (const { seed, res, eps } of runs) res.legs.forEach((leg, i) => {
      const ep = eps[i];
      if (!ep) return;
      for (const [p, s, side] of RIDES.filter(([p]) => p === leg.place)) {
        const doing = new Set(ep.screens.filter(x => x.stretch === s && x.mode === 'act' && (!side || x.side === side)).flatMap(x => x.teams || []));
        // (not a team Don found out on the course: what it did after he sent it home doesn't air)
        for (const r of (res.state.taskLog || []).filter(x => x.leg === leg.n && x.stretch === s && !x.quit && (!side || x.side === side) && !x.switched
          && !(leg.onLocation || []).includes(x.team))) {
          teams++;
          if (!doing.has(r.team)) unseen.push(`seed ${seed} ${p}/${s}${side ? ':' + side : ''}: ${r.team}`);
        }
      }
    });
    expect(teams).toBeGreaterThan(100);
    expect(unseen.slice(0, 15)).toEqual([]);
  });
});
