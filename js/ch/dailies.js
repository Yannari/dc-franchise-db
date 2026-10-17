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
import { S, mayScheme, addScene, noise, shuffle, clamp, weighted, kinOf, KIN_PULL } from './state.js';
import { performanceMod, nudge } from './mind.js';
import { giveRespect, threatRead } from './respect.js';
import { blendScore, injuryRoll } from './arena.js';
import { remember, dailyWon, respected } from './rel.js';
import { noteThrow, knowsThrow } from './knowledge.js';
import { trustOf } from './rel.js';
import { playPoleTruth } from './daily/pole-truth.js';
import { playHangOn } from './daily/hang-on.js';
import { playInterrogation } from './daily/interrogation.js';
import { playRace } from './daily/race.js';
import { playDemolition } from './daily/demolition.js';
import { playRaftKing, playCutRope, playDoubleCross, playTrustFall, playWhoSaidIt } from './daily/betrayal.js';
import { pairsOn, shapeOf, logDaily } from './pairs.js';
import { playDeepFreeze, playLogRoll, playRoadKill, playMudBrawl, playBuried, playFoodWars, playTrapeze, playPoisonCup } from './daily/more.js';

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
  { id: 'lagoon-quiz', name: 'Interrogation', physicality: 0.5, modes: ['solo'], played: true,
    blend: { mental: 0.3, intuition: 0.25, endurance: 0.25, temperament: 0.2 },
    desc: 'Everybody stands on a narrow platform above the gorge, holding an overhead bar with both hands. One at a time, each player gets a true-or-false question from TJ about the people in this house, and a right answer means picking somebody whose bar tilts forward a notch. A wrong answer tilts their own, and the further a bar tilts the harder it is to hang on, until the third notch drops you into the water. The last one still holding on wins.' },
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
    desc: 'A beach course of tire runs, a mud crawl under barbed rope, a wall and a sandbag carry ends at a bell. Players run it in heats against the clock. A missed obstacle adds a minute, and a dropped sandbag goes back to its pile. The fastest time across the bell wins.' },
];

// Pole Truth (the user's pick from Total Drama, 2026-10-15): six posts in the water, played in heats.
DAILIES.push({ id: 'pole-truth', name: 'Pole Truth', physicality: 0.7, modes: ['solo'], played: true,
  blend: { endurance: 0.35, temperament: 0.35, physical: 0.15, mental: 0.15 },
  desc: 'Wooden posts stand in the shallows, one for every player, and a division at a time they climb up and stand on top of one, with no breakfast and no water. Every few hours TJ brings food for anybody who steps down, and in between TJ reads out a truth about somebody up there, something that was supposed to stay secret. Stepping down, falling, or getting knocked off by a hungry neighbour means the water and the end of the day. The last man and the last woman still standing win.' });
