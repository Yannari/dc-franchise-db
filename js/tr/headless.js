// ══════════════════════════════════════════════════════════════════════
// tr/headless.js — a whole season, with no UI and no screens
// ══════════════════════════════════════════════════════════════════════
//
// The point of this file is measurement. A social deduction engine can pass
// every unit test it has and still produce a room that never works anything
// out, because "did the belief update" and "did the room find the Traitors" are
// different questions and only the second one matters.
import { gs, setGs, players, seasonConfig, ARCHETYPES } from '../core.js';
// THE LEAF TABLE, not `pronouns()` in js/players.js. They are the same rule --
// `pronouns()` is `pronounsOf(p.gender)` and nothing else -- and this takes the
// gender off a roster entry this file already has in hand. js/tr/state.js
// resolves the same clauses off the same table for the same reason.
import { pronounsOf } from '../pronouns-of.js';
import { pStats } from '../players.js';
import { initTraitorsState, snapshotTraitorsBackgrounds, receiptsForEp,
  trimRecordedReceipts } from './state.js';
import { resetKnowledge } from '../knowledge.js';
import { setBond, getBond } from '../bonds.js';
import { selectTraitors, recordAlignment, livingTraitors, livingFaithfuls,
  canRecruit, chooseRecruit, offerRecruitment, alignmentAt } from './roles.js';
// The ballot array the export builds, used unchanged. See `_tableRecord`.
import { traitorsRoundBallots, traitorsBeliefSnapshot, TRAITORS_FORMAT } from './export.js';
// The show's two exit words, from the registry. Never written as literals.
import { exitVerbs, roundExits } from '../shows.js';
import { seedTraitorKnowledge, ballotEvidence, murderEvidence, missionEvidence } from './deduction.js';
import { variantEvidence } from './murder-variants.js';
import { runRoundTable } from './roundtable.js';
import { resolveMurder } from './murder.js';
import { sceneParticipants, sceneSpeakers, KNOWN_WINDOWS } from './events.js';
// TASK 5: the day is scheduled in six chronological phases, each with its
// own scene-count budget, replacing the old flat 4-8-per-round total split
// fair-share across all seven windows. See js/tr/castle/phases.js.
import { runCastlePhase, castlePhaseRecord, CASTLE_PHASE_BUDGETS } from './castle/phases.js';
import { densityFactor, scaledRange, TR_DENSITY_DEFAULT } from '../tr-density.js';
import { outcomeSense } from './threads.js';
// TASK 7A: the day is EDITED before it is filed — stories ranked, beats
// ordered inside their phase, promises answered. See js/tr/episode-editor.js
// for what it may and may not do (controller ruling R1: it orders and shapes,
// and it spends none of the scene throughput Task 7 bought).
import { buildEpisodeEdit } from './episode-editor.js';
import { runMission, POT_CEILING } from './missions.js';
import { shieldEvidence, expireShields, settleDaggers } from './powers.js';
import { runEndgame } from './endgame.js';
import { runArmoury, armouryBlockEvidence } from './armoury.js';
import { computeAlliances } from './alliances.js';
import { initCrowd, scoreNight, scoreRecruitment, scoreTable, scoreMission,
  scoreEndgame } from './crowd.js';

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
import '../tr/castle/mission-fallout.js';
import '../tr/castle/consequences.js';
import '../tr/castle/nightfall.js';
import '../tr/castle/confrontation.js';
// The scenes that need a room. `_sceneActors` returned one or two actors and
// nothing else, so the composer's `group` mode (js/vp-tr/castle-day.js:1461,
// with its own ESTABLISH_GROUP pool) had never once run in a played season.
import '../tr/castle/group.js';
// The hours that could only ever START something. `morning` and `journey-out`
// ran at 42% and 44% continued scenes against 54-67% everywhere else, because
// ten of the eleven (family x window) cells with no advancer at all are in
// those two columns. These five refuse to fire without a story to continue.
import '../tr/castle/carry-on.js';
// The morning nobody was taken. Every other dawn scene in the pool needs a
// body; a blocked night has none, and had no scene at all.
import '../tr/castle/quiet-night.js';
// The scenes one person has. Seven of the pool's ten busiest branches are
// SOLO branches, because a solo draw happens ~40% of the time and only a
// handful of events carry one — so that handful absorbs nearly all of them.
import '../tr/castle/alone.js';

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
  // NO MURDER ONCE THE FIRE ROUND IS REACHED. `_night` runs after the round
  // table, so the room here is post-banishment; when that banishment has left
  // the endgame size (or fewer), the finale begins tonight and there is no
  // murder after it. Without this the last mandated night killed one more and a
  // "final four" opened the endgame on three. (Doubles that would overshoot are
  // held back separately, in pickVariant, so a room one above the size cannot
  // be carried two under it.)
  if (!livingTraitors(ep).length
    || (gs.tr.endgameSize && (gs.activePlayers || []).length <= gs.tr.endgameSize)) {
    return { murdered: null, murderTarget: null, blocked: false, recruited: null,
      executed: null, livingAtMurder: [], conclave: null };
  }
  const rounds = gs.tr.rounds;
  const last = rounds.length ? rounds[rounds.length - 1] : null;

  // Recruit rather than murder when the pact is thin and somebody is takeable —
  // or when the author PINNED a recruitment to this night from the timeline
  // (`gs.tr.murderSchedule[ep] === 'recruit'`). Either way `canRecruit` still
  // gates it: the pact cannot recruit until the room has banished one of them,
  // which is the show's own rule, so a pinned recruitment the castle cannot yet
  // run simply falls through to a murder. With nothing pinned this is the old
  // thin-pact heuristic, draw for draw.
  const forcedRecruit = !!(gs.tr.murderSchedule && gs.tr.murderSchedule[ep] === 'recruit');
  // THE AUTOMATIC RECRUIT FIRES ONCE A SEASON. Before, the only gate was
  // `canRecruit` (a Traitor has been banished and one still lives), so with a
  // thin pact the 45% roll could land on consecutive nights — two recruitments
  // back to back, two nights with no murder, which is not how the pact refills
  // itself. The automatic path now spends a single season-long token; a
  // recruitment the AUTHOR pinned from the timeline still runs whenever it is
  // scheduled, because that is a deliberate beat and not the heuristic firing.
  // The automatic path is spent once a season (the cap) and can be switched off
  // entirely by the Castle Option — either way a PINNED recruitment still runs.
  // HOW OFTEN THE PACT RECRUITS, BY HOW THIN IT IS. Down to ONE Traitor it is
  // near-certain — an ultimatum, because the pact ends the moment that one is
  // banished. At TWO it is the old occasional 45%. At three or more it does not
  // recruit at all; there is no need. (User-tuned: "1 left = ~100%, 2 = 45%".)
  const _trLeft = livingTraitors(ep).length;
  const recruitRate = _trLeft === 1 ? 1.0 : (_trLeft === 2 ? 0.45 : 0);
  // DRAW THE ROLL UNDER THE CONDITION THE ENGINE ALWAYS DREW IT — canRecruit,
  // not pinned, pact thin (rate > 0 is the same "< 3 Traitors" gate) — so the
  // game rng stream does not shift; only the THRESHOLD moved. The toggle and cap
  // gate the RESULT below, after the draw, never the draw itself.
  const autoRoll = canRecruit(ep) && !forcedRecruit
    && recruitRate > 0 && rng() < recruitRate;
  // TWO RECRUITS A SEASON AT MOST, ONE PER PACT SIZE. The show recruits as the
  // pact thins — an occasional bolster at two Traitors, and the iconic survival
  // recruit when only one is left — but it does not recruit over and over. So
  // each STATE gets its own once-a-season token: the two-Traitor refill fires at
  // most once, and the one-Traitor emergency at most once. Without the second
  // token the emergency was uncapped, and a pact that yo-yoed (recruit -> two,
  // banished -> one, recruit again) could recruit three or more times. Both obey
  // the "Random recruitment" toggle, so turning it off turns ALL of it off.
  const autoOn = !gs.tr.noAutoRecruit;
  const capOk = _trLeft === 1 ? !gs.tr.emergencyRecruited : !gs.tr.autoRecruited;
  const wantsRecruit = canRecruit(ep)
    && (forcedRecruit || (autoRoll && autoOn && capOk));
  if (wantsRecruit) {
    const pick = chooseRecruit(ep, rng);
    if (pick) {
      // Spend this pact size's once-a-season token (the emergency at one
      // Traitor, the refill at two). A PINNED recruit spends neither — the
      // author may schedule as many as they like.
      if (!forcedRecruit) {
        if (_trLeft === 1) gs.tr.emergencyRecruited = true;
        else gs.tr.autoRecruited = true;
      }
      // The ultimatum fires only with one Traitor left — the format's own rule,
      // and the reason refusal is fatal there: they have seen the only face.
      const offer = offerRecruitment(pick.target, ep, rng,
        { mode: livingTraitors(ep).length === 1 ? 'ultimatum' : 'note', recruiter: pick.recruiter });
      const recruited = { ...offer, target: pick.target };
      scoreRecruitment(ep, recruited);
      if (last) { last.recruitment = recruited; if (offer.executed) last.executed = offer.executed; }
      // A refused ultimatum kills. It is not a `murdered` — see the note on
      // offerRecruitment — but it is a body, and it is on the log and on the
      // round record so that anything counting who left the castle finds it.
      // A night spent making an offer holds no conclave, so there is no
      // meeting for the screen to draw. `null` and not an empty meeting:
      // the two are different nights and the screen says so.
      return { murdered: null, murderTarget: null, blocked: false, recruited,
        executed: offer.executed || null, livingAtMurder: [], conclave: null };
    }
  }

  // Snapshot the room BEFORE the kill. This is harness DATA, not behaviour:
  // nothing in the engine reads it. It exists so the calibration can ask
  // whether the victim was better connected than the field the conclave was
  // choosing from, which is unanswerable once the victim has been removed.
  const livingAtMurder = [...(gs.activePlayers || [])];
  // WHO WAS IN THE TURRET, READ BEFORE THE NIGHT RESOLVES. `name-your-own`
  // takes one of the pact's own, so asking afterwards returns a room with a
  // chair missing and the screen would draw two cloaks for a meeting three
  // people attended.
  const turret = livingTraitors(ep);
  const m = resolveMurder(ep, rng);
  // THE CONCLAVE'S OWN BALLOT SET, recorded rather than left in the return
  // value, because the export shape (js/tr/export.js, spec 10.1) models the
  // murder as a vote only the Traitors cast — and the ballot that matters most
  // is the OVERRULED one, which no reader can recover from the victim. It has
  // to be on the round record for the same reason `murderCost` and `variant`
  // are: this frame is gone by the time anything reads the season back.
  const murderBallots = _murderBallots(m);
  const conclave = _conclaveRecord(ep, m, murderBallots, turret);
  scoreNight(ep, { murderTarget: m.target, murdered: m.victim, blocked: m.blocked,
    murderBallots }, { bondOf: getBond });
  if (last) {
    last.murderBallots = murderBallots;
    last.murdered = m.victim;
    last.murderTarget = m.target;
    // murderEvidence reads this NEXT round; it must be on the round record.
    last.murderCost = m.cost;
    // AND SO DOES variantEvidence, under the same once-guard. The shape of the
    // night has to be on the ROUND and not merely in this return value,
    // because the room reads it at the following breakfast and by then this
    // frame is long gone. `secondVictim` is a double murder's other body: it
    // is recorded separately rather than turning `murdered` into an array,
    // because ten readers across the engine and the export shape treat
    // `murdered` as one name and quietly rewriting it into a list is how a
    // count starts disagreeing with the ledger.
    last.variant = m.variant || 'standard';
    last.variantData = m.variantData || null;
    last.variantLine = m.variantLine || null;
    // The POOL the sentence came out of, not just the sentence. See
    // `variantLine` in murder-variants.js: a guard that reads only the
    // rendered text can be made to agree with itself.
    last.variantLineKey = m.variantLineKey || null;
    last.secondVictim = m.second || null;
  }
  return { murdered: m.victim, murderTarget: m.target, blocked: m.blocked,
    variant: m.variant || 'standard', secondVictim: m.second || null,
    // THE MEETING ITSELF, for the screen that draws it. Everything here is
    // READ off the decision the engine just made -- the argued list, the
    // overrule, the wax -- rather than re-derived from the victim, for the
    // reason js/tr/export.js gives about `murderBallots`: a recomputation
    // sees a unanimous conclave every night and the overruled Traitor, who
    // is the whole point of the room, disappears from it.
    conclave,
    // Night one has no round record to write to — there is no table on the
    // first night — so its ballots reach the export through the log instead.
    murderBallots,
    recruited: null, executed: null, livingAtMurder };
}

/**
 * The conclave, as ballots.
 *
 * `argued` is one entry per living Traitor who had a target, and the winner is
 * the one whose argument carried — so it IS a ballot set, read off the record
 * rather than reconstructed. The `name-your-own` variant argues nothing (one
 * Traitor is handed the choice), and there the single ballot is the decider's.
 */
function _murderBallots(m) {
  const d = m?.decision;
  if (!d) return [];
  const argued = (d.argued || []).filter(p => p && p.target);
  if (argued.length) {
    return argued.map(p => ({ voter: p.traitor, voted: p.target, channel: 'murder' }));
  }
  return (d.decidedBy && d.target)
    ? [{ voter: d.decidedBy, voted: d.target, channel: 'murder' }]
    : [];
}

/**
 * The evening downstairs, for the screen's left margin.
 *
 * Read off the castle's own thread beats rather than invented, so the two
 * columns are the same night: a beat is only downstairs if NOBODY in it was
 * upstairs. A scene one of the three was standing in is not an alibi and must
 * never be printed as one.
 */
function _downstairs(ep, turret) {
  const up = new Set(turret || []);
  const out = [];
  for (const t of gs.tr?.threads || []) {
    if ((t.parties || []).some(n => up.has(n))) continue;
    for (const b of t.beats || []) {
      if (b.ep !== ep || !b.note) continue;
      out.push({ who: (t.parties || [])[0] || null, parties: [...(t.parties || [])],
        kind: t.kind, note: String(b.note).split(String.fromCharCode(10))[0] });
    }
  }
  return out;
}

/**
 * The conclave, in the shape a screen draws it (`js/vp-tr/conclave.js`).
 *
 * PLAIN DATA ONLY, and every field is read rather than recomputed. It is
 * written onto the episode record because `gs` is replaced wholesale by the
 * next season and rebuilt wholesale by a load, and a screen that reached back
 * into `gs.tr` for the argument would draw the season it is standing in
 * rather than the episode it is showing.
 *
 * `argued` is one entry per Traitor who had a name, including the two the room
 * did not take. That is the single most important thing on this record: the
 * ballot that LOST is what makes the turret a room rather than a formality,
 * and it is the one thing no reader can recover from the body.
 */
function _conclaveRecord(ep, m, ballots, turret) {
  if (!m || !m.target) return null;
  const d = m.decision || {};
  const shield = (gs.tr?.shields || []).find(s => s.ep === ep) || null;
  return {
    ep,
    // 'standard' | 'on-trial' | 'face-to-face' | 'dungeon' | 'double' |
    // 'plain-sight' | 'name-your-own'. Two of those hold no argument at all,
    // and the screen has to know which night it is drawing.
    variant: m.variant || 'standard',
    line: m.variantLine || null,
    turret: [...(turret || [])],
    target: m.target,
    decidedBy: d.decidedBy || null,
    reason: d.reason || null,
    blocked: !!m.blocked,
    victim: m.victim || null,
    second: m.second || null,
    argued: (d.argued || []).filter(p => p && p.target).map(p => ({
      traitor: p.traitor, target: p.target, reason: p.reason,
      conviction: Math.round((p.conviction || 0) * 100) / 100,
    })),
    overruled: (d.overruled || []).map(o => ({
      winner: o.winner, loser: o.loser, target: o.target,
      theirTarget: o.theirTarget || null, forced: !!o.forced,
    })),
    ballots: (ballots || []).map(b => ({ ...b })),
    // The named consequence, not a number -- see `murderCost`.
    cost: m.cost ? { kind: m.cost.kind, blames: [...(m.cost.blames || [])] } : null,
    pot: gs.tr?.pot ?? 0,
    // The Shield that was live tonight, if one was, and whether the pact could
    // see it. Read off the record `awardShield` wrote rather than asked of the
    // Set, because the Set is spent by the time anything replays this.
    shield: shield ? { holder: shield.holder, visibility: shield.visibility,
      pactAware: !!shield.pactAware } : null,
  };
}

/**
 * THE ROUND TABLE, in the shape a screen draws it (`js/vp-tr/round-table.js`).
 *
 * Read off `gs.tr.rounds` rather than off `runRoundTable`'s return value, and
 * the difference is not cosmetic: that return value is a SHALLOW SPREAD taken
 * before the night runs, so `murderBallots` -- which `_night` writes back onto
 * the same round object minutes later -- is not on it. A record built from the
 * spread carries no murder channel at all, `publicBallots()` then has nothing
 * to filter, and the guard that exists to prove the private ballots are
 * dropped passes without ever dropping one.
 *
 * `votes` IS THE EXPORT'S OWN ARRAY, built by the export's own function.
 * Both channels, revotes carrying their own. The screen filters it through
 * `publicBallots()` exactly as every other public reader does; nothing here
 * pre-filters, because a record that arrives already clean is a record whose
 * filter can never be shown to work.
 *
 * ── AND THE ENDGAME CARRIES NO ALIGNMENT (spec 8) ──────────────────────
 *
 * There are no reveals at a finale table -- the survivors go on nerve alone,
 * and that absence is what makes the last votes feel different from every
 * earlier one. The engine already keeps it: `runEndgame` calls the table with
 * `reveal:false`, which suppresses `revealCascade` and drops the exit speech
 * for EVERYBODY rather than only for Traitors, because if Traitors were the
 * only people who left in silence the silence would itself be the reveal.
 * The same rule applies to this record. `chosenAlignment`, `truth` and
 * `betrayals` are all ground truth, and none of the three is written onto a
 * finale table -- the screen has an explicit branch too, but a branch that
 * never receives the data cannot leak it whatever a later edit does to the
 * markup.
 *
 * `chosen` rather than the registry's word for it: js/vp-tr/ may not write an
 * exit verb as a literal (tests/tr-vp.test.js scans the sources), and a field
 * name is a literal the scan cannot tell from a sentence.
 */
