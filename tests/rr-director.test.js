// The Ridonculous Race: the director, what a leg airs and in what order (dialogue plan, Task 9).
import { describe, it, expect, beforeAll } from 'vitest';
import { airLeg, MUST, WARM, ROW, legBudget } from '../js/rr/story/director.js';
import { playRaceSeason } from '../js/rr/season.js';
import { SCENES } from '../js/rr/scenes.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr director', () => {
  let res, aired;
  beforeAll(() => {
    const { cast, teams } = raceCast(12, 4);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 4, options: { twists: { 3: 'boomerang' } } });
    aired = res.legs.map(l => airLeg(res.state, l));
  });

  it('every team is seen at every task it ran', () => {
    const st = res.state;
    res.legs.forEach((leg, i) => {
      const rows = (st.taskLog || []).filter(r => r.leg === leg.n);
      expect(rows.length).toBeGreaterThan(0);
      for (const r of rows) {
        const seen = aired[i].segments.some(s => s.stretch === r.stretch && s.teams.includes(r.team));
        expect(seen, `leg ${leg.n}: ${r.team} at ${r.stretch}`).toBe(true);
      }
    });
  });

  it('every must-air moment airs', () => {
    const st = res.state;
    res.legs.forEach((leg, i) => {
      const ids = new Set(aired[i].segments.flatMap(s => s.scenes || [s.scene]));
      for (const sc of st.scenes.filter(s => s.leg === leg.n && MUST.has(s.kind))) expect(ids.has(sc.id), `leg ${leg.n} #${sc.id} ${sc.kind}`).toBe(true);
    });
  });

  it('runs in clock order', () => {
    for (const ep of aired) {
      const ts = ep.segments.map(s => s.t).filter(t => t != null);
      for (let i = 1; i < ts.length; i++) expect(ts[i]).toBeGreaterThanOrEqual(ts[i - 1]);
    }
  });

  it('keeps to the leg budget beyond what must air', () => {
    res.legs.forEach((leg, i) => {
      const extra = aired[i].segments.filter(s => s.tier >= 2).length;
      expect(extra).toBeLessThanOrEqual(legBudget(leg.order.length));
    });
  });

  it('holds the guards: one blow-up a team, one romance a person, nothing warm after a row', () => {
    const st = res.state;
    const byId = Object.fromEntries(st.scenes.map(s => [s.id, s]));
    for (const ep of aired) {
      const rows = new Set(), blows = {}, romance = {};
      for (const seg of ep.segments) {
        const sc = byId[seg.scene];
        if (!sc) continue;
        const pair = sc.who.slice(0, 2).sort().join('|');
        if (WARM.has(sc.kind)) expect(rows.has(pair), `warm after a row: #${sc.id} ${sc.kind}`).toBe(false);
        if (ROW.has(sc.kind)) {
          rows.add(pair);
          if (sc.data.team) { blows[sc.data.team] = (blows[sc.data.team] || 0) + 1; expect(blows[sc.data.team]).toBeLessThanOrEqual(1); }
        }
        if (SCENES[sc.kind]?.family === 4) for (const n of sc.data.facts?.lovers || []) {
          romance[n] = (romance[n] || 0) + 1;
          expect(romance[n], `${n} has two romance beats`).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("a task beat casts the one doing a Botch first, names the side, and keeps the task's snapshot", () => {
    const st = res.state;
    for (const ep of aired) for (const seg of ep.segments.filter(s => String(s.beat || '').startsWith('task:'))) {
      const row = st.taskLog.find(r => `task:${r.leg}:${r.team}:${r.stretch}` === seg.beat.split(':').slice(0, 4).join(':'));
      expect(row, seg.beat).toBeTruthy();
      if (row.kind === 'botch' && row.who) expect(seg.who[0]).toBe(row.who);
      if (row.side) expect(seg.side).toBe(row.side);
    }
  });

  it("the system's own moments keep a snapshot, and a mishap says what went wrong", () => {
    const st = res.state;
    const sys = st.scenes.filter(s => ['attempt-fail', 'travel-mishap', 'same-flight', 'quit-task', 'helped-botch', 'allin-alone', 'found-flight', 'express-used'].includes(s.kind));
    expect(sys.length).toBeGreaterThan(5);
    for (const s of sys) expect(s.data.snap, s.kind).toBeTruthy();
  });

  it('an episode airs at most two of the same optional kind', () => {
    for (const ep of aired) {
      const n = {};
      for (const s of ep.segments.filter(x => x.tier >= 2)) n[s.kind] = (n[s.kind] || 0) + 1;
      for (const [k, v] of Object.entries(n)) expect(v, `leg ${ep.n} ${k}`).toBeLessThanOrEqual(2);
    }
  });

  it('interviews make the episode, not only the exits', () => {
    let n = 0;
    for (const ep of aired) n += ep.segments.filter(s => s.kind.startsWith('int-') && s.kind !== 'int-exit' && s.kind !== 'int-bleachers').length;
    expect(n / aired.length).toBeGreaterThanOrEqual(2);
  });

  it('an interview casts the person the moment was about first, and an exit knows how the team went out', async () => {
    const { factsFor } = await import('../js/rr/script/facts.js');
    const { rolesOf } = await import('../js/rr/script/roles.js');
    const st = res.state;
    const byId = Object.fromEntries(st.scenes.map(s => [s.id, s]));
    let checked = 0;
    for (const iv of st.scenes.filter(s => s.kind === 'int-feeling' && s.data.about != null)) {
      const cause = byId[iv.data.about];
      if (iv.who.includes(cause.who[0])) { expect(iv.who[0]).toBe(cause.who[0]); expect(factsFor(iv, rolesOf(iv, st), st).aDid).toBe(true); checked++; }
    }
    expect(checked).toBeGreaterThan(0);
    for (const ex of st.scenes.filter(s => s.kind === 'int-exit')) expect(['last', 'on-location', 'midpoint']).toContain(factsFor(ex, rolesOf(ex, st), st).exitHow);
  });

  it('two teams who clashed this leg get nothing friendly after it', async () => {
    const { SOUR_X, WARM_X } = await import('../js/rr/story/director.js');
    expect(WARM_X.has('watching-together')).toBe(true);
    const byId = Object.fromEntries(res.state.scenes.map(s => [s.id, s]));
    for (const ep of aired) {
      const sour = new Set();
      for (const seg of ep.segments) {
        const sc = byId[seg.scene];
        if (!sc?.data?.other) continue;
        const k = [sc.data.team, sc.data.other].sort().join('|');
        if (WARM_X.has(sc.kind)) expect(sour.has(k), `leg ${ep.n}: ${sc.kind} after a clash`).toBe(false);
        if (SOUR_X.has(sc.kind)) sour.add(k);
      }
    }
  });

  it('no team consoles a team it clashed with that leg', async () => {
    const { SOUR_X } = await import('../js/rr/story/director.js');
    expect(SOUR_X.has('push')).toBe(true);
    let consoles = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const st = playRaceSeason({ teams, seed }).state;
      for (const c of st.scenes.filter(s => s.kind === 'console')) {
        consoles++;
        const pair = [c.data.team, c.data.other].sort().join('|');
        const clash = st.scenes.find(s => s.leg === c.leg && s.id < c.id && SOUR_X.has(s.kind) && [s.data.team, s.data.other].sort().join('|') === pair);
        expect(clash, `seed ${seed} leg ${c.leg}: ${clash?.kind} then console`).toBeUndefined();
      }
    }
    expect(consoles).toBeGreaterThan(0);
    setPlayers(raceCast(12, 4).cast);
  });

  it('nobody says two lines in a row because of an added identity line', () => {
    for (const ep of aired) for (const seg of ep.segments) {
      const ls = seg.lines || [];
      ls.forEach((l, i) => {
        if (i && l.auto && ls[i - 1].kind !== 'beat') expect(l.by, `${seg.kind} ${seg.lineId}`).not.toBe(ls[i - 1].by);
      });
    }
  });

  it('the same minute at the same task does not air the same kind three times', () => {
    for (const ep of aired) {
      const run = {};
      for (const seg of ep.segments) {
        if (seg.kind === 'int-bleachers') continue; // the finale's bleachers: every team out gets its word
        // check-ins in the same minute are a run, the way the show does the mat ('third... fourth... fifth'), not one
        // moment repeated (2026-10-19: a new cast checked three featured teams in at minute 86)
        if (seg.kind === 'don-place' && seg.stretch === 'mat') continue;
        const k = `${seg.t}|${seg.stretch}|${seg.kind}`;
        run[k] = (run[k] || 0) + 1;
        expect(run[k], `leg ${ep.n} ${k}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('an interview airs only after the moment it is about', () => {
    for (const ep of aired) {
      const seen = new Set();
      const byId = Object.fromEntries(res.state.scenes.map(s => [s.id, s]));
      for (const seg of ep.segments) {
        const sc = byId[seg.scene];
        if (sc?.kind.startsWith('int-') && sc.data.about != null) expect(seen.has(sc.data.about), `#${sc.id}`).toBe(true);
        if (seg.scene != null) seen.add(seg.scene);
      }
    }
  });
});
