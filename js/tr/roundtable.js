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
import { pStats, pronouns } from '../players.js';
import { getBond } from '../bonds.js';
import { resolveVotes } from '../voting.js';
import { learn } from '../knowledge.js';
import { alignmentAt } from './roles.js';
import { alignmentFactId, suspicionBoard, chooseBanishmentVote, recordRound, revealCascade } from './deduction.js';
import { exitSpeech } from './exit.js';
import { lineFor, _lineHash } from './castle/lines.js';
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
//
// THE FIRST LINE USED TO NAME NOBODY BUT THE BETRAYER, TWICE OVER: "{voter}
// writes down the name of somebody {voter} shared the turret with." It was the
// most-fired template in the pool (89 occurrences in a 1,200-season sweep), it
// repeated the actor, and it never once said WHO — which is the only dramatic
// content a betrayal line has. `pronouns()` carries the repetition now and the
// target is on the slate where it belongs.
const BETRAYAL_LINES = [
  '{voter} writes down the name of somebody {sub} shared the turret with: {target}.',
  'The pact is worth less to {voter} tonight than what is left on the table: {target}, in {posAdj} own hand.',
  '{voter} names {target} — and only the two of them know what that ballot really is.',
  // "Whatever the two of them swore upstairs" was the first draft of this line
  // and it was caught by dumping seasons and reading them: with the actor moved
  // out of the opening clause there is nothing for "the two of them" to refer
  // BACK to, and the sentence opens on a pronoun with no antecedent. The
  // passive keeps both names to one mention each and points at nobody until
  // the clause that names them.
  'Whatever was sworn upstairs, {voter} has just put {target} on a slate.',
];

/**
 * Every ballot at this table that one Traitor cast against another.
 *
 * A RECORD, not a mechanism: nothing in the engine reads it, exactly like
 * `banishedWasTraitor` and `aliveAtVote`. It reads ground truth because it is a
 * record of what happened rather than of what anybody believed, and it is the
 * only place the season can say a betrayal occurred at all.
 *
 * IT TAKES THE WHOLE TABLE, NOT THE FIRST ROUND OF IT (whole-plan review, F4).
 * This used to be handed `ballots` alone and to filter on
 * `channel === 'banishment'`, so a Traitor who named a fellow in the REVOTE was
 * recorded nowhere and narrated nothing — and Task 6 deliberately made a fellow
 * eligible to be among the tied, which is what puts them on a revote slate in
 * the first place. Measured at 1,200 seasons: 438 such ballots, 27.5% of every
 * betrayal the format produces, silent. The channel filter that hid them was
 * itself the awareness: `banishment-revote` is a different string, and nothing
 * ever came back to it.
 *
 * ONE RECORD PER PAIR PER TABLE. A voter who names the same fellow in the first
 * round and again in the revote has not betrayed them twice; they have been
 * held to it. Two records would print two sentences about one act, which is the
 * repetition defect F5 is about. `channel` says where it was first cast, so a
 * reader can still tell a revote-only turn from one that opened the evening.
 *
 * EXPORTED FOR ONE REASON: a turn cast ONLY in a revote happens 41 times in
 * 1,200 seasons (3.4% of all turns), so a guard that waits for one to come
 * round in a sampled population is the unfalsifiable-by-rarity shape Task 4's
 * mutation survived. tests/tr-endgame.test.js builds the table instead and
 * calls this directly. Nothing in the show may call it but `runRoundTable`.
 */
export function betrayals(round, ep) {
  const turns = [];
  const seen = new Set();
  const everyBallot = [
    ...(round.ballots || []),
    ...(round.revotes || []).flatMap(rv => rv.ballots || []),
  ];
  for (const b of everyBallot) {
    if (!b.voted) continue;
    if (alignmentAt(b.voter, ep) !== 'traitor') continue;
    if (alignmentAt(b.voted, ep) !== 'traitor') continue;
    const pair = `${b.voter} ${b.voted}`;
    if (seen.has(pair)) continue;
    seen.add(pair);
    turns.push({ voter: b.voter, target: b.voted, channel: b.channel });
  }
  if (!turns.length) return [];

  return turns.map((t, k) => ({ ...t, line: _betrayalLine(t, k, turns, ep) }));
}

