// Two teams at one challenge meet only where both of them are (the user, 2026-10-21: "FINN and Manu are outside then
// right after inside again", then "do the engine fix for meetings across stages"). A staged challenge is several places:
// the stairwell and the outside deck, the zipline's launch platform and the cable over the lake. The engine let any two
// teams at a challenge meet, wherever each was in it, and the viewer could only stand one of them in the wrong place.
// Now a team's spot is the stage it is working on (js/rr/spots.js, where the viewer draws that stage), and two teams
// meet in the same spot only; at a challenge's start, where everybody arriving is, they all can.
import { describe, it, expect, beforeAll } from 'vitest';
import { PLACES } from '../js/rr/places.js';
import { SPOTS, spotOfStage } from '../js/rr/spots.js';
import { SCENES } from '../js/rr/scenes/registry.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const START = 5;   // leg.js MEET_START
const DRIFT = 3;   // minutes
const apart = [];
let met = 0;
beforeAll(() => {
  for (const seed of [8, 3, 21, 44]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const st = res.state;
    for (const leg of res.legs) {
      const rows = (st.taskLog || []).filter(r => r.leg === leg.n);
      const spot = (id, stretch, t) => {
        const r = rows.find(x => x.team === id && x.stretch === stretch && x.from <= t + 0.5 && t <= x.to + 0.5);
        if (!r) return null;
        // (arriving: at an Either/Or its foot, where everybody is before choosing; at any other challenge its first stage)
        const def = PLACES[leg.place]?.stretches.find(x => x.id === stretch);
        if (t - r.from <= START) return def?.sides ? 'start' : (def?.stages?.[0] ? spotOfStage(leg.place, stretch, def.stages[0].id) : null);
        const cur = (r.stages || []).find(x => x.t >= t - 0.5);
        return cur ? spotOfStage(leg.place, stretch, cur.id) : null;
      };
      for (const s of st.scenes) {
        if (s.leg !== leg.n || SCENES[s.kind]?.cast !== 'teams' || !s.data?.team || !s.data?.other || s.data.t == null) continue;
        // (a run's stages and its moments are fitted to its real length once the clock has run, leg.js settleRuns: a
        // minute or two either way around the moment)
        // (at a Botch or Watch one partner does the stages and the other watches from the start: the team is in both)
        const def = PLACES[leg.place]?.stretches.find(x => x.id === s.data.stretch);
        const watchSpot = def?.kind === 'botch' && def.stages?.[0] ? spotOfStage(leg.place, def.id, def.stages[0].id) : null;
        const near = id => new Set([...[-DRIFT, 0, DRIFT].map(d => spot(id, s.data.stretch, s.data.t + d)), watchSpot].filter(Boolean));
        const a = near(s.data.team), b = near(s.data.other);
        if (!a.size || !b.size) continue;
        met++;
        if (![...a].some(x => b.has(x))) apart.push(`seed ${seed} leg ${leg.n} ${s.kind} at ${s.data.stretch}: ${[...a]} / ${[...b]}`);
      }
    }
  }
}, 600000);

describe('rr: two teams meet where both of them are', () => {
  it('knows the spot of every stage of every staged challenge', () => {
    const missing = [];
    for (const pl of Object.values(PLACES)) for (const s of pl.stretches) {
      for (const g of [s.stages || [], ...(s.sides || []).map(d => d.stages || [])]) for (const x of g) if (!spotOfStage(pl.id, s.id, x.id)) missing.push(`${pl.id} ${s.id} ${x.id}`);
    }
    expect(Object.keys(SPOTS).length).toBeGreaterThan(30);
    expect(missing).toEqual([]);
  });

  it('never has two teams meet from two different spots of one challenge', () => {
    expect(met).toBeGreaterThan(50);
    expect(apart).toEqual([]);
  });
});
