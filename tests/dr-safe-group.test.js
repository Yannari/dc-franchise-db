// ══════════════════════════════════════════════════════════════════════
// dr-safe-group.test.js — how many queens leave the stage
// ══════════════════════════════════════════════════════════════════════
//
// "There should have been more people safe, right?" — on a girl group night
// with twelve queens still in, four were dismissed and eight were critiqued.
//
// They were. `callWeek`'s ordinary path sizes the called-up group by how many
// are left and says so in as many words: "Six queens are critiqued on an
// ordinary night — three at the top, three at the bottom." The team-judged
// path never saw that rule. It called up the ENTIRE winning team:
//
//   two teams of six   1 win + 5 high + 1 low + 2 bottom  =  9 critiqued, 3 safe
//   three teams of four  1 + 3 + 1 + 2                    =  7 critiqued, 5 safe
//
// The winning team decides WHO is at the top, not how many the stage has room
// for. A queen on it who is not one of them is safe, which is what the show
// does with her.
import { describe, expect, it } from 'vitest';
import { callWeek } from '../js/dr/judging.js';

const rank = names => names.map((n, i) => ({ name: n, finalRank: i + 1 }));
const roomOf = n => Array.from({ length: n }, (_, i) => `Q${i + 1}`);
const spoken = c => c.win.length + c.high.length + c.low.length
  + c.bottom.length + c.atRisk.length;

describe('the stage has the same room on a team night', () => {
  it('critiques the same number as an ordinary week', () => {
    const room = roomOf(12);
    const ordinary = callWeek(rank(room), { castSize: 12 });
    for (const [label, teams] of [
      ['two teams of six', [room.slice(0, 6), room.slice(6)]],
      ['three teams of four', [room.slice(0, 4), room.slice(4, 8), room.slice(8)]],
      ['four teams of three', [room.slice(0, 3), room.slice(3, 6), room.slice(6, 9), room.slice(9)]],
    ]) {
      const team = callWeek(rank(room), {
        castSize: 12, teamJudged: true, teams, bestTeam: 0,
      });
      expect(spoken(team), `${label}: called up a different number of queens`)
        .toBe(spoken(ordinary));
      expect(team.safe.length, `${label}: a different number left the stage`)
        .toBe(ordinary.safe.length);
    }
  });

  it('lets a queen on the winning team be safe', () => {
    /* The half of the fix that is a behaviour change rather than a count: her
       team won and she is still dismissed, because the top is a place on the
       stage and not a team sheet. */
    const room = roomOf(12);
    const winners = room.slice(0, 6);
    const c = callWeek(rank(room), {
      castSize: 12, teamJudged: true, teams: [winners, room.slice(6)], bestTeam: 0,
    });
    const safeWinners = winners.filter(n => c.safe.includes(n));
    expect(safeWinners.length, 'the whole winning team is still called up')
      .toBeGreaterThan(0);
    // and nobody is in two places at once
    const all = [...c.win, ...c.high, ...c.low, ...c.atRisk, ...c.bottom, ...c.safe];
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(all).size).toBe(room.length);
  });

  it('still takes the bottom from the losing team only', () => {
    const room = roomOf(12);
    const winners = room.slice(0, 6);
    const c = callWeek(rank(room), {
      castSize: 12, teamJudged: true, teams: [winners, room.slice(6)], bestTeam: 0,
    });
    for (const n of [...c.bottom, ...c.atRisk, ...c.low]) {
      expect(winners.includes(n), `${n} won the challenge and is in the bottom`)
        .toBe(false);
    }
  });

  it('shrinks with the room exactly as an ordinary week does', () => {
    /* Whatever the rule is, a team night has to obey the same one — that is
       the whole point of this file. The rule itself is measured against the
       real show in tools/dr-real-critique-size.py and asserted in
       tests/dr-judging.test.js; here it only has to MATCH. */
    /* Six and up. Below that a team night cannot have the same shape as a
       solo one and it is not a bug: split five queens and the losing team is
       two, so both of them lip sync and there is no room left for a LOW. The
       show does not run a team challenge at five either. */
    for (const n of [10, 8, 7, 6]) {
      const room = roomOf(n);
      const half = Math.ceil(n / 2);
      const team = callWeek(rank(room), {
        castSize: n, teamJudged: true,
        teams: [room.slice(0, half), room.slice(half)], bestTeam: 0,
      });
      const solo = callWeek(rank(room), { castSize: n });
      expect(team.win.length + team.high.length, `${n} queens: called up`)
        .toBe(solo.win.length + solo.high.length);
      expect(team.safe.length, `${n} queens: dismissed`).toBe(solo.safe.length);
    }
  });

  it('never leaves the winning team without a winner', () => {
    // A one-queen winning team still produces a WIN and no empty HIGH.
    const room = roomOf(8);
    const c = callWeek(rank(room), {
      castSize: 8, teamJudged: true, teams: [[room[0]], room.slice(1)], bestTeam: 0,
    });
    expect(c.win).toEqual([room[0]]);
    expect(c.high).toEqual([]);
  });
});

