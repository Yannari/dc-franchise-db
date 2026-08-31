// ══════════════════════════════════════════════════════════════════════
// tr/exit.js — what somebody says on the way out
// ══════════════════════════════════════════════════════════════════════
//
// Generated from what the leaver BELIEVES, never from what is true, which is
// why a Faithful can leave furious and name entirely the wrong person.
//
// The famous case falls out of the general rule rather than being written as a
// special case: somebody recruited two nights ago has almost no loyalty to the
// people who turned them, so their burn probability is naturally high, while a
// long-serving Traitor burns far less often (not never — measured ~27.5% at
// tenure 8, against ~92% at tenure 1). The general tenure gradient is real on
// its own (~30 points across the range); the `+0.35` amplification below is
// what pushes the narrow fresh-recruit case the rest of the way. Nobody had to
// script the fresh-recruit case as a special rule — but the amplification
// carries most of that specific gap, and the docstring below says so rather
// than pretending the base gradient alone would have been enough.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { alignmentAt } from './roles.js';
import { suspicionBoard } from './deduction.js';

/** How many rounds this person has been what they currently are. */
function _tenure(name, ep) {
  const flips = (gs.tr?.roleHistory || []).filter(r => r.name === name);
  const last = flips[flips.length - 1];
  return Math.max(0, ep - (last?.ep ?? 1));
}

/**
 * The speech.
 *
 * RARE-STATE AMPLIFICATION (spec 5.4): a fresh recruit being banished is a
 * narrow window, and a mechanism that can only fire in a narrow window must be
 * weighted UP inside it or it never appears at all — content that exists in
 * the code and never in a season. The `+0.35` below is that amplification and
 * is the reason this is worth building.
 */
export function exitSpeech(name, ep, rng = Math.random) {
  const st = pStats(name);
  const isTraitor = alignmentAt(name, ep) === 'traitor';
  const tenure = _tenure(name, ep);

  // Who they blame. A Traitor burns an ALLY (they know); a Faithful burns
  // whoever they suspect (they usually do not).
  let target = null, conviction = 0;
  if (isTraitor) {
    const allies = (gs.activePlayers || []).filter(n => n !== name && alignmentAt(n, ep) === 'traitor');
    // Explicit, not `allies[Math.floor(rng() * 0)]` falling through to
    // `undefined ?? null` — a last-Traitor-standing arm silently hit that
    // NaN-index path and returned early at `if (!target)` below, which is
    // exactly what hid the ally-presence confound in an earlier version of
    // the tenure test (the "founder" arm had no living ally, so it measured
    // "has an ally" vs "has none", not tenure).
    target = allies.length ? allies[Math.floor(rng() * allies.length)] : null;
    conviction = 1;
  } else {
    const board = suspicionBoard(name, ep).filter(r => r.score > 0);
    if (board.length) {
      target = board[0].name;
      conviction = board[0].score;
    } else {
      // No formed belief at all is common early in a season, but "leave
      // furious and name entirely the wrong person" (spec 6.7) still has to
      // be possible — an accusation with nothing behind it, not a guarantee.
      // Conviction stays 0 so the probability below rests on loyalty and
      // temperament alone, never on evidence that doesn't exist.
      const candidates = (gs.activePlayers || []).filter(n => n !== name);
      target = candidates[Math.floor(rng() * candidates.length)] ?? null;
      conviction = 0;
    }
  }
  if (!target) return { burns: false, target: null, conviction: 0, text: '' };

  // Loyalty is the spine; time served is what loyalty is TO. A two-night
  // recruit has had no time to acquire any.
  let p = 0.15
    + (1 - (st.loyalty || 5) / 10) * 0.45
    + conviction * 0.30
    - Math.min(0.35, tenure * 0.05);
  if (isTraitor && tenure <= 2) p += 0.35;          // rare-state amplification
  if ((st.temperament || 5) <= 3) p += 0.12;        // some people simply cannot hold it

  const burns = rng() < Math.max(0.02, Math.min(0.95, p));
  // Null target/conviction on a non-burn so the contract is unambiguous: a
  // speech that "says nothing useful" carries no name. Nothing consumes this
  // yet, but a future caller reading `.target` without gating on `.burns`
  // would otherwise attach a random innocent person to that inert text.
  return burns
    ? { burns, target, conviction, text: `${name} names ${target} on the way out.` }
    : { burns, target: null, conviction: null, text: `${name} says nothing useful.` };
}
