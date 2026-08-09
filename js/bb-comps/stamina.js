// ══════════════════════════════════════════════════════════════════════
// bb-comps/stamina.js — Dizzy Discs, Log Roll, What's The Hold Up
// ══════════════════════════════════════════════════════════════════════
//
// Three competitions about staying where you are, and the point of building
// them together is that they must NOT feel the same. The library already had
// two hold-on-to-something comps; a third and fourth that also resolve into
// "highest endurance wins" would be four names for one competition.
//
// So each one is lost differently:
//
//   DIZZY DISCS (wiki: "hold on to a rope while spinned and bashed by an arm to
//   be the last standing") — you are actively being knocked off. Violence from
//   outside, every round, and the spinning means nerve decides as much as arms.
//
//   LOG ROLL (wiki: "stay on a log while it is rolling for as long as possible
//   while holding onto a string attached to an object. If the object falls or
//   the houseguest falls…") — TWO ways to go out, and they pull against each
//   other: watching your feet drops the string, watching the string loses the
//   log. Nobody else in the library can be eliminated by a mistake of attention.
//
//   WHAT'S THE HOLD UP (wiki: "by using a long flexible structure, hold up a
//   plaque against an object") — nothing happens TO you at all. It is quiet,
//   static and entirely about the arms, and the flexible pole means the smallest
//   tremor is amplified at the far end. The stillest houseguest wins.
import { pStats, pronouns } from '../players.js';
import { beat, clamp, makePicker, toResult, vb } from './_shared.js';

const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;

/**
 * Nerve widens the spread, it does not set the level.
 *
 * The library's documented rule: low temperament means volatile, not weak. A
 * hothead can hang on out of pure spite or drop in the first minute, and both
 * are in character.
 */
function nerve(name, rng, spread) {
  const steady = stat(name, 'temperament');
  const width = spread * (0.55 + (10 - steady) * 0.09);
  return (rng() - 0.5) * width * 2 + (width - spread) * 0.5;
}

