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
  (n, p) => `${n} reaches two fingers through the mesh and carefully rolls an egg along the ledge into the cradle.`,
  (n, p) => `${n} braces one finger against the fence and uses the other to guide the egg without squeezing it.`,
  (n, p) => `${n} gets a fingertip under the egg and rolls it the last few inches rather than lifting it at all.`,
  (n, p) => `${n} ignores the clock and keeps the same slow pace from one egg to the next.`,
];

const CE_BREAK = [
  (n, p) => `${n} pushes too quickly and cracks an egg against the wire.`,
  (n, p) => `${n} gets an egg halfway across, squeezes too hard, and has to start again with a replacement.`,
  (n, p) => `An egg slips from ${n}'s fingers, bounces off the fence, and breaks on the deck.`,
  (n, p) => `${n} breaks one egg and has to wipe ${p.posAdj} hand before touching the replacement.`,
];

export const cagedEggs = {
  id: 'bb-hand-caged-eggs',
  name: 'Caged Eggs',
  category: 'precision',
  types: ['hoh', 'veto', 'tiebreaker'],
  variant: 'caged-eggs',
  weight: () => 1,
  desc: 'Houseguests move six raw eggs along a ledge behind a wire fence using only their fingers through the mesh. They may move one egg at a time, and every broken egg must be replaced at the starting end. The first person to place all six eggs in the cradle wins.',
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
    ? `${broken} broken and replaced. The final egg reaches the cradle at ${clock(times[name])}.`
    : `All ${EGGS} reach the cradle unbroken in ${clock(times[name])}.`}`,
        [name], broken === 0 ? 'CLEAN RUN' : `${broken} BROKEN`, broken === 0 ? 'challenge' : 'grey'));
    }

    const entries = rankByTime(times);
    const winner = entries[0]?.name;
    if (winner) {
      beats.push(beat(
        `${winner} places the sixth egg in the cradle at ${clock(times[winner])}${breakdown[winner].broken === 0 ? ' without breaking one' : ''} and wins.`,
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
  (n, p) => `${n} lies back beneath the lowest beams and balances the case against ${p.posAdj} chest.`,
  (n, p) => `${n} studies the grid before entering and follows the widest route through it.`,
  (n, p) => `${n} turns the case sideways and guides it cleanly through a narrow gap.`,
  (n, p) => `${n} moves slowly through the section without touching a beam.`,
];

const LM_HIT = [
  (n, p) => `${n} clears the beam but clips it with the corner of the case. The horn sends ${p.obj} back to the section start.`,
  (n, p) => `${n} stands up before clearing the final beam and triggers the alarm.`,
  (n, p) => `${n} tries the fast line, breaks two beams on the way through, and has to start the section again.`,
  (n, p) => `${n} watches the case and catches a beam with ${p.posAdj} elbow.`,
];

export const laserMaze = {
  id: 'bb-hand-laser-maze',
  name: 'Laser Maze',
  category: 'precision',
  types: ['veto', 'tiebreaker'],
  variant: 'laser-maze',
  weight: () => 1,
  desc: 'Houseguests carry a case through four sections of laser beams and place it on a plinth at the finish. Touching a beam with either their body or the case sends them back to the start of that section while the clock continues. The fastest completed run wins.',
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
        `${winner} places the case on the final plinth in ${clock(times[winner])} and wins the veto.`,
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
  (n, p) => `${n} dives in quickly and brings the first two dummies back on consecutive trips.`,
  (n, p) => `${n} carries one dummy at a time and keeps a steady pace across the pool.`,
  (n, p) => `${n} tries to carry three, loses one halfway back, and goes again for it.`,
  (n, p) => `${n} struggles through each return trip but keeps every dummy above water.`,
];

const WR_PUZZLE = [
  (n, p) => `${n} sorts the edge pieces first and assembles the surfboard quickly.`,
  (n, p) => `${n} reaches the puzzle early but loses time rotating the centre pieces.`,
  (n, p) => `${n} builds the outside edge first, then fills in the middle.`,
  (n, p) => `${n} swaps the final two pieces twice before they fit.`,
];

export const waterRescue = {
  id: 'bb-hand-water-rescue',
  name: 'Water Rescue',
  category: 'physical',
  types: ['hoh', 'veto', 'tiebreaker'],
  variant: 'water-rescue',
  weight: () => 1,
  desc: 'Houseguests retrieve six coloured dummies from the pool, then assemble a surfboard puzzle on the deck. A dropped dummy must be recovered before they can begin the puzzle. The first person to complete both stages wins.',
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
          ? `${outFirst} leaves the pool ${Math.round(breakdown[winner].swimSeconds - breakdown[outFirst].swimSeconds)} seconds before ${winner}, but ${winner} makes up the time on the puzzle and finishes first.`
          : `${winner} leaves the pool first and keeps the lead through the puzzle.`,
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