// The betrayal dailies (the user, 2026-10-15: "add the betrayal ones"): somebody chooses between a friend and themselves.
DAILIES.push(
  { id: 'raft-king', name: 'King of the Raft', physicality: 1.1, modes: ['solo'], played: true,
    blend: { physical: 0.4, boldness: 0.3, temperament: 0.3 },
    desc: 'Everybody climbs onto the yellow raft floating off the beach, a division at a time. On the horn, players push, pull and shove each other off it, and anybody can team up with anybody. Touching the water with any part of the body means out, and the last allies standing still have to get rid of each other. The last one on the raft wins.' },
  { id: 'cut-rope', name: 'Cut the Rope', physicality: 0.9, modes: ['pairs'], played: true,
    blend: { endurance: 0.45, physical: 0.3, temperament: 0.25 },
    desc: 'Each pair hangs under the pier from one rope, both holding on, while the crew lowers it a notch every few minutes. A pair drops when its weaker grip goes, but either partner can cut the other loose with the knife on the rope and hang on lighter, alone. Letting go, or getting cut, puts you in the water. The last pair hanging wins together, and somebody who cut their partner and outlasts everybody wins alone.' },
  { id: 'double-cross', name: 'Double Cross', physicality: 0.9, modes: ['pairs'], played: true,
    blend: { endurance: 0.4, physical: 0.3, intuition: 0.3 },
    desc: 'Pairs swim out to the buoys over the reef and bring back numbered tokens, and the pair with the highest total goes to the board. There, each partner secretly chooses to share the safety or steal it. If both share, both are safe; if one steals, only the stealer is; if both steal, nobody is, and the next pair gets the same choice. Whoever comes out of the choice safe wins.' },
  { id: 'trust-fall', name: 'Trust Fall', physicality: 0.6, modes: ['pairs'], played: true,
    blend: { boldness: 0.4, social: 0.3, temperament: 0.3 },
    desc: 'One partner stands blindfolded at the end of a plank high on the tower, and the other works the safety line from a lever on the dock below. The faller has to let go and drop backwards, and the catcher can catch them, or let them fall into the water and take a call home for themselves. A pair that hesitates loses time, and a pair whose catcher lets go scores nothing. The pair with the fastest clean fall wins.' },
  { id: 'who-said-it', name: 'Who Said It', physicality: 0.1, modes: ['solo'], played: true,
    blend: { intuition: 0.45, social: 0.35, mental: 0.2 },
    desc: 'The whole house stands on the deck of the beach club while TJ asks questions about the house itself, like who is the biggest snake or who is riding coattails. Everybody answers out loud, one at a time, in front of everybody, and points go to everybody whose answer matches the most common one. Nobody can take an answer back, and everybody named hears who named them. The best man and the best woman on points win.' },
);
// The dailies on the user's G sets (2026-10-16): the empty scene and one object per player.
DAILIES.push(
  { id: 'deep-freeze', name: 'Deep Freeze', physicality: 0.6, modes: ['solo'], played: true,
    blend: { endurance: 0.45, temperament: 0.4, physical: 0.15 },
    desc: 'A steel tub of ice water waits on the sand for every player, and on the horn they climb in and sit down up to the neck. Every few minutes the crew tips in more ice, and in between TJ offers hot cocoa and a warm blanket to anybody who climbs out. Standing up, climbing out or taking the offer ends it for that player. The last man and the last woman still sitting in the ice win.' },
  { id: 'log-roll', name: 'Rolling in the Deep', physicality: 1, modes: ['solo'], played: true,
    blend: { endurance: 0.4, physical: 0.35, temperament: 0.25 },
    desc: 'Five players at a time hang from a long log held between two steel frames over the lagoon. The log starts to turn, then spins faster and faster, and every so often it changes direction without warning. Letting go drops you into the water and out of the heat. The last one still hanging in each heat goes to the final, and the last one hanging there wins.' },
  { id: 'road-kill', name: 'Road Kill', physicality: 1.2, modes: ['solo'], played: true,
    blend: { physical: 0.45, boldness: 0.35, temperament: 0.2 },
    desc: 'A division at a time, players climb onto the back of a flatbed truck while it drives down the track, with a safety net along each side. On the horn they push, pull and shove each other toward the edge. Anybody who goes over the side into a net is out, and allies who team up still have to turn on each other at the end. The last one standing on the truck wins.' },
  { id: 'mud-brawl', name: 'Mud Brawl', physicality: 1.2, modes: ['solo'], played: true,
    blend: { physical: 0.45, endurance: 0.3, boldness: 0.25 },
    desc: 'Two at a time, players climb into the mud pit and wrestle for the flags in its corners, in a bracket drawn out of a hat. A bout is won by the first to bring two flags back to their own side of the pit. Losing a bout knocks you out of the bracket, and a player left over in a round gets a free pass to the next one. The last one standing in the bracket wins.' },
  { id: 'car-jump', name: 'Car Jump', physicality: 1.1, modes: ['solo'], played: true,
    blend: { boldness: 0.45, physical: 0.35, temperament: 0.2 },
    desc: 'Four old cars hang from cranes high over the water, one after another, with their doors open. Players start on the dock and jump from car to car, diving through the open doors, until they reach the last one. A missed jump drops you into the water and sends you swimming back to the dock to start again. The fastest man and the fastest woman to the last car win.' },
  { id: 'locked-in', name: 'Locked In', physicality: 1, modes: ['solo'], played: true,
    blend: { endurance: 0.35, temperament: 0.35, physical: 0.3 },
    desc: 'A long narrow cage tunnel lies half underwater in the shallows for each player, with a bell on a post at the far end. Players crawl and swim through the cage, holding their breath where the water reaches the top. Getting stuck, panicking or turning back costs time, and the tighter it gets the harder it is to stay calm. The first man and the first woman to ring their bell win.' },
  { id: 'the-box', name: 'The Box', physicality: 0.4, modes: ['solo'], played: true,
    blend: { temperament: 0.45, mental: 0.3, boldness: 0.25 },
    desc: 'Every player has a wooden crate with a hole in the front, and the crate is full of bugs, snakes and things nobody can see. They reach in blind and pull out puzzle pieces one at a time, then build the puzzle on the easel behind them. A bite or a scream that drops a piece costs time, and a puzzle built wrong has to be taken apart. The first man and the first woman to finish their puzzle win.' },
  { id: 'buried', name: 'Buried', physicality: 0.3, modes: ['pairs'], played: true,
    blend: { intuition: 0.4, social: 0.35, temperament: 0.25 },
    desc: 'One partner is buried in a coffin in the sand, and before going in they answer questions about the people in the house. The other partner stands at a buzzer over the coffin and has to guess how their partner answered, with everybody listening. A wrong guess scores nothing, and a buried partner who panics and knocks on the lid is out. The pair with the most right guesses wins, and everybody hears every answer.' },
  { id: 'food-wars', name: 'Food Wars', physicality: 0.3, modes: ['solo'], played: true,
    blend: { mental: 0.35, temperament: 0.35, intuition: 0.3 },
    desc: 'Everybody sits at the banquet table on the beach while TJ reads out quick questions. The first to buzz in with the right answer chooses somebody at the table to eat the next dish under the dome. Refusing the plate means leaving the table, and the dishes get worse every round. The last one still sitting at the table wins.' },
  { id: 'trapeze', name: 'Trapeze Duel', physicality: 1.1, modes: ['solo'], played: true,
    blend: { physical: 0.4, boldness: 0.35, endurance: 0.25 },
    desc: 'Two players at a time climb the ladders to the platforms on either side of the rig, high over the pond, in a bracket drawn out of a hat. On the horn they swing out on the trapezes, meet in the middle, and try to wrap their legs round the other and pull them off the bar. Falling into the pond loses the point, and anybody too scared to leave the platform forfeits the bout. The first to two points wins the bout, and the last one standing in the bracket wins.' },
  { id: 'poison-cup', name: 'Poison Cup', physicality: 0.3, modes: ['solo'], played: true,
    blend: { temperament: 0.45, endurance: 0.3, social: 0.25 },
    desc: 'Everybody sits at the banquet table, and one player is the server with a tray of cups. TJ shows the server which cup is spiked with something vile, and the server hands it to anybody at the table. Spitting it out or gagging puts that player out of the game; keeping the whole cup down makes them the next server. The last one still at the table wins.' },
);
for (const id of ['hang-on', 'cliff-relay', 'reef-dash', 'truck-tug', 'jungle-maze', 'night-swim', 'balance-beam', 'gauntlet-run', 'demolition']) { const d = DAILIES.find(x => x.id === id); if (d) d.played = true; }

