// ══════════════════════════════════════════════════════════════════════
// ch/final.js — the two-day final
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3 "The final". Sources: Battle for a New Champion and Total Madness (Wikipedia, read 2026-10-14: a
// checkpoint race over two days, an overnight stage, an instant elimination, the first man and the first woman
// across the line win); All Stars (HollywoodLife, 2021: "a series of checkpoints where each mini challenge
// awarded points", five for first, four for second); The Challenge 40 (Sportskeeda, 2025: four checkpoints
// and an overnight portion over two parts).
//
// The user, 2026-10-16: "the finale is very expeditive, it should take its time: longer explanations,
// conversations, longer challenges, more drama, comedy, clashes, taunts; TJ not doing his job; 6 frames for a
// challenge is a joke; no suspense; barely any last word or congratulations; we don't see them placed."
//
//   Day 1  TJ's welcome and the rules. Checkpoint 1, the Beach Haul; checkpoint 2, the Banquet (an eating
//          checkpoint). The slowest two of each division face an instant elimination.
//   Night  the overnight: the box (comfort for the leaders, extra tiles for a rival), talk at the fire,
//          and the cold; a quit is out of the final.
//   Day 2  checkpoint 3, the Ridge Puzzle (a kept final deal helps here); checkpoint 4, the Lagoon Swim;
//          checkpoint 5, the Summit Run to the finish line. Then the podium, the crowning, the goodbyes.
//
// Every checkpoint is placed and scored on points (first in a division takes the most), played as beats the
// viewer shows one at a time: the start, who leads, who passes whom, who struggles (in that checkpoint's own
// way), a taunt between rivals, a comic moment, a helping hand, the finish order, and the standings after it.
import { getBond, addBond } from '../bonds.js';
import { gs } from '../core.js';
import { S, addScene, noise, archetypeOf } from './state.js';
import { performanceMod, nudge } from './mind.js';
import { blendScore, playDuel, ARENA_GAMES } from './arena.js';
import { activeAlliances, endAlliance } from './alliances.js';
import { removePlayer } from './exits.js';
import { giveRespect } from './respect.js';
import { grudgeOf, trustOf, remember, keptWord } from './rel.js';
import { addRivalry } from './events.js';
import { fearOfThing } from './mind.js';
import { pairsOn, membersOf, repOf, playPairDuel, dissolvePair, unitsLeft, shapeOf } from './pairs.js';
import { shareOrKeep } from './share-keep.js';
import { teamsOn, teamFinalPlaces } from './teams.js';

const pop = (name, d) => { gs.popularity ||= {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; };

// stages: the course, as the Gauntlet Run has one (the user, 2026-10-16: "see how the gauntlet run its good i want
// that for the finale challenge too they're too quick especially summit run"); each is reached, by somebody first,
// and the viewer cuts to its own set (vp-ch-ep/games.js FINAL_STAGE). stageFear: the stage that tests a fear.
export const CHECKPOINTS = [
  { id: 'cp1', day: 1, name: 'The Beach Haul', blend: { physical: 0.4, endurance: 0.4, boldness: 0.2 }, struggle: 'haul',
    stages: [[0.25, 'the bag pile'], [0.55, 'the long stretch of sand'], [0.85, 'the flags']] },
  { id: 'cp2', day: 1, name: 'The Banquet', blend: { temperament: 0.45, endurance: 0.3, boldness: 0.25 }, struggle: 'eat', fear: 'gross food',
    stages: [[0.25, 'the first plate'], [0.55, 'the second plate'], [0.85, 'the last plate']], stageFear: { i: 1, thing: 'gross food' } },
  { id: 'cp3', day: 2, name: 'The Ridge Puzzle', blend: { mental: 0.45, endurance: 0.3, intuition: 0.25 }, struggle: 'puzzle',
    stages: [[0.25, 'the edge pieces'], [0.55, 'half the frame'], [0.85, 'the last few pieces']] },
  { id: 'cp4', day: 2, name: 'The Lagoon Swim', blend: { endurance: 0.5, physical: 0.3, boldness: 0.2 }, struggle: 'swim', fear: 'deep water',
    stages: [[0.2, 'the halfway rope'], [0.5, 'the far buoy'], [0.85, 'the dock ladder']], stageFear: { i: 0, thing: 'deep water' } },
  { id: 'cp5', day: 2, name: 'The Summit Run', blend: { endurance: 0.5, physical: 0.3, temperament: 0.2 }, struggle: 'run', last: true,
    stages: [[0.18, 'the jungle trail'], [0.4, 'the rope ladder'], [0.6, 'the cliff top'], [0.8, 'the volcano path'], [0.96, 'the finish arch']], stageFear: { i: 1, thing: 'heights', size: 0.6 } },
];
// points for a place in a division: first takes the most (All Stars: five for first, four for second...)
const POINTS = [10, 8, 6, 5, 4, 3, 2, 1, 1, 1];
const COMIC = new Set(['wildcard', 'chaos-agent', 'goat', 'floater', 'underdog']);

const divsOf = state => (state.options.gendered ? ['m', 'f'] : ['all']);
const inDiv = (state, d) => state.active.filter(n => d === 'all' || state.division[n] === d);

/**
 * One checkpoint: each finalist's time (as a score), the places and points in each division, and the beats:
 * progress snapshots (for the leaderboard) with what happened between them.
 */
function runCheckpoint(state, rng, cp, total, fin, bonus = {}) {
  const who = [...state.active];
  const score = {};
  for (const n of who) {
    let s = blendScore(n, cp.blend) * performanceMod(state, n, 0.85) + noise(rng) * 0.9 + (bonus[n] || 0);
    if (cp.fear) s -= fearOfThing(state, n, cp.fear) * 0.9;
    // a stage that tests a fear the checkpoint does not (the Summit Run's rope ladder)
    if (cp.stageFear && cp.stageFear.thing !== cp.fear) s -= fearOfThing(state, n, cp.stageFear.thing) * (cp.stageFear.size || 0.6);
    score[n] = s;
  }
  // the one the fear stage frightens most, if anybody: frozen on it, or through it anyway (the score has paid)
  const scared = cp.stageFear ? [...who].filter(n => fearOfThing(state, n, cp.stageFear.thing) >= 0.3)
    .sort((a, b) => fearOfThing(state, b, cp.stageFear.thing) - fearOfThing(state, a, cp.stageFear.thing))[0] : null;
  const froze = scared ? rng() < fearOfThing(state, scared, cp.stageFear.thing) * 0.8 : false;
  if (scared) { if (froze) { nudge(state, scared, 'confidence', -0.5); pop(scared, 0.1); } else { nudge(state, scared, 'confidence', 0.5); pop(scared, 0.3); } }
  for (const n of who) nudge(state, n, 'energy', cp.day === 2 ? -1.6 : -2);
  const beats = [];
  const B = (t, kind, w, data = {}) => beats.push({ t, kind, who: w, data });
  // progress over the checkpoint: the eventual order shows itself as it goes, with the middle shuffling
  const max = Math.max(...who.map(n => score[n])), min = Math.min(...who.map(n => score[n]));
  const pace = n => 0.72 + 0.5 * (score[n] - min) / Math.max(0.01, max - min);
  const jit = Object.fromEntries(who.map(n => [n, [0, 1, 2].map(() => (rng() - 0.5) * 0.18)]));
  const snapAt = (t, k) => Object.fromEntries(who.map(n => [n, +Math.min(0.97, Math.max(0.02, t * pace(n) + (k < 3 ? jit[n][k] * (1 - t) : 0))).toFixed(3)]));
  // the course: each stage reached, by somebody first, with the middle of the pack at it and somebody still behind
  (cp.stages || []).forEach(([at, name], i) => {
    const sn = snapAt(at, Math.min(2, Math.floor(at * 3)));
    const ord = [...who].sort((a, b) => sn[b] - sn[a]);
    const middle = ord.slice(1, -1);
    const mid = middle.length ? middle[i % middle.length] : ord[1];
    B(0.2 + at * 4.6, 'cp-stage', [ord[0], ord[ord.length - 1], mid], { i, name, snap: sn, last: i === cp.stages.length - 1 });
    if (scared && cp.stageFear.i === i) B(0.25 + at * 4.6, 'cp-fear', [scared], { i, name, thing: cp.stageFear.thing, froze, snap: sn });
  });
  const snaps = [snapAt(0.3, 0), snapAt(0.55, 1), snapAt(0.8, 2)];
  const orderOf = snap => [...who].sort((a, b) => snap[b] - snap[a]);
  B(0, 'cp-start', who, {});
  const o1 = orderOf(snaps[0]);
  B(1, 'cp-lead', [o1[0]], { snap: snaps[0] });
  // the struggle: the slowest, in this checkpoint's own way
  const slowest = [...who].sort((a, b) => score[a] - score[b]);
  B(1.5, 'cp-struggle', [slowest[0]], { snap: snaps[0], how: cp.struggle, n: 0 });
  // a taunt between rivals running near each other
  const near = (a, b, snap) => Math.abs(snap[a] - snap[b]) < 0.12;
  const rivals = [];
  for (const a of who) for (const b of who) if (a < b && (grudgeOf(a, b) + grudgeOf(b, a) >= 1.2 || getBond(a, b) <= -2)) rivals.push([a, b]);
  const taunt = rivals.find(([a, b]) => near(a, b, snaps[1]));
  // the pass: the biggest climber between the first and second look, and who they passed
  const o2 = orderOf(snaps[1]);
  const climb = who.map(n => ({ n, d: o1.indexOf(n) - o2.indexOf(n) })).sort((x, y) => y.d - x.d)[0];
  if (climb && climb.d > 0) {
    const passed = o2[o2.indexOf(climb.n) + 1];
    B(2, 'cp-pass', [climb.n, passed], { snap: snaps[1] });
  } else B(2, 'cp-lead', [o2[0]], { snap: snaps[1] });
  if (taunt) {
    const [a, b] = snaps[1][taunt[0]] >= snaps[1][taunt[1]] ? taunt : [taunt[1], taunt[0]];
    const bites = rng() < 0.5;
    addBond(a, b, -0.4); addRivalry(state, a, b, 0.5);
    if (bites) { score[b] -= 0.25; nudge(state, b, 'confidence', -0.4); } else { score[b] += 0.15; nudge(state, b, 'confidence', 0.3); }
    B(2.5, 'cp-taunt', [a, b], { snap: snaps[1], bites });
  }
  // a comic moment: somebody built for it, or somebody having the worst time
  const comic = who.filter(n => COMIC.has(archetypeOf(n)) || S(n, 'boldness') >= 8).sort((a, b) => S(b, 'boldness') - S(a, 'boldness'))[0];
  if (comic && rng() < 0.65) { pop(comic, 0.3); B(3, 'cp-comedy', [comic], { snap: snaps[1], how: cp.struggle }); }
  // a hand (the puzzle: a kept final deal)
  for (const h of fin.help.filter(x => cp.id === 'cp3' && who.includes(x.a) && who.includes(x.b))) B(3.5, 'cp-help', [h.a, h.b], { snap: snaps[2] });
  const o3 = orderOf(snaps[2]);
  B(4, 'cp-struggle', [slowest[1] || slowest[0]], { snap: snaps[2], how: cp.struggle, n: 1 });
  // the close finish: the top two of a division within a whisker
  const places = {}, pts = {};
  for (const d of divsOf(state)) {
    const ord = inDiv(state, d).sort((a, b) => score[b] - score[a]);
    ord.forEach((n, i) => { places[n] = i + 1; pts[n] = POINTS[i] ?? 0; total[n] = (total[n] || 0) + pts[n]; });
    if (ord.length >= 2 && score[ord[0]] - score[ord[1]] < 0.35) B(4.5, 'cp-close', [ord[0], ord[1]], { snap: snaps[2], div: d });
  }
  const order = [...who].sort((a, b) => score[b] - score[a]);
  // the course's beats among the race's, in time (a stable sort keeps same-time beats in the order they came)
  beats.sort((x, y) => x.t - y.t);
  B(5, 'cp-finish', order, { places, pts, snap: Object.fromEntries(who.map(n => [n, 1])) });
  // the checkpoint's winner earns respect; the last one loses some confidence
  giveRespect(state, order[0], 'dailyWin'); nudge(state, order[0], 'confidence', 0.6);
  nudge(state, order[order.length - 1], 'confidence', -0.6);
  const standings = Object.fromEntries(divsOf(state).map(d => [d, inDiv(state, d).sort((a, b) => total[b] - total[a]).map(n => [n, total[n]])]));
  const rec = { id: cp.id, name: cp.name, day: cp.day, scores: round(score), order, places, pts, standings, beats, leader: o3[0] };
  const prev = fin.checkpoints.at(-1)?.standings || null;
  fin.checkpoints.push(rec);
  // the scene carries the checkpoint as run, so the viewer and the backlog tell it the same (script/final-cp.js)
  addScene(state, 'final-cp', [...order], { id: cp.id, name: cp.name, day: cp.day, first: order[0], last: order[order.length - 1],
    rec: JSON.parse(JSON.stringify(rec)), prev: prev ? JSON.parse(JSON.stringify(prev)) : null }, state.active, 'final');
  return rec;
}

/** Talk at the fire on the overnight: rivals, friends, a laugh, and a deal that ends now. */
function fireTalk(state, rng) {
  const act = state.active;
  const used = new Set();
  const pairBy = score => {
    let best = null, top = -Infinity;
    for (const a of act) for (const b of act) {
      if (a >= b || used.has(a) || used.has(b)) continue;
      const s = score(a, b); if (s > top) { top = s; best = [a, b]; }
    }
    return best && top > 0 ? best : null;
  };
  const talks = [];
  const rival = pairBy((a, b) => grudgeOf(a, b) + grudgeOf(b, a) - getBond(a, b) * 0.5 - 1);
  if (rival) { rival.forEach(n => used.add(n)); addBond(rival[0], rival[1], -0.5); addRivalry(state, rival[0], rival[1], 0.5); talks.push(addScene(state, 'overnight-talk', rival, { mood: 'rivals' }, act, 'final')); }
  const friends = pairBy((a, b) => getBond(a, b) - 2);
  if (friends) { friends.forEach(n => used.add(n)); addBond(friends[0], friends[1], 0.6); nudge(state, friends[0], 'morale', 0.6); nudge(state, friends[1], 'morale', 0.6); talks.push(addScene(state, 'overnight-talk', friends, { mood: 'friends' }, act, 'final')); }
  const funny = act.filter(n => !used.has(n)).sort((a, b) => S(b, 'boldness') + S(b, 'social') - S(a, 'boldness') - S(a, 'social'))[0];
  const audience = act.filter(n => !used.has(n) && n !== funny)[0];
  if (funny && audience && rng() < 0.7) { used.add(funny); used.add(audience); for (const n of act) nudge(state, n, 'morale', 0.3); talks.push(addScene(state, 'overnight-talk', [funny, audience], { mood: 'comedy' }, act, 'final')); }
  return talks;
}

export function playFinal(state, rng) {
  state.day += 1;
  const fin = { finalists: [...state.active], checkpoints: [], instant: [], overnight: [], champions: [], totals: {}, help: [], sabotage: [], lastWords: [] };
  // (a Pairs season: an alliance whose finalists are one pair has nothing to say goodbye to; they race as one. Read
  // 2026-10-19: partners "stand together for the last time as allies", and "tomorrow I'm going to try to beat him")
  for (const al of activeAlliances(state)) {
    const left = al.members.filter(m => state.active.includes(m));
    const onePair = pairsOn(state) && left.length && left.every(m => membersOf(state, left[0]).includes(m));
    endAlliance(state, al, 'final', { quiet: onePair });
  }
  addScene(state, 'final-start', state.active, {}, state.active, 'final');
  const total = Object.fromEntries(state.active.map(n => [n, 0]));

  // ── Day 1 ──
  runCheckpoint(state, rng, CHECKPOINTS[0], total, fin);
  runCheckpoint(state, rng, CHECKPOINTS[1], total, fin);
  // A Pairs season's instant elimination: the two lowest pairs, two on two, only when four or more pairs are left
  // (Rivals III's three all finished). A pair's points are its two partners' average.
  const pairAvg = (r, t = total) => membersOf(state, r).reduce((x, n) => x + (t[n] || 0), 0) / membersOf(state, r).length;
  const pairReps = () => [...new Set(state.active.map(n => repOf(state, n)))];
  if (pairsOn(state)) {
    for (const d of shapeOf(state) === 'same' ? ['m', 'f'] : ['all']) {
      const left = pairReps().filter(r => d === 'all' || state.division[r] === d);
      if (left.length < 4) continue;
      const [x, y] = [...left].sort((a, b) => pairAvg(a) - pairAvg(b));
      const game = ARENA_GAMES.find(g => g.id === 'hallway-hustle');
      const duel = playPairDuel(state, rng, x, y, game);
      fin.instant.push(duel);
      addScene(state, 'instant-elimination', [...duel.winners, ...duel.losers], { winner: duel.winner, game: duel.game, pair: true, winners: duel.winners, losers: duel.losers }, state.active, 'final');
      const place = unitsLeft(state);
      dissolvePair(state, duel.loser);
      for (const l of duel.losers) {
        addScene(state, 'final-lastword', [l], { when: 'instant', place: null }, [l], 'confessional');
        fin.lastWords.push(l);
        removePlayer(state, l, 'final-instant', { place, pairDone: true });
        delete total[l];
      }
    }
  }
  // The instant elimination: the two lowest on points in each division with three or more left.
  for (const d of pairsOn(state) ? [] : divsOf(state)) {
    const left = inDiv(state, d);
    if (left.length < 3) continue;
    const [x, y] = [...left].sort((a, b) => total[a] - total[b]);
    const game = ARENA_GAMES.find(g => g.id === 'hallway-hustle');
    const duel = playDuel(state, rng, x, y, game);
    fin.instant.push(duel);
    addScene(state, 'instant-elimination', [x, y], { winner: duel.winner, game: duel.game }, state.active, 'final');
    // their last words, before they leave the final
    addScene(state, 'final-lastword', [duel.loser], { when: 'instant', place: null }, [duel.loser], 'confessional');
    fin.lastWords.push(duel.loser);
    removePlayer(state, duel.loser, 'final-instant');
    delete total[duel.loser];
  }

  // ── The overnight ──
  // The box (Battle for a New Champion: "players empty a tile-filled box for items (a blanket, pillow, or chair)
  // and extra tiles for rivals"): the leaders on points empty theirs first, take the comfort, and pick a rival.
  addScene(state, 'overnight', state.active, {}, state.active, 'final');
  const order = [...state.active].sort((a, b) => total[b] - total[a]);
  const comfort = {};
  order.forEach((n, i) => { comfort[n] = i < 3 ? ['chair', 'pillow', 'blanket'][i] : null; });
  for (const n of order.slice(0, Math.ceil(order.length / 2))) {
    const rival = state.active.filter(x => x !== n).sort((x, y) => grudgeOf(n, y) - grudgeOf(n, x)
      + (state.division[y] === state.division[n] ? 0.5 : 0) - (state.division[x] === state.division[n] ? 0.5 : 0))[0];
    if (!rival || (grudgeOf(n, rival) < 0.5 && state.division[rival] !== state.division[n])) continue;
    fin.sabotage.push({ from: n, to: rival });
    remember(rival, n, 'sabotaged-me', 1.5);
    addBond(n, rival, -0.6);
    addScene(state, 'overnight-sabotage', [n, rival], { first: fin.sabotage.length === 1 }, state.active, 'final');
  }
  const tiles = n => fin.sabotage.filter(x => x.to === n).length;
  fireTalk(state, rng);
  for (const n of [...state.active]) {
    if (!state.active.includes(n)) { fin.overnight.push({ name: n, partnerQuit: true }); continue; }   // a partner who quit took them out
    const m = state.mind[n];
    // a partner holds you up through the night: quitting a Pairs final throws away their money too
    const p = Math.max(0, 0.05 * (1 - (S(n, 'endurance') + S(n, 'temperament')) / 20) * (1 + m.homesick / 10) * (1.3 - m.morale / 12) * (1 + tiles(n) * 0.5)
      * (pairsOn(state) ? 0.5 : 1));
    if (rng() < p) {
      // why, from the same terms as the chance (the user, 2026-10-18: "Sami just quit for seemingly no reason"): the
      // tiles somebody dumped on them, home, a night that convinced them they cannot win, or the body giving out
      const why = tiles(n) >= 1 && rng() < 0.6 ? 'tiles' : m.homesick >= 4 ? 'home' : m.morale <= 4 ? 'beaten' : 'body';
      const by = why === 'tiles' ? fin.sabotage.filter(x => x.to === n).map(x => x.from).find(x => state.active.includes(x)) || null : null;
      // the one who sees it happen: the closest friend still out here
      const friend = state.active.filter(x => x !== n && x !== by).sort((x, y) => getBond(y, n) - getBond(x, n))[0] || null;
      fin.overnight.push({ name: n, quit: true, why });
      giveRespect(state, n, 'quit');
      if (friend && getBond(friend, n) >= 1) { addBond(friend, n, 0.3); nudge(state, friend, 'morale', -0.3); }
      if (by) remember(n, by, 'sabotaged-me', 1);
      addScene(state, 'overnight-quit', [n, ...(friend ? [friend] : []), ...(by ? [by] : [])], { why, friend, by }, state.active, 'final');
      removePlayer(state, n, 'final-quit');
      delete total[n];
      continue;
    }
    // Holding up through the night is worth a point or two on day two.
    const held = (S(n, 'endurance') * 0.6 + S(n, 'temperament') * 0.4) / 10 + (comfort[n] ? 0.15 : 0) - tiles(n) * 0.12;
    total[n] += Math.round(held * 2);
    nudge(state, n, 'energy', -2.5);
    fin.overnight.push({ name: n, held: +held.toFixed(2), comfort: comfort[n], tiles: tiles(n) });
  }
  // a quit in a Pairs season takes the partner with it (exits.js): neither runs on
  for (const n of Object.keys(total)) if (!state.active.includes(n)) delete total[n];
  state.day += 1;

  // ── Day 2 ──
  // A ride-to-the-final pact pays out on the puzzle: a man and a woman who are not racing each other share the
  // answer. Kept, it is loyalty proved; a partner in the same division owes nothing.
  for (const d of state.deals.filter(x => x.tier === 'final' && !x.broken)) {
    if (!state.active.includes(d.a) || !state.active.includes(d.b) || state.division[d.a] === state.division[d.b]) continue;
    // partners race as one already: a pact between them is not a pact (it aired as one partner running off)
    if (pairsOn(state) && state.partnerOf?.[d.a] === d.b) continue;
    const keeps = rng() < 0.6 + S(d.a, 'loyalty') * 0.03;
    if (keeps) { fin.help.push({ a: d.a, b: d.b }); keptWord(d.a, d.b, 1); keptWord(d.b, d.a, 1); }
    addScene(state, keeps ? 'final-pact-help' : 'final-pact-broken', [d.a, d.b], {}, [d.a, d.b], 'final');
  }
  const helped = Object.fromEntries(state.active.map(n => [n, fin.help.some(h => h.a === n || h.b === n) ? 0.6 : 0]));
  runCheckpoint(state, rng, CHECKPOINTS[2], total, fin, helped);
  runCheckpoint(state, rng, CHECKPOINTS[3], total, fin);
  runCheckpoint(state, rng, CHECKPOINTS[4], total, fin);

  // ── The finish ──
  fin.totals = round(total);
  if (pairsOn(state)) return finishPairs(state, rng, fin, total, pairAvg, pairReps);
  if (teamsOn(state) && state.options.teams?.end === 'team-final') return finishTeams(state, fin, total);
  fin.podium = {};
  for (const d of divsOf(state)) {
    const ord = inDiv(state, d).sort((a, b) => total[b] - total[a] || (fin.checkpoints.at(-1).places[a] - fin.checkpoints.at(-1).places[b]));
    fin.podium[d] = ord;
    if (ord[0]) fin.champions.push(ord[0]);
  }
  state.champions = fin.champions;
  // Placements for the finishers: champions 1, the rest in order of total, counted after every champion (two
  // champions share 1st and the next is 3rd: numbered from 2, the season had no 6th, the export found it)
  const rest = state.active.filter(n => !fin.champions.includes(n)).sort((a, b) => total[b] - total[a]);
  fin.placements = Object.fromEntries([...fin.champions.map(n => [n, 1]), ...rest.map((n, i) => [n, i + 1 + fin.champions.length])]);
  addScene(state, 'final-podium', [...state.active], { podium: fin.podium, totals: fin.totals }, state.active, 'final');
  addScene(state, 'champions', fin.champions, {}, state.active, 'final');
  // the runners-up: one congratulates each champion (gracious, or not); everybody's last words
  for (const c of fin.champions) {
    const second = fin.podium[divsOf(state).find(d => fin.podium[d][0] === c)]?.[1];
    if (!second) continue;
    const gracious = getBond(second, c) >= 0 || S(second, 'temperament') >= 6;
    if (gracious) addBond(second, c, 0.6);
    addScene(state, 'final-congrats', [second, c], { gracious }, state.active, 'final');
  }
  for (const d of divsOf(state)) (fin.podium[d] || []).forEach((n, i) => {
    if (i === 0) return;
    addScene(state, 'final-lastword', [n], { when: 'finish', place: i + 1 }, [n], 'confessional');
    fin.lastWords.push(n);
  });
  for (const c of fin.champions) pop(c, 3);
  // the season's last words are the champions', looking back at how they won (the user, 2026-10-16: "with a
  // lot of variants based on how they manage to win ... and a double confessional if theres 2 winners")
  const paths = fin.champions.map(c => pathOf(state, c));
  addScene(state, 'champion-reflect', [...fin.champions], { path: paths[0]?.path || 'grind', pathB: paths[1]?.path || null,
    ref: paths[0]?.ref || null, refB: paths[1]?.ref || null }, state.active, 'confessional');
  state.final = fin;
  return fin;
}

// The finish of a Pairs season: pairs placed on their partners' average, a champion pair (one a division when the
// pairs are men's and women's), then every pair with money chooses to share it or keep it (share-keep.js).
function finishPairs(state, rng, fin, total, pairAvg, pairReps) {
  const last = fin.checkpoints.at(-1)?.places || {};
  const lastPlace = r => Math.min(...membersOf(state, r).map(n => last[n] ?? 99));
  const ordered = pairReps().sort((a, b) => pairAvg(b) - pairAvg(a) || lastPlace(a) - lastPlace(b));
  const groups = shapeOf(state) === 'same' ? ['m', 'f'] : ['all'];
  fin.podium = {};
  fin.pairPodium = {};
  for (const d of groups) {
    const ord = ordered.filter(r => d === 'all' || state.division[r] === d);
    fin.pairPodium[d] = ord.map(r => membersOf(state, r));
    // the podium by person too, for the readers that list people (each pair together, the better partner first)
    fin.podium[d] = ord.flatMap(r => [...membersOf(state, r)].sort((x, y) => (total[y] || 0) - (total[x] || 0)));
    if (ord[0]) fin.champions.push(...membersOf(state, ord[0]));
  }
  state.champions = fin.champions;
  // placements by pair: both partners share it; with two divisions, both champion pairs are first
  fin.placements = {};
  const placeOf = {};
  for (const d of groups) fin.pairPodium[d].forEach((m, i) => { placeOf[m[0]] = i + 1; });
  let next = groups.length + 1;
  const rest = ordered.filter(r => placeOf[r] > 1);
  for (const r of ordered) for (const n of membersOf(state, r)) fin.placements[n] = placeOf[r] === 1 ? 1 : null;
  for (const r of rest) { for (const n of membersOf(state, r)) fin.placements[n] = next; next++; }
  fin.pairTotals = Object.fromEntries(ordered.map(r => [membersOf(state, r).join(' & '), +pairAvg(r).toFixed(2)]));
  addScene(state, 'final-podium', [...state.active], { podium: fin.podium, pairPodium: fin.pairPodium, totals: fin.totals, pairs: true }, state.active, 'final');
  addScene(state, 'champions', fin.champions, { pairs: true }, state.active, 'final');
  for (const d of groups) {
    const [first, second] = fin.pairPodium[d];
    if (!first || !second) continue;
    const gracious = getBond(second[0], first[0]) + getBond(second[1], first[1]) >= 0 || S(second[0], 'temperament') >= 6;
    if (gracious) for (const s of second) for (const c of first) addBond(s, c, 0.3);
    addScene(state, 'final-congrats', [second[0], first[0], second[1], first[1]], { gracious, pair: true }, state.active, 'final');
  }
  // the money: every pair that won some, the last first and the champions last (Rivals III)
  const byPlace = groups.flatMap(d => fin.pairPodium[d].map((m, i) => ({ members: m, place: i + 1, pts: Object.fromEntries(m.map(n => [n, total[n] || 0])),
    pair: (state.pairs || []).find(p => p.a === m[0] || p.b === m[0]) || null })));
  fin.choices = shareOrKeep(state, rng, byPlace);
  for (const d of groups) fin.pairPodium[d].forEach((m, i) => {
    if (i === 0) return;
    for (const n of m) { addScene(state, 'final-lastword', [n], { when: 'finish', place: i + 1, pair: true }, [n], 'confessional'); fin.lastWords.push(n); }
  });
  for (const c of fin.champions) pop(c, 3);
  // the season's last words: each champion pair, looking back on what the one who chose did with the money
  for (const c of fin.choices.filter(x => x.place === 1)) {
    addScene(state, 'champion-reflect', [c.chooser, c.partner], { pair: true, chooser: c.chooser, keep: c.keep, amount: c.prize }, state.active, 'confessional');
  }
  state.final = fin;
  return fin;
}

// A Teams season's team final (War of the Worlds 2: "the winning team equally split the grand prize"): each team on
// its members' average; every member of the best team is a champion; the rest placed by team.
function finishTeams(state, fin, total) {
  const order = teamFinalPlaces(state, total);
  fin.teamPodium = order;
  fin.champions = [...(order[0]?.members || [])];
  state.champions = fin.champions;
  fin.podium = { all: order.flatMap(t => [...t.members].sort((a, b) => (total[b] || 0) - (total[a] || 0))) };
  fin.placements = {};
  let next = 2;
  order.forEach((t, i) => { for (const n of t.members) fin.placements[n] = i === 0 ? 1 : next; if (i > 0) next++; });
  addScene(state, 'final-podium', [...state.active], { podium: fin.podium, teamPodium: order, totals: fin.totals, teams: true }, state.active, 'final');
  addScene(state, 'champions', fin.champions, { team: order[0]?.name || null, teams: true }, state.active, 'final');
  for (const t of order.slice(1)) for (const n of t.members) { addScene(state, 'final-lastword', [n], { when: 'finish', place: fin.placements[n], team: t.name }, [n], 'confessional'); fin.lastWords.push(n); }
  for (const c of fin.champions) pop(c, 2.5);
  addScene(state, 'champion-reflect', fin.champions.slice(0, 2), { path: 'team', team: order[0]?.name || null, teams: true }, state.active, 'confessional');
  state.final = fin;
  return fin;
}

// How a champion won, read off the season: the thing they would talk about first. `ref` is the person it was
// about (the partner, the friend), when there is one.
function pathOf(state, n) {
  const r = state.rec[n] || {};
  const couple = (state.couples || []).find(c => !c.ended && (c.a === n || c.b === n));
  if (couple) return { path: 'showmance', ref: couple.a === n ? couple.b : couple.a };
  if ((r.arenaW || 0) >= 3) return { path: 'survival' };
  if ((r.dailyWins || 0) >= 3) return { path: 'challenge' };
  const allied = (state.alliances || []).some(a => (a.members || []).includes(n) || (a.former || []).includes(n));
  if (!(r.votedIn || 0) && allied) return { path: 'strategy' };
  if ((r.fights || 0) >= 2) return { path: 'drama' };
  const friend = state.cast.filter(o => o !== n).sort((x, y) => getBond(n, y) - getBond(n, x))[0];
  if (friend && getBond(n, friend) >= 5) return { path: 'friendship', ref: friend };
  if ((gs.popularity?.[n] || 0) >= 4) return { path: 'social' };
  return { path: 'grind' };
}

const round = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +(+v).toFixed(2)]));