function _tableRecord(ep, { endgame = false } = {}) {
  const round = (gs.tr?.rounds || []).find(r => r.ep === ep);
  if (!round) return null;
  const votes = traitorsRoundBallots(round);
  // Everyone who cast a ballot in the first count is everyone who was at the
  // table: the format seats the whole castle and every one of them writes a
  // name. Derived from the ballots rather than snapshotted separately, so the
  // seating and the vote can never come to disagree.
  const seated = votes.filter(v => v.channel === 'banishment').map(v => v.voter);
  // THE WHOLE RING, INCLUDING THE CHAIRS NOBODY IS IN. Everyone who ever sat
  // down, in the order they sat down, with the door each of the missing left
  // by. Read off the rows already written — `gs.episodeHistory` at this point
  // holds every episode BEFORE this one, which is exactly the room as it was
  // when tonight's table was called — rather than recomputed from the living,
  // because "who is gone" and "how they went" are two different facts and only
  // the second one is dramatic.
  const doorOf = {};
  for (const row of gs.episodeHistory || []) {
    for (const x of row.exits || []) if (x && x.name) doorOf[x.name] = x.channel || 'banishment';
  }
  const order = (gs.tr?.castOrder || []).length ? gs.tr.castOrder : seated;
  const ring = order.map(name => ({ name, door: doorOf[name] || null }));
  const rec = {
    ep,
    endgame: !!endgame,
    votes,
    seated,
    ring,
    // The tied set per revote round, in order, and HOW MANY BALLOTS that round
    // cast. The ballots themselves are on `votes` under their own channel;
    // the count is recorded rather than left to the screen to work out
    // from the tied set: the format's rule -- the tied are the question and do
    // not answer it -- is the engine's to state, and a screen re-deriving it
    // would be a second copy of a rule that has already changed once.
    revotes: (round.revotes || []).map(rv => ({
      tied: [...(rv.tied || [])], count: (rv.ballots || []).length })),
    accusations: (round.accusations || []).map(a => ({ ...a })),
    // THE ARGUMENTS THE TABLE ACTUALLY HAD. `accusations` above is a list of
    // names pointed at names; a clash is two of those people going at each
    // other out loud (js/tr/roundtable.js `clashes`). Public on every layer
    // by construction: a clash reads what was said at this table plus the
    // season's own thread kinds and outcomes, never an alignment and never a
    // belief's certainty.
    clashes: (round.clashes || []).map(c => ({ ...c })),
    // THE ACCUSATIONS WITH THEIR PROVENANCE. Public on every layer: a speech
    // is a claim made out loud at the table, and its `sources` are drawn from
    // the speaker's own suspicion (never a `public`-tier turret belief — see
    // `speechesFrom`), so nothing here is a fact a player at the table could
    // not have heard said. `swayed`/`mindChanges` are the listeners the claim
    // reached and moved, both derived from beliefs the debate already formed.
    speeches: (round.speeches || []).map(s => ({
      speaker: s.speaker, target: s.target,
      sources: (s.sources || []).map(src => ({ ...src })),
      // WHY THIS NAME, when `sources` is empty -- which it is for better than
      // a quarter of them. See `_reasonFor` in js/tr/roundtable.js. Public on
      // every layer: `hearsay` names somebody who accused OUT LOUD at this
      // table, and the other three kinds describe the ABSENCE of a record
      // rather than any record's contents.
      reasonKind: s.reasonKind || ((s.sources || []).length ? 'cited' : 'feeling'),
      hearsayFrom: s.hearsayFrom || null,
      swayed: [...(s.swayed || [])], mindChanges: [...(s.mindChanges || [])] })),
    chosen: round.banished || null,
    dagger: round.dagger ? { ...round.dagger } : null,
    speech: round.exitSpeech
      ? { burns: !!round.exitSpeech.burns, target: round.exitSpeech.target || null,
        text: round.exitSpeech.text || '' }
      : null,
    pot: gs.tr?.pot ?? 0,
  };
  if (!endgame) {
    rec.chosenAlignment = round.banishedWasTraitor == null
      ? null : (round.banishedWasTraitor ? 'traitor' : 'faithful');
    // WHAT THE AUDIENCE KNOWS AND THE ROOM DOES NOT. Every seat's real
    // alignment on this night, which is the whole of the dramatic irony the
    // format runs on: the screen prints, beside each accusation, whether the
    // person being accused actually is one. It is the audience's privilege and
    // nobody else's -- js/vp-tr/round-table.js strips it from the record
    // before a `player:` observer's screen is built from it.
    rec.truth = {};
    for (const n of seated) rec.truth[n] = alignmentAt(n, ep);
    rec.betrayals = (round.betrayals || []).map(b => ({ ...b }));
  }
  return rec;
}

/**
 * Everybody who had already left the castle when this episode opened.
 *
 * `roundExits()` is the rule and it is asked once per row already written: a
 * Traitors round removes up to two people through two different doors and
 * `eliminated` is only ever the public vote. Every entry keeps its verb and
 * its channel, because "who is gone" and "how they went" are two different
 * facts and both screens draw both.
 */
function _goneThrough() {
  const out = [];
  for (const row of gs.episodeHistory || []) {
    for (const x of roundExits(row, TRAITORS_FORMAT)) out.push({ ...x, ep: row.num });
  }
  return out;
}

/**
 * The relics, as the board draws them.
 *
 * `witnesses` is copied out because it is the only thing that decides what a
 * given player is allowed to be told, and `visibility` is the tier the engine
 * ALREADY decided against the room size it was decided in -- re-deriving it
 * from a witness count at read time would be a second copy of a rule that has
 * a denominator the castle no longer has.
 */
function _powerLedger() {
  const copy = r => ({ ep: r.ep, holder: r.holder, witnesses: [...(r.witnesses || [])],
    visibility: r.visibility, outcome: r.outcome, seenLine: r.seenLine || '',
    playedEp: r.playedEp ?? null, target: r.target ?? null,
    // WHERE IT CAME FROM, AND WHO WALKED IN. An Armoury Shield has no
    // witnesses by construction, so without these two the Day Book could only
    // say "holder not known to you" — and the group that went in is the one
    // thing the castle DOES know and the only thing anybody can play against.
    via: r.via || null, entrants: [...(r.entrants || [])] });
  return {
    shields: (gs.tr?.shields || []).map(copy),
    daggers: (gs.tr?.daggers || []).map(copy),
  };
}

/**
 * The afternoon, in the shape the mission screen draws it (`js/vp-tr/mission.js`).
 *
 * PLAIN DATA, COPIED, and for the same reason `_conclaveRecord` is: `gs` is
 * replaced wholesale by the next season and rebuilt wholesale by a load, and
 * `gs.tr.missions` is the season's whole log rather than this afternoon's
 * entry. A screen reaching into it would draw whichever mission happened to be
 * last when the viewer opened the episode.
 *
 * THE RELIC BLOCK CARRIES ITS WITNESS LIST, exactly as `_powerLedger` does and
 * for exactly the same reason: who saw the award is the mechanic's entire
 * strategic content, and a screen that cannot tell an entitled observer from a
 * blind one has deleted it. `runMission` writes ONE of `shield`/`dagger` and
 * never both -- which relic was down there is a fact about the season, not
 * about the search -- so this copies whichever key is present under a `kind`
 * rather than flattening the two into one field that would let a sentence
 * describe the wrong afternoon.
 *
 * `null` when no mission ran: fewer than four people left, or an endgame
 * round, and the screen must not be registered for either.
 */
/**
 * The fields a BESPOKE mission carries beyond the archetype shape, deep-copied.
 *
 * All plain data (strings, numbers, arrays, objects) — no functions, no Sets —
 * so a `JSON` round trip is a faithful deep clone and survives save/load. The
 * `shield`/`shields` block is left to `_missionRecord`'s existing relic
 * handling, which already reads `m.shield`.
 */
function _bespokeMissionFields(m) {
  const clone = v => (v == null ? v : JSON.parse(JSON.stringify(v)));
  return {
    ceremony: clone(m.ceremony),
    briefing: m.briefing || '',
    phases: clone(m.phases) || [],
    playerScores: clone(m.playerScores) || {},
    placements: Array.isArray(m.placements) ? [...m.placements] : [],
    scenes: clone(m.scenes) || [],
    shields: clone(m.shields) || [],
    tally: clone(m.tally) || null,
    potBefore: typeof m.potBefore === 'number' ? m.potBefore : Math.max(0, (m.potAfter || 0) - (m.earned || 0)),
  };
}

function _missionRecord(m) {
  if (!m) return null;
  const relicKey = m.shield ? 'shield' : (m.dagger ? 'dagger' : null);
  const r = relicKey ? m[relicKey] : null;
  return {
    id: m.id, ep: m.ep, name: m.name,
    // The physical task. On the row for the same reason everything else here
    // is: the screen reads a record and must not reach into `gs.tr.missions`
    // for whichever afternoon happened to run last.
    task: m.task || null,
    teams: (m.teams || []).map(t => ({ name: t.name, members: [...(t.members || [])],
      perf: t.perf })),
    quality: m.quality, tier: m.tier, bestTeam: m.bestTeam,
    gross: m.gross, earned: m.earned, potAfter: m.potAfter,
    sideObjectives: (m.sideObjectives || []).map(o => ({ ...o })),
    summary: m.summary || '',
    // ── THE BESPOKE AFTERNOON, WRITTEN OUT ──────────────────────────────
    // A bespoke mission (js/tr/missions/) is an archetype record with an
    // episode's worth of detail hung off it. The screen draws that detail — a
    // full briefing, three phases with beats, the scenes and their
    // confessionals, the running tally — so it is copied onto the row, in
    // plain data, for exactly the reason the rest of this record is: a screen
    // must not reach into `gs.tr.missions` for whichever afternoon happens to
    // be last. Absent (not empty) on an archetype afternoon, so the screen
    // branches on which kind it is drawing rather than on a length. Deep-copied
    // because a save round-trips this and a shared reference would let a load
    // alias two seasons.
    ...(Array.isArray(m.phases) ? _bespokeMissionFields(m) : {}),
    // The Chess afternoon's observable, and it is an observable and not a
    // belief -- see the note in js/tr/missions.js. Absent on every other
    // archetype rather than empty, so the screen branches on the afternoon it
    // is drawing rather than on a length.
    tellLines: m.tellLines ? [...m.tellLines] : null,
    tells: m.tells ? m.tells.map(t => ({ ...t })) : null,
    readers: m.readers ? [...m.readers] : null,
    relic: r ? {
      kind: relicKey,
      searcher: r.searcher, found: !!r.found, cost: r.cost || 0,
      holder: r.holder || null, witnesses: [...(r.witnesses || [])],
      visibility: r.visibility || null, lines: [...(r.lines || [])],
    } : null,
  };
}

/**
 * The offer, in the shape the recruitment screen draws it.
 *
 * `null` on the great majority of nights -- the pact spends most of them
 * killing instead, and recruitment cannot open at all until the room has
 * banished one of them. The screen is registered off this field being present,
 * never off an episode number.
 *
 * MODE IS COPIED FROM THE OFFER AND NEVER RE-DERIVED. `offerRecruitment`
 * downgrades an ultimatum to a note when there is more than one Traitor left
 * to be identified -- the fatal refusal is only justified by "they have seen
 * your face", which is only true when there is one face. A screen deciding the
 * mode from `livingTraitors` at read time would hold a second copy of that
 * rule and would eventually draw an ultimatum over a night that ran a note.
 */
/**
 * THE SELECTION CEREMONY, PERFORMED RATHER THAN SUMMARISED.
 *
 * `line`, `chosen`, `taps` and `turret` are the FACTS of the walk and were
 * here first. What is added is the EVENING: the speech, the staging, the rule
 * points and the reveal steps, stored as four separate lists because they are
 * withheld and re-cut separately. A ceremony whose staging lives inside its
 * narration is a ceremony a screen can only print in one order, and this is
 * the one evening in the format that has three different orders — the
 * audience's, a tapped player's and everybody else's.
 *
 * `afterTap` IS THE ONLY ORDERING THIS RECORD ASSERTS, and it is the ordering
 * the contract cares about: the host says what a hand on the shoulder means
 * BEFORE any hand lands (`afterTap: null`), and the rest of the speech is
 * pinned to the tap it follows. It is CLAMPED to the taps that exist, because
 * `traitorCount` is configurable and a beat pinned to the second hand of a
 * one-Traitor season is a beat nothing ever reaches.
 *
 * ── AND NOT ONE WORD OF IT NAMES ANYBODY ──────────────────────────────
 *
 * Every beat here is spoken to the whole rank with cloth over every face. The
 * names on this record live where they already lived — `taps`, `chosen`,
 * `turret` — behind the two gates `_view()` in js/vp-tr/selection.js keeps. A
 * speech that named a shoulder would be a speech the untapped layer could not
 * be shown at all, and the untapped layer is the one the format is about.
 *
 * ── THE COUNT IS NOT GIVEN AWAY ───────────────────────────────────────
 *
 * The writing contract allows the host to state how many were chosen ONLY
 * where the format configuration makes that count public knowledge, and the
 * default is that it does not. `announceCount` is that switch and it is off
 * unless a season asks; the audience record knowing the number is not a reason
 * to let the host say it on the gravel.
 */
function _selectionRecord(ep, cast, traitors, { announceCount = false } = {}) {
  const line = [...(cast || [])];
  const chosen = [...(traitors || [])];
  const taps = chosen
    .map(name => ({ name, at: line.indexOf(name) }))
    .filter(t => t.at >= 0)
    .sort((a, b) => a.at - b.at);
  const last = Math.max(0, taps.length - 1);
  // Pin a beat to a hand that actually landed. A one-Traitor season has one.
  const after = n => Math.min(n, last);

  const hostBeats = [
    { kind: 'open', visibility: 'all', afterTap: null,
      action: 'The host steps off the front of the rank and walks to one end of it.',
      text: 'In a moment I am going to walk behind every one of you. You will hear exactly '
        + 'where I am. You will have no idea who I am standing behind.' },
    // THE LINE THE WHOLE EVENING TURNS ON, AND IT IS SAID FIRST.
    { kind: 'rule', visibility: 'all', afterTap: null, ruleId: 'tap-means-traitor',
      action: 'The footsteps start along the gravel behind the rank.',
      text: 'If you feel my hand on your shoulder, you have been chosen as a Traitor.' },
    { kind: 'rule', visibility: 'all', afterTap: null,
      action: 'The footsteps carry on without stopping.',
      text: 'You will lie to the people standing beside you. You will eat breakfast with '
        + 'them, agree with them, comfort them, and help them decide which one of them to '
        + 'send home.' },
    { kind: 'rule', visibility: 'all', afterTap: after(0), ruleId: 'traitors-murder',
      action: 'The walk resumes.',
      text: 'And every night, once this castle is asleep, you will meet in secret and '
        + 'choose one of them to murder.' },
    { kind: 'rule', visibility: 'all', afterTap: after(0), ruleId: 'faithfuls-banish',
      action: 'The host turns at the end of the rank and starts back.',
      text: 'If you feel nothing at all, you are a Faithful, and your task is very easy to '
        + 'say and extremely hard to do. Find the Traitors. Banish every single one of them '
        + 'before they have finished with you.' },
    { kind: 'rule', visibility: 'all', afterTap: after(1), ruleId: 'do-not-react',
      action: 'The hand lifts and the footsteps do not hurry.',
      text: 'Do not speak. Do not move. Nobody standing next to you may know what has just '
        + 'happened to you.' },
    { kind: 'rule', visibility: 'all', afterTap: after(2),
      action: 'The host stops walking.',
      text: 'From this minute, every friendship in this castle may be real and every one of '
        + 'them may be work, and none of you will be told which is which.' },
    { kind: 'close', visibility: 'all', afterTap: 'final',
      action: 'The host returns to the front of the rank.',
      text: 'When I tell you to take the blindfolds off, look very carefully at the people '
        + 'around you. Some of them have just been handed an excellent reason to lie to '
        + 'your face.' },
    { kind: 'close', visibility: 'all', afterTap: 'final',
      action: 'A pause, long enough to be uncomfortable.',
      text: 'Take them off.' },
  ];
  if (announceCount) {
    // ONLY WHERE THE CONFIGURATION SAYS THE ROOM IS TOLD. Inserted after the
    // rule it qualifies rather than appended, so it is heard as part of it.
    hostBeats.splice(2, 0, { kind: 'rule', visibility: 'all', afterTap: null,
      action: 'The number is said once and not repeated.',
      text: 'There will be ' + taps.length + ' of them. That is the only thing about them '
        + 'this castle is ever going to be told for nothing.' });
  }
  const rulePoints = hostBeats
    .map((b, i) => (b.ruleId ? { id: b.ruleId, explainedByBeat: i } : null))
    .filter(Boolean);

  return {
    ep, line, chosen, taps, turret: [...chosen],
    ceremonyId: 'selection',
    staging: 'The whole cast in one rank across the gravel with their blindfolds tied and '
      + 'their bags still on the flags behind them. The host waits until the drive is '
      + 'completely silent before saying anything at all.',
    hostBeats,
    // NAME-FREE BY CONSTRUCTION. These are what the RANK did, collectively,
    // and a rank that cannot see is the only witness any of them has.
    contestantBeats: [
      { kind: 'reaction', participants: [], visibility: 'all', afterTap: null,
        text: 'Nobody in the rank moves. Two of them are visibly counting the footsteps and '
          + 'both of them lose count.' },
      { kind: 'reaction', participants: [], visibility: 'all', afterTap: after(0),
        text: 'The gravel stops somewhere along the line and starts again. Every head in '
          + 'the rank stays facing exactly forward.' },
      { kind: 'reaction', participants: [], visibility: 'all', afterTap: 'final',
        text: 'The bands come off and the drive is instantly full of people being extremely '
          + 'normal at each other.' },
    ],
    rulePoints,
    // ONE STEP PER ACTION, in the order the evening ran them. A tap step
    // carries its ORDER and not its name: the names are on `taps`, behind the
    // gate that already withholds them.
    revealBeats: [
      { kind: 'rank', text: 'The cast are put shoulder to shoulder in the order they '
        + 'happened to be standing.' },
      { kind: 'blindfold', text: 'The bands go on and are tied at the back.' },
      { kind: 'silence', text: 'The drive goes quiet enough to hear the weather.' },
      { kind: 'footsteps', text: 'The host begins to walk the line.' },
      ...taps.map((t, i) => ({ kind: 'tap', order: i,
        text: 'A hand goes down on one shoulder and stays there.' })),
      { kind: 'unmask', text: 'The blindfolds come off.' },
      { kind: 'turret', text: 'After dark, the chosen are called up separately and arrive '
        + 'in the same room.' },
    ],
    reminder: 'The hand on the shoulder made a Traitor. Nothing about that ever changes.',
  };
}

function _recruitmentRecord(night) {
  const r = night && night.recruited;
  if (!r || !r.target) return null;
  return {
    target: r.target,
    recruiter: r.recruiter || null,
    mode: r.mode === 'ultimatum' ? 'ultimatum' : 'note',
    accepted: !!r.accepted,
    // A refused ultimatum is a body. It is NOT a murder -- see the note on
    // `offerRecruitment` -- and it is on `exits[]` above with the night's own
    // verb, so the screen takes the word from the registry like everything
    // else and never writes one.
    executed: r.executed || null,
  };
}

/**
 * The endgame, in the shape the last screen draws it (`js/vp-tr/endgame.js`).
 *
 * ONE RECORD FOR THE WHOLE PHASE, and not one per night, because the endgame
 * is not a night. It is the question put over and over until the room answers
 * it with one voice, and the number of times that took is the drama -- a
 * record split across rows would leave the screen re-assembling a phase out of
 * episodes and getting a different answer depending on which one was open.
 * It rides on the LAST row the season wrote, which is where a viewer clicking
 * forward through the season arrives at the end of it.
 *
 * ── AND IT CARRIES NO ALIGNMENT (spec 8) ──────────────────────────────
 *
 * `endgameChoice` returns the whole basis of the decision, and half of that
 * basis is ground truth: `role` is read off `alignmentAt`, and `fellows` and
 * `appetite` exist only on a Traitor's record and say so by being there. A
 * record built by spreading a choice would therefore hand the screen every
 * survivor's alignment at the exact table spec 8 says nothing is revealed at
 * -- so the choices are REBUILT to two fields rather than copied and pruned,
 * because a spread that later grows a field grows it silently.
 *
 * The tables are the same: a name and an episode. `runRoundTable` is called
 * with `reveal:false` in the endgame so no exit speech exists to leak, and
 * `wasTraitor` -- which the round object does carry -- is not copied here.
 *
 * The pot IS ground truth and is the one place it is legitimate: the game is
 * over, the cloaks come off, and `resolvePot` is the reveal. Every field of it
 * comes from that one function so the money on the screen and the money in the
 * export cannot come to disagree.
 */