// The played dailies (ch/daily/): each one runs as beats, and the result comes out of the beats.
const race = id => (state, rng, a) => playRace(state, rng, { ...a, id });
export const SIMS = { 'pole-truth': playPoleTruth, 'hang-on': playHangOn, 'lagoon-quiz': playInterrogation, demolition: playDemolition,
  ...Object.fromEntries(['cliff-relay', 'reef-dash', 'truck-tug', 'jungle-maze', 'night-swim', 'balance-beam', 'gauntlet-run'].map(id => [id, race(id)])),
  'raft-king': playRaftKing, 'cut-rope': playCutRope, 'double-cross': playDoubleCross, 'trust-fall': playTrustFall, 'who-said-it': playWhoSaidIt,
  'deep-freeze': playDeepFreeze, 'log-roll': playLogRoll, 'road-kill': playRoadKill, 'mud-brawl': playMudBrawl, buried: playBuried, 'food-wars': playFoodWars,
  trapeze: playTrapeze, 'poison-cup': playPoisonCup,
  'car-jump': race('car-jump'), 'locked-in': race('locked-in'), 'the-box': race('the-box') };

// A Pairs season plays every daily in pairs, except the two that crown one player alone by betraying their own
// partner (Double Cross's thief, Cut the Rope's last one hanging): there is no alone in a Pairs season.
export const PAIR_UNFIT = new Set(['double-cross', 'cut-rope']);

