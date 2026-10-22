// A general line names nothing the challenge doesn't have (the user, 2026-10-22, at the pepper cart: "why are they
// talking about falling and rope", then "check other challenge for the same issue"). Read across every place: the clue
// "in the box" where a local hands it out, a campfire at every gate shut for the night (a city tower, a museum), an oar
// stolen "out of the boat" at a challenge with no boat, "the steps, keep climbing" with no steps, a shop awning on a
// cliff top, a bridge lie in a desert, "we have to eat all of it?" at a challenge with nothing to eat.
// A place's own lines (when.place / when.taskId) say what their place has, so only the general ones are read.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { PLACES } from '../js/rr/places.js';
import { POOLS } from '../js/rr/script/lines/index.js';

const ENTRY = new Map();
for (const [k, l] of Object.entries(POOLS)) for (const e of l) ENTRY.set(e.id, { e, k });
const TASK = ['task', 'either', 'botch', 'allin', 'route', 'superteam', 'duel'];
// things a challenge has or hasn't: a word for each, and the words of the challenge's own description that mean it has it
const THINGS = [
  ['oar', /\boars?\b/, /\b(oar|row)/],
  ['boat', /\bthe boat\b/, /\b(boat|longship|raft)/],
  ['rail', /\b(rail|railing)\b/, /\brail/],
  ['stairs', /\b(stairs|staircase|the steps|up the steps)\b/, /\bstair|\bsteps\b/],
  ['bridge', /\bbridges?\b/, /\bbridge/],
  ['fire', /\b(campfire|campsite|the fire|a small fire)\b/, /\bfire\b/],
  ['rope', /\b(rope|ropes)\b/, /\brope/],
  ['awning', /\bawning\b/, /\bawning/],
  ['station', /\bthe station\b/, /\bstation/],
  // (the clue's own scenes: a local hands it out at some challenges; elsewhere the Don Box is the race's, not this place's)
  ['the box', /\b(into the box|the box is|reach the box|reach for the box|empty box)\b/, /a(?!)/, /^(clue|box-grab)\./],
  ['food', /\b(eat all of it|the food one)\b/, /\b(eat|food|pepper|stew|meatball|delicac)/],
  ['puzzle', /\bpuzzle\b/, /\bpuzzle/],
];

// (somewhere else, or not real: a story about a cousin's wedding, a boat in a daydream, directions to the next place)
const ELSEWHERE = new Set(['pt.f-any1', 'tk.o-any1', 'tk.o-any2', 'vt.lc6', 'sc2.4', 'sc.lb2', 'ph.ma2']);
const hits = [];
let read = 0;
beforeAll(() => {
  const ids = Object.keys(PLACES);
  for (let k = 0, round = 0; k < ids.length * 2; k += 10, round++) {
    const pins = {};
    for (let j = 0; j < 10; j++) pins[2 + j] = ids[(k + j) % ids.length];
    const seed = 100 + round;
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { pins } });
    airSeason(res).forEach((ep, i) => {
      const P = PLACES[res.legs[i].place];
      for (const sg of ep.segments) {
        const st = P?.stretches.find(x => x.id === sg.stretch);
        if (!st || !TASK.includes(st.kind) || !sg.lines?.length || !sg.lineId) continue;
        const en = ENTRY.get(sg.lineId);
        if (!en || en.e.when?.place || en.e.when?.taskId || ELSEWHERE.has(sg.lineId)) continue;
        read++;
        const has = JSON.stringify(st).toLowerCase();
        for (const x of sg.lines) {
          const t = String(x.text || '').toLowerCase();
          for (const [name, says, owns, pools] of THINGS) if ((!pools || pools.test(en.k)) && says.test(t) && !owns.test(has)) hits.push(`${res.legs[i].place}/${st.id} ${sg.lineId} [${name}]: ${x.text}`);
        }
      }
    });
  }
}, 1800000);

describe('rr: a general line at a challenge names only what it has', () => {
  it('never puts an oar, a rail, stairs, a bridge, a campfire, a rope, a box or a meal where there is none', () => {
    expect(read).toBeGreaterThan(500);
    expect([...new Set(hits)].slice(0, 20)).toEqual([]);
  });
});
