// ══════════════════════════════════════════════════════════════════════
// dr/revenge.js — Revenge of the Queens (All Stars)
// ══════════════════════════════════════════════════════════════════════
//
// AS2 episode 5, read off the wikitext rather than remembered, because the
// first version of this was a lip sync bracket on an episode of its own —
// which is the reunion Smackdown wearing a different name, and nothing like
// the night the show actually ran.
//
// What it really is:
//
//   1. the queens the season already sent home WALK BACK IN, one at a time,
//      in a re-entrance order, into a room that is not expecting them
//   2. each of them is PAIRED with a queen still competing
//   3. the maxi challenge is performed in those pairs, in front of an
//      audience of past contestants
//   4. the panel names the TOP TWO COUPLES
//   5. the RETURNING half of each of those couples lip syncs — against each
//      other, for her place back in the competition. AS2 kept both of them
//   6. and the night still has a bottom, and still sends somebody home
//
// So it is a WEEK, not a side event: the same call, the same elimination, with
// a whole second cast woven through it. The engine runs the ordinary night and
// this module supplies the layer on top — who came back, who they were paired
// with, which couples the panel put first, and who won her way in.
//
// ── WHY A LAYER AND NOT A SECOND WEEK ENGINE ──────────────────────────
//
// `runDragWeek` is one function and already long. A second copy of it for one
// night a season would be the two-copies-of-one-rule failure this repo keeps
// paying for — and the night's own shape (challenge, runway, critiques, call,
// lip sync) is not what changes. What changes is who is in the room.
import { lipsyncScore } from './lipsync.js';

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

/**
 * Who comes back for the night, and who each of them is paired with.
 *
 * Every eliminated queen returns — the show brings them all back and only one
 * leaves with her place. Pairing is BY BOND: the room pairs off with the
 * people it already knows, which is also what makes the night mean something
 * (a queen performing beside the friend she watched go home, or beside the
 * queen who sent her there).
 *
 * `living` is the room as it stands; the returners are `out`.
 */
export function revengePairs({ living = [], out = [], bond = () => 0, rng = Math.random } = {}) {
  const returners = [...out];
  if (!returners.length || !living.length) return { returners: [], pairs: [] };
  /* The re-entrance order is the order they LEFT, reversed: the queen who
     went home last night walks in first and the first boot of the season
     comes in last, which is the order the show brings them out in. */
  const order = [...returners].reverse();
  const free = [...living];
  const pairs = [];
  for (const back of order) {
    if (!free.length) break;
    /* Her closest ally still in the competition, and a coin toss between
       equals so a room of strangers is not always paired the same way. */
    const best = [...free].sort((a, b) => (Number(bond(back, b)) || 0) - (Number(bond(back, a)) || 0)
      || (rng() - 0.5))[0];
    free.splice(free.indexOf(best), 1);
    pairs.push({ back, with: best, bond: Number(bond(back, best)) || 0 });
  }
  return { returners: order, pairs, unpaired: free };
}

/**
 * The couples the panel put first, and who wins her way back in.
 *
 * `rank` is the night's own ranking of the COMPETING queens (the bend, best
 * first) — a couple is only as good as the pair, and the competing half is
 * the one the panel has been watching all season. The returning half's own
 * performance breaks it: two couples whose competing queens placed level are
 * separated by the queen fighting for her season back.
 *
 * Then the two returning queens in those couples lip sync, and the winner is
 * back in the competition. `both` is the AS2 outcome — the show kept them
 * both — and it happens when the song genuinely cannot be split.
 */
export function revengeReentry({
  pairs = [], rank = [], players = {}, song = {}, lipsyncRecord = {}, rng = Math.random,
} = {}) {
  if (pairs.length < 2) return null;
  const place = n => {
    const i = rank.indexOf(n);
    return i < 0 ? rank.length : i;
  };
  const scored = pairs.map(p => ({
    ...p,
    // The competing half's night, and the returning half's own performance.
    score: (rank.length - place(p.with)) + (lipsyncScore({
      player: players[p.back], song, lipsyncRecord: lipsyncRecord[p.back], rng,
    })?.score ?? 0) * 0.35,
  })).sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 2);
  const duel = top.map(p => ({
    name: p.back,
    r: lipsyncScore({
      player: players[p.back], song, lipsyncRecord: lipsyncRecord[p.back], rng,
    }),
  }));
  duel.sort((a, b) => (b.r?.score ?? 0) - (a.r?.score ?? 0));
  const gap = (duel[0]?.r?.score ?? 0) - (duel[1]?.r?.score ?? 0);
  /* BOTH OF THEM, WHEN THE SONG WILL NOT SPLIT THEM. AS2 ended exactly here:
     two queens went back into the competition on the same night. Sized like
     every other double on this show — it has to be earned on the stage, and
     it cannot be rolled. */
  const both = gap < 0.35 && (duel[0]?.r?.score ?? 0) >= 6.2;
  return {
    couples: top.map(p => ({ back: p.back, with: p.with })),
    all: scored.map(p => ({ back: p.back, with: p.with })),
    singers: duel.map(d => d.name),
    winner: duel[0]?.name || null,
    winners: both ? duel.map(d => d.name) : [duel[0]?.name].filter(Boolean),
    both,
    scores: Object.fromEntries(duel.map(d => [d.name, Math.round((d.r?.score ?? 0) * 100) / 100])),
  };
}

/** One line, names filled. */
export function revengeLine(pool, vars = {}, rng = Math.random) {
  if (!Array.isArray(pool) || !pool.length) return '';
  return String(pick(rng, pool)).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}
