// ══════════════════════════════════════════════════════════════════════
// ch/dailies.js — the daily challenge: solo, pairs or teams
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3 step 2, §4.6 (partner picks as signals), §4.8 (throwing, partner
// weeks, rewards). The winners are immune from the vote.
//
// Scoring balance (CLAUDE.md): a pair or a team scores its members' AVERAGE,
// never a sum.
//
// Throwing is a scheme (mayScheme only). The motive is real and specific to
// the format: when the week belongs to the OTHER division, winning protects you
// from nothing and only makes you look like a threat; in a partner week, a
// player who cannot stand their partner can sink them. Anybody watching may
// catch it (intuition), and being caught costs trust and respect.
import { getPerceivedBond, getBond, addBond } from '../bonds.js';
import { S, mayScheme, addScene, noise, shuffle, clamp, weighted } from './state.js';
import { performanceMod, nudge } from './mind.js';
import { giveRespect, threatRead } from './respect.js';
import { blendScore, injuryRoll } from './arena.js';
import { remember, dailyWon, respected } from './rel.js';
import { noteThrow, knowsThrow } from './knowledge.js';
import { trustOf } from './rel.js';

export const DAILIES = [
  { id: 'cliff-relay', name: 'Cliff Relay', physicality: 1.2, modes: ['pairs', 'teams', 'solo'],
    blend: { physical: 0.35, boldness: 0.35, endurance: 0.3 },
    desc: 'A rope ladder hangs down the face of the sea cliff below the villa, with a flag clipped every ten metres. Players climb, unclip a flag and jump the full height into the lagoon, then swim back to the base to climb again. A flag dropped in the water is lost, and anyone who will not jump has to climb back down the ladder. The most flags in twenty minutes wins.' },
  { id: 'reef-dash', name: 'Reef Dash', physicality: 1.0, modes: ['solo', 'pairs'],
    blend: { endurance: 0.45, physical: 0.35, intuition: 0.2 },
    desc: 'Twenty numbered buoys float over the reef, each with a token tied underneath. Players swim out, dive for the tokens and bring them back to the beach one at a time, in any order they like. The current pushes everyone off course, and a token from the wrong buoy is worth nothing. The highest total of token numbers when the horn sounds wins.' },
  { id: 'truck-tug', name: 'Truck Tug', physicality: 1.3, modes: ['teams', 'pairs'],
    blend: { physical: 0.55, endurance: 0.35, temperament: 0.1 },
    desc: 'Each side is harnessed to a pickup truck at the start of a long sand track. They drag it to the finish line, where a puzzle waits that only opens once the truck crosses. Sand piles up under the wheels if they stop, and the harnesses rub raw, so every rest costs twice the effort to restart. The first side to drag the truck home and solve the puzzle wins.' },
  { id: 'lagoon-quiz', name: 'Lagoon Quiz', physicality: 0.3, modes: ['solo', 'pairs'],
    blend: { mental: 0.55, intuition: 0.25, temperament: 0.2 },
    desc: 'Players stand on floating platforms in the lagoon while TJ asks questions about the house, the island and each other. A right answer lets them knock a rival off their platform with a padded pole. A wrong answer, or falling in on your own, puts you in the water and out of the round. The last one standing on a platform wins.' },
  { id: 'jungle-maze', name: 'Jungle Maze', physicality: 0.8, modes: ['solo', 'pairs', 'teams'],
    blend: { intuition: 0.35, mental: 0.3, endurance: 0.35 },
    desc: 'A maze of bamboo walls is cut into the jungle, with five stations hidden inside, each holding one letter. Players find all five, work out the word they spell, and shout it at the exit. Dead ends cost minutes, and a wrong word sends them back in for a letter they missed. The first to call the right word at the exit wins.' },
  { id: 'hang-on', name: 'Hang On', physicality: 0.9, modes: ['solo', 'pairs'],
    blend: { endurance: 0.5, temperament: 0.3, physical: 0.2 },
    desc: 'Players hang from a net slung under the pier, high over the water, with nothing to stand on. Every few minutes the crew loosens the net and it sags lower, while the tide comes up to meet it. Letting go, or touching the water with any part of the body, is out. The last one still holding on wins.' },
  { id: 'demolition', name: 'Demolition Derby', physicality: 1.1, modes: ['teams', 'pairs'],
    blend: { physical: 0.4, boldness: 0.4, endurance: 0.2 },
    desc: 'Each side defends a tower of crates in its own corner of a sand ring, and carries padded rams. They smash the other towers while keeping their own standing. A tower that falls is out, and anyone who leaves the ring cannot come back in. The last side with a tower standing wins.' },
  { id: 'night-swim', name: 'Night Swim', physicality: 1.0, modes: ['solo', 'pairs'],
    blend: { endurance: 0.4, boldness: 0.35, mental: 0.25 },
    desc: 'After dark, players swim a marked loop of glowing buoys around the point, where a lantern on each buoy shows one number. Back on the beach, they add every number up and write the total on a board. Missing a buoy, or adding it wrong, means swimming back out to check. The first right total on the board wins.' },
  { id: 'balance-beam', name: 'Balance Beam', physicality: 0.6, modes: ['solo', 'pairs'],
    blend: { temperament: 0.4, intuition: 0.3, physical: 0.3 },
    desc: 'A greased beam stretches over the pool, and players carry a full bucket of water across it to fill a tank on the other side. Anything spilled is gone, and a fall means climbing out and starting again with an empty bucket. The beam gets more slippery with every crossing. The fullest tank when the clock runs out wins.' },
  { id: 'gauntlet-run', name: 'Gauntlet Run', physicality: 1.2, modes: ['teams', 'solo', 'pairs'],
    blend: { physical: 0.4, endurance: 0.3, boldness: 0.3 },
    desc: 'A beach course of tyre runs, a mud crawl under barbed rope, a wall and a sandbag carry ends at a bell. Players run it in heats against the clock. A missed obstacle adds a minute, and a dropped sandbag goes back to its pile. The fastest time across the bell wins.' },
];

export function pickMode(state, rng) {
  if (!state.options.partnerWeeks) return 'solo';
  const share = state.ep / Math.max(1, state.plannedEpisodes || 14);
  const w = [
    { item: 'solo', w: 0.4 + share * 0.5 },
    { item: 'pairs', w: share < 0.75 ? 0.4 : 0.1 },
    { item: 'teams', w: share < 0.5 ? 0.25 : 0.03 },
  ];
  return weighted(rng, w);
}

export function pickDaily(state, rng, mode) {
  const recent = state.episodes.slice(-5).map(e => e.daily?.id);
  const ok = DAILIES.filter(d => d.modes.includes(mode) && !recent.includes(d.id));
  const pool = ok.length ? ok : DAILIES.filter(d => d.modes.includes(mode));
  return pool[Math.floor(rng() * pool.length)];
}

// Partners: drawn, or picked (the pick is a signal, and being picked last stings).
export function makePairs(state, rng) {
  const drawn = rng() < 0.5;
  const out = [];
  if (state.options.gendered) {
    const men = state.active.filter(n => state.division[n] === 'm');
    const women = state.active.filter(n => state.division[n] === 'f');
    const [pickers, pickees] = men.length <= women.length ? [men, women] : [women, men];
    if (drawn) {
      const a = shuffle(rng, pickers), b = shuffle(rng, pickees);
      a.forEach((p, i) => out.push([p, b[i]]));
      b.slice(a.length).forEach((x, i) => out[i % out.length]?.push(x));
    } else {
      const order = [...pickers].sort((a, b) => (state.rec[b].respect - state.rec[a].respect) || (a < b ? -1 : 1));
      const left = [...pickees];
      for (const p of order) {
        const scored = left.map(x => ({ x, s: getPerceivedBond(p, x) * 0.6 + threatRead(state, x) * 0.4 * S(p, 'strategic') / 10 + noise(rng) * 0.4 }))
          .sort((a, b) => b.s - a.s);
        const chosen = scored[0].x;
        left.splice(left.indexOf(chosen), 1);
        out.push([p, chosen]);
        addBond(p, chosen, 0.6);
        remember(chosen, p, 'worked-with-me', 0.8, { picked: true });
      }
      // Anyone left over (uneven divisions) joins a pair; the last pick is noticed.
      const last = out[out.length - 1]?.[1];
      if (last) {
        nudge(state, last, 'morale', -0.8); nudge(state, last, 'confidence', -0.6);
        addScene(state, 'picked-last', [last], { by: out[out.length - 1][0] }, state.active, 'public');
      }
      left.forEach((x, i) => out[i % out.length].push(x));
    }
  } else {
    const a = shuffle(rng, state.active);
    for (let i = 0; i < a.length; i += 2) out.push(a.slice(i, i + 2));
    if (out.length > 1 && out[out.length - 1].length === 1) out[out.length - 2].push(out.pop()[0]);
  }
  addScene(state, drawn ? 'partner-draw' : 'partner-pick', state.active, { pairs: out }, state.active, 'public');
  return out;
}

export function makeTeams(state, rng) {
  // Two teams, snake-drafted by the house's read of strength so they are fair.
  const order = shuffle(rng, state.active).sort((a, b) => threatRead(state, b) - threatRead(state, a));
  const teams = [[], []];
  order.forEach((n, i) => teams[[0, 1, 1, 0][i % 4]].push(n));
  return teams;
}

// Who throws, and how hard (0..1).
function throwIntent(state, rng, name, unit, division) {
  if (!mayScheme(name)) return 0;
  const safeAnyway = division !== 'all' && state.division[name] !== division;
  let motive = 0;
  if (safeAnyway) motive += (threatRead(state, name) - 6) * 0.15 * S(name, 'strategic') / 10;
  const partner = unit.find(x => x !== name);
  if (unit.length === 2 && partner && getBond(name, partner) < -3) motive += (-getBond(name, partner) - 3) * 0.12;
  if (motive <= 0) return 0;
  return rng() < clamp(motive, 0, 0.6) ? clamp(0.3 + motive, 0.3, 0.8) : 0;
}

// Play the daily. Returns { id, name, mode, units, scores, winners, last, throws, injuries, reward }.
export function playDaily(state, rng, { division }) {
  const mode = pickMode(state, rng);
  const daily = pickDaily(state, rng, mode);
  const units = mode === 'pairs' ? makePairs(state, rng) : mode === 'teams' ? makeTeams(state, rng) : state.active.map(n => [n]);
  const throws = [];
  const indiv = {};
  for (const unit of units) {
    for (const n of unit) {
      const thr = throwIntent(state, rng, n, unit, division);
      // A daily is long and messy (a slip, a wrong turn, a good line): the day's
      // form is a bigger share of the result than in a one-on-one, where the
      // better athlete usually wins. Spread measured by the audit's daily share.
      let s = blendScore(n, daily.blend) * performanceMod(state, n, 0.5) + noise(rng) * 1.9;
      if (thr) { s *= 1 - thr * 0.45; throws.push({ name: n, size: +thr.toFixed(2) }); }
      indiv[n] = s;
    }
  }
  const unitScore = u => u.reduce((a, n) => a + indiv[n], 0) / u.length;
  const ranked = [...units].sort((a, b) => unitScore(b) - unitScore(a));
  let winners;
  if (mode === 'solo' && state.options.gendered) {
    const best = d => [...state.active].filter(n => state.division[n] === d).sort((a, b) => indiv[b] - indiv[a])[0];
    winners = ['m', 'f'].map(best).filter(Boolean);
  } else {
    winners = [...ranked[0]];
  }
  const last = [...ranked[ranked.length - 1]];
  for (const w of winners) { state.rec[w].dailyWins++; giveRespect(state, w, 'dailyWin'); nudge(state, w, 'confidence', 0.8); dailyWon(w, state.active, mode === 'solo' ? 0.6 : 0.25); }
  // Partners who won together.
  if (mode === 'pairs') for (const [a, b] of [winners]) if (a && b) { addBond(a, b, 0.8); remember(a, b, 'worked-with-me', 1); remember(b, a, 'worked-with-me', 1); }
  for (const l of last) { state.rec[l].dailyLast++; nudge(state, l, 'confidence', -0.5); }
  for (const n of state.active) nudge(state, n, 'energy', -1.2 * daily.physicality);
  // Throwing, and who catches it.
  const caught = [];
  for (const t of throws) {
    state.rec[t.name].throws++;
    for (const o of state.active) {
      if (o === t.name) continue;
      if (rng() < t.size * S(o, 'intuition') / 10 * 0.12) {
        caught.push({ thrower: t.name, by: o });
        addBond(o, t.name, -1.2);
        remember(o, t.name, 'threw-it', 1.6);
        break;
      }
    }
  }
  for (const c of caught) {
    state.rec[c.thrower].caught++;
    giveRespect(state, c.thrower, 'caughtThrowing');
    noteThrow(state, c.thrower, c.by);
    addScene(state, 'throw-caught', [c.by, c.thrower], { daily: daily.id }, state.active, 'public');
  }
  for (const t of throws.filter(x => !caught.some(c => c.thrower === x.name))) {
    noteThrow(state, t.name);
    addScene(state, 'throw', [t.name], { daily: daily.id, size: t.size }, [t.name], 'private');
  }
  // Injuries in the physical ones.
  const injuries = state.active.filter(n => injuryRoll(state, rng, n, daily.physicality));
  for (const n of injuries) { state.rec[n].injuries++; nudge(state, n, 'energy', -2); nudge(state, n, 'morale', -1); }
  // Clutch and choke moments: the best and worst against expectation.
  const exp = n => blendScore(n, daily.blend);
  const vsExp = state.active.map(n => ({ n, d: indiv[n] - exp(n) })).sort((a, b) => b.d - a.d);
  const moments = [];
  if (vsExp[0]?.d > 1.2) moments.push({ kind: 'clutch', who: vsExp[0].n });
  const worst = vsExp[vsExp.length - 1];
  if (worst?.d < -1.5 && !throws.some(t => t.name === worst.n)) moments.push({ kind: 'choke', who: worst.n });
  for (const m of moments) addScene(state, `daily-${m.kind}`, [m.who], { daily: daily.id }, state.active, 'public');
  // The reward: sometimes a call home for the winners (spec §4.8).
  let reward = null;
  if (rng() < 0.3) {
    reward = { kind: 'call-home', to: [...winners] };
    for (const w of winners) { nudge(state, w, 'homesick', -3); nudge(state, w, 'morale', 1.2); }
    addScene(state, 'call-home', winners, {}, winners, 'private');
  }
  addScene(state, 'daily', state.active, { daily: daily.id, mode, winners, last }, state.active, 'public');
  return { id: daily.id, name: daily.name, mode, units, winners, last,
    scores: Object.fromEntries(Object.entries(indiv).map(([k, v]) => [k, +v.toFixed(2)])),
    throws, caught, injuries, moments, reward };
}

