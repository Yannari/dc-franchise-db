// ══════════════════════════════════════════════════════════════════════
// tr/headless.js — a whole season, with no UI and no screens
// ══════════════════════════════════════════════════════════════════════
//
// The point of this file is measurement. A social deduction engine can pass
// every unit test it has and still produce a room that never works anything
// out, because "did the belief update" and "did the room find the Traitors" are
// different questions and only the second one matters.
import { gs, setGs } from '../core.js';
import { initTraitorsState } from './state.js';
import { resetKnowledge } from '../knowledge.js';
import { setBond } from '../bonds.js';
import { selectTraitors, recordAlignment, livingTraitors, livingFaithfuls,
  canRecruit, chooseRecruit, offerRecruitment } from './roles.js';
import { seedTraitorKnowledge, ballotEvidence, murderEvidence } from './deduction.js';
import { runRoundTable } from './roundtable.js';
import { resolveMurder } from './murder.js';
import { runWindow, startRoundBudget } from './events.js';
import { runMission, POT_CEILING } from './missions.js';

// TASK 6 WIRING DECISION: the castle event pool is now live in every real
// season. Side-effect imports only — nothing here is called directly; each
// module registers its events into the shared `EVENTS` array (events.js) on
// load. Before this line, `EVENTS` was empty at runtime because nothing in
// the require graph from a real season ever reached js/tr/castle/*.js, so
// `runWindow` (already wired into the round loop below since the plumbing
// task) always returned `[]` — every real season ran with zero castle
// content despite the engine being fully built.
//
// CALIBRATION NOTE, CORRECTED (Task 6 round-1 review): wiring this in does
// not measurably hurt the calibration bands (11/11 stayed green across five
// decorrelated 200-season blocks). It also does NOT demonstrate that castle
// content helps deduction — a three-arm counterfactual found a contentless
// pool of random bond churn, same shape and same magnitude, reproduces the
// late-lift movement and then some. The mechanism is bond VARIANCE feeding
// bondResistance() -> suspicion() in the deduction layer, not content
// signal. See task-6-report.md for the full counterfactual and the
// corrected numbers — do not cite the late-lift movement as evidence this
// pool's specific content is doing anything for the room's reasoning.
import '../tr/castle/trust.js';
import '../tr/castle/suspicion.js';
import '../tr/castle/grief.js';
import '../tr/castle/cover.js';
import '../tr/castle/romance.js';
import '../tr/castle/callback.js';
import '../tr/castle/testing.js';
import '../tr/castle/journey.js';

/**
 * The season's random stream — and the hash in front of it is load-bearing.
 *
 * WHY THE SEED IS HASHED BEFORE IT REACHES THE LCG. A bare LCG advanced from
 * seed `s` returns `(s * 1664525 + 1013904223) / 2^32` as its FIRST draw, so
 * two consecutive seeds differ in that first number by 1664525/2^32 ~ 3.9e-4.
 * That draw is consumed by selectTraitors() to pick Traitor #1. Measured on
 * the unhashed generator: seeds 1..200 produced only THREE distinct first
 * Traitors out of a cast of twenty (one of them 129 times), seeds 201..400
 * only two, seeds 2001..2200 only two. Every 200-season "population" was in
 * fact 200 replays of the same two or three Traitor identities, and since a
 * Traitor's own stats drive everything the calibration measures, a block's
 * numbers were a property of WHICH block it was. Across twelve blocks the
 * early-lift band read mean 5.85pp sd 5.67 — the block-to-block spread was
 * larger than the band's own headroom, and the shipped block (seeds 1..200)
 * happened to be the roster's weakest possible Traitor.
 *
 * One integer multiply fixes it: Knuth's 2654435761 scrambles the low bits the
 * LCG barely touches, so consecutive seeds start from unrelated states. After
 * it, the same twelve blocks each draw all twenty cast members as Traitor #1
 * roughly ten times apiece and the early-lift spread falls to sd 1.4.
 *
 * The fix belongs HERE and not in how the calibration enumerates seeds: `seed`
 * is a user-facing replay handle, and raising the season count on contiguous
 * seeds would only add correlated samples of the same Traitor.
 */