function _endgameRecord(e) {
  if (!e) return null;
  const asks = (e.ballots || []).map(b => {
    const choices = (b.choices || []).map(c => ({ name: c.name, choice: c.choice }));
    const banish = choices.filter(c => c.choice === 'banish').length;
    return { ep: b.ep, living: [...(b.living || [])], choices, banish,
      unanimous: banish === 0 };
  });
  // WAS THE FINALE PLAYED WITH REVEALS ON. Off (the default and the spec §8
  // rule) a banished player's alignment never reaches this record — the screen
  // is blind by construction, not by omission. On, it is carried per table.
  const revealed = !!e.reveal;
  return {
    from: asks.length ? asks[0].ep : null,
    endEp: e.endEp ?? null,
    reveal: revealed,
    asks,
    // WHO WROTE WHOSE NAME, and the count it came to — the vote that actually
    // does the banishing, which the secret banish/end ballot above only DECIDES
    // TO HOLD. Without it the screen jumped from "somebody wanted another" to
    // "X is gone" with no vote in between, so a player who voted to END could
    // be banished with nothing on screen to explain it. The ballots are public
    // (a Round Table reads its slates aloud); `wasTraitor` is NOT, and rides
    // along only when the author turned reveals on.
    tables: (e.rounds || []).map(r => ({
      ep: r.ep, chosen: r.banished || null,
      ballots: (r.ballots || []).map(b => ({ voter: b.voter, voted: b.voted })),
      tally: Array.isArray(r.tally) ? r.tally.map(t => ({ ...t })) : (r.tally || null),
      // THE TIE-BREAK, so the screen can explain a banishment the first count
      // did not settle. A finale table of three can come in 1-1-1; the format
      // re-votes on the tied and, if that still ties (nobody eligible to break
      // it), draws a name. Without these the screen showed a level count and
      // then "it chose Gwen" with nothing between — see the reported bug. Each
      // revote carries who was tied and the ballots the eligible cast.
      revotes: (r.revotes || []).map(rv => ({
        tied: [...(rv.tied || [])],
        ballots: (rv.ballots || []).map(b => ({ voter: b.voter, voted: b.voted })),
      })),
      revealedTraitor: revealed ? !!r.wasTraitor : null,
    })),
    winner: e.winner || null,
    // ── THE UNMASKING ─────────────────────────────────────────────────
    //
    // The one moment the season's central fact becomes sayable, and the scene
    // the format is built to reach. Carried on the record rather than worked
    // out on the screen from who took the money: that inference is right today
    // (the takers ARE the pact when the pact survives) and it is a second
    // derivation of the most important fact in the show, which only has to
    // disagree once. `reveals` is already in reveal order — Faithfuls first,
    // the pact last, so the ending is not given away halfway through.
    reveals: (e.reveals || []).map(r => ({ name: r.name, role: r.role })),
    // And what the room sent home BLIND. No endgame banishment revealed
    // anything, so this is the first time anyone learns whether the room was
    // right — the difference between a clean win and one they got to by luck.
    sentHome: (e.sentHome || []).map(r => ({ name: r.name, role: r.role, ep: r.ep ?? null })),
    takers: [...(e.takers || [])],
    losers: [...(e.losers || [])],
    survivors: [...(e.survivors || [])],
    pot: e.pot ?? 0,
    share: e.share ?? 0,
    line: e.line || '',
    lineKey: e.lineKey || '',
  };
}

/**
 * The morning this episode opens on, which belongs to the night before it.
 *
 * `lastNight` is the previous row's `exits[]` handed over RAW, so the screen
 * runs `roundExits()` on it itself and takes the murder channel out: a
 * banishment happened in front of the whole room last night and is not news at
 * breakfast. On episode one there is no previous row and no empty chair -- the
 * cold open is an arrival instead, and the screen branches on `ofEp` being
 * null rather than on the episode number.
 */
function _morning() {
  const rows = gs.episodeHistory || [];
  const prev = rows.length ? rows[rows.length - 1] : null;
  return {
    ofEp: prev ? prev.num : null,
    lastNight: prev ? (prev.exits || []).map(x => ({ ...x })) : [],
    pot: prev ? (prev.tr?.pot ?? 0) : 0,
    // THE PACT STRUCK AND NOTHING HAPPENED, and it is the audience's fact
    // alone. Everybody came down; only the people watching at home know a
    // name was chosen upstairs and a relic ate it.
    blocked: !!(prev && prev.tr?.conclave?.blocked),
    // ── HOW LAST NIGHT WAS SHAPED, AND WHY IT IS ON THE MORNING ──────
    //
    // Six murder variants write a `variantLine` describing the shape of the
    // night. Two of them (plain-sight, name-your-own) are rendered by the
    // conclave screen. THE OTHER FOUR WERE RENDERED NOWHERE AT ALL -- measured
    // over 40 seasons, 38 firings of on-trial, face-to-face, dungeon and
    // double produced zero appearances of their own line on any screen of that
    // night or the following morning. Written, recorded, unreachable, which is
    // this project's signature bug class.
    //
    // THE MORNING AND NOT THE CONCLAVE, because most of these sentences are
    // about breakfast: "one of the three does not come down to breakfast",
    // "two of them are eating toast in the morning", "{a} is at breakfast.
    // {b} is not." Printed on the night screen they would announce who
    // survives before the murder has been shown.
    //
    // AUDIENCE ONLY, gated in the screen's `_view`. The list, the chapel and
    // the dungeon are things the castle never learns; a player who read this
    // would know the shape of a night nobody told them about.
    variantLine: (prev && prev.tr?.conclave?.line) || null,
    variant: (prev && prev.tr?.conclave?.variant) || null,
    // ── WHAT THE ROOM DOES WITH THE EMPTY PLACE (Plan 9, Task 9) ────────
    //
    // The morning is not a roll call. It has reactions, and every one of them
    // has to be CAUSED — a mourner grieves because of a stored bond with the
    // person who is gone, and the room's eyes turn to a survivor because that
    // survivor pushed the victim's name at the table the night before they
    // died. Both are computed here, from records the engine has already
    // written, because a VP screen may read none of them. All of it is
    // Faithful-safe: a bond and a public accusation are things anybody at the
    // table saw. No alignment is read.
    breakfast: prev ? _breakfast(prev) : null,
  };
}

// How warm a bond has to be before an absence reads as grief rather than
// merely a missing face. A held threshold, not tuned — a friend, not an
// acquaintance.
const GRIEF_BOND = 3;

/**
 * The reactions the empty place earns, keyed to the previous night.
 *
 * `prev` is last night's episode row. Its `exits[]` carries who went out the
 * murder door; `gs.tr.rounds` carries the table those victims sat at hours
 * before they died. The living are `gs.activePlayers` as they stand this
 * morning — the victim already removed.
 */
function _breakfast(prev) {
  const V = exitVerbs(TRAITORS_FORMAT);
  const murderVerb = V[1] || V[0];
  const victims = roundExits({ exits: prev.exits || [] }, TRAITORS_FORMAT)
    .filter(x => x.verb === murderVerb).map(x => x.name);
  const living = (gs.activePlayers || []).filter(Boolean);
  const round = (gs.tr?.rounds || []).find(r => r.ep === prev.num) || null;

  // WHO PUSHED THE VICTIM, and it is the read the engine already formed. Every
  // living player who accused the victim at the table or wrote their name on a
  // slate — and then the Traitors came for that same person. `murderEvidence`
  // (js/tr/deduction.js) has already made each of them look worse for it; this
  // records WHO so the morning can show the eyes turning, never the number.
  const pushed = {};
  for (const victim of victims) {
    if (!round) { pushed[victim] = []; continue; }
    const set = new Set([
      ...(round.accusations || []).filter(a => a.target === victim).map(a => a.accuser),
      ...(round.ballots || []).filter(b => b.channel === 'banishment' && b.voted === victim)
        .map(b => b.voter),
    ]);
    pushed[victim] = [...set].filter(n => living.includes(n));
  }

  // WHO GRIEVES, gated on a real stored bond. Sorted by how close they were,
  // capped so the morning names a few mourners rather than a census.
  const grief = [];
  const composed = [];
  for (const victim of victims) {
    const ranked = living
      .map(n => ({ mourner: n, victim, bond: getBond(n, victim) }))
      .sort((a, b) => b.bond - a.bond);
    for (const r of ranked) {
      if (r.bond >= GRIEF_BOND && grief.length < 4) grief.push(r);
    }
    // The people who lose nothing here: a flat or cold bond with the victim.
    // Not a suspicion — an emotional fact, and it is what makes the grievers
    // legible by contrast.
    for (const r of ranked) {
      if (r.bond <= 0 && composed.length < 3) composed.push(r.mourner);
    }
  }

  // WHO SAYS THE NAME. The closest living mourner if there is one — grief is
  // who reaches for it first — otherwise nobody is nominated and the screen
  // lets the room find the name on its own.
  const namer = grief.length ? grief[0].mourner : null;

  // ── WHAT THE MORNING NEEDS TO CARRY MORE THAN A ROLL CALL (user, Task 9.1) ──
  //
  // The breakfast the user played was too thin: it did little but reveal the
  // gap. These three fields feed conversation and table-reading beats, and
  // every one of them is a PUBLIC, stored fact — a bond anybody saw form, or a
  // seat anybody could point to — so no beat built on them invents anything and
  // none of them reads alignment.
  //
  //   closest — for each victim, the living player who held the warmest bond
  //     with them. It is the flashback's anchor (the last person the castle saw
  //     them speak to) and never a Traitor-only fact: a bond is public.
  //   neighbours — the living players seated either side of the victim in the
  //     fixed seating plan (`gs.tr.castOrder`). The empty-chair beat is theirs.
  //   pairs — living players with a warm mutual bond, who sit together over the
  //     loss. The "who sits with whom" beat draws the room re-forming around it.
  const order = (gs.tr?.castOrder || []).length ? gs.tr.castOrder : [...living];
  const closest = {};
  for (const victim of victims) {
    let best = null, bestBond = 0;
    for (const n of living) {
      const b = getBond(n, victim);
      if (b > bestBond) { best = n; bestBond = b; }
    }
    closest[victim] = best;   // null when nobody living was warm to them
  }
  const neighbours = {};
  for (const victim of victims) {
    const idx = order.indexOf(victim);
    const near = [];
    if (idx >= 0) {
      for (const step of [-1, 1]) {
        // walk outward past anyone already gone until a living neighbour
        for (let k = 1; k <= order.length; k++) {
          const cand = order[idx + step * k];
          if (cand == null) break;
          if (living.includes(cand)) { near.push(cand); break; }
        }
      }
    }
    neighbours[victim] = [...new Set(near)];
  }
  // Warm living pairs (both alive, neither a victim), strongest first, capped.
  const pairSeen = new Set();
  const pairs = [];
  const livingNonVictim = living.filter(n => !victims.includes(n));
  for (const a of livingNonVictim) {
    for (const b of livingNonVictim) {
      if (a === b) continue;
      const kk = [a, b].sort().join('|');
      if (pairSeen.has(kk)) continue;
      pairSeen.add(kk);
      const bond = getBond(a, b);
      if (bond >= GRIEF_BOND) pairs.push({ a, b, bond });
    }
  }
  pairs.sort((x, y) => y.bond - x.bond);

  return { victims, pushed, grief, composed: [...new Set(composed)], namer,
    closest, neighbours, pairs: pairs.slice(0, 3) };
}

/**
 * ONE `episodeHistory` ROW PER EPISODE, and it exists for js/audience.js.
 *
 * That module is show-agnostic by construction: it knows only that a show has
 * rounds and eliminates people from them, and it reads both off
 * `gs.episodeHistory`. A headless Traitors season built a `gs` holding bonds
 * and activePlayers and nothing else, so `roundsPresent` fell through to "the
 * whole season" for everybody and `audienceStanding` became the accrued total
 * divided by a constant — which is the very quantity §10.4 forbids anyone to
 * rank by, restored under a new name.
 *
 * `exits` is the shape docs/ADDING-A-SHOW.md §5 defines and js/tr/export.js
 * already builds, and it is the field that carries the MURDERED. `eliminated`
 * is the banishment alone, exactly as the export shape has it: a murder is not
 * a vote the room cast, and every existing reader of `eliminated` means the
 * vote. A show with two exit channels needs both fields or it credits half its
 * cast with a full season they did not play.
 */
// ═══════════════════════════════════════════════════════════════════════
// THE CASTLE DAY, IN THE SHAPE A SCREEN DRAWS IT (js/vp-tr/castle-day.js)
// ═══════════════════════════════════════════════════════════════════════
//
// Plan 5 built 106 events across eight families and seven windows and
// nothing ever put one on a screen. What it built was not forty incidents,
// though — it was THREADS: a story opened by one scene, fed by later ones,
// and either paid off or let go. `citeMoments` writes the continuity INTO
// the beat's own sentence ("It went back to day 2 — … — and it did not stop
// there: day 4"), which is the right thing for a prose dump and the wrong
// shape for a screen: a citation buried mid-paragraph is invisible AS a
// citation, and the thread is the thing this screen exists to show.
//
// So the record splits the two halves apart again and hands a screen both,
// along with the days the thread actually has beats on — which is what makes
// "the citation names a real earlier beat" a checkable claim rather than a
// sentence nobody can contradict.

/** The seven windows in the order a day runs them. */
const DAY_WINDOWS = ['dawn', 'morning', 'journey-out', 'journey-back',
  'evening', 'after-table', 'night'];

/**
 * The two sentences a citation can start with, straight out of `citeMoments`.
 * Written here as a pair of literals on purpose: this recorder must fail to
 * split rather than silently mangle if that function's phrasing ever changes,
 * and tests/tr-vp.test.js asserts the split against real season beats.
 */
const CITATION_HEADS = ['It went back to day ', 'It had been going on since day '];

/**
 * A beat's note, as the sentence the event wrote plus the continuity the
 * thread appended. `citation` is '' on a thread's first beat and on any beat
 * with nothing earlier worth naming, which is the common case: 73.9% of
 * threads die where they open.
 *
 * A SPLIT AND NOT A STRIP. Both halves come back and the two of them
 * concatenate to the note. A subtractive helper that ate too much would make
 * every guard downstream of it pass for free -- Plan 8 Task 4's fifth vacuous
 * shape -- so nothing here is allowed to discard a character.
 */
