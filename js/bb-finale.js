// ══════════════════════════════════════════════════════════════════════
// bb-finale.js — the last night in the house
// ══════════════════════════════════════════════════════════════════════
//
// From the final three: a three-part Head of Household, the winner of it cutting
// one person loose, and then the jury — the people this house has spent a season
// evicting — deciding which of the last two played it better.
//
// The jury vote itself is Total Drama's. Its model already reads exactly what a
// jury should read: what a juror personally values in a game, their resentment,
// their respect, whether they believe a finalist is the reason they are sitting
// there. All of that is canonical shared state that Big Brother has been filling
// in all season, so the work here is seating the jury and handing it over rather
// than writing a second opinion about how juries think.

import { gs, seasonConfig } from './core.js';
import { pStats, pronouns } from './players.js';
import { getBond } from './bonds.js';
import { simulateJuryVote, projectJuryVotes } from './finale.js';
import { runBBCompetition } from './bb/comps.js';
import { BB_COMPETITIONS } from './bb-comps/index.js';

/** Everyone still playing, in roster order. */
const houseNow = () => [...(gs.activePlayers || [])];

/**
 * Seat the jury from the people this season evicted.
 *
 * Total Drama's jury vote reads gs.jury and gs.jurorHistory — who was evicted,
 * and who voted them out. A house records exactly that in its ballots every
 * week, so the history is translated rather than invented, the same way the
 * ballots already translate for the vote screen.
 */
export function seatBBJury(extra = []) {
  const weeks = gs.bb?.weeks || [];
  const evicted = weeks.map(w => w.evicted).filter(Boolean);
  const size = Math.max(0, Number(seasonConfig.jurySize) || 9);
  const all = [...evicted, ...extra].filter(Boolean);
  const jury = size ? all.slice(-size) : all;

  gs.jurorHistory ||= {};
  for (const w of weeks) {
    if (!w.evicted || !jury.includes(w.evicted)) continue;
    gs.jurorHistory[w.evicted] = {
      ep: w.num,
      voters: (w.ballots || []).filter(b => b.evict === w.evicted).map(b => b.voter),
      finalBonds: Object.fromEntries((w.houseAtStart || [])
        .filter(n => n !== w.evicted)
        .map(n => [n, getBond(w.evicted, n)])),
    };
  }
  // Anyone cut at the final three was not voted out by a house, so record the
  // person who actually made the decision.
  for (const name of extra) {
    if (!jury.includes(name)) continue;
    gs.jurorHistory[name] ||= { ep: (gs.bb?.weeks?.length || 0) + 1, voters: [], finalBonds: {} };
  }

  gs.jury = jury;
  return jury;
}

/**
 * What the jury will credit a finalist with having actually done.
 *
 * The shared vote applies a passenger penalty when a finalist has no big moves
 * to their name, and a house measures those differently from an island: winning
 * when you had to, landing a backdoor, and moving a vote that was not going your
 * way.
 */
function recordBigMoves(finalists) {
  gs.playerStates ||= {};
  const weeks = gs.bb?.weeks || [];
  for (const name of finalists) {
    const st = gs.bb?.stats?.[name] || {};
    const backdoors = weeks.filter(w => w.hoh === name && w.plan?.backdoorTarget
      && w.evicted === w.plan.backdoorTarget).length;
    const flips = weeks.reduce((n, w) =>
      n + (w.ballots || []).filter(b => b.changed && b.changedBy === name).length, 0);
    gs.playerStates[name] ||= {};
    gs.playerStates[name].bigMoves = (st.hohWins || 0) + (st.vetoWins || 0) * 0.5 + backdoors * 2 + flips;
  }
}

/** One part of the three-part final competition. */
function finalPart(participants, label, category, rng, week) {
  const pool = BB_COMPETITIONS.filter(c => c.category === category && c.types.includes('hoh'));
  const forced = pool.length ? pool[Math.floor(rng() * pool.length)].id : undefined;
  const result = runBBCompetition({
    type: 'hoh', participants: [...participants], house: [...participants],
    week, rng, library: BB_COMPETITIONS, forcedId: forced, allowThrowing: false,
  });
  return { part: label, competition: result, winner: result.winner, participants: [...participants] };
}

