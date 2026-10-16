// ══════════════════════════════════════════════════════════════════════
// ch/daily/race.js — the race dailies, played: every slip, every wrong turn, every overtake
// ══════════════════════════════════════════════════════════════════════
//
// Cliff Relay, Reef Dash, Truck Tug, Jungle Maze, Night Swim, Balance Beam and Gauntlet Run are races: each
// unit (a player, a pair, a team) moves along its course, and the course is what makes it go wrong. Each
// daily is a COURSE: its stages (named, at a share of the way), its hazard (what goes wrong, how often, how
// far back it sends you), the fear it tests and where, and a puzzle at the end if it has one. The race runs
// minute by minute; every hazard, freeze, overtake and finish is a beat, and the finishing order is the
// result. In a gendered solo week the first man and the first woman home win, as on the show.
//
// The people: a unit passing a rival may needle them on the way (a grudge, by the archetype rules); a
// partner or a teammate who freezes can be talked through it by the other; a thrower (dailies.js) goes
// slower and makes more mistakes, which is how somebody watching notices.
import { getBond } from '../../bonds.js';
import { fearOfThing } from '../mind.js';
import { run, needle, help, faceFear, pop, S, clamp } from './kit.js';

// k: the stat that keeps you out of trouble on this course
export const COURSES = {
  'cliff-relay': { len: 34, stages: [[0.2, 'the first flag'], [0.5, 'halfway up the cliff'], [0.8, 'the top flags']],
    hazard: { kind: 'drop-flag', p: 0.05, back: 0.08, k: 'physical' }, fear: { thing: 'heights', at: 0.15, refuse: 0.12 } },
  'reef-dash': { len: 30, stages: [[0.25, 'the near buoys'], [0.6, 'the far buoys'], [0.85, 'the last tokens']],
    hazard: { kind: 'wrong-buoy', p: 0.05, back: 0.07, k: 'intuition' }, fear: { thing: 'deep water', at: 0.05 }, drift: 0.5 },
  'truck-tug': { len: 28, stages: [[0.3, 'the first stretch'], [0.65, 'the soft sand'], [0.9, 'the puzzle']],
    hazard: { kind: 'stall', p: 0.06, back: 0.04, k: 'endurance' }, puzzle: { at: 0.9, k: 'mental' } },
  'jungle-maze': { len: 32, stages: [[0.2, 'the first letter'], [0.45, 'the second letter'], [0.65, 'the fourth letter'], [0.88, 'the exit']],
    hazard: { kind: 'dead-end', p: 0.07, back: 0.07, k: 'intuition' }, fear: { thing: 'tight spaces', at: 0.3 }, puzzle: { at: 0.92, k: 'mental', kind: 'wrong-word' } },
  'night-swim': { len: 30, stages: [[0.25, 'the first buoy'], [0.55, 'the far side of the point'], [0.85, 'the beach']],
    hazard: { kind: 'missed-buoy', p: 0.05, back: 0.08, k: 'intuition' }, fear: { thing: 'the dark', at: 0.1 }, puzzle: { at: 0.9, k: 'mental', kind: 'wrong-total' } },
  'balance-beam': { len: 30, stages: [[0.3, 'the first full bucket'], [0.6, 'half a tank'], [0.85, 'nearly full']],
    hazard: { kind: 'slip', p: 0.08, back: 0.09, k: 'temperament' }, fear: { thing: 'heights', at: 0.05, mild: 0.5 } },
  'gauntlet-run': { len: 26, stages: [[0.2, 'the tyres'], [0.4, 'the mud crawl'], [0.6, 'the wall'], [0.8, 'the sandbags'], [0.97, 'the bell']],
    hazard: { kind: 'obstacle', p: 0.06, back: 0.05, k: 'physical' }, fear: { thing: 'tight spaces', at: 0.4, mild: 0.6 } },
  // the G sets (art jobs G04, G05, G08)
  'car-jump': { len: 24, stages: [[0.25, 'the first car'], [0.5, 'the second car'], [0.75, 'the third car'], [0.97, 'the last car']],
    hazard: { kind: 'missed-jump', p: 0.06, back: 0.22, k: 'boldness' }, fear: { thing: 'heights', at: 0.05, refuse: 0.1 } },
  'locked-in': { len: 26, stages: [[0.15, 'into the cage'], [0.5, 'halfway through'], [0.95, 'the bell']],
    hazard: { kind: 'stuck', p: 0.06, back: 0.05, k: 'temperament' }, fear: { thing: 'tight spaces', at: 0.1 } },
  'the-box': { len: 26, stages: [[0.2, 'the first piece'], [0.5, 'three pieces'], [0.8, 'every piece']],
    hazard: { kind: 'bite', p: 0.07, back: 0.08, k: 'temperament' }, fear: { thing: 'creepy crawlies', at: 0.05 }, puzzle: { at: 0.9, k: 'mental' } },
};
// which obstacle a gauntlet mistake is at, by where they are
export const gauntletPart = p => (p < 0.4 ? 'tyres' : p < 0.6 ? 'mud' : p < 0.8 ? 'wall' : 'bags');

