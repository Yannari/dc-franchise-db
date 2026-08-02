// ══════════════════════════════════════════════════════════════════════
// bb/twist-contract.js — what a twist is allowed to change, stated once
// ══════════════════════════════════════════════════════════════════════
//
// The catalog design's rule: no large switch statement with one branch per
// television name. A twist is a descriptor of CAPABILITIES the week engine
// consumes — how many nominees, how many vetoes, who names a replacement,
// whether ballots or the eviction itself can be cancelled. The engine asks
// the resolved state at its interception points; it never asks "is this the
// Diamond Veto week" by name.
//
// The twists that were built before this contract existed (Double Eviction,
// Instant Eviction, Have-Nots) are REGISTERED here but not rewritten — their
// engine paths stand, and the descriptor records what they do so the debug
// panel, compatibility checks and future twists have one place to look.

/**
 * The neutral week. Every rule a twist can change, at its default.
 * A resolved week with no twists is exactly this.
 */
export const BASE_WEEK_RULES = Object.freeze({
  nomineeCount: 2,          // how many the HOH names at the ceremony
  vetoCount: 1,             // how many vetoes exist this week (0 = no veto act)
  vetoSecret: false,        // whether the veto's use is anonymous
  replacementAuthority: 'hoh', // 'hoh' | 'veto-holder' — who fills the empty chair
  cancelVotes: 0,           // ballots removed before the count
  cancelEviction: false,    // nobody leaves this week
  addSlots: [],             // extra competition slots ('safety', 'return', ...)
  secondCycle: false,       // a compressed second eviction cycle after the first
});

/**
 * The registry. One descriptor per twist id, shaped as the design doc's
 * contract: layer, category, timing, duration, and the rules delta.
 */
export const BB_TWIST_CONTRACTS = {
  'bb-double-eviction': {
    id: 'bb-double-eviction', layer: 'scheduled', category: 'week-structure',
    timing: 'week', duration: { weeks: 1 },
    rules: { secondCycle: true },
  },
  'bb-instant-eviction': {
    id: 'bb-instant-eviction', layer: 'scheduled', category: 'week-structure',
    timing: 'week', duration: { weeks: 1 },
    rules: { vetoCount: 0 },
  },
  'bb-have-nots': {
    id: 'bb-have-nots', layer: 'scheduled', category: 'condition',
    timing: 'week-opening', duration: { weeks: 1 },
    rules: {}, // changes living conditions and comp handicaps, not week shape
  },
  'bb-diamond-veto': {
    id: 'bb-diamond-veto', layer: 'scheduled', category: 'veto-power',
    timing: 'veto-ceremony', duration: { weeks: 1 },
    rules: { replacementAuthority: 'veto-holder' },
  },
};

/**
 * Merge the week's twists into one rules object the engine can consult.
 *
 * Returns { rules, active, applied } where `applied` records which twist
 * changed which rule from what to what — the debug panel's requirement that
 * every hook mutation says who did it and why.
 */
export function resolveWeekTwistState(twistIds = []) {
  const rules = { ...BASE_WEEK_RULES, addSlots: [] };
  const active = [];
  const applied = [];
  for (const id of twistIds) {
    const contract = BB_TWIST_CONTRACTS[id];
    if (!contract) continue;
    active.push(id);
    for (const [key, value] of Object.entries(contract.rules || {})) {
      if (key === 'addSlots') {
        for (const slot of value) { rules.addSlots.push(slot); applied.push({ twist: id, rule: 'addSlots', to: slot }); }
        continue;
      }
      if (rules[key] !== value) {
        applied.push({ twist: id, rule: key, from: rules[key], to: value });
        rules[key] = value;
      }
    }
  }
  return { rules, active, applied };
}
