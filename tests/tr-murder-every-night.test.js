// ══════════════════════════════════════════════════════════════════════
// tr-murder-every-night.test.js — the castle only sleeps safe once
// ══════════════════════════════════════════════════════════════════════
//
// Reported from a played season: "I tested one episode before the finale,
// there was no murder despite being a top 6 with 2 Traitors still there." And
// the rule the report came with: "the only day there's no murder has got to be
// the final day, or if all the Traitors are banished, that's it. Also force a
// last banishment always before the endgame, even when all the Traitors are
// out."
//
// Both were real, and they were two different suppressions in headless.js.
//
//   1. A murder that would take the room TO the endgame size was not
//      committed, so the last banishment rather than the pact delivered the
//      handover. It bought exactness on the odd cast counts; it cost a second
//      dark night one episode before the finale, which is what was reported.
//      Measured over 24 seasons at `endgameSize: 4`, seed 1 ran + + + + + + +
//      - -, two dark nights in a row at the end.
//   2. `!tr || !fa` broke at the TOP of an episode, so a season whose pact had
//      been wiped out simply stopped — no mission, no castle day, no table —
//      and the fire round opened on a room nobody had voted on. Measured at
//      `endgameSize: 4`: the endgame opened with 6, 8, 9 and 11 players.
//
// ── WHAT THE FORMAT ACTUALLY DOES ────────────────────────────────────
//
// End Game (Traitors Wiki): the murders run every night up to and including
// the night before the finale, and the finale DAY is the one with no murder in
// it — mission, Round Table, then vote-or-end, repeating until the room votes
// to stop. UK series one is the worked example: six left at the end of the
// previous episode, and the finale banishes twice with no murder between.
//
// Removing (1) cost nothing on size, which is the part that is not obvious.
// The two parities reach the endgame from opposite sides — from six the murder
// lands the room on four and the finale is its own day; from seven the table
// lands it on four and the handover skips that night, so the finale is that
// same episode. Measured over the same 24 seasons, exact opens went 7 -> 10 of
// 24 at `endgameSize: 3`, 12 -> 12 at 4 and 14 -> 16 at 5. It got better.
import { describe, it, expect } from 'vitest';
import { gs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
const SIZES = [3, 4, 5];
const SEEDS = Array.from({ length: 24 }, (_, i) => i + 1);

/** One season, reduced to the facts these arms ask about. */
function play(seed, endgameSize) {
  setPlayers(ROSTER);
  seasonConfig.trShieldSource = 'mission';
  const s = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed, endgameSize });
  const rows = gs.episodeHistory || [];
  const finaleRow = rows.filter(r => r.tr && r.tr.endgame).pop();
  const eg = finaleRow && finaleRow.tr.endgame;
  return {
    seed, endgameSize, rows,
    finaleEp: finaleRow ? Number(finaleRow.num) : null,
    finaleHasTable: !!(finaleRow && finaleRow.tr && finaleRow.tr.table),
    // The room the FIRST vote-or-end was put to — the size the fire round
    // opened at. NOT `tr.living`, which is written after the endgame ran and
    // therefore counts survivors; the first draft of this file measured that
    // and reported an endgame of three for a configured four.
    openedWith: eg && eg.asks && eg.asks[0] ? eg.asks[0].living.length : null,
    // Every mandated night, with the pact's size as it stood at that table.
    nights: s.log.map(l => ({ ep: l.ep, alive: l.alive,
      traitors: l.traitorsAtVote,
      // A NIGHT SPENT MAKING AN OFFER HOLDS NO CONCLAVE (js/tr/headless.js).
      // It is the third legitimate dark night and it is in the format — UK
      // series one, Wilf recruits Kieran face to face and nobody is murdered
      // that night. Recorded here so the arm below exempts it BY NAME rather
      // than by widening a tolerance until it fits.
      recruited: !!l.recruited,
      struck: !!(l.murdered || l.murderTarget) })),
  };
}

const RUNS = SIZES.flatMap(size => SEEDS.map(sd => play(sd, size)));

describe('the sweep is measuring real seasons', () => {
  it('played enough nights to say anything', () => {
    const nights = RUNS.reduce((n, r) => n + r.nights.length, 0);
    expect(RUNS).toHaveLength(SIZES.length * SEEDS.length);
    expect(nights, 'no mandated nights were played').toBeGreaterThan(200);
    expect(RUNS.every(r => r.openedWith != null),
      'a season never reached its endgame').toBe(true);
  });
});

