// ══════════════════════════════════════════════════════════════════════
// bb-comps/arena.js — Block Buster games, and only Block Buster games
// ══════════════════════════════════════════════════════════════════════
//
// The arena had no games of its own: it borrowed whatever multi-type
// competition the picker handed it, so a last-chance fight for survival read
// exactly like a Tuesday veto. These seven are arena-exclusive and written
// for what the arena IS — three nominated houseguests, the whole house at
// the glass, a vote already on the schedule, and no version of losing that
// does not end in a chair.
//
// Mid-depth on purpose. A Block Buster game is ninety seconds of television,
// not a Total Drama twist engine: each one carries a distinct mechanic, a
// distinct stat mix, four to six beats that know the stakes, and a personal
// moment when the field's relationships supply one. Nothing here runs
// phases, maps or sidebars — the pressure IS the identity.
import { pronouns } from '../players.js';
import { scoreField, toResult, beat, margin } from './_shared.js';
import { dislikes, bond } from '../bb-events/_read.js';

const say = (rng, lines) => lines[Math.floor(rng() * lines.length)];

/** The last-place fall, told with the clock in the room. */
const FALL_LINES = [
  (n, p) => `The horn goes for ${n} first. ${p.Sub} stares at the board a half-second longer than dignity strictly allows.`,
  (n, p) => `${n} is out of it. From the glass the house is perfectly silent, which everybody understands is not neutrality.`,
  (n, p) => `${n} runs out of arena before ${p.sub} runs out of fight, which is somehow worse.`,
  (n, p) => `${n} steps back from the station slowly. The vote just got simpler for everybody except ${p.obj}.`,
];

const NEAR_MISS = [
  (a, b) => `${a} and ${b} finish so close the arena has to check its own numbers. Only one buzzer sounds.`,
  (a, b) => `For one second the board has ${b} ahead — then it corrects, and ${a} is the name in lights. ${b} watched it change.`,
  (a, b) => `${a} beats ${b} by less than the time it takes to say so.`,
  (a, b) => `${b} looks away before the last score posts. ${a} does not, and that is the whole difference in how the next minute goes.`,
];

function arenaFinish(entries, api, rng, beats) {
  const winner = entries[0];
  const runnerUp = entries[1];
  const m = margin(entries);
  if (runnerUp && m.word === 'photo finish') {
    beats.push(beat(say(rng, NEAR_MISS)(winner.name, runnerUp.name),
      [winner.name, runnerUp.name], 'BY NOTHING', 'gold'));
  }
  beats.push(beat(
    `${winner.name} hits the buzzer, and the block is one name shorter. Nobody saved ${pronouns(winner.name).obj} — ${pronouns(winner.name).sub} did it.`,
    [winner.name], 'OFF THE BLOCK', 'gold'));
  api.popDelta(winner.name, 2);
  api.record(winner.name, 'arena-save', { margin: m.word });
}

function arenaFalls(order, rng, beats) {
  order.slice(0, Math.max(1, order.length - 1)).forEach(e => {
    beats.push(beat(say(rng, FALL_LINES)(e.name, pronouns(e.name)), [e.name], 'STAYS NOMINATED', 'red'));
  });
}

/** A grudge in the arena is a grudge with an audience. */
function arenaGrudge(entries, api, beats) {
  const [a, b] = entries;
  if (b && dislikes(a.name, b.name)) {
    beats.push(beat(
      `${a.name} and ${b.name} spend the whole game one station apart, not looking at each other with tremendous effort. One of them is about to be much easier to evict, and both of them are thinking it.`,
      [a.name, b.name], 'OLD BUSINESS', 'red'));
    api.suspicion(b.name, a.name, 0.4);
  }
}

// ── the games ─────────────────────────────────────────────────────────

