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
import { setBond, getBond } from '../bonds.js';
import { selectTraitors, recordAlignment, livingTraitors, livingFaithfuls,
  canRecruit, chooseRecruit, offerRecruitment, alignmentAt } from './roles.js';
// The ballot array the export builds, used unchanged. See `_tableRecord`.
import { traitorsRoundBallots, TRAITORS_FORMAT } from './export.js';
// The show's two exit words, from the registry. Never written as literals.
import { exitVerbs, roundExits } from '../shows.js';
import { seedTraitorKnowledge, ballotEvidence, murderEvidence, missionEvidence } from './deduction.js';
import { variantEvidence } from './murder-variants.js';
import { runRoundTable } from './roundtable.js';
import { resolveMurder } from './murder.js';
import { runWindow, startRoundBudget, sceneParticipants, KNOWN_WINDOWS } from './events.js';
import { outcomeSense } from './threads.js';
import { runMission, POT_CEILING } from './missions.js';
import { shieldEvidence, expireShields, settleDaggers } from './powers.js';
import { runEndgame } from './endgame.js';
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
      executed: null, livingAtMurder: [], conclave: null };
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
    playedEp: r.playedEp ?? null, target: r.target ?? null });
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
function _missionRecord(m) {
  if (!m) return null;
  const relicKey = m.shield ? 'shield' : (m.dagger ? 'dagger' : null);
  const r = relicKey ? m[relicKey] : null;
  return {
    id: m.id, ep: m.ep, name: m.name,
    teams: (m.teams || []).map(t => ({ name: t.name, members: [...(t.members || [])],
      perf: t.perf })),
    quality: m.quality, tier: m.tier, bestTeam: m.bestTeam,
    gross: m.gross, earned: m.earned, potAfter: m.potAfter,
    sideObjectives: (m.sideObjectives || []).map(o => ({ ...o })),
    summary: m.summary || '',
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
 * THE SELECTION, IN THE SHAPE THE FIRST SCREEN DRAWS IT (js/vp-tr/selection.js).
 *
 * Spec 9.2 lists this first and it is the only thing on the record that
 * happens exactly ONCE. Every other field here answers "what did this night
 * contain"; this one answers "how did the season start", so it rides on the
 * episode-one row and no other row ever carries it.
 *
 * IT RECORDS THE WALK AND NOT JUST THE ANSWER. `selectTraitors` returns the
 * three in DRAW order, which is an artefact of how the rng was consumed and
 * is not a fact about the evening. What the room lived through is the host
 * going down the rank from one end, so `taps` is the same three in LINE
 * order with the position each one was standing at -- and `chosen` keeps the
 * draw order beside it, so a screen that renders the walk cannot be
 * satisfied by the list it was not drawing.
 *
 * `line` is the rank as it stood, which is `castOrder` before anybody has
 * left. It is copied rather than referenced because the seating plan outlives
 * the season and a screen must not be able to reach past its own record.
 */
function _selectionRecord(ep, cast, traitors) {
  const line = [...(cast || [])];
  const chosen = [...(traitors || [])];
  const taps = chosen
    .map(name => ({ name, at: line.indexOf(name) }))
    .filter(t => t.at >= 0)
    .sort((a, b) => a.at - b.at);
  return { ep, line, chosen, taps, turret: [...chosen] };
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
  return {
    from: asks.length ? asks[0].ep : null,
    endEp: e.endEp ?? null,
    asks,
    tables: (e.rounds || []).map(r => ({ ep: r.ep, chosen: r.banished || null })),
    winner: e.winner || null,
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
  };
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
    const closedNow = t.state === 'closed' && t.lastEp === ep && !!t.outcome;

    scenes.push({
      window: f.event.window,
      family: f.event.family || t.kind,
      eventId: f.event.id,
      branch: (c && c.branch) || null,
      // WHO WAS CONVENED and WHO THE SENTENCE IS ABOUT, both, because they
      // disagree for thirteen events in the pool and the observer contract
      // has to honour either claim to having been in the room.
      actors: [...(f.actors || [])],
      people: sceneParticipants(c),
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

  return { ep, windows, scenes };
}

function _recordEpisode(ep, { banished = null, night = null, mission = null,
  castle = null, endgame = false, selection = null } = {}) {
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
  const table = _tableRecord(ep, { endgame });
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
      selection: selection || null,
    },
  });
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
  potCeiling = POT_CEILING, evidence = ballotEvidence } = {}) {
  const rng = rngFor(seed);
  // The narrative layer's OWN stream — see castleRngFor's doc comment for why
  // round budgets (and later, window draws) must never share the game rng.
  const castleRng = _castleRngFor(seed);
  // And the missions', off both of them — see _missionRngFor.
  const missionRng = _missionRngFor(seed);
  // gs is null until a season exists (js/core.js), so the harness creates one.
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
  // The setup screen can move this and `runMission` already prefers the value
  // on the state to its own constant, so a season played from the UI earns
  // against the pot the user asked for. Defaulted to the constant, so every
  // caller that does not pass one — the audits, the calibration, the tests —
  // plays exactly the season it played before.
  gs.tr.potCeiling = Number(potCeiling) > 0 ? Number(potCeiling) : POT_CEILING;
  // THE SEATING PLAN, AND IT NEVER CHANGES. `activePlayers` shrinks every
  // night, so a screen drawing the room from it re-seats everybody the moment
  // somebody leaves and the eye can no longer follow a person from one episode
  // to the next. The Round Table keeps every chair where it was and marks the
  // empty ones, which is the whole of the format's best recurring image: the
  // ring visibly thinning while the survivors look at the gaps.
  gs.tr.castOrder = [...cast];
  // THE TWO AUDIENCE LEDGERS, and the episode record they are read against.
  // `gs.episodeHistory` is what js/audience.js counts rounds off — it is the
  // one thing that module needs from a show and the one thing a headless
  // season did not have, so without it every player's `roundsPresent` fell
  // back to the season length and `audienceStanding` degraded to a rescaling
  // of the accrued total. That is the -0.952 bug wearing a different hat.
  initCrowd(cast);
  resetKnowledge();
  _seedStartingBonds(cast, seed);

  const traitors = selectTraitors(cast, { traitorCount }, rng);
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  cast.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
  // THE ONE MOMENT THREE PEOPLE LEARN EACH OTHER WITH CERTAINTY, kept for the
  // screen that draws it. `seedTraitorKnowledge` is the first of the engine's
  // three sanctioned `public` alignment writers (tests/tr-missions.test.js
  // names the closed set); this line stores no belief and creates no
  // certainty -- it records who was standing there when that one did.
  const selection = _selectionRecord(1, cast, traitors);

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
  // EVIDENCE SOURCE 4, and it runs on night one like every other beat of the
  // afternoon. It reads the mission that has JUST happened rather than the
  // round that just closed, so it is not part of the order contract below and
  // does not disturb it — and it takes its acceptance rolls off the MISSION
  // stream, so it displaces no game draw either. What it does change is what
  // the room believes, which is the point of it.
  missionEvidence(ep, missionRng);
  castle1.push(...runWindow('journey-back', ep, castleRng));
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
  expireShields(ep);
  // A Dagger is NOT expired here — that is the whole difference between the
  // two powers, and the reason one of them can reach the endgame. What this
  // does is close the record of anybody who left the castle this round still
  // carrying one, so that 'held' keeps meaning "unspent, and its owner is
  // still standing". It runs after the night rather than after the table
  // because a round takes two people and this has to catch both.
  settleDaggers(ep);
  castle1.push(...runWindow('night', ep, castleRng));
  scoreMission(ep, mission1);
  _recordEpisode(ep, { banished: null, night: n1, mission: mission1, castle: castle1,
    selection });
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
    // tests/tr-missions.test.js asserts directly.
    castleEvents.push(...runWindow('journey-out', ep, castleRng));
    const mission = runMission(ep, missionRng);
    // Source 4. Same round as the mission it reads, before the table it feeds.
    missionEvidence(ep, missionRng);
    castleEvents.push(...runWindow('journey-back', ep, castleRng));
    castleEvents.push(...runWindow('evening', ep, castleRng));
    const r = runRoundTable(ep, rng);
    if (!r) break;   // an empty castle: nothing left to banish
    // The reveal cascade has already run inside runRoundTable by the time
    // after-table fires — that is the whole point of the window: someone
    // was just revealed.
    castleEvents.push(...runWindow('after-table', ep, castleRng));
    const night = _night(ep, rng);
    // Same pair, same order, same stream — see the note on night one.
    shieldEvidence(ep, missionRng, night);
    expireShields(ep);
    settleDaggers(ep);   // see night one: the banished and the murdered, both
    castleEvents.push(...runWindow('night', ep, castleRng));
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
    _recordEpisode(ep, { banished: r.banished, night, mission, castle: castleEvents });
    log.push({ ep, banished: r.banished, wasTraitor: r.wasTraitor, ...night, mission,
      alive: alive.length, aliveAtVote: alive.length, traitorsAtVote: tr,
      castleEvents, budget: { ...gs.tr.roundBudget } });
  }

  // THE ENDGAME (spec 8), and it is the reason a season can now END rather
  // than merely stop. The loop above exits on the format's own conditions —
  // the pact is dead, or the room is down to three, or the Faithfuls no longer
  // outnumber them — and every one of those used to be where the record simply
  // stopped being written. From here the survivors are asked the private
  // question instead of the public one, and the money finally has a reader.
  const mandatedRounds = gs.tr.rounds.length;
  const endgame = runEndgame(ep, rng);
  // The final table's private question, and it is scored from the CHOICES
  // rather than from who left: a betrayal the room then failed to carry out
  // was still chosen, and `endgameChoice` is the only place that fact exists.
  scoreEndgame(endgame);
  // `endgame: true` is what keeps the alignment off the finale tables' records
  // -- see `_tableRecord`. It is passed rather than inferred, because the
  // rounds on `gs.tr.rounds` carry no flag: the copies in `endgame.rounds` are
  // where `endgame: true` is stamped, and this loop is holding the copies.
  for (const r of endgame.rounds || []) {
    _recordEpisode(r.ep, { banished: r.banished, endgame: true });
  }
  // THE PHASE, ON THE LAST ROW THE SEASON WROTE. The endgame can force six
  // extra tables or none at all -- when the first ask is unanimous no row is
  // written for it -- so there is no episode number this can be attached to.
  // The last row is where a viewer clicking forward arrives, and it is the
  // only row that exists in every one of those cases.
  const _rows = gs.episodeHistory || [];
  if (_rows.length) _rows[_rows.length - 1].tr.endgame = _endgameRecord(endgame);

  return {
    traitors,
    log,
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
