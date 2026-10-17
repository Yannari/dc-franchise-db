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
import { S, addScene, inDivision } from './state.js';
import { nudge } from './mind.js';
import { remember } from './rel.js';
import { playDuel } from './arena.js';
import { removePlayer } from './exits.js';
import { giveRespect } from './respect.js';
import { pairsOn, repOf, membersOf, unitsLeft, dissolvePair, playPairDuel, restorePair, shapeOf } from './pairs.js';

export const EP_TWISTS = ['double', 'purge', 'return', 'late', 'swap'];

/**
 * Late arrivals: the players held back from the start walk in (season.js state.late). The house sizes them up:
 * first impressions both ways, the strongest of the house feeling the threat, and a vet sizing up a newcomer.
 */
export function lateArrival(state, rng) {
  const fresh = state.late.filter(n => !state.active.includes(n));
  if (!fresh.length) return null;
  const house = [...state.active];
  state.active.push(...fresh);
  for (const n of fresh) for (const h of house) addBond(n, h, (rng() - 0.5) * 0.8);
  const watcher = [...house].sort((x, y) => getBond(y, fresh[0]) - getBond(x, fresh[0]))[0];
  for (const n of fresh) nudge(state, n, 'confidence', 0.4);
  for (const h of house) nudge(state, h, 'paranoia', 0.2);
  addScene(state, 'late-arrival', [...fresh, ...house.slice(0, 3)], { arrivals: fresh }, state.active, 'villa');
  const sizer = house.filter(h => !state.rookie[h]).sort((x, y) => S(y, 'boldness') - S(x, 'boldness'))[0] || watcher;
  if (sizer) addScene(state, 'late-sizeup', [sizer, fresh[0]], { other: fresh[1] || null }, state.active, 'villa');
  return fresh;
}
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
  if (pairsOn(state)) return purgePair(state, daily, pool, score);
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

// A Pairs season purges the slowest PAIR (its average), and they go together, on one placement.
function purgePair(state, daily, pool, score) {
  const reps = [...new Set(pool.map(n => repOf(state, n)))].filter(r => membersOf(state, r).every(n => pool.includes(n)));
  if (reps.length < 2) return null;
  const avg = r => membersOf(state, r).reduce((t, n) => t + score(n), 0) / membersOf(state, r).length;
  const loser = [...reps].sort((x, y) => avg(x) - avg(y) || x.localeCompare(y))[0];
  const both = membersOf(state, loser);
  addScene(state, 'purge', both, { daily: daily.name || null, pair: true }, state.active, 'public');
  const place = unitsLeft(state);
  dissolvePair(state, loser);
  for (const n of both) { removePlayer(state, n, 'purge', { place, partner: both.find(x => x !== n), pairDone: true }); pop(n, -0.5); }
  for (const n of state.active) nudge(state, n, 'paranoia', 0.4);
  return loser;
}

/**
 * The return: at the start of the episode, the house is taken to the Arena, where the two most recent
 * Arena losers of one division are waiting. They fight; the winner walks back into the villa. Placements
 * are re-dealt in exit order, the loser's second exit counting as the latest one.
 */
export function returnArena(state, rng) {
  if (state.redemption) return null;
  if (pairsOn(state)) return returnArenaPairs(state, rng);
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

// A Pairs season's return: the two most recent pairs sent home from the Arena (the same division, when the pairs
// are men's and women's) fight two on two; the winners walk back in as the pair they were. Placements are re-dealt
// by pair, the losers' second exit counting as the latest one.
function returnArenaPairs(state, rng) {
  const gonePairs = [];
  for (const g of [...state.gone].reverse()) {
    if (g.how !== 'arena' || !g.partner || gonePairs.some(p => p.includes(g.name))) continue;
    if (!state.gone.some(x => x.name === g.partner && x.how === 'arena')) continue;
    gonePairs.push([g.partner, g.name].sort());
  }
  const divOf = p => (shapeOf(state) === 'same' ? state.division[p[0]] : 'all');
  for (const first of gonePairs) {
    const second = gonePairs.find(p => p !== first && divOf(p) === divOf(first));
    if (!second) continue;
    const recs = [...first, ...second].map(n => state.gone.find(g => g.name === n));
    state.gone = state.gone.filter(g => !recs.includes(g));
    state.active.push(...first, ...second);
    restorePair(state, first[0], first[1]);
    restorePair(state, second[0], second[1]);
    const duel = playPairDuel(state, rng, first[0], second[0]);
    for (const w of duel.winners) state.rec[w].arenaW++;
    for (const l of duel.losers) state.rec[l].arenaL++;
    // the losers go home again, together
    dissolvePair(state, duel.loser);
    state.active = state.active.filter(n => !duel.losers.includes(n));
    for (const l of duel.losers) state.gone.push({ ...recs.find(r => r.name === l), ep: state.ep, day: state.day, how: 'arena' });
    // placements by pair, in exit order
    let k = 0;
    const totalPairs = Math.floor(state.cast.length / 2);
    state.gone.forEach((g, i) => { const prev = state.gone[i - 1]; if (i && !(prev && (prev.partner === g.name || g.partner === prev.name))) k++; g.place = totalPairs - k; });
    (state.returnedFrom ||= []).push(...duel.winners.map(w => ({ ...recs.find(r => r.name === w), back: state.ep })));
    for (const w of duel.winners) { nudge(state, w, 'confidence', 1.5); nudge(state, w, 'morale', 2); giveRespect(state, w, 'arenaWin'); pop(w, 1.5); }
    for (const l of duel.losers) pop(l, -0.3);
    const by = recs.find(r => r.name === duel.winners[0])?.by;
    const byIn = by && state.active.includes(by) ? by : null;
    if (byIn) for (const w of duel.winners) { remember(w, byIn, 'sent-me-away', 0.8); addBond(w, byIn, -0.4); }
    if (byIn) nudge(state, byIn, 'paranoia', 1);
    addScene(state, 'return-arena', [...duel.winners, ...duel.losers], { game: duel.game, gameName: duel.gameName, winner: duel.winner, loser: duel.loser,
      winners: duel.winners, losers: duel.losers, by: byIn, upset: !!duel.upset, pair: true }, state.active, 'arena');
    return { winner: duel.winner, loser: duel.loser, winners: duel.winners, losers: duel.losers, by: byIn, game: duel.gameName || duel.game || null };
  }
  return null;
}
