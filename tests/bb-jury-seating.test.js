// When the jury opens, and who is sitting on it.
//
// The arithmetic was written out three times and disagreed with itself. The
// season-shape panel said a jury of seven opens with nine houseguests left; the
// eviction interview worked it out again inline, off the POST-eviction count,
// and printed TO THE JURY HOUSE from ten. So the timeline promised one night
// and the broadcast announced another, and the tenth boot was told they were a
// juror on the way out.
//
// Nothing downstream was wrong: seatBBJury clamps with slice(-size), so the
// finale always sat exactly jurySize people. That is what let this live so
// long — no wrong winner, no wrong count, just a car sent to the wrong place
// on television.
//
// The rule, stated once and tested here: the jury is the last `jurySize` people
// out, and the houseguest cut at the final three is one of them. Six weekly
// jurors plus that cut is seven; starting a week early makes eight.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig, setGs } from '../js/core.js';
import {
  juryOpensAt, evictionSeatsAJuror, jurorOrdinalFor, seatedJurors, isSeatedJuror,
  juryStillToSeat, juryLines,
} from '../js/bb/jury.js';

beforeEach(() => {
  setGs({ episode: 0, activePlayers: [], bb: { weeks: [] } });
  seasonConfig.jurySize = 7;
});
afterAll(() => { delete seasonConfig.format; });

describe('when it opens', () => {
  it('opens with jurySize + 2 in the house — the final three cut is a seat', () => {
    expect(juryOpensAt({ jurySize: 7 })).toBe(9);
    expect(juryOpensAt({ jurySize: 9 })).toBe(11);
    expect(juryOpensAt({ jurySize: 3 })).toBe(5);
  });

  it('never opens without a jury', () => {
    expect(juryOpensAt({ jurySize: 0 })).toBe(0);
    expect(evictionSeatsAJuror(9, { jurySize: 0 })).toBe(false);
    expect(evictionSeatsAJuror(4, { jurySize: 0 })).toBe(false);
  });

  // The table the bug lived in. `houseAtStart` counts the person about to
  // leave, which is what week.houseAtStart holds — passing the post-eviction
  // number is exactly how this went wrong.
  it.each([
    [11, false, 0, 'eleven left — going home'],
    [10, false, 0, 'ten left — going home, and this is the one it got wrong'],
    [9,  true,  1, 'nine left — first member of the jury'],
    [8,  true,  2, 'eight left — second juror'],
    [7,  true,  3, 'seven left — third juror'],
    [4,  true,  6, 'four left — sixth and last of the weekly jurors'],
  ])('at %i in the house: %s', (houseAtStart, seats, ordinal, _label) => {
    expect(evictionSeatsAJuror(houseAtStart, { jurySize: 7 })).toBe(seats);
    expect(jurorOrdinalFor(houseAtStart, { jurySize: 7 })).toBe(ordinal);
  });

  it('leaves exactly one seat for the houseguest cut at three', () => {
    // Six weekly evictions seat six. The seventh chair is the final-three cut,
    // which is why the window opens at jurySize + 2 and not + 1.
    const weekly = [9, 8, 7, 6, 5, 4]
      .filter(n => evictionSeatsAJuror(n, { jurySize: 7 })).length;
    expect(weekly).toBe(6);
    expect(Number(seasonConfig.jurySize) - weekly).toBe(1);
  });
});

