// ══════════════════════════════════════════════════════════════════════
// alliance-blocs.js — who bands together, for any show that has bonds
// ══════════════════════════════════════════════════════════════════════
//
// Extracted from js/tr/alliances.js so the castle and the werk room share one
// rule instead of two copies of it. `tests/helpers/show-vocabulary.js` records
// that two copies of one rule has bitten this repo at least four times, and
// the failure is always the same: one copy is extended and the other silently
// stops guarding.
//
// ── THE TWO RULES THAT TRAVEL WITH IT ─────────────────────────────────
//
// 1. NO rng DRAW, EVER. Blocs come from BONDS and stats — both state — with a
//    deterministic tie-break off a string hash. A season with alliances in it
//    must consume the identical game rng stream as one without, or every draw
//    downstream drifts and the calibration bands stop describing the engine.
//
// 2. A BLOC BIASES, IT NEVER COORDINATES. It bends one person's own decision
//    and it cannot deliver an outcome. That is what lets Drag Race use it at
//    all: this show's first law is that there is no vote, and a bloc that
//    could act as a unit would be one wearing a different hat.
//
// Nothing here reads `gs`, a roster, or any show's vocabulary: the caller
// passes the living names, a bond function and an affinity function.

/** A stable 0..1 from a string. Not the game rng — see rule 1. */
export function hash01(key) {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * The blocs in a room.
 *
 * `living`     names still in the game
 * `getBond`    (a, b) -> -10..10
 * `affinityOf` (name) -> 0..1, how much this person bands together at all
 * `round`      anything stable for this round, for the tie-break
 *
 * Returns `[{ members: string[] }]`, largest first. Anybody in no bloc is
 * simply absent — a free agent is the default, not a special case.
 */
export function blocsOf(living = [], getBond = () => 0, affinityOf = () => 0.5, {
  round = 0, allyBond = 4, affinityFloor = 0.42, maxBloc = 4,
} = {}) {
  const names = [...living];
  // Every eligible warm pair, strongest first.
  const edges = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i]; const b = names[j];
      const bond = Number(getBond(a, b)) || 0;
      if (bond < allyBond) continue;
      const aff = affinityOf(a); const affB = affinityOf(b);
      if (aff < affinityFloor || affB < affinityFloor) continue;
      const w = bond / 10 + (aff + affB) / 2 + hash01(`${round}|${a}|${b}`) * 0.05;
      edges.push({ a, b, w });
    }
  }
  edges.sort((e1, e2) => e2.w - e1.w || (e1.a + e1.b < e2.a + e2.b ? -1 : 1));

  /* Greedy union with a size cap. Each name carries a bloc id; joining merges
     only when the result stays within `maxBloc`, so a circle stays a circle
     rather than swallowing the room. */
  const blocOf = new Map();
  const members = new Map();
  let nextId = 0;
  for (const { a, b } of edges) {
    const ba = blocOf.get(a); const bb = blocOf.get(b);
    if (ba == null && bb == null) {
      const id = nextId++; blocOf.set(a, id); blocOf.set(b, id); members.set(id, [a, b]);
    } else if (ba != null && bb == null) {
      if (members.get(ba).length < maxBloc) { blocOf.set(b, ba); members.get(ba).push(b); }
    } else if (ba == null && bb != null) {
      if (members.get(bb).length < maxBloc) { blocOf.set(a, bb); members.get(bb).push(a); }
    } else if (ba !== bb) {
      const A = members.get(ba); const B = members.get(bb);
      if (A.length + B.length <= maxBloc) {
        for (const n of B) blocOf.set(n, ba);
        members.set(ba, A.concat(B)); members.delete(bb);
      }
    }
  }
  return [...members.values()]
    .filter(m => m.length >= 2)
    .map(m => ({ members: [...m] }))
    .sort((x, y) => y.members.length - x.members.length);
}

/** Are these two in the same bloc? */
export function sameBloc(blocs, a, b) {
  return (blocs || []).some(x => x.members.includes(a) && x.members.includes(b));
}
