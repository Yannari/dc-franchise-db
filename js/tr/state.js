// ══════════════════════════════════════════════════════════════════════
// tr/state.js — everything a Traitors season remembers
// ══════════════════════════════════════════════════════════════════════
//
// Kept in one place because two of these fields are the kind that get added
// ad hoc during a build and then quietly fail to serialize. Functions do not
// survive JSON.stringify and neither do Sets, so anything set-shaped is
// declared here and repaired here rather than discovered missing after a
// season is saved.

/** A season's Traitors state, empty. */
export function initTraitorsState() {
  return {
    // name -> [{ truth, sinceEp }], oldest first. NOT a single value: alignment
    // is a property of a person AND a round, because recruitment changes it
    // mid-season and a belief formed before a flip was correct when it was
    // formed. See truthAtLearn() in tr/roles.js.
    alignment: {},

    // Every change of allegiance, in order: { name, from, to, ep, via }.
    // `via` is 'selection' | 'recruitment' | 'ultimatum'. This is what makes
    // alignment ERAS possible — a player who flips in episode 8 was genuinely
    // a Faithful in episode 3, and a belief formed then was correct when it
    // was formed.
    roleHistory: [],

    // Completed rounds, and the export shape (spec 10.1): each carries its
    // ballots with a `channel`, so a murder is a ballot only the Traitors cast
    // and the whole round still normalises to votingHistory[].
    rounds: [],

    // The shared prize fund. Nobody votes for it and only the winning faction
    // collects it, which is the whole strategic sting of a mission.
    pot: 0,
    potCeiling: 0,

    // Open narrative threads — see spec section 5.2. Events prefer to advance
    // one of these over starting something new, which is the single rule that
    // keeps a season from reading as forty unconnected incidents.
    threads: [],

    // What events have written down, keyed by player: [{ ep, note, threadId }].
    // This is why episode 7's accusation can name episode 2. Without it every
    // event is a sentence nobody can refer back to.
    residue: {},

    // Three cooldown scopes: by event id, by player, by PAIR. The pair scope is
    // the one that matters — without it the same two people have the same
    // conversation four times and the season reads as a loop.
    cooldowns: { event: {}, player: {}, pair: {} },

    // Who overruled whom at the conclave, and on which night:
    //   [{ ep, winner, loser, target, theirTarget }]
    // Not a mood. By episode 8 there is not a set of three Traitors but a
    // faction with a history, and the endgame betrayal has a DATE attached
    // rather than a schedule. Read by the exit blowup and (later) the endgame.
    conclaveTension: [],

    // Set-shaped, so it must be declared here. Cleared each round.
    shieldedThisRound: new Set(),

    // Nights the Traitors struck and nobody died: [{ ep, target }].
    // The TARGET is stored because the VP shows it — the audience knows who
    // was nearly murdered. The room does not, and must not: only the FACT of
    // a blocked attempt is public, which is what Task 4 reads.
    blockedMurders: [],

    // A recruiter's fate is tied to their recruit's: [{ recruiter, recruit, ep }].
    // A recruit banished soon after may burn the person who turned them, which
    // is the worst outcome in the format and the reason recruitment is a
    // decision with a tail rather than a free extra body.
    loyaltyDebt: [],
  };
}

/** Field names on gs.tr that hold Sets and need flattening before a save. */
const TR_SETS = ['shieldedThisRound'];

/** Flatten Sets so the state survives JSON.stringify. Returns the same object. */
export function prepTrForSave(g) {
  if (!g?.tr) return g;
  for (const key of TR_SETS) {
    if (g.tr[key] instanceof Set) g.tr[key] = [...g.tr[key]];
  }
  return g;
}

/** Rebuild Sets after a load. Idempotent, and safe on a state that never had them. */
export function repairTrSets(g) {
  if (!g?.tr) return g;
  for (const key of TR_SETS) {
    if (!(g.tr[key] instanceof Set)) g.tr[key] = new Set(g.tr[key] || []);
  }
  return g;
}
