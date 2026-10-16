// ══════════════════════════════════════════════════════════════════════
// ch/respect.js — respect, the Arena record, and how strong people LOOK
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.4. Respect is the show's currency: an elimination won is worth the
// most, a quit costs the most (and TJ says so), and a player who never goes in
// collects the "free ride" accusation as the season gets older.
//
// What a player KNOWS about someone's strength is their record and what they
// have watched, not their stat sheet: `arenaRead` is the house's estimate (the
// stats are visible in a body and a style, so they count, but the record
// counts more once there is one).
import { S, clamp } from './state.js';

export const RESPECT = {
  arenaWin: 2.2, dailyWin: 0.7, survivedVote: 0.3, volunteerWin: 1.2,
  quit: -4, volunteerLoss: -0.8, caughtThrowing: -1.6, arenaLoss: -0.4,
  fearBeaten: 0.6, froze: -0.5, steppedDown: -0.5,
};

export function giveRespect(state, name, kind) {
  const r = state.rec[name];
  if (!r) return;
  r.respect += RESPECT[kind] || 0;
  // TJ's opinion follows the fights and the quits (spec §4.7).
  if (kind === 'arenaWin' || kind === 'volunteerWin') state.tj[name] = (state.tj[name] || 0) + 1;
  if (kind === 'quit') state.tj[name] = (state.tj[name] || 0) - 3;
}

// How good someone is in an AVERAGE Arena game, from their stats alone (0-10).
export function arenaBase(name) {
  return S(name, 'physical') * 0.34 + S(name, 'endurance') * 0.22 + S(name, 'mental') * 0.2
    + S(name, 'boldness') * 0.12 + S(name, 'temperament') * 0.12;
}

// How strong the house THINKS someone is in the Arena (0-10ish): the body and
// the style, then the record, which takes over once it exists.
export function arenaRead(state, name) {
  const r = state.rec[name] || {};
  const games = (r.arenaW || 0) + (r.arenaL || 0);
  const record = games ? ((r.arenaW || 0) + 1) / (games + 2) * 10 : null;
  const base = arenaBase(name);
  const looked = record == null ? base : base * 0.45 + record * 0.55 + Math.min(2, (r.arenaW || 0) * 0.5);
  // A champion's reputation from the ledger walks in with them.
  return looked + (state.rep[name]?.challengeWins || 0) * 0.6;
}

// How dangerous someone looks overall: the Arena, the dailies, and the final.
export function threatRead(state, name) {
  const r = state.rec[name] || {};
  const daily = (S(name, 'physical') + S(name, 'endurance') + S(name, 'mental')) / 3;
  return arenaRead(state, name) * 0.55 + daily * 0.3 + (r.dailyWins || 0) * 0.5 + Math.max(0, r.respect || 0) * 0.15;
}

// The free-ride accusation: never been in, and the season is getting older.
// Grows with the share of the season played, so it is a late-season pressure.
export function freeRide(state, name) {
  const r = state.rec[name] || {};
  if ((r.arenaW || 0) + (r.arenaL || 0) > 0 || r.volunteered) return 0;
  const played = state.ep / Math.max(1, state.plannedEpisodes || 14);
  return clamp(played * 1.6 - 0.4, 0, 1.2);
}