export function rngFor(seed) {
  let s = Math.imul((seed >>> 0) || 1, 2654435761) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/**
 * The castle layer's own stream — round budgets today, and (once Tasks 5/6
 * ship content) every pickEvent() roll a window makes — kept OFF the game's
 * own rng on purpose.
 *
 * WHY THIS CANNOT WAIT UNTIL IT COSTS SOMETHING. Right now the pool is
 * empty and isolating this stream changes nothing observable — but from the
 * moment a single castle event is registered, runWindow will draw several
 * pickEvent() rolls a round. If those rolls came out of the SAME stream the
 * murder, vote and ballots are drawn from, then registering one new event or
 * nudging one weight would shift every later draw's position in that stream
 * and silently re-roll every murder, ballot and banishment for the rest of
 * every season — the placebo control in tr-calibration.test.js exists
 * specifically to prove the engine deduces rather than merely believes, and
 * it cannot do that if a content change can move its numbers on its own.
 * This is the same shape of bug `rngFor`'s own doc comment describes for an
 * unhashed seed, just triggered by editing content instead of picking a
 * seed. `_seedStartingBonds` already does this for the bond fixture, keyed
 * off a DIFFERENT multiplier so the two derived streams do not correlate.
 *
 * AND THE MULTIPLIER HAS ONE FIXED POINT (whole-plan review, finding 14).
 * 40503 is ODD, so `40503 * 2**31 === 2**31` modulo 2**32: at seed 2**31 the
 * derived seed is the seed, `rngFor` is handed the same number twice, and the
 * castle stream IS the game stream — silently defeating the isolation this
 * whole comment exists to guarantee, at exactly one seed out of four billion.
 * No seed anybody uses is near it and none ever will be; a fixed point that
 * cannot be reached is still a fixed point, and it costs one comparison to
 * close. `rngFor` hashes its argument by an odd multiply, which is a bijection
 * mod 2**32, so equal derived seeds are the ONLY way the two streams can
 * coincide — the check below is exhaustive, not a sample of the failure.
 */
export function _castleRngFor(seed) {
  const s = (seed >>> 0) || 1;
  let derived = Math.imul(s, 40503) >>> 0;
  if (derived === s || derived === 0) derived = (derived ^ 0x9E3779B9) >>> 0 || 13;
  return rngFor(derived);
}

/**
 * The missions' own stream, for the third time and the same reason.
 *
 * `_castleRngFor`'s comment explains the mechanism in full and it applies here
 * unchanged: a mission takes a dozen draws an afternoon (the team shuffle
 * alone takes one per player), and if those came out of the game rng then
 * adding a sixth mission archetype — or changing how many side objectives one
 * rolls — would shift the position of every subsequent murder, ballot and
 * banishment in the stream and re-roll the rest of the season. The
 * calibration bands are population measurements over fixed seeds; a content
 * edit that moves them is indistinguishable from an engine change that moves
 * them, and the whole point of those bands is to tell the two apart.
 *
 * Different odd multiplier from the castle stream so the two do not correlate,
 * and the same fixed-point guard: an odd multiply is a bijection mod 2**32, so
 * `derived === s` is the only way this stream can coincide with the game's,
 * and one comparison closes it exhaustively rather than probabilistically.
 */
export function _missionRngFor(seed) {
  const s = (seed >>> 0) || 1;
  let derived = Math.imul(s, 2246822519) >>> 0;
  if (derived === s || derived === 0) derived = (derived ^ 0x85EBCA6B) >>> 0 || 29;
  return rngFor(derived);
}

/**
 * A cast that has already met each other.
 *
 * MEASUREMENT FIXTURE, NOT A SOCIAL MODEL. It exists because the harness used
 * to open with `bonds: {}` and nothing ever wrote to it, so getBond() returned
 * 0 for every pair in every season — which made bondResistance() exactly 1.0
 * and broadcast()'s trust term the constant 0.55 in every number this plan has
 * ever reported. Two of the three social mechanisms the design rests on ("a
 * well-liked Traitor survives a table the evidence should have lost them", and
 * "the same true name lands or dies depending on whose mouth it comes from")
 * were inert in all of them. A calibration run on an engine with two of its
 * three levers pinned at neutral is not a calibration of that engine.
 *
 * So: a plain spread of warm and cold relationships, drawn from a stream of its
 * own so it cannot shift the game's own draws, and deterministic in the season
 * seed like everything else here. Roughly a fifth of pairs like each other and
 * an eighth do not, which puts most people in three or four warm relationships
 * and two or three hostile ones in a cast of twenty. It is not trying to be a
 * pre-season; it is trying to stop the two levers being measured at zero.
 */
function _seedStartingBonds(cast, seed) {
  const rng = rngFor((seed * 2654435761) >>> 0 || 7);
  for (let i = 0; i < cast.length; i++) {
    for (let j = i + 1; j < cast.length; j++) {
      const roll = rng();
      if (roll < 0.18) setBond(cast[i], cast[j], 2 + Math.floor(rng() * 7));        // +2..+8
      else if (roll < 0.30) setBond(cast[i], cast[j], -2 - Math.floor(rng() * 6));  // -2..-7
      else rng();   // burn a draw either way, so the stream does not depend on the branch
    }
  }
}

/**
 * The night. A conclave, and what it decided to do with it.
 *
 * RECRUITMENT AND MURDER ARE EXCLUSIVE, and that is the format's rule rather
 * than an implementation shortcut: the Traitors get one action per night, so a
 * night spent making an offer is a night nobody dies — whatever the answer.
 * A refused note costs them a body they could have taken.
 *
 * The choice itself is deliberately crude, and seeded like everything else.
 * The interesting decisions here are WHO (chooseRecruit) and whether they
 * accept; a later plan can make the coin strategic.
 *
 * WHAT IS RECORDED, AND WHY IT IS TWO FIELDS AND NOT ONE.
 *
 *   `murdered`      — who actually died. `null` on a blocked night, because
 *                     nobody did, and the round record is what the VP and the
 *                     export shape read.
 *   `murderTarget`  — who the conclave CHOSE, whether or not it landed.
 *
 * They are separate because murderEvidence() gates on `target && !blocked`, and
 * if the only field were `murdered` then a blocked night would carry `null` and
 * the `!blocked` half of that guard could never do any work — the suppression
 * test would pass because the state is unreachable, not because suppression
 * works. With the attempt recorded, removing `!blocked` really does leak
 * evidence out of a night nobody died on. See the comment on that test.
 */
function _night(ep, rng) {
  if (!livingTraitors(ep).length) {
    return { murdered: null, murderTarget: null, blocked: false, recruited: null,
      executed: null, livingAtMurder: [] };
  }
  const rounds = gs.tr.rounds;
  const last = rounds.length ? rounds[rounds.length - 1] : null;

  // Recruit rather than murder when the pact is thin and somebody is takeable.
  const wantsRecruit = canRecruit(ep) && livingTraitors(ep).length < 3 && rng() < 0.45;
  if (wantsRecruit) {
    const pick = chooseRecruit(ep, rng);
    if (pick) {
      // The ultimatum fires only with one Traitor left — the format's own rule,
      // and the reason refusal is fatal there: they have seen the only face.
      const offer = offerRecruitment(pick.target, ep, rng,
        { mode: livingTraitors(ep).length === 1 ? 'ultimatum' : 'note', recruiter: pick.recruiter });
      const recruited = { ...offer, target: pick.target };
      if (last) { last.recruitment = recruited; if (offer.executed) last.executed = offer.executed; }
      // A refused ultimatum kills. It is not a `murdered` — see the note on
      // offerRecruitment — but it is a body, and it is on the log and on the
      // round record so that anything counting who left the castle finds it.
      return { murdered: null, murderTarget: null, blocked: false, recruited,
        executed: offer.executed || null, livingAtMurder: [] };
    }
  }

  // Snapshot the room BEFORE the kill. This is harness DATA, not behaviour:
  // nothing in the engine reads it. It exists so the calibration can ask
  // whether the victim was better connected than the field the conclave was
  // choosing from, which is unanswerable once the victim has been removed.
  const livingAtMurder = [...(gs.activePlayers || [])];
  const m = resolveMurder(ep, rng);
  if (last) {
    last.murdered = m.victim;
    last.murderTarget = m.target;
    // murderEvidence reads this NEXT round; it must be on the round record.
    last.murderCost = m.cost;
  }
  return { murdered: m.victim, murderTarget: m.target, blocked: m.blocked,
    recruited: null, executed: null, livingAtMurder };
}

/**
 * Play one season. Returns the record and enough log to measure it.
 *
 * `evidence` is an injection point and exists for exactly one caller: the
 * PLACEBO control in tests/tr-calibration.test.js, which plays a season with
 * identical population dynamics, the identical vote, and the ballot-reading
 * layer swapped for pure noise. Without a way to run that season, the
 * calibration's bands cannot tell an engine that deduces from an engine that
 * merely has beliefs. Nothing in the show may ever pass this.
 */
export function playTraitorsSeason({ cast, traitorCount = 3, seed = 1, maxRounds = 40,
  evidence = ballotEvidence } = {}) {
  const rng = rngFor(seed);
  // The narrative layer's OWN stream — see castleRngFor's doc comment for why
  // round budgets (and later, window draws) must never share the game rng.
  const castleRng = _castleRngFor(seed);
  // And the missions', off both of them — see _missionRngFor.
  const missionRng = _missionRngFor(seed);
  // gs is null until a season exists (js/core.js), so the harness creates one.
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
  gs.tr.potCeiling = POT_CEILING;
  resetKnowledge();
  _seedStartingBonds(cast, seed);

  const traitors = selectTraitors(cast, { traitorCount }, rng);
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  cast.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);

  const log = [];
  let ep = 1;
  // The format's own rule: no banishment on the first night, so the Traitors
  // get one round to become a faction before the hunt starts.
  // Nothing has been recorded as a round yet, so this murder leaves no round
  // record and therefore emits no evidence next episode. That is correct and
  // not a gap: murderEvidence's one surviving channel is `pushedThenDied`,
  // which reads ballots and accusations, and night one has neither. There is
  // nothing about this murder for the room to reason from.
  //
  // Night one still has breakfast and a mission — the show does — so dawn,
  // morning and the two journey windows run around it same as any other
  // round. It has no Round Table, so evening (which campaigns for a vote
  // that does not happen) and after-table (which reacts to a reveal cascade
  // that did not run) are skipped; night runs after the conclave same as
  // always.
  startRoundBudget(castleRng, 5); // 5 windows this round: no evening/after-table without a table
  const castle1 = [
    ...runWindow('dawn', ep, castleRng),
    ...runWindow('morning', ep, castleRng),
    ...runWindow('journey-out', ep, castleRng),
  ];
  // The mission sits BETWEEN the two journey windows because that is what the
  // journey is: out to the mission, and back from it. Night one has one too —
  // the show does — even though it has no Round Table.
  const mission1 = runMission(ep, missionRng);
  castle1.push(...runWindow('journey-back', ep, castleRng));
  const n1 = _night(ep, rng);
  castle1.push(...runWindow('night', ep, castleRng));
  log.push({ ep, banished: null, wasTraitor: null, ...n1, mission: mission1,
    castleEvents: castle1, budget: { ...gs.tr.roundBudget } });

  while (ep++ < maxRounds) {
    const alive = gs.activePlayers || [];
    const tr = livingTraitors(ep).length;
    const fa = livingFaithfuls(ep).length;
    if (!tr || alive.length <= 3 || fa <= tr) break;

    // A fresh 4-8 spending money for this round's seven windows, drawn from
    // the castle layer's own stream (never the game rng — see castleRngFor).
    // Windows slot around the evidence/table/night contract below WITHOUT
    // disturbing it — see that comment for why the three calls it wraps
    // cannot reorder.
    startRoundBudget(castleRng, 7);
    const castleEvents = [
      ...runWindow('dawn', ep, castleRng),
      ...runWindow('morning', ep, castleRng),
    ];

    // ORDER IS THE CONTRACT. Both evidence sources read the round that just
    // CLOSED, so both must run before runRoundTable opens a new one — and
    // murderEvidence in particular gates on `round.ep === ep - 1`, which is
    // the guard that stops it re-emitting an old murder every round for the
    // rest of the season. The murder itself comes last, and is written back
    // onto the round the table just produced.
    evidence(ep, rng);
    murderEvidence(ep, rng);
    // journey-out/journey-back bracket the mission, which is what the journey
    // is for. The mission draws from its OWN stream (see _missionRngFor), so
    // it sits inside the order contract above without disturbing a single one
    // of the game rng's draws — the evidence/table/night sequence either side
    // of it is bit-identical whether missions run or not, which is what
    // tests/tr-missions.test.js asserts directly.
    castleEvents.push(...runWindow('journey-out', ep, castleRng));
    const mission = runMission(ep, missionRng);
    castleEvents.push(...runWindow('journey-back', ep, castleRng));
    castleEvents.push(...runWindow('evening', ep, castleRng));
    const r = runRoundTable(ep, rng);
    if (!r) break;   // an empty castle: nothing left to banish
    // The reveal cascade has already run inside runRoundTable by the time
    // after-table fires — that is the whole point of the window: someone
    // was just revealed.
    castleEvents.push(...runWindow('after-table', ep, castleRng));
    const night = _night(ep, rng);
    castleEvents.push(...runWindow('night', ep, castleRng));
    // aliveAtVote/traitorsAtVote are the population as it stood when the ballots
    // were cast, and they are DATA, not behaviour — nothing in the engine reads
    // them. They exist because the null hypothesis for a banishment is not a
    // constant: the murder only ever removes Faithfuls, so Traitor density
    // climbs monotonically all season and a late banishment is a likelier
    // Traitor hit for reasons that have nothing to do with deduction. Without
    // these two numbers there is no way to tell a room that learned something
    // from a room that simply ran out of Faithfuls.
    log.push({ ep, banished: r.banished, wasTraitor: r.wasTraitor, ...night, mission,
      alive: alive.length, aliveAtVote: alive.length, traitorsAtVote: tr,
      castleEvents, budget: { ...gs.tr.roundBudget } });
  }

  const survivingTraitors = livingTraitors(ep);
  return {
    traitors,
    log,
    rounds: gs.tr.rounds,
    // Nights the Traitors struck and nobody died. Copied out because the next
    // season replaces gs wholesale.
    blockedMurders: [...(gs.tr.blockedMurders || [])],
    roleHistory: [...(gs.tr.roleHistory || [])],
    // Every narrative thread the castle opened, with its full beat log.
    // HARNESS DATA, NOT BEHAVIOUR — nothing in the engine reads this copy.
    // It is here because "continuation beats novelty" is this plan's central
    // claim and it was unmeasurable from outside the season: `gs` is replaced
    // wholesale by the next one, so a caller that plays 200 seasons and then
    // reads `gs.tr.threads` is reading season 200 and calling it a
    // population. Copied out for the same reason `rounds` and `roleHistory`
    // are.
    threads: [...(gs.tr.threads || [])],
    // The money, and every afternoon that earned it. Copied out for the same
    // reason as `rounds` and `threads`: the next season replaces gs wholesale.
    missions: [...(gs.tr.missions || [])],
    pot: gs.tr.pot,
    potCeiling: gs.tr.potCeiling,
    survivors: [...(gs.activePlayers || [])],
    winner: survivingTraitors.length ? 'traitors' : 'faithfuls',
  };
}
