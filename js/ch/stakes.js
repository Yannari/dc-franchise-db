// ══════════════════════════════════════════════════════════════════════
// ch/stakes.js — what a season is played for, and what it costs
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16, picking from the improvement list: the bank and injuries
// and TJ's power rankings always on, the Red Skull (or ring) as a season twist,
// "make sure you add events related to all these: reactions, consequences".
//
//   THE BANK      every daily pays its winners; the Arena's winner takes half of
//                 what the loser had banked. Money is a threat (respect.js
//                 threatRead) and a reason to vote somebody in (vote.js).
//   INJURIES      a hurt player stays hurt for a few episodes: slower in the
//                 daily (mind.js performanceMod), weaker in the Arena's eyes
//                 (respect.js arenaRead), a medical only when it is bad.
//   RANKINGS      TJ ranks the house every week: number one feels the target,
//                 the last one wants to prove him wrong, a fall stings.
//   SKULLS        (the twist; Total Madness's Red Skull, Double Agents' Gold
//                 Skull): you earn one only by winning in the Arena, and you
//                 cannot run the final without one. 'ring' is the same rule.
//
// Every one of these changes something and leaves a scene (CLAUDE.md: no
// cosmetic events); the house's reactions are events in events.js.
import { gs } from '../core.js';
import { getBond, addBond } from '../bonds.js';
import { S, addScene, bankOf, injuryOf, skullsOf, clamp } from './state.js';
import { nudge } from './mind.js';
import { remember } from './rel.js';
import { threatRead } from './respect.js';
import { removePlayer } from './exits.js';

