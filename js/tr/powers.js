// ══════════════════════════════════════════════════════════════════════
// tr/powers.js — the Shield, and the half of the room that saw it won
// ══════════════════════════════════════════════════════════════════════
//
// Spec 7.3. A Shield blocks the NEXT MURDER ONLY. It never protects at the
// Round Table, it is not transferable, it expires unused, and it is won in a
// mission. Every one of those is a restriction rather than a feature, and the
// last one is the whole design:
//
// THE ARMOURY IS NOT REBUILT AND MUST NOT BE. The real show shipped a version
// where Shields could be taken from a room every night, and the dominant
// strategy collapsed inside one season: everybody takes one, nobody says
// anything, and the Traitors' one weapon stops working. It was removed from
// the format for that reason. A mission-won Shield has the trade-off the
// Armoury lacked — you are safe tonight, and tomorrow you are the person who
// was safe, which is a considerably worse thing to be.
//
// WHAT THIS FILE ADDS TO THE ONES ALREADY BUILT. `grantShield()` and
// `isShielded()` live in js/tr/murder.js and are already wired into
// `resolveMurder`, which blocks the kill, spends the Shield and records the
// attempt in `gs.tr.blockedMurders`. NONE of that is re-implemented here. What
// is here is the acquisition path and the VISIBILITY MODEL — who saw it won —
// and the reads that visibility makes possible.
//
// ── SEMI-VISIBLY, AND WHY THAT IS THE MECHANIC ──────────────────────────
//
// A Shield the whole castle saw is an announcement; a Shield nobody saw is a
// coin the engine flips in private. The format's Shield is neither. It is
// found by one person breaking away from a mission, in front of some of the
// room and behind the backs of the rest — so the castle splits into people who
// can explain what happened that night and people who cannot.
//
// A shielded player surviving a night is INFORMATION, and which information
// depends entirely on whether you saw the Shield:
//
//   * You saw it, and nobody died. The Traitors went for the one person they
//     could not take. You now know WHO they chose — which the rest of the
//     castle does not — and every name that pushed them at the last table is
//     a name that wanted what the Traitors wanted. This is `pushedThenDied`
//     (js/tr/deduction.js) reached one step later, and it is why
//     murderEvidence's `!blocked` suppression is correct THERE and wrong here:
//     the room at large cannot name the target of a blocked murder, and a
//     witness can.
//   * You saw it, and somebody else died. The Traitors had a protected player
//     in the room and went around them. Either they were unlucky, or they knew
//     — and knowing means being one of the people who saw. So the holder ends
//     the night carrying a suspicion they bought with their own prize. This is
//     the liability the mission-won Shield exists to create, and it is priced
//     LOW on purpose: "they steered around you" has an innocent explanation on
//     nearly every night it fires (see P.shieldUntested).
//   * You did NOT see it. A blocked night is public — nobody died and everyone
//     can count chairs — so you learn a Shield was live, and that is all. You
//     cannot name the holder, so you form no belief about a person at all.
//
// That asymmetry is asserted directly in tests/tr-powers.test.js as a rule
// over every write: an observer of a Shield read is ALWAYS one of the recorded
// witnesses, never anybody else.
//
// ── WHAT IS DELIBERATELY NOT MODELLED ───────────────────────────────────
//
// A block does not CLEAR its target, and the omission is not laziness. This
// engine has no clearing primitive: `learn()` routes every non-`public`
// alignment write through `_assess`, whose valence comes from ground truth, so
// "write a belief about an innocent" lands as a protective `false` for a sharp
// reader and as SUSPICION for everybody else — at the ceiling, about seven
// readers in ten come away suspecting the person the evidence exonerates.
// Writing "the Traitors tried to kill them, so they are Faithful" through that
// door would produce the opposite of what the sentence says. Building a
// clearing channel is a design act with its own price sweep, and it is not
// this task's. What the block DOES emit is the read about the pushers, which
// the existing vocabulary already supports.
//
// ── RNG ─────────────────────────────────────────────────────────────────
//
// Every draw here comes off the MISSIONS' stream (headless.js `_missionRngFor`),
// for the reason that file's comment gives at length: a draw taken from the
// game's own stream re-rolls every murder, ballot and banishment after it, and
// the calibration bands stop being able to tell a content change from an
// engine change. The Shield changes seasons — that is its job — but it changes
// them by changing DECISIONS, never by changing which numbers are drawn. The
// conclave's blind spot below is written as a score penalty rather than as a
// filter on the candidate list for exactly this reason: `formPreference` draws
// once per candidate, so removing a name would consume one draw fewer and
// shift the whole stream from a gameplay edit.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { learn, ALIGNMENT_CRED_CEILING } from '../knowledge.js';
import { alignmentFactId, alignmentAt } from './roles.js';
import { grantShield } from './murder.js';

