// ══════════════════════════════════════════════════════════════════════
// tr/murder.js — the conclave, and the trail it leaves
// ══════════════════════════════════════════════════════════════════════
//
// Nothing in this file computes a best target, and that is deliberate. If it
// did, every season would be the same season: three optimisers agreeing, a
// clean kill every night, and no reason for the Traitors ever to fall out.
//
// Instead each Traitor forms their OWN preference from their OWN read quality,
// the room resolves the disagreement on social weight rather than on who is
// right, and the loser remembers. That last part is why the endgame betrayal
// has a date on it instead of a schedule.
import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';
import { livingTraitors, livingFaithfuls } from './roles.js';
import { murderPreferenceFor } from './state.js';
import { shieldSeenBy, daggerSeenBy } from './powers.js';
import { pickVariant, buildDeathList, dinnerNeighbours, chapelPlea, dungeonCompanion,
  dungeonVoice, chooseSacrifice, variantLine, PLAIN_SIGHT_METHODS } from './murder-variants.js';
import { _lineHash } from './castle/lines.js';

/**
 * How hard the conclave steers off a Shield it knows about.
 *
 * Large enough to be decisive and finite rather than -Infinity, so that when
 * the last living Faithful is the one holding the Shield the pact still has a
 * target and still wastes its night on them — which is the correct outcome and
 * not an edge case to special-case away.
 */
const KNOWN_SHIELD_PENALTY = 12;

/**
 * How hard the conclave steers ONTO a Dagger it knows about.
 *
 * The mirror of the Shield's penalty and deliberately an order of magnitude
 * softer. A known Shield is an ABSOLUTE fact about tonight — throwing the
 * night at a wall achieves nothing whatever, so 12 is correct there. A known
 * Dagger is a JUDGEMENT about a table two or three nights away: the holder
 * doubles a vote at some point, probably against a Traitor, and taking them
 * out early is worth doing but not worth doing instead of taking out the
 * person who is currently dismantling the pact in front of the room. At 2.5 it
 * moves a marginal call and loses to a strong one, which is the weight it
 * deserves.
 *
 * A BONUS AND NOT A FILTER, for the reason spelled out at the Shield's penalty
 * below: the per-candidate scatter draws once per name, so promoting a name by
 * removing the others would consume a different number of draws and re-roll
 * every murder and ballot after it.
 */
const KNOWN_DAGGER_BONUS = 2.5;

/**
 * Deterministic scatter for a (traitor, target) pair.
 *
 * Two Traitors looking at the same room do not experience it identically —
 * one clocks a comment the other missed. That has to come from WHO is asking,
 * not just from the shared dice roll, or three formPreference() calls fed the
 * same seed collapse onto the same order and there is nothing to argue about.
 * A string hash gives each pair its own fixed "impression" without touching
 * Math.random, so a season still replays byte-identical from a seed.
 */
