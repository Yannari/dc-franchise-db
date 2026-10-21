// Kristal-talKs exit interviews — Total Drama.
//
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
// Shared: js/exit-interview/house.js (facts, recording), core.js (decisions).
//
// Total Drama removes people from dozens of places — a vote, a double tribal,
// a sudden-death challenge, a Rescue Island duel, a medevac, a walkout — so
// this does not hook any of them. It compares who is OUT FOR GOOD before and
// after each episode: off the island, not on Rescue/Redemption Island, not
// holding the exile duel seat. Somebody voted to Rescue Island records nothing
// until they lose there (the door still open); a returnee who goes out again
// records a second interview.
//
// Jurors record the week they leave and hear nothing until the final vote is
// in. Nothing reaches a screen — the user: "it's outside the game".

import { gs } from '../core.js';
import { deliverInterviews } from '../exit-interview/core.js';
import { HOUSE_OPS as OPS, exitStore as store, houseFacts, recordHouseExit, publishedExits } from '../exit-interview/house.js';

const active = () => gs.activePlayers || [];
const stillCanReturn = name => (gs.riPlayers || []).includes(name) || gs.exileDuelPlayer === name;
const isJuror = name => (gs.jury || []).includes(name);

/** Who is waiting on a return path right now (Rescue/Redemption Island, the exile duel). */
export function tdWaiting() {
  return new Set([...(gs.riPlayers || []), gs.exileDuelPlayer].filter(Boolean));
}

/** Who is off the island for good right now. */
export function tdOutForGood() {
  return new Set((gs.eliminated || []).filter(n => n && !active().includes(n) && !stillCanReturn(n)));
}

const canHearNow = name => tdOutForGood().has(name) && !isJuror(name);

/** The vote they lost, from their own tribal only — a double tribal is two rooms. */
function ballotsFor(name, ep) {
  const log = (ep?.votingLog || []).filter(l => l && l.voter && l.voter !== 'THE GAME');
  const room = Array.isArray(ep?.tribalPlayers) && ep.tribalPlayers.includes(name) ? new Set(ep.tribalPlayers) : null;
  return log.filter(l => !room || room.has(l.voter)).map(l => ({ voter: l.voter, target: l.voted }));
}

function howOf(name, ep, ballots, waiting) {
  if (ep?.medevac?.name === name) return 'medical';
  // Voted out weeks ago, and the island door just closed on them.
  if (waiting?.has(name)) return 'lost-duel';
  if (ep?.departure?.name === name) return ep.departure.kind === 'expulsion' ? 'expelled' : 'walked';
  if (ballots.some(b => b.target === name)) return 'evicted';
  // Nobody wrote their name down: a challenge, a duel, a sudden death took them.
  return 'lost-challenge';
}

function record(name, ep, rng, { how, placement = null, withName = null }) {
  const ballots = how === 'evicted' ? ballotsFor(name, ep) : [];
  return recordHouseExit(houseFacts({
    show: 'total-drama', round: ep?.num || gs.episode || 0, name, how, placement, withName,
    ballots, isJuror, canHear: canHearNow, wins: n => gs.chalRecord?.[n]?.wins || 0,
  }), rng);
}

/**
 * After an episode: everybody newly out for good records, then everyone out
 * and not sequestered hears what has aired. `before` is tdOutForGood() taken
 * when the episode started.
 */
export function recordTDExits(before, ep, { rng = Math.random, waiting = null } = {}) {
  if (!before || !ep) return [];
  const out = [];
  try {
    const now = tdOutForGood();
    const leaving = [...now].filter(n => !before.has(n));
    if (!leaving.length) return out;
    deliverInterviews(store(), { at: ep.num || gs.episode || 0, canHear: canHearNow, ops: OPS });
    const ahead = active().length + (gs.riPlayers || []).length;
    leaving.forEach((name, i) => {
      const ballots = ballotsFor(name, ep);
      out.push(record(name, ep, rng, {
        how: howOf(name, ep, ballots, waiting), placement: ahead + leaving.length - i,
        withName: leaving.length > 1 ? leaving.find(x => x !== name) : null,
      }));
    });
    deliverInterviews(store(), { at: ep.num || gs.episode || 0, canHear: canHearNow, ops: OPS });
  } catch (e) {
    if (typeof process !== 'undefined' && process.env?.EXIT_DEBUG) throw e;
  }
  return out;
}

/**
 * The finale, after the result: anyone the finale itself removed (a final
 * challenge, a fire) records as a boot, each finalist records their own, and
 * then everybody — the jury included, the vote being in — hears the lot.
 */
export function recordTDFinaleExits(before, ep, { rng = Math.random } = {}) {
  const out = [];
  try {
    const res = gs.finaleResult || {};
    const finalists = [...(res.finalists || ep?.finalists || [])].filter(Boolean);
    const winner = res.winner || ep?.winner || null;
    const round = ep?.num || (gs.episode || 0);
    const night = { num: round, votingLog: [] };
    deliverInterviews(store(), { at: round, canHear: n => !finalists.includes(n) && tdOutForGood().has(n), ops: OPS });
    for (const name of [...(before ? [...tdOutForGood()].filter(n => !before.has(n)) : [])]
      .filter(n => !finalists.includes(n))) {
      out.push(record(name, night, rng, { how: 'lost-challenge', placement: finalists.length + 1 }));
    }
    const ranked = [winner, ...finalists.filter(n => n !== winner)].filter(Boolean);
    ranked.slice().reverse().forEach(name => {
      out.push(record(name, night, rng, { how: 'finalist', placement: ranked.indexOf(name) + 1 }));
    });
    deliverInterviews(store(), { at: round, canHear: () => true, ops: OPS });
  } catch (e) {
    if (typeof process !== 'undefined' && process.env?.EXIT_DEBUG) throw e;
  }
  return out;
}

export function publishedTDExitInterviews(list = gs.exitInterviews) {
  return publishedExits('total-drama', list);
}