function _splitCitation(note) {
  const text = String(note || '');
  let at = -1;
  for (const head of CITATION_HEADS) {
    const i = text.indexOf(head);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return { line: text.trim(), citation: '' };
  return { line: text.slice(0, at).trim(), citation: text.slice(at).trim() };
}

/** Every day number a citation names, in the order it names them. */
function _daysNamed(citation) {
  const out = [];
  const re = /day (\d+)/g;
  let m;
  while ((m = re.exec(String(citation || ''))) != null) out.push(Number(m[1]));
  return out;
}

/**
 * The day's scenes, each carrying the thread it belongs to.
 *
 * `fired` is the round's `castleEvents`, in the order the windows ran them.
 * A firing with no beat to its name is DROPPED rather than rendered blank:
 * `openThread` folds a repeat announcement into the beat that is already
 * there and writes nothing, so a scene with no sentence is a scene the engine
 * declined to narrate.
 *
 * THE JOIN IS THE ORDER. A fired event reports `threadId` and nothing else
 * about what it wrote; the sentence lives on the thread's beat log. Both
 * lists are appended to in the same order within a round, so the Nth firing
 * naming a thread takes that thread's Nth beat of the round. There is no
 * other key available: `beat.eventId` is the SEED STRING on an open and the
 * empty string on an advance (see `openThread` and `advanceThread`), so it
 * identifies nothing.
 */
function _castleRecord(ep, fired) {
  const threads = gs.tr?.threads || [];
  const byId = new Map(threads.map(t => [t.id, t]));
  const taken = new Map();
  const scenes = [];

  for (const f of (fired || [])) {
    const c = f && f.consequences;
    const t = (c && c.threadId) ? byId.get(c.threadId) : null;
    if (!t) continue;
    const todays = (t.beats || []).filter(b => b.ep === ep && b.note);
    const used = taken.get(t.id) || 0;
    const beat = todays[used];
    if (!beat) continue;
    taken.set(t.id, used + 1);

    const idx = (t.beats || []).indexOf(beat);
    const earlier = (t.beats || []).slice(0, Math.max(0, idx))
      .filter(b => b.ep < ep && b.note);
    const priorDays = [...new Set(earlier.map(b => b.ep))];
    const split = _splitCitation(beat.note);
    // CLOSED TONIGHT, which is not the same as closed. `closeThread` stamps
    // `lastEp`, so a thread paid off three rounds ago is not a payoff on this
    // row and must not be drawn as one.
    //
    // AND NOT THE SAME AS "THIS SCENE CLOSED IT". The three conditions below
    // are a fact about the THREAD, so when a story had two scenes in one
    // episode and ended closed, BOTH of them reported the payoff and the
    // screen drew two knots for one ending — tr-vp.test.js's rule is that a
    // thread is knotted exactly once, on the last scene it has. `used` is
    // this scene's index into that thread's beats tonight and `todays` is all
    // of them, so the last one is the only one entitled to the payoff.
    const isLastTonight = used === todays.length - 1;
    const closedNow = t.state === 'closed' && t.lastEp === ep && !!t.outcome
      && isLastTonight;
    const voices = sceneSpeakers(f.event, c);

    // ── WHAT KIND OF READ THIS IS, when it is a read at all ────────────
    //
    // A Faithful wondering about somebody is asking whether they are a
    // Traitor. A TRAITOR wondering about somebody cannot be asking that: the
    // turret showed them the whole pact, so they know by elimination that
    // everybody outside it is innocent. What a Traitor watches a Faithful for
    // is whether that Faithful is getting close to THEM — a threat read, not
    // a guilt read, and the two want opposite words on the card.
    //
    // `null` on every scene that is not a suspicion read, so the screen's
    // existing behaviour is unchanged wherever this does not apply. See the
    // note on `_view` in js/vp-tr/castle-day.js for why this is stripped for
    // every observer but the audience and the doubter.
    const _doubter = voices?.speaker ?? (f.actors || [])[0] ?? null;
    const _subject = (c && c.topic) || voices?.respondent || null;
    let readKind = null;
    if ((f.event.family || t.kind) === 'suspicion' && _doubter && _subject
      && _doubter !== _subject) {
      const dIsTraitor = alignmentAt(_doubter, ep) === 'traitor';
      const sIsTraitor = alignmentAt(_subject, ep) === 'traitor';
      // A Traitor reading a FELLOW is not a read at all — they were introduced
      // in the turret. `pact` tells the screen to draw nothing rather than to
      // draw the wrong thing.
      readKind = !dIsTraitor ? 'guilt' : (sIsTraitor ? 'pact' : 'threat');
    }

    scenes.push({
      readKind,
      readDoubter: readKind ? _doubter : null,
      window: f.event.window,
      family: f.event.family || t.kind,
      eventId: f.event.id,
      branch: (c && c.branch) || null,
      // WHO WAS CONVENED and WHO THE SENTENCE IS ABOUT, both, because they
      // disagree for thirteen events in the pool and the observer contract
      // has to honour either claim to having been in the room.
      actors: [...(f.actors || [])],
      people: sceneParticipants(c),
      // WHO DROVE IT AND WHO ANSWERED, when the event says so. Null when it
      // does not, and the screen then falls back to reading the sentence —
      // see `sceneSpeakers` (js/tr/events.js) for why that fallback exists and
      // what it gets wrong.
      speaker: voices?.speaker ?? null,
      respondent: voices?.respondent ?? null,
      parties: [...(t.parties || [])],
      threadId: t.id,
      kind: t.kind,
      openedEp: t.openedEp,
      // Where this beat sits in the whole story, and what came before it.
      beatNo: idx + 1,
      opened: idx === 0,
      priorDays,
      line: split.line,
      citation: split.citation,
      citedDays: _daysNamed(split.citation),
      closedNow,
      outcome: closedNow ? t.outcome : null,
      sense: closedNow ? outcomeSense(t.outcome) : null,
      // THE CONCRETE SUBJECT THIS SCENE IS ABOUT, sourced from real sim data by
      // the event's fire() (the suspect named, the mission fact, the promise).
      // Reworked (topic-grounded) events set it; legacy events leave it null and
      // the composer falls back to its old generic wrapping. `topicKind` tells
      // the composer which grounded pool to draw its reaction/consequence from.
      topic: (c && typeof c.topic === 'string' && c.topic) ? c.topic : null,
      topicKind: (c && typeof c.topicKind === 'string' && c.topicKind) ? c.topicKind : null,
      // A coarse consequence-pool key the event chose directly, for scenes whose
      // register is decided by something the composer cannot re-derive from the
      // branch alone (grief-vigil: a came-down-angry morning is 'haunted' only
      // when a ballot is behind it, which the event knows and the branch does not).
      topicDir: (c && typeof c.topicDir === 'string' && c.topicDir) ? c.topicDir : null,
      // The absent third party a suspicion scene is ABOUT, when the event named
      // one (whisper/timeline/out-of-earshot). Lets the read chip point at the
      // person suspected rather than the confidant.
      about: (c && typeof c.about === 'string' && c.about) ? c.about : null,
    });
  }

  // The windows that actually produced something, in the order a day runs
  // them. A window with nothing in it is NOT listed: a quiet hour is honest,
  // and the screen leaves it blank rather than inventing a scene to fill it
  // (Task 1's sparse irony gutter, for the same reason).
  const fired7 = new Set(scenes.map(x => x.window));
  const windows = DAY_WINDOWS.filter(w => fired7.has(w));
  // Anything the pool ever grows that is not one of the seven would otherwise
  // vanish silently. `KNOWN_WINDOWS` is registerEvent's own list.
  for (const x of scenes) {
    if (!KNOWN_WINDOWS.has(x.window) && !windows.includes(x.window)) windows.push(x.window);
  }

  // TASK 5: the same scenes, regrouped into the six chronological Castle Day
  // phases (js/tr/castle/phases.js). Unlike `windows` above, every phase
  // appears even when it produced nothing — see `castlePhaseRecord`'s doc
  // comment for why a screen walking six phases in order needs the shape to
  // be there on the one night two of them (private-strategy,
  // roundtable-scramble) are empty.
  // ── TASK 7A: THE CUT, TAKEN BEFORE THE ROW IS WRITTEN ────────────────
  //
  // `scenes` above is the day in the order the seven windows happened to draw
  // it. That is a day and not an episode: nothing says which two or three
  // stories tonight is about, nothing stops four accusations landing in a row,
  // and — the defect that matters most — a scene that opened a story had
  // nowhere to record that it had promised one.
  //
  // The editor returns a PERMUTATION of exactly these scenes (it drops
  // nothing; see its header for why that is a ruling rather than a choice)
  // with the tone stamped on each, plus the story hierarchy, the tone ledger
  // and every promise answered. `phases` is rebuilt from the edited order, so
  // the six-phase record the Castle Day screen walks and the edit record agree
  // about what happened when.
  //
  // HERE AND NOT IN THE RUNNER, because this is the last point at which the
  // whole day exists in one place and nothing downstream has read it yet. It
  // takes no rng draw, so a season played with the editor is bit-identical in
  // its murders, ballots and missions to one played without.
  const edit = buildEpisodeEdit(scenes, { ep, living: [...(gs.activePlayers || [])] });
  const phases = castlePhaseRecord(edit.scenes);

  // THE LENGTH THIS EPISODE WAS PLAYED AT, on the record and not read live.
  //
  // The debug screen prints it, and a screen that read `seasonConfig` instead
  // would label every past episode with whatever the author has the control set
  // to NOW -- the "live state on a replayed episode" class this file already
  // snapshots bonds and alliances to avoid. The scaled budgets go with it so a
  // reader can check the scene counts below against what was actually
  // budgeted, rather than against the ranges printed in phases.js.
  const _dFactor = densityFactor(seasonConfig?.trDensity || TR_DENSITY_DEFAULT);
  const density = {
    id: seasonConfig?.trDensity || TR_DENSITY_DEFAULT,
    factor: _dFactor,
    budgets: CASTLE_PHASE_BUDGETS.map(b => {
      const [min, max] = scaledRange(b.min, b.max, _dFactor);
      return { id: b.id, label: b.label, min, max };
    }),
  };
  return { ep, windows, scenes: edit.scenes, phases, edit, density };
}

/**
 * THE DEDUCTION MODEL, AS IT STANDS TONIGHT (js/vp-tr/suspicion.js).
 *
 * The shape lives in `traitorsBeliefSnapshot` (js/tr/export.js) with the rest
 * of what leaves this engine; what belongs HERE is the three lists it is taken
 * over, and all three are facts about this night rather than about the season:
 * who is still in the castle, which of them are Faithfuls -- the only people
 * whose collective read is a QUESTION, since the others already know -- and
 * every alignment flip that has happened by now, which is what lets a screen
 * say a read was correct when it was made.
 *
 * `via: 'selection'` IS NOT A FLIP. Every player in the cast gets a selection
 * entry in `roleHistory` on night one, Faithfuls included, so listing those
 * would report a twenty-way recruitment on the first evening. Recruitment and
 * the ultimatum are the two ways ground truth actually changes hands --
 * `traitorsCareerStats` filters the same pair for the same reason.
 */
function _beliefRecord(ep) {
  const living = [...(gs.activePlayers || [])];
  return traitorsBeliefSnapshot(ep, {
    living,
    faithfuls: living.filter(n => alignmentAt(n, ep) === 'faithful'),
    flips: (gs.tr?.roleHistory || []).filter(f =>
      f.to === 'traitor' && (f.via === 'recruitment' || f.via === 'ultimatum')
      && f.ep <= ep),
  });
}

// ══════════════════════════════════════════════════════════════════════
// THE PREMIERE — the drive, the introductions, and the rules said aloud
// ══════════════════════════════════════════════════════════════════════
//
// Episode one is the only night of a season that has to introduce anybody,
// and until this record existed it did not: the first screen a viewer saw was
// twenty blindfolded strangers being divided. The format's product is watching
// a room fail to work something out, and a room the viewer has never met is
// not a room — it is a list of names with a hand landing on three of them.
//
// TWO CEREMONIES LIVE HERE AND THEY ARE DIFFERENT OBJECTS. The arrival is
// people; the briefing is rules. They are stored separately because they are
// withheld separately later on — a returning viewer needs the rules again and
// does not need the introductions, which is exactly what `reminder` is for.
//
// ── EVERYTHING HERE IS WRITTEN OUT, AND THAT IS THE WHOLE POINT ───────
//
// "The host explains how the game works" is a production note, not a
// premiere. A screen handed that sentence can only print that sentence, and a
// transcript retranscribing the screen prints it twice. So the record carries
// the SENTENCES: complete spoken lines, the staging around them, the reaction
// each line earned, and one reveal step per action. Nothing downstream has to
// invent a single word, and nothing downstream is able to.
//
// ── AND NOT ONE FACT IS INVENTED ──────────────────────────────────────
//
// Every claim an introduction makes comes off `gs.tr.backgrounds`, which is
// the frozen per-season snapshot Task 1 wrote — never re-resolved from the
// live database, because a replay that re-resolves rewrites its own premiere
// the next time somebody corrects a placement. An alumni billing quotes the
// season labels the ledger recorded, composed by `alumniAppearances` out of
// `SHOWS[format].name`; a Celebrity or a Civilian is given no season, no
// finish and no franchise past whatsoever, because they have none.
//
// ── THE HOST IS NEVER NAMED ON THIS RECORD ────────────────────────────
//
// `host` is the CONFIGURED key and nothing else, and no beat on either
// ceremony says a host's name out loud. The screen resolves the label out of
// the registry at draw time, exactly as `js/vp-tr/selection.js` already does,
// so swapping the host in the setup screen swaps every line the host speaks
// (docs/ADDING-A-SHOW.md §14.10 is the bug class). A name written into a beat
// here would be a name no configuration change could reach.
//
// ── AND IT COSTS THE SEASON NOTHING ───────────────────────────────────
//
// Not one draw from any of the three rng streams. Variation comes off an FNV
// hash of the season's own cast, exactly as `gs.tr.backgrounds` does, so a
// season played with a premiere is bit-identical to one played without and
// every calibration band this engine has is undisturbed.

/** FNV-1a. The premiere's only source of variation, and it takes no draw. */
function _pHash(s) {
  let h = 2166136261;
  const t = String(s);
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/**
 * The same pool, without saying the same thing twice on one drive.
 *
 * AND WHEN IT RUNS OUT IT STARTS AGAIN RATHER THAN REPEATING ONE LINE. Twenty
 * arrivals across four stances puts eight people through one pool of seven,
 * and the first version returned `pool[start]` on exhaustion -- which printed
 * the identical sentence for two arrivals standing next to each other. Found
 * by dumping the premiere and reading it. Clearing the pool's own marks lets
 * the hash choose freshly on the second lap instead.
 */
function _pPickUnique(pool, key, used) {
  if (!pool || !pool.length) return '';
  if (pool.every(l => used.has(l))) for (const l of pool) used.delete(l);
  const start = _pHash(key) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const line = pool[(start + i) % pool.length];
    if (!used.has(line)) { used.add(line); return line; }
  }
  return pool[start];
}
function _pFill(tpl, subs) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) =>
    (subs && subs[k] != null) ? subs[k] : m);
}
const _CARS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh',
  'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
const _carWord = i => _CARS[i] || `${i + 1}th`;

/**
 * HOW SOMEBODY GETS OUT OF A CAR, by the behaviour their archetype is allowed.
 *
 * FOUR STANCES AND NOT FIFTEEN, and the grouping is AGENTS.md's own: villain
 * archetypes may be sharp, nice archetypes may not scheme or needle, and the
 * neutrals sit between. A second fifteen-row archetype table would be a second
 * copy of the one in `js/tr/state.js` — which is the shape this repo has been
 * bitten by six times — so this asks a coarser question that already has a
 * written answer, and the FINE-GRAINED voice stays where it lives: the `now`
 * clause on the background, quoted verbatim by every introduction below.
 */
function _stance(archetype) {
  const a = String(archetype || '');
  if (['villain', 'mastermind', 'schemer'].includes(a)) return 'sharp';
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']
    .includes(a)) return 'warm';
  if (['hothead', 'chaos-agent', 'wildcard'].includes(a)) return 'loud';
  return 'measured';
}

// NOT ONE OF THESE OPENS ON "THE {car} CAR", and that is a correction rather
// than a preference: the card is HEADED with the car, so a sentence that opens
// on it renders as "The first car The first car unloads onto the flags". Found
// by dumping the premiere and reading it.
const _ARRIVE_GROUP = [
  'It comes up the drive slowly, because the drive is gravel and nobody in it wants to be '
  + 'the one who arrives badly.',
  'Doors, and then the noise of {n} people deciding at exactly the same moment to be '
  + 'delighted.',
  'It stops short of the steps. Whoever is driving does not get out, and neither does '
  + 'anybody else for a second and a half.',
  'Bags onto the flags first, then the {n} of them, then a long pause while everybody '
  + 'looks up at how much building there is.',
  'Nobody in it says anything on the last hundred yards, and all {n} of them are talking '
  + 'before the doors are shut.',
  'Gravel, brake lights, and {n} people getting out into a silence none of them expected '
  + 'to be this loud.',
  'It arrives with the windows down and every one of the {n} of them looking straight up.',
];
const _ARRIVE_ONE = {
  sharp: [
    '{name} is out first and shakes every hand on the flags before the bags are down.',
    '{name} takes the steps at a walk, counts the doors, and only then says hello to anybody.',
    '{name} arrives asking questions that sound like small talk and are not.',
    '{name} gets out, looks hard at who is already standing there, and files it.',
    '{name} lets everybody else go up first and watches the order they choose to go in.',
    '{name} is warm with the driver, warm with the door, and has not once stopped working '
    + 'out who is worth knowing.',
    '{name} says almost nothing on the flags and has still managed to be at the front of '
    + 'the group by the time the doors open.',
  ],
  warm: [
    '{name} is hugging somebody before the boot is open.',
    '{name} gets out apologising for nothing at all and is instantly popular for it.',
    '{name} learns four names on the flags and uses every one of them twice.',
    "{name} carries somebody else's case up the steps without being asked.",
    '{name} finds the one person standing on their own and goes over.',
    '{name} is laughing at the size of the building within about four seconds and takes '
    + 'three other people with {obj}.',
    '{name} shakes hands with everybody in reach and means every one of them.',
  ],
  loud: [
    '{name} is out of the car before it has properly stopped, talking already.',
    '{name} announces the castle to the castle, loudly, and gets a laugh out of half the flags.',
    '{name} arrives at volume and does not come down from it.',
    '{name} drops a bag, swears, laughs about it, and has told three people the story by the steps.',
    '{name} has an opinion about the drive, the gravel and the weather before reaching the steps.',
    '{name} shouts a hello up at the windows, which do not answer, which {name} finds funny.',
    '{name} arrives mid-sentence and nobody is entirely sure who the first half was for.',
  ],
  measured: [
    '{name} gets out last, unhurried, and stands slightly apart from the rest of the car.',
    '{name} says very little on the flags and watches everybody who does.',
    '{name} shakes hands neatly, gives a name and an occupation, and stops there.',
    '{name} is polite, brief and entirely unreadable, which nobody notices yet.',
    '{name} puts a case down, looks at the building properly, and only then turns round '
    + 'to the people.',
    '{name} answers everything asked and volunteers nothing at all.',
    '{name} counts the group on the flags without appearing to.',
  ],
};
const _MEET_NEUTRAL = [
  '{a} and {b} introduce themselves twice inside a minute, which is what happens on a drive '
  + 'where nobody has anything to go on yet.',
  '{a} asks {b} how the journey was. It is not a question about travel and both of them know it.',
  '{b} laughs at something {a} says. Neither of them will remember what it was by the evening.',
  '{a} and {b} end up carrying the same case up the steps and decide they get on.',
];
const _MEET_RECOGNISED = [
  '{a} places {b} on the flags and says so out loud, which puts a number on {b} before '
  + 'anybody has spoken to {b} properly.',
  '{a} recognises {b} straight away. {b} takes it well and has just become the most '
  + 'carefully watched person on the drive.',
  '&ldquo;I know exactly who you are,&rdquo; {a} tells {b}, and the two people nearest them '
  + 'both turn round.',
  '{a} does not pretend not to know {b}, which is the more generous of the two options '
  + 'and the more expensive one for {b}.',
];
const _MEET_SHARED = [
  '&ldquo;{season},&rdquo; {a} says to {b}, and does not need to say anything else. They '
  + 'played that one together.',
  '{a} and {b} have done this before &mdash; {season} &mdash; and the handshake takes '
  + 'slightly too long.',
  '{b} sees {a} on the flags and stops. {season}. Neither of them needs to explain it '
  + 'to the people watching.',
  '{a} gets to {b} last, deliberately. &ldquo;{season}.&rdquo; {b} says, &ldquo;I remember.&rdquo;',
];

// ── THE MONTAGE ───────────────────────────────────────────────────────
//
// An arrival card used to be two or three lines: what somebody physically did
// getting out of a car, the billing the ledger holds on them, and whatever the
// person nearest had reason to say. That is a door, not an introduction — the
// premiere of a show whose whole engine is nine stats and fifteen archetypes
// said nothing whatsoever about who any of these people are.
//
// Three more lines per person, and every one of them reads a fact the season
// already holds rather than inventing a characterisation:
//
//   profile      what their STATS are built for, in words. Never a number: a
//                premiere does not say "7 endurance", it says what a 7 does.
//   personality  how their ARCHETYPE plays, specifically. The `_stance` note
//                below is right that a second fifteen-row archetype TABLE is
//                the duplication this repo keeps getting bitten by — so this
//                is keyed by the archetype id and guarded by a test that fails
//                the moment core.js holds one this file does not.
//   threat       what the room will make of them before anybody has spoken.
//                For alumni that is their RECORD, off the ledger. For everyone
//                else it is the assumption their billing invites.

/**
 * WHAT A STAT LINE IS FOR, as a category rather than a number.
 *
 * Pairs rather than single stats, because one high stat is a spike and two is
 * a build — and because the interesting sentence is what somebody can DO, not
 * which column is tallest. Proportional throughout: no threshold decides
 * anything except which sentence gets printed, which is the one thing
 * AGENTS.md allows a threshold to decide.
 */
const _STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

/**
 * THE NORM A PLAYER IS MEASURED AGAINST, and it is not the roster's.
 *
 * Comparing raw pair totals asks "is this number big", which the stats answer
 * the same way for everybody: loyalty and temperament run high across the
 * roster, so `loyalty + temperament` was the top pair for a third of the cast
 * and the same sentence printed on a third of the cards. Measured against the
 * mean of core.js's fifteen archetype stat lines instead, the question becomes
 * "is this person UNUSUAL here", which is the only question a premiere is
 * actually asking. Derived rather than written down, so it cannot drift from
 * the archetypes it describes.
 */
const _STAT_NORM = (() => {
  const norm = {};
  const rows = Object.values(ARCHETYPES || {});
  for (const k of _STAT_KEYS) {
    const vals = rows.map(a => a && a[k]).filter(v => typeof v === 'number');
    norm[k] = vals.length ? vals.reduce((t, v) => t + v, 0) / vals.length : 5;
  }
  return norm;
})();

const _d = (s, k) => (Number(s && s[k]) || 0) - _STAT_NORM[k];
const _BUILDS = [
  { id: 'outlast', of: s => _d(s, 'physical') + _d(s, 'endurance') },
  { id: 'room', of: s => _d(s, 'social') + _d(s, 'strategic') },
  { id: 'reader', of: s => _d(s, 'intuition') + _d(s, 'mental') },
  // Boldness alone, doubled to sit on the same scale as the pairs. Paired with
  // physical it almost never led — boldness is the highest archetype norm
  // there is, so the pair started in a hole and the nerve pool fired twice in
  // a hundred and twenty players. A spike is a build too.
  { id: 'nerve', of: s => 2 * _d(s, 'boldness') },
  { id: 'steady', of: s => _d(s, 'loyalty') + _d(s, 'temperament') },
];

/**
 * The build this stat line most looks like, or 'balanced' when nothing leads.
 *
 * A flat sheet is a real answer and not a missing one — somebody with no spike
 * is a specific kind of player, and printing a strength the numbers do not
 * support would be the montage lying about them. Half a point of daylight is
 * the margin, which puts about one player in eight here.
 */
function _buildOf(stats) {
  const s = stats || {};
  const scored = _BUILDS.map(b => ({ id: b.id, score: b.of(s) || 0 }))
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return 'balanced';
  // Nothing above the norm anywhere is genuinely unremarkable, and says so.
  if (scored[0].score <= 0) return 'balanced';
  if (scored.length > 1 && scored[0].score - scored[1].score < 0.5) return 'balanced';
  return scored[0].id;
}

