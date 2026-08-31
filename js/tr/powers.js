// ══════════════════════════════════════════════════════════════════════
// tr/powers.js — the Shield, the Dagger, and the half of the room that saw
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
import { suspicion, knowsAlignmentOf, seerEvidence, seerClaimEvidence } from './deduction.js';
import { lineFor, _lineHash } from './castle/lines.js';

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
// AND THE POOL IS SHARED WITH THE DAGGER, SO IT MUST NOT NAME A RELIC. From
// the top of the stair nobody can tell what came out of the casket, which is
// why one pool is right for both — but it is also why the third `some` line
// used to end "exactly what she is carrying TONIGHT" and had to stop. Tonight
// is a true thing to say about a Shield and a false one about a Dagger, which
// does not expire, and it printed over a woman who was still carrying hers
// when she was banished the following evening. Found by dumping dagger seasons
// and reading them. Every line here is about WHO SAW and nothing else.
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
    '{who} did not get away with it quietly. A handful of people know exactly what {they} came back up that stair with.',
    'It was seen by more people than {who} would have chosen and fewer than would have made it common knowledge, which is the worst available number.',
  ],
  most: [
    'Most of the castle saw it happen. {who} may as well have announced it from the steps.',
    'There was no hiding this one: the whole line stopped working to watch {who} come back up.',
    '{who} found it in front of an audience, and the audience has been discussing it ever since.',
    'Everybody who mattered saw {who} lift it out. By nightfall the ones who did not will have been told.',
  ],
};

// {They} IS HERE BECAUSE A LINE PRINTED IT RAW. The Shield's pools never open
// a sentence with a pronoun, so the capitalised forms were never needed and
// never noticed missing; the Dagger's do, and the first dump of a dagger
// season read "Chase did not wait for the ballots. {They} put it on the table"
// to twelve seasons in a row. Every form the pronoun helper offers is wired,
// not just the ones today's pools happen to use.
const _render = (tpl, who, pr) => tpl
  .split('{who}').join(who)
  .split('{they}').join(pr.sub)
  .split('{them}').join(pr.obj)
  .split('{their}').join(pr.posAdj)
  .split('{They}').join(pr.Sub)
  .split('{Them}').join(pr.Obj)
  .split('{Their}').join(pr.PosAdj);

const pick = (rng, arr) => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];

/** Which tier of "who saw it" this actually was. Recorded, never recomputed. */
function _visibility(seen, roomSize) {
  if (seen === 0) return 'unseen';
  const share = roomSize > 0 ? seen / roomSize : 1;
  if (share >= SEEN_MOST) return 'most';
  return seen <= SEEN_FEW_MAX ? 'few' : 'some';
}

/**
 * Who saw somebody break away from a mission and come back carrying something.
 *
 * ONE ROLL PER LIVING PLAYER, IN ROSTER ORDER, holder skipped — and the draw
 * pattern is part of the contract rather than an implementation detail. The
 * Reliquary hands out either a Shield or a Dagger on the same afternoon by the
 * same act, so both awards must consume the same draws in the same order; if
 * they did not, which relic was down there would shift the missions' stream
 * from that afternoon on and every later mission, tell and pot payment in the
 * season would be a different number. The relic changes what somebody is
 * holding, never which numbers the season draws.
 */