describe('every night has a murder in it', () => {
  it('except the finale, and except a night with no pact left to hold one', () => {
    // The rule as reported, stated as written. A dark night is allowed on the
    // finale day (the format's one murder-free day); when the table has just
    // banished the last Traitor, because there is then nobody alive who could
    // hold a conclave; and on a night the pact spent recruiting instead, which
    // is the format doing it too (see `recruited` above). Nothing else.
    const wrong = [];
    for (const r of RUNS) {
      for (const n of r.nights) {
        if (n.struck) continue;
        if (n.ep === r.finaleEp) continue;
        if (!n.traitors) continue;
        if (n.recruited) continue;
        // `traitorsAtVote` is the count BEFORE that episode's table, so a
        // night whose pact was wiped out AT that table reads 1 here and 0
        // afterwards. Confirm against the season rather than assuming it.
        const nextRow = r.nights.find(x => x.ep === n.ep + 1);
        if (nextRow && !nextRow.traitors) continue;
        if (!nextRow && n.traitors === 1) continue;
        wrong.push(`size ${r.endgameSize} seed ${r.seed} ep ${n.ep}: `
          + `${n.alive} alive, ${n.traitors} Traitor(s), and no murder`);
      }
    }
    expect(wrong, 'a night went dark with a living pact and a finale still to come')
      .toEqual([]);
  });

  it('and the dark nights are rare enough to prove the arm is not vacuous', () => {
    // If every night struck, the arm above would pass by having nothing to
    // exempt — and it would keep passing if somebody deleted the exemptions.
    // Seasons DO end with a murder-free finale, so this must be non-zero.
    const dark = RUNS.reduce((n, r) => n + r.nights.filter(x => !x.struck).length, 0);
    expect(dark, 'no dark night at all — the exemptions are untested').toBeGreaterThan(5);
    const struck = RUNS.reduce((n, r) => n + r.nights.filter(x => x.struck).length, 0);
    expect(struck / (struck + dark),
      'the pact is striking on too few nights to call this every night')
      .toBeGreaterThan(0.7);
  });
});

describe('the endgame is handed a room that was voted on', () => {
  it('never opens on a room bigger than asked for without a reason', () => {
    // An endgame that opens with eleven players when the author asked for four
    // is the second defect. It is legitimate ONLY when the mandated game ended
    // early on its own terms — the pact wiped out, or parity — and in that
    // case the room must still have had a final Round Table first.
    for (const r of RUNS) {
      if (r.openedWith <= r.endgameSize) continue;
      expect(r.finaleHasTable,
        `size ${r.endgameSize} seed ${r.seed}: the endgame opened with ${r.openedWith} `
        + 'players and the finale episode ran no Round Table — nobody was asked to '
        + 'vote before the fire round').toBe(true);
    }
  });

  it('opens at the configured size, or one above it at three', () => {
    // A BAND, NOT A CONSTANT. An early end is a legitimate outcome and cannot
    // be assumed away, so this measures that the configured size is what
    // normally happens rather than pretending it always does.
    //
    // AND THE FIRST VERSION OF THIS ARM SHIPPED A STALE NUMBER. It asserted
    // >35% exact at every size, measured while the parity window was
    // temporarily pinned at +0 during the investigation below — a band taken
    // under a configuration that is not the one that ships. Against the real
    // engine size 3 comes in at 3/12, and the arm was red the moment the
    // window went back. Re-measured here, on the code as it stands.
    //
    // AND THE SECOND VERSION READ TWELVE SEEDS, which put size 4 at 5/12 and
    // sent me looking for a mechanism that was not there. At 24 seeds it is
    // 13/24. Small-sample noise, answered with a bigger sample rather than a
    // looser band — measured, cast 20, 24 seeds:
    //
    //   size 3   {3:10, 4:6, 5:4, 8:1, 9:1, 10:2}    exact 42%   at-or-+1 67%
    //   size 4   {4:13, 5:4, 6:3, 8:1, 9:1, 10:2}    exact 54%   at-or-+1 71%
    //   size 5   {5:17, 6:3, 8:1, 9:1, 10:2}         exact 71%   at-or-+1 83%
    //
    // The tail (8, 9, 10) is a season that ended on its own terms — a dead
    // pact — and the arm above proves those still had a Round Table first.
    //
    // WHY THREE SITS LOWEST. The parity window is `endgameSize + 2`, so at
    // size 3 it reaches five, and a pact that now strikes every night drives
    // the room to parity at four often. Narrowing the window was measured as
    // the alternative and rejected: at +0 every size lands 20/24, and
    // tr-calibration's endgame betrayal arm goes vacuous (78 qualifying
    // decisions against a floor of 150). See tr-endgame-opens-where-asked.
    for (const size of SIZES) {
      const of = RUNS.filter(r => r.endgameSize === size);
      const exact = of.filter(r => r.openedWith === size).length;
      const near = of.filter(r => r.openedWith === size || r.openedWith === size + 1).length;
      expect(exact / of.length,
        `endgameSize ${size} was honoured on only ${exact}/${of.length} seasons`)
        .toBeGreaterThan(0.35);
      // At every size, including three, the fire round opens at the number or
      // one above it on the clear majority of seasons. Anything further out is
      // a season that ended on its own terms, and the arm above proves those
      // were voted on first.
      expect(near / of.length,
        `endgameSize ${size} opened at ${size} or ${size + 1} on only `
        + `${near}/${of.length} seasons`).toBeGreaterThan(0.6);
      expect(of.every(r => r.openedWith >= 2)).toBe(true);
    }
  });
});
