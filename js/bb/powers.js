// ══════════════════════════════════════════════════════════════════════
// bb/powers.js — the power inventory
// ══════════════════════════════════════════════════════════════════════
//
// A power is a RULE OBJECT with a lifecycle. It does not know or care how it
// was obtained: the Diamond Power of Veto is the same power whether the
// week's veto competition awarded it in front of everybody (the Care
// Package/OTT shape) or Pandora's Box slipped it to an HOH who then lied
// about a dollar (BB12, the canonical one). Distributors decide who gets a
// power and who knows; this file owns what a power IS and when it stops
// existing.
//
// Lifecycle fields per the catalog design's compatibility rule 8: holder,
// acquisition week, expiry, eligible timing, used/unused, visibility and
// disposal. Instances live on gs.bb.powers so they save, load and replay
// with the season.
import { gs } from '../core.js';

/**
 * The definitions. Rules only — no acquisition, no narration.
 *
 *   useTiming   when the power may fire: 'veto-ceremony' | 'eviction-night'
 *   windowWeeks how many evictions the holder may sit on it (1 = this week)
 *   rules       the same shape the twist contract speaks
 */
export const BB_POWER_DEFINITIONS = {
  'diamond-veto': {
    id: 'diamond-veto',
    name: 'The Diamond Power of Veto',
    rules: { replacementAuthority: 'veto-holder' },
    // Public grants fire at the ceremony they were announced for; a secret
    // grant is sat on and detonated at the live show, which is the entire
    // reason to keep it secret. The instance's visibility decides which.
    useTiming: { public: 'veto-ceremony', secret: 'eviction-night' },
    windowWeeks: 2,
  },
};

function store() {
  gs.bb ||= {};
  gs.bb.powers ||= [];
  return gs.bb.powers;
}

/**
 * Hand a power to somebody. Returns the instance.
 *
 * `visibility`: 'public' (house knows power and holder), 'holder-secret'
 * (house knows it exists, not who holds it), 'secret' (nobody knows until it
 * fires). `source` is the distributor's id — provenance for the Debug panel
 * and the aftermath, never consulted by the rules.
 */
export function grantPower(powerId, holder, { week = 1, visibility = 'public', source = 'unknown' } = {}) {
  const def = BB_POWER_DEFINITIONS[powerId];
  if (!def || !holder) return null;
  const instance = {
    powerId, holder, visibility, source,
    acquiredWeek: week,
    expiresAfterWeek: week + (def.windowWeeks || 1) - 1,
    used: false, usedWeek: null,
    disposed: false, disposedReason: null,
  };
  store().push(instance);
  return instance;
}

/** Every live instance a houseguest holds, optionally filtered by power id. */
export function heldPowers(holder, powerId = null) {
  return store().filter(p => p.holder === holder && !p.used && !p.disposed
    && (!powerId || p.powerId === powerId));
}

/** The live instance that may fire at this timing, this week — or null. */
export function activePowerAt(timing, week) {
  return store().find(p => {
    if (p.used || p.disposed) return false;
    if (week > p.expiresAfterWeek) return false;
    const def = BB_POWER_DEFINITIONS[p.powerId];
    if (!def) return false;
    const t = typeof def.useTiming === 'string' ? def.useTiming
      : def.useTiming[p.visibility === 'public' ? 'public' : 'secret'];
    return t === timing;
  }) || null;
}

/** Fire it. The instance stays in the store as the record of what happened. */
export function usePower(instance, week) {
  if (!instance) return null;
  instance.used = true;
  instance.usedWeek = week;
  return instance;
}

/**
 * End-of-week sweep: expiry, and holders who left the house. A power whose
 * holder walked out the door is disposed, not inherited — the show has never
 * let one change hands on the way out.
 */
export function expirePowers(week, house = gs.activePlayers || []) {
  for (const p of store()) {
    if (p.used || p.disposed) continue;
    if (!house.includes(p.holder)) { p.disposed = true; p.disposedReason = 'holder-evicted'; continue; }
    if (week > p.expiresAfterWeek) { p.disposed = true; p.disposedReason = 'expired'; }
  }
}
