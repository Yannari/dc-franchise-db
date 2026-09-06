// ══════════════════════════════════════════════════════════════════════
// dr/state.js — everything a Drag Race season remembers
// ══════════════════════════════════════════════════════════════════════
//
// PLAIN VALUES ONLY. This object is serialised with the save, so nothing here
// may be a function, a Set or a Map: the other shows learned that the hard way
// and each keeps its state in one declared place for the same reason. A field
// added ad hoc during a build is a field that quietly fails to survive a
// reload, and the failure looks like the engine forgetting rather than the
// save dropping it.
import { starPower } from './queen.js';

export function initDragState({ cast, seed = 1, rng = Math.random }) {
  const names = cast.map(p => p.name);

  // ── ROLLED ONCE, HERE, AND NEVER AGAIN ────────────────────────────
  //
  // Star power has a per-season random component, so computing it lazily would
  // give a queen a different value every time somebody asked. It is a fact
  // about this season fixed before the first challenge, which is also what
  // makes it replayable: the same seed rebuilds the same cast of darlings.
  const star = {};
  for (const p of cast) star[p.name] = Math.round(starPower(p, rng) * 100) / 100;

  return {
    seed,
    castOrder: [...names],
    living: [...names],
    out: [],

    // Her results, oldest first: WIN | HIGH | SAFE | LOW | BTM | ELIM, and
    // WINNER | FINALIST after the finale. The track record chart is built from
    // this and so is every "she has been safe five weeks" reading.
    record: Object.fromEntries(names.map(n => [n, []])),

    // Only what happened in a lip sync: 'W' survived, 'L' went home. Separate
    // from `record` because surviving the bottom is its own currency — it is
    // what makes a fighter — and burying it inside the placements would make
    // it unreadable.
    lipsyncRecord: Object.fromEntries(names.map(n => [n, []])),

    // Hidden. Never shown, never ranked by, never read by the performance step.
    star,

    // Per-judge, per-queen: what the panel already thinks of her.
    memory: {},

    // How she took the last critique, read by the lip sync minutes later.
    lastReaction: Object.fromEntries(names.map(n => [n, null])),

    // The audience ledger. Written by every scene, and NEVER ranked by —
    // accrued totals measure how long somebody lasted, not how liked they
    // were. js/audience.js answers the second question.
    popularity: Object.fromEntries(names.map(n => [n, 0])),

    lastWinner: null,
    episodes: [],
    storylines: [],
    winner: null,
    runnerUp: null,
    congeniality: null,
  };
}
