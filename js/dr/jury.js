// ══════════════════════════════════════════════════════════════════════
// dr/jury.js — the Jury of Queer Peers (All Stars)
// ══════════════════════════════════════════════════════════════════════
//
// AS3's own rule, and the only ballot this show has: the queens the season
// already sent home come back and decide which two finalists sing for the
// crown. The chart keeps a cell for it — "eliminated by the Jury of Queer
// Peers and did not advance to the final lip sync".
//
// ── AND IT DOES NOT BREAK THE FIRST LAW ───────────────────────────────
//
// `docs/drag-race.md` opens with THERE IS NO VOTE, and this is a vote. The
// distinction is exact and it is the whole reason this twist is allowed:
//
//   * the ROOM never votes. Nobody still competing has a say in who leaves,
//     on any night, ever. That is the rule the show is built on.
//   * these queens are already OUT. They end nobody — everybody they are
//     voting on has already survived the whole season — and they decide only
//     which two of the finalists perform last.
//
// A reader who finds a ballot in js/dr/ and assumes the bug has returned
// should read that twice. It is also why the jury lives in its own file
// rather than inside the finale: one place to look, one rule, one comment.
//
// ── WHAT A JUROR WANTS ────────────────────────────────────────────────
//
// Not "who deserves it" in the abstract. A juror votes the way the seasons
// show her voting: for the queen she LIKES, adjusted by what she thinks of
// the season that queen played, and against the queen who ended her own run.
// All three are state — bonds, the chart, and the power ledger — so the
// ballot is deterministic and consumes no game rng.
import { recordStrength } from './season.js';

/**
 * Who the jury sends to the final song.
 *
 * `jurors`   the queens already out, in elimination order
 * `finalists` everybody still standing
 * `bond(a,b)` the relationship ledger
 * `record`   `state.record`
 * `ledger`   `state.power` — who spent an exit on whom
 *
 * Returns `{ order, votes, reasons }`: the finalists best-supported first,
 * a tally per finalist, and one short reason per juror for the screen.
 */
export function juryVote({
  jurors = [], finalists = [], bond = () => 0, record = {}, ledger = {}, rng = Math.random,
} = {}) {
  const votes = Object.fromEntries(finalists.map(n => [n, 0]));
  const reasons = [];
  if (!finalists.length) return { order: [], votes, reasons };

  const mean = finalists.reduce((t, n) => t + recordStrength(record[n] || []), 0) / finalists.length;
  for (const juror of jurors) {
    const scored = finalists.map(n => {
      const like = Number(bond(juror, n)) || 0;
      const season = recordStrength(record[n] || []) - mean;
      /* SHE ENDED MY SEASON. On All Stars that is a specific queen holding a
         specific lipstick, and a juror remembers. It does not disqualify the
         finalist — a juror can respect the queen who beat her — it just costs
         her, which is what the seasons look like. */
      const grudge = (ledger?.grudges || [])
        .some(g => g.by === juror && g.against === n) ? 1 : 0;
      return {
        n,
        score: like * 0.35 + season * 0.8 - grudge * 1.2,
        like, season, grudge,
      };
    }).sort((a, b) => b.score - a.score);
    const pick = scored[0];
    votes[pick.n] += 1;
    reasons.push({
      juror,
      voted: pick.n,
      // The reason explains a MOVE, not a feeling — the shape rate.js uses.
      why: pick.grudge ? 'respect-despite'
        : pick.like >= 4 ? 'friend'
          : pick.season > 0 ? 'season' : 'least-worst',
    });
  }

  /* TIES GO TO THE SEASON, NOT TO A COIN. Two finalists on the same number
     of votes are separated by the record the jury was judging in the first
     place, so the tie-break is the same question asked again rather than a
     different one. A dead heat on both is broken by the rng, which is the
     only place chance is allowed near this. */
  const order = [...finalists].sort((a, b) => (votes[b] - votes[a])
    || (recordStrength(record[b] || []) - recordStrength(record[a] || []))
    || (rng() - 0.5));
  return { order, votes, reasons };
}
