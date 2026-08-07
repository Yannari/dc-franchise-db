// ══════════════════════════════════════════════════════════════════════
// bb/jury-sentiment.js — what each juror thinks of the people still playing
// ══════════════════════════════════════════════════════════════════════
//
// The jury vote used to be computed at the finale out of stats and bonds, which
// meant the six weeks a juror spent sitting in a lodge with nothing to do but
// form an opinion changed nothing about the opinion. Somebody could be told, on
// the way out of the door, that their closest ally wrote their name down — and
// still vote for that ally at the end, because nothing carried the finding-out
// from the night it happened to the night it mattered.
//
// So a juror carries a READ of every player still in the house: a signed number
// that starts from their own game and moves when something happens to move it.
//
// Two rules hold this together.
//
// CONVICTION IS HEADROOM, NOT A LOCK. Nothing here says "a juror above 4.0
// cannot change their mind". Instead every move is scaled by how hard the read
// already is, so a juror drifts less and less as they harden and ends up
// effectively locked without any threshold saying so — while a big enough event
// can still budge them a little, which is the behaviour a lock cannot produce.
// Toss-ups have the most headroom, which is where a season should be decided.
//
// IT IS STORED BECAUSE IT CANNOT BE DERIVED. Everything else about the jury —
// who is on it, when it opened — is read back out of the weeks ledger on
// demand, because a roster copied into state every Thursday is how gs reached
// nineteen megabytes. A read is different: it ACCUMULATES from events, so there
// is nothing to recompute it from. It is kept small instead — one number per
// juror per player, and a log capped at the most recent entries.

import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';
import { knowsVote } from './knowledge.js';

const LOG_CAP = 40;

// How fast headroom closes. At k = 0.9 a fresh read moves at full strength, a
// read of ±2 at about a third, and ±6 at a sixth — hardening, never sealed.
const HEADROOM_K = 0.9;

/**
 * How wide open a juror of this temperament stays.
 *
 * An amplifier on the headroom, not a gate: everybody can still move, some
 * people just keep moving for longer. Chaos agents and wildcards are the
 * jurors who are still arguing with themselves on finale night; a loyal
 * soldier decided in the car and spends six weeks confirming it.
 */
const OPENNESS = {
  'chaos-agent': 1.45, wildcard: 1.35, floater: 1.2, goat: 1.15,
  'social-butterfly': 1.1, showmancer: 1.05, underdog: 1.05,
  hothead: 0.95, 'challenge-beast': 0.95, hero: 0.9,
  schemer: 0.9, mastermind: 0.85, 'perceptive-player': 0.85,
  villain: 0.85, 'loyal-soldier': 0.7,
};

const archetypeOf = name => players.find(p => p.name === name)?.archetype || 'floater';
const openness = name => OPENNESS[archetypeOf(name)] ?? 1;

function store() {
  gs.bb ||= {};
  gs.bb.jurySentiment ||= {};
  return gs.bb.jurySentiment;
}

function record(juror) {
  const all = store();
  all[juror] ||= { reads: {}, log: [] };
  return all[juror];
}

/**
 * What this juror thinks of this player, right now. Positive is a vote.
 *
 * Zero for a pair with no history, which is also the honest answer — a juror
 * who never played with somebody has no read to give.
 */
export function readOf(juror, player) {
  if (!juror || !player) return 0;
  return Number(store()[juror]?.reads?.[player]) || 0;
}

/**
 * The narrative label for a read. TEXT SELECTION ONLY.
 *
 * Nothing mechanical branches on these words — the consequences everywhere in
 * this system scale off the number itself. They exist so a screen can say
 * "leaning" instead of "1.8" and so the roundtable can pick which sentence a
 * juror says out loud.
 */
export function stanceOf(juror, player) {
  const r = readOf(juror, player);
  if (r >= 3.5) return 'locked';
  if (r >= 1.2) return 'leaning';
  if (r <= -3.5) return 'hostile';
  if (r <= -1.2) return 'cooling';
  return 'toss-up';
}

