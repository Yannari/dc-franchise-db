// The Ridonculous Race: the talk layer, at every stretch, overlap and wait (engine plan, Task 15).
import { describe, it, expect, beforeAll } from 'vitest';
import { talkAtStretch, talkAtOverlap, talkAtWait, closeLegTalk } from '../js/rr/talk.js';
import { playScene, SCENES } from '../js/rr/scenes.js';
import { runLeg } from '../js/rr/clock.js';
import { getPlace } from '../js/rr/places.js';
import { streamFor } from '../js/dr/rng.js';
import { setGs } from '../js/core.js';
import { raceState } from './helpers/rr-cast.js';
import { fixtureCtx } from './helpers/rr-catalogue.js';
import { snapCheck } from '../js/rr/team.js';

const BLOWUPS = { snap: null, 'old-wound': ['explodes'], blame: ['blow-up'], shove: ['shove'] };

// A synthetic leg: twelve teams through the fire-mountain stretches; the resolver only
// moves time (each team a little faster or slower) and calls the talk layer.
function leg(seed) {
  setGs({ bonds: {}, popularity: {} });
  const st = raceState(12, seed);
  st.leg = 2;
  const stretches = getPlace('fire-mountain-isle').stretches;
  const rng = streamFor(seed, 'talk');
  const pace = Object.fromEntries(st.order.map((id, i) => [id, 0.8 + (i % 5) * 0.12]));
  const rooms = [];
  const res = runLeg({
    teams: st.order.map((id, i) => ({ id, t: 420 + i * 4 })),
    stretches,
    resolve(team, s, t, api) {
      const base = s.base ?? s.sides?.[0]?.base ?? 0;
      const others = api.here(s.id, t).map(x => x.id);
      const a = talkAtStretch(st, team.id, s, t, api, rng);
      const b = talkAtOverlap(st, team.id, others, s, t, api, rng);
      if (others.length >= 3) rooms.push(...talkAtWait(st, [team.id, ...others.slice(0, 3)], s, t, api, rng));
      return { end: t + Math.round(base * pace[team.id]) + Math.max(0, a.extra + b.extra) };
    },
  });
  const at = {};
  for (const l of res.log) if (l.stretch === 'mat') at[l.id] = { stretch: 'mat', t: l.to };
  const places = Object.fromEntries(Object.entries(res.finish).sort((x, y) => x[1] - y[1]).map(([id], i) => [id, i + 1]));
  closeLegTalk(st, 2, rng, { places, at });
  return { st, log: res.log, rooms };
}

describe('rr talk layer', () => {
  let runs;
  beforeAll(() => { runs = [1, 2, 3].map(leg); });

  it('every team ends the leg with at least two partner moments', () => {
    for (const { st } of runs) for (const id of st.order) {
      const n = st.scenes.filter(s => s.leg === 2 && s.data.family === 1 && s.data.team === id).length;
      expect(n, id).toBeGreaterThanOrEqual(2);
    }
  });

  it('no two people of different teams share more than three moments a leg', () => {
    for (const { st } of runs) {
      const teamOf = n => st.order.find(id => st.teams[id].a === n || st.teams[id].b === n);
      const count = {};
      for (const s of st.scenes.filter(x => x.leg === 2 && x.data.family !== 13)) {
        for (const x of s.who) for (const y of s.who) if (x < y && teamOf(x) !== teamOf(y)) count[`${x}|${y}`] = (count[`${x}|${y}`] || 0) + 1;
      }
      for (const [k, v] of Object.entries(count)) expect(v, k).toBeLessThanOrEqual(3);
    }
  });

  it('no team has two blow-ups in a leg', () => {
    for (const { st } of runs) for (const id of st.order) {
      const n = st.scenes.filter(s => s.leg === 2 && s.data.team === id && s.kind in BLOWUPS
        && (!BLOWUPS[s.kind] || BLOWUPS[s.kind].includes(s.data.ending))).length;
      expect(n, id).toBeLessThanOrEqual(1);
    }
  });

  it('a wait with four teams seats at most four people', () => {
    const rooms = runs.flatMap(r => r.rooms).filter(s => s.data.family === 3);
    expect(rooms.length).toBeGreaterThan(0);
    for (const s of rooms) expect(s.who.length).toBeLessThanOrEqual(4);
  });

  it('everyone in a scene was at its stretch at its minute', () => {
    for (const { st, log } of runs) {
      const teamOf = n => st.order.find(id => st.teams[id].a === n || st.teams[id].b === n);
      for (const s of st.scenes.filter(x => x.leg === 2 && x.data.stretch && x.data.t != null)) {
        for (const n of s.who) {
          const id = teamOf(n);
          const ok = log.some(l => l.id === id && l.stretch === s.data.stretch && l.from <= s.data.t && s.data.t <= l.to);
          expect(ok, `${s.kind} ${n} at ${s.data.stretch} ${s.data.t}`).toBe(true);
        }
      }
    }
  });

  it('every scene a moment chained carries that moment as its cause', () => {
    for (const { st } of runs) {
      const byId = Object.fromEntries(st.scenes.map(s => [s.id, s]));
      for (const s of st.scenes.filter(x => x.data.cause != null && !x.kind.startsWith('int-'))) {
        const c = byId[s.data.cause];
        expect(c, s.kind).toBeTruthy();
        expect(SCENES[c.kind].next?.[c.data.ending]).toBe(s.kind);
      }
    }
  });

  it('a team that already blew up this leg does not snap again', () => {
    const ctx = fixtureCtx('blame');
    const st = ctx.state;
    playScene(ctx, 'blame', () => 0.5, { ending: 'blow-up' });
    st.snapped[ctx.team.id] = false;
    for (const n of st.people) { st.mind[n].stress = 100; }
    let snaps = 0;
    for (let i = 0; i < 200; i++) if (snapCheck(st, ctx.team.id, () => 0)) snaps++;
    expect(snaps).toBe(0);
  });

  it('a gloat that escalates is followed by the shove it caused, the next time the teams meet', () => {
    const ctx = fixtureCtx('trash-talk', { doerArchetype: 'villain' });
    const st = ctx.state;
    const first = playScene(ctx, 'trash-talk', () => 0.5, { ending: 'escalates' });
    const out = talkAtOverlap(st, ctx.team.id, [ctx.other.id], { id: 'later', kind: 'travel', mode: 'foot', base: 10 }, 200, ctx.api, streamFor(1, 'c'));
    const shove = out.find(s => s.kind === 'shove');
    expect(shove).toBeTruthy();
    expect(shove.data.cause).toBe(first.id);
  });
});
