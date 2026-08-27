// ══════════════════════════════════════════════════════════════════════
// tr/roundtable.js — the debate, and the vote it produces
// ══════════════════════════════════════════════════════════════════════
//
// Two things here are not what the rest of the engine does.
//
// FIRST, an accusation is a BROADCAST. js/knowledge.js's propagate() models
// gossip: private hops between people who happen to talk, with most of the room
// never hearing it. A Round Table is the opposite — everyone hears everything,
// simultaneously, and the only variable is whether they believe it. That
// variable is trust in the ACCUSER, which is why the same true name lands when
// a liked player says it and dies when a distrusted one does.
//
// SECOND, we do not reuse simulateRevote(). Its shape is right — restrict the
// revote to the tied players, they do not vote — but it ranks compromise
// targets by Total Drama alliance and threat pressure, which is not why this
// room converges, and it calls Math.random(), which a season that must replay
// from a seed cannot afford.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';
import { resolveVotes } from '../voting.js';
import { learn } from '../knowledge.js';
import { alignmentAt } from './roles.js';
import { alignmentFactId, suspicionBoard, chooseBanishmentVote, recordRound, revealCascade } from './deduction.js';
import { exitSpeech } from './exit.js';
import { lineFor } from './castle/lines.js';
import { daggerWeights, daggerDrawnAt, DAGGER_VOTES } from './powers.js';

/**
 * One player names another in front of everybody.
 *
 * The claim is OFFERED to every listener in the room, but belief is filtered
 * per listener: each one runs their own read-skill check (inside learn), and
 * learn()'s accept gate goes negative below a credibility of 0.55 while a bare
 * accusation here only ever supplies ~0.3-0.45 — so roughly one in five actually
 * come to believe it, not the whole room at once. What scales the claim before
 * it gets there is the accuser: their `social` for how well it is put, and each
 * listener's own bond with them for whether it is worth hearing.
 */
export function broadcast(accuser, target, ep, rng = Math.random) {
  const room = (gs.activePlayers || []).filter(n => n !== accuser && n !== target);
  const pitch = 0.25 + (pStats(accuser).social || 5) / 20;   // 0.25 .. 0.75
  const heard = [];
  for (const listener of room) {
    const trust = 0.55 + Math.max(-0.35, Math.min(0.45, getBond(listener, accuser) / 22));
    const belief = learn(listener, alignmentFactId(target), {
      source: `${accuser} at the Round Table`,
      sourceType: 'rumor',
      confidence: Math.max(0.05, Math.min(0.6, pitch * trust)),
      ep, from: accuser, rng,
    });
    if (belief) heard.push(listener);
  }
  return heard;
}

/** Who speaks, and about whom. The loudest reads in the room get aired. */
function debate(ep, rng) {
  const living = gs.activePlayers || [];
  const accusations = [];
  for (const speaker of living) {
    // A Traitor's suspicion board is topped by the people they were TOLD about
    // in the turret, at a certainty no Faithful can ever reach. Reading it
    // straight makes the faction stand up on night one and name each other in
    // front of the room, which is not a debate, it is a confession. They speak
    // about the same pool they are willing to write down: everyone but the pact.
    const pool = alignmentAt(speaker, ep) === 'traitor'
      ? living.filter(n => alignmentAt(n, ep) !== 'traitor')
      : living;
    const board = suspicionBoard(speaker, ep, pool.length ? pool : living);
    const top = board[0];
    // Somebody with no read at all keeps quiet rather than inventing one.
    // Boldness decides who speaks anyway.
    const willSpeak = (top?.score || 0) > 0.12 || rng() < (pStats(speaker).boldness || 5) / 45;
    if (!willSpeak || !top) continue;
    accusations.push({ accuser: speaker, target: top.name });
  }
  for (const a of accusations) broadcast(a.accuser, a.target, ep, rng);
  return accusations;
}

