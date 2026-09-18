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
  /* WHAT SHE JUST WATCHED. The showcase is the last thing these jurors saw
     and the only part of the night they are judging live; without it the
     ballot is a popularity contest about twelve episodes that are already
     over, and a finalist could kill on that stage and lose the room anyway.
     Centred on the field, so it reads as "better than the others tonight"
     rather than as an absolute score nobody can see. */
  showcase = {},
  /* AND HER OWN CIRCLE. A juror who was in a bloc with a finalist is not
     neutral about her, and js/dr/alliances.js already knows who was in whose.
     `allies[juror]` is the finalists she ran with. */
  allies = {},
} = {}) {
  const votes = Object.fromEntries(finalists.map(n => [n, 0]));
  const reasons = [];
  if (!finalists.length) return { order: [], votes, reasons };

  const mean = finalists.reduce((t, n) => t + recordStrength(record[n] || []), 0) / finalists.length;
  const shows = finalists.map(n => Number(showcase[n]) || 0);
  const showMean = shows.length ? shows.reduce((a, b) => a + b, 0) / shows.length : 0;
  for (const juror of jurors) {
    const mine = allies[juror] || [];
    const scored = finalists.map(n => {
      const like = Number(bond(juror, n)) || 0;
      const season = recordStrength(record[n] || []) - mean;
      const tonight = (Number(showcase[n]) || 0) - showMean;
      const ally = mine.includes(n) ? 1 : 0;
      /* SHE ENDED MY SEASON. On All Stars that is a specific queen holding a
         specific lipstick, and a juror remembers. It does not disqualify the
         finalist — a juror can respect the queen who beat her — it just costs
         her, which is what the seasons look like. */
      const grudge = (ledger?.grudges || [])
        .some(g => g.by === juror && g.against === n) ? 1 : 0;
      return {
        n,
        /* The four things a juror is actually weighing, and the grudge is
           sized to lose to a genuinely better season — she can respect the
           queen who beat her, she just has to be given a reason. */
        score: like * 0.35 + season * 0.8 + tonight * 0.5 + ally * 0.6 - grudge * 1.2,
        like, season, grudge, tonight, ally,
      };
    }).sort((a, b) => b.score - a.score);
    const pick = scored[0];
    votes[pick.n] += 1;
    /* WHY, from whichever term actually carried it — never from her
       archetype, which would let the label and the ballot disagree. Checked
       in the order a juror would say them out loud. */
    const runnerUp = scored[1];
    reasons.push({
      juror,
      voted: pick.n,
      over: runnerUp ? runnerUp.n : null,
      // The reason explains a MOVE, not a feeling — the shape rate.js uses.
      why: pick.grudge ? 'respect-despite'
        : pick.ally ? 'circle'
          : pick.like >= 4 ? 'friend'
            : pick.tonight > 0.6 ? 'tonight'
              : pick.season > 0 ? 'season' : 'least-worst',
      /* AND WHETHER IT WAS CLOSE, so the screen can tell a juror who agonised
         from one who had decided weeks ago. */
      close: runnerUp ? Math.abs(pick.score - runnerUp.score) < 0.5 : false,
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
