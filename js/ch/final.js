// ══════════════════════════════════════════════════════════════════════
// ch/final.js — the two-day final
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3 "The final". Sources (Wikipedia, read 2026-10-14): Battle for a New
// Champion (a checkpoint trail race, an overnight stage on a beach, a swim to
// an island and three checkpoints on day two, "the first across the finish
// line wins") and Total Madness (an instant elimination after the first
// checkpoint; the overnight in the cold; the first male and first female
// across the line win).
//
//   Day 1  checkpoint 1 (a run and a carry). The two slowest of each division
//          face an INSTANT ELIMINATION, a duel on the spot.
//          The overnight stage: no sleep, cold, an endurance and temperament
//          test where people can quit.
//   Day 2  checkpoint 2 (a puzzle at altitude), checkpoint 3 (the summit run).
//          The total decides: two champions, or one in a gender-blind season.
//
// Alliances end at the final (the real show's "it's every man for himself"):
// the scene is recorded; nothing votes here.
import { S, addScene, noise } from './state.js';
import { performanceMod, nudge } from './mind.js';
import { blendScore, playDuel, ARENA_GAMES } from './arena.js';
import { activeAlliances, endAlliance } from './alliances.js';
import { removePlayer } from './exits.js';
import { giveRespect } from './respect.js';
import { grudgeOf, trustOf, remember, keptWord } from './rel.js';
import { addBond } from '../bonds.js';

const CHECKPOINTS = [
  { id: 'cp1', name: 'The Beach Haul', blend: { physical: 0.4, endurance: 0.4, boldness: 0.2 } },
  { id: 'cp2', name: 'The Ridge Puzzle', blend: { mental: 0.45, endurance: 0.3, intuition: 0.25 } },
  { id: 'cp3', name: 'The Summit Run', blend: { endurance: 0.5, physical: 0.3, temperament: 0.2 } },
];

function runCheckpoint(state, rng, cp, who) {
  const out = {};
  for (const n of who) out[n] = blendScore(n, cp.blend) * performanceMod(state, n, 0.8) + noise(rng) * 0.8;
  for (const n of who) nudge(state, n, 'energy', -2.2);
  return out;
}