const flashWall = {
  id: 'bb-arena-flash-wall',
  name: 'Flash Wall',
  category: 'mental',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'A wall of tiles flashes a symbol sequence once. Nominees punch it back from memory; every correct run extends the sequence by one. First to fumble twice is out.',
  stats: { mental: 0.4, intuition: 0.28, temperament: 0.2, boldness: 0.12 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 2.8, context, rng });
    const beats = [];
    beats.push(beat(
      `The wall lights once — seven symbols, one look — and goes dark. Three nominees, three keypads, and a house at the glass mouthing sequences it will not have to answer for.`,
      participants.slice(0, 3), 'ONE LOOK'));
    const shakiest = [...entries].sort((x, y) => x.score - y.score)[0];
    beats.push(beat(
      `${shakiest.name}'s hand hovers over the fourth tile a beat too long. In here, hesitation is information, and everybody watching just received it.`,
      [shakiest.name], 'THE HOVER', 'grey'));
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const houseOfCards = {
  id: 'bb-arena-house-of-cards',
  name: 'Steady Hands',
  category: 'physical',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'Each nominee stacks oversized card pieces into a tower on a table that tilts every time the arena horn blares. Tallest standing tower when the clock dies wins.',
  stats: { temperament: 0.36, physical: 0.24, endurance: 0.22, intuition: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.4, context, rng });
    const beats = [];
    beats.push(beat(
      `Three tables, three decks of cards the size of doors, and a horn that exists purely to ruin towers. The steadiest person in the arena is about to be the safest person in the house.`,
      participants.slice(0, 3), 'THE TABLES'));
    const collapse = [...entries].reverse()[0];
    beats.push(beat(
      `The horn blares and ${collapse.name}'s tower goes down to the felt — all of it, at once, with the whole house watching the exact moment ${pronouns(collapse.name).posAdj} night got harder.`,
      [collapse.name], 'COLLAPSE', 'red'));
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const vertigo = {
  id: 'bb-arena-vertigo',
  name: 'Vertigo',
  category: 'physical',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'A ball, a tilting maze the size of a bed, and one hole that saves you. Nominees steer by shifting their whole body weight. Drop the ball anywhere else and you restart.',
  stats: { physical: 0.3, intuition: 0.28, boldness: 0.24, temperament: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.6, context, rng });
    const beats = [];
    beats.push(beat(
      `The mazes tilt with the nominees strapped to them, which means steering is done with your own bodyweight and your own nerve. The house lines the glass like it is watching surgery.`,
      participants.slice(0, 3), 'TILT'));
    const bold = [...entries].sort((x, y) => x.score - y.score)[Math.floor(entries.length / 2)];
    beats.push(beat(
      `${bold.name} takes the shortcut lane — the one with the two extra holes — because a careful route is a slow route and slow is just losing politely.`,
      [bold.name], 'THE SHORTCUT', 'gold'));
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const lockout = {
  id: 'bb-arena-lockout',
  name: 'Lockout',
  category: 'mental',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'A locked door, a four-digit code, and the clues scattered around the arena in plain sight — dates, counts, and numbers from the season itself. First nominee through the door stays.',
  stats: { mental: 0.34, strategic: 0.28, intuition: 0.24, endurance: 0.14 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3, context, rng });
    const beats = [];
    beats.push(beat(
      `The code is the season: how many votes evicted the first houseguest, what week the veto was first used, how many sit on the block right now. The arena is a memory test disguised as a door.`,
      participants.slice(0, 3), 'THE DOOR'));
    const wrong = [...entries].reverse()[0];
    beats.push(beat(
      `${wrong.name} punches a code with total confidence and the door does not care. The season apparently happened differently than ${pronouns(wrong.name).sub} remembers it — which, tonight, is expensive.`,
      [wrong.name], 'WRONG CODE', 'red'));
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const lastShot = {
  id: 'bb-arena-last-shot',
  name: 'Last Shot',
  category: 'physical',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'Ten targets, a slingshot, and a rack of exactly twelve balls each. Nobody gets more ammunition, and the arena does not restock nerve either. Most targets down when the rack is empty wins.',
  stats: { physical: 0.32, boldness: 0.26, temperament: 0.24, intuition: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.2, context, rng });
    const beats = [];
    beats.push(beat(
      `Twelve balls, ten targets, no restock. The arena has done the arithmetic out loud so nobody has to: you are allowed two mistakes tonight, and one of them is being here.`,
      participants.slice(0, 3), 'TWELVE BALLS'));
    const spender = [...entries].reverse()[0];
    beats.push(beat(
      `${spender.name} burns four shots on the same stubborn target and the rack starts looking very finite. The glass has gone quiet in that specific way.`,
      [spender.name], 'RUNNING DRY', 'red'));
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const unravel = {
  id: 'bb-arena-unravel',
  name: 'Unravel',
  category: 'endurance',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'Fifty feet of rope knotted through a climbing frame, with a key woven into the far end. Untangle, unthread, unlock. The rope does not fight fair and neither does the clock.',
  stats: { endurance: 0.32, temperament: 0.28, intuition: 0.22, physical: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3, context, rng });
    const beats = [];
    beats.push(beat(
      `Fifty feet of rope each, knotted by somebody who was paid to be cruel. The fastest way through is patience, and patience is the one thing a nominee on vote night has the least of.`,
      participants.slice(0, 3), 'THE KNOTS'));
    const tangled = [...entries].reverse()[0];
    beats.push(beat(
      `${tangled.name} pulls the wrong strand and watches thirty seconds of work re-knot itself. The sound ${pronouns(tangled.name).sub} makes is not a word, quite.`,
      [tangled.name], 'RE-KNOTTED', 'red'));
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

const blackout = {
  id: 'bb-arena-blackout',
  name: 'Blackout',
  category: 'mental',
  types: ['arena'],
  // Arena-exclusive games headline the arena; the borrowed multi-type
  // comps are the safety net, not the show.
  weight: () => 4,
  desc: 'Nominees study the arena floor for thirty seconds — then the lights go out and they cross it blind, by memory, buzzer to buzzer. Every obstacle touched adds five seconds.',
  stats: { intuition: 0.34, mental: 0.28, endurance: 0.2, boldness: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.4, context, rng });
    const beats = [];
    beats.push(beat(
      `Thirty seconds of light, then none. The arena becomes a memory of an arena, and three people cross it with their hands out in front of them while the house watches on night vision.`,
      participants.slice(0, 3), 'LIGHTS OUT'));
    const lost = [...entries].reverse()[0];
    beats.push(beat(
      `${lost.name} drifts two full steps off the remembered line and finds the foam pillar the hard way. The penalty horn, in the dark, sounds exactly like a verdict.`,
      [lost.name], 'OFF COURSE', 'red'));
    // Somebody always cheats toward a friend's voice — the house at the
    // glass is supposed to be silent, and never entirely is.
    const guided = entries[0];
    const friend = participants.find(n => n !== guided.name && bond(guided.name, n) >= 4) || null;
    if (friend) {
      beats.push(beat(
        `Somebody at the glass coughs — twice, pointedly — just as ${guided.name} drifts off line, and ${guided.name} corrects. The producers will review the tape. ${friend} will be studying the ceiling when they do.`,
        [guided.name, friend], 'THE COUGH', 'gold'));
      api.addBond(guided.name, friend, 0.5);
    }
    arenaFalls([...entries].reverse(), rng, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown });
  },
};

export const ARENA_COMPETITIONS = [
  flashWall, houseOfCards, vertigo, lockout, lastShot, unravel, blackout,
];