/**
 * How loud each Shield-shaped inference is allowed to be.
 *
 * Both are alignment beliefs and both are therefore capped by `learn()` at
 * ALIGNMENT_CRED_CEILING whatever is written here — the ceiling is imported
 * rather than copied so that a change to it moves this channel with it instead
 * of stranding it at an old number (the same correction `M` in deduction.js
 * carries).
 */
const P = {
  // THE SAME FACT `pushedThenDied` PRICES, reached one inference later, and it
  // earns the same number for the same reason: you said their name at the
  // table, and that night the Traitors came for them. The extra step — knowing
  // the attempt landed on THIS person — is not a guess for a witness; they
  // watched the Shield being won. What separates this channel from
  // `pushedThenDied` is not credibility but AUDIENCE: only the witnesses can
  // run it at all.
  pushedThenNearlyDied: ALIGNMENT_CRED_CEILING,
  // A MUTTER, AND IT SHOULD STAY ONE. "The Traitors did not come for the one
  // person they could not have killed anyway" is true on almost every night a
  // Shield goes unused, including all the nights where the holder is exactly
  // who they say they are. It is priced as a rumour because it is one, and
  // because a channel this often wrong at the ceiling would be a
  // false-positive generator with no compensating signal — the shape
  // `clash-traced` was deleted for.
  shieldUntested: 0.42,
};

/**
 * The tiers, and the reason two of the three cuts are COUNTS rather than shares.
 *
 * Written share-only first, and the first dump caught it: "Axel was seen —
 * barely, and by the only people paying attention" printed over FOUR witnesses,
 * because four out of fourteen is under any share cut you like and "barely" is
 * a claim about a number of people rather than a proportion of them. A castle
 * of twenty and a castle of six do not agree about what a share means, and the
 * prose is written in people.
 *
 * So: nobody, one or two, several, or most of the room — the first three
 * decided by the count and the last by the share, which is the only one of the
 * four that IS a proportion ("most of the castle" is meaningless as a count).
 */
const SEEN_FEW_MAX = 2;
const SEEN_MOST = 0.55;

/**
 * How likely each kind of onlooker is to see the find, per point of intuition.
 *
 * A teammate is standing in the same cellar and has already noticed the gap in
 * the line where somebody used to be working; the far team is across the yard
 * with its own problem. Proportional in intuition at both ranges, never a
 * threshold — the sharp ones on the far side of the mission catch it more
 * often than the vacant ones standing next to it, which is the right ordering
 * and not an accident of the constants.
 */
const SAW = {
  teamBase: 0.26, teamPerPoint: 0.34,
  farBase: 0.04, farPerPoint: 0.18,
};

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const stat = (name, key) => {
  const v = pStats(name)?.[key];
  return typeof v === 'number' && isFinite(v) ? v : 5;
};

