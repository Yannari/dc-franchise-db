// ══════════════════════════════════════════════════════════════════════
// td/story/record.js — what has happened in the game, as a camper knows it
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-07 §2.3. A story line names what actually happened: who went
// home, who wrote whose name, who sank the challenge, how long a team has been
// losing. Everything here is read from FINISHED episodes (gs.episodeHistory
// before the one being played) plus the current episode's challenge, and only
// what the named camper could know:
//   - their own vote (a ballot is secret; only its writer knows it),
//   - the count and who went home (public once the votes are read),
//   - who their alliance said it was voting for (they were in the plan),
//   - challenge results (everybody watched).
// Words only: nothing here touches the game.
import { gs } from '../../core.js';

const hist = () => gs.episodeHistory || [];
const before = epNum => hist().filter(h => (h.num || 0) < epNum);

/** The last vote `name` sat at, before episode `epNum`, as `name` knows it. */
export function lastTribalOf(name, epNum) {
  const h = before(epNum).reverse().find(x => (x.tribalPlayers || []).includes(name) && x.eliminated);
  if (!h) return null;
  const log = (h.votingLog || []).filter(v => v.voter && v.voted);
  const mine = log.find(v => v.voter === name);
  const counts = {};
  log.forEach(v => { counts[v.voted] = (counts[v.voted] || 0) + 1; });
  const boot = h.eliminated;
  const against = counts[name] || 0;
  // what the boot thought was happening: they voted somebody else and did not see it coming
  const bootVote = log.find(v => v.voter === boot)?.voted || null;
  // the plan this camper was part of, if any (the alliance said a name out loud)
  const plan = (h.alliances || []).find(al => (al.members || []).includes(name) && al.target);
  return {
    ep: h.num, boot, myVote: mine?.voted || null, votedBoot: mine?.voted === boot,
    against, bootVotes: counts[boot] || 0, total: log.length,
    unanimous: log.length > 1 && log.every(v => v.voted === boot || v.voter === boot),
    blindside: !!bootVote && bootVote !== boot && (counts[boot] || 0) > 0 && !(h.alliances || []).some(al => al.target === boot && (al.members || []).includes(boot)),
    planTarget: plan?.target || null, planName: plan?.label || null,
    planHeld: plan ? plan.target === boot : null,
    gap: epNum - h.num,
  };
}

/** Every vote `name` has cast this season before `epNum`: [{ ep, voted, boot }]. */
export function votesOf(name, epNum) {
  return before(epNum).flatMap(h => (h.votingLog || []).filter(v => v.voter === name && v.voted).map(v => ({ ep: h.num, voted: v.voted, boot: h.eliminated })));
}

/** Who has gone home from `camp` (pre-merge) or from the game so far, oldest first. */
export function bootsBefore(epNum, camp = null) {
  return before(epNum).filter(h => h.eliminated && (!camp || h.tribalTribe === camp)).map(h => h.eliminated);
}

/** A team's run of losses ending at (and including, when it lost) episode `epNum`'s challenge. */
export function lossStreak(camp, epNum, ep = null) {
  const eps = [...before(epNum), ...(ep && ep.num === epNum ? [ep] : [])].filter(h => !h.isMerge || h.loser);
  let n = 0;
  for (const h of eps.reverse()) {
    if (h.loser?.name === camp) n++;
    else if (h.winner?.name === camp || (h.challengePlacements || []).some(t => t.name === camp)) break;
    else break;
  }
  return n;
}

/**
 * Today's challenge as `name`'s team saw it: who carried it and who sank it.
 * Only after the challenge (phase 'post'). { lost, carried, sank, sat, rankOf }
 */
export function challengeOf(ep, camp) {
  if (!ep) return null;
  const team = (ep.tribesAtStart || []).find(t => t.name === camp)?.members || [];
  const scores = ep.chalMemberScores || {};
  const played = team.filter(n => Number.isFinite(scores[n]) && !(ep.chalSitOuts?.[camp] || []).includes(n));
  if (played.length < 2) return null;
  const order = [...played].sort((a, b) => scores[b] - scores[a] || a.localeCompare(b));
  return {
    lost: ep.loser?.name === camp, won: ep.winner?.name === camp,
    carried: order[0], sank: order[order.length - 1], order,
    sat: [...(ep.chalSitOuts?.[camp] || [])],
    label: ep.challengeLabel || null,
  };
}

/** Days in the game at episode `epNum` (three days an episode, the show's rhythm). */
export const dayOf = epNum => Math.max(1, (epNum - 1) * 3 + 1);