/**
 * Run the whole last night, from the final three to a winner.
 *
 * Returns an `ep`-shaped record so the run surface and the visual player treat
 * it like any other week, or null if the house is not at its final three.
 */
export function simulateBBFinale(rng = Math.random) {
  const house = houseNow();
  if (house.length < 2) return null;

  const week = { num: (gs.bb?.weeks?.length || 0) + 1, format: 'big-brother', finale: true };
  const acts = [];
  let finalTwo = [...house];
  let finalHoh = null;
  let cut = null;

  // ── the three-part Head of Household ──
  if (house.length >= 3) {
    const one = finalPart(house, 'Part One — Endurance', 'endurance', rng, week);
    acts.push({ type: 'final-hoh-part', ...one });

    // Everybody except the part-one winner plays part two.
    const twoField = house.filter(n => n !== one.winner);
    const two = finalPart(twoField, 'Part Two — The Yard', 'physical', rng, week);
    acts.push({ type: 'final-hoh-part', ...two });

    // The two winners meet in part three, which is always a question of how
    // closely they were paying attention.
    const three = finalPart([one.winner, two.winner], 'Part Three — The House', 'quiz', rng, week);
    acts.push({ type: 'final-hoh-part', ...three });
    finalHoh = three.winner;

    // The final Head of Household takes whoever they think they beat. The
    // projection is the shared one, so they are reading the same jury the
    // jury is about to be.
    const options = house.filter(n => n !== finalHoh);
    let keep = options[0];
    try {
      const projections = options.map(other => {
        const proj = projectJuryVotes([finalHoh, other]);
        const mine = proj?.votes?.[finalHoh] ?? 0;
        const theirs = proj?.votes?.[other] ?? 0;
        return { other, margin: mine - theirs };
      }).sort((a, b) => b.margin - a.margin);
      keep = projections[0].other;
    } catch {
      // No projection available: take the person the house liked least.
      keep = options.sort((a, b) =>
        house.reduce((s, n) => s + getBond(n, a), 0) - house.reduce((s, n) => s + getBond(n, b), 0))[0];
    }
    cut = options.find(n => n !== keep) || null;
    finalTwo = [finalHoh, keep];
    acts.push({ type: 'final-cut', finalHoh, kept: keep, cut });

    if (cut) {
      gs.activePlayers = house.filter(n => n !== cut);
      gs.eliminated ||= [];
      if (!gs.eliminated.includes(cut)) gs.eliminated.push(cut);
    }
  }

  // ── the jury ──
  const jury = seatBBJury(cut ? [cut] : []);
  recordBigMoves(finalTwo);
  const verdict = simulateJuryVote(finalTwo);
  const votes = verdict.votes || {};
  const winner = finalTwo.slice().sort((a, b) => (votes[b] || 0) - (votes[a] || 0))[0];
  const runnerUp = finalTwo.find(n => n !== winner) || null;
  acts.push({ type: 'jury-vote', jury, votes, reasoning: verdict.reasoning || [], winner, runnerUp });

  gs.phase = 'complete';
  gs.winner = winner;
  gs.bb ||= {};
  gs.bb.finale = { finalHoh, finalTwo, cut, jury, votes, winner, runnerUp };

  return {
    num: week.num,
    format: 'big-brother',
    isBigBrother: true,
    isFinale: true,
    finale: true,
    houseAtStart: house,
    finalHoh, finalTwo, cut,
    jury, juryVotes: votes,
    winner, runnerUp,
    eliminated: cut || null,
    acts,
    // Total Drama's finale record shape, so anything reading a season winner
    // finds it where it expects to.
    challengeType: null, isMerge: false, riChoice: null,
    alliances: [], twists: [], tribesAtStart: [], campEvents: null,
    summaryText: '',
  };
}