const _PROFILE = {
  outlast: [
    '{name} is built for the long afternoons — the kind of player still standing when the '
    + 'clever ones have sat down.',
    'Whatever the castle asks {obj} to carry, {name} will still be carrying it after '
    + 'everybody else has put it down.',
    'There is no version of a mission where {name} is the one who gives out first, and '
    + 'the room will work that out in about a week.',
    '{name} does not look quick. {sub} looks like somebody who finishes things, which is '
    + 'worth more here.',
    '{name} will still be hauling when the rest of the team has started watching, and the '
    + 'missions here run long enough for that to decide things.',
    'Put {name} in a river crossing or a crate relay and {sub} will be the last one breathing hard. '
    + 'That counts double in a season this physical.',
    '{name} has the build of somebody who has never once been the reason a team stopped.',
    'If it comes down to who is still going at the end of a very long day, it comes down '
    + 'to {name}.',
  ],
  room: [
    '{name} plays the room before the game starts, and has already started.',
    'Names, faces, who is standing with whom — {name} has the whole drive filed before the '
    + 'doors open.',
    "{name} makes sure everybody likes {obj} enough, and nobody likes {obj} too much.",
    'Talking is the game as far as {name} is concerned, and {sub} is extremely good at talking.',
    '{name} will know something about every person here by tonight, and none of them will '
    + 'remember being asked.',
    'By lunchtime {name} will have heard three secrets and offered two, and the exchange rate '
    + 'will always favour {obj}.',
    '{name} remembers every favour done and every debt owed, and by Thursday the kitchen '
    + 'runs through {obj}.',
    'Give {name} an evening and a kitchen and {sub} will come out of it with an alliance '
    + 'nobody agreed to.',
  ],
  reader: [
    '{name} catches the glance across the table that the rest of the room missed, and files '
    + 'it before dessert.',
    'Reads people better than most of the room knows, and has the sense not to say so.',
    '{name} watches hands, not faces, and the difference will matter at a table.',
    'There is a version of this season where {name} works it out early and cannot get '
    + 'anybody to listen.',
    '{name} is the kind who remembers the sentence somebody said four days ago and the '
    + 'exact pause before it.',
    'Nothing gets past {name} twice, and the room has not yet noticed that {sub} is counting.',
    '{name} has the unnerving habit of being right without being able to say why.',
    'When somebody changes their story at the table, {name} will be the first to notice and '
    + 'the last to say so.',
  ],
  nerve: [
    '{name} goes first. Whatever it is, {name} goes first.',
    'Nerve is the thing {name} has more of than sense, and it works more often than it should.',
    '{name} will say the dangerous thing at the table while everybody else is still deciding '
    + 'whether to think it.',
    'There is no hesitation in {name} at all, which is either the best or the worst thing '
    + 'about {obj}.',
    '{name} is physically fearless and socially about the same, and the castle rewards '
    + 'exactly one of those.',
    'Ask {name} to do the frightening half of a mission and {sub} will be gone before the '
    + 'sentence finishes.',
    '{name} plays like somebody who has never seriously considered losing.',
    'Bold to the point of carelessness, and carelessness is survivable here for about a fortnight.',
  ],
  steady: [
    '{name} is the steady one, and a castle full of liars is exactly where that gets noticed.',
    'Loyal, level, and hard to move &mdash; which makes {obj} either the safest person here '
    + 'or the most useful.',
    '{name} does not rattle. Whatever the table does tonight, {name} will be the same '
    + 'tomorrow morning.',
    'There is nothing volatile in {name} at all, and in this castle that reads as either '
    + 'trustworthy or dull, and both are dangerous.',
    '{name} keeps {posAdj} word, and a game built on breaking it will find that remarkable.',
    'The table will shout and {name} will sit still, and the room will not know what to do '
    + 'with somebody it cannot rattle.',
    '{name} is the one everybody ends up telling things to, which is a role rather than a choice.',
    'Steady hands, long memory, no theatre. {name} will be here a while.',
  ],
  balanced: [
    'Nothing about {name} spikes, which means nothing about {name} announces itself either.',
    '{name} is good at most of it and best at none of it, and that is a harder read than it sounds.',
    'There is no obvious way to use {name} and no obvious way to fear {obj}, which is its '
    + 'own kind of protection.',
    '{name} will not win the castle on any one thing. That is not the same as not winning it.',
    '{name} can hold a conversation, carry a crate, and read a room &mdash; none of it '
    + 'brilliantly, all of it well enough to stay.',
    '{name} has no weakness worth naming and no weapon worth naming, and the room will '
    + 'underestimate the first half.',
    'Whatever this season asks for, {name} can do a version of it.',
    '{name} is the player nobody writes down on the first night, for reasons that will '
    + 'stop being reasons by the fourth.',
  ],
};

/**
 * HOW AN ARCHETYPE PLAYS, said once and specifically.
 *
 * Keyed by the archetype id from core.js. `_stance` above is deliberately
 * coarse because a second fifteen-row archetype TABLE — one that re-states the
 * stat lines or the behaviour rules — is the duplication docs/ADDING-A-SHOW.md
 * catalogues. This is not that: it holds no stats and no rules, only voice, and
 * tests/tr-arrival-montage.test.js fails if core.js ever holds an archetype
 * this object does not, so it cannot silently go stale.
 */
const _PERSONALITY = {
  mastermind: [
    '{name} is already three votes ahead and will not tell anybody which three.',
    '{name} will sit with someone at breakfast, agree with them completely, and by dinner '
    + 'that person will be voting exactly where {name} needs them.',
    '{name} does not want to be seen doing anything, which is the only real skill in the building.',
    'Somebody in this castle will be banished by a plan {name} never once said out loud.',
    '{name} will let somebody else say the name. That is the entire method.',
    'Control without fingerprints &mdash; {name} has done this before, to people who liked {obj}.',
    'Three people will leave this castle on a plan {name} set in motion, and two of them '
    + 'will think it was their own idea.',
    '{name} will have three people voting together by Thursday, and none of them will remember whose idea it was.',
  ],
  schemer: [
    '{name} will burn something down this week and be sympathetic about it at breakfast.',
    'Loyalty is a resource to {name}, and resources get spent.',
    '{name} is looking for the crack already, and there is always a crack.',
    'Whoever {name} is warmest to tonight should count the exits.',
    '{name} does not build alliances so much as leases them.',
    'There is no bridge {name} will not cross and then set alight from the far side.',
    '{name} plays fast and dirty and is usually gone by the jury, which {sub} considers a fair trade.',
    "The first betrayal of the season has a good chance of having {name}'s hand on it.",
  ],
  hothead: [
    '{name} will say it at the table. Whatever it is, {name} will say it at the table.',
    'There is no gap between what {name} thinks and what the room hears.',
    '{name} makes enemies without meaning to and keeps making them anyway.',
    'Somebody will get accused loudly this week, and {name} will be the one doing the accusing.',
    '{name} does not manage {posAdj} temper so much as travel with it.',
    'Honest to a fault and loud about it &mdash; {name} is impossible to read and impossible to hide behind.',
    '{name} will be right at some point and nobody will hear it over the volume.',
    'Every Round Table {name} sits at gets more interesting and less survivable.',
  ],
  'challenge-beast': [
    '{name} intends to win the missions and let the rest of it follow.',
    'The physical half belongs to {name}, and {sub} will make sure the room knows it.',
    '{name} is here to be useful, which in a castle full of liars is a strange kind of shield.',
    'Nobody wants to banish the person carrying the mission, and {name} is counting on exactly that.',
    '{name} will earn more for the pot than anybody and be nowhere near the plan.',
    'The competitive half is easy for {name}. The other half is the whole problem.',
    '{name} wins things. Whether {sub} can win THIS is the question of the season.',
    'Give {name} a task and a deadline and the castle gets its money. Give {obj} a table and it is a different night.',
  ],
  'social-butterfly': [
    '{name} will have spoken to every person in this castle before the first night is out.',
    'There is no room {name} cannot walk into, and no conversation {sub} cannot join.',
    '{name} collects people, and by the end of the week half the castle will think they are close.',
    'The whole game is who likes you, as far as {name} is concerned, and {sub} is not entirely wrong.',
    "{name} is everybody's friend, which is lovely and is also a lot of people to lie to.",
    'Warmth is {posAdj} whole strategy and it is more effective than the clever ones want to admit.',
    '{name} will know something about everyone here by tomorrow and mean none of it unkindly.',
    'Nobody dislikes {name}. That is either a shield or a target and it takes a fortnight to find out which.',
  ],
  'loyal-soldier': [
    '{name} picks a side early and stays on it, right through to the end of everything.',
    'Whoever {name} trusts tonight is who {sub} will still be defending three banishments from now.',
    '{name} does not scheme. {sub} does not need to, and would not enjoy it.',
    "There is a version of this where {name}'s loyalty is the best thing here and a version where it is fatal.",
    '{name} will be lied to by somebody {sub} would have gone to the end with.',
    'Straight down the line, every night, no matter what the line costs.',
    '{name} keeps the promise. That is the whole of it, and here it is nearly a liability.',
    "Somebody is going to use {name}'s loyalty against {obj} and it is going to be horrible to watch.",
  ],
  wildcard: [
    'Nobody, including {name}, knows what {name} is going to do on any given night.',
    '{name} will vote against the room for a reason nobody can reconstruct afterwards.',
    'There is no pattern to {name} and therefore nothing to plan around.',
    '{name} will back somebody to the hilt on Monday and vote them out on Wednesday without '
    + 'losing a minute of sleep.',
    'Half the castle will spend the season trying to work out whose side {name} is on.',
    'Unpredictable in a way that is genuinely dangerous rather than merely annoying.',
    '{name} is a coin flip with opinions, and coin flips ruin plans.',
    'Whatever the sensible move is this week, {name} has already thought of a stranger one.',
  ],
  'chaos-agent': [
    '{name} would rather the season were interesting than survivable.',
    '{name} will accuse somebody at the table just to watch the room split, and call it a good evening.',
    '{name} will blow something up purely to see which way the pieces land.',
    'There is no long game here. There is tonight, and tonight should be memorable.',
    '{name} enjoys this far too much to play it carefully.',
    'Somebody will do something inexplicable at a Round Table this season and it will be {name}.',
    '{name} treats a quiet, orderly castle as a personal insult.',
    'The castle is about to become considerably less orderly and {name} is the reason.',
  ],
  floater: [
    "{name} intends to be nobody's problem for as long as that works.",
    'No side, no enemies, no reason to be written down &mdash; {name} has done this before.',
    '{name} will drift toward whoever is winning and be genuinely pleasant about it.',
    '{name} will agree with whoever is talking, leave no trace on the vote, and wake up safe.',
    '{name} survives by being unremarkable and knows exactly how unremarkable to be.',
    "Nobody will suggest {name}'s name for a fortnight, which is the entire objective.",
    '{name} is here at the end of most seasons and remembered in none of them.',
    'Ask {name} who {sub} is with and you will get a very warm answer that contains nothing.',
  ],
  underdog: [
    'Nobody is going to take {name} seriously, and {name} is counting on that.',
    '{name} arrives underestimated and has no intention of correcting anybody.',
    'There is a version of this season where {name} is the last one standing and nobody saw it.',
    '{name} has been written off before and has notes on what it costs the people who do it.',
    "Nobody here sees {name} coming, and {name} is not going to correct them.",
    '{name} will be here longer than the room expects and will enjoy every day of it.',
    'The castle will look straight past {name} for a month. That is a month of free moves.',
    '{name} plays like somebody with nothing to defend, which is harder to beat than it sounds.',
  ],
  hero: [
    '{name} will do the right thing at the table even when the right thing is expensive.',
    'There is no version of {name} that betrays somebody quietly, and everybody will know it.',
    '{name} plays straight, says so, and dares the room to make that a weakness.',
    'Whoever {name} defends is going to be defended properly, whatever it costs {obj}.',
    '{name} is the one who says the unpopular true thing to protect somebody else.',
    'Decency is {posAdj} entire game, and a castle of liars finds that either noble or delicious.',
    '{name} will not lie well, because {name} has never really practised.',
    'Somebody here needs an ally with a spine. {name} is going to be it.',
  ],
  villain: [
    '{name} is not going to pretend to be nice about this, which is oddly refreshing.',
    'The knife is not hidden. {name} would rather you saw it.',
    "{name} plays to win and considers everything else somebody else's problem.",
    'There is a cruelty to how {name} plays that the room will mistake for confidence for about a week.',
    '{name} will do the thing nobody else is willing to do, and sleep fine.',
    'Warmth is a tool as far as {name} is concerned, and {sub} uses tools.',
    '{name} arrives fully intending to be the reason somebody goes home crying.',
    'Nobody is going to like {name} by the finale. {name} has already priced that in.',
  ],
  goat: [
    '{name} is here to be underestimated and is doing an excellent job of it already.',
    'Nobody will feel threatened by {name}, which is exactly how somebody reaches a final.',
    '{name} is the person everybody wants to sit beside at the end, and knows it.',
    'There is no threat here, says the room, and the room says that every single season.',
    '{name} will be carried a long way by people who think they are doing the carrying.',
    'Harmless is a costume, and {name} wears it very comfortably.',
    'Everybody wants {name} in the final two. Somebody is going to get what they asked for.',
    "{name} plays the whole season as somebody else's idea of a safe bet.",
  ],
  'perceptive-player': [
    '{name} is watching the room rather than joining it, and has been since the car.',
    'Very little gets past {name}, and {sub} is careful about how much of that shows.',
    '{name} will spot the lie before the liar is finished telling it.',
    "There is a notebook in {name}'s head and everybody on the flags is already in it.",
    '{name} plays quietly and reads loudly, which is the correct way round.',
    'Somebody is going to be caught this season by {name} noticing a detail nobody else kept.',
    '{name} asks a small question tonight that will matter enormously in three weeks.',
    'The best reader in the room is usually the least talkative one. {name} is both.',
  ],
  showmancer: [
    '{name} will find somebody, and it will change how {sub} plays every night after.',
    'The game and the personal life are the same thing to {name}, which is a lot of exposure.',
    '{name} plays with {posAdj} heart in it, which makes {obj} both very dangerous and very readable.',
    'Somebody in this castle is going to matter to {name} more than the money does.',
    '{name} builds one bond that runs deeper than the rest and defends it past all sense.',
    'There will be a pair this season, and {name} intends to be half of it.',
    'Affection is how {name} plays, and affection is the easiest thing in here to weaponise.',
    '{name} will trust one person completely, which in this castle is a decision with a cost.',
  ],
};

/**
 * WHAT THE ROOM WILL MAKE OF SOMEBODY BEFORE THEY SPEAK.
 *
 * For alumni that is their RECORD, off the same ledger the billing is quoted
 * from — a champion arrives carrying a different problem to somebody who went
 * out fourth. For everybody else it is what their billing invites the room to
 * assume, which is not a fact about them and is very much a fact about the
 * room. Nothing here invents a history: the tier is chosen from placements the
 * snapshot already holds.
 */
const _THREAT = {
  champion: [
    '{name} has won one of these before, and there is no version of this season where '
    + 'anybody forgets that.',
    'A winner on the flags. Every person here is now doing sums about {obj}.',
    '{name} arrives with a title, which is the most expensive thing anybody can bring '
    + 'through that arch.',
    'The room knows {name} has done this. That buys respect for a week, and then it buys '
    + 'a name on a slate.',
    'Somebody who has already won cannot arrive quietly, and {name} has not.',
    '{name} will spend this season being watched by people who have seen how it ends.',
    'There is a champion standing on these flags and every single person here has clocked it.',
    'Winning once buys {name} respect. It also buys {obj} a name on a slate.',
  ],
  finalist: [
    '{name} has gone deep before and did not quite finish it, and that is the sort of thing a person comes back for.',
    'The room can see {name} has been near the end of one of these. That is enough.',
    '{name} arrives with a record that says dangerous without saying champion.',
    'Somebody who got that close does not come back to make friends.',
    '{name} knows exactly what the last week of one of these feels like, and most people here do not.',
    'A finalist is a threat who nearly got there, and the room can see it.',
    '{name} has done the hard part before. The room will not enjoy remembering that.',
    'Close enough to taste it once. That does something to how a person plays the second time.',
  ],
  veteran: [
    '{name} has been through one of these before, and it shows in how little the castle impresses {obj}.',
    'Not a champion, not a stranger &mdash; {name} is the dangerous middle the room forgets to count.',
    '{name} knows the shape of a season, which is worth more than any single result.',
    'The record on {name} is unremarkable. The experience behind it is not.',
    '{name} has sat at one of these tables before and has notes.',
    'Somebody here has done this and is not being loud about it. That is {name}.',
    '{name} arrives with a past the room can look up and mostly will not bother to.',
    'Experience without a trophy is the quietest advantage in the building, and {name} has it.',
  ],
  earlyExit: [
    '{name} went out early last time and has spent a while thinking about why.',
    'The record says {name} is not a threat. The record is a season old and {name} is not.',
    'Nobody is frightened of {name} on this evidence, which is precisely the useful part.',
    '{name} has something to correct, and people with something to correct play harder.',
    'An early exit reads as harmless. It reads that way right up until it does not.',
    '{name} arrives with a result nobody respects and a memory of exactly how it happened.',
    "The room will look at {name}'s finish and file {obj} under safe. That is a gift.",
    '{name} was got at early once and has arrived determined to be got at last.',
  ],
  celebrity: [
    'Recognition in this castle is a currency that spends badly, and {name} arrived holding a lot of it.',
    'Everybody here already has an idea of who {name} is, and none of those ideas are from this castle.',
    '{name} arrives with a reputation that has nothing to do with this game and will be used in it anyway.',
    'Being known is not the same as being trusted, and {name} is about to find out how different.',
    'Half this room made their mind up about {name} before the car door opened.',
    '{name} is famous for something else entirely, which the castle will treat as evidence of something.',
    'The public {name} and the {name} on these flags are about to be compared nightly.',
    'A known face is a head start and a handicap, and nobody knows yet which one {name} has.',
  ],
  civilian: [
    // NOT "has no record" — the billing line directly above already said that,
    // and two sentences making the same observation is the montage stalling.
    // These are about what the ROOM does with a stranger, which is a different
    // fact and the one that actually costs somebody something.
    'The room will invent a version of {name} by Thursday, and {name} will have to live in it.',
    'This castle will decide who {name} is off a single misjudged sentence, and then keep the verdict.',
    "Somebody will mistake {name}'s quietness for a strategy, and act on it.",
    '{name} gets to choose what to be in here, which is a freedom and a full-time job.',
    'Being unplaceable buys {name} a fortnight. What {sub} does with it is the whole season.',
    'The castle finds a stranger far more unsettling than a résumé, and it will test {obj} for it.',
    'Nobody has a reason to trust {name} and nobody has a reason not to, which is the most '
    + 'dangerous place on the flags.',
    'By the weekend somebody will have decided what {name} is, and they will be confident about it.',
  ],
};

/** Which threat tier the LEDGER puts somebody in. Placements, never a guess. */
function _threatTier(bg) {
  const type = (bg && bg.type) || 'civilian';
  const apps = (bg && bg.appearances) || [];
  if (!apps.length) return type === 'celebrity' ? 'celebrity' : 'civilian';
  const best = apps.reduce((b, a) => {
    const p = Number(a && a.placement);
    return Number.isFinite(p) && p > 0 && (b == null || p < b) ? p : b;
  }, null);
  if (best === 1) return 'champion';
  if (best != null && best <= 3) return 'finalist';
  // Never better than fifth across every season the ledger holds: the room
  // reads that as harmless, which is the whole point of the line.
  if (best != null && best >= 5) return 'earlyExit';
  return 'veteran';
}

/**
 * WHO WALKED IN, IN THE CARS THEY WALKED IN WITH.
 *
 * @param cast        the seating plan, in order
 * @param backgrounds `gs.tr.backgrounds` — the FROZEN snapshot, never the database
 * @param host        the CONFIGURED host key, or null. Never a name in prose.
 */
