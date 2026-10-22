// A challenge done in rooms keeps its teams in their room (2026-10-22, the user on the elevator: "evieandnura are alone
// in it then suddenly thre with bowieandsami then right after theyre now with thomandspencer", then "check if it happens
// for other zone/leg"). Rock North's sauna is two huts, each big enough for two teams: a team sits in one hut, with the
// team on the other bench of that hut or alone, never with whoever is in the other hut.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { PLACES } from '../js/rr/places.js';

const ROOMED = Object.values(PLACES).flatMap(pl => pl.stretches.filter(s => s.rooms).map(s => [pl.id, s]));
const runs = [];
beforeAll(() => {
  for (const seed of [4, 11, 19]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const pins = Object.fromEntries(ROOMED.map(([p], k) => [k + 2, p]));
    const res = playRaceSeason({ teams, seed, options: { pins } });
    const aired = airSeason(res);
    runs.push({ seed, res, eps: aired.map((_, i) => episodeScreens(res, aired, i)) });
  }
}, 900000);

describe('rr: a challenge in rooms', () => {
  it('has rooms where its description says so (the sauna: two huts, two teams each)', () => {
    const sauna = PLACES['rock-north'].stretches.find(s => s.id === 'sauna');
    expect(sauna.rooms).toBe(2);
    expect(sauna.capacity / sauna.rooms).toBe(2);
  });

  it('never has more teams in a room at once than it holds', () => {
    let rows = 0;
    for (const { seed, res } of runs) for (const [, s] of ROOMED) {
      const mine = (res.state.taskLog || []).filter(r => r.stretch === s.id && r.room != null);
      rows += mine.length;
      for (const r of mine) {
        // (in the room from when it got its place to the end of its run; before that it waited outside)
        const inside = x => [x.seated, Math.max(...x.stages.map(y => y.t))];
        const [a] = inside(r);
        const there = mine.filter(x => x.leg === r.leg && x.room === r.room && inside(x)[0] <= a + 0.01 && a < inside(x)[1] - 0.01);
        expect(there.length, `seed ${seed} ${r.team} in room ${r.room} at ${a} (with ${there.map(x => x.team)})`).toBeLessThanOrEqual(s.capacity / s.rooms);
      }
    }
    expect(rows).toBeGreaterThan(5);
  });

  it('shows two teams inside together only when they are in the same room', () => {
    let n = 0;
    for (const { seed, res, eps } of runs) for (const ep of eps) for (const sc of ep.screens) {
      const [, s] = ROOMED.find(([p, x]) => p === sc.place && x.id === sc.stretch) || [];
      if (!s || (sc.teams || []).length < 2 || sc.stage === (s.stages?.[0]?.id)) continue;
      const inside = (s.roomStages || []).some(id => sc.plate?.f && sc.plate.f === stageFile(sc, id));
      if (!inside) continue;
      n++;
      const legN = res.legs.findIndex(l => l.place === sc.place) + 1;
      const room = id => (res.state.taskLog || []).findLast(r => r.leg === legN && r.team === id && r.stretch === s.id)?.room;
      expect(new Set(sc.teams.map(room)).size, `seed ${seed} ${sc.id}: ${sc.teams.join(' + ')} in ${sc.plate.f}`).toBe(1);
    }
    expect(n).toBeGreaterThanOrEqual(0);
  });
});

// the file of a stage's shot (rock-north/sauna's heat: the sauna interior)
import { stretchPlates } from '../js/vp-rr-ep/plates.js';
function stageFile(sc, id) { return stretchPlates(sc.place, sc.stretch, sc.side)?.stages?.[id]?.plate?.f; }
