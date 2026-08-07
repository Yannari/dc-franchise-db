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
  'The arm comes round at shoulder height and takes everybody in the same order it did last time.',
  'The discs speed up first and the arm arrives second, which is the wrong way round for anybody trying to brace.',
  'The arm swings low. Everybody sees it coming and it makes no difference whatsoever.',
  'A gap in the rhythm, then two sweeps back to back with nothing between them.',
  'The padding on the arm has stopped being convincing and the sound has changed.',
];

const DD_HOLD = [
  (n, p) => `${n} takes it across the middle, folds around the rope, and is still there when the disc comes back round.`,
  (n, p) => `${n} gets both hands above the knot and stops trying to look dignified about any of it.`,
  (n, p) => `${n} rides the sweep instead of fighting it, which is the only technique that has ever worked here.`,
  (n, p) => `${n} is laughing, spinning and holding on, and only two of those are voluntary.`,
];

const DD_OUT = [
  (n, p) => `${n} takes the arm square on and goes off the disc sideways, still holding a rope attached to nothing.`,
  (n, p) => `${n} loses the rope before the arm even arrives — the spinning did it, not the hit.`,
  (n, p) => `${n} hangs on through the sweep and then simply runs out of hands.`,
  (n, p) => `${n} steps off ${p.posAdj} own disc to be sick, which counts as stepping off ${p.posAdj} own disc.`,
];

export const dizzyDiscs = {
  id: 'bb-stamina-dizzy-discs',
  name: 'Dizzy Discs',
  category: 'endurance',
  types: ['hoh', 'veto', 'tiebreaker', 'return'],
  variant: 'dizzy-discs',
  weight: () => 1,
  desc: 'Every houseguest stands on their own motorised disc holding a rope hanging from the rig above them, and once the horn goes the discs spin continuously while a long padded arm sweeps around the yard at body height. They have to keep hold of the rope and stay on the disc through every pass of the arm, which comes round faster and lower as the competition goes on, and the spinning makes bracing for it almost impossible. Anybody who lets go of the rope or steps off their disc is out and cannot get back on. The last houseguest still spinning and still holding wins.',
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
      `${participants.length} discs, ${participants.length} ropes, and one arm that does not get tired.`,
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
        `${winner} is the last one still turning. ${wp.Sub} ${vb(wp, 'steps', 'step')} off after ${clock(round * 1.5)} and ${vb(wp, 'needs', 'need')} a moment and a wall.`,
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
  (n, p) => `${n} loses the log — one foot goes, then the rest of ${p.obj} — and lands flat in the water.`,
  (n, p) => `${n} over-corrects, walks backwards up the log for about a metre, and runs out of log.`,
  (n, p) => `${n} is fine, fine, fine, and then extremely not fine, all inside a second.`,
];

const LR_DROP = [
  (n, p) => `${n} watches ${p.posAdj} feet for one second too long and the weight on the end of the string touches down.`,
  (n, p) => `${n} keeps the log and loses the string — the lantern dips, taps the deck, and that is the whole competition gone.`,
  (n, p) => `${n} has both hands busy and nothing left to give the string with.`,
];

export const logRoll = {
  id: 'bb-stamina-log-roll',
  name: 'Log Roll',
  category: 'endurance',
  types: ['hoh', 'tiebreaker'],
  variant: 'log-roll',
  weight: () => 1,
  desc: 'Each houseguest stands on a floating log over the water holding a length of string, and on the end of that string hangs a weight that must never touch anything. The logs turn continuously and get faster as the competition runs, so staying upright takes constant small corrections with the feet — and every one of those corrections travels straight down the arm into the string. A houseguest is out the moment they fall off the log OR the moment the weight on their string touches down, whichever happens first, and the two are pulling against each other the whole time. Whoever stays up longest wins Head of Household.',
  stats: { endurance: 0.34, temperament: 0.28, physical: 0.22, intuition: 0.16 },
  simulate(participants, context, api, rng) {
    const luck = {};
    const say = makePicker(rng);
    const beats = [];
    const breakdown = {};
    participants.forEach(n => { luck[n] = 0; });

    beats.push(beat(
      'Logs in the water, strings in the hand, and a weight on the end of every one of them that is not allowed to touch the world.',
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
        `${winner} is still up at ${clock(survived[winner])}, weight swinging and never once touching down. `
        + `${fellCount} went in the water and ${participants.length - fellCount - 1} lost the string instead.`,
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
  (n, p) => `${n} has found an angle that works and is refusing to move any part of ${p.obj} at all.`,
  (n, p) => `${n} is breathing in a very deliberate pattern and has stopped answering anybody.`,
  (n, p) => `${n} shifts ${p.posAdj} grip by about a centimetre, which at the far end of the pole is a foot.`,
  (n, p) => `${n} has gone somewhere else entirely behind the eyes. The pole has not moved.`,
];

const HU_GO = [
  (n, p) => `${n}'s pole starts a wobble at the tip that travels back down the whole length, and the plaque comes away.`,
  (n, p) => `${n} tries to fix the angle, makes it worse in one movement, and loses it.`,
  (n, p) => `${n}'s arms go before ${p.posAdj} nerve does. The plaque slides down the wall almost gently.`,
  (n, p) => `${n} sneezes. That is all it takes and everybody in the yard knows it.`,
];

export const holdUp = {
  id: 'bb-stamina-hold-up',
  name: "What's The Hold Up",
  category: 'physical',
  types: ['hoh', 'tiebreaker'],
  variant: 'hold-up',
  weight: () => 1,
  desc: 'Each houseguest is given a long flexible pole and has to use the far end of it to press a plaque flat against the wall in front of them, standing well back with nothing to lean on. Nothing is thrown at them and nothing spins — the competition is entirely the weight of their own arms, and the length of the pole means the smallest tremor at the hand becomes a wide swing at the plaque. The moment a plaque comes away from the wall that houseguest is finished and their time is recorded. The last houseguest still holding their plaque up wins Head of Household.',
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
      'Poles up, plaques on the wall, and then nothing happens for a very long time — which is the competition.',
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
        `${winner} holds for ${clock(held[winner])} and puts the pole down only when told to. Nothing was thrown, nothing spun, and it was still the hardest thing anybody did this week.`,
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
