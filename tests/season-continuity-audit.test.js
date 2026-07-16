// @vitest-environment jsdom
// Season continuity + edge-case audit (roadmap items 2 & 4). Runs full seasons with
// advantages enabled, validates per-tribal logic consistency (the eliminated player
// matches the vote tally OR an idol/tie/SITD/emissary/exile/revote explains the
// deviation; every ballot names a real target and carries a reason), and detects the
// rare rule combos, asserting each still resolves to one valid state — no crash, no
// contradiction, no phantom boot. Plus direct resolveVotes edge unit tests.
import { describe, it, expect } from 'vitest';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { resolveVotes } from '../js/voting.js';

function auditSeason(g) {
  const problems = [];
  const edges = { ties: 0, rockDraws: 0, idolPlays: 0, idolMisplays: 0, doubleElims: 0, sitd: 0, emissary: 0, exileDuel: 0, revotes: 0, blackVotes: 0 };
  const eh = g.episodeHistory || [];
  const validNames = new Set((g.eliminated || []).concat(g.activePlayers || [], (g.jury || [])));
  (core.players || []).forEach(p => validNames.add(p.name));

  eh.forEach((h, i) => {
    if (h.isTie) edges.ties++;
    if (h.isRockDraw) edges.rockDraws++;
    if ((h.idolPlays || []).length) edges.idolPlays += h.idolPlays.length;
    if ((h.idolMisplays || []).length) edges.idolMisplays += h.idolMisplays.length;
    if (h.announcedDoubleElim || h.firstEliminated) edges.doubleElims++;
    if (h.blackVoteApplied || h.sidFreshVote) edges.sitd++;
    if (h.blackVote || h.blackVote1 || h.blackVote2) edges.blackVotes++;
    if (h.emissaryEliminated) edges.emissary++;
    if (h.exileDuelVotedOut) edges.exileDuel++;
    if ((h.revoteLog || []).length || (h.revoteVotes && Object.keys(h.revoteVotes).length)) edges.revotes++;

    if (!h.votes || !Object.keys(h.votes).length) return; // non-elimination / no-vote episode

    // ── ballot integrity ──
    (h.votingLog || []).forEach(b => {
      if (!b.voter || b.voter === 'THE GAME') return;
      if (b.voted && !validNames.has(b.voted)) problems.push(`ep${i + 1}: ${b.voter} voted for non-player "${b.voted}"`);
      if (b.voted && (typeof b.reason !== 'string' || !b.reason.length)) problems.push(`ep${i + 1}: ${b.voter}->${b.voted} ballot has no reason`);
    });

    // ── elimination consistency vs the tally ──
    const counts = h.votes, top = Math.max(...Object.values(counts));
    const leaders = Object.keys(counts).filter(k => counts[k] === top);
    const elim = h.eliminated || h.firstEliminated;
    if (elim && !leaders.includes(elim)) {
      const explained = (h.idolPlays || []).length || h.isTie || h.isRockDraw || h.blackVoteApplied ||
        h.emissaryEliminated || h.exileDuelVotedOut || (h.revoteLog || []).length ||
        (h.revoteVotes && Object.keys(h.revoteVotes).length) || h.sidFreshVote;
      if (!explained) problems.push(`ep${i + 1}: booted ${elim} was NOT the vote leader (${leaders.join('/')}=${top}) with no idol/tie/SITD/revote explanation`);
    }
    if (elim && !validNames.has(elim)) problems.push(`ep${i + 1}: booted non-player "${elim}"`);
  });

  const winner = g.finaleResult?.winner || g.winner;
  if (g.phase === 'complete' && !winner) problems.push('season complete but no winner');
  if (winner && !validNames.has(winner)) problems.push(`winner "${winner}" is not a real player`);
  return { problems, edges, completed: g.phase === 'complete' ? 1 : 0 };
}

describe('season continuity + edge-case audit', () => {
  it('runs seasons with advantages and finds no logic contradictions', () => {
    const N = 40;
    const allProblems = [];
    const totals = { ties: 0, rockDraws: 0, idolPlays: 0, idolMisplays: 0, doubleElims: 0, sitd: 0, emissary: 0, exileDuel: 0, revotes: 0, blackVotes: 0 };
    let completed = 0, tribalsChecked = 0;
    seededRun(() => {
      for (let s = 0; s < N; s++) {
        runOneSeason({ advantages: { idol: { enabled: true }, beware: { enabled: true } }, shotInDark: true });
        const r = auditSeason(core.gs);
        completed += r.completed;
        r.problems.forEach(p => allProblems.push(`[s${s}] ${p}`));
        for (const k in totals) totals[k] += r.edges[k];
        tribalsChecked += (core.gs.episodeHistory || []).filter(h => h.votes && Object.keys(h.votes).length).length;
      }
    });
    console.log('EDGE CASES over', N, 'seasons /', tribalsChecked, 'tribals:', JSON.stringify(totals));
    console.log('CONTRADICTIONS:', allProblems.length, allProblems.slice(0, 12).join(' || '));

    expect(completed).toBe(N);                       // every season finished
    expect(allProblems).toEqual([]);                 // ZERO logic/continuity contradictions
    // the edge-case detection is meaningful only if edges actually occurred:
    expect(totals.ties + totals.idolPlays + totals.revotes).toBeGreaterThan(0);
  }, 240000);

  it('resolveVotes handles edge inputs sanely', () => {
    expect(resolveVotes({ A: 3, B: 1 }).isTie).toBe(false);           // clear plurality
    expect(resolveVotes({ A: 2, B: 2 }).isTie).toBe(true);            // 2-way tie
    expect(resolveVotes({ A: 3, B: 3, C: 3 }).isTie).toBe(true);      // 3-way tie
    expect(() => resolveVotes({})).not.toThrow();                     // all votes cancelled / empty
    expect(() => resolveVotes({ A: 1 })).not.toThrow();               // single ballot
  });
});
