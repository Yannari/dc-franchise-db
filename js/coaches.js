// Coaches — franchise winners and finalists who train a tribe without playing.
//
// THE ARCHITECTURE IS ONE SPLIT. A coach is in `players`, so pStats, pronouns,
// archetype and romanticCompat all resolve for them. A coach is NOT in
// `gs.activePlayers`, which 135 modules read to decide who competes, votes,
// holds immunity, sits on the jury and takes a placement — none of which a
// coach does. Being outside that array is not a workaround for the twist, it
// IS the twist, and promotion at the merge is one push into it.
import { gs, seasonConfig } from './core.js';

/** Every coach still standing. */
export function activeCoaches() {
  return (gs.coaches || []).filter(c => !c.promoted);
}

export function isCoach(name) {
  return activeCoaches().some(c => c.name === name);
}

export function coachRecord(name) {
  return activeCoaches().find(c => c.name === name) || null;
}

export function coachesOf(tribeName) {
  return activeCoaches().filter(c => c.tribe === tribeName);
}

/**
 * Sessions scale with tribe size so somebody is always left out. A budget that
 * covers everyone produces no favouritism, and favouritism is the twist.
 */
export function sessionsFor(tribeSize) {
  return Math.max(1, Math.floor(tribeSize / 3));
}

/**
 * Career fame, in stars. Coaches are by definition winners and finalists, so
 * 4.5 (Icon, one rung short of the five-star lock) is the honest default — a
 * season builder can override it per coach once one exists.
 */
export function addCoach({ name, tribe, sessionsPerEp = 2, stars = 4.5 }) {
  if (!gs.coaches) gs.coaches = [];
  const record = { name, tribe, saveCard: 'unused', promoted: false, sessionsPerEp, stars };
  gs.coaches.push(record);
  return record;
}

export function removeCoach(name) {
  if (!gs.coaches) return;
  gs.coaches = gs.coaches.filter(c => c.name !== name);
}

/** Matches RI_TRAINING_CAP in js/rescue-island.js — one banked ceiling. */
export const COACH_TRAINING_CAP = 3.0;

/** Everything positive banked on this contestant, across every coach. */
export function trainingTotal(contestant) {
  let sum = 0;
  for (const perCoach of Object.values(gs.coachTraining || {})) {
    for (const amount of Object.values(perCoach[contestant] || {})) {
      if (amount > 0) sum += amount;
    }
  }
  return sum;
}

export function trainingBonus(contestant, stat) {
  let sum = 0;
  for (const perCoach of Object.values(gs.coachTraining || {})) {
    sum += perCoach[contestant]?.[stat] || 0;
  }
  return sum;
}

/**
 * Bank a session's result. Returns what was actually banked.
 *
 * The cap bounds HELP only. A negative amount always lands in full: a coach
 * below 5 in a stat teaches badly, and a contestant already at the ceiling must
 * still be able to be made worse.
 */
export function bankTraining(coach, contestant, stat, amount) {
  if (!gs.coachTraining) gs.coachTraining = {};
  if (!gs.coachTraining[coach]) gs.coachTraining[coach] = {};
  if (!gs.coachTraining[coach][contestant]) gs.coachTraining[coach][contestant] = {};

  let take = amount;
  if (amount > 0) take = Math.min(amount, Math.max(0, COACH_TRAINING_CAP - trainingTotal(contestant)));
  const slot = gs.coachTraining[coach][contestant];
  slot[stat] = (slot[stat] || 0) + take;
  return take;
}

/**
 * Delete everything one coach built and hand it back.
 *
 * Called when a coach is voted out. The returned map is what the tribe just
 * lost, and the fallout events narrate it.
 */
export function revokeCoachTraining(coach) {
  const lost = (gs.coachTraining || {})[coach] || {};
  if (gs.coachTraining) delete gs.coachTraining[coach];
  return lost;
}

/**
 * WHO IS AT THIS CAMP — not who is playing the game.
 *
 * `tribe.members` answers "who competes, votes, holds immunity and takes a
 * placement", and coaches are deliberately absent from it. Every camp screen
 * then inherited that answer for a question it was never asked: who is
 * physically here. The result was a coach nobody could see — absent from all
 * 110 camp event types, from the camp roster, from the relationship list, and
 * so from every sentence the season generated about the tribe.
 *
 * Camp-side callers use this. Anything deciding eligibility must keep using
 * `tribe.members` / `gs.activePlayers`.
 */