// ── prose ───────────────────────────────────────────────────────────────
//
// EVERY LINE HERE IS A CLAIM ABOUT THE WITNESS LIST, AND THE POOL IT COMES
// FROM IS CHOSEN BY THAT LIST. This plan's standing requirement — a sentence
// asserting a fact about season state must agree with that state — is honoured
// the way Tasks 1 and 2 honoured it: at source, by making the contradiction
// unrepresentable rather than by asserting against it afterwards. "Not one
// person saw it" is reachable ONLY from `witnesses.length === 0`, and "half the
// hall" only from a count that is actually half the hall. The tier is RECORDED
// on the ledger (`visibility`) and read back by the test, never re-derived from
// the count with a second copy of these cuts — Task 2's duplicate-source
// defect, which was the third of its kind in this project.
const SEEN_LINES = {
  unseen: [
    'Nobody saw {who} do it. Not one person in the castle can say where {they} went or what {they} came back with.',
    '{who} was alone with it, start to finish, and the rest of the room was looking the other way for all of it.',
    'It happened in a corner of the afternoon nobody was watching, and {who} came back to the line as though {they} had never left it.',
    'Whatever {who} found down there, {who} found it unobserved — which is the only way anybody would want to find it.',
  ],
  few: [
    'One or two people clocked {who} slipping away, and rather fewer worked out why.',
    'A couple of heads turned when {who} came back up. That was the whole of the audience.',
    '{who} was seen — barely, and by the only people paying attention — and the rest of the castle has no idea.',
    'It was not quite private. A pair of eyes followed {who} back to the line and said nothing about it.',
  ],
  some: [
    'Several people watched {who} walk back with it, and they will tell the ones who missed it by dinner.',
    'Enough of the room saw to make it a fact for some of them and a rumour for the rest.',
    '{who} did not get away with it quietly. A handful of people know exactly what {they} is carrying tonight.',
    'It was seen by more people than {who} would have chosen and fewer than would have made it common knowledge, which is the worst available number.',
  ],
  most: [
    'Most of the castle saw it happen. {who} may as well have announced it from the steps.',
    'There was no hiding this one: the whole line stopped working to watch {who} come back up.',
    '{who} found it in front of an audience, and the audience has been discussing it ever since.',
    'Everybody who mattered saw {who} lift it out. By nightfall the ones who did not will have been told.',
  ],
};

const _render = (tpl, who, pr) => tpl
  .split('{who}').join(who)
  .split('{they}').join(pr.sub)
  .split('{them}').join(pr.obj)
  .split('{their}').join(pr.posAdj);

const pick = (rng, arr) => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];

/** Which tier of "who saw it" this actually was. Recorded, never recomputed. */
function _visibility(seen, roomSize) {
  if (seen === 0) return 'unseen';
  const share = roomSize > 0 ? seen / roomSize : 1;
  if (share >= SEEN_MOST) return 'most';
  return seen <= SEEN_FEW_MAX ? 'few' : 'some';
}

/**
 * Award the Shield found in a mission, and work out who saw it happen.
 *
 * `teams` is the mission's own team split, because proximity is the whole
 * visibility model: the people carrying the other end of the same rope see the
 * gap where the finder used to be, and the far team has its own afternoon to
 * worry about.
 *
 * Returns the ledger record. The Shield itself is granted through
 * `grantShield()` in js/tr/murder.js — the block mechanic is already built and
 * wired into `resolveMurder`, and re-implementing it here would be a second
 * copy of a rule that already has one.
 *
 * `pactAware` READS GROUND TRUTH, and that is legitimate for the same reason
 * `formPreference` and the Chess mission's dilemma are: the ENGINE may know who
 * the Traitors are, the castle may not, and nothing in js/tr/castle/ imports
 * this file. It is not a belief and it never becomes one — it records whether
 * anybody who saw the Shield will be sitting at the conclave tonight, which is
 * the difference between a wasted night and an avoided one.
 */
export function awardShield(holder, teams, ep, rng) {
  if (!gs?.tr || !holder) return null;
  const living = gs.activePlayers || [];
  const mine = (teams || []).find(t => (t.members || []).includes(holder));
  const witnesses = [];
  for (const name of living) {
    if (name === holder) continue;
    const near = !!mine && mine.members.includes(name);
    const p = near
      ? SAW.teamBase + SAW.teamPerPoint * (stat(name, 'intuition') / 10)
      : SAW.farBase + SAW.farPerPoint * (stat(name, 'intuition') / 10);
    if (rng() < clamp01(p)) witnesses.push(name);
  }

  const roomSize = Math.max(0, living.length - 1);
  const rec = {
    // `roomSize` is on the record because the tier is a judgement about a
    // PROPORTION and the room shrinks all season: four witnesses is most of a
    // final six and a corner of a night-one twenty. Anything reading this back
    // — the measurement, later the VP — needs the denominator the tier was
    // decided against, not the one the castle happens to have when it asks.
    ep, holder, witnesses, roomSize,
    visibility: _visibility(witnesses.length, roomSize),
    // Recorded rather than derived at read time, so the conclave reads a fact
    // instead of re-deriving the witness rule with its own copy of it.
    pactAware: witnesses.some(n => alignmentAt(n, ep) === 'traitor'),
    outcome: 'pending',
  };
  rec.seenLine = _render(pick(rng, SEEN_LINES[rec.visibility]), holder, pronouns(holder));
  (gs.tr.shields ||= []).push(rec);
  grantShield(holder, ep);
  return rec;
}