function _whoSaw(holder, teams, living, rng) {
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
  return witnesses;
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
  const witnesses = _whoSaw(holder, teams, living, rng);

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

  // READ OFF THE LEDGER, NOT OFF THE NIGHT'S SENTENCE (whole-plan review, F2).
  //
  // This was `!!night.blocked && night.murderTarget === s.holder`, which
  // assumes a night has exactly one target — and the `double` variant has two.
  // When the SECOND victim is the one holding the Shield, murder.js writes a
  // `blockedMurders` record for them while `resolveMurder` correctly returns
  // `blocked: false` (the first victim did die) and `murderTarget` is the
  // first victim's name. So the holder was chosen, went for, and saved, and
  // this branch read `false` and narrated the `unused` line instead: "the
  // Traitors had a protected player in front of them and went elsewhere",
  // over a night they went straight at them. That is the ledger-disagreement
  // class this plan carries a standing requirement for — the shield record
  // says `outcome:'blocked'` while the sentence says they were never
  // approached. Reproduced at seeds 613 (ep3) and 1086 (ep5); 2 in 1,200
  // seasons, 0.60% of doubles.
  //
  // `gs.tr.blockedMurders` is the one place every block is written, by every
  // path, whichever slot of whichever variant it happened in. Asking it about
  // THIS HOLDER cannot go out of step with it the way a reconstruction from
  // `night.blocked` did.
  const blocked = (gs.tr?.blockedMurders || []).some(b => b.ep === ep && b.target === s.holder);
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

// ══════════════════════════════════════════════════════════════════════
// THE DAGGER — spec 7.3, and the one power that is supposed to be OLD when
// it is finally used
// ══════════════════════════════════════════════════════════════════════
//
// "Doubles your vote at the next banishment. Historically decides seasons by
// breaking 3-3 endgame deadlocks." Those are two sentences of one bullet and
// they pull against each other, so the reconciliation is written down here
// rather than left implicit in a constant.
//
// A power handed over on the afternoon it is found and spent that same evening
// can never break a 3-3 deadlock, because a room of six is eight afternoons
// after the room the Reliquary usually runs in. So the Dagger is a KEPT thing:
// it is won, it is carried, and "the next banishment" is the next banishment
// after its holder draws it. Everything below exists to make the second
// sentence true — the acquisition is gated to a castle small enough for one
// extra vote to matter, the holder's own nerve decides how much smaller they
// are prepared to let it get, and nothing expires it. The commonest ending for
// a Dagger is that its holder is murdered still carrying it, which is the
// right shape for a power whose whole value is in the last three tables.
//
// ── WHAT IT IS NOT ──────────────────────────────────────────────────────
//
// IT IS NOT A SECOND BALLOT, AND THAT DISTINCTION IS THE WHOLE
// IMPLEMENTATION. Ballots at the Round Table are read out loud, one at a time,
// and they are the only `public`-credibility facts this game has:
// `ballotEvidence` reads them, `shieldEvidence` reads them, and the entire
// deduction model is built on their being what the room actually heard. A
// doubled vote that appended a second ballot would fabricate a public fact — a
// name said twice by one mouth — and every belief downstream of it would be
// reasoning from something that did not happen.
//
// So the Dagger is implemented in `runRoundTable`'s TALLY and nowhere near the
// ballot. One voter, one name, said once, recorded once, read aloud once; the
// COUNTING is what changes. `daggerWeights()` is the only thing the table asks
// for and the only thing it gets.
//
// IT WRITES NO BELIEFS AND NO BONDS. Not an omission — a mission writes no
// bonds for the same reason (js/tr/missions.js), and it is why the calibration
// bands can still tell an engine change from a content change: a bond write
// feeds `bondResistance()` into `suspicion()`, and this task would then be
// moving the deduction bands from a power that has nothing to do with
// deduction. What the Dagger does to the room it does through the tally and
// through the conclave steering below, both of which are decisions rather than
// beliefs.
//
// ── RNG ─────────────────────────────────────────────────────────────────
//
// Both draws — who saw it, and how long its holder will sit on it — come off
// the MISSIONS' stream at the moment it is awarded. The table itself takes NO
// draw: `daggerWeights()` reads `drawAt`, a number already written down, and
// compares it with the size of the room. That is the same discipline the
// Shield's conclave penalty follows and for the same reason. A single roll
// inside `runRoundTable` would displace every ballot, murder and banishment
// after it in the game's own stream, and a season in which a Dagger existed
// could no longer be compared with the season in which it did not.

/**
 * How many votes a drawn Dagger counts for. Exported so the guard reads the
 * number under test rather than carrying its own copy of it — a test that
 * recomputes the rule it is checking is the duplicate-source defect this
 * project has now found three times.
 */
export const DAGGER_VOTES = 2;

/**
 * The castle has to be small before the vault has a Dagger in it.
 *
 * NOT A DIFFICULTY KNOB — it is the mechanism by which the spec's second
 * sentence is true at all. Measured over 200 seasons, the Reliquary runs 428
 * times and the searcher comes back with something on 334 of them; if every
 * one of those finds could be a Dagger, most Daggers would be won in a room of
 * eighteen, where a doubled vote is a rounding error its holder would then
 * have to survive eight more tables to spend. Gated at twelve, a Dagger is won
 * late enough to be worth carrying and early enough that carrying it is a
 * decision.
 *
 * WHAT THE GATE COSTS THE SHIELD, because an archetype's output is a
 * denominator and this splits one: the Reliquary yields ONE relic, so every
 * Dagger is a Shield that did not happen. The numbers are in
 * task-4-report.md. That is the honest cost of NOT adding an eighth
 * archetype, which would instead have diluted `blind-chess` and taken a share
 * of Task 2's measured +3.28pp off a calibration band from a task that never
 * touched the channel.
 */
const DAGGER_FROM_LIVING = 12;

/**
 * How small a room a holder will let it get to before drawing it.
 *
 * The floor is four because a season stops at three and a Dagger nobody could
 * ever draw is a prop; the ceiling is nine because above that a second vote
 * stops deciding anything and the holder is simply impatient. Proportional in
 * boldness and inversely in temperament — a bold, hot player draws it the
 * first night it might help, a patient one waits for the room where it cannot
 * fail to — with a noise term wide enough that neither is certain, because the
 * interesting Dagger is the one drawn a table too early.
 *
 * ROLLED ONCE, AT ACQUISITION, AND WRITTEN DOWN. The table must not roll: see
 * the RNG note above.
 */
const DRAW_FLOOR = 4;
const DRAW_CEIL = 9;
const DRAW_NERVE = 0.35;
const DRAW_PATIENCE = 0.35;
const DRAW_NOISE = 0.5;

/**
 * What the room hears when somebody draws it.
 *
 * The ACQUISITION is semi-visible — the same witness model the Shield uses,
 * because it is the same act of walking away from a carry — but the DRAW is
 * public, and it has to be. The ballots are read out one at a time in front of
 * everybody; a room that heard three names for one player and two for another
 * and then watched the first one leave has been shown arithmetic that does not
 * work. The Dagger is declared, out loud, and then the ballots are read
 * normally.
 */
const DRAW_LINES = [
  '{who} did not wait for the ballots. {They} put it on the table in front of everybody first, and the room went very quiet.',
  'Before a single name was read, {who} laid it down where the whole table could see it. Two votes tonight, and everybody knew whose.',
  '{who} took it out early, before the debate had properly finished, and let it sit there while people worked out what it meant.',
  'It came out of a pocket and onto the wood without a word, and after that nobody said anything that was not about it. {who} was voting twice.',
];

/**
 * Award the Dagger found in a mission.
 *
 * Same afternoon, same act, same witnesses, same draws in the same order as
 * `awardShield` — see `_whoSaw`. What differs is entirely on the far side of
 * it: nothing is granted to js/tr/murder.js, nothing expires, and a `drawAt`
 * is rolled here so that the table never has to.
 */
export function awardDagger(holder, teams, ep, rng) {
  if (!gs?.tr || !holder) return null;
  const living = gs.activePlayers || [];
  const witnesses = _whoSaw(holder, teams, living, rng);
  const roomSize = Math.max(0, living.length - 1);

  const impulse = clamp01(0.5
    + DRAW_NERVE * ((stat(holder, 'boldness') - 5) / 5)
    - DRAW_PATIENCE * ((stat(holder, 'temperament') - 5) / 5)
    + (rng() - 0.5) * DRAW_NOISE);

  const rec = {
    ep, holder, witnesses, roomSize,
    visibility: _visibility(witnesses.length, roomSize),
    pactAware: witnesses.some(n => alignmentAt(n, ep) === 'traitor'),
    drawAt: DRAW_FLOOR + Math.round((DRAW_CEIL - DRAW_FLOOR) * impulse),
    outcome: 'held', playedEp: null, target: null, banished: null,
  };
  rec.seenLine = _render(pick(rng, SEEN_LINES[rec.visibility]), holder, pronouns(holder));
  rec.drawLine = _render(pick(rng, DRAW_LINES), holder, pronouns(holder));
  (gs.tr.daggers ||= []).push(rec);
  return rec;
}

/**
 * Whether this afternoon's vault has a Dagger in it rather than a Shield.
 *
 * ONE AT A TIME, and the second clause is not belt and braces. A Dagger does
 * not expire, so without it a late season with two Reliquaries in it would put
 * two of them in two pockets — and `daggerWeights` can only ever draw the
 * first, so the second would be a power that existed, was recorded, was
 * witnessed, and could never be used. That is the exact shape of the
 * pact-wide blind spot Task 3 measured and rejected: written but unreachable.
 */
export function daggerAfternoon(living) {
  return (living || []).length <= DAGGER_FROM_LIVING && !heldDagger();
}

/** The Dagger still in somebody's pocket, or null. At most one is ever held. */
export function heldDagger() {
  return (gs.tr?.daggers || []).find(d => d.outcome === 'held') || null;
}

/**
 * Close out any Dagger whose holder has left the castle still carrying it.
 *
 * THE COMMONEST ENDING, and it is recorded as its own outcome rather than left
 * as 'held' forever, because 'held' at the end of a season has to keep meaning
 * one thing: it got to the end unspent and its holder is still standing. A
 * record that used the same word for a dead man's pocket and for a live
 * finalist's would make the measurement this task owes unanswerable — the
 * shape of Task 2's field that was `0` on a quiet night and `undefined` on a
 * quieter one.
 */
export function settleDaggers(ep) {
  const living = gs.activePlayers || [];
  for (const d of (gs.tr?.daggers || [])) {
    if (d.outcome === 'held' && !living.includes(d.holder)) {
      d.outcome = 'lost';
      d.lostEp = ep;
    }
  }
}

/**
 * What ONE Traitor knows about a Dagger in play, and nothing more.
 *
 * Per Traitor and not per pact, for exactly the reasons `shieldSeenBy` gives
 * at length: a pact-wide check hands one witness's knowledge to everybody, and
 * the conclave's disagreement — the thing that makes `conclaveTension` a
 * record rather than a schedule — stops happening.
 */
export function daggerSeenBy(traitor, ep) {
  if (!_steering) return null;
  const d = heldDagger();
  if (!d || d.holder === traitor) return null;
  if (ep != null && d.ep > ep) return null;
  return d.witnesses.includes(traitor) ? d.holder : null;
}

/**
 * Test-only ablation of the conclave's interest in a Dagger it saw won, so the
 * band arm can separate "a Dagger exists" from "the pact went after it".
 * Same contract as `_setShieldReadsEnabled`: nothing in the show may call it.
 */
let _steering = true;
export function _setDaggerSteeringEnabled(on) { _steering = on !== false; }

/**
 * The table asks this, once, and it is the ONLY thing the Dagger does to a
 * banishment.
 *
 * Returns `{ [holder]: DAGGER_VOTES }` and marks the Dagger drawn, or null.
 * NO RNG: `drawAt` was rolled at acquisition precisely so that this call
 * cannot displace a single draw of the game's own stream, and a season with a
 * Dagger in it can therefore still be compared with the season without one.
 *
 * The holder must be in the room — a Dagger belonging to somebody murdered
 * last night is not drawn from beyond the grave, and `settleDaggers` will
 * already have closed that record anyway.
 */
export function daggerWeights(ep, living) {
  const d = heldDagger();
  if (!d) return null;
  if (!(living || []).includes(d.holder)) return null;
  if ((living || []).length > d.drawAt) return null;
  d.outcome = 'played';
  d.playedEp = ep;
  return { [d.holder]: DAGGER_VOTES };
}

/** The Dagger drawn at a given table, for the round record and for the VP. */
export function daggerDrawnAt(ep) {
  return (gs.tr?.daggers || []).find(d => d.playedEp === ep) || null;
}

// ══════════════════════════════════════════════════════════════════════
// THE SEER — one question, once, and two people who may lie about it
// ══════════════════════════════════════════════════════════════════════
//
// Spec §7.3. ONCE PER GAME, ENDGAME ONLY. A private meeting in which one
// player must TRUTHFULLY confirm their alignment. Only the Seer sees it, and
// BOTH PARTIES MAY LIE ABOUT IT AFTERWARDS.
//
// Every clause of that is a restriction, and together they are the most
// constrained mechanic in the format. The belief it writes is the game's ONE
// `observed` alignment belief and there may never be a second — the write, and
// the reason the tier is what it is, are in js/tr/deduction.js
// (`seerEvidence`). What is here is the POWER: who holds it, whom they read,
// the endgame gate, the once-per-game rule, and the two lies.
//
// ── WHY IT IS NOT WON IN A MISSION ─────────────────────────────────────
//
// The Shield and the Dagger are, and the Seer deliberately is not. The
// Reliquary yields exactly ONE relic per afternoon (Task 4), so a third relic
// would take its share out of the other two — Shields already fell 1.67 -> 1.12
// a season when the Dagger was added, and `CHESS_WEIGHT` had to move once
// already to stop a new archetype quietly eating a measured band. A power that
// can only be used in the endgame has no business being priced against powers
// that are used all season. It is offered when the endgame opens, to the room
// that reached it.
//
// ── WHO GETS IT, AND WHY SELECTION MAY NOT LOOK AT A CLOAK ─────────────
//
// ALIGNMENT-BLIND, ABSOLUTELY. If the holder were chosen with any regard to
// who is a Traitor then the mere EXISTENCE of a Seer would be a tell, and the
// engine would be leaking ground truth through the shape of its own draws —
// the exact defect Task 6 removed from `chooseBanishmentVote`, where "X never
// named Y" was a perfect season-long tell.
//
// SO IT IS A PURE HASH OVER THE ROOM, AND THE FIRST DRAFT WAS NOT. It weighted
// the choice by `intuition` — "whoever went looking", which reads as
// alignment-blind because `intuition` says nothing about a cloak — and the
// guard measured Traitors holding the Seer 38.7% of the time in rooms that
// were 18.1% Traitor. Selection is uniform (js/tr/roles.js) and the base rate
// is taken at the same table, so neither explains it. SURVIVORSHIP does: a
// Traitor with poor intuition is caught and banished, a Faithful with poor
// intuition is not, so the Traitors who REACH an endgame are intuition-
// selected and the Faithfuls beside them are not. Conditioning on any stat
// the game has been filtering on all season conditions on alignment.
//
// Generalise, because this is not a fact about `intuition`: in a format that
// eliminates people on how well they play, ANY stat correlates with alignment
// among the survivors even when it is independent of alignment at casting. A
// rule that must be alignment-blind at the endgame has to be blind to stats
// too, or prove otherwise against the base rate at the same table.
//
// ── WHOM THEY READ ─────────────────────────────────────────────────────
//
// The top of their own suspicion board, among the people they do not already
// KNOW about. Belief-side on both counts: `knowsAlignmentOf` is the turret
// test, so a Traitor does not waste the one question of the season on a fellow
// they were shown on night one, and a Faithful — who knows nobody — reads the
// whole room. One rule, no branch on role, no ground truth anywhere in it.
//
// ── AND THEN BOTH OF THEM LIE ──────────────────────────────────────────
//
// The Seer may name the subject to the castle whether or not the read
// justifies it; the subject may deny it, claim they were cleared, or turn it
// round and accuse the Seer of having a reason to be asking. Every one of
// those is a `rumor` (`seerClaimEvidence`), which is what stops the one
// certain thing in the game from reaching anybody but the person who bought
// it. The claims a lying Traitor makes and the claims a truthful Faithful
// makes are indistinguishable at the tier they arrive at, which is the format.
//
// ── RNG ────────────────────────────────────────────────────────────────
//
// NOT ONE DRAW, anywhere in this section. Selection, the subject, and both
// decisions to speak are hashed from state the season already has; the read
// takes `learn()`'s direct branch, which rolls nothing; and the claims run on
// a stream hashed from the claim. So a season with a Seer in it draws exactly
// the numbers the same season without one drew, and the endgame diverges only
// where somebody actually acts on what was said. Task 6's technique, and it is
// the default for any change to a decision function.

/** A stable 0..1 from a string. No draw. */
const hash01 = (key) => _lineHash(key) / 4294967296;

/**
 * Below this the meeting is not worth having: at two living players the
 * endgame is already a coin toss between them, and the Seer would be reading
 * the only other person in the building.
 */
export const SEER_MIN_ROOM = 3;

// ── the two decisions to speak ─────────────────────────────────────────
//
// A Faithful who saw a cloak says so — this is the best evidence anybody in
// the castle has ever had and sitting on it wins nothing. A Faithful who saw a
// Faithful and names them anyway is telling a lie for a strategic reason, and
// it is rare rather than impossible, because the endgame does contain people
// who would rather the room banished somebody harmless than looked at them.
const SAY_TRUE_TRAITOR = 0.85;
const SAY_FALSE_BASE = 0.08;
const SAY_FALSE_BOLD = 0.14;
// A Traitor holding the Seer will not name a cloak, ever: the pact is worth
// more than the read. What a Traitor Seer does with the power is LIE with it,
// and a clean read is the licence to do so.
const SAY_TRAITOR_LIES = 0.62;
// Accused in front of the room, the subject either denies it or turns it round
// — "why does a Faithful need a private word with me?" is the answer that has
// ended seasons, and it is available to a guilty subject and an innocent one
// alike.
const COUNTER_BASE = 0.32;
const COUNTER_BOLD = 0.36;
// Unaccused, the subject may still bring the meeting up themselves, to bank
// the only thing it can be spun into: "she checked me."
const CLEARED_P = 0.55;

// ── prose ──────────────────────────────────────────────────────────────
//
// EVERY POOL IS KEYED ON THE FACT IT ASSERTS, which is this plan's standing
// requirement applied at the only point where it is genuinely awkward: a claim
// may be a LIE, so the narration and the belief that claim writes deliberately
// disagree. That is not a ledger defect and a naive agreement guard would call
// it one. The rule that actually binds here is that a sentence must agree with
// the CLAIM RECORD — with `kind` and with `truthful` — not with ground truth,
// because the record is what the sentence is describing. Keying the pools on
// exactly those two fields makes the contradiction unrepresentable rather than
// asserted against afterwards.
const MEETING_LINES = [
  'The room is small, the door is shut, and the question only gets asked once. {who} asks it.',
  'A corridor nobody else is using, and {who} standing in it waiting to be answered.',
  '{who} calls in a favour the format only grants one of, and shuts the door behind {them}.',
  'No witnesses, no second chance, and one honest answer owed. {who} collects it.',
];
// KEYED ON WHAT WAS ACTUALLY SEEN, AND ON TWO FACTS THE SENTENCES TURN ON.
//
// Nothing may be swapped between these pools: a line under `traitor-` says a
// cloak was found and a line under `faithful-` says one was not. The two
// further splits are this plan's standing requirement, and both were found by
// dumping seasons and reading them rather than by any assertion:
//
//   * "{who} has been one all along" is FALSE of a recruit, and roughly a
//     third of the Traitors alive at the endgame are recruits. The era model
//     already knows which, so the sentence chooses the pool instead of being
//     asserted inside one.
//   * "has spent the season being suspected" is FALSE over a player the Seer
//     held nothing at all against — and the subject is picked off a board that
//     is genuinely flat in some endgames, so the claim really does run over its
//     own negation. `priorSuspicion` is read BEFORE the write (the read
//     overwrites it) and decides the pool.
const READ_LINES = {
  'traitor-original': [
    '{who} says the word out loud, and it is the wrong one. A cloak, sitting a foot away.',
    'The answer comes back and it is the answer nobody wants at this range: {who} is a Traitor.',
    'A Traitor. {who} has been one since the first night and has just had to say so, once, out loud.',
    '{who} tells the truth because the format makes {them}, and the truth is a cloak.',
  ],
  'traitor-recruited': [
    'A Traitor, and a new one. {who} took the cloak partway through and has just had to admit it.',
    '{who} was a Faithful in this castle not long ago. {They} {is} not one now, and says so.',
    'The answer is a cloak {who} was not wearing when the season started.',
    '{who} tells the truth because the format makes {them}: turned, and recently.',
  ],
  'faithful-suspected': [
    '{who} tells the truth and the truth is nothing at all: a Faithful, exactly as advertised.',
    'A Faithful — and the one person in the castle who suspected {them} now knows better.',
    'Clean. The one certain answer the season had to give was spent here, and it comes back clean.',
    '{who} is what {they} said {they} {was}, and the doubt about {them} dies in that room.',
  ],
  'faithful-cold': [
    '{who} tells the truth and the truth is nothing at all: a Faithful, exactly as advertised.',
    'A Faithful, and nobody had said otherwise. The answer confirms a thing nobody was arguing.',
    'Clean, and the question was never much more than a formality.',
    '{who} is what {they} said {they} {was}, and one person in the castle now knows it for certain.',
  ],
};
const SEER_CLAIM_LINES = {
  // Named, and the read said Traitor.
  'named-true': [
    '{who} walks back in and says the name, and every word of it is true.',
    'No hedging. {who} tells the room what {they} saw, and what {they} saw was a cloak.',
    '{who} names {them} in front of everybody, and is right.',
    'The best evidence anybody in this castle has had, said out loud by {who}, and correct.',
  ],
  // Named, and the read said Faithful. A lie, told deliberately.
  'named-lie': [
    '{who} walks back in and says the name anyway. It is a lie, and it is a good one.',
    '{who} tells the room {they} found a Traitor. {They} found nothing of the kind.',
    'The read was clean and {who} names {them} regardless — the meeting was never going to be wasted.',
    'A private word, and then a public accusation with nothing behind it. {who} says it without blinking.',
  ],
  silent: [
    '{who} comes back and says nothing at all, which is its own kind of answer.',
    'Whatever passed in that room stays there. {who} keeps it.',
    '{who} sits back down with the only certain thing in the castle and does not spend it.',
    'Not a word out of {who}. The room notices the door and nothing else.',
  ],
};
const SUBJECT_CLAIM_LINES = {
  // Accused, and denying it. True if the subject really is a Faithful.
  'deny-true': [
    '{who} denies it flatly, and {they} {is} telling the truth.',
    'Not what happened, says {who}, who is right, and who has no way of proving it.',
    '{who} says it did not go like that, and it did not.',
    'An honest denial from {who}, which sounds exactly like the other kind.',
  ],
  'deny-lie': [
    '{who} denies it flatly, and {they} {is} lying.',
    '{who} says it is not what happened, and knows perfectly well that it was.',
    '{who} calls it a fabrication. {They} confirmed it in that room an hour ago.',
    'The denial is quick, warm and completely false. {who} has had practice.',
  ],
  // Turning it round on the Seer. True if the Seer really is a Traitor.
  'counter-true': [
    '{who} turns it round: why did that meeting need a closed door? As it happens, {they} {is} right.',
    'Instead of answering, {who} asks what a Faithful wanted with a private room — and hits it.',
    '{who} names {their} accuser back, and is correct.',
    '{who} asks the room to wonder why {they} {was} wanted alone. It is a deflection, and it is also true.',
  ],
  'counter-lie': [
    '{who} turns it round on {their} accuser, and it is pure invention.',
    'Instead of answering, {who} asks what a Faithful wanted with a private room. Nothing did. But it is asked.',
    '{who} names {their} accuser back, with nothing behind it but nerve.',
    'A clean deflection and a false one. {who} has decided the room can only look at one of them.',
  ],
  // Volunteering the meeting, unaccused. True if the subject is a Faithful.
  'cleared-true': [
    '{who} brings the meeting up unprompted: {they} {was} asked, and {they} came out clean.',
    '{who} tells the room {they} {was} the one who got checked. It is true, and it changes nothing.',
    '{who} says {they} {has} been cleared. {They} {has}. Nobody moves.',
    'An honest account of a private meeting from {who}. The room has no way of telling.',
  ],
  'cleared-lie': [
    '{who} brings the meeting up unprompted, and turns it into an alibi {they} {was} never given.',
    '{who} tells the room {they} got checked and came out clean. {They} came out a Traitor.',
    '{who} says {they} {has} been cleared. {They} {has} not.',
    'A private meeting, spun in public by the one person in it with a reason to. {who} does it well.',
  ],
  silent: [
    '{who} does not mention it, and neither does anybody else.',
    'Nothing from {who}. The meeting stays where it happened.',
    '{who} lets it go, which is either nerve or nothing to say.',
    'No account from {who} at all. The room never learns there was a room.',
  ],
};

/**
 * Fill a hashed line's pronoun slots for one named person.
 *
 * THE VERB SLOTS ARE NOT A CONVENIENCE. The first dump of this section printed
 * "Anne Maria is what she said she were", "Bridgette says she have been
 * cleared" and "B tells the room he were the one who got checked" — eleven
 * lines across five pools, every one of them a verb conjugated for singular
 * `they` and then printed over a `she` or a `he`. It is Task 4's shared-pool
 * defect in a new place: a pool written for one pronoun and printed for three.
 *
 * Hand-avoiding a conjugated verb in every future line is the fix that lasts
 * until the next line, so the pools do not contain conjugated verbs at all.
 * `{is}`, `{was}` and `{has}` are filled from the same pronoun table that fills
 * `{they}`, which makes the disagreement unrepresentable rather than something
 * to notice in a dump.
 */
function _fill(pool, key, who, subs = {}) {
  const pr = pronouns(who);
  const plural = pr.sub === 'they';
  return lineFor(pool, key, { who, ...subs })
    .split('{is}').join(plural ? 'are' : 'is')
    .split('{was}').join(plural ? 'were' : 'was')
    .split('{has}').join(plural ? 'have' : 'has')
    .split('{they}').join(pr.sub)
    .split('{them}').join(pr.obj)
    .split('{their}').join(pr.posAdj)
    .split('{They}').join(pr.Sub)
    .split('{Them}').join(pr.Obj)
    .split('{Their}').join(pr.PosAdj);
}

// The hook the guards assert through — test-only, same contract as
// `_setPactWatch`. It fires on EVERY decision, including the refusals, because
// a once-per-game power is rare by construction and Task 4 shipped a guard a
// mutation survived for exactly that reason: a season-level assertion about
// something that happens once cannot see the rule break. This one is asserted
// where it is DECIDED.
let _seerWatch = null;
export function _setSeerWatch(fn = null) {
  const prev = _seerWatch;
  _seerWatch = fn;
  return () => { _seerWatch = prev; };
}

/** Test-only ablation, so a base-vs-head arm can be run inside one build. */
let _seerOn = true;
export function _setSeerEnabled(on) { _seerOn = on !== false; }

/** The season's Seer record, or null. There is at most one, ever. */
export function seerRead() { return gs.tr?.seer || null; }

/**
 * Offer the Seer, if the game is in a state that allows it.
 *
 * ASKED EVERY TIME THE ENDGAME PUTS ITS QUESTION, and refused every time but
 * the first. That is deliberate: the once-per-game rule is only guardable if
 * it is actually re-decided, and a rule decided once in a season is a rule no
 * sampled assertion can catch breaking.
 *
 * Returns the record on the one occasion it fires, and null — with a reason
 * handed to the watch — every other time.
 */
export function openSeer(ep) {
  const deny = (reason) => {
    if (_seerWatch) _seerWatch({ ep, fired: false, reason, seer: null, subject: null });
    return null;
  };
  if (!gs?.tr) return null;
  if (!_seerOn) return deny('ablated');
  // THE ENDGAME GATE, AND IT IS A PROPERTY OF SEASON STATE RATHER THAN AN
  // ARGUMENT. `gs.tr.endgameFrom` is written by runEndgame and by nothing
  // else, so the mandated loop cannot open a Seer by passing the right flag —
  // there is no flag to pass.
  const from = gs.tr.endgameFrom;
  if (from == null || ep < from) return deny('not the endgame');
  // ONCE PER GAME, GLOBALLY. Not once per round, not once per player.
  if (gs.tr.seer) return deny('already used');

  const living = [...(gs.activePlayers || [])];
  if (living.length < SEER_MIN_ROOM) return deny('room too small');

  // UNIFORM OVER THE ROOM, and the header says at length why it may not be
  // anything else.
  //
  // ONE HASH, INDEXED INTO THE ROOM — not a hash per player with the highest
  // winning, which was the second draft and carried a residual of its own. A
  // per-player hash is FIXED for a given (name, ep), so the same names win the
  // same nights in every season the game is ever played, and a name that
  // reaches episode eleven disproportionately often when it is wearing a cloak
  // hands that correlation straight to the Seer. Measured at z = 2.61 over
  // 1,553 grants: under the 3-sd bar, consistently signed, and removable for
  // nothing. Hashing the ROOM and indexing into it gives every seat at a given
  // table the same chance and leaves no player a standing advantage.
  const seats = [...living].sort();
  const holder = seats[Math.floor(hash01(`seer-holder|${ep}|${seats.join('|')}`) * seats.length)];

  // Belief-side, both clauses. `knowsAlignmentOf` is the turret test, so this
  // reads "the people I have not been shown" and never "the Faithfuls".
  const pool = living.filter(n => n !== holder && !knowsAlignmentOf(holder, n, ep));
  if (!pool.length) return deny('nobody left to ask');
  const subject = pool
    .map(n => ({ n, s: suspicion(holder, n, ep) + hash01(`seer-subject|${holder}|${n}|${ep}`) * 1e-3 }))
    .sort((a, b) => (b.s - a.s) || (a.n < b.n ? -1 : 1))[0].n;
  // READ BEFORE THE WRITE, because the write overwrites it. This is what the
  // Seer held against them walking in, and it is the fact one of the read
  // pools turns on — a sentence about somebody having been suspected all
  // season must not print over somebody nobody suspected.
  const priorSuspicion = suspicion(holder, subject, ep);

  // GROUND TRUTH, READ AT THE ONE MOMENT THE FORMAT COMPELS IT. The subject is
  // made to answer honestly; that is the mechanic. `alignmentAt` and not
  // `fact.truth`, because alignment has ERAS and a read is true AS OF the
  // episode it happened — a recruit who flips afterwards does not make it
  // retroactively false, and nothing may recompute this at season end.
  const truth = alignmentAt(subject, ep) === 'traitor' ? 'traitor' : 'faithful';
  // WHICH ERA, not merely which alignment. A recruit has not "been one all
  // along" and the pool that says so must never print over them. Read off the
  // era list rather than off `roleHistory`, because the eras are the model and
  // anything else is a second copy of it.
  const eras = gs.tr.alignment?.[subject] || [];
  const recruited = truth === 'traitor'
    && eras.filter(e => e.sinceEp <= ep).some(e => e.truth === false);
  const readKey = truth === 'traitor'
    ? (recruited ? 'traitor-recruited' : 'traitor-original')
    : (priorSuspicion > 0 ? 'faithful-suspected' : 'faithful-cold');
  const rec = {
    ep, seer: holder, subject, truth, priorSuspicion, recruited, readKey,
    // WHAT THE SEER THEMSELVES IS, recorded at the read's own episode and never
    // recomputed. The subject's counter-accusation asserts a fact about the
    // Seer, so `truthful` on that claim can only be checked against this — and
    // reading it back later means reading it out of a `gs` that has been
    // replaced by a different castle, which is the era trap by another route.
    seerTruth: alignmentAt(holder, ep) === 'traitor' ? 'traitor' : 'faithful',
    // The room the meeting was held in front of, recorded rather than
    // re-derived: the claims below are addressed to it, and by the time
    // anything reads this record the castle is a different size.
    room: living,
    meetingLine: _fill(MEETING_LINES, `seer-meeting|${ep}`, holder),
    readLine: _fill(READ_LINES[readKey], `seer-read|${ep}|${readKey}`, subject),
    claims: [],
  };

  gs.tr.seer = rec;
  // THE WRITE, AND IT GOES TO ONE PERSON. Nobody else in the castle learns a
  // thing from the meeting itself; everything the rest of the room ever gets
  // is a claim, at `rumor`, below.
  const belief = seerEvidence(holder, subject, ep);
  rec.belief = belief
    ? { sourceType: belief.sourceType, confidence: belief.confidence, valence: belief.valence }
    : null;

  _seerClaims(rec, ep);
  if (_seerWatch) _seerWatch({ ep, fired: true, reason: null, seer: holder, subject, rec });
  return rec;
}

/**
 * What each of them says afterwards, and it is the half of §7.3 that keeps the
 * ceiling standing. See `seerClaimEvidence` in js/tr/deduction.js for why an
 * accusation is a `rumor` however certain the person making it is.
 *
 * BOTH DECISIONS READ THE SPEAKER'S OWN KNOWLEDGE AND NOTHING ELSE. The Seer
 * knows the read because they bought it; the subject knows their own cloak,
 * which is the one piece of ground truth this engine has always let a player
 * have. Neither reads anybody else's.
 */
function _seerClaims(rec, ep) {
  const { seer, subject, truth, room } = rec;
  const seerIsTraitor = alignmentAt(seer, ep) === 'traitor';
  const bold = (name) => (stat(name, 'boldness') || 5) / 10;

  // ── the Seer speaks, or does not ──
  let sKind = 'silent';
  const roll = hash01(`seer-say|${seer}|${subject}|${ep}`);
  if (truth === 'traitor') {
    // A Traitor Seer does not hand the room a fellow, at any price.
    if (!seerIsTraitor && roll < SAY_TRUE_TRAITOR) sKind = 'named';
  } else if (seerIsTraitor) {
    if (roll < SAY_TRAITOR_LIES) sKind = 'named';
  } else if (roll < SAY_FALSE_BASE + SAY_FALSE_BOLD * bold(seer)) {
    sKind = 'named';
  }
  const named = sKind === 'named';
  const sTruthful = named ? truth === 'traitor' : null;
  const sKey = named ? (sTruthful ? 'named-true' : 'named-lie') : 'silent';
  rec.claims.push({
    by: seer, kind: sKind, about: named ? subject : null,
    truthful: sTruthful, spreads: named,
    heard: named ? seerClaimEvidence(seer, subject, room, ep, 'named') : [],
    line: _fill(SEER_CLAIM_LINES[sKey], `seer-claim|${ep}|${sKey}`, seer, { them: subject }),
  });

  // ── and then the subject answers, or brings it up unprompted ──
  const r2 = hash01(`seer-answer|${subject}|${seer}|${ep}`);
  let kind, truthful;
  if (named) {
    if (r2 < COUNTER_BASE + COUNTER_BOLD * bold(subject)) {
      kind = 'counter'; truthful = seerIsTraitor;
    } else {
      kind = 'deny'; truthful = truth === 'faithful';
    }
  } else if (r2 < CLEARED_P) {
    kind = 'cleared'; truthful = truth === 'faithful';
  } else {
    kind = 'silent'; truthful = null;
  }
  const key = kind === 'silent' ? 'silent' : `${kind}-${truthful ? 'true' : 'lie'}`;
  rec.claims.push({
    by: subject, kind, about: kind === 'counter' ? seer : null, truthful,
    spreads: kind === 'counter',
    heard: kind === 'counter' ? seerClaimEvidence(subject, seer, room, ep, 'counter') : [],
    line: _fill(SUBJECT_CLAIM_LINES[key], `seer-answer|${ep}|${key}`, subject),
  });
}
