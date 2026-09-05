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

  it('opens within one of the number the author asked for', () => {
    // ── WHAT `endgameSize` PROMISES, AFTER THE THIRD REPORT ───────────
    //
    // "If they arrive at four at the last episode, the next episode should
    // still include a banishment, right?" It should, and now does — the last
    // day is played in full rather than skipped (see the arm below). Which
    // settles what the setting can promise, because the two cannot both be
    // exact: the room loses two people an episode, one to the table and one to
    // the night, so with the pact striking every night there is no landing on
    // one number from both parities AND putting a banishment in front of it.
    // The fire round opens at the number when the table delivered the size,
    // and one below when the murder did.
    //
    // So the claim is WITHIN ONE, and the earlier exact-size bands in this
    // file are gone rather than loosened twice more — a band that has been
    // renegotiated three times is not measuring anything. Measured, cast 20,
    // 24 seeds, fire round opening:
    //
    //   size 3   {2:1, 3:12, 4:4, 5:4, 6:1, 9:1, 14:1}    within one 71%
    //   size 4   {3:9, 4:8, 5:4, 6:1, 9:1, 14:1}          within one 88%
    //   size 5   {4:5, 5:16, 6:1, 9:1, 14:1}              within one 92%
    //
    // The tail — 9, 14 — is a season that ended on its own terms with the pact
    // wiped out, and the arm above proves those had a Round Table first.
    for (const size of SIZES) {
      const of = RUNS.filter(r => r.endgameSize === size);
      const near = of.filter(r => Math.abs(r.openedWith - size) <= 1).length;
      expect(near / of.length,
        `endgameSize ${size} opened within one of the number on only `
        + `${near}/${of.length} seasons`).toBeGreaterThan(0.6);
      // And never below two — a fire round of one has nobody to ask.
      expect(of.every(r => r.openedWith >= 2),
        `endgameSize ${size} opened the fire round on fewer than two players`).toBe(true);
    }
  });

  it('always banishes on the last day, and never murders on it', () => {
    // THE REPORT, DIRECTLY. Before this, a finale reached by a murder was
    // built as a bare row — no mission, no castle day, no Round Table — and
    // the fire round opened straight onto a vote-or-end. A room that voted to
    // end at the first ask went home having never banished anybody on the last
    // day: the season's final removal was a murder. Measured over 30 seasons
    // at `endgameSize: 4`, seven finales were built that way and two of them
    // banished nobody at all.
    //
    // UK series one, episode twelve is the shape: a mission, Kieran banished
    // 4-1, Wilfred banished 3-1, and the three left took the money. The murder
    // was the night before.
    let missions = 0;
    for (const r of RUNS) {
      const row = r.rows.find(e => e.tr && e.tr.endgame);
      const eg = row.tr.endgame;
      const banishments = (eg.tables || []).length + (row.tr.table ? 1 : 0);
      expect(banishments, `size ${r.endgameSize} seed ${r.seed}: the last day banished `
        + 'nobody — the last removal of the season was a murder').toBeGreaterThan(0);
      expect(row.tr.conclave, `size ${r.endgameSize} seed ${r.seed}: the finale held a `
        + 'conclave — the last day is the one day with no murder in it').toBeFalsy();
      if (row.tr.mission) missions++;
    }
    // A finale that is a real day, not a bare row. Missions have their own
    // floor on room size (MIN_PLAYERS, js/tr/missions.js), so the smallest
    // endgames legitimately run without one — this asserts the day is normally
    // whole, not that the floor was removed.
    expect(missions / RUNS.length, 'the finale is rendering as a bare row again')
      .toBeGreaterThan(0.6);
  });
});