export function playFinal(state, rng) {
  state.day += 1;
  const fin = { finalists: [...state.active], checkpoints: [], instant: [], overnight: [], champions: [], totals: {} };
  for (const al of activeAlliances(state)) endAlliance(state, al, 'final');
  addScene(state, 'final-start', state.active, {}, state.active, 'final');
  const total = Object.fromEntries(state.active.map(n => [n, 0]));
  // Checkpoint 1.
  const s1 = runCheckpoint(state, rng, CHECKPOINTS[0], state.active);
  for (const n of state.active) total[n] += s1[n];
  fin.checkpoints.push({ id: 'cp1', scores: round(s1) });
  // The instant elimination: the two slowest of each division (three or more left in it).
  const divs = state.options.gendered ? ['m', 'f'] : ['all'];
  for (const d of divs) {
    const inDiv = state.active.filter(n => d === 'all' || state.division[n] === d);
    if (inDiv.length < 3) continue;
    const [x, y] = [...inDiv].sort((a, b) => s1[a] - s1[b]);
    const game = ARENA_GAMES.find(g => g.id === 'hallway-hustle');
    const duel = playDuel(state, rng, x, y, game);
    fin.instant.push(duel);
    addScene(state, 'instant-elimination', [x, y], { winner: duel.winner, game: duel.game }, state.active, 'final');
    removePlayer(state, duel.loser, 'final-instant');
    delete total[duel.loser];
  }
  // The overnight's box (Battle for a New Champion, Wikipedia: "players empty
  // a tile-filled box for items (a blanket, pillow, or chair) and extra tiles
  // for rivals"). The fastest at checkpoint 1 empty theirs first: they get the
  // comfort, and the extra tiles go to whoever they most want to break.
  const order = [...state.active].sort((a, b) => s1[b] - s1[a]);
  const comfort = {};
  order.forEach((n, i) => { comfort[n] = i < 3 ? ['chair', 'pillow', 'blanket'][i] : null; });
  fin.sabotage = [];
  for (const n of order.slice(0, Math.ceil(order.length / 2))) {
    const rival = state.active.filter(x => x !== n).sort((x, y) => grudgeOf(n, y) - grudgeOf(n, x)
      + (state.division[y] === state.division[n] ? 0.5 : 0) - (state.division[x] === state.division[n] ? 0.5 : 0))[0];
    if (!rival || (grudgeOf(n, rival) < 0.5 && state.division[rival] !== state.division[n])) continue;
    fin.sabotage.push({ from: n, to: rival });
    remember(rival, n, 'sabotaged-me', 1.5);
    addBond(n, rival, -0.6);
    addScene(state, 'overnight-sabotage', [n, rival], {}, state.active, 'final');
  }
  const tiles = n => fin.sabotage.filter(x => x.to === n).length;
  // The overnight.
  for (const n of [...state.active]) {
    const m = state.mind[n];
    const p = Math.max(0, 0.05 * (1 - (S(n, 'endurance') + S(n, 'temperament')) / 20) * (1 + m.homesick / 10) * (1.3 - m.morale / 12) * (1 + tiles(n) * 0.5));
    if (rng() < p) {
      fin.overnight.push({ name: n, quit: true });
      giveRespect(state, n, 'quit');
      addScene(state, 'overnight-quit', [n], {}, state.active, 'final');
      removePlayer(state, n, 'final-quit');
      delete total[n];
      continue;
    }
    // Holding up through the night is worth time on day two.
    const held = (S(n, 'endurance') * 0.6 + S(n, 'temperament') * 0.4) / 10 + (comfort[n] ? 0.15 : 0) - tiles(n) * 0.12;
    total[n] += held * 1.5;
    nudge(state, n, 'energy', -2.5);
    fin.overnight.push({ name: n, held: +held.toFixed(2), comfort: comfort[n], tiles: tiles(n) });
  }
  addScene(state, 'overnight', state.active, {}, state.active, 'final');
  state.day += 1;
  // A ride-to-the-final pact pays out on the puzzle: a man and a woman who are
  // not competing with each other share the answer. Kept, it is loyalty proved;
  // a partner in the same division owes nothing (they are racing each other).
  fin.help = [];
  for (const d of state.deals.filter(x => x.tier === 'final' && !x.broken)) {
    if (!state.active.includes(d.a) || !state.active.includes(d.b) || state.division[d.a] === state.division[d.b]) continue;
    const keeps = rng() < 0.6 + S(d.a, 'loyalty') * 0.03;
    if (keeps) { fin.help.push({ a: d.a, b: d.b }); keptWord(d.a, d.b, 1); keptWord(d.b, d.a, 1); }
    addScene(state, keeps ? 'final-pact-help' : 'final-pact-broken', [d.a, d.b], {}, [d.a, d.b], 'final');
  }
  const helped = n => fin.help.some(h => h.a === n || h.b === n);
  for (const cp of CHECKPOINTS.slice(1)) {
    const sc = runCheckpoint(state, rng, cp, state.active);
    if (cp.id === 'cp2') for (const n of state.active) if (helped(n)) sc[n] += 0.6;
    for (const n of state.active) total[n] += sc[n];
    fin.checkpoints.push({ id: cp.id, scores: round(sc) });
  }
  fin.totals = round(total);
  for (const d of divs) {
    const inDiv = state.active.filter(n => d === 'all' || state.division[n] === d).sort((a, b) => total[b] - total[a]);
    if (inDiv[0]) fin.champions.push(inDiv[0]);
  }
  state.champions = fin.champions;
  // Placements for the finishers: champions 1, the rest in order of total.
  const rest = state.active.filter(n => !fin.champions.includes(n)).sort((a, b) => total[b] - total[a]);
  fin.placements = Object.fromEntries([...fin.champions.map(n => [n, 1]), ...rest.map((n, i) => [n, i + 2])]);
  addScene(state, 'champions', fin.champions, {}, state.active, 'final');
  state.final = fin;
  return fin;
}

const round = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +v.toFixed(2)]));