/**
 * Count the ballots. One name each, and one of them may be worth two.
 *
 * THE DAGGER LIVES HERE AND NOWHERE ELSE, and the reason is the single most
 * load-bearing fact about this file. A ballot is a PUBLIC fact — it is read
 * out loud at the table, `ballotEvidence` and `shieldEvidence` both read the
 * array below, and they are the only `public`-credibility facts the deduction
 * model has. Doubling a vote by pushing a second ballot would put a name into
 * that record that nobody said, and every belief formed downstream of it would
 * be reasoning about a sentence the room never heard.
 *
 * So the ballots are untouched — one voter, one name, said once — and the
 * WEIGHT is applied while counting. `weights` is a plain `{ voter: n }` map and
 * is absent on every table that has no Dagger drawn at it, which is nearly all
 * of them; `|| 1` is the whole of the default and the shape is deliberately
 * open so the endgame can hand it something else without touching this.
 */
function tally(ballots, weights) {
  const t = {};
  for (const b of ballots) if (b.voted) t[b.voted] = (t[b.voted] || 0) + (weights?.[b.voter] || 1);
  return t;
}

// WHAT A TRAITOR NAMING A TRAITOR SOUNDS LIKE, and why this pool exists at all.
//
// Plan 6 Task 6 made the pact a price rather than a bar, so a Traitor CAN write
// a fellow's name down — and the season then said nothing about it. No event, no
// thread beat, no exit line: the single most dramatic thing the format does
// produced not one sentence anywhere. Task 7 is where the format's betrayals
// mostly happen, so it is where the silence gets closed.
//
// Two rules bind these lines. They are chosen by `lineFor` and take NO rng draw,
// so adding to the pool cannot reroute a season (see tr/castle/lines.js). And
// every one of them may only assert what the record itself guarantees: that
// `voter` and `target` were both in the pact on this night and that the voter
// wrote the other's name down. Nothing here may claim the vote landed, that the
// room noticed, or that anybody was cleared — Task 3 measured that this
// knowledge model cannot exonerate anyone, so a betrayal's fallout is shock and
// suspicion and never innocence.
const BETRAYAL_LINES = [
  '{voter} writes down the name of somebody {voter} shared the turret with.',
  'The pact is worth less to {voter} tonight than what is left on the table: {target}, in {voter}’s own hand.',
  '{voter} names {target} — and only the two of them know what that ballot really is.',
  'Whatever {voter} and {target} swore upstairs, {voter} has just put it on a slate.',
];

/**
 * Every ballot at this table that one Traitor cast against another.
 *
 * A RECORD, not a mechanism: nothing in the engine reads it, exactly like
 * `banishedWasTraitor` and `aliveAtVote`. It reads ground truth because it is a
 * record of what happened rather than of what anybody believed, and it is the
 * only place the season can say a betrayal occurred at all.
 */
function betrayals(ballots, ep) {
  const out = [];
  for (const b of ballots) {
    if (!b.voted || b.channel !== 'banishment') continue;
    if (alignmentAt(b.voter, ep) !== 'traitor') continue;
    if (alignmentAt(b.voted, ep) !== 'traitor') continue;
    out.push({ voter: b.voter, target: b.voted,
      line: lineFor(BETRAYAL_LINES, `tr-betrayal|${ep}`, { voter: b.voter, target: b.voted }) });
  }
  return out;
}

/**
 * Run one Round Table end to end. Returns the round record, already stored.
 *
 * `reveal` is the endgame's one change to this file (spec §8, Plan 6 Task 7).
 * A player banished in the finale does not say what they were, so the reveal
 * cascade — the mechanism that converts a round of meaningless ballots into
 * evidence, and the reason late tables are sharper than early ones — is
 * switched OFF there. Passing `false` must not change anything else: the
 * debate, the ballots, the tie rule and the exit speech all run as they always
 * do, and the round record still carries `banishedWasTraitor` because that is
 * the export shape and the audience is not the room.
 */
