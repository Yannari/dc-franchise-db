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
 *   survivesEviction  the holder walking out does NOT dispose it (see below)
 *   autoFiresAtExpiry the window closing SPENDS it rather than binning it
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

  // BB11. The holder stands up at the veto ceremony and takes the week off the
  // Head of Household: up to two nominees come down and the holder names the
  // replacements. Timed to the veto ceremony rather than the nomination one
  // because the rule excludes the veto holder from being replaced INTO the
  // block, which only means anything once there is a veto holder.
  'coup-d-etat': {
    id: 'coup-d-etat',
    name: "The Coup d'État",
    rules: { ceremonyAuthority: 'power-holder', mayReplace: 2 },
    useTiming: 'veto-ceremony',
    // Sat on for a fortnight, which is the whole tension: the house spends two
    // weeks knowing it exists and not knowing who has it.
    windowWeeks: 2,
  },

  // BB20. Preventative and narrow: it is spent BEFORE a ceremony is read out
  // and it covers that ceremony only. Using it on nomination day does not stop
  // the holder being named as a replacement at the veto ceremony, which is the
  // detail that makes it a decision rather than a week of immunity.
  'the-cloud': {
    id: 'the-cloud',
    name: 'The Cloud',
    rules: { unnominatable: 'one-ceremony' },
    useTiming: 'nominations',
    windowWeeks: 8,
  },

  // BB20. Not immunity — a CHANCE. The holder, or somebody they name, gets a
  // competition to come back with if they are evicted; losing it sends them
  // out for good. Good through the first four evictions.
  //
  // Two lifecycle flags no other power needs, and both are load-bearing:
  //
  //   survivesEviction   every other power dies with its holder. This one is
  //                      SPENT by its holder being evicted, so the ordinary
  //                      'holder-evicted' sweep would bin it at the exact
  //                      moment it exists to fire.
  //   autoFiresAtExpiry  Sam Bledsoe never used hers. The window ran out and
  //                      the power went off anyway on the fourth evictee,
  //                      whoever that turned out to be — so the fuse is a rule
  //                      of the power, not a decision the holder can dodge.
  'bonus-life': {
    id: 'bonus-life',
    name: 'Bonus Life',
    rules: { returnChance: true },
    useTiming: 'eviction-night',
    windowWeeks: 4,
    survivesEviction: true,
    autoFiresAtExpiry: true,
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

/**
 * Every live instance that may fire at this timing, this week.
 *
 * More than one CAN be live at once — a house running both Pandora's Box and
 * the App Store can easily have a secret Diamond and a Bonus Life sitting on
 * the same eviction night, and they are different powers that fire at
 * different moments of it. Callers should name the power they came for.
 */
export function activePowersAt(timing, week, powerId = null) {
  return store().filter(p => {
    if (p.used || p.disposed) return false;
    if (week > p.expiresAfterWeek) return false;
    if (powerId && p.powerId !== powerId) return false;
    const def = BB_POWER_DEFINITIONS[p.powerId];
    if (!def) return false;
    const t = typeof def.useTiming === 'string' ? def.useTiming
      : def.useTiming[p.visibility === 'public' ? 'public' : 'secret'];
    return t === timing;
  });
}

/**
 * The live instance that may fire at this timing, this week — or null.
 *
 * `powerId` is optional but callers should pass it: without it this returns
 * whichever instance happens to sit earliest in the store, which meant a
 * Bonus Life granted before a secret Diamond silently ate the Diamond's
 * detonation. Every timing in this engine can now hold more than one power.
 */
export function activePowerAt(timing, week, powerId = null) {
  return activePowersAt(timing, week, powerId)[0] || null;
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
    const def = BB_POWER_DEFINITIONS[p.powerId] || {};
    // A Bonus Life is not lost when its holder is: being evicted is the
    // trigger, not the end. It stays live for whoever has to resolve it.
    if (!house.includes(p.holder) && !def.survivesEviction) {
      p.disposed = true; p.disposedReason = 'holder-evicted'; continue;
    }
    if (week > p.expiresAfterWeek) { p.disposed = true; p.disposedReason = 'expired'; }
  }
}
