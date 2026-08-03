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
  hohSecret: false,         // the HOH's identity is hidden from the house
  replacementAuthority: 'hoh', // 'hoh' | 'veto-holder' — who fills the empty chair
  cancelVotes: 0,           // ballots removed before the count
  cancelEviction: false,    // nobody leaves this week
  addSlots: [],             // extra competition slots ('safety', 'return', ...)
  secondCycle: false,       // a compressed second eviction cycle after the first
});

/**
 * How a power reaches a holder. The show has used every one of these, and
 * they are different mechanics, not different flavor text — who can get the
 * power, who knows it exists, and when the house finds out all follow from
 * the channel. Organized from the wiki's actual instances:
 *
 *   veto-competition       The week's own veto comp awards the special veto
 *                          (America's Care Package/OTT chose the veto type
 *                          in play; announced to the house beforehand).
 *   dedicated-competition  A separate comp exists just for the power
 *                          (Whacktivity BB21, Safety Suite BB22, Roadkill).
 *   pandoras-box           The HOH's private gamble; the canonical Diamond
 *                          Veto (BB12 Matt Hoffman) arrived this way, secret.
 *   hidden-search          Hidden in the house, found by looking (BB17's
 *                          hidden veto scavenger hunt, secret rooms).
 *   audience               Granted by viewer vote, delivered publicly
 *                          (America's Care Package BB18, App Store BB20).
 *   temptation             Offered privately with a consequence attached
 *                          (Den of Temptation BB19).
 *   purchase               Bought with an earned currency (High Roller's
 *                          Room BBCAN9).
 *   random-draw            Pure luck of the draw (Round Trip Ticket BB18).
 *
 * Secrecy is its own axis: 'public' (house knows the power and the holder),
 * 'holder-secret' (house knows the power exists, not who holds it — BB20's
 * Hacker), 'secret' (nobody knows it exists until it is used — Matt's DPOV).
 * Public acquisitions get ANNOUNCED: the engine opens the week with a
 * twist-announcement act, because a house that finds out a rule mid-ceremony
 * is a house that was never told the rules.
 */
export const POWER_ACQUISITION_CHANNELS = Object.freeze([
  'veto-competition', 'dedicated-competition', 'pandoras-box',
  'hidden-search', 'audience', 'temptation', 'purchase', 'random-draw',
]);

/**
 * The registry. One descriptor per twist id, shaped as the design doc's
 * contract: layer, category, timing, duration, and the rules delta — plus,
 * for powers, how they are acquired and who knows.
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
    // This build runs the OTT Care-Package shape: the week's own veto comp
    // awards the diamond, announced to the house up front. The canonical
    // secret version (Pandora's Box, BB12) becomes a config variant once
    // Pandora's Box exists.
    acquisition: { channel: 'veto-competition', secrecy: 'public' },
    announcement: {
      name: 'The Diamond Power of Veto',
      rule: 'This week’s veto competition is for the DIAMOND Power of Veto. If it is used, the winner — not the Head of Household — names the replacement nominee.',
      sting: 'Whoever wins it controls both chairs.',
    },
  },
  'bb-invisible-hoh': {
    id: 'bb-invisible-hoh', layer: 'scheduled', category: 'power-structure',
    timing: 'week', duration: { weeks: 1 },
    rules: { hohSecret: true },
    // BBCAN9's shape: the house KNOWS the week is invisible — they play the
    // competition and watch the result get sealed — so the twist announces
    // itself while the winner stays hidden. That is exactly what
    // holder-secret means.
    acquisition: { channel: 'dedicated-competition', secrecy: 'holder-secret' },
    announcement: {
      name: 'The Invisible HOH',
      rule: 'This week’s Head of Household is INVISIBLE. The competition result will not be revealed: only the winner knows who holds power. Nominations will be read by Big Brother, and the Invisible HOH may compete in next week’s HOH competition.',
      sting: 'Somebody in this room is about to run the week without wearing the key.',
    },
  },
  'bb-pandoras-box': {
    id: 'bb-pandoras-box', layer: 'scheduled', category: 'distribution',
    timing: 'post-hoh', duration: { weeks: 1 },
    rules: {}, // the box changes nothing structural; what it HANDS OUT does
    // A distributor, not a power: the prize is drawn from the power
    // inventory (default cargo diamond-veto) and granted SECRET — so there
    // is deliberately no announcement. The house sees the consequence and
    // the lie; the truth lives in gs.bb.powers and the Debug panel.
    acquisition: { channel: 'pandoras-box', secrecy: 'secret' },
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
  const announcements = [];
  for (const id of twistIds) {
    const contract = BB_TWIST_CONTRACTS[id];
    if (!contract) continue;
    active.push(id);
    // A public rule is announced, and so is a holder-secret one — the house
    // knows the Hacker or the Invisible HOH EXISTS, just not who it is.
    // Fully secret powers stay off this list; their reveal is the knowledge
    // system's job, not the announcer's.
    const secrecy = contract.acquisition?.secrecy ?? 'public';
    if (contract.announcement && secrecy !== 'secret') {
      announcements.push({ twist: id, ...contract.announcement });
    }
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
  return { rules, active, applied, announcements };
}