/**
 * One sentence for one turn, and never the same one twice at a table.
 *
 * THE KEY USED TO BE `tr-betrayal|${ep}` ALONE, so every betrayer at one table
 * hashed identically and 65.7% of multi-betrayal tables printed the same
 * template twice with the names swapped: "Whatever Brightly and Brody swore
 * upstairs, Brightly has just put it on a slate." / "Whatever Brody and
 * Brightly swore upstairs, Brody has just put it on a slate." Every other key
 * in this plan carries the actor; this one did not. `lineFor` folds the subs
 * values into its hash, but the subs are the same two names in both
 * directions, so they could never separate the pair on their own.
 *
 * PUTTING THE ACTOR IN THE KEY IS NOT ENOUGH EITHER, and this is the part that
 * had to be measured rather than reasoned about: two independent hashes into a
 * four-line pool collide one time in four however they are keyed, and three of
 * them collide about six times in ten. Rotating the pool per betrayer after
 * hashing does not help — two independent draws are still two independent
 * draws, and the first draft of this fix went red on exactly that.
 *
 * So the pool is WALKED. ONE hash, taken over the whole table, decides where
 * the walk starts; the ordinal decides how far along it each betrayer sits.
 * Distinct by construction for as many betrayers as there are templates, which
 * is this project's `_pickUnique` rule. A fifth at one table would have to
 * reuse one, and with three Traitors there is never a fifth. The start hash
 * takes every name that turned, so two tables do not read alike, and it costs
 * no rng draw — `_lineHash` is the same free hash `lineFor` uses.
 */
function _betrayalLine(turn, k, turns, ep) {
  const start = _lineHash(`tr-betrayal|${ep}|`
    + turns.map(t => `${t.voter}>${t.target}`).join('|'));
  const idx = (start + k) % BETRAYAL_LINES.length;
  return lineFor([BETRAYAL_LINES[idx]], `tr-betrayal|${ep}|${turn.voter}`,
    { voter: turn.voter, target: turn.target,
      sub: pronouns(turn.voter).sub, posAdj: pronouns(turn.voter).posAdj });
}

/**
 * Run one Round Table end to end. Returns the round record, already stored.
 *
 * `reveal` is the endgame's one change to this file (spec §8, Plan 6 Task 7).
 * A player banished in the finale does not say what they were, so the reveal
 * cascade — the mechanism that converts a round of meaningless ballots into
 * evidence, and the reason late tables are sharper than early ones — is
 * switched OFF there. It also suppresses the RECORD of the exit speech, which
 * is the other place a certain alignment escaped — see the long note at the
 * bottom of this function. Everything else runs exactly as it always does: the
 * debate, the ballots, the tie rule, and the speech itself is still generated
 * so the rng stream is untouched. The round record still carries
 * `banishedWasTraitor` because that is the export shape and the audience is
 * not the room.
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
    // THE WHOLE TABLE, revotes included — see the note on `betrayals`. By this
    // line the tie loop has finished, so `revotes` is complete.
    ballots, revotes, accusations, betrayals: betrayals({ ballots, revotes }, ep) };
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
  //
  // ── AND IT IS THE SECOND REVEAL IN THIS FUNCTION (spec §8) ──────────
  //
  // `reveal: false` suppresses `revealCascade` one line above and stopped
  // there, but a Traitor's exit speech is drawn from GROUND TRUTH: exit.js
  // picks the target out of the living Traitors and stamps `conviction: 1`.
  // So a finale banishment shipped a certain, correct alignment on
  // `endgame.rounds[].exitSpeech`, where spec §8 says there are no reveals
  // and the survivors go on nerve alone. Measured 189 of 1,680 endgame
  // rounds over 1,200 seasons (11.3%) — e.g. seed 3, "Brightly names Brody
  // on the way out", both Traitors. Invisible only because nothing reads the
  // field yet; Plan 8 builds the reader.
  //
  // SUPPRESSED FOR EVERYBODY, NOT JUST FOR TRAITORS. A Faithful's speech
  // leaks nothing — it comes off a suspicion board — so laundering only the
  // Traitor branch was the obvious smaller fix and it is wrong: if Traitors
  // are the only people who leave the finale in silence, the silence IS the
  // reveal. The rule has to be blind to alignment to be a rule at all.
  //
  // THE CALL STILL HAPPENS AND ITS RESULT IS DROPPED, deliberately.
  // `exitSpeech` draws from `rng` (the target when there is no board, and the
  // burn roll), and the endgame runs table after table off this same stream.
  // Skipping the call would shift every draw after it and re-roll the phase,
  // so Task 7's endgame measurements would no longer describe head. Consuming
  // the draws and discarding the record keeps the finale bit-identical and
  // costs one dead object per banishment. Do not "optimise" this away.
  const speech = exitSpeech(banished, ep, rng);
  round.exitSpeech = reveal ? speech : null;
  return { ...round, wasTraitor, tally: tally(ballots, weights) };
}