export function pickMode(state, rng) {
  if (pairsOn(state)) return 'pairs';
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
  if (pairsOn(state) && mode === 'pairs') {
    // the whole library, the ones built for pairs twice as likely (a solo daily is scored on the two partners' average)
    const fits = DAILIES.filter(d => !PAIR_UNFIT.has(d.id));
    const ok = fits.filter(d => !recent.includes(d.id));
    const pool = (ok.length ? ok : fits).flatMap(d => (d.modes.includes('pairs') ? [d, d] : [d]));
    return pool[Math.floor(rng() * pool.length)];
  }
  const ok = DAILIES.filter(d => d.modes.includes(mode) && !recent.includes(d.id));
  const pool = ok.length ? ok : DAILIES.filter(d => d.modes.includes(mode));
  return pool[Math.floor(rng() * pool.length)];
}

// Partners: drawn, or picked (the pick is a signal, and being picked last stings).
// How much a picker wants a partner: the bond they read, how strong they are (to a strategic picker), a little
// chance, and what they are to each other (a couple picks each other; old friends lean that way; exes do not).
function pickScore(state, rng, p, x) {
  return getPerceivedBond(p, x) * 0.6 + threatRead(state, x) * 0.4 * S(p, 'strategic') / 10 + noise(rng) * 0.4
    + (KIN_PULL[kinOf(state, p, x)] || 0) * 1.3;
}

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
        const scored = left.map(x => ({ x, s: pickScore(state, rng, p, x) })).sort((a, b) => b.s - a.s);
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
  } else if (drawn) {
    const a = shuffle(rng, state.active);
    for (let i = 0; i < a.length; i += 2) out.push(a.slice(i, i + 2));
    if (out.length > 1 && out[out.length - 1].length === 1) out[out.length - 2].push(out.pop()[0]);
  } else {
    // Picked, with no divisions: the most respected pick first, from whoever is still free (this used to be a
    // shuffle whether drawn or picked, so a couple was paired by chance even on a picking day)
    const left = [...state.active].sort((a, b) => (state.rec[b].respect - state.rec[a].respect) || (a < b ? -1 : 1));
    while (left.length >= 2) {
      const p = left.shift();
      const chosen = left.map(x => ({ x, s: pickScore(state, rng, p, x) })).sort((a, b) => b.s - a.s)[0].x;
      left.splice(left.indexOf(chosen), 1);
      out.push([p, chosen]);
      addBond(p, chosen, 0.6);
      remember(chosen, p, 'worked-with-me', 0.8, { picked: true });
    }
    if (left.length && out.length) out[out.length - 1].push(left[0]);
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
  // sinking a partner sinks yourself in a Pairs season: that motive is gone
  if (unit.length === 2 && partner && getBond(name, partner) < -3 && !pairsOn(state)) motive += (-getBond(name, partner) - 3) * 0.12;
  if (motive <= 0) return 0;
  return rng() < clamp(motive, 0, 0.6) ? clamp(0.3 + motive, 0.3, 0.8) : 0;
}

