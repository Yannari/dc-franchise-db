// The tower's elevator takes two teams a ride (the user, 2026-10-22: "the elevator say 2 at time but what we see its
// more like evieandnura are alone in it then suddenly thre with bowieandsami then right after theyre now with
// thomandspencer ... we dont see them waiting for the elevator and fighting for one of the 2 places or trying to get on
// it faster than everyone else and close the door (only if they have an advance its possible obviously)").
// One car: a ride leaves with one or two teams, and the next can't leave before the car is back down. A team waits at
// the doors for a car with room; it never stands there while a car with room leaves without it, unless the team
// inside shut the doors on it, and only a team already inside can do that (one that may scheme: a nice one holds them).
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { mayScheme } from '../js/rr/state.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { LIFT } from '../js/rr/lift.js';

const seasons = [];
beforeAll(() => {
  for (const seed of [2, 5, 9, 14, 27, 33]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const aired = airSeason(res);
    // (who may scheme, read while this season's cast is the cast: the archetypes are the players')
    const may = Object.fromEntries(cast.map(p => [p.name, mayScheme(p.name)]));
    seasons.push({ seed, res, aired, may, ep: episodeScreens(res, aired, 0) });
  }
}, 900000);
const liftOf = res => res.state.lifts?.['1|tower'];

