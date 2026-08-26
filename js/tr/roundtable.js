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

function tally(ballots) {
  const t = {};
  for (const b of ballots) if (b.voted) t[b.voted] = (t[b.voted] || 0) + 1;
  return t;
}

/** Run one Round Table end to end. Returns the round record, already stored. */
export function runRoundTable(ep, rng = Math.random) {
  const living = [...(gs.activePlayers || [])];
  const accusations = debate(ep, rng);

  const ballots = living.map(voter => ({
    voter,
    voted: chooseBanishmentVote(voter, living, ep, rng),
    channel: 'banishment',
  }));

  let result = resolveVotes(tally(ballots));
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
    result = resolveVotes(tally(rvBallots));
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
    ballots, revotes, accusations };
  recordRound(round);
  gs.activePlayers = living.filter(n => n !== banished);
  revealCascade(banished, wasTraitor, ep, rng);
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
  return { ...round, wasTraitor, tally: tally(ballots) };
}
