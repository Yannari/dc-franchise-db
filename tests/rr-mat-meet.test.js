// Two teams who meet at the Chill Zone: one has checked in and the race is over for it (the user, 2026-10-21: "yul and
// natalia have talk when natalia is suppose to be 2nd arrived and yul isnt suppose to be there yet cause theyre last").
// Yul and Mike, arriving last, told Natalia and Grett "You're still here? We thought you'd be miles ahead", and Lake and
// Millie, checked in half an hour before, "jogged past" Julia and Dunia: a gloat's lines are all about passing a team
// mid-race, and none is written for the mat. A gloat is on the road only.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const mats = [], flights = [];
// what needs a road, a course or a task: never at the gate or on the plane (leg 7, 2026-10-21: a team was shoved into a
// hedge and another sent down the "low path" while both waited for the same flight)
const ROAD = ['push', 'ram', 'course-sabotage', 'fake-shortcut', 'free-ride', 'save-your-enemy', 'shove', 'help-offer', 'rescue',
  'tug-of-war', 'collision', 'follow', 'mock-the-struggle', 'gloat', 'spy'];
beforeAll(() => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    airSeason(res);
    for (const s of res.state.scenes) if (ROAD.includes(s.kind) && s.data?.snap?.mode === 'flight') flights.push(`seed ${seed} leg ${s.leg} ${s.kind}`);
    for (const s of res.state.scenes) if (s.kind === 'gloat' && (s.data?.stretch === 'mat' || s.data?.snap?.stretchKind === 'mat')) mats.push(`seed ${seed} leg ${s.leg}`);
  }
}, 600000);

describe('rr: at the Chill Zone', () => {
  it('nobody gloats about passing a team that has already checked in', () => {
    expect(mats).toEqual([]);
  });
  it('nobody is shoved, sent the wrong way or helped over a course while waiting for a flight', () => {
    expect(flights).toEqual([]);
  });
});