export function campRoster(tribeName, members) {
  const base = members || (gs.tribes || []).find(t => (t.name ?? t.tribeName) === tribeName)?.members || [];
  const coaches = coachesOf(tribeName).map(c => c.name);
  // A coach already in `members` would double-render; callers pass filtered
  // contestant lists, but a promoted-then-restored coach can appear in both.
  return [...base, ...coaches.filter(n => !base.includes(n))];
}

/**
 * Why this voter is coming for this coach, in the coach's own vocabulary.
 *
 * A coach on the block was being explained with contestant prose — "the room
 * settled on X" — which never once said the word coach, so a season could vote
 * one out without a viewer learning what they were. The driver is picked from
 * the state that actually decided it: who they trained, who they didn't, how
 * famous they are, and how the voter feels about them.
 */
export function coachVoteReason(coachName, voter) {
  const rec = coachRecord(coachName);
  if (!rec) return null;
  const trained = Object.keys(gs.coachTraining?.[coachName] || {});
  const trainedVoter = trained.includes(voter);
  const bond = (gs.bonds || {})[[coachName, voter].sort().join('|')] ?? 0;

  // Ordered by how load-bearing each driver is, not by severity of tone: a
  // coach who trained everyone but you is the twist's own engine.
  // Deterministic so a reason does not change between a replay and the
  // transcript that quoted it.
  const _v = arr => arr[(voter.length * 7 + coachName.length * 3 + trained.length) % arr.length];

  if (trained.length && !trainedVoter) {
    return _v([
      `${voter} was never one of ${coachName}'s projects, and a coach who builds everybody else is a coach worth losing`,
      `${coachName} has spent this whole game making other people better. ${voter} was not one of them, and will not keep a coach who picked somebody else`,
      `${voter} watched ${coachName} pick a favourite every round and never once heard ${voter}'s own name called — a coach that selective is a coach worth cutting`,
      `every session ${coachName} ran made somebody else harder to beat. ${voter} is done subsidising a coach who never picked them`,
    ]);
  }
  if (bond <= -2) {
    return `${voter} has had enough of ${coachName} — this is the first chance to do something about a coach`;
  }
  if (trained.length >= 3) {
    return _v([
      `${coachName} has hands on too much of this tribe now; ${voter} would rather cut the coach than fight everyone ${coachName} built`,
      `${voter} counts the players ${coachName} has trained and decides the coach is the shortest way to unmake all of it`,
      `${voter} cannot beat ${coachName}'s protégés one at a time, so the coach goes first`,
      `${coachName} built half this tribe. ${voter} would rather take out the coach than everything the coach made`,
    ]);
  }
  if ((rec.stars ?? 0) >= 4) {
    return `${coachName} is the most decorated person in this game and ${voter} knows a coach never has to be carried to the end`;
  }
  if (trainedVoter && bond > 1) {
    return `${voter} likes ${coachName}, and votes for the coach anyway — a coach costs nothing to cut and nobody comes back for it`;
  }
  return `${coachName} is a coach: no vote, no immunity run, and no allies who lose anything by letting ${coachName} go`;
}

/**
 * What a coach is allowed to FIND, and from where.
 *
 * Separate from `coachCanPlay` (advantages.js), which governs what they may
 * play on themselves. A coach can find something they can never use — that is
 * the point of the advantage law, and the reason handing one over costs the
 * save card.
 *
 * Default when a season has said nothing: the idol, Knowledge is Power and the
 * Team Swap, from camp. Everything else is contestants-only until a season
 * turns it on, because a coach who can find anything is a coach nobody needs
 * to keep.
 */
export const COACH_FINDABLE_DEFAULT = {
  idol:     { enabled: true,  sources: ['camp'] },
  kip:      { enabled: true,  sources: ['camp'] },
  teamSwap: { enabled: true,  sources: ['camp'] },
};

export function coachCanFind(type, source = 'camp') {
  const cfg = seasonConfig?.coachAdvantages;
  const entry = (cfg && Object.prototype.hasOwnProperty.call(cfg, type))
    ? cfg[type]
    : COACH_FINDABLE_DEFAULT[type];
  if (!entry?.enabled) return false;
  const sources = entry.sources || ['camp'];
  return sources.includes(source);
}
