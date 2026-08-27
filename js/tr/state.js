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

    // Every mission this season ran, in order:
    //   { id, ep, name, teams, quality, gross, earned, potAfter, sideObjectives, summary }
    // `gross` and `earned` differ once the pot is near its ceiling — a season
    // that wins 15,000 with 4,000 of headroom left banks 4,000, and the rest
    // is gone rather than owed. Kept because the pot alone cannot say WHY it
    // stalled: a season that stopped earning because the cast kept failing and
    // a season that stopped because it had already filled the pot look
    // identical from `pot` and completely different from here.
    missions: [],

    // Every mission narration template printed this season. Prose bookkeeping
    // and nothing else: four variants per category is four variants only if
    // the season remembers which it has spent, and a nine-mission season runs
    // the same archetype three times. Plain strings, so it survives a save.
    missionLines: [],

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

    // Set-shaped, so it must be declared here. Cleared each round by
    // expireShields() (js/tr/powers.js) — which is what "expires unused"
    // means, and the reason a Shield is a gamble rather than a purchase.
    shieldedThisRound: new Set(),

    // Every Shield won this season, oldest first:
    //   { ep, holder, witnesses, visibility, pactAware, outcome, seenLine }
    // `witnesses` is the SEMI-VISIBILITY: the players who saw it won, and the
    // only ones who may ever form a read off what the following night did or
    // did not do to the holder. `outcome` is 'pending' until the night
    // resolves and then 'blocked' or 'expired' — the second is the common
    // case and the format intends it to be.
    shields: [],

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

    // This round's shared castle-event spending money:
    // { total, used, windowsLeft }. startRoundBudget() (tr/events.js) draws
    // `total` (4-8) once per round from the castle layer's OWN hashed rng
    // (headless.js) — never the game rng, so registering content can never
    // perturb the murder/vote/ballot draws. Every runWindow() call across
    // that round's windows depletes the same `used` counter (what keeps a
    // round to 4-8 events TOTAL, not 4-8 per window) and decrements
    // `windowsLeft` (what lets each window cap itself at a fair share of
    // whatever remains, instead of the earliest windows racing to spend the
    // whole pot before the rest get a turn). Null between rounds.
    roundBudget: null,
  };
}

// ══════════════════════════════════════════════════════════════════════
// HOW MANY PEOPLE THE CASTLE HAS LOST — ONE SOURCE, BECAUSE THE OBVIOUS
// ONE IS WRONG
// ══════════════════════════════════════════════════════════════════════
//
// `gs.tr.rounds` is NOT a census of the dead. Night one's murder deliberately
// leaves no round record (js/tr/headless.js: there is no Round Table on night
// one, so nothing is pushed), so every count derived by summing `rounds` is
// short by at least one for the whole season. `grief-nobody-sleeps` printed
// that count to the viewer — "2 empty beds, so far" on a night with three —
// and was measured wrong on 100% of 363 firings across 200 seasons.
//
// The living cast is the honest source: it is decremented by every exit
// whatever recorded it. `castSize()` reads the alignment ledger, which
// receives one entry per player at selection and is never pruned, so
// cast − living is the number of people who are gone.
//
// USE THESE, NOT `rounds.filter(...)`, for anything a sentence prints or a
// branch is chosen by. The rule the whole-plan review wrote for this defect:
// any event emitting a count must agree with the season state it claims to
// describe, and `tests/tr-castle.test.js` now asserts it over the pool.

/** How many people started the season. 0 before selection has run. */
export function castSize(g) {
  return Object.keys(g?.tr?.alignment || {}).length;
}

/** How many people are gone — murdered, banished, however they left. */
export function peopleLost(g) {
  const cast = castSize(g);
  if (!cast) return 0;
  return Math.max(0, cast - (g?.activePlayers || []).length);
}

/**
 * How many people the Traitors have murdered, night one included.
 *
 * Derived, not counted: banishments are ALL on the round record (there is no
 * banishment without a Round Table), so the murders are everyone else who is
 * gone. This is the count `_deaths()` and the grief family's `deaths >= 2`
 * gates want and the round sum cannot give them.
 */
export function murderCount(g) {
  const banished = (g?.tr?.rounds || []).filter(r => r.banished).length;
  return Math.max(0, peopleLost(g) - banished);
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