export function runRoundTable(ep, rng = Math.random, { reveal = true } = {}) {
  const living = [...(gs.activePlayers || [])];
  const accusations = debate(ep, rng);

  // THE DAGGER IS DECLARED BEFORE A NAME IS READ, and the call takes NO rng
  // draw: whether tonight is the night was decided when the thing was won
  // (js/tr/powers.js), so a table with a Dagger at it draws exactly as many
  // numbers as a table without one and the two seasons remain comparable.
  const weights = daggerWeights(ep, living);
  const daggerHolder = weights ? Object.keys(weights)[0] : null;

  const ballots = living.map(voter => ({
    voter,
    voted: chooseBanishmentVote(voter, living, ep, rng),
    channel: 'banishment',
  }));

  let result = resolveVotes(tally(ballots, weights));
  const revotes = [];
  // The format's tie rule: only the tied are eligible, and they do not vote.
  // Capped, because a tiny room can deadlock indefinitely; the last resort is a
  // seeded draw, which the real show also does (it hands them boxes to open).
  let guard = 0;
  while (result.isTie && guard++ < 3) {
    const tied = result.tiedPlayers || [];
    const voters = living.filter(n => !tied.includes(n));
    const rvBallots = voters.map(voter => ({
      voter, voted: chooseBanishmentVote(voter, tied, ep, rng), channel: 'banishment-revote',
    }));
    revotes.push({ tied, ballots: rvBallots });
    // The Dagger carries into the revote it failed to prevent — it is drawn
    // for a BANISHMENT, and a revote is the same banishment still being
    // decided rather than a new one. It does nothing when its holder is one of
    // the tied, since the tied do not vote.
    result = resolveVotes(tally(rvBallots, weights));
    if (result.isTie && !voters.length) break;
  }
  // The last-resort draw, and the reason it is written this defensively.
  //
  // When every living player draws exactly one vote, `tiedPlayers` is the whole
  // room, the revote has no eligible voters, and `resolveVotes({})` hands back an
  // EMPTY `tiedPlayers`. `|| living` does not rescue that: `[]` is truthy, so the
  // fallback never fires and `[][NaN]` is `undefined`. A round then banishes
  // nobody — the season silently skips a banishment, the round drops out of
  // `ballotEvidence` forever, and `revealCascade(undefined, ...)` teaches every
  // living player a `public`-certainty alignment about a person who does not
  // exist. Fall back on EMPTINESS, never on presence.
  const drawPool = (result.tiedPlayers && result.tiedPlayers.length)
    ? result.tiedPlayers
    : living;
  const banished = result.eliminated
    || (drawPool.length ? drawPool[Math.floor(rng() * drawPool.length)] : null);
  if (!banished) return null;   // an empty castle has nobody to banish

  const wasTraitor = alignmentAt(banished, ep) === 'traitor';
  const round = { ep, banished, banishedWasTraitor: wasTraitor, murdered: null,
    ballots, revotes, accusations, betrayals: betrayals(ballots, ep) };
  if (daggerHolder) {
    // Recorded on the round, because the room watched it happen: the draw is
    // public even though the win was not. `votes` is read off the exported
    // constant rather than written as a literal 2, so the record and the tally
    // cannot come to disagree about how much a Dagger is worth.
    const drawn = daggerDrawnAt(ep);
    round.dagger = { holder: daggerHolder, votes: DAGGER_VOTES,
      line: drawn?.drawLine || null };
    if (drawn) {
      drawn.target = ballots.find(b => b.voter === daggerHolder)?.voted || null;
      drawn.banished = banished;
    }
  }
  recordRound(round);
  gs.activePlayers = living.filter(n => n !== banished);
  if (reveal) revealCascade(banished, wasTraitor, ep, rng);
  // THE SPEECH, on the round record where the export shape and the VP can read
  // it. Generated from what the LEAVER believes, so it must run after the
  // removal — a banished player names somebody still in the castle.
  //
  // It deliberately forms NO belief in anybody. A burn is one person shouting
  // on their way out of a door, and how much of it sticks is residue: threads,
  // cooldowns and the castle event pool, which Plan 4 owns. Wiring the
  // consequence here would build that mechanism twice, in the wrong file and
  // without the decay Plan 4 needs. Generation and record are wired now, so
  // nothing rebuilds the speech itself. Measured inert: suppressing this call
  // moves early lift by under 1pp across five 200-season blocks, which is the
  // rng stream shifting and nothing else.
  round.exitSpeech = exitSpeech(banished, ep, rng);
  return { ...round, wasTraitor, tally: tally(ballots, weights) };
}
