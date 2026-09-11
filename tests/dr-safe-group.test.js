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

  it('shrinks with the room, like an ordinary week', () => {
    // At six left the show calls two up, not three — and a team night has to
    // agree, or the last weeks critique everybody and dismiss nobody.
    const room = roomOf(6);
    const c = callWeek(rank(room), {
      castSize: 6, teamJudged: true, teams: [room.slice(0, 3), room.slice(3)], bestTeam: 0,
    });
    expect(c.win.length + c.high.length).toBe(2);
    expect(c.safe.length).toBe(callWeek(rank(room), { castSize: 6 }).safe.length);
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
