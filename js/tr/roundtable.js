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
    const board = suspicionBoard(speaker, ep, living);
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
  const banished = result.eliminated
    || (result.tiedPlayers || living)[Math.floor(rng() * ((result.tiedPlayers || living).length))];

  const wasTraitor = alignmentAt(banished, ep) === 'traitor';
  const round = { ep, banished, banishedWasTraitor: wasTraitor, murdered: null,
    ballots, revotes, accusations };
  recordRound(round);
  gs.activePlayers = living.filter(n => n !== banished);
  revealCascade(banished, wasTraitor, ep, rng);
  return { ...round, wasTraitor, tally: tally(ballots) };
}
