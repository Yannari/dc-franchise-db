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
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';
import { livingTraitors, livingFaithfuls } from './roles.js';
import { shieldSeenBy } from './powers.js';

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
    const bond = getBond(traitor, name);
    if (bond > 0) score -= (bond / 10) * 0.9;
    if (bond < -4) score -= 0.6;

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
    if (name === knownShield) score -= KNOWN_SHIELD_PENALTY;

    // Carry the raw terms alongside the score so _reasonFor can read what
    // actually drove THIS pick instead of recomputing it — a recompute can
    // silently disagree with the number that won, and Task 2 keys
    // murderCost off this label.
    return { name, score, beloved, heat, accused };
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
  const decision = runConclave(ep, rng);
  if (!decision.target) return { target: null, blocked: false, victim: null, cost: null };

  const target = decision.target;
  const cost = murderCost(target, decision.reason, ep);

  if (isShielded(target)) {
    gs.tr.shieldedThisRound.delete(target);   // spent even though it blocked
    (gs.tr.blockedMurders ||= []).push({ ep, target });
    return { target, blocked: true, victim: null, cost, decision };
  }

  gs.activePlayers = (gs.activePlayers || []).filter(n => n !== target);
  return { target, blocked: false, victim: target, cost, decision };
}