/** Time on the clock, said the way a competition clock says it. */
const clock = mins => {
  const m = Math.floor(mins);
  const s = Math.round((mins - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** Order-of-elimination scoring: last out ranks first, with a tiebreak riding low. */
function rankByExit(order, tiebreaks = {}) {
  const placements = [...order].reverse();
  return placements.map((name, idx) => ({
    name,
    score: round2((placements.length - idx) * 10 + clamp(Number(tiebreaks[name]) || 0, 0, 9.9)),
    threw: false,
    base: round2(Number(tiebreaks[name]) || 0),
  }));
}

// ══════════════════════════════════════════════════════════════════════
// Dizzy Discs
// ══════════════════════════════════════════════════════════════════════

const DD_SWEEPS = [
  'The padded arm sweeps across the discs at shoulder height.',
  'The discs speed up, then the arm completes another pass.',
  'The arm drops lower on the next rotation, forcing everyone to adjust.',
  'After a longer pause, the arm makes two quick passes.',
  'The arm speeds up again and hits with more force than the previous round.',
];

const DD_HOLD = [
  (n, p) => `${n} takes the hit across the waist, swings around the rope, and regains ${p.posAdj} footing.`,
  (n, p) => `${n} slides both hands above the knot and pulls closer to the rope.`,
  (n, p) => `${n} turns with the impact instead of bracing against it and stays on the disc.`,
  (n, p) => `${n} spins through the hit, stumbles once, and recovers before the next pass.`,
];

const DD_OUT = [
  (n, p) => `${n} takes the arm squarely at the waist and is knocked sideways off the disc.`,
  (n, p) => `${n} loses ${p.posAdj} grip as the disc accelerates and slides off before the arm arrives.`,
  (n, p) => `${n} survives the hit but cannot recover ${p.posAdj} grip before dropping from the rope.`,
  (n, p) => `${n} steps off the disc while trying to regain balance and is eliminated.`,
];

export const dizzyDiscs = {
  id: 'bb-stamina-dizzy-discs',
  name: 'Dizzy Discs',
  category: 'endurance',
  types: ['hoh', 'veto', 'tiebreaker', 'return'],
  variant: 'dizzy-discs',
  weight: () => 1,
  desc: 'Each houseguest stands on a rotating disc while holding a rope overhead. A padded arm repeatedly sweeps across the course, changing speed and height as the competition continues. Letting go of the rope or stepping off the disc causes elimination; the last player remaining wins.',
  // Temperament is the spread, not a weight — see `nerve()`. Declaring it at
  // 0.22 told the screen that calm houseguests are better at being knocked off
  // a spinning disc, which is neither what the code does nor true.
  stats: { endurance: 0.55, physical: 0.30, boldness: 0.15 },
  spreadStat: 'temperament',
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const sweeps = makePicker(rng);
    const beats = [];
    const breakdown = {};
    participants.forEach(n => { luck[n] = 0; });

    let field = participants.map(name => ({
      name,
      grip: stat(name, 'endurance') * 0.55 + stat(name, 'physical') * 0.30 + stat(name, 'boldness') * 0.15,
      fatigue: 0,
    }));
    const out = [];
    const tiebreaks = {};
    let round = 0;

    beats.push(beat(
      `${participants.length} houseguests take their discs and grip the overhead ropes. The padded arm begins its first rotation.`,
      participants.slice(0, 4), 'THE DISCS START', 'challenge'));

    while (field.length > 1 && round < 14) {
      round++;
      const rolls = field.map(f => {
        f.fatigue += 0.34 + rng() * 0.26;
        const swing = nerve(f.name, rng, 2.4);
        luck[f.name] = round2((luck[f.name] || 0) + swing);
        return { ...f, hold: f.grip + swing - f.fatigue };
      });
      rolls.sort((a, b) => a.hold - b.hold);

      const weakest = rolls[0];
      const falls = weakest.hold < 1.1 + round * 0.26;
      const p = pronouns(weakest.name);
      if (falls) {
        beats.push(beat(
          `${sweeps(DD_SWEEPS)} ${say(DD_OUT)(weakest.name, p)}`,
          [weakest.name],
          field.length === 2 ? 'RUNNER-UP' : `OUT · ROUND ${round}`,
          field.length === 2 ? 'red' : 'grey'));
        tiebreaks[weakest.name] = clamp(round / 2, 0, 9.9);
        breakdown[weakest.name] = {
          rounds: round, minutes: round2(round * 1.5), grip: round2(weakest.grip),
          fatigue: round2(weakest.fatigue), score: round2(round), threw: false,
        };
        out.push(weakest.name);
        field = rolls.slice(1).map(({ name, grip, fatigue }) => ({ name, grip, fatigue }));
      } else {
        beats.push(beat(`${sweeps(DD_SWEEPS)} ${say(DD_HOLD)(weakest.name, p)}`,
          [weakest.name], `ROUND ${round}`, 'challenge'));
        field = rolls.map(({ name, grip, fatigue }) => ({ name, grip, fatigue }));
      }
    }

    field.forEach((f, i) => {
      tiebreaks[f.name] = 9.5 - i;
      breakdown[f.name] ||= { rounds: round, minutes: round2(round * 1.5), score: round2(round), threw: false };
    });
    const order = [...out, ...field.map(f => f.name)];
    const entries = rankByExit(order, tiebreaks);
    const winner = entries[0]?.name;
    if (winner) {
      const wp = pronouns(winner);
      beats.push(beat(
        `${winner} survives the final sweep and remains alone on a disc after ${clock(round * 1.5)}.`,
        [winner], 'WINS IT', 'gold'));
      api.popDelta(winner, 2);
      api.record(winner, 'dizzy-discs-win', { rounds: round });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'dizzy-discs',
      detail: { rounds: round, order },
      text: winner ? `${winner} outlasts the arm and wins after ${clock(round * 1.5)}.` : '',
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Log Roll
// ══════════════════════════════════════════════════════════════════════

const LR_FALL = [
  (n, p) => `${n}'s right foot slips behind the turning log, and ${n} falls into the water.`,
  (n, p) => `${n} overcorrects, takes several quick steps backward, and falls off the end of the log.`,
  (n, p) => `${n} misses one step as the log accelerates and drops into the pool.`,
];

const LR_DROP = [
  (n, p) => `${n} watches ${p.posAdj} feet for one second too long and the weight on the end of the string touches down.`,
  (n, p) => `${n} stays on the log, but the hanging weight taps the platform and ends ${p.posAdj} run.`,
  (n, p) => `${n} grabs for balance with the string hand, lowering the weight onto the platform.`,
];

export const logRoll = {
  id: 'bb-stamina-log-roll',
  name: 'Log Roll',
  category: 'endurance',
  types: ['hoh', 'tiebreaker'],
  variant: 'log-roll',
  weight: () => 1,
  desc: 'Houseguests balance on rotating logs while holding strings attached to hanging weights. They are eliminated if they fall into the water or allow their weight to touch the platform. The logs gradually accelerate, and the last player remaining wins Head of Household.',
  stats: { endurance: 0.34, temperament: 0.28, physical: 0.22, intuition: 0.16 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const beats = [];
    const breakdown = {};
    participants.forEach(n => { luck[n] = 0; });

    beats.push(beat(
      'The logs begin turning. Each houseguest must stay upright while keeping the weight on their string above the platform.',
      participants.slice(0, 4), 'THE LOGS TURN', 'challenge'));

    // Two clocks per houseguest — one for the feet, one for the hand — and the
    // competition ends for them at whichever runs out first. That is the rule,
    // and it is why this is not another wall.
    const survived = {};
    const cause = {};
    for (const name of participants) {
      const feet = stat(name, 'endurance') * 0.45 + stat(name, 'physical') * 0.35 + stat(name, 'temperament') * 0.20;
      const hand = stat(name, 'temperament') * 0.45 + stat(name, 'intuition') * 0.35 + stat(name, 'endurance') * 0.20;
      const fw = nerve(name, rng, 2.2);
      const hw = nerve(name, rng, 2.2);
      luck[name] = round2(fw + hw);
      const feetMin = Math.max(0.4, (feet + fw) * 1.35);
      const handMin = Math.max(0.4, (hand + hw) * 1.35);
      survived[name] = Math.min(feetMin, handMin);
      cause[name] = feetMin <= handMin ? 'fell' : 'dropped';
      breakdown[name] = {
        minutes: round2(survived[name]), endedBy: cause[name],
        feetClock: round2(feetMin), stringClock: round2(handMin),
        score: round2(survived[name]), threw: false,
      };
    }

    const order = [...participants].sort((a, b) => survived[a] - survived[b]);
    order.forEach((name, i) => {
      if (i === order.length - 1) return;   // the winner gets the closing beat
      const p = pronouns(name);
      beats.push(beat(
        `${clock(survived[name])} — ${say(cause[name] === 'fell' ? LR_FALL : LR_DROP)(name, p)}`,
        [name], cause[name] === 'fell' ? 'OFF THE LOG' : 'STRING DOWN',
        i === order.length - 2 ? 'red' : 'grey'));
    });

    const entries = rankByExit(order, Object.fromEntries(participants.map(n => [n, clamp(survived[n] / 2, 0, 9.9)])));
    const winner = entries[0]?.name;
    if (winner) {
      const wp = pronouns(winner);
      const fellCount = participants.filter(n => cause[n] === 'fell').length;
      beats.push(beat(
        `${winner} remains on the log at ${clock(survived[winner])} with the hanging weight still clear. `
        + `${fellCount} houseguest${fellCount === 1 ? '' : 's'} fell into the water; ${participants.length - fellCount - 1} let the weight touch down.`,
        [winner], 'WINS IT', 'gold'));
      api.popDelta(winner, 2);
      api.record(winner, 'log-roll-win', { minutes: round2(survived[winner]) });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'log-roll',
      detail: { runs: participants.map(n => ({ name: n, minutes: round2(survived[n]), endedBy: cause[n] })) },
      text: winner ? `${winner} stays on the log for ${clock(survived[winner])} and wins Head of Household.` : '',
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
// What's The Hold Up
// ══════════════════════════════════════════════════════════════════════

const HU_QUIET = [
  (n, p) => `${n} locks the pole at a stable angle and keeps ${p.posAdj} hands still.`,
  (n, p) => `${n} matches each breath to a small adjustment in ${p.posAdj} grip.`,
  (n, p) => `${n} shifts ${p.posAdj} lower hand slightly and steadies the plaque before it slips.`,
  (n, p) => `${n} keeps ${p.posAdj} eyes on the plaque and ignores the conversation around ${p.obj}.`,
];

const HU_GO = [
  (n, p) => `The tip of ${n}'s pole begins to shake, and the plaque pulls away from the wall.`,
  (n, p) => `${n} raises the pole to correct the angle, overcorrects, and loses contact with the plaque.`,
  (n, p) => `${n}'s arms drop several inches, allowing the plaque to slide down the wall.`,
  (n, p) => `${n} sneezes, the pole jerks sideways, and the plaque falls.`,
];

export const holdUp = {
  id: 'bb-stamina-hold-up',
  name: "What's The Hold Up",
  category: 'physical',
  types: ['hoh', 'tiebreaker'],
  variant: 'hold-up',
  weight: () => 1,
  desc: 'Each houseguest uses a long flexible pole to hold a plaque against a wall. If the pole shifts and the plaque loses contact, that player is eliminated. The last houseguest still holding a plaque in place wins Head of Household.',
  // Steadiness OVER strength, and the declared profile has to say so — the
  // first version declared endurance as the top stat while the prose promised
  // the stillest houseguest wins, and a two-player test of a strong-but-rattled
  // houseguest against a weak-but-calm one split 25/60 the wrong way. The
  // simulation below reads exactly these weights.
  stats: { temperament: 0.34, endurance: 0.30, intuition: 0.20, physical: 0.16 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const beats = [];
    const breakdown = {};
    participants.forEach(n => { luck[n] = 0; });

    beats.push(beat(
      'The houseguests raise their poles and press the plaques against the wall. Losing contact means elimination.',
      participants.slice(0, 4), 'PLAQUES UP', 'challenge'));

    const held = {};
    for (const name of participants) {
      // Steadiness, not strength. A houseguest with a calm hand outlasts a
      // stronger one whose arms shake, which is the opposite of the wall — and
      // the weights here are the competition's own declared profile rather than
      // a second one written by hand, which is the drift the library guards
      // against.
      const aptitude = stat(name, 'temperament') * 0.34 + stat(name, 'endurance') * 0.30
        + stat(name, 'intuition') * 0.20 + stat(name, 'physical') * 0.16;
      const arms = stat(name, 'endurance') * 0.5 + stat(name, 'physical') * 0.5;
      const steady = stat(name, 'temperament') * 0.6 + stat(name, 'intuition') * 0.4;
      const swing = nerve(name, rng, 2.0);
      luck[name] = round2(swing);
      held[name] = Math.max(0.5, (aptitude + swing) * 1.6);
      breakdown[name] = {
        minutes: round2(held[name]), arms: round2(arms), steadiness: round2(steady),
        score: round2(held[name]), threw: false,
      };
    }

    const order = [...participants].sort((a, b) => held[a] - held[b]);
    const printed = new Set();
    order.forEach((name, i) => {
      const p = pronouns(name);
      if (i === order.length - 1) return;
      // Somebody quiet is narrated roughly every other drop, so the screen is
      // not only a list of people failing.
      //
      // The subject rotates through whoever is STILL UP at that moment rather
      // than always being the eventual winner: one name and a pool of four
      // lines meant a long competition printed the same sentence twice.
      if (i % 2 === 1 && order.length > 3) {
        const stillUp = order[order.length - 1 - ((i >> 1) % Math.max(1, order.length - 1 - i))];
        const line = say(HU_QUIET)(stillUp, pronouns(stillUp));
        if (!printed.has(line)) {
          printed.add(line);
          beats.push(beat(line, [stillUp], 'STILL UP', 'challenge'));
        }
      }
      beats.push(beat(`${clock(held[name])} — ${say(HU_GO)(name, p)}`,
        [name], i === order.length - 2 ? 'RUNNER-UP' : 'PLAQUE DOWN',
        i === order.length - 2 ? 'red' : 'grey'));
    });

    const entries = rankByExit(order, Object.fromEntries(participants.map(n => [n, clamp(held[n] / 3, 0, 9.9)])));
    const winner = entries[0]?.name;
    if (winner) {
      beats.push(beat(
        `${winner} keeps the plaque against the wall for ${clock(held[winner])} and lowers the pole after everyone else is out.`,
        [winner], 'WINS IT', 'gold'));
      api.popDelta(winner, 2);
      api.record(winner, 'hold-up-win', { minutes: round2(held[winner]) });
    }

    return toResult(entries, {
      luck, beats, breakdown, variant: 'hold-up',
      detail: { runs: participants.map(n => ({ name: n, minutes: round2(held[n]) })) },
      text: winner ? `${winner} keeps the plaque up for ${clock(held[winner])} and wins Head of Household.` : '',
    });
  },
};

export const STAMINA_COMPS = [dizzyDiscs, logRoll, holdUp];
export default STAMINA_COMPS;
