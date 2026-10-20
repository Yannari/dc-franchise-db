// The Amazing Race's twists the race didn't have (the user, 2026-10-20: "yes" to the Blind Boomerang, the Head-to-Head
// and the Intersection). A Blind Boomerang hides who threw it until Don says so at the mat, and the team sent back
// blames whoever it believes did it; a Head-to-Head stands at the mat: two teams duel, the winner checks in, the loser
// waits for the next team, and the loser of the last duel is last; an Intersection pairs two teams for a challenge.
import { describe, it, expect } from 'vitest';
import { buildSchedule, LEG_TWISTS } from '../js/rr/schedule.js';
import { playLeg } from '../js/rr/leg.js';
import { PLACES } from '../js/rr/places.js';
import { streamFor } from '../js/dr/rng.js';
import { setGs, setPlayers } from '../js/core.js';
import { raceState, raceCast } from './helpers/rr-cast.js';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';

const NEW = ['boomerang-blind', 'head-to-head', 'intersection'];
function setup(n, seed) {
  setGs({ bonds: {}, popularity: {} });
  const st = raceState(n, seed, { restMinutes: 720, medevacReturn: true });
  st.lastOrder = [...st.order];
  st.leg = 1;
  return st;
}
const leg = (twist, kind = 'elim') => ({ n: 2, kind, money: 100, reward: null, twist });
const FROM = PLACES['red-sand-desert'], TO = PLACES['fire-mountain-isle'];

describe('rr new twists', () => {
  it('the season draws them some seasons, never on the first leg or the last two', () => {
    for (const k of NEW) expect(LEG_TWISTS).toContain(k);
    const seen = Object.fromEntries(NEW.map(k => [k, 0]));
    for (let seed = 1; seed <= 30; seed++) {
      const legs = buildSchedule({ teams: 12, seed });
      for (const l of legs) if (NEW.includes(l.twist)) {
        seen[l.twist]++;
        expect(l.n, `seed ${seed} ${l.twist}`).toBeGreaterThan(1);
        expect(l.n).toBeLessThan(legs.length - 1);
      }
    }
    for (const k of NEW) {
      expect(seen[k], k).toBeGreaterThan(5);
      expect(seen[k], k).toBeLessThan(30);
    }
  });

  it('a Blind Boomerang: the team sent back is not told who, blames who it believes, and Don says who at the mat', () => {
    let reveals = 0, right = 0, wrong = 0;
    for (let s = 1; s <= 30; s++) {
      const st = setup(10, s);
      const r = playLeg(st, leg('boomerang-blind'), FROM, TO, streamFor(s, 'blind'));
      const hit = r.scenes.find(x => x.kind === 'boomerang-hit');
      if (!hit) continue;
      const by = st.uturn[hit.data.team].by;
      // (the other team in the scene is the one they BLAME, not the thrower: the board names nobody)
      expect(hit.data.other).toBe(hit.data.suspect);
      expect(hit.data.blind).toBe(true);
      expect(hit.data.suspect).toBeTruthy();
      expect(hit.data.suspect).not.toBe(hit.data.team);
      const rev = r.scenes.find(x => x.kind === 'boomerang-reveal');
      expect(rev, `seed ${s}: Don says who`).toBeTruthy();
      expect(rev.data.team).toBe(hit.data.team);
      expect(rev.data.other).toBe(by);
      expect(rev.data.ending).toBe(hit.data.suspect === by ? 'guessed-right' : 'guessed-wrong');
      expect(rev.t).toBeGreaterThanOrEqual(r.log.find(l => l.id === hit.data.team && l.stretch === 'mat')?.from ?? rev.t);
      reveals++;
      if (hit.data.suspect === by) right++; else wrong++;
    }
    expect(reveals).toBeGreaterThan(5);
    // they guess from what they believe, so they get it right sometimes and wrong sometimes
    expect(right).toBeGreaterThan(0);
    expect(wrong).toBeGreaterThan(0);
  });

  it('a Head-to-Head: every team that reaches it duels, the winner checks in first, the last duel decides who is last', () => {
    let legs = 0;
    for (let s = 1; s <= 12; s++) {
      const st = setup(8, s);
      const r = playLeg(st, leg('head-to-head'), FROM, TO, streamFor(s, 'h2h'));
      const duels = r.scenes.filter(x => x.kind === 'head-to-head');
      const reached = [...new Set(r.log.filter(l => l.stretch === 'duel').map(l => l.id))];
      if (reached.length < 2) continue;
      legs++;
      expect(duels.length, `seed ${s}`).toBe(reached.length - 1);
      // (reaches it: a penalty served on the mat can still put the winner behind)
      const matAt = id => r.log.find(x => x.id === id && x.stretch === 'mat')?.from ?? Infinity;
      for (const d of duels) {
        const [w, l] = [d.data.team, d.data.other];
        expect(matAt(w), `seed ${s}: the winner reaches the mat before the loser`).toBeLessThan(matAt(l));
      }
      // nobody went home on the road: the loser of the last duel is last on the mat
      if (!r.onLocation.length) expect(Object.keys(r.times).sort((x, y) => matAt(x) - matAt(y)).at(-1), `seed ${s}`).toBe(duels.at(-1).data.other);
    }
    expect(legs).toBeGreaterThan(6);
  });

  it('an Intersection pairs the teams at one of the leg\'s challenges', () => {
    let n = 0;
    for (let s = 1; s <= 8; s++) {
      const st = setup(8, s);
      const r = playLeg(st, leg('intersection'), FROM, TO, streamFor(s, 'int'));
      const at = Object.entries(r.stretchKinds).filter(([id, k]) => k === 'superteam' && TO.stretches.find(x => x.id === id)?.kind !== 'superteam');
      expect(at.length, `seed ${s}`).toBe(1);
      if (r.scenes.some(x => x.kind === 'superteam-pick')) n++;
    }
    expect(n).toBeGreaterThan(4);
  });

  it('they air, and Don explains each in its own words', () => {
    const seen = {}, rules = {};
    for (const [seed, pins] of [[41, { 3: 'boomerang-blind', 5: 'head-to-head', 7: 'intersection' }], [42, { 2: 'head-to-head', 4: 'intersection', 6: 'boomerang-blind' }]]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed, options: { twistPins: pins } });
      airSeason(res).forEach((ep, i) => {
        for (const s of ep.segments) {
          seen[s.kind] = (seen[s.kind] || 0) + 1;
          if (s.kind === 'don-rule') rules[res.legs[i].twist] = s.lines.map(l => l.text).join(' ');
        }
      });
    }
    for (const k of ['boomerang-reveal', 'head-to-head', 'superteam-pick']) expect(seen[k] || 0, k).toBeGreaterThan(0);
    expect(rules['boomerang-blind']).toMatch(/Blind Boomerang/);
    expect(rules['head-to-head']).toMatch(/Head-to-Head/);
    expect(rules.intersection).toMatch(/Intersection/);
  }, 400000);
});
