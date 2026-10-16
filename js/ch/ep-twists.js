// ══════════════════════════════════════════════════════════════════════
// ch/ep-twists.js — the twists that happen on ONE episode
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16: "season long twist are not in the episode format
// designer but in the season setup ... episode twist are one time twist on 1
// episode". The season's rules (the Tribunal, skulls or rings, Redemption
// House) stay on the setup panel; these are booked on the Season Timeline,
// one episode each (core.js TWIST_CATALOG, ch-run.js challengeOptions ->
// options.episodeTwists = { [ep]: 'double' | 'purge' | 'return' }).
//
//   double  two Arenas that night (schedule.js plans it; season.js runs it)
//   purge   War of the Worlds / Vendettas: the slowest in the daily goes home
//           on the spot. No vote and no Arena that week: the purge was it.
//   return  the two most recent Arena losers from one division come back for
//           one night and fight in front of the house. The winner is back in
//           the game, the loser goes home again. Not in a Redemption House
//           season (it has its own way back).
import { gs } from '../core.js';
import { getBond, addBond } from '../bonds.js';
import { addScene, inDivision } from './state.js';
import { nudge } from './mind.js';
import { remember } from './rel.js';
import { playDuel } from './arena.js';
import { removePlayer } from './exits.js';
import { giveRespect } from './respect.js';

export const EP_TWISTS = ['double', 'purge', 'return'];
const pop = (name, d) => { gs.popularity ||= {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; };
const closest = (state, n, among) => [...among].filter(x => x !== n).sort((x, y) => getBond(n, y) - getBond(n, x))[0] || null;

/**
 * The purge: whoever scored lowest in today's daily, in the division playing this week and not among its
 * winners, is out before anybody can vote. Returns their name, or null when nobody can be spared.
 */
export function purge(state, daily, division) {
  const pool = inDivision(state, division).filter(n => !(daily.winners || []).includes(n));
  if (pool.length < 2) return null;
  const score = n => daily.scores?.[n] ?? 0;
  const loser = [...pool].sort((x, y) => score(x) - score(y) || x.localeCompare(y))[0];
  // the closest friend left behind is the one who walks them to the truck
  const friend = closest(state, loser, state.active.filter(n => getBond(loser, n) >= 1.5));
  addScene(state, 'purge', [loser, ...(friend ? [friend] : [])], { daily: daily.name || null, friend }, state.active, 'public');
  removePlayer(state, loser, 'purge');
  pop(loser, -0.5);
  // the house heard it with no warning: everybody sleeps worse, a friend most of all
  for (const n of state.active) nudge(state, n, 'paranoia', 0.4);
  if (friend) { nudge(state, friend, 'morale', -1); addBond(friend, loser, 0.3); }
  return loser;
}

/**
 * The return: at the start of the episode, the house is taken to the Arena, where the two most recent
 * Arena losers of one division are waiting. They fight; the winner walks back into the villa. Placements
 * are re-dealt in exit order, the loser's second exit counting as the latest one.
 */
export function returnArena(state, rng) {
  if (state.redemption) return null;
  const losers = state.gone.filter(g => g.how === 'arena').reverse();
  for (const first of losers) {
    const div = state.division[first.name];
    const second = losers.find(g => g !== first && state.division[g.name] === div);
    if (!second) continue;
    const duel = playDuel(state, rng, first.name, second.name);
    const { winner, loser } = duel;
    state.rec[winner].arenaW++; state.rec[loser].arenaL++;
    const wIn = state.gone.find(g => g.name === winner), lIn = state.gone.find(g => g.name === loser);
    state.gone = state.gone.filter(g => g !== wIn && g !== lIn);
    state.gone.push(lIn);
    state.gone.forEach((g, i) => { g.place = state.cast.length - i; });
    // where they were while they were out (ch-run.js challengeRows: the rows they missed do not list them)
    (state.returnedFrom ||= []).push({ ...wIn, back: state.ep });
    state.active.push(winner);
    nudge(state, winner, 'confidence', 1.5); nudge(state, winner, 'morale', 2);
    giveRespect(state, winner, 'arenaWin');
    pop(winner, 1.5); pop(loser, -0.3);
    // the one who beat them the first time is still in the house, and knows it
    const by = wIn.by && state.active.includes(wIn.by) ? wIn.by : null;
    if (by) { remember(winner, by, 'sent-me-away', 0.8); nudge(state, by, 'paranoia', 1); addBond(winner, by, -0.4); }
    addScene(state, 'return-arena', [winner, loser, ...(by ? [by] : [])],
      { game: duel.game, gameName: duel.gameName, winner, loser, by, upset: !!duel.upset }, state.active, 'arena');
    const friend = by ? null : closest(state, winner, state.active.filter(n => n !== winner && getBond(winner, n) >= 1));
    const other = by || friend;
    if (other) addScene(state, 'return-walkin', [winner, other], { by, friend }, state.active, 'villa');
    return { winner, loser, by, game: duel.gameName || duel.game || null };
  }
  return null;
}
