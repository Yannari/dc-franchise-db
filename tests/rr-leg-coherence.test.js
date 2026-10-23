// A leg told in the order the clock played it has to make sense to somebody watching it (the user's Home City
// transcript, 2026-10-21: "randomly finding thom and spencer who havent even take the elevator yet but bowie and sami
// did this is so confusing"). Two teams only meet where both of them are; a moment about passing a task comes when
// they pass it; a challenge's stages happen inside the team's time at it; a fear moment belongs to the side that
// frightens; nobody judges a task with no judge.
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { PLACES } from '../js/rr/places.js';

const played = [];
beforeAll(() => {
  for (const seed of [8, 21, 34]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    played.push(playRaceSeason({ teams, seed }));
  }
}, 300000);

const START = 5;   // minutes at a task's start (the Don Box, the tip): everybody arriving is in one spot
const each = fn => { for (const res of played) for (const leg of res.legs) fn(res, leg); };
const stretchOf = (leg, id) => PLACES[leg.place]?.stretches.find(s => s.id === id);
const logOf = (leg, team, stretch) => (leg.log || []).filter(l => l.id === team && l.stretch === stretch);
const scenesOf = (res, leg) => res.state.scenes.filter(s => s.leg === leg.n && s.data?.stretch);
const switched = (res, leg, team, stretch) => (res.state.switches || []).some(x => x.leg === leg.n && x.team === team && x.stretch === stretch);
const runOf = (res, leg, team, stretch) => (res.state.taskLog || []).filter(r => r.leg === leg.n && r.team === team && r.stretch === stretch).at(-1) || null;
// (the run in progress at that minute: a Boomerang sends a team back to do the other side, 2026-10-23, Tomb Sands)
const sideOf = (res, leg, team, stretch, t) => {
  const runs = (res.state.taskLog || []).filter(r => r.leg === leg.n && r.team === team && r.stretch === stretch);
  return (runs.find(r => t != null && r.from <= t + 0.5 && t <= r.to + 0.5) || runs.at(-1))?.side ?? null;
};

describe('rr leg: a leg that makes sense in order', () => {
  it('only lets two teams at an Either/Or meet at its start or on the same side', () => {
    const bad = [];
    let n = 0;
    each((res, leg) => {
      for (const sc of scenesOf(res, leg)) {
        const st = stretchOf(leg, sc.data.stretch);
        const a = sc.data.team, b = sc.data.other;
        // (a task shut for the night: everybody who got there waits at its gate together)
        if (st?.kind !== 'either' || !a || !b || a === b || sc.data.moment === 'closed') continue;
        if (switched(res, leg, a, st.id) || switched(res, leg, b, st.id)) continue;
        n++;
        const la = logOf(leg, a, st.id)[0], lb = logOf(leg, b, st.id)[0];
        if (!la || !lb) continue;
        // (at the start: reading its clue at the box, or waiting for the gate, until its run begins, and its first minutes;
        // 2026-10-22, the run starts once the clue is read)
        const startOf = (id, l) => Math.max(l.from, runOf(res, leg, id, st.id)?.from ?? l.from);
        const at = (id, l) => sc.data.t <= startOf(id, l) || sc.data.t - startOf(id, l) <= START;
        const atStart = at(a, la) && at(b, lb);
        const sa = sideOf(res, leg, a, st.id, sc.data.t), sb = sideOf(res, leg, b, st.id, sc.data.t);
        if (!atStart && sa && sb && sa !== sb) bad.push(`seed ${res.state.seed} leg ${leg.n} ${sc.kind} ${a}(${sa}) ${b}(${sb}) t=${Math.round(sc.data.t)}`);
      }
    });
    expect(n).toBeGreaterThan(5);
    expect(bad).toEqual([]);
  });

  it('plays a moment about passing a task when they pass it, and a fail while they are at it', () => {
    const bad = [];
    let n = 0;
    each((res, leg) => {
      for (const sc of scenesOf(res, leg)) {
        const m = sc.data.moment, st = stretchOf(leg, sc.data.stretch);
        if (!['pass', 'fail'].includes(m) || !st || !['either', 'botch', 'allin', 'route', 'superteam'].includes(st.kind)) continue;
        const ls = logOf(leg, sc.data.team, st.id);
        if (!ls.length) continue;
        n++;
        const t = sc.data.t, l = ls.find(x => x.from <= t + 0.5 && t <= x.to + 0.5);
        if (!l) { bad.push(`seed ${res.state.seed} leg ${leg.n} ${sc.kind} ${m} at ${Math.round(t)}, not there (${ls.map(x => `${Math.round(x.from)}-${Math.round(x.to)}`)})`); continue; }
        // (the run of that visit: a team sent back to a task runs it again)
        const run = (res.state.taskLog || []).find(r => r.leg === leg.n && r.team === sc.data.team && r.stretch === st.id && Math.abs(r.from - l.from) < 0.5);
        const done = Math.max(...(run?.stages || []).map(x => x.t), -Infinity);
        if (m === 'pass' && t < Math.max(done, l.from) - 0.5) bad.push(`seed ${res.state.seed} leg ${leg.n} ${sc.kind} pass at ${Math.round(t)}, its last stage at ${Math.round(done)}`);
      }
    });
    expect(n).toBeGreaterThan(20);
    expect(bad).toEqual([]);
  });

  it('keeps every stage of a challenge inside the team\'s time at it (nobody checks in before their zipline ends)', () => {
    const bad = [];
    let n = 0;
    each((res, leg) => {
      for (const row of (res.state.taskLog || []).filter(r => r.leg === leg.n)) {
        const { team, stretch } = row;
        if (!row?.stages?.length) continue;
        const ls = logOf(leg, team, stretch);
        if (!ls.length) continue;
        const from = Math.min(...ls.map(l => l.from)), to = Math.max(...ls.map(l => l.to));
        for (const x of row.stages) { n++; if (x.t < from - 0.5 || x.t > to + 0.5) bad.push(`seed ${res.state.seed} leg ${leg.n} ${team} ${stretch}:${x.id} at ${Math.round(x.t)}, there ${Math.round(from)}-${Math.round(to)}`); }
      }
    });
    expect(n).toBeGreaterThan(100);
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it('gives a fear moment at an Either/Or only to a team on the side that is frightening', () => {
    const bad = [];
    each((res, leg) => {
      for (const sc of scenesOf(res, leg)) {
        const st = stretchOf(leg, sc.data.stretch);
        if (sc.data.moment !== 'fear' || st?.kind !== 'either' || switched(res, leg, sc.data.team, st.id)) continue;
        const side = st.sides.find(x => x.id === sideOf(res, leg, sc.data.team, st.id));
        if (side && !(side.types || []).some(x => ['nerve', 'heights', 'water'].includes(x))) bad.push(`${leg.place} ${side.id} ${sc.kind}`);
      }
    });
    expect(bad).toEqual([]);
  });

  it('never has a judge pass or fail a task nobody judges', () => {
    const bad = [];
    each((res, leg) => {
      for (const sc of scenesOf(res, leg)) {
        if (!['judge-yes', 'judge-no'].includes(sc.kind)) continue;
        const st = stretchOf(leg, sc.data.stretch);
        const side = st?.sides?.find(x => x.id === sideOf(res, leg, sc.data.team, st.id));
        if (!(side?.judge ?? st?.judge)) bad.push(`${leg.place} ${sc.data.stretch}${side ? ':' + side.id : ''}`);
      }
    });
    expect([...new Set(bad)]).toEqual([]);
  });
});