// Play the daily. Returns { id, name, mode, units, scores, winners, last, throws, injuries, reward }.
export function playDaily(state, rng, { division, pin = null, solo = false }) {
  // a daily pinned on the Season Timeline (ch-run.js challengeOptions -> options.dailyPins): played whatever the
  // draw, in the week's drawn shape when it has one, else its own first
  const pinned = pin && !(pairsOn(state) && PAIR_UNFIT.has(pin)) ? DAILIES.find(d => d.id === pin) : null;
  // solo: a Pairs season's combine, before anybody has a partner (Fresh Meat, Pick your partner)
  let mode = solo ? 'solo' : pickMode(state, rng);
  const seasonPairs = pairsOn(state) && mode === 'pairs';
  if (pinned && !pinned.modes.includes(mode) && !seasonPairs) mode = pinned.modes[0];
  const daily = pinned || (solo ? pickDaily(state, rng, 'solo') : pickDaily(state, rng, mode));
  // a Pairs season's own pairs (and anybody a partner left, alone); a daily that has no pairs version is played
  // by everybody on their own and scored on each pair's average
  const units = seasonPairs ? [...state.pairs.map(p => [p.a, p.b]), ...(state.lone || []).filter(n => state.active.includes(n)).map(n => [n])]
    : mode === 'pairs' ? makePairs(state, rng) : mode === 'teams' ? makeTeams(state, rng) : state.active.map(n => [n]);
  const playedSolo = seasonPairs && !daily.modes.includes('pairs');
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
  // a played daily runs as beats, from each player's power for the day, and its result replaces the score
  const power = { ...indiv };
  let beats = null, simWinners = null;
  if (SIMS[daily.id]) {
    const res = SIMS[daily.id](state, rng, playedSolo ? { units: units.flat().map(n => [n]), power, mode: 'solo' } : { units, power, mode });
    beats = res.beats;
    Object.assign(indiv, res.score);
    // a betrayal daily can name its own winners (a thief alone, a cutter alone); a Pairs season's winners are the
    // best pair, whoever the daily crowned on their own
    simWinners = playedSolo ? null : res.winners || null;
  }
  const unitScore = u => u.reduce((a, n) => a + indiv[n], 0) / u.length;
  const ranked = [...units].sort((a, b) => unitScore(b) - unitScore(a));
  let winners;
  if (simWinners) winners = seasonPairs ? [...new Set(simWinners.flatMap(w => units.find(u => u.includes(w)) || [w]))] : [...simWinners];
  else if (seasonPairs && shapeOf(state) === 'same' && division && division !== 'all') {
    // men's pairs and women's pairs: the week's division's best pair is the one that is safe
    winners = [...(ranked.find(u => u.every(n => state.division[n] === division)) || ranked[0])];
  } else if (mode === 'solo' && state.options.gendered) {
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
  addScene(state, 'daily', state.active, { daily: daily.id, dailyName: daily.name, mode, winners, last }, state.active, 'challenge');
  for (const n of state.active) nudge(state, n, 'energy', -1.2 * daily.physicality);
  // Throwing, and who catches it. A thrower who won anyway did not throw it: no record, nobody
  // catches it (season 777 aired "I saw Jacques stop and smell the flowers" about the day's winner).
  // The dice are still rolled, so the season after this is unchanged.
  const won = new Set(winners);
  const caught = [];
  for (const t of throws) {
    if (!won.has(t.name)) state.rec[t.name].throws++;
    for (const o of state.active) {
      if (o === t.name) continue;
      if (rng() < t.size * S(o, 'intuition') / 10 * 0.12) {
        if (!won.has(t.name)) {
          caught.push({ thrower: t.name, by: o });
          addBond(o, t.name, -1.2);
          remember(o, t.name, 'threw-it', 1.6);
        }
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
  for (const t of throws.filter(x => !won.has(x.name) && !caught.some(c => c.thrower === x.name))) {
    noteThrow(state, t.name);
    addScene(state, 'throw', [t.name], { daily: daily.id, size: t.size }, [t.name], 'private');
  }
  // Injuries in the physical ones.
  const injuries = state.active.filter(n => injuryRoll(state, rng, n, daily.physicality));
  for (const n of injuries) { state.rec[n].injuries++; nudge(state, n, 'energy', -2); nudge(state, n, 'morale', -1); }
  // Clutch and choke moments: the best and worst against expectation.
  const exp = n => blendScore(n, daily.blend);
  const vsExp = state.active.map(n => ({ n, d: power[n] - exp(n) })).sort((a, b) => b.d - a.d);
  const moments = [];
  if (vsExp[0]?.d > 1.2) moments.push({ kind: 'clutch', who: vsExp[0].n });
  const worst = vsExp[vsExp.length - 1];
  if (worst?.d < -1.5 && !throws.some(t => t.name === worst.n)) moments.push({ kind: 'choke', who: worst.n });
  for (const m of moments) addScene(state, `daily-${m.kind}`, [m.who], { daily: daily.id, physical: (daily.physicality || 0) >= 0.8 }, state.active, 'public');
  // The reward: sometimes a call home for the winners (spec §4.8).
  let reward = null;
  if (rng() < 0.3) {
    reward = { kind: 'call-home', to: [...winners] };
    for (const w of winners) { nudge(state, w, 'homesick', -3); nudge(state, w, 'morale', 1.2); }
    addScene(state, 'call-home', winners, {}, winners, 'private');
  }
  if (seasonPairs) logDaily(state, units, indiv, daily.name);
  const aftermath = mode === 'pairs' ? pairAftermath(state, rng, units, power, winners, ranked)
    : mode === 'teams' ? teamAftermath(state, rng, units, power, winners) : [];
  return { id: daily.id, name: daily.name, mode, units, winners, last,
    scores: Object.fromEntries(Object.entries(indiv).map(([k, v]) => [k, +v.toFixed(2)])),
    throws, caught, injuries, moments, reward, aftermath, beats };
}

// ── what a partner week leaves behind ────────────────────────────────
// A pair that lost blames, or holds together; a strong partner who carried a
// weak one is owed; a pair that clicked is a pair that talks about the vote.
function pairAftermath(state, rng, units, indiv, winners, ranked) {
  const out = [];
  const bottom = new Set(ranked.slice(Math.ceil(ranked.length / 2)).flat());
  for (const u of units) {
    if (u.length < 2) continue;
    const [a, b] = [...u].sort((x, y) => indiv[y] - indiv[x]);   // a did better
    const gap = indiv[a] - indiv[b];
    if (winners.includes(a)) continue;
    if (bottom.has(a) && gap > 1.2) {
      // "You cost us": said, or swallowed.
      const says = rng() < 0.3 + (10 - S(a, 'temperament')) * 0.05 - Math.max(0, getBond(a, b)) * 0.04;
      if (says) {
        addBond(a, b, -1); remember(b, a, 'blamed-me', 1.1);
        nudge(state, b, 'confidence', -0.5);
        out.push({ kind: 'partner-blame', a, b });
        addScene(state, 'partner-blame', [a, b], { gap: +gap.toFixed(2) }, state.active, 'public');
      }
    } else if (gap > 2 && !bottom.has(a)) {
      // Carried: the weaker one owes them.
      remember(b, a, 'carried-me', 1); addBond(a, b, 0.4);
      out.push({ kind: 'carried', a, b });
      addScene(state, 'partner-carried', [a, b], { gap: +gap.toFixed(2) }, [a, b], 'private');
    } else if (Math.abs(gap) < 0.8 && getBond(a, b) >= 0) {
      addBond(a, b, 0.5);
      out.push({ kind: 'clicked', a, b });
    }
  }
  return out;
}

// ── a team that lost looks for somebody to blame ─────────────────────
// Total Drama's losing-team scene, the Challenge's way: the weakest performer
// on the losing side takes it, and their friends on the team take their side.
function teamAftermath(state, rng, units, indiv, winners) {
  const losing = units.find(u => !u.some(n => winners.includes(n)));
  if (!losing || losing.length < 3) return [];
  const weakest = [...losing].sort((x, y) => indiv[x] - indiv[y])[0];
  const blamer = [...losing].filter(n => n !== weakest)
    .sort((x, y) => (S(y, 'boldness') - getBond(y, weakest)) - (S(x, 'boldness') - getBond(x, weakest)))[0];
  if (!blamer || rng() > 0.55) return [];
  addBond(blamer, weakest, -0.8); remember(weakest, blamer, 'blamed-me', 1);
  const defenders = losing.filter(n => n !== weakest && n !== blamer && getBond(n, weakest) >= 3);
  for (const d of defenders) { addBond(d, blamer, -0.4); remember(weakest, d, 'stood-up-for-me', 1); }
  addScene(state, 'team-blame', [blamer, weakest, ...defenders.slice(0, 2)], { defenders }, losing, 'villa');
  return [{ kind: 'team-blame', blamer, weakest, defenders }];
}