/**
 * Seed a juror's reads on the night they are evicted.
 *
 * Built entirely out of things that already happened, so a juror arrives at the
 * lodge with the opinions their game earned them rather than a blank slate:
 * how close they were, whether that person wrote their name down, whether a
 * promise about the end was broken doing it, and whether they respect the game
 * being played. All proportional — no term is a switch.
 */
export function seedJurorReads(juror, week = 0) {
  if (!juror) return;
  const rec = record(juror);
  // Idempotent on purpose. The blowup at the door seeds a juror so it can move
  // their read the same night, and the jury house seeds every arrival it finds
  // unseeded; re-seeding would wipe the conviction they walked in with.
  if (rec.seeded) return;
  rec.seeded = true;
  const jS = pStats(juror);
  // A juror who values loyalty takes a betrayal harder; a strategic one is
  // readier to respect the move that removed them.
  const grudgeWeight = 0.6 + (jS.loyalty / 10) * 0.8;
  const respectWeight = 0.3 + (jS.strategic / 10) * 0.7;

  for (const player of gs.activePlayers || []) {
    if (player === juror) continue;
    let read = getBond(juror, player) * 0.28;

    // Who wrote their name down — as a matter of record, not belief. This is
    // the seed; whether the juror KNOWS it is what the jury house is for, and
    // an unknown betrayal cannot move a read until somebody tells them.
    const ownWeek = (gs.bb?.weeks || []).find(w => w.evicted === juror);
    const wroteIt = (ownWeek?.ballots || []).some(b => b.voter === player && b.evict === juror);
    if (wroteIt && knowsTheyDidIt(juror, player)) read -= 1.6 * grudgeWeight;

    // A broken promise about the end is worse than a vote.
    const broke = (ownWeek?.dealBreaks || []).some(d => d.breaker === player && d.victim === juror);
    if (broke && knowsTheyDidIt(juror, player)) read -= 1.3 * grudgeWeight;

    // And respect for the game itself, which is the half of a jury that is not
    // about feelings.
    const pS = pStats(player);
    read += ((pS.strategic + pS.social) / 20) * respectWeight;
    const bigMoves = Number(gs.playerStates?.[player]?.bigMoves) || 0;
    read += Math.min(1.2, bigMoves * 0.22) * respectWeight;

    rec.reads[player] = read;
  }
  rec.log.push({ week, kind: 'seated', player: null, delta: 0,
    text: `${juror} walks into the jury house carrying the game they just left.` });
  trimLog(rec);
}

/**
 * A grudge needs the juror to actually believe it happened.
 *
 * The vote is secret. Somebody can walk out of this house having been written
 * down by their closest ally and seed a WARM read on them, because as far as
 * they know that person kept them — and then find out in the lodge, which is
 * exactly the moment the jury house exists to dramatise. Seeding the grudge
 * from the ballot regardless would spend that reveal before it happened.
 */
function knowsTheyDidIt(juror, player) {
  try { return !!knowsVote(juror, player, juror); } catch { return false; }
}

/**
 * Move a read.
 *
 * `strength` is what happened, `credibility` is how much this particular juror
 * rates the source of it, and the headroom term is how much room is left in a
 * mind that has already been made up. Multiplied, never compared.
 *
 * @returns {number} the delta actually applied, for the caller to narrate
 */
export function moveRead(juror, player, { strength = 0, credibility = 1, kind = 'event',
  week = 0, text = '' } = {}) {
  if (!juror || !player || !strength) return 0;
  const rec = record(juror);
  const current = Number(rec.reads[player]) || 0;
  const headroom = (1 / (1 + Math.abs(current) * HEADROOM_K)) * openness(juror);
  const delta = strength * credibility * headroom;
  if (!Number.isFinite(delta) || !delta) return 0;
  rec.reads[player] = current + delta;
  rec.log.push({ week, kind, player, delta, text });
  trimLog(rec);
  return delta;
}

