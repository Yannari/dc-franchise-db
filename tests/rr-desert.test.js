// The Ridonculous Race: Red Sand Desert played 1:1 with the real leg (Ridonculous Race ep. 2, the wiki's
// "None Down, Eighteen to Go - Part 2"): five spices picked with no judge ("ideally cumin, cinnamon, paprika,
// saffron and ginger"; teams that don't know guess), a stew cooked with the team's own spices (wrong ones make
// it worse), a camel that can go down or stop, and the Vegans who walk beside theirs.
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { factsFor } from '../js/rr/script/facts.js';
import { rolesOf } from '../js/rr/script/roles.js';
import { getPlace } from '../js/rr/places.js';
import { raceCast } from './helpers/rr-cast.js';

const DESERT_ROUTE = ['home-city', 'red-sand-desert', 'iron-tower-city', 'red-sand-desert', 'fire-mountain-isle', 'red-sand-desert',
  'rock-north', 'red-sand-desert', 'great-wall-hills', 'red-sand-desert', 'savanna-falls', 'red-sand-desert', 'skyline-finale'];

describe('rr Red Sand Desert, 1:1', () => {
  const states = [];
  beforeAll(() => {
    // ten seasons: on six, one team's long run of bowls could flip the averages (measured 2026-10-19 over forty:
    // right spices 0.49 fails a stew, mixed 0.79, wrong 0.99)
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const { cast, teams } = raceCast(12, seed);
      teams[0].identity = 'vegans';
      setPlayers(cast);
      // every other leg in the desert (the library has grown: a drawn route visits it once or twice a season, and with
      // forty-six places often not at all; every season in this file books it)
      states.push(playRaceSeason({ teams, seed, options: { route: DESERT_ROUTE } }).state);
    }
  });
  const rows = (st, stretch) => (st.taskLog || []).filter(r => r.stretch === stretch);

  it('the spices are picked, not judged: one go, no fails, a count of right picks', () => {
    const spices = getPlace('red-sand-desert').stretches.find(s => s.id === 'spices');
    expect(spices.pick).toEqual({ of: 5 });
    let n = 0;
    for (const st of states) {
      expect(st.scenes.filter(s => s.kind === 'attempt-fail' && s.data.stretch === 'spices')).toEqual([]);
      for (const r of rows(st, 'spices')) {
        n++;
        expect(r.fails).toBe(0);
        expect(r.right).toBeGreaterThanOrEqual(0);
        expect(r.right).toBeLessThanOrEqual(5);
      }
    }
    expect(n).toBeGreaterThan(20);
  });

  it('the wrong spices make the stew worse', () => {
    const good = [], bad = [];
    for (const st of states) for (const r of rows(st, 'stew')) {
      const p = rows(st, 'spices').find(x => x.team === r.team && x.leg === r.leg);
      if (!p) continue;
      (p.right >= 4 ? good : p.right <= 2 ? bad : []).push(r.fails);
    }
    const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
    expect(good.length).toBeGreaterThan(5);
    expect(bad.length).toBeGreaterThan(5);
    expect(avg(bad)).toBeGreaterThan(avg(good));
  });

  it('a scene at the stew knows how the spices went', () => {
    let n = 0;
    for (const st of states) for (const s of st.scenes.filter(s => s.data?.stretch === 'stew' && s.data?.team)) {
      const f = factsFor(s, rolesOf(s, st), st);
      expect(['right', 'mostly', 'wrong'], s.kind).toContain(f.picked);
      n++;
    }
    expect(n).toBeGreaterThan(10);
  });

  it("a team's moment at the spices knows how its picking went", async () => {
    const { airSeason } = await import('../js/rr/episode.js');
    const { cast, teams } = raceCast(12, 1);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed: 1, options: { route: DESERT_ROUTE } });
    const right = new Set();
    for (const ep of airSeason(res)) for (const s of ep.segments.filter(s => s.stretch === 'spices' && s.kind.startsWith('task-'))) {
      const row = res.state.taskLog.find(r => r.leg === ep.n && r.team === s.teams[0] && r.stretch === 'spices');
      const want = row.right >= 5 ? 'right' : row.right >= 3 ? 'mostly' : 'wrong';
      expect(s.picked, `leg ${ep.n} ${s.teams[0]}`).toBe(want);
      // the picking is the moment: it airs as the try, or as its stages, with how it went (not as arriving at the kiosk)
      if (s.scene == null && !String(s.beat).endsWith(':arrive')) expect(['task-try', 'task-stage'], `leg ${ep.n} ${s.teams[0]}`).toContain(s.kind);
      right.add(want);
    }
    expect(right.size).toBeGreaterThan(1);
  });

  it('the first teams at the kiosk are seen arriving there too: the challenge is set up once, then results', async () => {
    const { airSeason } = await import('../js/rr/episode.js');
    const { cast, teams } = raceCast(12, 1);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed: 1, options: { route: DESERT_ROUTE } });
    for (const ep of airSeason(res)) {
      const starts = ep.segments.filter(s => s.stretch === 'spices' && s.kind === 'task-start');
      if (!ep.segments.some(s => s.stretch === 'spices')) continue;
      expect(starts.length, `leg ${ep.n}`).toBeGreaterThanOrEqual(1);
      expect(starts.length, `leg ${ep.n}`).toBeLessThanOrEqual(3);
      for (const s of starts) {
        const i = ep.segments.indexOf(s);
        expect(ep.segments.slice(i + 1).some(x => x.kind === 'task-try' && x.stretch === 'spices' && x.teams[0] === s.teams[0]), `leg ${ep.n}`).toBe(true);
      }
    }
  });

  it('the camel ride is seen: the first teams on it ride on air, the ones it went wrong for have their mishap', async () => {
    const { airSeason } = await import('../js/rr/episode.js');
    expect(getPlace('red-sand-desert').stretches.find(s => s.id === 'camel').ride).toBe(true);
    const { cast, teams } = raceCast(12, 1);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed: 1, options: { route: DESERT_ROUTE } });
    let legs = 0;
    airSeason(res).forEach((ep, i) => {
      if (res.legs[i].place !== 'red-sand-desert') return;
      legs++;
      const rides = ep.segments.filter(s => s.kind === 'ride' && s.stretch === 'camel');
      expect(rides.length, `leg ${ep.n}`).toBeGreaterThanOrEqual(1);
      expect(rides.length, `leg ${ep.n}`).toBeLessThanOrEqual(3);
      const mishap = new Set(ep.segments.filter(s => s.kind === 'travel-mishap' && s.stretch === 'camel').flatMap(s => s.teams));
      for (const s of rides) {
        expect(mishap.has(s.teams[0]), `leg ${ep.n} ${s.teams[0]} rode twice`).toBe(false);
        expect(s.lines?.length, `leg ${ep.n}`).toBeGreaterThan(0);
      }
    });
    expect(legs).toBeGreaterThan(0);
  });

  it('the camel has its own mishaps, and the Vegans walk beside theirs', () => {
    const camel = getPlace('red-sand-desert').stretches.find(s => s.id === 'camel');
    expect(camel.mishaps.map(m => m[0])).toEqual(expect.arrayContaining(['camel-down', 'camel-stops']));
    let walked = 0, kinds = new Set();
    for (const st of states) {
      const isVegan = id => st.teams[id].identity === 'vegans';
      for (const s of st.scenes.filter(s => s.kind === 'travel-mishap' && s.data.stretch === 'camel')) {
        kinds.add(s.data.kind);
        if (s.data.kind === 'walks-beside') { expect(isVegan(s.data.team)).toBe(true); walked++; }
        else expect(['camel-down', 'camel-stops']).toContain(s.data.kind);
      }
      // every Vegans team that got to the stew came by camel, walking beside it
      for (const r of rows(st, 'stew').filter(r => isVegan(r.team)))
        expect(st.scenes.some(s => s.kind === 'travel-mishap' && s.data.kind === 'walks-beside' && s.data.team === r.team && s.leg === r.leg), `leg ${r.leg}`).toBe(true);
    }
    expect(walked).toBeGreaterThan(0);
    expect(kinds.has('camel-down') || kinds.has('camel-stops')).toBe(true);
  });
});
