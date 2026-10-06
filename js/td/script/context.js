// ══════════════════════════════════════════════════════════════════════
// td/script/context.js — the real reasons a line may give
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-06 §5.1. Real Total Drama scenes give reasons with names in
// them ("Zaid's a comp threat", "Leshawna hates me"). A pool line may only
// give a reason the engine knows, so the names are read here, at the moment
// the scene fires, and stored in the scene's data — a replayed episode says
// what was true then.
//
//   rival     a's worst bond in camp (≤ -2), not b
//   friend    a's best bond in camp (≥ 3), not b
//   threat    the camp's challenge threat by record (not a or b)
//   weak      the camp's weak link by record (not a or b)
//   lastBoot  who went home at the last vote — only if a's camp was at it
//
// Narrative text selection only: the thresholds never touch gameplay.
import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';

function campOf(name) {
  if (gs.isMerged) return [...(gs.activePlayers || [])];
  const tribes = Array.isArray(gs.tribes) ? gs.tribes : [];
  return [...(tribes.find(t => (t.members || []).includes(name))?.members || [])];
}

const score = (n, f) => f(gs.chalRecord?.[n] || {});

/** Names for the reasons a scene may give. Never one of the scene's own people. */
export function campContext(a, b) {
  if (!a) return {};
  const others = campOf(a).filter(n => n !== a && n !== b && (gs.activePlayers || []).includes(n));
  const out = {};
  const byBond = [...others].sort((x, y) => getBond(a, x) - getBond(a, y) || x.localeCompare(y));
  if (byBond.length && getBond(a, byBond[0]) <= -2) out.rival = byBond[0];
  const best = byBond[byBond.length - 1];
  if (best && getBond(a, best) >= 3 && best !== out.rival) out.friend = best;
  const strong = [...others].sort((x, y) => score(y, r => (r.wins || 0) * 2 + (r.podiums || 0)) - score(x, r => (r.wins || 0) * 2 + (r.podiums || 0)) || x.localeCompare(y))[0];
  if (strong && score(strong, r => (r.wins || 0) * 2 + (r.podiums || 0)) >= 3) out.threat = strong;
  const weak = [...others].sort((x, y) => score(y, r => r.bombs || 0) - score(x, r => r.bombs || 0) || x.localeCompare(y))[0];
  if (weak && weak !== out.threat && score(weak, r => r.bombs || 0) >= 2) out.weak = weak;
  const last = (gs.episodeHistory || []).at(-1);
  if (last?.eliminated && !(gs.activePlayers || []).includes(last.eliminated)) {
    const wasThere = last.isMerge || gs.isMerged
      || (last.tribesAtStart || []).some(t => (t.members || []).includes(a) && (t.members || []).includes(last.eliminated));
    if (wasThere) out.lastBoot = last.eliminated;
  }
  return out;
}