function trimLog(rec) {
  if (rec.log.length > LOG_CAP) rec.log.splice(0, rec.log.length - LOG_CAP);
}

// How a message lands before the juror's own temperament gets to it. Modest on
// purpose: a goodbye message is ONE of the things a juror carries out of the
// door, alongside who wrote their name down, what the lodge argues about for
// six weeks and what gets said at the final questioning. It should colour a
// read, not set it — a warm message from somebody with no résumé must not beat
// a season of play, and a smug one must not sink a game on its own.
const GOODBYE_TONE = {
  // Voted them out AND was close to them: the message where the betrayal is
  // admitted to somebody who did not know. The worst of the four, and still
  // worth less than finding out from a juror in the lodge (-1.6).
  confession: -1.0,
  // Voted them out and never pretended otherwise. Cold rather than cruel.
  unapologetic: -0.7,
  // Kept them, or was simply fond of them.
  warm: 0.8,
  // Somebody they barely spoke to, being polite.
  polite: 0.1,
};

/**
 * The messages the house recorded, and what they do to a vote.
 *
 * Every evictee watches these on the way out and nothing came of it: the
 * screen showed a houseguest gloating and the ballot at the end of the season
 * had never heard about it. In the real format this is the moment a juror
 * decides how they feel about somebody, because it is the last thing that
 * person says to them and the only one they cannot answer.
 *
 * The juror's own temperament decides how much it counts, using the same split
 * the seeding uses: somebody who values loyalty takes a confession badly,
 * somebody who values strategy hears a person owning a good move.
 *
 * @returns {Array} what moved, for the transcript and the screen
 */
export function applyGoodbyeMessages(juror, goodbyes = [], week = 0) {
  if (!juror || !goodbyes.length) return [];
  const rec = record(juror);
  if (rec.goodbyesHeard) return [];   // one airing per evictee
  rec.goodbyesHeard = true;

  const jS = pStats(juror);
  const grudge = 0.6 + (jS.loyalty / 10) * 0.8;      // 0.6 – 1.4
  const respect = 0.3 + (jS.strategic / 10) * 0.7;   // 0.3 – 1.0
  const moved = [];

  for (const g of goodbyes) {
    if (!g?.name || g.tone === 'montage') continue;
    if (!(gs.activePlayers || []).includes(g.name)) continue;   // cannot vote for somebody already gone
    const base = GOODBYE_TONE[g.tone];
    if (!base) continue;
    // A betrayal message is weighed by how much this juror minds betrayal; a
    // strategic juror hears the same words as somebody explaining a move, and
    // the sting comes off it.
    const weight = base < 0
      ? grudge * (1 - respect * 0.35)
      : 1;
    const delta = moveRead(juror, g.name, {
      strength: base * weight, credibility: 1, kind: 'goodbye', week,
      text: `${g.name}'s goodbye message ${base < 0 ? 'did not land well' : 'landed'} with ${juror}.`,
    });
    if (Math.abs(delta) > 0.01) moved.push({ from: g.name, tone: g.tone, delta: Number(delta.toFixed(2)) });
  }
  return moved;
}

/** Everything that has moved this juror, oldest kept entry first. */
export function sentimentLog(juror) {
  return [...(store()[juror]?.log || [])];
}

/** Every juror who has a read on file. */
export function jurorsWithReads() {
  return Object.keys(store());
}

/**
 * What the finale should add to each finalist's score for this juror.
 *
 * Deliberately an ADJUSTMENT rather than a replacement. The existing vote model
 * weighs résumé, loyalty, big moves and social breadth, and all of that is
 * still true about a finalist — what it could not see was the six weeks of
 * argument in the lodge. So the season's accumulated read is scaled into the
 * same range those terms work in and added on top: enough to decide a vote the
 * résumés left close, not enough to hand the season to whoever lobbied best.
 */
export function sentimentAdjustment(juror, finalists = []) {
  const out = {};
  for (const f of finalists) out[f] = readOf(juror, f) * 0.22;
  return out;
}
