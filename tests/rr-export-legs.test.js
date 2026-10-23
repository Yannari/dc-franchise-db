// A race season's export holds what a wiki, trivia and awards are made from (the user, 2026-10-23: "does it save
// their rank each leg and things like that are necessary to fill a wiki/trivia/awards"). Until then it kept each leg's
// check-in order and the season's totals: no times, no penalty by leg or why, no challenge (which side, which partner,
// how many tries), no reward, no pass used, no Boomerang ballot, no sabotage by name.
import { describe, it, expect, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { raceRows } from '../js/rr-run.js';
import { rrLedgerRecord } from '../js/rr/ledger-record.js';
import { buildRaceSeasonDocument } from '../js/rr/export.js';
import { raceCast } from './helpers/rr-cast.js';

const seasons = [];
beforeAll(() => {
  for (const seed of [41, 42, 45]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const rows = raceRows(res, airSeason(res));
    const doc = buildRaceSeasonDocument(rows, rrLedgerRecord(res.state, res), { seasonNumber: 1 });
    seasons.push({ seed, res, doc, json: JSON.parse(JSON.stringify(doc)) });
  }
}, 600000);

const nameOf = (res, id) => res.state.teams[id].name;

describe('rr export: what a wiki needs, leg by leg', () => {
  it('every leg has each team\'s check-in time, clock, gap to the winner and penalty, and survives JSON', () => {
    for (const { seed, res, json } of seasons) {
      const legs = [...json.votingHistory, json.final];
      expect(legs.length, `seed ${seed}`).toBe(res.legs.length);
      res.legs.forEach((leg, i) => {
        const h = legs[i];
        expect(h.clockStart, `seed ${seed} leg ${leg.n}`).toBe(leg.clockStart ?? 420);
        const first = Math.min(...Object.values(leg.times));
        for (const id of Object.keys(leg.times)) {
          const o = h.order.find(x => x.team === nameOf(res, id));
          expect(o, `seed ${seed} leg ${leg.n} ${id}`).toBeTruthy();
          expect(o.time).toBe(Math.round(leg.times[id]));
          expect(o.gap).toBe(Math.round(leg.times[id] - first));
          expect(o.penalty).toBe(leg.penalties[id] || 0);
          expect(o.clock).toMatch(/^\d{2}:\d{2}$/);
          if (o.penalty) expect(o.penaltyReasons.length).toBeGreaterThan(0);
        }
      });
    }
  });

  it('every challenge run is there: which challenge, which side, who did it, the tries, the minutes', () => {
    let runs = 0, sides = 0;
    for (const { seed, res, json } of seasons) {
      const legs = [...json.votingHistory, json.final];
      for (const r of res.state.taskLog) {
        const h = legs[r.leg - 1];
        const ch = h.challenges.find(c => c.id === r.stretch);
        expect(ch, `seed ${seed} leg ${r.leg} ${r.stretch}`).toBeTruthy();
        expect(ch.name).toBeTruthy();
        const run = ch.runs.find(x => x.team === nameOf(res, r.team) && x.from === Math.round(r.from));
        expect(run, `seed ${seed} leg ${r.leg} ${r.stretch} ${r.team}`).toBeTruthy();
        expect(run.attempts).toBe(r.attempts ?? 1);
        expect(run.minutes).toBe(Math.round(r.to - r.from));
        if (r.side) { sides++; expect(run.side).toBeTruthy(); }
        runs++;
      }
    }
    expect(runs).toBeGreaterThan(100);
    expect(sides).toBeGreaterThan(10);
  });

  it('the leg\'s rewards, passes, Boomerang ballots and sabotage are named', () => {
    let rewards = 0, ballots = 0, sabotage = 0;
    for (const { res, json } of seasons) {
      const legs = [...json.votingHistory, json.final];
      for (const s of res.state.scenes) {
        const h = legs[s.leg - 1];
        if (s.kind === 'reward' || s.kind === 'call-home') { rewards++; expect(h.reward?.team).toBe(nameOf(res, s.data.team)); }
        if (s.kind === 'boomerang-vote') { ballots++; expect(h.boomerangVote.ballots.length).toBe(s.data.ballots.length); }
        if (s.family === 8 && s.data?.other && ['works', 'seen', 'backfires'].includes(s.data.ending)) {
          sabotage++;
          expect(h.sabotage.some(x => x.kind === s.kind && x.by === nameOf(res, s.data.team) && x.on === nameOf(res, s.data.other))).toBe(true);
        }
      }
    }
    expect(rewards).toBeGreaterThan(0);
  });

  it('every racer carries the place they had on every leg, and their season numbers', () => {
    for (const { seed, res, json } of seasons) {
      for (const p of json.placements) {
        const id = Object.keys(res.state.teams).find(t => [res.state.teams[t].a, res.state.teams[t].b].includes(p.name));
        const mine = res.legs.filter(l => l.order.includes(id));
        expect(p.rr.legPlaces.length, `seed ${seed} ${p.name}`).toBe(mine.length);
        mine.forEach((l, k) => expect(p.rr.legPlaces[k]).toEqual({ leg: l.n, place: l.order.indexOf(id) + 1 }));
        expect(p.rr.bestPlace).toBe(Math.min(...mine.map(l => l.order.indexOf(id) + 1)));
        for (const k of ['challenges', 'solo', 'fails', 'switches', 'quits', 'fearsFaced', 'expressUsed', 'savesUsed']) expect(typeof p.rr[k], k).toBe('number');
      }
    }
  });
});
