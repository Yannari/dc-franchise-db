// ══════════════════════════════════════════════════════════════════════
// tr/alliances.js — the blocs the castle votes in
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors is not decided one player against the field; it is decided in
// GROUPS. People who trust each other vote together, protect each other, and
// point the table at whoever is outside the circle. That is the single biggest
// thing missing from a castle that banished purely on suspicion — and it is why
// a Traitor's survival should turn on WHO THEY ARE: a social, well-bonded
// Traitor buries themselves inside a bloc and is protected; a loner with a low
// social read and no allies is the free agent the room writes down first.
//
// This module derives the blocs and the vote bias they produce. Two hard rules:
//
// 1. NO rng DRAW, EVER. Blocs are computed from BONDS (js/tr/bonds via getBond)
//    and stats, both of which are state, with deterministic tie-breaks off a
//    string hash. `chooseBanishmentVote` adds the bias as a TERM beside
//    suspicion — never an override — exactly as it adds a vote intent, and for
//    the same reason: a season with alliances in it must consume the identical
//    game rng stream as one without, or every murder and ballot downstream
//    drifts and the calibration bands stop describing the engine.
//
// 2. BELIEF-SIDE, NOT TRUTH. A bloc is formed from bonds and social reach, which
//    the whole castle can see. It never reads an alignment. A Traitor is
//    protected by a bloc because the bloc likes them, not because the engine
//    knows what they are — which is the whole point: the protection is earned
//    by playing the person, not handed out by the role.
import { gs, players } from '../core.js';
import { getBond } from '../bonds.js';
import { pStats } from '../players.js';

// ── WHO GRAVITATES INTO A BLOC ────────────────────────────────────────
//
// Archetype sets the baseline appetite for banding together; the social stat
// moves it. A social-butterfly or a loyal-soldier is always in somebody's
// circle; a floater or a chaos-agent drifts and is the easy free-agent vote.
// This is what makes an alliance a thing you have to be BUILT to hold, so a
// Traitor's cover is a property of their cast entry and not a dice roll.
const ARCH_AFFINITY = {
  'social-butterfly': 1.0, 'loyal-soldier': 1.0, 'hero': 0.9, 'showmancer': 0.9,
  'goat': 0.75, 'underdog': 0.75, 'perceptive-player': 0.65, 'challenge-beast': 0.6,
  'mastermind': 0.55, 'schemer': 0.55, 'villain': 0.5, 'hothead': 0.45,
  'wildcard': 0.4, 'chaos-agent': 0.3, 'floater': 0.3,
};
function _archOf(name) {
  return (players || []).find(p => p && p.name === name)?.archetype || 'floater';
}
/** 0..1 — how strongly this player pulls into an alliance.
 *
 * Three inputs: archetype sets the appetite, SOCIAL is the reach that actually
 * makes the bonds, and STRATEGIC is the deliberate hand — a strategic player
 * builds and works a bloc on purpose, not just whoever they happen to like. So
 * a high-strategic, high-social player is always in a circle and hard to
 * isolate, and a Traitor with those stats is the one who disappears inside one. */
function allianceAffinity(name) {
  const st = pStats(name);
  const arch = ARCH_AFFINITY[_archOf(name)] ?? 0.5;
  const social = (st.social || 5) / 10;
  const strategic = (st.strategic || 5) / 10;
  return arch * 0.5 + social * 0.3 + strategic * 0.2;
}

// ── THE THRESHOLDS ────────────────────────────────────────────────────
//
// A tie forms between two people who BOTH lean into alliances and share a warm
// bond. The bond floor is the spine — an alliance is trust, and trust is the
// bond — with affinity gating who is willing to act on it. Blocs are capped so
// the castle splits into a few circles and a scatter of loners, not one lump
// that protects everybody (which would protect nobody, and flatten the vote).
const ALLY_BOND = 4;          // warm-and-up: an ally, not an acquaintance
const AFFINITY_FLOOR = 0.42;  // below this a player drifts free rather than banding
const MAX_BLOC = 4;           // a circle, not the whole room