/* ── THE NIGHT HAS A SAY IN HOW BIG THE STAGE IS ──
   The counts this file pins are MEANS. The real show does not hit its mean
   every week — measured over 87 nights by tools/dr-real-critique-size.py:

     queens called up   1: 5%   2: 23%   3: 45%   4: 18%   5+: 8%
     marked LOW         0: 25%  1: 54%   2: 16%   3: 5%

   Three up and one low is the ordinary night and it is not even half of them.
   A simulator that produces the mean every single week reads as a formula,
   which is the thing this answers. */
describe('how big the stage is tonight', () => {
  /* WARMED, because an LCG seeded with 1, 2, 3... returns nearly the same
     first number for each of them -- which made 400 "different" nights draw
     two distinct shapes between them and looked like the engine ignoring the
     stream. */
  const seeded = seed => {
    let s = (seed * 2654435761) >>> 0;
    const next = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 0; i < 6; i++) next();
    return next;
  };
  const shapes = n => {
    const out = [];
    for (let i = 0; i < 400; i++) {
      const c = callWeek(rank(roomOf(n)), { castSize: n, rng: seeded(i + 1) });
      out.push({ up: c.win.length + c.high.length, low: c.low.length,
        spoken: spoken(c) });
    }
    return out;
  };

  it('does not call the same number up every week', () => {
    const ups = new Set(shapes(12).map(s => s.up));
    expect(ups.size, 'every night calls up exactly the same number')
      .toBeGreaterThan(2);
  });

  it('centres where the real show centres', () => {
    const s = shapes(12);
    const mean = k => s.reduce((t, x) => t + x[k], 0) / s.length;
    // real: 3.0 up, 1.0 low, and a 5.9 mean critiqued
    expect(mean('up')).toBeGreaterThan(2.4);
    expect(mean('up')).toBeLessThan(3.6);
    expect(mean('low')).toBeGreaterThan(0.7);
    expect(mean('low')).toBeLessThan(1.5);
    expect(mean('spoken')).toBeGreaterThan(5);
    expect(mean('spoken')).toBeLessThan(7);
  });

  it('always leaves a stage that fits the room', () => {
    /* The clamp, which is the half that can go wrong quietly: a drawn top of
       six in a room of seven would leave nobody to be in the bottom. */
    for (const n of [12, 8, 6, 5, 4]) {
      for (const s of shapes(n)) {
        expect(s.up, `${n} queens: nobody called up`).toBeGreaterThanOrEqual(1);
        expect(s.spoken, `${n} queens: more on stage than in the room`)
          .toBeLessThanOrEqual(n);
      }
    }
  });

  it('gives the same night the same stage twice', () => {
    // A drawn shape still has to replay: same stream, same stage.
    const a = callWeek(rank(roomOf(12)), { castSize: 12, rng: seeded(99) });
    const b = callWeek(rank(roomOf(12)), { castSize: 12, rng: seeded(99) });
    expect(a).toEqual(b);
  });

  it('is the mean night when nobody hands it a stream', () => {
    // Every headless caller and every other test in this repo wants that.
    const c = callWeek(rank(roomOf(12)), { castSize: 12 });
    expect(c.win.length + c.high.length).toBe(3);
    expect(c.low.length).toBe(1);
  });
});
