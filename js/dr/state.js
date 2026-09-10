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
  const starBase = {};
  for (const p of cast) {
    const v = Math.round(starPower(p, rng) * 100) / 100;
    starBase[p.name] = v;
    star[p.name] = v;
  }

  return {
    seed,
    /* WHO SHE IS ON PAPER, kept apart from who the season has made of her.
       `starBase` is the roll above and never moves; `star` is what the host
       actually leans on and drifts with the audience -- see refreshStar. The
       two were one field, which meant a queen who won the casting draw stayed
       the favourite for thirteen weeks no matter how the room reacted to her,
       and any mechanic built on `star` had no brake at all. */
    starBase,
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

/**
 * What the room has made of her, on top of what she was cast as.
 *
 * Star power was rolled once and never moved again, so the favourite was
 * decided before the first challenge and stayed the favourite for the whole
 * season however the audience actually reacted. `hostBend` leans on it, which
 * meant the host's benefit of the doubt was a casting fact rather than a
 * season one — and anything built on top of it (a Rigga Morris, a redemption
 * arc, a queen the room turns on) had no brake, because nothing could ever
 * change who the darling was.
 *
 * RELATIVE TO THE ROOM, NOT RAW, and that is the whole of it. Popularity runs
 * about -13 to +68 across a season against star's 3 to 8, so an absolute term
 * would swamp the casting profile — and worse, it would lift everyone at once
 * late in the season and cancel out, which is the exact defect documented on
 * `relStar` in js/dr/judging.js. A z-score against the LIVING room says the
 * true thing instead: what matters is being more watchable than the queens
 * still standing next to you, and that changes as the cast shrinks.
 *
 * IT RAMPS, because an audience has no opinion in week one. Four episodes to
 * full weight, so the premiere still belongs to casting.
 *
 * Pure: base, popularity, and the size of the room. No rng, so a replay
 * rebuilds the same darlings.
 */
export function refreshStar(state) {
  if (!state || !state.starBase) return state && state.star;
  const living = (state.living || []).filter(n => state.starBase[n] != null);
  const pops = living.map(n => (state.popularity || {})[n] || 0);
  const mean = pops.length ? pops.reduce((a, b) => a + b, 0) / pops.length : 0;
  const varc = pops.length
    ? pops.reduce((t, v) => t + (v - mean) ** 2, 0) / pops.length : 0;
  const sd = Math.sqrt(varc) || 1;
  // Four episodes to full weight. `record` is the only per-queen history the
  // state carries, and every living queen has one entry per aired night.
  const aired = living.length
    ? Math.max(...living.map(n => (state.record?.[n] || []).length)) : 0;
  const ramp = Math.max(0, Math.min(1, aired / 4));

  const next = { ...state.star };
  for (const n of Object.keys(state.starBase)) {
    const base = state.starBase[n];
    if (!living.includes(n)) { next[n] = base; continue; }
    const z = Math.max(-1, Math.min(1, (((state.popularity || {})[n] || 0) - mean) / sd));
    // 1.2 is a touch over one standard deviation of star itself (the middle
    // eighty percent of queens sit inside 4.4-6.5), so the audience can change
    // who the favourite is without erasing what she was cast as.
    const v = base + z * 1.2 * ramp;
    next[n] = Math.round(Math.max(0, Math.min(10, v)) * 100) / 100;
  }
  state.star = next;
  return next;
}