/** A stable 0..1 from a string — the deterministic tie-break, no rng. */
function _hash01(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * The castle's alliances this episode, derived fresh from the bond graph.
 *
 * Greedy and deterministic: every eligible warm pair is an edge, weighted by
 * bond + both affinities (with a hashed jitter only to break exact ties, never
 * off the game rng), and the strongest edges are joined first, each bloc capped
 * at MAX_BLOC. Returns `[{ members: string[] }, ...]`, largest first; players in
 * no bloc are free agents and simply do not appear.
 *
 * Cached per `(ep, living-set)` so a whole Round Table's worth of vote-bias
 * lookups computes it once. The cache is plain data on `gs.tr`, so it survives a
 * save and is rebuilt on demand after a load.
 */
export function computeAlliances(ep) {
  const living = [...(gs.activePlayers || [])];
  const cacheKey = ep + '|' + [...living].sort().join(',');
  const cache = gs.tr && gs.tr._allianceCache;
  if (cache && cache.key === cacheKey) return cache.blocs;

  // Every eligible warm pair, strongest first.
  const edges = [];
  for (let i = 0; i < living.length; i++) {
    for (let j = i + 1; j < living.length; j++) {
      const a = living[i], b = living[j];
      const bond = getBond(a, b);
      if (bond < ALLY_BOND) continue;
      const aff = allianceAffinity(a), affB = allianceAffinity(b);
      if (aff < AFFINITY_FLOOR || affB < AFFINITY_FLOOR) continue;
      const w = bond / 10 + (aff + affB) / 2 + _hash01(ep + '|' + a + '|' + b) * 0.05;
      edges.push({ a, b, w });
    }
  }
  edges.sort((e1, e2) => e2.w - e1.w || (e1.a + e1.b < e2.a + e2.b ? -1 : 1));

  // Greedy union with a size cap. Each player carries a bloc id; joining merges
  // only when the result stays within MAX_BLOC, so a circle stays a circle.
  const blocOf = new Map();
  const members = new Map(); // id -> [names]
  let nextId = 0;
  for (const { a, b } of edges) {
    const ba = blocOf.get(a), bb = blocOf.get(b);
    if (ba == null && bb == null) {
      const id = nextId++; blocOf.set(a, id); blocOf.set(b, id); members.set(id, [a, b]);
    } else if (ba != null && bb == null) {
      if (members.get(ba).length < MAX_BLOC) { blocOf.set(b, ba); members.get(ba).push(b); }
    } else if (ba == null && bb != null) {
      if (members.get(bb).length < MAX_BLOC) { blocOf.set(a, bb); members.get(bb).push(a); }
    } else if (ba !== bb) {
      // Merge two blocs only if the union fits; otherwise leave them separate.
      const A = members.get(ba), B = members.get(bb);
      if (A.length + B.length <= MAX_BLOC) {
        for (const n of B) blocOf.set(n, ba);
        members.set(ba, A.concat(B)); members.delete(bb);
      }
    }
  }
  const blocs = [...members.values()]
    .filter(m => m.length >= 2)
    .map(m => ({ members: [...m] }))
    .sort((x, y) => y.members.length - x.members.length);

  if (gs.tr) gs.tr._allianceCache = { key: cacheKey, blocs };
  return blocs;
}

// ── WHAT A BLOC DOES TO A BALLOT ──────────────────────────────────────
//
// A bloc member does not write a bloc-mate's name if they can help it, and
// leans toward the people outside every circle. These are the magnitudes of the
// bias added to the vote score in chooseBanishmentVote, tuned against
// tr-calibration so the deduction channel still beats chance — the bloc bends
// the vote, it does not decide it, so a strong read on an ally still overrides
// the instinct to protect them (which is exactly the drama the format runs on).
// SIZED TO BEND, NOT TO DECIDE. `suspicion` runs 0..~1 at mult 1 and the noise
// term is up to 0.35, so a bloc bias of this size loses to a firm read (a strong
// suspicion still names an ally — the betrayal the format runs on) and beats a
// weak one or pure noise (a loner with nothing on them is the free-agent vote).
// The first cut used ±1.3, which overrode even a certain read and DROWNED the
// deduction channel — tr-calibration's "beats chance / sharpens / beats the
// placebo" arms all collapsed. These are the largest values that leave every one
// of those arms green.
const PROTECT_ALLY = 0.3;     // score DOWN for a bloc-mate: do not name my own
// FREE AGENTS ARE NOT ACTIVELY HUNTED. An earlier cut pushed loners UP the list
// (the circle pointing outward), but that lifted the EARLY traitor-hit rate —
// blocs form fast, loners got named in the first rounds — and shrank the gap
// between early and late deduction below tr-calibration's "the room sharpens as
// it learns" floor. Protecting your own is the effect the format wants and the
// one that makes a bonded Traitor safe; hunting the unaligned is dropped so the
// deduction channel still visibly sharpens over the season.
const TARGET_LONER = 0;

/**
 * The alliance term for one (voter, target) ballot line. Added beside suspicion
 * and noise in `chooseBanishmentVote`. Positive pushes the target UP the list
 * (more likely banished), negative pushes them DOWN (protected). Zero for a
 * voter who is in no bloc — a loner votes on their read alone.
 *
 * NOT IN THE ENDGAME. The fire round is a different game — decided on the pot
 * and the private end/banish choice, not on who likes whom — and applying the
 * bloc bias there suppressed the endgame's betrayals below their calibrated
 * floor. So alliances bend the MANDATED banishments only.
 */
export function allianceVoteBias(voter, target, ep) {
  if (gs.tr && gs.tr.endgameFrom != null && ep >= gs.tr.endgameFrom) return 0;
  const blocs = computeAlliances(ep);
  const vBloc = blocs.find(b => b.members.includes(voter));
  if (!vBloc) return 0;
  if (vBloc.members.includes(target)) return -PROTECT_ALLY;
  const targetInSomeBloc = blocs.some(b => b.members.includes(target));
  return targetInSomeBloc ? 0 : TARGET_LONER;
}

/**
 * Were these two an alliance EDGE — a warm bond both leaned into?
 *
 * The same test `computeAlliances` runs on every pair, exposed on its own so
 * the betrayal fallout can ask it about a Traitor who has ALREADY LEFT: it
 * reads the STORED bond (getBond survives a banishment) and the two stat-based
 * affinities, never `gs.activePlayers`, so "was this keeper in the revealed
 * Traitor's circle?" still has a true answer the moment after the Traitor is
 * removed. Deterministic, no rng — belief-side, no alignment read.
 */
export function wasAllied(a, b) {
  if (!a || !b || a === b) return false;
  if (getBond(a, b) < ALLY_BOND) return false;
  return allianceAffinity(a) >= AFFINITY_FLOOR && allianceAffinity(b) >= AFFINITY_FLOOR;
}

/** Test seam: drop the per-episode cache so a fresh bond graph recomputes. */
export function _clearAllianceCache() {
  if (gs && gs.tr) gs.tr._allianceCache = null;
}
