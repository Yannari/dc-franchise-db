// An Either/Or's choice is made in its own words (the user, 2026-10-22: "when they were no puzzle dont use generic dialogue
// but specific per challenge"). Every team now decides at the box, before the engine had its side: the side-specific
// lines ("Stairs. I'm not walking round the outside of anything") never matched, and the generic ones played ("the
// first one", "the left one", a puzzle where there was none). The scene gets the side the team went for, and an
// Either/Or with lines of its own speaks only those, for that side, whatever the ending.
import { describe, it, expect, beforeAll } from 'vitest';
import { PLACES } from '../js/rr/places.js';
import { POOLS } from '../js/rr/script/lines/index.js';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const EITHERS = Object.values(PLACES).flatMap(pl => pl.stretches.filter(s => s.kind === 'either').map(s => ({ place: pl.id, s })));
const ENDINGS = ['agree', 'overruled', 'compromise', 'swayed-by-watching'];
const whenOf = {};
for (const e of ENDINGS) for (const x of POOLS[`decide-side.${e}`] || []) whenOf[x.id] = x.when || {};

describe('rr: an Either/Or is chosen in its own words', () => {
  it('has lines of its own for both sides and every ending, at every Either/Or', () => {
    const short = [];
    for (const { place, s } of EITHERS) for (const side of s.sides) for (const e of ENDINGS) {
      const own = (POOLS[`decide-side.${e}`] || []).filter(x => [].concat(x.when?.taskId ?? []).includes(s.id) && (x.when?.side == null || [].concat(x.when.side).includes(side.id)));
      if (own.length < 2) short.push(`${place} ${s.id} ${side.id} ${e}: ${own.length}`);
    }
    expect(short).toEqual([]);
  });

  const aired = [];
  beforeAll(() => {
    for (const { place } of EITHERS.slice(0, 8)) {
      const seed = 7 + aired.length;
      const { cast, teams } = raceCast(10, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed, options: { pins: { 2: place } } });
      const eps = airSeason(res);
      const i = res.legs.findIndex(l => l.place === place);
      if (i < 0) continue;
      for (const sg of eps[i].segments.filter(x => x.kind === 'decide-side')) aired.push({ place, res, leg: res.legs[i], sg });
    }
  }, 900000);

  it('speaks only the challenge\'s own lines, for the side the team went for', () => {
    expect(aired.length).toBeGreaterThan(10);
    for (const { place, res, leg, sg } of aired) {
      const w = whenOf[sg.lineId?.split(',')[0]];
      expect(w, `${place} ${sg.lineId}`).toBeTruthy();
      expect([].concat(w.taskId ?? []), `${place} ${sg.lineId}`).toContain(sg.stretch);
      const row = (res.state.taskLog || []).find(r => r.leg === leg.n && r.team === sg.teams[0] && r.stretch === sg.stretch);
      const s = PLACES[place].stretches.find(x => x.id === sg.stretch);
      const went = row?.switched ? s.sides.find(x => x.id !== row.side)?.id : row?.side;
      if (w.side != null) expect([].concat(w.side), `${place} ${sg.lineId} for ${went}`).toContain(went);
    }
  });
});