/**
 * Test-only ablation of the READS, leaving the Shield itself alone.
 *
 * The third arm of the attribution this task owes its own numbers: a Shield
 * changes a season two ways at once — it stops a murder and the pact steers
 * around it, and separately the people who saw it won form beliefs off what
 * the night did. Only an arm with the mechanic live and the channel silent can
 * say which of the two moved a band. It is also what lets the calibration
 * report a coverage effect as a coverage effect rather than as a claim about
 * information.
 *
 * Nothing in the show may call this. Same contract as `_setMissionsEnabled`.
 */
let _reads = true;
export function _setShieldReadsEnabled(on) { _reads = on !== false; }

/** The Shield live tonight, or null. At most one is ever live. */
export function liveShield(ep) {
  return (gs.tr?.shields || []).find(s => s.ep === ep && s.outcome === 'pending') || null;
}

/**
 * What ONE Traitor knows about tonight's Shield, and nothing more.
 *
 * Returns the holder's name if THIS Traitor is on the recorded witness list,
 * and null otherwise — including when a Shield is live and this particular
 * Traitor was on the far side of the yard when it was found.
 *
 * PER TRAITOR AND NOT PER PACT, and the difference is the mechanic rather than
 * a detail. A pact-wide check makes one witness enough to protect the whole
 * conclave, which at the measured witness rate is nearly every night: shields
 * blocked ONE murder in two hundred seasons, and the strongest read the format
 * has was written but unreachable. Per Traitor, the conclave's decision is
 * resolved on social weight (`runConclave`), so a Traitor who did not see the
 * Shield can argue for the protected name and WIN — and then the pact spends
 * its night on a wall, which is precisely what a Shield is for. It also puts
 * the value where the fiction puts it: seeing a Shield awarded is worth a
 * night to the person who saw it, not to their friends.
 *
 * Read by `formPreference` in js/tr/murder.js as a SCORE PENALTY rather than as
 * a filter on the candidate list, so the conclave takes an identical number of
 * rng draws whether a Shield exists or not.
 */
export function shieldSeenBy(traitor, ep) {
  const s = liveShield(ep);
  if (!s || s.holder === traitor) return null;
  return s.witnesses.includes(traitor) ? s.holder : null;
}

/**
 * What the people who saw the Shield make of the night that followed.
 *
 * Runs AFTER the night and BEFORE the Shield expires, on the missions' rng
 * stream. Emits at most two shapes, and never to anybody outside the recorded
 * witness list:
 *
 *   blocked  — the witness knows the Traitors chose the holder. Everyone who
 *              pushed the holder at the last table wanted what the Traitors
 *              wanted. The same fact `pushedThenDied` prices, at the same
 *              price, to a much smaller audience.
 *   unused   — the witness knows the Traitors had a protected player in front
 *              of them and went elsewhere. A mutter about the holder.
 *
 * Returns the beliefs actually formed, for measurement.
 */