const pop = (name, d) => { gs.popularity ||= {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; };
const money = n => `$${Math.round(n).toLocaleString('en-US')}`;
export { money };

// ── the bank ─────────────────────────────────────────────────────────
export const PURSE = { solo: 10000, pairs: 7500, team: 20000, arena: 5000, champion: 250000 };

/** The daily's purse, paid to its winners. Returns { each, who } or null. */
export function payDaily(state, daily) {
  const who = (daily.winners || []).filter(w => state.active.includes(w));
  if (!who.length) return null;
  const each = daily.mode === 'solo' ? PURSE.solo : daily.mode === 'pairs' ? PURSE.pairs : Math.max(2500, Math.round(PURSE.team / who.length / 500) * 500);
  for (const w of who) state.bank[w] = bankOf(state, w) + each;
  daily.purse = { each, who };
  return daily.purse;
}

/** The Arena: the winner takes half of the loser's bank, and a bonus for the win. The amount taken. */
export function arenaPurse(state, winner, loser) {
  const took = Math.round(bankOf(state, loser) / 2 / 500) * 500;
  state.bank[loser] = bankOf(state, loser) - took;
  state.bank[winner] = bankOf(state, winner) + took + PURSE.arena;
  if (took >= 5000) {
    // they did not just send them home, they took their money
    remember(loser, winner, 'took-my-money', 0.8);
    nudge(state, winner, 'confidence', 0.3);
    addScene(state, 'bank-taken', [winner, loser], { took, amount: money(took) }, state.active, 'arena');
  }
  return took;
}

/** The richest still in, and the gap to the next. */
export function richest(state) {
  const rows = [...state.active].sort((a, b) => bankOf(state, b) - bankOf(state, a));
  return rows[0] && bankOf(state, rows[0]) > 0 ? rows[0] : null;
}

// ── injuries ─────────────────────────────────────────────────────────
const PARTS = ['ankle', 'knee', 'shoulder', 'wrist', 'ribs', 'back', 'hamstring'];

/**
 * A player hurt in a daily or the Arena: how bad (1 a knock, 2 a sprain, 3 a tear), what, and for how long.
 * The friend closest to them helps them off. Leaves the scene; the medical (if any) is the caller's.
 */
export function hurt(state, rng, n, where = 'daily') {
  const r = rng();
  const sev = r < 0.62 ? 1 : r < 0.9 ? 2 : 3;
  const part = PARTS[Math.floor(rng() * PARTS.length)];
  const inj = { part, sev, ep: state.ep, heal: state.ep + sev + 1, where };
  state.injury[n] = inj;
  nudge(state, n, 'energy', -1 - sev * 0.5);
  nudge(state, n, 'morale', -0.6 * sev);
  nudge(state, n, 'confidence', -0.4 * sev);
  const helper = state.active.filter(x => x !== n && getBond(x, n) >= 2).sort((x, y) => getBond(y, n) - getBond(x, n))[0] || null;
  if (helper) { addBond(n, helper, 0.6); remember(n, helper, 'emotional-support', 1); }
  addScene(state, 'injury', helper ? [n, helper] : [n], { part, sev, where }, state.active, where === 'arena' ? 'arena' : 'public');
  return inj;
}

/** The chance a hurt player is pulled out by the medics on the day: never for a knock. */
export const medicalRisk = inj => (!inj ? 0 : inj.sev >= 3 ? 0.45 : inj.sev === 2 ? 0.1 : 0);

/** The episode starts: an injury that has healed is over, and the player says so. */
export function healDay(state) {
  for (const [n, inj] of Object.entries(state.injury || {})) {
    if (!inj || inj.heal !== state.ep || !state.active.includes(n)) continue;
    nudge(state, n, 'confidence', 0.6);
    addScene(state, 'injury-healed', [n], { part: inj.part, sev: inj.sev }, [n], 'confessional');
  }
}

// ── TJ's power rankings ──────────────────────────────────────────────
const rankScore = (state, n) => threatRead(state, n) + bankOf(state, n) / 40000 + (state.rec[n]?.arenaW || 0) * 0.4
  - (injuryOf(state, n)?.sev || 0) * 0.5 + (skullsOf(state, n) ? 0.3 : 0);

/**
 * The episode's first morning (from the second episode): TJ ranks the whole house. Number one is told he is
 * the target; the last one is told he is the weakest; a big fall stings and a big climb lifts. Returns the rows.
 */
export function powerRankings(state) {
  if (state.ep < 2 || state.active.length < 4) return null;
  const order = [...state.active].sort((a, b) => rankScore(state, b) - rankScore(state, a));
  const prev = state.lastRanks || {};
  const rows = order.map((n, i) => ({ n, rank: i + 1, was: prev[n] ?? null }));
  state.lastRanks = Object.fromEntries(rows.map(r => [r.n, r.rank]));
  const top = order[0], last = order[order.length - 1];
  const moved = (r, sign) => (r.was ? (r.rank - r.was) * sign : 0);
  const drop = rows.filter(r => r.n !== last && moved(r, 1) >= 2).sort((x, y) => moved(y, 1) - moved(x, 1))[0]?.n || null;
  const rise = rows.filter(r => r.n !== top && moved(r, -1) >= 3).sort((x, y) => moved(y, -1) - moved(x, -1))[0]?.n || null;
  // number one: the house heard it too
  nudge(state, top, 'paranoia', 1); nudge(state, top, 'confidence', 0.5); pop(top, 0.4);
  state.rankTop = { name: top, ep: state.ep };
  // the bottom: told out loud he is the weakest
  nudge(state, last, 'confidence', -0.8); nudge(state, last, 'morale', -0.5);
  let passer = null;
  if (drop) {
    nudge(state, drop, 'confidence', -0.6); nudge(state, drop, 'morale', -0.4);
    // the one who now sits just above them, and sat below them last week
    const dr = rows.find(r => r.n === drop);
    passer = rows.find(r => r.rank < dr.rank && r.was && r.was > dr.was)?.n || null;
    if (passer) { remember(drop, passer, 'ranked-over-me', 0.6); addBond(drop, passer, -0.3); }
  }
  if (rise) { nudge(state, rise, 'confidence', 0.7); pop(rise, 0.3); }
  // a rookie in TJ's top three: the vets under them bristle
  const rookieTop = order.slice(0, 3).find(n => state.rookie[n]) || null;
  if (rookieTop) {
    const rr = order.indexOf(rookieTop);
    for (const v of order.slice(rr + 1, rr + 6)) if (!state.rookie[v]) { remember(v, rookieTop, 'rookie-over-me', 0.4); addBond(v, rookieTop, -0.2); }
  }
  const who = [...new Set([top, last, drop, rise].filter(Boolean))];
  addScene(state, 'power-rankings', who, { top, last, drop, rise, passer, rookieTop, order: order.slice(0, 5), rows: rows.map(r => ({ ...r })) }, state.active, 'public');
  return rows;
}

// ── the Red Skull (or the ring) ──────────────────────────────────────
/** 'skull' or 'ring' when the season runs the rule, else null. */
export const passOf = state => (['skull', 'ring'].includes(state.options?.finalPass) ? state.options.finalPass : null);

/** An Arena win earns one. The ones in the same division still without one feel it. */
export function earnPass(state, w) {
  const token = passOf(state);
  if (!token) return;
  const first = !skullsOf(state, w);
  state.skulls[w] = skullsOf(state, w) + 1;
  nudge(state, w, 'confidence', first ? 1 : 0.3);
  if (first) {
    pop(w, 0.6);
    for (const n of state.active) if (n !== w && !skullsOf(state, n) && state.division[n] === state.division[w]) nudge(state, n, 'paranoia', 0.3);
  }
  addScene(state, 'pass-earned', [w], { first, count: state.skulls[w], token }, state.active, 'arena');
}

/** How badly somebody without one needs one: grows as the season gets older (and after a panic scene). */
export function passHunger(state, n) {
  if (!passOf(state) || skullsOf(state, n)) return 0;
  const played = state.ep / Math.max(1, state.plannedEpisodes || 14);
  return clamp(played * 2 - 0.6, 0, 1.5) + (state.passPanic?.[n] || 0) * 0.4;
}

/**
 * The morning of the final: nobody runs it without one. Each division keeps at least two finalists (the
 * strongest of the ones without, when there are not enough with one), and TJ tells the rest to go home.
 */
export function passCut(state) {
  const token = passOf(state);
  if (!token) return [];
  const divs = state.options.gendered ? ['m', 'f'] : ['all'];
  const cut = [];
  for (const d of divs) {
    const inDiv = state.active.filter(n => d === 'all' || state.division[n] === d);
    const have = inDiv.filter(n => skullsOf(state, n));
    const without = inDiv.filter(n => !skullsOf(state, n)).sort((a, b) => threatRead(state, b) - threatRead(state, a));
    const keep = Math.max(0, 2 - have.length);
    for (const n of without.slice(0, keep)) addScene(state, 'pass-cut', [n], { spared: true, token }, state.active, 'final');
    for (const n of without.slice(keep)) cut.push(n);
  }
  for (const n of cut) {
    addScene(state, 'pass-cut', [n], { spared: false, token }, state.active, 'final');
    nudge(state, n, 'morale', -3);
    removePlayer(state, n, 'no-pass', { token });
  }
  return cut;
}