function _pairScatter(a, b) {
  let h = 2166136261;
  const s = `${a}|${b}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

// How hard a chosen sacrifice is pulled up the list. Applied AFTER the
// read-quality multiply, like the relic terms, so it is a decision a Traitor
// makes on purpose rather than a thing a bad read can fumble into.
const SACRIFICE_PULL = 3;

/**
 * THE PSYCHOLOGICAL REVERSAL — a Traitor deliberately murdering their OWN
 * friend to buy cover, and the name they pick, or null.
 *
 * Normal conclave logic AVOIDS killing a friend (the room connects it by
 * breakfast). This is the inversion the format's best players actually run: a
 * Traitor who is ALREADY under suspicion sacrifices the person everyone knows
 * they were close to, precisely because "they'd never kill their own friend"
 * is the sentence the castle says next. It is expensive — you spend a real
 * ally — so only a scheming archetype under real heat, with a genuine friend
 * to spend, ever reaches for it, and even then it is a coin nobody flips often.
 *
 * DETERMINISTIC, NO rng DRAW. The gate is a string hash (`_lineHash`), the same
 * discipline `_pairScatter` uses, so a season replays byte-identical from its
 * seed — a re-run or a reload reproduces the same sacrifice. Computed once per
 * (traitor, ep) and read per candidate in `formPreference`.
 */
function _sacrificeTarget(traitor, ep) {
  const arch = (players || []).find(p => p && p.name === traitor)?.archetype;
  // Only the archetypes the format lets scheme: a hero does not do this.
  if (!['mastermind', 'schemer', 'villain'].includes(arch)) return null;
  // Only a Traitor who NEEDS cover — someone the room has already been naming.
  const heatOnMe = _publicHeatAgainst(traitor, ep);
  if (heatOnMe < 0.15) return null;
  // A genuine friend to spend: the closest Faithful they are actually bonded to.
  let friend = null, best = 4.99;
  for (const n of livingFaithfuls(ep)) {
    if (n === traitor) continue;
    const b = getBond(traitor, n);
    if (b > best) { best = b; friend = n; }
  }
  if (!friend) return null;
  const st = pStats(traitor);
  // The appetite for it: strategy and nerve, sharpened by how much heat they
  // are actually carrying. Capped so even an ideal Traitor under fire only
  // reaches for it about a third of the time.
  const drive = (st.strategic / 10) * 0.5 + (st.boldness / 10) * 0.3
    + Math.min(0.4, heatOnMe) * 0.5;
  const p = Math.min(0.35, drive);
  const roll = (_lineHash(`sacrifice|${traitor}|${ep}`) >>> 0) / 4294967296;
  return roll < p ? friend : null;
}

/**
 * One Traitor's private opinion about who should die tonight.
 *
 * `conviction` is the margin between their top pick and their runner-up, plus
 * a per-read bonus — someone with a clear best answer pushes it harder than
 * someone genuinely torn between two names. It is NOT "a fool argues loudest":
 * that mechanism is real, but it lives in runConclave's social weight, where a
 * high-`social` low-`read` Traitor can out-argue a quieter, better read.
 */
export function formPreference(traitor, ep, rng = Math.random) {
  const targets = livingFaithfuls(ep).filter(n => n !== traitor);
  if (!targets.length) return { target: null, reason: 'nobody left', conviction: 0 };
  const st = pStats(traitor);
  const read = ((st.strategic || 5) * 0.6 + (st.intuition || 5) * 0.4) / 10;
  // Read once for the whole scoring loop: it is a property of THIS Traitor's
  // night, not of the candidate.
  const knownShield = shieldSeenBy(traitor, ep);
  // And the same question about the other power: a name this Traitor watched
  // walk back up the stair with a Dagger in their hand, or null. Per Traitor,
  // never per pact — see shieldSeenBy.
  const knownDagger = daggerSeenBy(traitor, ep);
  // THE REVERSAL, decided once for the whole night: the friend this Traitor has
  // chosen to sacrifice for cover, or null. Read per candidate below.
  const sacrifice = _sacrificeTarget(traitor, ep);

  const scored = targets.map(name => {
    const ts = pStats(name);
    // TOOL ALLOCATION, the format's own logic: murder is for the people the
    // table will never remove. A beloved, obviously-Faithful player can only
    // be taken this way — and a SUSPICIOUS Faithful is worth more alive,
    // because the table will spend itself on them for free.
    const beloved = (ts.social || 5) / 10;
    const heat = _publicHeatAgainst(name);      // how suspected they already are
    // The one who is onto them. Read off PUBLIC behaviour only — a Traitor
    // cannot see beliefs, only who has been saying their name out loud.
    const accused = _accusedMe(traitor, name);
    let score = beloved * 1.1 - heat * 1.3 + accused * 1.4;

    // Never someone they visibly clashed with — the room connects it by
    // breakfast — and never someone they cannot bring themselves to name.
    // UNLESS this is the sacrifice: then the very friendship the avoidance
    // protects is the point, so the penalty is skipped (and the pull applied
    // after the read multiply below).
    const bond = getBond(traitor, name);
    const isSacrifice = name === sacrifice;
    if (!isSacrifice) {
      if (bond > 0) score -= (bond / 10) * 0.9;
      if (bond < -4) score -= 0.6;
    }

    // How well they weigh any of it. A poor read doesn't just shrink the
    // signal — it hands the decision to noise instead, which is the actual
    // mechanism by which a bad Traitor picks badly rather than just weakly.
    // The scatter is per-PAIR (this traitor's read of this name), not a
    // single shared roll, or every Traitor reading the same room lands on
    // the same target and the conclave has nothing to argue about.
    const scatter = (_pairScatter(traitor, name) - 0.5) * 2 + (rng() - 0.5) * 2;
    score = score * (0.25 + read * 0.55) + scatter * (1.15 - read * 0.55);

    // THE ONE THING A SHIELD CHANGES ABOUT THE CONCLAVE, and only for the
    // Traitor who SAW IT WON. `shieldSeenBy` (js/tr/powers.js) returns a name
    // only when THIS Traitor is on the recorded witness list; a Shield this
    // Traitor did not see is invisible here, and they will argue for the
    // protected name like anybody else. Since runConclave resolves on social
    // weight rather than on who is right, a blind Traitor can out-argue a
    // Traitor who watched the thing being handed over — and the pact spends
    // its night on a wall. That is the whole value of the visibility model
    // from the Traitors' side: seeing a Shield awarded is worth a night to the
    // person who saw it.
    //
    // A PENALTY AND NOT A FILTER, DELIBERATELY. The scatter above draws once
    // per candidate, so dropping a name from `targets` would consume one draw
    // fewer and shift every murder, ballot and banishment after it — a
    // gameplay edit re-rolling the season, which is the coupling _missionRngFor
    // and _castleRngFor both exist to prevent. Applied after the read-quality
    // multiply so it cannot be scaled away by a Traitor who reads badly.
    // THE SACRIFICE PULL, applied here beside the relic terms and for the same
    // reason: after the read-quality multiply, so it is a deliberate play a
    // badly-reading Traitor cannot scale away. It draws the chosen friend up the
    // list hard enough to usually win the argument in this Traitor's own head.
    if (isSacrifice) score += SACRIFICE_PULL;
    if (name === knownShield) score -= KNOWN_SHIELD_PENALTY;
    // THE OTHER DIRECTION. A Faithful carrying a Dagger is a Faithful who gets
    // two votes at a table nobody can predict, and the Traitor who saw it won
    // is the only person in the pact who can act on that. Applied at the same
    // point and for the same reason as the Shield's penalty: after the
    // read-quality multiply, so a Traitor who reads the room badly cannot
    // scale away a thing they SAW.
    if (name === knownDagger) score += KNOWN_DAGGER_BONUS;

    // WHAT HAPPENED IN THE CASTLE TODAY. A scene can push this Traitor toward
    // a name ("she has been saying mine all afternoon") or away from one
    // ("the room would connect it to me by breakfast"), and without this term
    // the conclave argues from stats and last night's ballots alone — the
    // format's most-quoted murders come out of the day, not the spreadsheet.
    //
    // Written only through `addMurderPreference` (js/tr/scene-api.js), so
    // every push has a receipt naming the scene that produced it. Applied at
    // the same point and for the same reason as the two relic terms: after the
    // read-quality multiply, so a Traitor who reads the room badly cannot
    // scale away a thing that actually happened to them. It is a LOOKUP and
    // takes no draw, so a season with preferences in it consumes exactly the
    // rng stream a season without them does.
    score += murderPreferenceFor(gs, traitor, name, ep);

    // Carry the raw terms alongside the score so _reasonFor can read what
    // actually drove THIS pick instead of recomputing it — a recompute can
    // silently disagree with the number that won, and Task 2 keys
    // murderCost off this label.
    return { name, score, beloved, heat, accused, sacrifice: isSacrifice };
  }).sort((a, b) => b.score - a.score);

  const pick = scored[0];
  return {
    target: pick.name,
    reason: _reasonFor(pick),
    conviction: Math.max(0.1, Math.min(1, (pick.score - (scored[1]?.score ?? 0)) + read * 0.5)),
  };
}

/**
 * How much heat this player is already carrying in public. Looks at only the
 * last two rounds, deliberately: recent heat is what makes them a decoy right
 * now, and old heat that never re-fired has usually cooled off (the table
 * cleared them, or moved on).
 */
function _publicHeatAgainst(name) {
  const rounds = gs.tr?.rounds || [];
  const recent = rounds.slice(-2);
  let votes = 0, ballots = 0;
  for (const r of recent) {
    for (const b of (r.ballots || [])) {
      if (b.channel !== 'banishment') continue;
      ballots++;
      if (b.voted === name) votes++;
    }
  }
  return ballots ? votes / ballots : 0;
}

/**
 * Has `name` publicly named `traitor` at a Round Table? Public information
 * only. Scans every round played, unlike the recency window above: unlike
 * heat, being fingered by a specific person is not something a Traitor
 * forgets just because a few episodes passed without a repeat.
 */
function _accusedMe(traitor, name) {
  const rounds = gs.tr?.rounds || [];
  let hits = 0;
  for (const r of rounds) {
    if ((r.accusations || []).some(a => a.accuser === name && a.target === traitor)) hits++;
    if ((r.ballots || []).some(b => b.voter === name && b.voted === traitor)) hits++;
  }
  return Math.min(1, hits * 0.5);
}

/**
 * Why this name, in words the VP and the evidence layer can both read.
 * Reads the terms the scoring loop already computed for the winning pick
 * rather than recomputing them, so the label can never disagree with the
 * number that actually won.
 */
function _reasonFor(pick) {
  if (pick.sacrifice) return 'sacrifice';         // a friend spent for cover
  if (pick.accused > 0) return 'onto-me';
  if (pick.heat > 0.25) return 'wasted-decoy';  // a bad reason, deliberately reachable
  if (pick.beloved >= 0.7) return 'beloved';
  return 'convenient';
}

/**
 * The argument, and its result.
 *
 * Resolved on social weight and conviction — NOT on whose read is better. This
 * is where a loud, wrong Traitor can out-argue a quiet, correct one: a high
 * `social` stat outweighs another Traitor's better-read conviction, so the
 * best read in the room loses regularly and the Traitors murder the wrong
 * person and then have to live with each other.
 */
export function runConclave(ep, rng = Math.random) {
  const traitors = livingTraitors(ep);
  if (!traitors.length) return { decision: 'none', target: null, argued: [], overruled: [] };

  const argued = traitors.map(t => ({ traitor: t, ...formPreference(t, ep, rng) }))
    .filter(p => p.target);
  if (!argued.length) return { decision: 'none', target: null, argued: [], overruled: [] };

  const weighted = argued.map(p => ({
    ...p,
    weight: ((pStats(p.traitor).social || 5) / 10) * 0.7 + p.conviction * 0.5 + rng() * 0.4,
  })).sort((a, b) => b.weight - a.weight);

  const winner = weighted[0];
  const overruled = weighted.slice(1)
    .filter(p => p.target !== winner.target)
    .map(p => ({ ep, winner: winner.traitor, loser: p.traitor,
      target: winner.target, theirTarget: p.target }));

  // The ledger. "I told you not to kill her" needs a night attached to it.
  (gs.tr.conclaveTension ||= []).push(...overruled);

  return { decision: 'murder', target: winner.target, reason: winner.reason,
    decidedBy: winner.traitor, argued, overruled };
}

/**
 * What this particular murder cost the Traitors.
 *
 * Not a score — a NAMED consequence, because the whole point of letting the
 * conclave be wrong is that the audience can see which wrong thing it did. A
 * flat "bad kill" penalty would be indistinguishable from noise.
 *
 * `blames` is the list of people the room can legitimately reason toward from
 * this kill alone.
 *
 * IT CURRENTLY HAS NO CONSUMER, AND THAT IS DELIBERATE, NOT ROT. Task 4 fed it
 * to a `clash-traced` evidence channel; that channel measured 0.87x at emission
 * and 0.57x on surviving beliefs — below chance on both — and was deleted. The
 * FIELD is kept because the thing it computes is still true and still wanted:
 * "which Traitor the room can legitimately blame" is what the VP renders at
 * breakfast, and a later plan's counting argument reads it. It is data awaiting
 * a consumer. What it must never again become is a belief.
 */
export function murderCost(target, reason, ep) {
  const heat = _publicHeatAgainst(target, ep);
  // `kind` and `blames` are orthogonal: `kind` is the story the audience
  // reads about THIS kill, `blames` is the channel the deduction layer reads
  // from it. A victim can be BOTH a spent decoy AND someone a Traitor visibly
  // clashed with — the clash is real evidence either way, so it must not be
  // dropped just because the heat check reported first. Compute it once, up
  // front, and hand it out under whichever `kind` wins.
  //
  // WHO THE ROOM CAN REACH FOR, AND WHY IT IS NOT ONLY TRAITORS.
  //
  // A visible clash is PUBLIC. At breakfast the castle reaches for whoever
  // made no secret of hating the person who is missing, and it cannot tell
  // whether that person is a Traitor — which is the entire reason this channel
  // is worth having, because it manufactures the format's best false positive.
  //
  // This used to read `livingTraitors(ep).filter(...)`, which made the source
  // an ORACLE rather than evidence: measured over 200 seasons of the wired
  // engine it named a Traitor 84 times out of 84, at a belief confidence of
  // 0.58, and no Faithful could ever be blamed by it.
  //
  // TWO STALE CLAIMS ABOUT THAT ORACLE, BOTH CORRECTED BY MEASUREMENT.
  // (1) It was said to cost "+4.9pp of EARLY lift on its own". Re-measured over
  //     twelve DECORRELATED 200-season blocks it was worth +0.87pp (engine
  //     6.30pp, oracle 7.18pp) — inside half a block sd, and no early ceiling
  //     is green on the engine and red on it. The +4.9pp came from the
  //     correlated seeding rngFor() has since hashed away.
  // (2) It is now worth EXACTLY ZERO, and not because it was priced down.
  //     `blames` — the only thing this line feeds — lost its last consumer when
  //     the `clash-traced` evidence channel was deleted from murderEvidence
  //     (see js/tr/deduction.js). Restoring the oracle here and re-running the
  //     probe reproduces the shipped numbers BIT-FOR-BIT on every block. The
  //     leak the early band was believed to guard against no longer has a route
  //     into the belief store at any price. The line stays as written anyway:
  //     it is the correct semantics for a PUBLIC clash, and it must not become
  //     an oracle again the moment `blames` finds a reader.
  const clashed = (gs.activePlayers || [])
    .filter(n => n !== target && getBond(n, target) <= -6);
  // The COST, unlike the blame, IS a Traitor question: the kill only hurts the
  // pact if one of the names the room can now reach for happens to be theirs.
  const tracedToPact = clashed.some(n => livingTraitors(ep).includes(n));

  // The room was already spending itself on this person. Killing them hands
  // the Faithfuls their votes back and forces them to hunt properly.
  if (heat > 0.25) return { kind: 'decoy-destroyed', cost: heat, blames: clashed };

  // A Traitor who visibly hated the victim is the first name the room reaches
  // for at breakfast, and it is reaching correctly.
  if (clashed.length) return { kind: 'clash-traced', cost: tracedToPact ? 0.5 : 0, blames: clashed };

  return { kind: 'clean', cost: 0, blames: [] };
}

/**
 * Won in a mission (js/tr/missions.js `the-reliquary`). Protects against the
 * NEXT murder only — `expireShields()` in js/tr/powers.js clears the set the
 * moment the night is over, whether or not anything was thrown at it.
 *
 * NEVER protects at the Round Table, and nothing in js/tr/roundtable.js reads
 * this set. That is asserted rather than left to hold by accident: a banished
 * player is banished identically with a live Shield and without one
 * (tests/tr-powers.test.js).
 */
export function grantShield(name, ep) {
  if (!gs.tr) return;
  if (!(gs.tr.shieldedThisRound instanceof Set)) gs.tr.shieldedThisRound = new Set(gs.tr.shieldedThisRound || []);
  gs.tr.shieldedThisRound.add(name);
}

export function isShielded(name) {
  const s = gs.tr?.shieldedThisRound;
  return s instanceof Set ? s.has(name) : (s || []).includes(name);
}

/**
 * Run the conclave and carry out the decision.
 *
 * A blocked murder is not a non-event. Nobody dies, every chair is full at
 * breakfast, and the room learns the Traitors TRIED and hit a Shield — which
 * narrows who they wanted and proves a Shield was live. That is one of the
 * strongest deduction sources the format has, and it costs nothing except
 * remembering to record it.
 */
export function resolveMurder(ep, rng = Math.random) {
  // WHICH SHAPE TONIGHT TAKES, decided before anybody meets, and by a HASH
  // rather than a draw (js/tr/murder-variants.js). A standard night therefore
  // consumes exactly the numbers it consumed before the catalogue existed,
  // which is the whole reason a season with no twist in it is bit-identical to
  // the engine that had none available.
  const variant = pickVariant(ep);

  // ── THE TWO VARIANTS THAT DO NOT HOLD A CONCLAVE ────────────────────
  if (variant === 'plain-sight') {
    const out = _plainSight(ep, rng);
    if (out) return out;
  } else if (variant === 'name-your-own') {
    const out = _forcedSacrifice(ep);
    if (out) return out;
  }
  // Either the variant was infeasible after all (a feasibility gate reads the
  // room, and the room can be emptier than the gate expected once a
  // recruitment or an execution has been through it) or it is one of the four
  // that argue first. Fall through to the conclave.

  const tensionBefore = (gs.tr.conclaveTension || []).length;
  const decision = runConclave(ep, rng);
  if (!decision.target) return { target: null, blocked: false, victim: null, cost: null,
    variant: 'standard', variantData: null };

  const target = decision.target;
  const cost = murderCost(target, decision.reason, ep);

  // Everything the variant needs is read BEFORE anybody is removed: a chapel
  // plea comes off a board that only exists while its owner is alive, and a
  // dungeon companion is drawn from a room the victim is still standing in.
  const shaped = _shapeNight(variant, ep, decision, target, tensionBefore);

  if (isShielded(target)) {
    gs.tr.shieldedThisRound.delete(target);   // spent even though it blocked
    (gs.tr.blockedMurders ||= []).push({ ep, target });
    return { target, blocked: true, victim: null, cost, decision,
      variant: shaped.variant, variantData: shaped.data, variantLine: shaped.line,
      variantLineKey: shaped.lineKey };
  }

  gs.activePlayers = (gs.activePlayers || []).filter(n => n !== target);
  // The second body, and only a double murder has one. It takes its own Shield
  // check, because a Shield covers a NAME and not a night.
  let second = null;
  if (shaped.variant === 'double' && shaped.data?.victims?.[1]) {
    const other = shaped.data.victims[1];
    if (isShielded(other)) {
      gs.tr.shieldedThisRound.delete(other);
      (gs.tr.blockedMurders ||= []).push({ ep, target: other });
      shaped.data.victims = [target];
      shaped.data.secondBlocked = other;
      // AND THE SENTENCE GOES WITH THE SECOND BODY (whole-plan review, F2 and
      // the guard at F8 that was hiding it).
      //
      // `_shapeNight` builds the double's line BEFORE anybody is removed,
      // because that is the only moment both names exist — and every line in
      // the `double` pool asserts two deaths ("Two chairs, and the castle
      // counts them twice before it believes it"). On this night there is one
      // chair. The pool's own comment says the fact it asserts is "guaranteed
      // by construction"; it is guaranteed by the construction of the CONCLAVE,
      // and a Shield is not part of that construction.
      //
      // Narrated as a standard murder instead, which is what it is: one body,
      // and an attempt that went nowhere. A `double-blocked` pool was the other
      // option and is the wrong one — 2 firings in 1,200 seasons cannot reach
      // even a one-line pool inside the samples this suite plays, which is the
      // written-but-unreachable shape Task 3 measured and rejected. The block
      // is still on the ledger, `secondBlocked` still names who lived, and the
      // Shield's own channel in js/tr/powers.js is what speaks about it.
      shaped.variant = 'standard';
      shaped.line = null;
      shaped.lineKey = null;
    } else {
      gs.activePlayers = (gs.activePlayers || []).filter(n => n !== other);
      second = other;
    }
  }
  return { target, blocked: false, victim: target, cost, decision, second,
    variant: shaped.variant, variantData: shaped.data, variantLine: shaped.line,
    variantLineKey: shaped.lineKey };
}

/**
 * The four variants that still hold a conclave, shaped after it has decided.
 *
 * Returns `{ variant, data, line }` and degrades to `standard` rather than
 * throwing when the room turns out not to support the shape — a twist that
 * cannot be run is a night that runs normally, not a crash and not an empty
 * record with a variant name on it.
 */
function _shapeNight(variant, ep, decision, target, tensionBefore) {
  const std = { variant: 'standard', data: null, line: null, lineKey: null };
  if (variant === 'on-trial') {
    const { list, spared } = buildDeathList(ep, target, decision.decidedBy);
    if (!spared.length) return std;
    const subs = { a: list[0], b: list[1], c: list[2] };
    const l = variantLine(`on-trial-${spared.length}`, ep, subs);
    return { variant, data: { list, spared }, line: l.text, lineKey: l.key };
  }
  if (variant === 'face-to-face') {
    // READ WHILE THEY ARE STILL ALIVE. suspicionBoard walks the living, so a
    // plea taken after the removal would be a plea from somebody who is not in
    // the room and would silently come back empty on every firing.
    const plea = chapelPlea(target, ep);
    const l = variantLine(plea ? 'chapel-named' : 'chapel-silent', ep,
      { victim: target, plea: plea || '' });
    return { variant, data: { plea }, line: l.text, lineKey: l.key };
  }
  if (variant === 'dungeon') {
    const companion = dungeonCompanion(ep, target);
    if (!companion) return std;
    const voice = dungeonVoice(ep, companion, target);
    const l = variantLine('dungeon-back', ep, { victim: target, companion });
    return { variant, data: { companion, voice }, line: l.text, lineKey: l.key };
  }
  if (variant === 'double') {
    // THE SECOND NAME IS THE ARGUMENT THE PACT LOST. The Traitor who was
    // overruled gets their target after all, which is why this is the one
    // night that leaves no grudge: the tension entries runConclave just wrote
    // for that name are lifted again below, because nobody was actually
    // overruled once both names were used.
    const beaten = (decision.overruled || []).find(o => o.theirTarget
      && o.theirTarget !== target
      && (gs.activePlayers || []).includes(o.theirTarget));
    // NO OVERRULE, NO SECOND NAME. A unanimous conclave wanted one person
    // dead, so there is no second name for the format to hand them and the
    // night runs standard. That is also what keeps every line in the `double`
    // pool true without needing to be keyed on anything: the second body is
    // always somebody a Traitor argued for and lost.
    if (!beaten) return std;
    const other = beaten.theirTarget;
    const tension = gs.tr.conclaveTension || [];
    gs.tr.conclaveTension = [
      ...tension.slice(0, tensionBefore),
      ...tension.slice(tensionBefore).filter(o => o.theirTarget !== other),
    ];
    const l = variantLine('double', ep, { a: target, b: other });
    return { variant, data: { victims: [target, other] }, line: l.text, lineKey: l.key };
  }
  return std;
}

/** One name out of `names`, chosen by hash. No draw. */
function _hashPick(names, key) {
  if (!names.length) return null;
  const sorted = [...names].sort();
  return sorted[Math.floor((_lineHash(`${key}|${sorted.join(',')}`) / 4294967296) * sorted.length)
    % sorted.length];
}

/**
 * MURDER IN PLAIN SIGHT — and the missing conclave is the mechanic, not a
 * saving on lines of code.
 *
 * One Traitor acts alone at a dinner party. Nobody meets, so nobody is
 * overruled, so `gs.tr.conclaveTension` takes nothing — this is the one night
 * the pact can take a body without anybody having to lose an argument about
 * it, and it is therefore the one night that costs the pact nothing at the
 * endgame. That is a real and measurable difference between this variant and
 * every other one, and it exists nowhere in the prose.
 *
 * `formPreference` still runs, once, for the actor: they are choosing, they
 * are just not being argued with.
 */
function _plainSight(ep, rng) {
  const pact = livingTraitors(ep);
  if (!pact.length) return null;
  const actor = _hashPick(pact, `plain-sight-actor|${ep}`);
  const pref = formPreference(actor, ep, rng);
  if (!pref.target) return null;
  const target = pref.target;
  const cost = murderCost(target, pref.reason, ep);
  const method = PLAIN_SIGHT_METHODS[
    _lineHash(`plain-sight-method|${ep}|${target}`) % PLAIN_SIGHT_METHODS.length];
  const nearby = dinnerNeighbours(ep, actor, target);
  const data = { actor, method, nearby };
  const l = variantLine('plain-sight', ep, { who: actor, victim: target, method });
  const line = l.text, lineKey = l.key;
  const decision = { decision: 'murder', target, reason: pref.reason, decidedBy: actor,
    argued: [{ traitor: actor, ...pref }], overruled: [] };

  if (isShielded(target)) {
    gs.tr.shieldedThisRound.delete(target);
    (gs.tr.blockedMurders ||= []).push({ ep, target });
    return { target, blocked: true, victim: null, cost, decision,
      variant: 'plain-sight', variantData: data, variantLine: line, variantLineKey: lineKey };
  }
  gs.activePlayers = (gs.activePlayers || []).filter(n => n !== target);
  return { target, blocked: false, victim: target, cost, decision, second: null,
    variant: 'plain-sight', variantData: data, variantLine: line, variantLineKey: lineKey };
}

/**
 * TRAITORS FORCED TO NAME ONE OF THEIR OWN.
 *
 * No conclave either, and for the opposite reason: there is nothing to argue
 * about, only somebody to sign for it. The pact's loudest voice picks the
 * fellow they can least stand, and EVERY SURVIVING TRAITOR takes a
 * `conclaveTension` entry naming the decider — which is the same ledger the
 * endgame betrayal reads, so a season that ran this night arrives at the
 * finale with a pact that has a reason.
 *
 * TAKES NO RNG DRAW AT ALL, unlike every other path through this file. That is
 * deliberate and it is the honest accounting: nothing here is uncertain. The
 * consequence is that a `name-your-own` night re-routes the stream hard, which
 * is a mechanism acting and not a leak.
 *
 * IT LEAVES NO EVIDENCE OF ITS OWN, and the absence is the design — see the
 * header of js/tr/murder-variants.js. `murderEvidence` fires over a Traitor's
 * body and indicts whoever pushed that name at the table, which is to say the
 * people who had it right. The room is handed a fluent, confident, backwards
 * read, and there is no channel here to soften it.
 */
function _forcedSacrifice(ep) {
  const { decider, victim } = chooseSacrifice(ep);
  if (!decider || !victim) return null;
  const cost = murderCost(victim, 'forced', ep);
  const l = variantLine('name-your-own', ep, { decider, victim });
  const line = l.text, lineKey = l.key;
  const decision = { decision: 'murder', target: victim, reason: 'forced',
    decidedBy: decider, argued: [], overruled: [] };
  const data = { decider, sacrificed: victim };

  if (isShielded(victim)) {
    gs.tr.shieldedThisRound.delete(victim);
    (gs.tr.blockedMurders ||= []).push({ ep, target: victim });
    return { target: victim, blocked: true, victim: null, cost, decision,
      variant: 'name-your-own', variantData: data, variantLine: line, variantLineKey: lineKey };
  }
  // The grudge, and it is the whole price of the night. Written in the shape
  // the endgame already reads: the survivor lost an argument they were never
  // allowed to have, over a target that was one of their own.
  const survivors = livingTraitors(ep).filter(n => n !== victim && n !== decider);
  (gs.tr.conclaveTension ||= []).push(...survivors.map(loser => ({
    ep, winner: decider, loser, target: victim, theirTarget: null, forced: true,
  })));
  gs.activePlayers = (gs.activePlayers || []).filter(n => n !== victim);
  return { target: victim, blocked: false, victim, cost, decision, second: null,
    variant: 'name-your-own', variantData: data, variantLine: line, variantLineKey: lineKey };
}
