// ══════════════════════════════════════════════════════════════════════
// tr-sacrifice.test.js — spending a burned fellow, and paying for a
// wrong call
// ══════════════════════════════════════════════════════════════════════
//
// Two rules land together because the second is what makes the first pay:
//
//   1. A Traitor may join a pile-on that is already forming on a FELLOW
//      Traitor, and may cut a burned fellow loose at the ballot more cheaply
//      than a safe one.
//   2. Everybody who publicly named the banished player is priced once the
//      reveal is in: credit if the name was a Traitor, a small mark if it was
//      a Faithful.
//
// Rule 1 buys cover ONLY because rule 2 exists and does not know about
// Traitors — the name really was a Traitor, so the credit is earned by the
// same rule that punishes anyone else for being wrong. That is the whole
// argument for writing it as a rule rather than as a Traitor power, and the
// last test in this file is the one that would catch it being special-cased.
import { describe, expect, it } from 'vitest';
import { gs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { alignmentAt } from '../js/tr/roles.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

/**
 * Seasons, with each round joined to the log line that says who went.
 *
 * ALIGNMENT IS SNAPSHOTTED HERE AND NOT READ LATER. `alignmentAt` resolves
 * against `gs`, which holds whichever season was played LAST — so calling it
 * from an assertion after a 60-season sweep answers about season 60 for every
 * row in the table. That produced a confident, entirely false "a non-Traitor
 * sacrificed" on the first run of this file, and the same trap silently zeroed
 * an exploratory measurement earlier the same day. Read it while its season is
 * still the current one, keep the answer.
 */
function sweep(n) {
  const out = [];
  for (let seed = 1; seed <= n; seed++) {
    setPlayers(ROSTER);
    seasonConfig.trShieldSource = 'mission';
    const res = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
    const byEp = new Map();
    for (const r of (res.rounds || [])) byEp.set(r.ep, r);
    for (const L of (res.log || [])) {
      const r = byEp.get(L.ep);
      if (!r) continue;
      const align = {};
      for (const nm of CAST) align[nm] = alignmentAt(nm, L.ep);
      out.push({ seed, ep: L.ep, round: r, log: L, align });
    }
  }
  return out;
}
const NIGHTS = sweep(60);

describe('a Traitor can spend a fellow the room has already burned', () => {
  it('happens, and is rare enough to stay a move rather than a habit', () => {
    const sacs = NIGHTS.flatMap(n => (n.round.accusations || []).filter(a => a.sacrifice));
    const acc = NIGHTS.reduce((t, n) => t + (n.round.accusations || []).length, 0);
    const seasons = new Set(NIGHTS.filter(n =>
      (n.round.accusations || []).some(a => a.sacrifice)).map(n => n.seed));
    // MEASURED at 19 across these 60 seasons, in 14 of them. Banded rather
    // than pinned: the exact count rides the rng stream, and what this guards
    // is that the move is REACHABLE and stays a set piece. A pool where every
    // Traitor throws every burned ally is not this format.
    expect(sacs.length, 'the sacrifice never fires at all').toBeGreaterThan(4);
    expect(sacs.length / acc, 'the sacrifice is no longer a rare move')
      .toBeLessThan(0.03);
    expect(seasons.size, 'no season contains one').toBeGreaterThan(3);
  });

  it('is always aimed at a real fellow, and never on the first table', () => {
    for (const n of NIGHTS) {
      for (const a of (n.round.accusations || []).filter(x => x.sacrifice)) {
        expect(n.align[a.accuser], `s${n.seed} ep${n.ep}: a non-Traitor sacrificed`)
          .toBe('traitor');
        expect(n.align[a.target], `s${n.seed} ep${n.ep}: sacrificed a non-Traitor`)
          .toBe('traitor');
        // THE PILE-ON HAS TO EXIST FIRST. `burnedFellow` reads the accusations
        // made SO FAR TONIGHT and `debate()` fills them in speaking order, so
        // a Traitor can only ever join a burn already under way. This is what
        // stops the mechanic being a night-one confession — structurally,
        // rather than by a date check — so it is asserted rather than trusted.
        const before = [];
        for (const x of (n.round.accusations || [])) {
          if (x === a) break;
          before.push(x);
        }
        expect(before.filter(x => x.target === a.target).length,
          `s${n.seed} ep${n.ep}: sacrificed somebody nobody had named yet`)
          .toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('the table prices who was right', () => {
  it('records the accusers it priced, and only on a night with a reveal', () => {
    let withPricing = 0;
    for (const n of NIGHTS) {
      if (!n.log.banished) continue;
      const priced = n.round.accusersPriced;
      if (!priced) continue;
      withPricing++;
      const named = new Set((n.round.accusations || [])
        .filter(a => a.target === n.log.banished).map(a => a.accuser));
      for (const p of priced) {
        expect(named.has(p), `s${n.seed} ep${n.ep}: priced somebody who never named them`)
          .toBe(true);
      }
    }
    expect(withPricing, 'no night priced anybody').toBeGreaterThan(50);
  });

  // THE RULE IS BLIND TO ALIGNMENT, which is the property the whole design
  // rests on. If a Traitor's correct call were credited by a different path
  // than a Faithful's, the sacrifice would be a Traitor power wearing a rule's
  // clothes — and the credit would stop being cover the room could believe.
  it('credits a Traitor who calls it exactly as it credits a Faithful', () => {
    let tCredited = 0, fCredited = 0;
    for (const n of NIGHTS) {
      if (!n.log.banished || !n.log.wasTraitor || !n.round.accusersPriced) continue;
      for (const p of n.round.accusersPriced) {
        if (n.align[p] === 'traitor') tCredited++; else fCredited++;
      }
    }
    // Both populations are reached by the same code path, so both must be
    // non-empty; a zero on either side means one of them is being routed
    // somewhere else.
    expect(fCredited, 'no Faithful was ever credited for a correct call')
      .toBeGreaterThan(0);
    expect(tCredited, 'no Traitor was ever credited for a correct call — the '
      + 'rule has stopped being blind to alignment').toBeGreaterThan(0);
  });
});