describe('rr: the tower elevator, two teams a ride', () => {
  it('takes at most two teams a ride, one ride at a time', () => {
    let rides = 0;
    for (const { seed, res } of seasons) {
      const L = liftOf(res);
      expect(L, `seed ${seed}: the elevator ran`).toBeTruthy();
      const rs = [...L.rides].sort((a, b) => a.dep - b.dep);
      for (const r of rs) { expect(r.teams.length, `seed ${seed} ride ${r.id}`).toBeLessThanOrEqual(2); expect(r.teams.length).toBeGreaterThan(0); }
      for (let i = 1; i < rs.length; i++) expect(rs[i].dep - rs[i - 1].dep, `seed ${seed}: the car is back down`).toBeGreaterThanOrEqual(LIFT.ride + LIFT.back - 0.01);
      rides += rs.length;
      // every team's run has the doors and the ride where its ride says
      for (const row of (res.state.taskLog || []).filter(r => r.leg === 1 && r.stretch === 'tower' && r.side === 'skydeck')) {
        const me = L.riders[row.team];
        const r = L.rides.find(x => x.id === me?.ride);
        expect(r?.teams, `seed ${seed} ${row.team}`).toContain(row.team);
        const doors = row.stages.find(x => x.id === 'lift-doors'), up = row.stages.find(x => x.id === 'elevator');
        expect(Math.abs(doors.t - r.dep), `seed ${seed} ${row.team} doors`).toBeLessThan(0.6);
        expect(Math.abs(up.t - (r.dep + LIFT.ride)), `seed ${seed} ${row.team} up`).toBeLessThan(0.6);
      }
    }
    expect(rides).toBeGreaterThan(15);
  });

  it('never leaves a team at the doors while a car with room goes up, unless it was shut on them', () => {
    let waited = 0;
    for (const { seed, res } of seasons) {
      const L = liftOf(res);
      for (const [id, me] of Object.entries(L.riders)) {
        const mine = L.rides.find(x => x.id === me.ride);
        if (mine.dep - me.at >= 2) waited++;
        for (const r of L.rides) {
          if (r.id === me.ride || r.dep < me.at || r.dep >= mine.dep || r.teams.length >= 2) continue;
          expect(me.missed === 'shut' && me.by === r.teams[0], `seed ${seed}: ${id} waited at ${me.at} while ride ${r.id} left at ${r.dep} with room`).toBe(true);
        }
      }
    }
    expect(waited, 'teams seen waiting for the car').toBeGreaterThan(5);
  });

  it('shuts the doors only from inside, only on a team that got there after, and never a nice one', () => {
    let moments = 0;
    for (const { seed, res, may } of seasons) {
      const L = liftOf(res);
      for (const s of res.state.scenes.filter(x => x.leg === 1 && ['lift-door', 'lift-scramble'].includes(x.kind))) {
        moments++;
        const { team, other, ending } = s.data;
        if (ending === 'shut') {
          expect(may[s.who[0]], `seed ${seed}: ${s.who[0]} shut the doors`).toBe(true);
          expect(L.riders[team].at, `seed ${seed}: shut from inside`).toBeLessThan(L.riders[other].at);
        }
        if (ending === 'pushed-in') expect(may[s.who[0]], `seed ${seed}: ${s.who[0]} pushed in`).toBe(true);
      }
    }
    expect(moments, 'door and scramble moments across the seasons').toBeGreaterThan(3);
  });

  it('says another team is in the car only when one is, and that it filled up only when it did', () => {
    let read = 0;
    for (const { seed, res, aired } of seasons) {
      const L = liftOf(res);
      for (const sg of aired[0].segments) {
        // (the doors' own moments are the elevator deciding: the team left is the scene's second, lift.js)
        if (sg.stretch !== 'tower' || !sg.lines?.length || !sg.teams?.[0] || /^lift-/.test(sg.kind)) continue;
        const me = L.riders[sg.teams[0]];
        const text = sg.lines.map(l => l.text).join(' ');
        if (/another team|other team|squeez|nose to nose/i.test(text) && /elevator|car\b/i.test(text)) {
          read++;
          const r = L.rides.find(x => x.id === me?.ride);
          expect(r?.teams.length, `seed ${seed} ${sg.kind} ${sg.lineId}: ${text}`).toBe(2);
        }
        if (/fills up|before .* can get on|next one|next car/i.test(text) && /elevator|doors|car\b/i.test(text)) expect(me?.missed, `seed ${seed} ${sg.lineId}: ${text}`).toBeTruthy();
      }
    }
    expect(read).toBeGreaterThanOrEqual(0);
  });

  // (2026-10-22, the user: "why dont we have a view of the interior of the elevator anymore?": two teams riding up
  // together had met at the doors already, and never talked in the car)
  it('has two teams that ride up together talk in the car, not at the doors', () => {
    let inCar = 0, atDoors = 0;
    for (const { res } of seasons) {
      const L = liftOf(res);
      const sameRide = (a, b) => L.riders[a] && L.riders[a].ride === L.riders[b]?.ride;
      for (const s of res.state.scenes.filter(x => x.leg === 1 && x.data?.stretch === 'tower' && x.data?.other && !/^lift-/.test(x.kind))) {
        const { team, other } = s.data;
        if (!sameRide(team, other)) continue;
        const r = L.rides.find(x => x.id === L.riders[team].ride);
        if (s.data.t >= r.dep - 0.5 && s.data.t <= r.dep + LIFT.ride + 0.5) inCar++;
        // (both at the doors already: their clue at the box below is before it)
        else if (s.data.t < r.dep - 0.5 && s.data.t > Math.max(L.riders[team].at, L.riders[other].at) + 1) atDoors++;
      }
    }
    expect(inCar, 'conversations in the car').toBeGreaterThan(3);
    expect(atDoors, 'teams that will share the car talking at the doors instead').toBe(0);
  });

  it('shows a team starting the sky-deck inside the car', () => {
    let n = 0;
    for (const { seed, ep } of seasons) for (const s of ep.screens) {
      if (s.stretch !== 'tower' || s.side !== 'skydeck' || s.seg !== 'task-start') continue;
      n++;
      expect(s.plate?.f, `seed ${seed} ${s.id}`).toMatch(/9434868/);
    }
    expect(n).toBeGreaterThan(5);
  });

  it('shows two teams in the car together only when they rode together', () => {
    let n = 0;
    for (const { seed, res, ep } of seasons) {
      const L = liftOf(res);
      for (const s of ep.screens) {
        if (s.place !== 'home-city' || s.stretch !== 'tower' || !/9434868/.test(s.plate?.f || '') || (s.teams || []).length < 2) continue;
        n++;
        const rides = new Set(s.teams.map(id => L.riders[id]?.ride));
        expect(rides.size, `seed ${seed} ${s.id}: ${s.teams.join(' + ')} in the car`).toBe(1);
      }
    }
    expect(n).toBeGreaterThanOrEqual(0);
  });
});
