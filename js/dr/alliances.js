// ══════════════════════════════════════════════════════════════════════
// dr/alliances.js — who is in whose circle, in the werk room
// ══════════════════════════════════════════════════════════════════════
//
// Drag Race alliances are not the other shows' alliances. There is no vote to
// deliver, so a circle here cannot win anybody anything directly: it decides
// who vouches for whom in Untucked, who a queen holding an exit finds it hard
// to name, and who sits with whom when the room splits. That is all — and
// that is exactly what the real show has, which is why this is DERIVED from
// bonds rather than authored as a pact.
//
// The rule itself is `js/alliance-blocs.js`, shared with the Traitors' castle:
// bonds and stats only, no rng draw, and a bloc BIASES a queen's own decision
// without ever coordinating. The second half is what makes it legal on this
// show at all — the first law here is that there is no vote, and a bloc that
// could act as a unit would be one wearing a different hat.
import { blocsOf, sameBloc } from '../alliance-blocs.js';

export { sameBloc };

/* ── HOW MUCH A QUEEN BANDS TOGETHER AT ALL ───────────────────────────
   The same shape the castle uses, read for this room: the social butterfly
   and the loyal soldier are always in somebody's circle, the floater and the
   chaos agent drift, and a villain runs a circle of her own when she can find
   one. Proportional on `social`, so two queens of the same archetype are not
   the same queen. */
const ARCH_AFFINITY = {
  'social-butterfly': 1.0, 'loyal-soldier': 1.0, hero: 0.9, showmancer: 0.9,
  underdog: 0.8, 'perceptive-player': 0.7, schemer: 0.7, mastermind: 0.65,
  villain: 0.6, 'challenge-beast': 0.55, hothead: 0.5, goat: 0.5,
  wildcard: 0.45, 'chaos-agent': 0.35, floater: 0.3,
};

export function dragAffinity(player) {
  const base = ARCH_AFFINITY[player?.archetype] ?? 0.55;
  const social = Math.max(1, Math.min(10, Number(player?.stats?.social) || 5));
  return Math.max(0, Math.min(1, base * 0.7 + (social / 10) * 0.45));
}

/**
 * The circles in the room tonight.
 *
 * Recomputed every episode from the bonds as they stand, so an alliance that
 * cooled is simply not there next week — nothing to serialise, nothing to
 * repair on load, and no pact that outlives the feelings behind it.
 */
export function dragAlliances({ living = [], bond = () => 0, players = {}, ep = 0 } = {}) {
  return blocsOf(living, bond, n => dragAffinity(players[n]), {
    round: `dr${ep}`,
    // Warmer than the castle's floor: this room makes friends faster than it
    // makes allies, and a 4 here was calling every pleasant pair an alliance.
    allyBond: 5,
    affinityFloor: 0.42,
    // Three is a drag alliance. Four is the whole top of the cast.
    maxBloc: 3,
  });
}
