// ══════════════════════════════════════════════════════════════════════
// dr-draft-legibility.test.js — a draft that can be read
// ══════════════════════════════════════════════════════════════════════
//
// The acting night's board was accurate and unreadable. Every fact on it was
// true; what it added up to was thirteen queens in one numbered queue, ten of
// them marked as having lost something, three or four of them naming the same
// queen, and nobody visibly happy with anything.
//
// None of that was a simulation bug. A serial draft whose preference lists
// all open on the lead MAKES most of the room miss its first choice — measured
// at 71.7% over 200 thirteen-queen casts, mean fall 1.8 parts. The screen was
// reporting the format as if it were the night's news.
//
// These guard the reading, not the draft.
import { describe, expect, it } from 'vitest';
import { rngFor } from '../js/dr/rng.js';
import { assign } from '../js/dr/chal/acting.js';
import rosterJson from '../franchise_roster.json';

const arr = Array.isArray(rosterJson) ? rosterJson
  : (rosterJson.players || Object.values(rosterJson)[0]);
const queens = arr.filter(p => p.drag).slice(0, 13);
const players = Object.fromEntries(queens.map(q => [q.name, q]));
const living = queens.map(q => q.name);
const draft = seed => assign({
  living, players, rng: rngFor(seed), miniWinner: null, mini: null,
  maxi: { id: 'acting' }, cfg: { actFormat: 'two-casts' }, bond: () => 0,
});

describe('the acting draft', () => {
  it('says what she wanted, not only who has it', () => {
    /* The board read "lost hers to Quin" and never once said what hers WAS —
       the card shows the part she ended up with, so the reader was told she
       lost something, told who took it, and left to work out which of six
       parts was meant. */
    const a = draft(1);
    const missed = living.map(n => a.picks[n]).filter(p => p.lostTo);
    expect(missed.length).toBeGreaterThan(0);
    for (const p of missed) {
      expect(p.wanted, 'a miss with no name for the thing missed').toBeTruthy();
      expect(p.wanted).not.toBe(p.choice);
    }
  });

  it('starts a fight only over a part she was close to', () => {
    /* `lostTo` names whoever holds her FIRST choice however far she fell, and
       every list opens on the lead — so a queen five parts down had a scene
       with the queen who took the lead. That is the mechanism that made three
       or four cards a night all point at whoever picked first. */
    for (let s = 0; s < 40; s++) {
      const a = draft(s);
      for (const e of a.events) {
        const loser = e.data?.loser;
        if (!loser) continue;
        expect(a.picks[loser].depth,
          `${loser} fights over a part she missed by ${a.picks[loser].depth}`)
          .toBeLessThanOrEqual(2);
      }
    }
  });

  it('does not point the whole room at one queen', () => {
    // Measured: 3.02 before the near-miss gate, 2.41 after, over 200 casts.
    const worst = [];
    for (let s = 0; s < 200; s++) {
      const a = draft(s);
      const h = {};
      for (const e of a.events) if (e.data?.keeper) h[e.data.keeper] = (h[e.data.keeper] || 0) + 1;
      worst.push(Math.max(0, ...Object.values(h)));
    }
    const mean = worst.reduce((x, y) => x + y, 0) / worst.length;
    expect(mean, 'one queen is named in too many of the night&apos;s conflicts')
      .toBeLessThan(2.8);
  });

  it('still lets the draft cost her the part', () => {
    /* The gate is on the GRIEVANCE, not on the outcome. A queen who fell five
       parts still fell five parts: she keeps the depth, the penalty and her
       row on the board. Quietening the screen must not quietly hand everybody
       what they wanted. */
    let deep = 0;
    for (let s = 0; s < 40; s++) {
      const a = draft(s);
      for (const n of living) if (a.picks[n].depth > 2) deep++;
    }
    expect(deep, 'nobody ever falls far any more — the draft stopped biting')
      .toBeGreaterThan(20);
  });

  it('splits the room into two casts running the same parts', () => {
    // What the board has to show. Thirteen queens in one ungrouped list is how
    // the first picker of the second cast came out looking like seat 8.
    const a = draft(1);
    expect(a.division).toBe('two-casts');
    expect(a.teams).toHaveLength(2);
    const parts = a.teams.map(t => t.map(n => a.picks[n].choice));
    // the same script both times: the leads share a name across the two casts
    const shared = parts[0].filter(x => parts[1].includes(x));
    expect(shared.length, 'the two casts are not doing the same script')
      .toBeGreaterThan(2);
  });
});
