// ══════════════════════════════════════════════════════════════════════
// bb-comps/handwork.js — Caged Eggs, Laser Maze, Water Rescue
// ══════════════════════════════════════════════════════════════════════
//
// Three competitions where the body has to be careful rather than strong, and
// again the rule is that they must fail differently from each other.
//
//   CAGED EGGS (wiki rules, confirmed) — eggs on the far side of a wire fence,
//   moved one at a time to a destination using fingers pushed through the mesh.
//   The failure is BREAKAGE: an egg you drop is gone, and the houseguest who
//   hurries loses the thing they were hurrying with.
//
//   LASER MAZE (wiki: "navigate through a series of lasers while guiding an
//   object to the finish") — the failure is a TOUCH. Not fatigue, not a drop: a
//   beam you clipped with something you were carrying, which sends you back.
//
//   WATER RESCUE (wiki: "rescue a set amount of coloured dummies from the water.
//   Once done, houseguests must complete their surfboard puzzle to win") — two
//   halves that reward opposite people. The strongest swimmer in the house can
//   arrive at the puzzle first and lose the competition sitting still.
import { pStats, pronouns } from '../players.js';
import { beat, clamp, makePicker, toResult, vb } from './_shared.js';

const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;
const clock = secs => {
  const s = Math.max(0, Math.round(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Fastest first, with the seconds riding in the decimals for the debug tab. */
function rankByTime(times) {
  const placements = Object.keys(times).sort((a, b) => times[a] - times[b]);
  const best = times[placements[0]] || 1;
  return placements.map((name, idx) => ({
    name,
    score: round2((placements.length - idx) * 10 + clamp(9.9 - (times[name] - best) / 12, 0, 9.9)),
    threw: false,
    base: round2(times[name]),
  }));
}

// ══════════════════════════════════════════════════════════════════════
// Caged Eggs
// ══════════════════════════════════════════════════════════════════════

const CE_GOOD = [
  (n, p) => `${n} works two fingers through the mesh, walks an egg along the rail and sets it down like it is made of something worse than eggshell.`,
  (n, p) => `${n} has found a grip that uses the fence instead of fighting it and is not hurrying about any of it.`,
  (n, p) => `${n} gets a fingertip under the egg and rolls it the last few inches rather than lifting it at all.`,
  (n, p) => `${n} does not look at the clock once, which is the only reason ${p.posAdj} hands are still steady.`,
];

const CE_BREAK = [
  (n, p) => `${n} rushes one and it goes through the wire in two pieces and a lot of yolk.`,
  (n, p) => `${n} gets an egg most of the way and then closes ${p.posAdj} fingers about a millimetre too far.`,
  (n, p) => `An egg goes down the fence, off ${n}'s knee, and onto the deck. ${p.Sub} ${vb(p, 'says', 'say')} nothing at all.`,
  (n, p) => `${n} has yolk to the wrist now and it is affecting everything ${p.sub} ${vb(p, 'touches', 'touch')}.`,
];

export const cagedEggs = {
  id: 'bb-hand-caged-eggs',
  name: 'Caged Eggs',
  category: 'precision',
  types: ['hoh', 'veto', 'tiebreaker'],
  variant: 'caged-eggs',
  weight: () => 1,
  desc: 'A row of raw eggs sits on a ledge on the far side of a wire fence, and each houseguest has to move all of them to a cradle at the other end of that ledge using nothing but the fingers they can push through the mesh. They cannot reach round the fence, they cannot use anything as a tool, and they can only move one egg at a time. Any egg that breaks is gone for good and has to be replaced from the start of the ledge, which costs far more time than moving it slowly would have. The first houseguest to land every egg in the cradle wins the power.',
  // One of the few places temperament genuinely IS the skill, which the library
  // names explicitly: a steady hand on a delicate thing, where somebody who
  // rushes breaks the egg. Mental was declared and never read; now it is.
  stats: { intuition: 0.35, temperament: 0.30, physical: 0.20, mental: 0.15 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const times = {};
    const EGGS = 6;

    for (const name of participants) {
      const p = pronouns(name);
      const hands = stat(name, 'intuition') * 0.35 + stat(name, 'temperament') * 0.30
        + stat(name, 'physical') * 0.20 + stat(name, 'mental') * 0.15;
      // FORM IS ROLLED ONCE FOR THE WHOLE RUN.
      //
      // The library learned this the hard way and it caught this competition
      // too: six independent per-egg rolls average out, the stat ladder decides
      // everything underneath them, and the guard measured three distinct
      // winners with the top one taking 35%. One roll for whether today is a
      // steady day, plus a small wobble per egg, and the same field produces
      // upsets without the best hands stopping being the best hands.
      const form = (rng() - 0.5) * 4.4;
      luck[name] = round2(form);
      let secs = 0;
      let broken = 0;
      for (let e = 0; e < EGGS; e++) {
        const wobble = (rng() - 0.5) * 1.6;
        // Hurrying is what breaks them. A houseguest with steady hands takes a
        // little longer per egg and loses far fewer of them.
        const broke = hands + form + wobble < 4.6;
        if (broke) { broken++; secs += 34 + rng() * 22; }
        else secs += 17 + rng() * 15;
      }
      times[name] = Math.round(secs);
      breakdown[name] = { seconds: times[name], broken, hands: round2(hands), score: round2(1000 - secs), threw: false };
      beats.push(beat(
        `${name} starts on the fence. `
        + (broken >= 2 ? say(CE_BREAK)(name, p) : say(CE_GOOD)(name, p))
        // "6 eggs gone, and all six in the cradle" is a sentence that argues
        // with itself. Broken eggs are replaced from the start of the ledge, so
        // a messy run still finishes — it just costs, and the line should say
        // that rather than reporting both halves as if they were the same fact.
        + ` ${broken
    ? `${broken} broken and replaced along the way, and the last one finally lands at ${clock(times[name])}.`
    : `Not one broken, and all ${EGGS} in the cradle at ${clock(times[name])}.`}`,
        [name], broken === 0 ? 'CLEAN RUN' : `${broken} BROKEN`, broken === 0 ? 'challenge' : 'grey'));
    }

    const entries = rankByTime(times);
    const winner = entries[0]?.name;
    if (winner) {
      beats.push(beat(
        `${winner} lands the last egg at ${clock(times[winner])}${breakdown[winner].broken === 0 ? ' without breaking a single one' : ''} and takes it.`,
        [winner], 'WINS IT', 'gold'));
      api.popDelta(winner, 1);
      api.record(winner, 'caged-eggs-win', { seconds: times[winner], broken: breakdown[winner].broken });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'caged-eggs',
      detail: { eggs: EGGS, runs: participants.map(n => ({ name: n, seconds: times[n], broken: breakdown[n].broken })) },
      text: winner ? `${winner} moves every egg through the fence in ${clock(times[winner])}.` : '',
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Laser Maze
// ══════════════════════════════════════════════════════════════════════

const LM_CLEAN = [
  (n, p) => `${n} goes under the low pair on ${p.posAdj} back with the case balanced on ${p.posAdj} chest, and does not touch a thing.`,
  (n, p) => `${n} reads the grid from outside it for a full ten seconds and then walks it like a corridor.`,
  (n, p) => `${n} threads the case through a gap that looks smaller than the case is.`,
  (n, p) => `${n} takes the slow line and gives away nothing to the beams.`,
];

const LM_HIT = [
  (n, p) => `${n} clips a beam with the corner of the case — not with ${p.obj}, with the thing ${p.sub} ${vb(p, 'is', 'are')} carrying — and the horn sends ${p.obj} back.`,
  (n, p) => `${n} gets almost all the way and stands up half a second early. The whole grid lights red.`,
  (n, p) => `${n} tries the fast line, breaks two beams on the way through, and has to start the section again.`,
  (n, p) => `${n} is watching the beams and stops watching ${p.posAdj} own elbow. The elbow does it.`,
];

export const laserMaze = {
  id: 'bb-hand-laser-maze',
  name: 'Laser Maze',
  category: 'precision',
  types: ['veto', 'tiebreaker'],
  variant: 'laser-maze',
  weight: () => 1,
  desc: 'The yard is strung with a grid of laser beams at every height from ankle to shoulder, and each houseguest has to carry a case from one end of it to the other and set it down on the plinth at the far side. They can go over, under or around any beam they like but they cannot touch one, and that applies to the case as much as to them — a corner clipped by the thing they are carrying trips the horn exactly as a knee would. Every beam broken sends them back to the start of that section with the clock still running. The fastest completed run wins the Power of Veto.',
  stats: { intuition: 0.32, temperament: 0.28, physical: 0.24, mental: 0.16 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const times = {};
    const SECTIONS = 4;

    for (const name of participants) {
      const p = pronouns(name);
      const care = stat(name, 'intuition') * 0.36 + stat(name, 'temperament') * 0.32
        + stat(name, 'physical') * 0.20 + stat(name, 'mental') * 0.12;
      // Same rule as the eggs: one roll for the run, a wobble per section.
      const form = (rng() - 0.5) * 4.0;
      luck[name] = round2(form);
      let secs = 0;
      let breaks = 0;
      for (let s = 0; s < SECTIONS; s++) {
        const wobble = (rng() - 0.5) * 1.8;
        const clean = care + form + wobble > 5.0;
        if (clean) secs += 20 + rng() * 13;
        else { breaks++; secs += 40 + rng() * 24; }
      }
      times[name] = Math.round(secs);
      breakdown[name] = { seconds: times[name], beamsBroken: breaks, care: round2(care), score: round2(1000 - secs), threw: false };
      beats.push(beat(
        `${name} steps into the grid. `
        + (breaks === 0 ? say(LM_CLEAN)(name, p) : say(LM_HIT)(name, p))
        + ` ${breaks ? `${breaks} beam${breaks === 1 ? '' : 's'} broken.` : 'Clean.'} Case down at ${clock(times[name])}.`,
        [name], breaks === 0 ? 'CLEAN' : `${breaks} BEAM${breaks === 1 ? '' : 'S'}`, breaks === 0 ? 'challenge' : 'grey'));
    }

    const entries = rankByTime(times);
    const winner = entries[0]?.name;
    if (winner) {
      beats.push(beat(
        `${winner} sets the case on the plinth at ${clock(times[winner])} and takes the veto out of a room full of light.`,
        [winner], 'VETO', 'gold'));
      api.popDelta(winner, 1);
      api.record(winner, 'laser-maze-win', { seconds: times[winner] });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'laser-maze',
      detail: { sections: SECTIONS, runs: participants.map(n => ({ name: n, seconds: times[n], beamsBroken: breakdown[n].beamsBroken })) },
      text: winner ? `${winner} carries the case through the grid in ${clock(times[winner])}.` : '',
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Water Rescue
// ══════════════════════════════════════════════════════════════════════

const WR_SWIM = [
  (n, p) => `${n} goes in flat and fast and has the first two dummies on the deck before most people are wet.`,
  (n, p) => `${n} swims one at a time and refuses to be talked into carrying two.`,
  (n, p) => `${n} tries to carry three, loses one halfway back, and goes again for it.`,
  (n, p) => `${n} is not a swimmer and is doing this on pure willingness, which is slower and much better to watch.`,
];

const WR_PUZZLE = [
  (n, p) => `${n} has the board done almost before sitting down — the whole thing was a swimming competition for ${p.obj}.`,
  (n, p) => `${n} arrives at the puzzle first and is still sitting there when two other people finish theirs.`,
  (n, p) => `${n} builds it from the edges in, calmly, dripping all over it.`,
  (n, p) => `${n} gets the last two pieces the wrong way round three separate times.`,
];

export const waterRescue = {
  id: 'bb-hand-water-rescue',
  name: 'Water Rescue',
  category: 'physical',
  types: ['hoh', 'veto', 'tiebreaker'],
  variant: 'water-rescue',
  weight: () => 1,
  desc: 'Six weighted dummies in team colours are floating at the far end of the pool, and every houseguest has to swim out and bring all of their own colour back to the deck one or two at a time before they are allowed to touch the second half. Waiting on the deck is a surfboard cut into puzzle pieces, and the competition is not over until that board is assembled face up with every piece flush. A dummy dropped on the way back has to be gone after again, and the puzzle cannot be started early. The first houseguest with all their dummies out of the water and a finished board wins the power.',
  stats: { physical: 0.34, endurance: 0.24, mental: 0.26, intuition: 0.16 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const puzzles = makePicker(rng);
    const beats = [];
    const breakdown = {};
    const times = {};

    for (const name of participants) {
      const p = pronouns(name);
      const swim = stat(name, 'physical') * 0.55 + stat(name, 'endurance') * 0.45;
      const solve = stat(name, 'mental') * 0.6 + stat(name, 'intuition') * 0.4;
      const sr = (rng() - 0.5) * 3.2;
      const pr = (rng() - 0.5) * 3.6;
      luck[name] = round2(sr + pr);
      const swimSecs = Math.max(24, 96 - swim * 5.4 + sr * 6);
      const puzzleSecs = Math.max(20, 104 - solve * 6.2 + pr * 7);
      times[name] = Math.round(swimSecs + puzzleSecs);
      breakdown[name] = {
        seconds: times[name], swimSeconds: Math.round(swimSecs), puzzleSeconds: Math.round(puzzleSecs),
        score: round2(1000 - times[name]), threw: false,
      };
    }

    // Who led out of the water, so the screen and the text can both say that
    // the fastest swimmer did not necessarily win — the whole point of a
    // two-part competition.
    const outFirst = [...participants].sort((a, b) => breakdown[a].swimSeconds - breakdown[b].swimSeconds)[0];
    for (const name of participants) {
      const p = pronouns(name);
      beats.push(beat(
        `${say(WR_SWIM)(name, p)} Out of the water at ${clock(breakdown[name].swimSeconds)}. `
        + `${puzzles(WR_PUZZLE)(name, p)} Board finished at ${clock(times[name])}.`,
        [name], name === outFirst ? 'FIRST OUT OF THE WATER' : 'RUN COMPLETE',
        name === outFirst ? 'challenge' : 'grey'));
    }

    const entries = rankByTime(times);
    const winner = entries[0]?.name;
    if (winner) {
      const stolen = outFirst !== winner;
      beats.push(beat(
        stolen
          ? `${winner} was not first out of the water — ${outFirst} was, by ${Math.round(breakdown[winner].swimSeconds - breakdown[outFirst].swimSeconds)} seconds — and it did not matter, because the board was where this was decided.`
          : `${winner} led it out of the water and never gave it back.`,
        [winner, outFirst], 'WINS IT', 'gold'));
      api.popDelta(winner, 2);
      api.record(winner, 'water-rescue-win', { seconds: times[winner], ledSwim: !stolen });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'water-rescue',
      detail: {
        outFirst,
        runs: participants.map(n => ({ name: n, swim: breakdown[n].swimSeconds, puzzle: breakdown[n].puzzleSeconds, total: times[n] })),
      },
      text: winner ? `${winner} finishes the board at ${clock(times[winner])} and wins.` : '',
    });
  },
};

export const HANDWORK_COMPS = [cagedEggs, laserMaze, waterRescue];
export default HANDWORK_COMPS;
