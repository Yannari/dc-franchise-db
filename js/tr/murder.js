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
 * `conviction` is how hard they will push it in the room, and it comes from
 * their own confidence rather than from whether they are right — a certain
 * fool argues harder than a hesitant strategist, which is the whole reason the
 * room can make a bad decision.
 */
export function formPreference(traitor, ep, rng = Math.random) {
  const targets = livingFaithfuls(ep).filter(n => n !== traitor);
  if (!targets.length) return { target: null, reason: 'nobody left', conviction: 0 };
  const st = pStats(traitor);
  const read = ((st.strategic || 5) * 0.6 + (st.intuition || 5) * 0.4) / 10;

  const scored = targets.map(name => {
    const ts = pStats(name);
    // TOOL ALLOCATION, the format's own logic: murder is for the people the
    // table will never remove. A beloved, obviously-Faithful player can only
    // be taken this way — and a SUSPICIOUS Faithful is worth more alive,
    // because the table will spend itself on them for free.
    const beloved = ((ts.social || 5) / 10);
    const heat = _publicHeatAgainst(name, ep);      // how suspected they already are
    let score = beloved * 1.1 - heat * 1.3;

    // The one who is onto them. Read off PUBLIC behaviour only — a Traitor
    // cannot see beliefs, only who has been saying their name out loud.
    score += _accusedMe(traitor, name, ep) * 1.4;

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

    return { name, score };
  }).sort((a, b) => b.score - a.score);

  const pick = scored[0];
  return {
    target: pick.name,
    reason: _reasonFor(traitor, pick.name, ep),
    conviction: Math.max(0.1, Math.min(1, (pick.score - (scored[1]?.score ?? 0)) + read * 0.5)),
  };
}

/** How much heat this player is already carrying in public. */
function _publicHeatAgainst(name, ep) {
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

/** Has `name` publicly named `traitor` at a Round Table? Public information only. */
function _accusedMe(traitor, name, ep) {
  const rounds = gs.tr?.rounds || [];
  let hits = 0;
  for (const r of rounds) {
    if ((r.accusations || []).some(a => a.accuser === name && a.target === traitor)) hits++;
    if ((r.ballots || []).some(b => b.voter === name && b.voted === traitor)) hits++;
  }
  return Math.min(1, hits * 0.5);
}

/** Why this name, in words the VP and the evidence layer can both read. */
function _reasonFor(traitor, name, ep) {
  if (_accusedMe(traitor, name, ep) > 0) return 'onto-me';
  if (_publicHeatAgainst(name, ep) > 0.25) return 'wasted-decoy';  // a bad reason, deliberately reachable
  const ts = pStats(name);
  if ((ts.social || 5) >= 7) return 'beloved';
  return 'convenient';
}

/**
 * The argument, and its result.
 *
 * Resolved on social weight and conviction — NOT on whose read is better. The
 * best read in the room loses regularly, and that is the mechanism by which
 * the Traitors murder the wrong person and then have to live with each other.
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