export function buildArrivalRecord(cast, backgrounds = {}, host = null) {
  const line = [...(cast || [])].filter(Boolean);
  if (!line.length) return null;
  const bgOf = n => (backgrounds && backgrounds[n]) || null;
  const seed = 'tr|arrival|' + line.length + '|' + (line[0] || '');
  const used = new Set();

  // ── the cars ────────────────────────────────────────────────────────
  //
  // Two to four a car, which is what a car holds, drawn off the hash so a
  // season's drive is its own and a replay of it is the same drive.
  const groups = [];
  for (let i = 0, g = 0; i < line.length; g++) {
    const size = Math.min(line.length - i, 2 + (_pHash(seed + '|car|' + g) % 3));
    groups.push({
      id: 'car-' + (g + 1),
      order: g,
      label: 'The ' + _carWord(g) + ' car',
      arrivals: line.slice(i, i + size),
      text: _pFill(_pPickUnique(_ARRIVE_GROUP, seed + '|grp|' + g, used),
        { car: _carWord(g), n: String(size) }),
    });
    i += size;
  }

  // ── the people ──────────────────────────────────────────────────────
  //
  // EVERYBODY ALREADY OUT OF A CAR, IN ARRIVAL ORDER, and the reason this list
  // exists is a defect the first version shipped: reactions were paired inside
  // a car (`for i = 1; i < group.arrivals.length`), so two alumni recorded on
  // the same season generated no callback whatsoever unless the car assignment
  // happened to put them next to each other. The ledger's single best piece of
  // material was being discarded by a hash. Nobody leaves the flags once they
  // are on them, so anybody already standing there is eligible.
  const introductions = [];
  const recognitions = [];
  const onTheFlags = [];
  for (const group of groups) {
    for (const name of group.arrivals) {
      const bg = bgOf(name);
      const person = (players || []).find(p => p && p.name === name) || null;
      const stance = _stance(person && person.archetype);
      const lines = [];
      // ESTABLISH: what this person physically did on the flags. Personality
      // may pick the action; it may not add a fact.
      // `{obj}` and `{posAdj}` come off the ROSTER'S OWN GENDER, through the
      // same table `pronouns()` delegates to. Singular "them" over somebody
      // the roster says is a woman is the defect js/pronouns-of.js was written
      // for, and a premiere is the worst possible place to print it.
      const pr = pronounsOf(person && person.gender);
      lines.push({ kind: 'establish',
        text: _pFill(_pPickUnique(_ARRIVE_ONE[stance], seed + '|one|' + name, used),
          { name, car: _carWord(group.order), obj: pr.obj, posAdj: pr.posAdj,
            sub: pr.sub, ref: pr.ref }) });
      // RECORD: Task 1's authored billing, quoted rather than rebuilt. It is
      // the only sentence on this record allowed to state a past, and it
      // states one only where the ledger holds one.
      if (bg && bg.summary) lines.push({ kind: 'record', text: bg.summary });
      // ── WHO THIS PERSON IS, out of what the season already knows ──────
      //
      // Stats, then archetype, then what the room will assume. Each reads a
      // fact the engine holds and none of them prints a number: a premiere
      // does not say "7 endurance", it says what a 7 lets somebody do.
      const subs = { name, obj: pr.obj, posAdj: pr.posAdj, sub: pr.sub, ref: pr.ref };
      const build = _buildOf(pStats(name));
      lines.push({ kind: 'profile', build,
        text: _pFill(_pPickUnique(_PROFILE[build] || _PROFILE.balanced,
          seed + '|profile|' + name, used), subs) });
      const arch = (person && person.archetype) || '';
      if (_PERSONALITY[arch]) {
        lines.push({ kind: 'personality', archetype: arch,
          text: _pFill(_pPickUnique(_PERSONALITY[arch], seed + '|arch|' + name, used), subs) });
      }
      const tier = _threatTier(bg);
      lines.push({ kind: 'threat', tier,
        text: _pFill(_pPickUnique(_THREAT[tier] || _THREAT.civilian,
          seed + '|threat|' + name, used), subs) });
      const intro = {
        name,
        order: introductions.length,
        group: group.id,
        type: (bg && bg.type) || 'civilian',
        recognized: !!(bg && bg.recognized),
        sourceShows: [...((bg && bg.sourceShows) || [])],
        appearances: ((bg && bg.appearances) || []).map(a => ({ ...a })),
        lines,
      };
      introductions.push(intro);

      // ── REACTION: who, out of everybody already standing there, has a
      //    reason to say something, and what the record lets them say ──────
      //
      // Three tiers, strongest first, and every one of them is a fact off the
      // SNAPSHOT. Nothing here may invent a history, an incident, or a grudge:
      // a shared season is two ledger rows agreeing, a recognition is the
      // snapshot's own `recognized` flag, and where neither holds, the line
      // says two strangers met and claims nothing else.
      if (onTheFlags.length) {
        // NEAREST TO HAND: whoever got out of a car last is who a new arrival
        // physically walks into.
        const nearest = onTheFlags[onTheFlags.length - 1];
        let by = null, basis = null, pool = null, subs = null;
        // 1. A SEASON THE LEDGER RECORDS THEM BOTH ON, searched over the whole
        //    of the flags rather than over one car. Backwards, so the callback
        //    lands with the one nearest rather than the one who arrived first.
        for (let i = onTheFlags.length - 1; i >= 0 && !by; i--) {
          const earlier = onTheFlags[i];
          const be = bgOf(earlier);
          const shared = ((be && be.appearances) || []).find(x =>
            ((bg && bg.appearances) || []).some(y =>
              y.format === x.format && y.season === x.season));
          if (!shared) continue;
          by = earlier;
          basis = 'both are recorded on ' + shared.seasonLabel;
          pool = _MEET_SHARED;
          subs = { a: earlier, b: name, season: shared.seasonLabel };
        }
        // 2. RECOGNISED ON ARRIVAL -- alumni or celebrity, off the snapshot.
        if (!by && bg && bg.recognized) {
          by = nearest;
          basis = name + ' arrives recognised (' + bg.type + ')';
          pool = _MEET_RECOGNISED;
          subs = { a: nearest, b: name };
        }
        // 3. NOTHING ON THE RECORD, SO NOTHING IS CLAIMED.
        if (!by) {
          by = nearest;
          pool = _MEET_NEUTRAL;
          subs = { a: nearest, b: name };
        }
        const text = _pFill(_pPickUnique(pool, seed + '|meet|' + by + '|' + name, used), subs);
        lines.push({ kind: 'reaction', text });
        if (basis) recognitions.push({ by, of: name, basis, text });
      }
      onTheFlags.push(name);
    }
  }

  return {
    ceremonyId: 'premiere-rules',
    ep: 1,
    // THE KEY, NOT THE LABEL. See the header note: a name written here is a
    // name the setup screen can no longer change.
    host: host || null,
    groups,
    introductions,
    recognitions,
    rules: _premiereRules(line.length),
  };
}

/**
 * THE BRIEFING, AS SPOKEN LINES.
 *
 * Every rule this format has, said out loud, in the order a night runs them —
 * murder, mission, pot, shield, table, banishment, payout — before a single
 * one of them has happened to anybody. `rulePoints` maps each rule to the beat
 * that actually says it, so a screen or a test can ask "where was the shield
 * explained?" and get an index rather than a search.
 *
 * NO COUNT IS STATED. How many of them there are is the season's first and
 * best-kept secret, and the host does not give it away here; the Selection has
 * its own configurable answer to that question.
 */
function _premiereRules(castSize) {
  const hostBeats = [
    { kind: 'welcome', visibility: 'all',
      action: 'The host comes down the steps and stops at the bottom of them, with the '
        + 'whole drive facing up.',
      text: 'Welcome to the castle. There are ' + castSize + ' of you standing on these '
        + 'flags and every one of you arrived here exactly the same way. That stops being '
        + 'true in about ten minutes, so I would like you to hear the rules while you all '
        + 'still trust each other.' },
    { kind: 'rule', visibility: 'all', ruleId: 'faithfuls-and-traitors',
      action: 'The host waits for the drive to go quiet.',
      text: 'Most of you will play this game as Faithfuls. Hidden among you, chosen by me '
        + 'and known only to each other, will be Traitors.' },
    { kind: 'rule', visibility: 'all', ruleId: 'traitors-murder',
      action: 'The host looks along the front of the group while saying it.',
      text: 'Every night, while the rest of you are asleep, the Traitors will meet in '
        + 'secret and choose one of you to murder. In the morning that person will simply '
        + 'not come down to breakfast, and nobody is going to explain it to you.' },
    { kind: 'rule', visibility: 'all', ruleId: 'missions-build-the-pot',
      action: 'The host turns and points back down the drive.',
      text: 'Every day you will leave this castle and work for money. Each mission you '
        + 'finish adds to the prize pot, and that pot is the only thing in this building '
        + 'that belongs to all of you at once.' },
    { kind: 'rule', visibility: 'all', ruleId: 'shield-blocks-a-murder',
      action: 'A hand goes up before anybody can look pleased about that.',
      text: 'Some missions will put a shield on the table. Win one and you cannot be '
        + 'murdered that night. Understand what else it does: everybody who watched you '
        + 'take it now knows you are safe, and safe is a very interesting thing to be.' },
    { kind: 'rule', visibility: 'all', ruleId: 'round-table-banishment',
      action: 'The host indicates the doors at the top of the steps.',
      text: 'Every evening you will sit at the Round Table. You will make your accusations '
        + "to each other's faces, and then each of you will write down one name. "
        + 'Whoever the room names goes out by banishment, and tells you exactly what they '
        + 'were on the way through that door.' },
    { kind: 'rule', visibility: 'all', ruleId: 'endgame-payout',
      action: 'The host lets that sit.',
      text: 'Banish every Traitor and the Faithfuls still standing split the prize pot '
        + 'between them. Leave one Traitor at that last table and the Traitors take all of '
        + 'it, and the rest of you go home with a very good story and nothing else.' },
    { kind: 'charge', visibility: 'all',
      action: 'The host starts back up the steps.',
      text: 'So there it is. Find them, or be one of them, and be trusted either way.' },
    { kind: 'transition', visibility: 'all',
      action: 'The host stops at the top and turns round.',
      text: 'One more thing, and then you can unpack. I need all of you in a line, facing '
        + 'me, and I need you to stop looking at each other. That part of this is over.' },
  ];
  const rulePoints = hostBeats
    .map((b, i) => (b.ruleId ? { id: b.ruleId, explainedByBeat: i } : null))
    .filter(Boolean);
  return {
    staging: 'The whole cast on the courtyard flags at the top of the drive, luggage still '
      + 'at their feet, and the host on the steps above them with the doors shut.',
    hostBeats,
    // ── AND WHAT NINE RULES DO TO TWENTY PEOPLE ────────────────────────
    //
    // The first version of this record had none, which made the briefing an
    // announcement rather than a scene: the host said everything and nobody on
    // the flags visibly heard any of it. The ceremony contract asks for
    // `contestantBeats` and the global rule asks every scene for a REACTION
    // between the action and the consequence; a rules ceremony is where that
    // matters most, because the reaction is the only measure a viewer gets of
    // what the rules cost.
    //
    // COLLECTIVE AND NAME-FREE, exactly as the Selection's are. Nothing has
    // happened to anybody in particular yet, so a beat that named somebody
    // would be inventing a reaction with no record behind it -- and "the whole
    // room goes quiet" is the consensus claim the evidence contract forbids,
    // so these say "somebody", "one or two", "two of them" and mean it.
    //
    // `afterHostBeat` pins each one to the line that caused it. That is the
    // causal link the screen renders on: a reaction that floats free of its
    // stimulus is a reaction to nothing.
    contestantBeats: [
      { kind: 'reaction', participants: [], visibility: 'all', afterHostBeat: 1,
        text: 'Nobody on the flags moves. One or two look at the person standing beside '
          + 'them anyway, which is the last time anybody in this castle will do that '
          + 'without meaning something by it.' },
      { kind: 'reaction', participants: [], visibility: 'all', afterHostBeat: 2,
        text: 'Somebody laughs at the word murder, hears exactly how it landed on a silent '
          + 'courtyard, and stops.' },
      { kind: 'reaction', participants: [], visibility: 'all', afterHostBeat: 4,
        text: 'Two of them ask at the same moment whether a shield is announced. Neither '
          + 'gets an answer, which is itself an answer and lands as one.' },
      { kind: 'reaction', participants: [], visibility: 'all', afterHostBeat: 5,
        text: 'Banishment gets a small noise out of the back of the group. Several people '
          + 'work out at the same time that the vote is public and that they will have to '
          + 'say a name to a face.' },
      { kind: 'reaction', participants: [], visibility: 'all', afterHostBeat: 8,
        text: 'Everybody looks down at luggage they have just been told they are not going '
          + 'to be allowed to pick up.' },
    ],
    rulePoints,
    // ONE REVEAL STEP PER ACTION, stored apart from the speech, because a
    // ceremony that folds its staging into its narration cannot be re-cut.
    revealBeats: [
      { kind: 'gather', text: 'The cars are sent back down the drive empty.' },
      { kind: 'briefing', text: 'The host reads the rules to the flags, start to finish, '
        + 'without being interrupted once.' },
      { kind: 'form-line', text: 'The bags are left where they are and the cast form one '
        + 'rank across the front of the castle.' },
    ],
    reminder: 'Missions pay into the prize pot. The Round Table banishes one player a '
      + 'night. The Traitors murder one after dark. Remove every Traitor and the Faithfuls '
      + 'split the pot; leave one and the Traitors take it.',
  };
}

// The living room's bonds, this episode. One entry per living pair whose bond
// is worth drawing (|v| >= 1); 0-bonds are the default and left out to keep the
// record lean. Read by the Day Book's relationship section (js/vp-tr/
// house-status.js) — friends positive, enemies negative.
function _snapshotBonds() {
  const living = [...(gs.activePlayers || [])];
  const out = [];
  for (let i = 0; i < living.length; i++) {
    for (let j = i + 1; j < living.length; j++) {
      const v = getBond(living[i], living[j]);
      if (Math.abs(v) >= 1) out.push({ a: living[i], b: living[j], v: Math.round(v * 10) / 10 });
    }
  }
  return out;
}

/**
 * TONIGHT'S ARMOURY, as plain data on the row.
 *
 * Copied onto the episode rather than read back out of `gs.tr` for the reason
 * `_conclaveRecord` gives: `gs` is replaced wholesale by the next season and
 * rebuilt by a load, so a screen reaching into live state would draw the season
 * it is standing in instead of the episode it is showing.
 *
 * `entrants` is PUBLIC and `holders` is NOT — the screens gate the second on
 * the observer exactly as the conclave gates the turret, and `js/vp-tr/` is
 * where that rule is enforced. The record carries both because the AUDIENCE is
 * entitled to the whole truth; a Faithful observer is never shown `holders`.
 */
function _armouryRecord(ep) {
  const a = (gs.tr?.armouries || []).find(x => x.ep === ep);
  if (!a) return null;
  return {
    ep: a.ep,
    entrants: [...a.entrants],
    slots: (a.slots || []).map(s => ({ name: s.name, found: !!s.found })),
    holders: [...(a.holders || [])],
    count: a.count,
    pactAware: !!a.pactAware,
  };
}

