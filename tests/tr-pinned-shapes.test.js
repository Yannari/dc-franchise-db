// ══════════════════════════════════════════════════════════════════════
// tests/tr-pinned-shapes.test.js — a twist the author pinned is not a
// suggestion
// ══════════════════════════════════════════════════════════════════════
//
// Reported twice, a day apart, and the second time in the shape that made the
// class obvious:
//
//   "death match doesnt happen when an offer is suppose to happen so it get
//    wasted is it normal?"
//   "some twist dont work like on trial twist"
//
// Both were the same defect and it is §11.5's "author's pin accepted by a
// season already decided". `pickVariant` honours `gs.tr.murderSchedule[ep]`,
// but three things can cancel the NIGHT before it is ever asked:
//
//   * the room takes the deal at the dinner — a unanimous banishment buys the
//     night off, so there is no murder to shape (16 seasons in 30 with both
//     pinned to the same episode);
//   * the pact makes an offer instead of murdering, which it does whenever it
//     is thin and a Traitor has been banished (8 of 40 pinned nights);
//   * the pact is already wiped out, or the fire round has been reached.
//
// The first two are the format working correctly. Throwing the author's twist
// away without a word is not, and it is invisible from the outside: the
// timeline says Death Match, the season plays, and nothing anywhere says the
// night it was booked on never happened.
//
// So a rained-off shape moves to the next night, and every one of them leaves a
// row on `gs.tr.shapesMoved`. Measured over the same 40 pinned On Trial nights:
// 32 ran before, 39 after.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { rpBuildColdOpen } from '../js/vp-tr/cold-open.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

function play(opts) {
  setPlayers(ROSTER);
  setGs({});
  playTraitorsSeason({ cast: CAST, traitorCount: 3, ...opts });
  return {
    rounds: gs.tr.rounds || [],
    moved: gs.tr.shapesMoved || [],
    rows: gs.episodeHistory || [],
  };
}

describe('a pinned murder shape survives a night that never happened', () => {
  it('lands on nine nights in ten across a pinned sweep', () => {
    let asked = 0, ran = 0, unexplained = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { rounds, moved } = play({ seed, murderSchedule: { 3: 'on-trial', 5: 'on-trial' } });
      asked += 2;
      ran += rounds.filter(r => r.variant === 'on-trial').length;
      // EVERY MISSING NIGHT IS ACCOUNTED FOR. This is the assertion that would
      // have caught the original report: a pin that did not run and left no
      // row is a twist that vanished.
      for (const ep of [3, 5]) {
        const r = rounds.find(x => x.ep === ep);
        if (!r || r.variant === 'on-trial') continue;
        if (!moved.some(m => m.from === ep)) unexplained++;
      }
    }
    expect(unexplained, 'a pinned night did not run and nothing recorded why').toBe(0);
    // 39 of 40 when this was written. The floor is well under it so ordinary
    // drift does not fail the arm, and well over the 32 it used to manage.
    expect(ran / asked, 'pinned shapes are being eaten again').toBeGreaterThan(0.85);
  });

  it('moves the shape rather than losing it when the room buys the night off', () => {
    let taken = 0, carried = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const { rounds, moved } = play({ seed,
        murderSchedule: { 5: 'death-match' }, banishOrMurderSchedule: [5] });
      const r = rounds.find(x => x.ep === 5);
      if (!r?.banishOrMurder?.unanimous) continue;
      taken++;
      // A bought night has a banishment and no murder — that part is the
      // format and must not change.
      expect(r.banished).toBeTruthy();
      expect(r.murdered).toBeFalsy();
      const row = moved.find(m => m.from === 5);
      expect(row, 'the deal ate a pinned shape silently').toBeTruthy();
      expect(row.shape).toBe('death-match');
      expect(row.why).toMatch(/deal/);
      expect(row.to).toBe(6);
      if (row.ran) {
        carried++;
        expect(rounds.find(x => x.ep === 6).variant).toBe('death-match');
      }
    }
    expect(taken, 'no season took the deal in 30 seeds').toBeGreaterThan(5);
    expect(carried / taken, 'the carried shape almost never lands').toBeGreaterThan(0.5);
  });

  it('moves it when the pact makes an offer instead of murdering', () => {
    let seen = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { rounds, moved } = play({ seed, murderSchedule: { 3: 'on-trial', 5: 'on-trial' } });
      for (const row of moved.filter(m => /offer/.test(m.why))) {
        seen++;
        const night = rounds.find(x => x.ep === row.from);
        // The night it was booked on really did go to a recruitment.
        expect(night.recruitment, 'a shape was blamed on an offer nobody made').toBeTruthy();
        expect(night.murdered).toBeFalsy();
      }
    }
    expect(seen, 'no pinned night was eaten by an offer in 20 seeds').toBeGreaterThan(2);
  });

  it('never writes over a night the author had already booked', () => {
    // Two pins back to back: if the first is rained off it may not evict the
    // second, because a booked night is a decision and a rained-off one is not.
    let collided = 0;
    for (let seed = 1; seed <= 25; seed++) {
      const { rounds, moved } = play({ seed,
        murderSchedule: { 4: 'on-trial', 5: 'dungeon' } });
      for (const row of moved.filter(m => m.from === 4)) {
        collided++;
        expect(row.to, 'a rained-off pin evicted the next night\'s pin').toBe(null);
        expect(row.ran).toBe(false);
        const five = rounds.find(x => x.ep === 5);
        // The author's second pin is untouched — it ran, or it was itself
        // rained off, but it was never replaced by the first one.
        if (five && five.variant) expect(five.variant).not.toBe('on-trial');
      }
    }
    expect(collided, 'the two-pin case never arose in 25 seeds').toBeGreaterThan(0);
  });

  it('a recruitment the author pinned is not treated as a night that was lost', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { moved } = play({ seed, murderSchedule: { 5: 'recruit' } });
      // `recruit` IS the night. Carrying it forward would book a second
      // recruitment the author never asked for.
      expect(moved.some(m => m.shape === 'recruit')).toBe(false);
    }
  });

  // ── AND THE OTHER HALF OF THE REPORT ─────────────────────────────────
  //
  // A night the room bought off used to draw the ordinary full-table pool,
  // whose four sentences are all built on the castle NOT knowing why nobody is
  // missing ("somewhere behind that is a decision that did not survive contact
  // with the night, and nobody at this table can see it"). On this one morning
  // the room can see it perfectly: it voted, out loud, in front of itself.
  it('the morning after a bought night says why the table is full', () => {
    let checked = 0;
    for (let seed = 1; seed <= 20 && checked < 3; seed++) {
      const { rounds, rows } = play({ seed, banishOrMurderSchedule: [5] });
      if (!rounds.find(x => x.ep === 5)?.banishOrMurder?.unanimous) continue;
      const row = rows.find(e => Number(e.num) === 6);
      if (!row) continue;
      const html = rpBuildColdOpen(row, 'audience');
      expect(html).toMatch(/voted, out loud|Every hand went up|That was the deal|They paid for that/);
      // And it is PUBLIC, unlike a blocked murder: a player watching the same
      // morning gets the same sentence, because they were in the room.
      const who = (rounds.find(x => x.ep === 5) || {}).banished;
      const alive = (row.tr?.living || []).find(n => n !== who);
      if (alive) {
        expect(rpBuildColdOpen(row, `player:${alive}`))
          .toMatch(/voted, out loud|Every hand went up|That was the deal|They paid for that/);
      }
      checked++;
    }
    expect(checked, 'no bought night in 20 seeds').toBeGreaterThan(0);
  });
});