export function playRace(state, rng, { units, power, mode, id }) {
  const C = COURSES[id];
  const all = units.flat();
  const R = run(all);
  const key = u => u.join('+');
  const avg = (u, f) => u.reduce((a, n) => a + f(n), 0) / u.length;
  const prog = Object.fromEntries(units.map(u => [key(u), 0]));
  const stall = Object.fromEntries(units.map(u => [key(u), 0]));
  const speed = Object.fromEntries(units.map(u => [key(u), clamp(avg(u, n => power[n]) / 8, 0.35, 1.6)]));
  const feared = new Set(), stageHit = new Set(), puzzled = new Set(), done = [];
  const snap = () => Object.fromEntries(units.map(u => [key(u), +Math.min(1, prog[key(u)]).toFixed(3)]));
  R.beat(0, 'race-start', all, { units: units.map(u => [...u]) });
  if (C.fear?.at <= 0.05) checkFear(0.5);
  let leader = null, overtakes = 0;
  const div = u => (state.options.gendered && mode === 'solo' ? state.division[u[0]] : 'all');
  const divs = [...new Set(units.map(div))];
  const firstHome = {};
  function checkFear(t) {
    for (const u of units) {
      const k = key(u);
      if (feared.has(k) || prog[k] < (C.fear.at - 0.05)) continue;
      feared.add(k);
      for (const n of u) {
        const size = fearOfThing(state, n, C.fear.thing) * (C.fear.mild || 1);
        const f = faceFear(state, rng, n, size);
        if (!f) continue;
        if (f.froze) {
          const mate = u.find(x => x !== n) || null;
          if (mate && getBond(mate, n) > -2) { const h = help(state, mate, n); stall[k] += 2; R.beat(t, 'fear-helped', [n, mate], { fear: C.fear.thing, snap: snap() }); }
          else if (C.fear.refuse) { prog[k] = Math.max(0, prog[k] - C.fear.refuse); stall[k] += 2; R.beat(t, 'fear-refused', [n], { fear: C.fear.thing, snap: snap() }); }
          else { stall[k] += 4; R.beat(t, 'fear-froze', [n], { fear: C.fear.thing, snap: snap() }); }
        } else if (f.size >= 0.45) R.beat(t, 'fear-beaten', [n], { fear: C.fear.thing, snap: snap() });
      }
    }
  }
  for (let t = 1; t <= 200 && done.length < units.length; t++) {
    for (const u of units) {
      const k = key(u);
      if (done.includes(u)) continue;
      if (stall[k] > 0) { stall[k]--; continue; }
      const before = prog[k];
      prog[k] += speed[k] * (0.55 + rng() * 0.9) / C.len;
      // the course's own trouble: more often for the ones it does not suit, and for a thrower
      const skill = avg(u, n => S(n, C.hazard.k)) / 10;
      if (rng() < C.hazard.p * (1.3 - skill)) {
        prog[k] = Math.max(0, prog[k] - C.hazard.back);
        R.beat(t, 'hazard', [...u], { kind: C.hazard.kind, part: id === 'gauntlet-run' ? gauntletPart(before) : null, snap: snap() });
      }
      // the puzzle at the end: a mistake sends them back for another go
      if (C.puzzle && prog[k] >= C.puzzle.at && !puzzled.has(k)) {
        puzzled.add(k);
        const sharp = avg(u, n => S(n, C.puzzle.k)) / 10;
        if (rng() > sharp * 0.9) { stall[k] += 2 + Math.round((1 - sharp) * 4); R.beat(t, 'puzzle-miss', [...u], { kind: C.puzzle.kind || 'puzzle', snap: snap() }); }
      }
      if (prog[k] >= 1) {
        done.push(u);
        const d = div(u);
        const first = !firstHome[d];
        if (first) firstHome[d] = u;
        R.beat(t + done.length * 0.01, 'finish', [...u], { place: done.length, first, div: d, snap: snap() });
        if (first) for (const n of u) pop(n, 0.4);
      }
    }
    if (C.fear && C.fear.at > 0.05) checkFear(t);
    // the reef's current, once
    if (C.drift && t === Math.round(C.len * C.drift)) R.beat(t, 'drift', [], { snap: snap() });
    // the leader, and the stage they reach
    const open = units.filter(u => !done.includes(u));
    const lead = [...open].sort((a, b) => prog[key(b)] - prog[key(a)])[0];
    // a new leader among those still racing (somebody who has finished is not passed)
    if (lead && key(lead) !== leader && done.some(u => key(u) === leader)) leader = key(lead);
    else if (lead && key(lead) !== leader && t > 2 && overtakes < 4) {
      const was = units.find(u => key(u) === leader);
      overtakes++;
      // passing a rival: a needle on the way past
      const rivals = was && lead.flatMap(a => was.map(b => [a, b])).find(([a, b]) => getBond(a, b) <= -2);
      if (rivals) { const r = needle(state, rivals[0], rivals[1]); R.beat(t, 'overtake', [...lead, ...(was || [])], { needle: !r.soft, by: r.a, to: r.b, snap: snap() }); }
      else R.beat(t, 'overtake', [...lead, ...(was || [])], { snap: snap() });
      leader = key(lead);
    } else if (lead && !leader) leader = key(lead);
    for (const [i, [at, name]] of C.stages.entries()) {
      if (stageHit.has(i) || !lead || prog[key(lead)] < at) continue;
      stageHit.add(i);
      R.beat(t, 'stage', [...lead], { name, i, snap: snap() });
    }
    // everybody home the show cares about: the winners, and the last one in
    if (divs.every(d => firstHome[d]) && open.length <= 1 && done.length >= units.length - 1) {
      const last = units.find(u => !done.includes(u));
      if (last) { done.push(last); R.beat(t + 0.5, 'finish', [...last], { place: done.length, last: true, div: div(last), snap: snap() }); }
    }
  }
  const score = {};
  done.forEach((u, i) => { for (const n of u) score[n] = 100 - i; });
  for (const n of all) score[n] ??= 0;
  return { beats: R.beats, score };
}