describe('who is on it', () => {
  /** A played week, oldest first. */
  const week = (num, houseAtStart, evicted, extra = {}) =>
    ({ num, houseAtStart: Array.from({ length: houseAtStart }, (_, i) => `P${i}`),
      evicted, ...extra });

  it('counts nobody before the window opens', () => {
    gs.bb.weeks = [week(1, 12, 'A'), week(2, 11, 'B'), week(3, 10, 'C')];
    expect(seatedJurors()).toEqual([]);
    expect(juryStillToSeat()).toBe(7);
  });

  it('seats them in order once it does', () => {
    gs.bb.weeks = [
      week(1, 11, 'A'), week(2, 10, 'B'),      // pre-jury
      week(3, 9, 'C'), week(4, 8, 'D'), week(5, 7, 'E'),
    ];
    expect(seatedJurors()).toEqual(['C', 'D', 'E']);
    expect(isSeatedJuror('C')).toBe(true);
    expect(isSeatedJuror('B'), 'a pre-juror is not on the jury').toBe(false);
    expect(juryStillToSeat()).toBe(4);
  });

  it('does not seat an eviction a Battle Back undid', () => {
    // The week keeps its record — the vote happened and the transcript still
    // says so — but a returnee must not sit on the jury they are still playing
    // against. A later eviction has its own week and seats them properly.
    gs.bb.weeks = [
      week(3, 9, 'C'),
      week(4, 8, 'D', { evictionReversed: true }),
      week(5, 8, 'E'),
    ];
    expect(seatedJurors()).toEqual(['C', 'E']);
    expect(isSeatedJuror('D')).toBe(false);
  });

  it('can be read as it stood at an earlier week', () => {
    gs.bb.weeks = [week(3, 9, 'C'), week(4, 8, 'D'), week(5, 7, 'E')];
    expect(seatedJurors({ upToWeek: 4 })).toEqual(['C', 'D']);
  });

  it('never returns more chairs than the jury has', () => {
    // A long season with a small jury: the earliest seats fall off the front,
    // the same way the finale clamps them.
    seasonConfig.jurySize = 3;
    gs.bb.weeks = [week(1, 5, 'A'), week(2, 4, 'B'), week(3, 3, 'C'), week(4, 3, 'D')];
    const jury = seatedJurors();
    expect(jury.length).toBeLessThanOrEqual(3);
    expect(jury).toEqual(['B', 'C', 'D']);
  });

  it('still seats a week that never recorded its opening house', () => {
    // Seasons saved before houseAtStart was written, and weeks assembled by
    // hand, have an eviction and no house size. The eviction is the authority:
    // returning an EMPTY jury at the finale is a much worse answer than one
    // pre-juror too many, and the clamp settles the count regardless.
    gs.bb.weeks = [week(3, 9, 'C'), { num: 4, evicted: 'D' }];
    expect(seatedJurors()).toEqual(['C', 'D']);
  });

  it('seats nobody at all when the season has no jury', () => {
    seasonConfig.jurySize = 0;
    gs.bb.weeks = [week(3, 9, 'C'), week(4, 8, 'D')];
    expect(seatedJurors()).toEqual([]);
  });
});

describe('what the transcripts say about it', () => {
  const week = (num, houseAtStart, evicted, extra = {}) =>
    ({ num, houseAtStart: Array.from({ length: houseAtStart }, (_, i) => `P${i}`),
      evicted, ...extra });
  const write = w => { const out = []; juryLines(w, l => out.push(l)); return out.join('\n'); };

  it('says nothing at all before the jury opens', () => {
    // A pre-jury eviction must not carry a roster, or the milestone stops
    // being one.
    gs.bb.weeks = [week(1, 12, 'A')];
    expect(write(gs.bb.weeks[0])).toBe('');
  });

  it('announces the first juror in full, once', () => {
    gs.bb.weeks = [week(1, 10, 'A'), week(2, 9, 'B')];
    const out = write(gs.bb.weeks[1]);
    expect(out).toMatch(/B is the first member of the jury/);
    expect(out).toMatch(/everybody voted out helps decide who wins/);
    expect(out).toMatch(/Jury \(1\): B\./);
  });

  it('counts after that, and carries the roster', () => {
    gs.bb.weeks = [week(2, 9, 'B'), week(3, 8, 'C'), week(4, 7, 'D')];
    const out = write(gs.bb.weeks[2]);
    expect(out, 'the first-juror line is not repeated').not.toMatch(/first member/);
    expect(out).toMatch(/D joins the jury — number 3 out there/);
    expect(out).toMatch(/Jury \(3\): B, C, D\./);
  });

  it('still carries the roster on a week that seats nobody', () => {
    // A cancelled eviction, or a week somebody returned: the panel is still
    // out there and the reader is still doing sums against it.
    gs.bb.weeks = [week(2, 9, 'B'), week(3, 8, 'C')];
    const out = write({ num: 3, evicted: null });
    expect(out).toMatch(/Jury \(2\): B, C\./);
    expect(out).not.toMatch(/joins the jury/);
  });
});

describe('a seated juror is not a jury PLAN', () => {
  it('keeps the two ideas apart', () => {
    // plan.juryPlan is prospective — the ACTIVE houseguests somebody hopes will
    // eventually vote for them. seatedJurors is who is actually out there and
    // can. Collapsing them would lose the "who do I want voting for me" read
    // that drives the whole endgame, so this pins that they answer different
    // questions from different sources.
    gs.bb.weeks = [
      { num: 3, houseAtStart: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], evicted: 'I' },
    ];
    gs.intentions = { A: { juryPlan: ['B', 'C'] } };

    expect(seatedJurors(), 'the panel is who has left').toEqual(['I']);
    expect(gs.intentions.A.juryPlan, 'the plan is who is still playing').toEqual(['B', 'C']);
    expect(seatedJurors().some(n => gs.intentions.A.juryPlan.includes(n))).toBe(false);
  });
});