function _recordEpisode(ep, { banished = null, night = null, mission = null,
  castle = null, endgame = false, selection = null, arrival = null,
  finale = false, beliefs = undefined } = {}) {
  // THE DOOR, NOT JUST THE NAME. docs/ADDING-A-SHOW.md §5 gives `exits[]` a
  // `verb` and a `channel` and this row was writing neither, so every reader
  // of the episode history knew somebody had gone and not which of the show's
  // two ways they went — and this show is the only one where that question
  // has an answer. `roundExits()` fills a missing verb from the registry's
  // default, which is the banishment word, so a murder recorded bare was
  // being reported as a vote nobody cast.
  const [banishVerb, murderVerb] = exitVerbs(TRAITORS_FORMAT);
  const exits = [
    banished ? { name: banished, verb: banishVerb, channel: 'banishment' } : null,
    ...[night?.murdered, night?.secondVictim, night?.executed].filter(Boolean)
      .map(name => ({ name, verb: murderVerb, channel: 'murder' })),
  ].filter(Boolean);
  const conclave = night?.conclave || null;
  // On a finale row the endgame screen owns every table; a `_tableRecord` here
  // would rebuild the last endgame round as a redundant Round Table screen.
  const table = finale ? null : _tableRecord(ep, { endgame });
  // HOISTED SO IT CAN BE TRIMMED, and the order below is the whole contract:
  // the row is written FIRST and the buffer is trimmed SECOND, against the
  // very array the row took. Inverting those two lines deletes receipts that
  // were never snapshotted anywhere, silently.
  const receiptsTonight = receiptsForEp(gs, ep);
  (gs.episodeHistory ||= []).push({
    num: ep,
    // THE FORMAT, ON THE ROW. `buildVPScreens` dispatches on it exactly as it
    // does for the house, and a Traitors row without it is drawn with Total
    // Drama's screens -- tribes, a challenge record and a Tribal Council over
    // a castle, which is this project's oldest bug with a new show in it.
    format: 'traitors',
    eliminated: banished,
    exits,
    // Everything the night's screens read, snapshotted here because `gs` is
    // replaced wholesale by the next season and rebuilt wholesale by a load.
    tr: {
      // THE EPISODE NUMBER, ON THE RECORD AS WELL AS ON THE ROW. `num` is the
      // VP's key -- it is what reveal state is stored under and a caller is
      // free to renumber a copy of a row to get a fresh one. Anything that is
      // a FACT about the season has to come off the record instead, or a
      // screen answers "was this relic found tonight?" with the reader's
      // scroll position.
      ep,
      // THE FINALE ROW. Marks the endgame's own episode so screens that make no
      // sense on it (a fresh Round Table, a voting-plans board) can opt out; the
      // endgame screen and the Day Book are all it carries besides breakfast.
      finale: !!finale,
      conclave,
      // The public half of the same night. `null` on a night with no table --
      // night one holds none, and the screen must not be registered for it.
      table,
      pot: gs.tr?.pot ?? 0,
      // The pot has a ceiling and the board draws the bar against it. Read off
      // the state the missions were scored against, never a constant retyped
      // here -- `runMission` already prefers the state's value over its own.
      potCeiling: gs.tr?.potCeiling ?? 0,
      living: [...(gs.activePlayers || [])],
      // THE ROOM'S FRIENDSHIPS AND ENMITIES, frozen at this episode — friends
      // positive, enemies negative, one entry per living pair worth drawing.
      // `gs.bonds` is one live number per pair, mutated all season, so a
      // relationship screen reading it straight would draw every past episode
      // with the FINAL bonds on it (the "live state on a replayed episode"
      // bug). Snapshotted here so the Day Book's relationship section shows the
      // castle as it stood THEN.
      bonds: _snapshotBonds(),
      // THE BLOCS AS THEY STOOD TONIGHT — the circles the room votes in, frozen
      // like the bonds and for the same reason: `computeAlliances` reads the
      // LIVE bond graph, so a replayed episode would draw the FINAL alliances
      // over an early night. Snapshotted so The Web shows the castle's real
      // circles that episode. Members only — public, belief-side, no alignment.
      alliances: (computeAlliances(ep) || []).map(b => ({ members: [...b.members] })),
      // WHAT THE CASTLE WAS DOING WHILE THE TURRET SAT. Beats written this
      // episode by people who were NOT in the meeting -- the other half of
      // the picture, and the only half the castle itself ever gets.
      downstairs: _downstairs(ep, conclave?.turret || []),
      // ── WHAT THE MORNING AND THE BOARD READ (Plan 8, Task 3) ────────
      //
      // js/vp-tr/ imports no engine state at all -- not `gs`, not the crowd
      // ledgers, not `gs.tr.pot`. That is the whole of "read it through the
      // export": a screen is handed a record and cannot reach past it. So
      // everything the cold open and the house-status board need is
      // snapshotted here, in the shape they draw it.
      cast: [...(gs.tr?.castOrder || [])],
      // EVERYBODY WHO HAD ALREADY LEFT WHEN THIS EPISODE OPENED, with the
      // door each of them went out by. Built with `roundExits()` -- the
      // registry's own rule -- rather than off `eliminated`, which is the
      // public vote alone: Plan 7 found NINE readers asking that field and
      // counting a player who left by the other door as still standing.
      //
      // BEFORE, not through: tonight's own departures are on this row's
      // `exits[]` already and the board applies `roundExits()` to them
      // itself. Folding them in here would leave the screen's own call with
      // nothing to do, and a guard on a filter that cannot change the answer
      // is a guard that passes for free -- which is a shape this plan has
      // shipped once per task.
      goneBefore: _goneThrough(),
      // The relics, with their WITNESS LISTS, because who saw the award is
      // the mechanic's entire strategic content and the board has to be able
      // to withhold a holder from an observer who was not there.
      powers: _powerLedger(),
      // ── THE MORNING, WHICH IS LAST NIGHT'S NEWS ─────────────────────
      //
      // A night runs at the END of the episode it belongs to; the castle
      // finds out over breakfast the next day. So episode N's cold open is
      // about episode N-1's night, and the record carries the previous row's
      // own `exits[]` rather than the screen reaching back for it. The room
      // that comes down is `cast` minus `goneBefore`, which is the same list
      // the board opens on -- one derivation, two screens.
      dawn: _morning(),
      // ── THE AFTERNOON AND THE OFFER (Plan 8, Task 4) ────────────────
      //
      // Both `null` on plenty of rows and the screens are registered off
      // that: a mission needs four people and an endgame round runs none,
      // and the pact spends most nights killing rather than asking.
      mission: _missionRecord(mission),
      // WHO WALKED INTO THE ARMOURY, and (for the audience) who came out with
      // something. Null on every afternoon that did not run one.
      armoury: _armouryRecord(ep),
      recruitment: _recruitmentRecord(night),
      // -- THE DAY THE CASTLE ACTUALLY SPENT (Plan 8, Task 8) ---------
      //
      // Every castle scene this round fired, with the thread each one
      // belongs to and the earlier days that thread has beats on. See
      // `_castleRecord`.
      castle: _castleRecord(ep, castle),
      // -- THE BLINDFOLD AND THE TAP (Plan 8, Task 9) -----------------
      //
      // Episode one and no other. Built at the top of the season, where
      // `selectTraitors` runs, and passed down here rather than rebuilt from
      // `alignment` -- an era list read back at episode one would give the
      // same three names for the wrong reason and would keep giving them
      // after a recruitment, which is a different question with the same
      // answer for the first few nights.
      // -- WHO WALKED IN, AND WHAT THEY WERE TOLD (Plan 9, Task 2) ---
      //
      // Episode one and no other, exactly as the selection is, and registered
      // off this field rather than off an episode number. It sits ABOVE the
      // selection on the record for the same reason its screen does: the cast
      // are people before they are anything else, and a premiere that opens on
      // the blindfolds is a premiere whose viewer has met nobody.
      arrival: arrival || null,
      selection: selection || null,
      // -- WHO BELIEVES WHAT, AND HOW WRONG THEY ARE (Plan 8, Task 10) ---
      //
      // The deduction model, snapshotted. Plans 1-4 built the whole of it --
      // facts with a ground truth, per-person beliefs with a confidence and a
      // tier, decay, second-order knowledge -- and until this line nothing
      // outside the engine could see any of it, which is why Task 1's "what
      // the castle believes" panel was dropped rather than faked.
      //
      // TAKEN TONIGHT, NOT AT THE END. `gs.knowledge` is an overwriting store
      // and a season-end walk of it reads the survivors of that overwriting;
      // it is also where the era trap lives, because the truth block below is
      // this episode's era by construction and a late recompute would brand a
      // correct episode-three read as a mistake. See `traitorsBeliefSnapshot`.
      //
      // NOT ON AN ENDGAME ROW. The endgame reveals nothing (spec 8) and
      // `_tableRecord` already withholds its `truth` there; a belief block
      // carrying every survivor's alignment would hand the last table exactly
      // what the format spends it refusing to say.
      beliefs: endgame ? null : (beliefs === undefined ? _beliefRecord(ep) : beliefs),
      // -- WHY ANYTHING ON THIS ROW IS DIFFERENT (Plan 10, Task 4) -----
      //
      // Every state write a scene performed tonight, with the cause that
      // produced it. DEBUG-ONLY: `rpBuildTraitorsDebug` renders it and no
      // viewer screen may, which is why the vocabulary in `debugLine` is
      // banned from prose everywhere else.
      //
      // Snapshotted PER EPISODE off the season ledger rather than handed down
      // from the runner, because a receipt can be written by any of the seven
      // windows, the table or the night, and a parameter would have to be
      // threaded through all of them to catch the same set this filter does.
      receipts: receiptsTonight,
    },
  });
  // NOW, and only now, the buffer may let them go. See `trimRecordedReceipts`.
  trimRecordedReceipts(gs, receiptsTonight);
  // NO `gs.eliminated` HERE, AND THE OMISSION WAS MEASURED. Maintaining it
  // looked obviously right — js/audience.js's `_allNames` unions it — and
  // deleting it changed nothing at all, because `initCrowd` seeds a ledger row
  // for the whole cast and that union is already complete. It was code that
  // existed, looked live and could not be shown to do anything, which is the
  // one failure mode this project's sweeps exist to catch. If a later reader
  // genuinely needs the list, it is `castSize` minus `gs.activePlayers`.
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
  potCeiling = POT_CEILING, endgameSize = 3, evidence = ballotEvidence,
  backgrounds = null, database = null, host = null,
  murderSchedule = null, missionSchedule = null, armourySchedule = null,
  shieldEpisodes = null, chosenTraitors = null,
  rerollFromEp = null, rerollSeed = null, rerolls = null, autoDouble = true,
  randomMurderTwists = null,
  endgameReveal = false, autoRecruit = true,
  announceTraitorCount = false } = {}) {
  // ── RE-RUN FROM AN EPISODE ──────────────────────────────────────────
  // The whole season is one deterministic block off `seed`, so a real per-
  // episode re-run works by REPLAYING it and swapping the rng to a fresh seed
  // exactly at `rerollFromEp`: episodes before it draw the same numbers and
  // reproduce byte for byte, the target episode and everything after diverge.
  // `let` (not `const`) so the swap below can reassign the three streams. With
  // no reroll asked, this is the ordinary single-stream season, untouched.
  // ── EVERY RE-RUN THIS SEASON HAS HAD, NOT JUST THE LAST ONE ─────────
  //
  // One reroll point was enough for one re-run and wrong for two. Re-run
  // episode 2, air it, then re-run episode 4: the second replay reproduced
  // episodes 1-3 off the BASE seed, but episodes 2 and 3 had actually aired
  // off the FIRST reroll's seed. So the fresh episode 4 was built on a prefix
  // that never happened, and its day book listed people the season had never
  // eliminated — the ledger disagreeing with itself, one screen at a time.
  //
  // The chain is every swap point in order. `rerollFromEp`/`rerollSeed` are
  // kept as the single-entry spelling so every existing caller and test is
  // unchanged.
  const _chain = (Array.isArray(rerolls) ? rerolls : [])
    .filter(r => r && Number(r.fromEp) >= 1 && r.seed != null)
    .map(r => ({ fromEp: Number(r.fromEp), seed: r.seed }))
    .sort((a, b) => a.fromEp - b.fromEp);
  if (Number(rerollFromEp) >= 1 && rerollSeed != null
    && !_chain.some(r => r.fromEp === Number(rerollFromEp))) {
    _chain.push({ fromEp: Number(rerollFromEp), seed: rerollSeed });
    _chain.sort((a, b) => a.fromEp - b.fromEp);
  }
  const _reroll = _chain.length > 0;
  let rng = rngFor(seed);
  // The narrative layer's OWN stream — see castleRngFor's doc comment for why
  // round budgets (and later, window draws) must never share the game rng.
  let castleRng = _castleRngFor(seed);
  // And the missions', off both of them — see _missionRngFor.
  let missionRng = _missionRngFor(seed);
  // Swapping all three from ONE fresh seed keeps the three-stream separation the
  // doc comments insist on (game / narrative / missions never share a stream),
  // just re-based from the re-run point.
  const _swapStreams = seedTo => {
    rng = rngFor(seedTo);
    castleRng = _castleRngFor(seedTo);
    missionRng = _missionRngFor(seedTo);
  };
  // Re-running from night one is a whole fresh season: swap before anything
  // draws. Every point at or below episode one collapses onto the last of them.
  const _preOne = _chain.filter(r => r.fromEp <= 1);
  if (_preOne.length) _swapStreams(_preOne[_preOne.length - 1].seed);
  // gs is null until a season exists (js/core.js), so the harness creates one.
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
  // The setup screen can move this and `runMission` already prefers the value
  // on the state to its own constant, so a season played from the UI earns
  // against the pot the user asked for. Defaulted to the constant, so every
  // caller that does not pass one — the audits, the calibration, the tests —
  // plays exactly the season it played before.
  gs.tr.potCeiling = Number(potCeiling) > 0 ? Number(potCeiling) : POT_CEILING;
  // THE AUTHOR'S MURDER CALENDAR, episode -> variant id, from the episode-
  // format designer (js/tr-run.js maps seasonConfig.twistSchedule to this).
  // `pickVariant` in murder-variants.js reads it and forces that night's shape
  // when the living room can support it. Null/empty means every night rolls
  // for its own shape, so a season played without one is bit-identical to
  // before — the audits, the calibration and the tests pass nothing here.
  gs.tr.murderSchedule = (murderSchedule && typeof murderSchedule === 'object')
    ? murderSchedule : null;
  // THE AUTHOR'S MISSION CALENDAR, episode -> mission id, from the timeline's
  // per-episode dropdown (js/tr-run.js). `runMission` reads it and forces that
  // afternoon's mission when it is eligible. Null means every afternoon draws
  // its own, so a season played without one is unchanged.
  gs.tr.missionSchedule = (missionSchedule && typeof missionSchedule === 'object')
    ? missionSchedule : null;
  // THE AFTERNOON'S PINS. Both are `{ episode: true }` maps written by the
  // timeline (js/tr-run.js) and read once a day: `armourySchedule` opens the
  // Armoury on a night the author asked for it whatever the mission scored,
  // and `shieldEpisodes` forces that day's mission to be one that carries a
  // Shield. Null on an unpinned season, so nothing changes for one.
  gs.tr.armourySchedule = (armourySchedule && typeof armourySchedule === 'object')
    ? armourySchedule : null;
  gs.tr.shieldEpisodes = (shieldEpisodes && typeof shieldEpisodes === 'object')
    ? shieldEpisodes : null;
  // Auto (random) double murders off, when the Castle Options toggle asks —
  // pickVariant drops `double` from the random pool but still honours a pinned
  // one. Defaults to on, so headless callers (calibration, tests) are unchanged.
  gs.tr.noAutoDouble = autoDouble === false;
  // WHICH MURDER SHAPES MAY COME UP ON THEIR OWN. Empty (the default) means
  // none of them do: every night is a standard murder unless the author pinned
  // a shape to it from the timeline. See pickVariant in js/tr/murder-variants.js
  // for why this is opt-in rather than opt-out.
  gs.tr.randomMurderTwists = Array.isArray(randomMurderTwists) ? [...randomMurderTwists] : [];
  // Automatic recruitment off, when the Castle Option asks — the pact never
  // recruits on its own, only on a night the author pinned. Defaults to on, so
  // headless callers (calibration, tests) are unchanged.
  gs.tr.noAutoRecruit = autoRecruit === false;
  // THE SEATING PLAN, AND IT NEVER CHANGES. `activePlayers` shrinks every
  // night, so a screen drawing the room from it re-seats everybody the moment
  // somebody leaves and the eye can no longer follow a person from one episode
  // to the next. The Round Table keeps every chair where it was and marks the
  // empty ones, which is the whole of the format's best recurring image: the
  // ring visibly thinning while the survivors look at the gaps.
  gs.tr.castOrder = [...cast];
  // WHO EACH OF THEM WAS BEFORE THE DOOR, TAKEN ONCE AND NEVER RE-TAKEN.
  // The setup screen resolves these against the cast it holds and hands them
  // down; a harness that has only names resolves them here. Either way the
  // season keeps the ANSWER rather than the question — see gs.tr.backgrounds
  // for why re-resolving on replay would rewrite a premiere. This takes no
  // draw from any of the three streams, so a season played with backgrounds is
  // bit-identical to one played without.
  gs.tr.backgrounds = (backgrounds && typeof backgrounds === 'object' && !Array.isArray(backgrounds))
    ? backgrounds
    : snapshotTraitorsBackgrounds(
      // THE WHOLE CAST ENTRY AND NOT THE NAME. `resolveTraitorsBackground`
      // takes its personality clause off `p.archetype` and its occupation off
      // `p.occupation`; handed a bare string it has neither, falls to the
      // fallback voice, and bills every alumnus in the season with the same
      // two clauses. Found by dumping a premiere and reading it, which is how
      // every prose defect in ten plans has been found.
      cast.map(n => (players || []).find(p => p && p.name === n) || { name: n }),
      database);
  // THE TWO AUDIENCE LEDGERS, and the episode record they are read against.
  // `gs.episodeHistory` is what js/audience.js counts rounds off — it is the
  // one thing that module needs from a show and the one thing a headless
  // season did not have, so without it every player's `roundsPresent` fell
  // back to the season length and `audienceStanding` degraded to a rescaling
  // of the accrued total. That is the -0.952 bug wearing a different hat.
  initCrowd(cast);
  resetKnowledge();
  _seedStartingBonds(cast, seed);

  const traitors = selectTraitors(cast,
    { traitorCount, chosenTraitors: Array.isArray(chosenTraitors) ? chosenTraitors : null }, rng);
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  cast.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
  // THE ONE MOMENT THREE PEOPLE LEARN EACH OTHER WITH CERTAINTY, kept for the
  // screen that draws it. `seedTraitorKnowledge` is the first of the engine's
  // three sanctioned `public` alignment writers (tests/tr-missions.test.js
  // names the closed set); this line stores no belief and creates no
  // certainty -- it records who was standing there when that one did.
  const selection = _selectionRecord(1, cast, traitors,
    { announceCount: !!announceTraitorCount });
  // THE DRIVE, AND IT IS BUILT OFF THE SNAPSHOT RATHER THAN OFF THE DATABASE.
  // `gs.tr.backgrounds` was frozen twenty lines above; re-resolving here would
  // give a replayed season a different premiere every time somebody corrected a
  // placement, which is the exact failure the snapshot exists to prevent. The
  // host travels as the CONFIGURED KEY and is never named on the record.
  const arrival = buildArrivalRecord(cast, gs.tr.backgrounds,
    host || (seasonConfig && seasonConfig.host) || null);

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
  // TASK 5: phase-scoped budgets, not the old flat `startRoundBudget(castleRng,
  // 5)`. No table on night one, so `private-strategy` and `roundtable-scramble`
  // — which campaign for and react to a table that isn't happening — are never
  // called at all; that is this round's version of the old "5 windows, not 7".
  const castle1 = [
    ...runCastlePhase('breakfast-fallout', ep, castleRng), // dawn
    ...runCastlePhase('morning-life', ep, castleRng),      // morning + journey-out
  ];
  // The mission sits BETWEEN the two journey windows because that is what the
  // journey is: out to the mission, and back from it. Night one has one too —
  // the show does — even though it has no Round Table.
  const mission1 = runMission(ep, missionRng);
  // THE ARMOURY, straight after the afternoon that earned it. Draws off the
  // MISSION stream like everything else out here, so a season with no Armoury
  // configured consumes an identical game stream (js/tr/armoury.js).
  const armoury1 = runArmoury(ep, mission1, missionRng);
  // EVIDENCE SOURCE 4, and it runs on night one like every other beat of the
  // afternoon. It reads the mission that has JUST happened rather than the
  // round that just closed, so it is not part of the order contract below and
  // does not disturb it — and it takes its acceptance rolls off the MISSION
  // stream, so it displaces no game draw either. What it does change is what
  // the room believes, which is the point of it.
  missionEvidence(ep, missionRng);
  castle1.push(...runCastlePhase('mission-fallout', ep, castleRng)); // journey-back
  const beliefs1 = _beliefRecord(ep);
  const n1 = _night(ep, rng);
  // THE SHIELD IS RESOLVED THE MOMENT THE NIGHT IS, and in this order for two
  // reasons. `shieldEvidence` has to run while the Shield is still live —
  // it reads which Shield tonight's block belongs to — and `expireShields`
  // has to run before the next round can start, because a Shield blocks the
  // NEXT MURDER ONLY and nothing about it carries over. Both take the
  // MISSIONS' rng stream: the Shield came out of a mission, and an acceptance
  // roll drawn from the game's own stream would displace every murder and
  // ballot after it (see _missionRngFor).
  shieldEvidence(ep, missionRng, n1);
  // AND THE ROOM'S OWN READ, which only an Armoury night has. Runs beside
  // `shieldEvidence` and on the same stream for the same reasons: the shield
  // must still be live to be identified, and this belongs to the mission the
  // Armoury came out of. Returns immediately, drawing nothing, on any night
  // that was not an Armoury block — so a season with no Armoury is unchanged.
  armouryBlockEvidence(ep, missionRng);
  expireShields(ep);
  // A Dagger is NOT expired here — that is the whole difference between the
  // two powers, and the reason one of them can reach the endgame. What this
  // does is close the record of anybody who left the castle this round still
  // carrying one, so that 'held' keeps meaning "unspent, and its owner is
  // still standing". It runs after the night rather than after the table
  // because a round takes two people and this has to catch both.
  settleDaggers(ep);
  castle1.push(...runCastlePhase('post-banishment', ep, castleRng)); // night
  scoreMission(ep, mission1);
  _recordEpisode(ep, { banished: null, night: n1, mission: mission1, castle: castle1,
    selection, arrival, beliefs: beliefs1 });
  log.push({ ep, banished: null, wasTraitor: null, ...n1, mission: mission1,
    castleEvents: castle1, budget: { ...gs.tr.roundBudget } });

  const configuredEndgameSize = Math.max(2, Math.min(cast.length, Number(endgameSize) || 3));
  // Set by the loop when a Round Table hands straight over to the endgame;
  // the endgame then attaches to THAT episode instead of building its own row.
  let _endgameEp = null;
  // On the state so `_night` can read it: the last banishment leaves exactly
  // this many, and no murder (nor a Double) fires that would carry the room past
  // it — a final-four setting hands the fire round four, not three.
  gs.tr.endgameSize = configuredEndgameSize;
  while (ep++ < maxRounds) {
    // THE RE-RUN POINT. Reached AFTER every earlier episode has drawn its
    // numbers off the base seed and reproduced exactly, and BEFORE this
    // episode draws anything — so this night and every night after it are a
    // different season, and the ones before are the ones that aired.
    if (_reroll) {
      // Every swap point that lands on this night, last one winning: two
      // re-runs of the same episode are the second one.
      const here = _chain.filter(r => r.fromEp === ep);
      if (here.length) _swapStreams(here[here.length - 1].seed);
    }
    const alive = gs.activePlayers || [];
    const tr = livingTraitors(ep).length;
    const fa = livingFaithfuls(ep).length;
    // WHEN THE MANDATED GAME HANDS OFF TO THE ENDGAME. Three conditions, and
    // the parity one is the subtle one.
    //
    // `!tr` — the pact is dead, the room has won outright. `!fa` — the mirror,
    // an all-Traitor castle with nobody left to murder (this used to be folded
    // into `fa <= tr`; it is kept explicit now the parity test is gated).
    // `alive <= endgameSize` — the room is down to the final handful and it is
    // simply time.
    //
    // Parity (`fa <= tr`) is NOT a real-show trigger on its own — the Faithful
    // reaching parity is not a loss, the pact keeps murdering and the room
    // keeps banishing (End Game — Traitors Wiki). The old code broke on bare
    // `fa <= tr`, which ended a 3-v-3 SIX-hander two nights early: the conclave
    // fell silent and the reveal-less endgame quietly banished the rest, which
    // is the bug this fixes. But parity is not irrelevant either — the endgame
    // is where a Traitor betrays a FELLOW for the pot, and that drama only
    // exists if the finale opens while two or more of them are still in the
    // room. So parity ends the mandated game ONLY once the room is already
    // small (`endgameSize + 2`, i.e. the final four-to-five), which keeps the
    // murders running at the final six yet still opens a multi-Traitor endgame
    // where the format wants one. Measured against tr-calibration: the
    // endgame's betrayal arm needs this window to be populated at all.
    // ── AND PARITY DOES NOT SKIP THE TABLE ────────────────────────────
    //
    // Parity used to break HERE, at the top, before this night's Round Table
    // had run. Reported from played seasons: "the endgame starts without the
    // last banishment", and "it launched at top 6 instead of banishing someone,
    // then a murder, then a last banishment, then the finale."
    //
    // Both are this. Ending the mandated game at the top of an episode means
    // the episode never happens: no table, and the fire round opens on a room
    // nobody was asked to vote on. The window itself earns its place — the
    // endgame's betrayal arm needs two Traitors in the room and
    // tests/tr-calibration.test.js goes vacuous without it — but it belongs
    // AFTER the banishment, beside `handOver`, where the same rule already
    // skips the night and opens the endgame in the same episode.
    //
    // ── AND A DEAD PACT DOES NOT SKIP THE TABLE EITHER ────────────────
    //
    // Reported: "force a last banishment always before the endgame, even when
    // all the traitors are out." `!tr` and `!fa` used to break HERE, which is
    // the same defect the paragraph above describes in its other half: the
    // episode never happens, so a season whose pact was wiped out simply
    // stopped — no mission, no castle day, no table — and the fire round
    // opened on a room of eleven nobody had been asked to vote on. (Measured
    // at `endgameSize: 4`: the endgame opened with 6, 8, 9 and even 11
    // players.) The room being clean ends the GAME, not the DAY.
    //
    // So they run the day and hand over after its table. Only the size rule
    // breaks at the top, and it has to: the room is already the size the
    // author asked the endgame to open at.
    //
    // ── AND NEITHER DOES THE SIZE RULE, WHICH IS THE THIRD REPORT ─────
    //
    // "If they arrive at four at the last episode, the next episode should
    // still include a banishment, right?" Right, and it did not always. When
    // the previous night's murder landed the room exactly on the number, this
    // broke here, and the finale was then built as a bare row further down:
    // no mission, no castle day, no Round Table. The fire round opened
    // straight onto a vote-or-end, and a room that voted to end at the first
    // ask went home having never banished anybody on the last day — the
    // season's final removal was a murder. Measured over 30 seasons at
    // `endgameSize: 4`: seven finales built that way, two of them with no
    // banishment at all, and all seven with no mission.
    //
    // That is not the finale the format plays. UK series one, episode twelve:
    // a mission (Treasure in the Loch, the last £20,000), then Kieran banished
    // 4-1, then Wilfred banished 3-1, then the three who were left took it.
    // The murder was the night BEFORE. A finale day is a full day.
    //
    // So the last day is played rather than skipped. It runs its mission, its
    // castle day and its Round Table, it commits no murder, and the fire round
    // opens on what its table leaves.
    //
    // THE PRICE, AND IT IS NOT AVOIDABLE. The room loses two people an episode
    // — one to the table, one to the night — so with the pact striking every
    // night there is no way to land the fire round on one exact number from
    // both parities AND put a banishment in front of it. It opens at the
    // number when the table delivered the size, and one below when the murder
    // did. `endgameSize` is therefore the room the LAST DAY opens with, which
    // is how the report reads it: arrive at four, play a last episode, banish.
    const pactGone = !tr || !fa;
    // A table of two is a coin flip rather than a vote, so the smallest rooms
    // still hand over untouched.
    if (alive.length <= 2) break;
    const lastDay = pactGone || alive.length <= configuredEndgameSize;

    // TASK 5: each of the six Castle Day phases draws its OWN scene-count
    // budget from its own range (js/tr/castle/phases.js), spending it
    // fair-share across the window(s) that phase owns — replacing the old
    // flat 4-8 total shared across all seven windows. Phases slot around the
    // evidence/table/night contract below WITHOUT disturbing it — see that
    // comment for why the three calls it wraps cannot reorder.
    const castleEvents = [
      ...runCastlePhase('breakfast-fallout', ep, castleRng), // dawn
    ];

    // ORDER IS THE CONTRACT. Both evidence sources read the round that just
    // CLOSED, so both must run before runRoundTable opens a new one — and
    // murderEvidence in particular gates on `round.ep === ep - 1`, which is
    // the guard that stops it re-emitting an old murder every round for the
    // rest of the season. The murder itself comes last, and is written back
    // onto the round the table just produced.
    evidence(ep, rng);
    murderEvidence(ep, rng);
    // EVIDENCE SOURCE 5 — the SHAPE of last night, spec 7.4. Sits here rather
    // than anywhere else for exactly murderEvidence's reason: it reads the
    // round that just closed and carries the same `round.ep === ep - 1`
    // once-guard, so it has to run before runRoundTable opens a new one. On a
    // standard night it returns before it takes a single draw, which is what
    // keeps a twist-free season bit-identical to the engine that had no
    // catalogue in it.
    variantEvidence(ep, rng);
    // journey-out/journey-back bracket the mission, which is what the journey
    // is for. The mission draws from its OWN stream (see _missionRngFor), so
    // it sits inside the order contract above without disturbing a single one
    // of the game rng's draws — the evidence/table/night sequence either side
    // of it is bit-identical whether missions run or not, which is what
    // tests/tr-missions.test.js asserts directly. `morning-life` (dawn's
    // successor phase) covers `journey-out` too — see the note atop
    // js/tr/castle/phases.js for why bundling it here, rather than at
    // `morning`'s old position right after dawn, is safe: evidence/
    // murderEvidence/variantEvidence write `gs.knowledge`, which no castle
    // event may read, so running this phase before or after them changes
    // nothing about what it draws.
    castleEvents.push(...runCastlePhase('morning-life', ep, castleRng)); // morning + journey-out
    const mission = runMission(ep, missionRng);
    const armoury = runArmoury(ep, mission, missionRng);   // see night one
    // Source 4. Same round as the mission it reads, before the table it feeds.
    missionEvidence(ep, missionRng);
    castleEvents.push(...runCastlePhase('mission-fallout', ep, castleRng)); // journey-back
    castleEvents.push(...runCastlePhase('private-strategy', ep, castleRng)); // evening
    // Voting Plans is shown before the Round Table, so freeze its beliefs now.
    // The reveal cascade inside runRoundTable() creates valid information for
    // tomorrow, but it must not travel backward onto tonight's pre-table screen.
    const beliefsBeforeTable = _beliefRecord(ep);
    const r = runRoundTable(ep, rng);
    if (!r) break;   // an empty castle: nothing left to banish
    // The reveal cascade has already run inside runRoundTable by the time
    // after-table fires — that is the whole point of the window: someone
    // was just revealed.
    castleEvents.push(...runCastlePhase('roundtable-scramble', ep, castleRng)); // after-table

    // ── THE ENDGAME BEGINS ON THE NIGHT THE TABLE REACHES IT ────────────
    //
    // The format does not murder somebody and then hold the fire round; the
    // last banishment IS the handover. So the moment the Round Table brings
    // the room down to the endgame size, this episode runs NO NIGHT — no
    // conclave, no murder — and the endgame opens in the same episode, after
    // the banishment that caused it.
    //
    // WHAT THIS REPLACES, and why the previous shape was not simply wrong.
    // The endgame used to break out of this loop at the TOP of the next
    // iteration and build a dedicated finale row. That row was correct about
    // one thing the note below the loop argues at length: an endgame must not
    // sit in an episode that also committed a murder. It bought that by
    // spending a whole extra episode on it, which is where the sparse
    // "episode" with no mission, no table and no night came from — and it put
    // the fire round a night away from the banishment that triggered it.
    //
    // Skipping the night here gets the same guarantee for free: the episode
    // that hands over cannot contain a murder, because the murder is the thing
    // being skipped. `endgameSize: 3` now reads: banish from four to three,
    // and go straight into the endgame with those three.
    const stillIn = (gs.activePlayers || []).length;
    // THE ROOM AS THE BANISHMENT LEFT IT — so parity is read after the table
    // that was supposed to decide it, not before.
    const parityNow = livingFaithfuls(ep).length <= livingTraitors(ep).length
      && stillIn <= configuredEndgameSize + 2;
    const handOver = lastDay || stillIn <= configuredEndgameSize || parityNow;
    // ── THE PACT MURDERS EVERY NIGHT IT IS STILL ABLE TO ──────────────
    //
    // There used to be a second suppression here: a murder that would take the
    // room TO the endgame size was not committed, so that the table rather
    // than the pact delivered the handover. It bought exactness on the odd
    // cast counts and it cost a SECOND murder-free night, one episode before
    // the finale — reported from a played season: "I tested one episode before
    // the finale, there was no murder despite being a top 6 with 2 Traitors
    // still there." Measured across 24 seasons at `endgameSize: 4`, seed 1's
    // nights ran + + + + + + + - -, two dark nights in a row at the end.
    //
    // It is also not what the format does. The End Game (Traitors Wiki): the
    // murders run every night up to and including the night before the finale,
    // and the finale DAY is the one with no murder in it — mission, Round
    // Table, then vote-or-end. UK series 1 is the worked example: six left at
    // the end of the previous episode, and the finale banishes twice with no
    // murder between.
    //
    // And it was not buying what it looked like it was buying. Removing it
    // costs nothing on size, because the two parities land on the endgame from
    // opposite sides: from six the murder lands the room on four exactly and
    // the finale is its own day; from seven the table lands it on four and
    // `handOver` skips that night, so the finale is that same episode. Either
    // way the fire round opens with the number the author asked for, and the
    // only mandated nights without a murder are a night the pact spent making
    // an offer instead (js/tr/roles.js — the UK series 1 recruitment), and the
    // finale itself.
    const night = handOver ? null : _night(ep, rng);
    // Same pair, same order, same stream — see the note on night one.
    // Housekeeping runs either way: a Shield still expires on a night nobody
    // was murdered, and a Dagger still settles on the banishment.
    shieldEvidence(ep, missionRng, night);
    armouryBlockEvidence(ep, missionRng);
    expireShields(ep);
    settleDaggers(ep);   // see night one: the banished and the murdered, both
    castleEvents.push(...runCastlePhase('post-banishment', ep, castleRng)); // night
    // aliveAtVote/traitorsAtVote are the population as it stood when the ballots
    // were cast, and they are DATA, not behaviour — nothing in the engine reads
    // them. They exist because the null hypothesis for a banishment is not a
    // constant: the murder only ever removes Faithfuls, so Traitor density
    // climbs monotonically all season and a late banishment is a likelier
    // Traitor hit for reasons that have nothing to do with deduction. Without
    // these two numbers there is no way to tell a room that learned something
    // from a room that simply ran out of Faithfuls.
    // WHAT THE COUNTRY MADE OF THE DAY (spec 10.4), read off records the
    // engine has already written. None of these takes an rng draw and none
    // writes a belief, so every murder, ballot and deduction in the season is
    // bit-identical with the ledgers in place. See js/tr/crowd.js.
    scoreMission(ep, mission);
    scoreTable(ep, r, { bondOf: getBond });
    _recordEpisode(ep, { banished: r.banished, night, mission, castle: castleEvents,
      beliefs: beliefsBeforeTable });
    log.push({ ep, banished: r.banished, wasTraitor: r.wasTraitor, ...(night || {}), mission,
      alive: alive.length, aliveAtVote: alive.length, traitorsAtVote: tr,
      castleEvents, budget: { ...gs.tr.roundBudget } });
    // The table reached the endgame size: this episode is the last one, and
    // the endgame below attaches to it rather than to a row of its own.
    if (handOver) { _endgameEp = ep; break; }
  }

  // THE ENDGAME (spec 8), and it is the reason a season can now END rather
  // than merely stop. The loop above exits on the format's own conditions —
  // the pact is dead, or the room is down to three, or the Faithfuls no longer
  // outnumber them — and every one of those used to be where the record simply
  // stopped being written. From here the survivors are asked the private
  // question instead of the public one, and the money finally has a reader.
  const mandatedRounds = gs.tr.rounds.length;
  // ONE PAST THE HANDOVER, BECAUSE `runEndgame` USES ITS ARGUMENT AS A ROUND
  // COUNTER. It calls `runRoundTable(ep, …)` and then `ep++` for each further
  // table, so the number it is given must be one no mandated round already
  // owns. When the loop handed over, `ep` IS the episode that just ran a Round
  // Table — starting there put two rounds on one episode number, and
  // `_tableRecord` and the export both answer such an episode with whichever
  // round they happen to find first. When the loop exited at the top instead
  // (a dead pact, an all-Traitor castle, parity) `ep` is an episode that never
  // ran and the number is already free.
  const endgame = runEndgame(_endgameEp != null ? ep + 1 : ep, rng,
    { reveal: endgameReveal });
  // The final table's private question, and it is scored from the CHOICES
  // rather than from who left: a betrayal the room then failed to carry out
  // was still chosen, and `endgameChoice` is the only place that fact exists.
  scoreEndgame(endgame);
  // THE FINALE IS ITS OWN EPISODE, AND IT COMMITS NO MURDER.
  //
  // Two earlier shapes were both wrong. First, each endgame table got its own
  // `_recordEpisode` row — but an endgame round runs no night and no mission, so
  // those rows rendered as sparse, murder-less "episodes" with the summary on
  // only the last one, which read as the game breaking. Then the whole endgame
  // was folded onto the LAST MANDATED row — but that row had just run a night,
  // so the finale episode carried a conclave, a murder committed in the same
  // episode as the fire round, which is not how the finale plays.
  //
  // So the endgame is ONE dedicated finale row. It runs no `_night` (no conclave
  // is built for it), the last mandated night's murder surfaces in its breakfast
  // like any other morning-after, and the endgame SCREEN draws every table, vote
  // and the money. The finale's banishments fold into its `exits[]` so the
  // timeline counts every departure; reveal-less, so no alignment travels on the
  // exit (spec §8 — unless the author turned reveals on, and then the endgame
  // record carries it and the screen reads it there).
  const _rows = gs.episodeHistory || [];
  if (_rows.length) {
    // ── WHERE THE ENDGAME LIVES ─────────────────────────────────────────
    //
    // Normally on the episode whose Round Table reached the endgame size:
    // the loop skipped that episode's night for exactly this reason, so the
    // row carries a mission, a table, a banishment and then the endgame, with
    // no murder in it — which is the objection the note above raises against
    // folding, answered rather than avoided.
    //
    // A row of its own is still built for the ways a season can end WITHOUT a
    // handover table: the pact being wiped out, an all-Traitor castle, or the
    // parity rule closing the mandated game. Those exit the loop at the top
    // with no banishment to attach to, and a finale row is the honest shape
    // for them.
    let _finaleRow = _endgameEp != null
      ? _rows.find(r => Number(r.num) === Number(_endgameEp)) : null;
    if (!_finaleRow) {
      const _finaleEp = (Number(_rows[_rows.length - 1].num) || _rows.length) + 1;
      _recordEpisode(_finaleEp, { endgame: true, finale: true });
      _finaleRow = _rows[_rows.length - 1];
    }
    _finaleRow.tr.endgame = _endgameRecord(endgame);
    // The row that carries the endgame IS the finale, however it got here.
    // Nothing in js/vp-tr/ gates a screen on this, but the export and the
    // Day Book read it to know which episode ended the season.
    _finaleRow.tr.finale = true;
    const [_banishVerb] = exitVerbs(TRAITORS_FORMAT);
    for (const r of endgame.rounds || []) {
      if (r.banished) {
        _finaleRow.exits.push({ name: r.banished, verb: _banishVerb,
          channel: 'banishment', endgame: true });
      }
    }
  }

  return {
    traitors,
    log,
    // Alumni / Celebrity / Civilian, as resolved at setup. Copied out for the
    // same reason `rounds` and `missions` are: the next season replaces gs
    // wholesale, and this is what the export layer publishes.
    backgrounds: { ...(gs.tr.backgrounds || {}) },
    // THE MANDATED SEASON'S ROUNDS, and the slice is deliberate. The endgame's
    // tables are Round Tables and are recorded on `gs.tr.rounds` like any
    // other, but they are a different game — three or four people, no reveal
    // to reason from, and a question that is not "who is the Traitor" — and
    // the calibration bands are population measurements of the deduction
    // engine over the mandated season. Folding a handful of three-ballot
    // finale tables into that population would move those bands by changing
    // WHAT IS BEING COUNTED rather than by changing the engine, which is the
    // exact confusion the bands exist to prevent. They are handed back in
    // `endgame.rounds` instead, and nothing is lost.
    rounds: gs.tr.rounds.slice(0, mandatedRounds),
    // Nights the Traitors struck and nobody died. Copied out because the next
    // season replaces gs wholesale.
    blockedMurders: [...(gs.tr.blockedMurders || [])],
    // Who overruled whom, and on which night. Copied out for the same reason
    // as everything else here, and needed from outside because the ABSENCE of
    // an entry is what proves Murder in Plain Sight held no conclave — a fact
    // that lives nowhere on the round record, because a meeting that did not
    // happen writes nothing.
    conclaveTension: [...(gs.tr.conclaveTension || [])],
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
    // Every Shield the season awarded, with its witnesses and how it ended
    // ('blocked' or 'expired'). Copied out for the same reason `rounds` and
    // `missions` are: the next season replaces gs wholesale, so a caller that
    // plays 200 seasons and then reads gs.tr.shields is reading season 200 and
    // calling it a population.
    shields: [...(gs.tr.shields || [])],
    // Every Dagger the season awarded, with its witnesses, the room size its
    // holder was waiting for, and how it ended. A record still reading 'held'
    // at the end of a season is the interesting one: it reached the last table
    // unspent, which is the only state from which spec 7.3's 3-3 deadlock can
    // ever be broken.
    daggers: [...(gs.tr.daggers || [])],
    pot: gs.tr.pot,
    potCeiling: gs.tr.potCeiling,
    survivors: [...(gs.activePlayers || [])],
    // The choices, the finale tables and who walked out with the pot. The
    // whole phase record — see js/tr/endgame.js. `endgame.seer` is the one
    // private meeting the season held, copied out of `gs` with everything
    // else for the reason `rounds` and `missions` are.
    endgame,
    // WHO WON IS NOW DECIDED BY THE ENDGAME AND NOT BY THE LOOP EXITING. It is
    // the same question answered at the same moment it is really answered:
    // any Traitor left standing when the room stops banishing takes all of the
    // money, and only a castle with nobody in a cloak splits it.
    winner: endgame.winner,
  };
}
