// Every team gets its share of a leg, and the leg cuts between them the way the show does (the user, 2026-10-21: "the
// show focusing a lot on the first of the race ... they share much focus until the last screen (chill zone) where all
// the screens are gathered ... every teams should get some focus ... switch focus a little more without losing
// storylines and not just at the end"). Measured before: the top three had three times the screens of the others, the
// leader was followed stage by stage through every challenge, and about two fifths of a leg came after the first
// check-in, most of the back of the pack's racing with it. Now:
//   1. each challenge is its own block: every team's run of it airs before anybody's next challenge;
//   2. a challenge in stages follows a different set of teams each time, never the same team twice in a leg;
//   3. ten teams or fewer: every team has a moment of its own, and the front gets no more than its fair share;
//   4. the Chill Zone cuts back to the teams still out at the last challenge.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { PLACES } from '../js/rr/places.js';

const TASKS = new Set(['either', 'botch', 'allin', 'route', 'superteam']);
const legs = [];
beforeAll(() => {
  for (const seed of [8, 21, 34]) {
    const { cast, teams } = raceCast(10, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const aired = airSeason(res);
    for (let i = 1; i < Math.min(6, res.legs.length); i++) {
      if (res.legs[i].kind === 'final') continue;
      legs.push({ seed, leg: res.legs[i], ep: aired[i], state: res.state });
    }
  }
}, 600000);

const tasksOf = place => (PLACES[place]?.stretches || []).filter(s => TASKS.has(s.kind)).map(s => s.id);
const BEATS = new Set(['task-start', 'task-try', 'task-done', 'task-stage', 'task-montage', 'ride', 'don-place', 'mat-montage', 'team-intro']);
const own = seg => !BEATS.has(seg.kind) && !seg.kind.startsWith('don-');

describe('rr: the leg cuts between its teams', () => {
  it('airs every team\'s run of a challenge before anybody\'s next challenge', () => {
    const bad = [];
    for (const { seed, leg, ep } of legs) {
      const ts = tasksOf(leg.place), segs = ep.segments;
      for (let j = 1; j < ts.length; j++) {
        const next = segs.findIndex(s => s.stretch === ts[j]);
        if (next < 0) continue;
        // (a team Don goes out to on the road is the leg's ending: what it still did airs with the check-ins, rr-road-exit)
        const late = segs.slice(next).filter(s => s.stretch === ts[j - 1] && s.kind !== 'don-demo' && !s.teams.every(id => leg.how?.[id] === 'on-location'));
        if (late.length) bad.push(`seed ${seed} leg ${leg.n}: ${late.length} at ${ts[j - 1]} after ${ts[j]} began`);
      }
    }
    expect(bad).toEqual([]);
  });

  // (twice only when nobody else ran it in stages: an Either/Or whose staged side only teams already followed took)
  it('follows a different set of teams through each challenge in stages, none twice in a leg', () => {
    const bad = [];
    let leaderEvery = 0, staged = 0;
    for (const { seed, leg, ep, state } of legs) {
      const by = {};
      for (const s of ep.segments.filter(s => s.kind === 'task-stage')) (by[s.stretch] ||= new Set()).add(s.teams[0]);
      const sets = Object.entries(by);
      if (!sets.length) continue;
      staged++;
      const seen = new Set();
      for (const [sid, set] of sets) {
        const ran = (state.taskLog || []).filter(r => r.leg === leg.n && r.stretch === sid && r.stages?.length).map(r => r.team);
        for (const id of set) if (seen.has(id) && ran.some(x => !seen.has(x))) bad.push(`seed ${seed} leg ${leg.n}: ${id} followed twice`);
        for (const id of set) seen.add(id);
      }
      if (sets.every(([, set]) => set.has(leg.order[0]))) leaderEvery++;
    }
    expect(bad).toEqual([]);
    expect(staged).toBeGreaterThan(3);
    expect(leaderEvery).toBeLessThan(staged / 2);
  });

  it('gives every team a moment of its own when ten teams or fewer race', () => {
    const bad = [];
    for (const { seed, leg, ep, state } of legs) {
      for (const id of leg.order) {
        if (ep.segments.some(s => own(s) && s.teams.includes(id))) continue;
        // (only a team the leg had something for: a moment of its own that was there to air)
        const had = state.scenes.some(s => s.leg === leg.n && !BEATS.has(s.kind) && !s.kind.startsWith('don-') && !s.kind.startsWith('int-')
          && (s.data?.team === id || s.data?.other === id));
        if (had) bad.push(`seed ${seed} leg ${leg.n}: ${id} (${leg.order.indexOf(id) + 1}th)`);
      }
    }
    expect(bad).toEqual([]);
  });

  // (measured over twenty legs: the least-seen team had 2.75 moments of its own a leg, and 38% of the optional moments
  // were between two teams; with the fair share 3.6 and 50%, from the same number of moments)
  it('picks the spare moments for the teams seen least, and for moments between two teams', () => {
    let least = 0, inter = 0, optional = 0;
    for (const { leg, ep } of legs) {
      least += Math.min(...leg.order.map(id => ep.segments.filter(s => s.teams.includes(id) && own(s)).length));
      for (const s of ep.segments) if (own(s) && !s.kind.startsWith('int-') && s.kind !== 'same-flight') { optional++; if (s.teams.length > 1) inter++; }
    }
    expect(least / legs.length).toBeGreaterThanOrEqual(3.2);
    expect(inter / optional).toBeGreaterThanOrEqual(0.45);
  });

  // (counted before the first check-in: a team behind used to wait for the Chill Zone to be seen at all)
  it('shares the leg before the Chill Zone: the top three get no more than a third again the others\' moments', () => {
    let top = 0, rest = 0, nTop = 0, nRest = 0;
    for (const { leg, ep } of legs) {
      const firstIn = ep.segments.findIndex(s => s.kind === 'don-place' || s.kind === 'mat-montage');
      const body = firstIn < 0 ? ep.segments : ep.segments.slice(0, firstIn);
      for (const [r, id] of leg.order.entries()) {
        const n = body.filter(s => s.teams.includes(id)).length;
        if (r < 3) { top += n; nTop++; } else { rest += n; nRest++; }
      }
    }
    expect(top / nTop).toBeLessThan(1.33 * (rest / nRest));
  });

  it('cuts back from the Chill Zone to the teams still out at the last challenge, and sees each of them there before it', () => {
    let cut = 0, could = 0;
    const bad = [];
    for (const { seed, leg, ep } of legs) {
      const ts = tasksOf(leg.place), lastT = ts.at(-1), segs = ep.segments;
      const firstIn = segs.findIndex(s => s.kind === 'don-place' || s.kind === 'mat-montage');
      if (firstIn < 0 || !lastT) continue;
      const after = segs.slice(firstIn).filter(s => s.stretch === lastT && s.kind.startsWith('task-'));
      const late = (leg.log || []).filter(l => l.stretch === lastT && l.to > (leg.log.find(x => x.stretch === 'mat' && x.id === leg.order[0])?.from ?? Infinity));
      if (late.length) { could++; if (after.length) cut++; }
      for (const s of after) {
        const id = s.teams[0];
        if (leg.how?.[id] === 'on-location') continue;
        if (!segs.slice(0, firstIn).some(x => x.stretch === lastT && x.teams.includes(id))) bad.push(`seed ${seed} leg ${leg.n}: ${id} first seen at ${lastT} after the mat opened`);
      }
    }
    expect(bad).toEqual([]);
    expect(could).toBeGreaterThan(3);
    expect(cut).toBeGreaterThan(could * 0.6);
  });
});