export function shieldEvidence(ep, rng = Math.random, night = null) {
  if (!_reads) return [];
  const s = liveShield(ep);
  if (!s) return [];
  const living = gs.activePlayers || [];
  const formed = [];
  // Set on EVERY resolved Shield, including the ones nobody drew anything
  // from — a field that is 0 on a quiet night and `undefined` on a quieter one
  // is two states meaning the same thing (Task 2's second prose defect).
  s.beliefsFormed = 0;

  // NO CONCLAVE, NOTHING TO READ, and this gate was written from a dump rather
  // than from first principles. The Traitors get ONE action a night, so a night
  // spent making a recruitment offer is a night nobody was chosen at all — and
  // "they went nowhere near the one person they could not touch" printed over
  // one of those, which is false in the most direct way available: nobody was
  // gone near. The night is passed in rather than reconstructed from the round
  // record because night one leaves no round record by format, and a read that
  // silently could not fire on night one would be a suppression nobody wrote.
  if (!night || !night.murderTarget) return [];

  const blocked = !!night.blocked && night.murderTarget === s.holder;
  const witnesses = s.witnesses.filter(n => living.includes(n));

  if (blocked) {
    // The last table's ballots and accusations, which is where "you pushed
    // them" is recorded. The night is written back onto the round the table
    // just produced, so it is that round — not `ep - 1`.
    const round = (gs.tr?.rounds || []).filter(r => r.ep === ep).pop();
    const pushers = new Set([
      ...((round?.accusations) || []).filter(a => a.target === s.holder).map(a => a.accuser),
      ...((round?.ballots) || []).filter(b => b.channel === 'banishment' && b.voted === s.holder)
        .map(b => b.voter),
    ]);
    for (const pusher of pushers) {
      if (!living.includes(pusher)) continue;
      for (const observer of witnesses) {
        if (observer === pusher || observer === s.holder) continue;
        const belief = learn(observer, alignmentFactId(pusher), {
          source: `wanted ${s.holder} gone the night the Traitors came for ${s.holder}`,
          sourceType: 'deduced', confidence: P.pushedThenNearlyDied, ep, rng,
        });
        if (belief) formed.push({ observer, subject: pusher, kind: 'pushed-then-nearly-died', ep });
      }
    }
  } else if (s.visibility === 'some' || s.visibility === 'most') {
    // THE LIABILITY READ NEEDS THE ROOM TO BE TALKING ABOUT IT, and that gate
    // is the visibility model doing a second job rather than a tuning knob.
    //
    // A theory of this shape — "they went nowhere near the one person they
    // could not have killed" — is a thing said over dinner, and a Shield two
    // people happened to notice does not get said over dinner. What those two
    // hold is KNOWLEDGE, not a theory: they still steer the conclave if they
    // are Traitors (`shieldSeenBy`), and they still run the blocked-night read
    // above, which is public in a way this is not.
    //
    // WHAT IT COSTS, AND WHY THE GATE IS HERE AT ALL. Ungated, the channel
    // fired on every Shield and moved early lift by +0.87pp over sixteen
    // paired 200-season blocks (t = 2.28, 11/16) — under this project's
    // three-sd bar, so not a demonstrated regression, but consistently signed
    // and on the one band whose whole point is that this format's room must
    // NOT be sharp in week one. The movement is COVERAGE rather than
    // information, and that is measured rather than argued: an ablation with
    // the Shield live and this channel silent reproduces the base number
    // (−0.33pp, t = −1.08), and more beliefs about anybody raise aggregate lift
    // through `_assess`'s ground-truth clearing, which Task 2 recorded as the
    // same effect from a different channel.
    //
    // The gate takes about 28% of Shields out of the channel (`few` and
    // `unseen` between them), which is a smaller cut than it sounds and a
    // rule rather than a price — the thing being changed is WHEN the room has
    // a theory, not how loud it is. What remains is +0.72pp on early lift
    // (t = 1.39 over eight paired blocks) against a pinned ceiling of 10pp with
    // the head at 4.60. Reported, not tuned away: chasing a sub-noise drift
    // with a constant is how a measured number becomes a fitted one.
    for (const observer of witnesses) {
      const belief = learn(observer, alignmentFactId(s.holder), {
        source: `was the one person the Traitors could not touch, and they went nowhere near ${s.holder}`,
        sourceType: 'rumor', confidence: P.shieldUntested, ep, rng,
      });
      if (belief) formed.push({ observer, subject: s.holder, kind: 'shield-untested', ep });
    }
  }

  s.beliefsFormed = formed.length;
  return formed;
}

/**
 * Close tonight's Shield. THE NEXT MURDER ONLY — nothing carries over.
 *
 * `resolveMurder` already deletes the holder from `shieldedThisRound` when the
 * Shield actually blocked something, so this is the far commoner case: it was
 * never tested, and it is gone anyway. That is what "expires unused" means, and
 * it is the whole reason a Shield is a gamble rather than a purchase.
 *
 * The set is cleared WHOLESALE rather than by name, so a future power that
 * grants two of them cannot leave one behind by arithmetic.
 */
export function expireShields(ep) {
  if (!gs?.tr) return null;
  const s = liveShield(ep);
  if (s) {
    s.outcome = (gs.tr.blockedMurders || []).some(b => b.ep === ep && b.target === s.holder)
      ? 'blocked' : 'expired';
  }
  if (gs.tr.shieldedThisRound instanceof Set) gs.tr.shieldedThisRound.clear();
  else gs.tr.shieldedThisRound = new Set();
  return s;
}
