// ══════════════════════════════════════════════════════════════════════
// bb-comps/bowlerina.js — Bowlerina
// ══════════════════════════════════════════════════════════════════════
//
// A recurring Power of Veto, Head of Household and Temptation competition since
// Big Brother 15 — five seasons across the US and Argentina. The rules:
//
//   Hold the metal bars above your head and spin. After a set time a barrier
//   drops, and you get to roll a ball at the pin targets on the far side. Then
//   the barrier comes back up and you spin again.
//
// The competition is not bowling. It is bowling AFTER being spun, and it is
// physical the whole way down: balance and coordination to stay upright and put
// the ball where you meant to, endurance to keep hauling yourself around the
// overhead bars frame after frame, and enough left over mentally to correct an
// aim while the room is still moving. Dizziness is the mechanic — it
// accumulates across frames, it is resisted rather than avoided, and the last
// frames are the hardest ones on the card.
//
// It replaces a one-roll "roll balls at scoring pockets" comp with no frames in
// it. Each houseguest now has a real card: every roll scored, the dizziness it
// was thrown under, gutters, and a best frame.
//
// NOTE ON `breakdown`: one key per player only — the Debug tab renders keys as
// houseguests. Per-frame structure lives inside each player's record.
// ══════════════════════════════════════════════════════════════════════

import { pStats, pronouns } from '../players.js';
import { aptitude, beat, toResult, makePicker, throwRead, clamp, THROW_LINES, vb } from './_shared.js';

const NEUTRAL = { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' };
const pron = name => { try { return pronouns(name) || NEUTRAL; } catch { return NEUTRAL; } };

// What a roll can be worth: 0, 1, 2, 3, 5 or 8. The far targets pay, and they
// are the ones you cannot see properly. The bands that award them live in
// simulate() — as a list this was mapped onto by index, which is what let a
// steady houseguest clear the top of it five frames out of five.

const OPEN_LINES = [
  () => 'The bars go up, the barrier goes down, and the yard fills with the sound of a lot of people trying not to be sick.',
  n => `${n} frames each. Spin, wait for the barrier, roll at something you can only partly see, and then do it again.`,
  () => 'Nobody has ever made this look dignified and nobody is about to start.',
  () => 'The pins are not far away. The problem has never been the distance.',
];

const BIG_LINES = [
  (n, p, v) => `${n} rolls it clean into the far target for ${v}. ${p.Sub} could not tell you how.`,
  (n, p, v) => `${n} lets go early, before the room has finished turning, and it drops for ${v}.`,
  (n, p, v) => `The ${v} is the best roll of the night so far and ${n} immediately sits down on the mat.`,
  (n, p, v) => `${n} takes an extra second on the bars, waits out the worst of it, and buys ${p.ref} ${v}.`,
];

const GUTTER_LINES = [
  (n, p) => `${n} releases while still turning and watches the ball go somewhere the pins are not.`,
  (n, p) => `${n} is aiming at a target that is, from ${p.posAdj} point of view, currently orbiting.`,
  (n) => `Nothing. ${n} does not even see where it went.`,
  (n, p) => `${n} lets go of the bars, takes two steps sideways that ${p.sub} did not plan, and rolls it into the wall.`,
];

const DIZZY_LINES = [
  (n, p) => `${n} comes off the bars and goes straight down onto one knee. It takes ${p.obj} most of the frame to get back up.`,
  (n, p) => `${n} has to be pointed at the lane. ${p.Sub} ${vb(p, 'is', 'are')} pointed at the lane and rolls anyway.`,
  (n, p) => `${n} spins hard, which is the mistake — the extra rotations buy nothing and cost ${p.obj} the next two frames.`,
];

export const bowlerina = {
  id: 'bb-physical-precision',
  name: 'Bowlerina',
  category: 'precision',
  types: ['hoh', 'veto', 'arena', 'tiebreaker'],
  desc: 'Each houseguest gets a lane with a spinning station at one end and a row of pin targets at the other. Holding an overhead metal bar, they spin in circles until the barrier blocking the lane drops — then they let go, stagger to their ball and try to roll it into a target while the room is still turning. The barrier soon rises again and sends them back to the bar before their next roll. The harder targets are worth the most and sit exactly where the room is blurriest, and the highest total after five frames wins.',
  // Physical carries it: balance, coordination and the accuracy of the roll
  // itself. Endurance is the spinning and the overhead bars, over and over.
  // Mental is holding a correction together while the room is still moving, and
  // intuition is the last of it — spatial judgement at the release.
  stats: { physical: 0.50, endurance: 0.30, mental: 0.15, intuition: 0.05 },
  weight: () => 1.15,
  simulate(participants, context, api, rng) {
    const beats = [];
    const breakdown = {};
    const big = makePicker(rng);
    const gut = makePicker(rng);
    const diz = makePicker(rng);
    const threwSay = makePicker(rng);

    const frames = 5;
    beats.push(beat(
      OPEN_LINES[Math.floor(rng() * OPEN_LINES.length)](frames),
      participants.slice(0, 3), `${frames} FRAMES`));

    const runs = participants.map(name => {
      const t = throwRead(name, context, rng);
      // Read straight off the declared profile rather than restating it.
      //
      // These weights used to be written out twice — once in `stats` for the
      // screen and the Debug tab, once here for the simulation — so retuning
      // the competition in one place silently left the other describing a
      // different competition. `aptitude` already sums stat × weight; dividing
      // by ten puts it back on the 0–1 scale the rest of this file expects.
      const steady = aptitude(name, this.stats) / 10;
      const haveNot = (context.haveNots || []).includes(name);

      let dizzy = 0, total = 0, gutters = 0, collapsed = false, best = null, hnCost = 0, luck = 0;
      const card = [];
      for (let f = 0; f < frames; f++) {
        // Dizziness ratchets. A steady houseguest sheds most of it between
        // frames but never all, so the back half of the card is harder — while
        // still leaving a steady houseguest upright at the end of it. Tuned
        // down from a version that buried the whole field by frame three and
        // put four of eight players on the mat.
        dizzy = clamp(dizzy + 0.75 + rng() * 0.55 - steady * 0.95, 0, 2.8);
        if (haveNot) { const before = dizzy; dizzy = clamp(dizzy + 0.3, 0, 3); hnCost += dizzy - before; }

        // Going down is an event, not the weather. At a 30% roll above a low
        // threshold half the yard collapsed every single time.
        let fell = false;
        if (!collapsed && dizzy > 2.1 && rng() < 0.13) {
          fell = true; collapsed = true; dizzy = clamp(dizzy + 0.5, 0, 3.2);
        }

        // The roll: aim is steadiness minus however much the room is moving.
        // Widened from 0.5 when the profile moved to physical .50. Concentrating
        // half the weight on one stat widened the aptitude gaps and dropped the
        // competition to four distinct winners in sixty runs; this puts the
        // upset rate back where the old five-stat spread had it, without
        // touching the weights themselves.
        const aimNoise = (rng() - 0.5) * 0.7;
        luck += aimNoise;
        const aim = clamp(0.18 + steady * 1.15 - dizzy * 0.17 + aimNoise
          - (t.threw ? 0.5 : 0) - (fell ? 0.3 : 0), 0, 1);
        // What the roll is worth.
        //
        // Scaling `aim` straight onto the value ladder saturated it: a decent
        // houseguest cleared the top index nearly every frame, so cards read
        // 8/8/8/8/8, every player's best frame was 8, and there was no suspense
        // in watching one. The far target is supposed to be the hard one, so it
        // now has to be earned — thresholds, with the top band narrow enough
        // that a perfect card is a genuine event rather than the default.
        const value = aim >= 0.94 ? 8
          : aim >= 0.80 ? 5
            : aim >= 0.62 ? 3
              : aim >= 0.40 ? 2
                : aim >= 0.18 ? 1
                  : 0;

        if (!value) gutters++;
        total += value;
        const entry = { frame: f + 1, value, dizzy: Math.round(dizzy * 10) / 10, fell };
        if (!best || value > best.value) best = entry;
        card.push(entry);
      }

      return { name, total, gutters, card, best, collapsed,
        base: Math.round(aptitude(name, this.stats) * 100) / 100,
        luck: Math.round(luck * 100) / 100,
        threw: t.threw, threwChance: t.chance, haveNot,
        haveNotPenalty: Math.round(hnCost * 100) / 100, steady };
    });

    runs.sort((x, y) => y.total - x.total || x.gutters - y.gutters);

    runs.forEach(r => {
      const p = pron(r.name);
      if (r.threw) {
        beats.push(beat(threwSay(THROW_LINES)(r.name), [r.name], 'THREW IT', 'grey'));
      } else if (r.collapsed) {
        beats.push(beat(diz(DIZZY_LINES)(r.name, p), [r.name], 'WENT DOWN', 'grey'));
      } else if (r.best && r.best.value >= 5) {
        beats.push(beat(big(BIG_LINES)(r.name, p, r.best.value), [r.name], `${r.total} POINTS`));
      } else if (r.gutters >= 2) {
        beats.push(beat(gut(GUTTER_LINES)(r.name, p), [r.name], `${r.gutters} GUTTERS`, 'grey'));
      } else {
        beats.push(beat(
          `${r.name} keeps every roll on the boards and takes the safe targets. ${r.total} points, no drama, no disasters.`,
          [r.name], `${r.total} POINTS`));
      }
    // The Debug tab reports the levers behind every score — aptitude and the
    // luck that moved it. This competition spreads its randomness across many
    // small rolls rather than one, so `roll` is the accumulated deviation,
    // signed so that positive always means luck helped.
      breakdown[r.name] = {
        base: r.base, roll: r.luck,
        total: r.total, gutters: r.gutters, frames: r.card.length, card: r.card,
        best: r.best?.value ?? 0, collapsed: r.collapsed, steady: Math.round(r.steady * 100) / 100,
        threw: r.threw, threwChance: r.threwChance,
        // Reported, not merely applied — the have-not twist is verified by
        // reading this field back off the competition.
        haveNot: r.haveNot, haveNotPenalty: r.haveNotPenalty, score: r.total,
      };
    });

    const winner = runs[0];
    const second = runs[1];
    if (second && winner.total === second.total) {
      beats.push(beat(
        `${winner.name} and ${second.name} finish level on ${winner.total}. It goes to gutters, and ${winner.name} kept ${winner.gutters === 0 ? 'every ball on the boards' : `one fewer ball off them`}.`,
        [winner.name, second.name], 'COUNTBACK', 'gold'));
    } else if (second) {
      beats.push(beat(
        `${winner.name} finishes on ${winner.total}. ${second.name} is closest on ${second.total}.`,
        [winner.name, second.name], 'THE MARGIN', 'gold'));
    }

    const wp = pron(winner.name);
    beats.push(beat(
      `${winner.name} rolled straightest with the least idea which way was straight. ${wp.Sub} ${vb(wp, 'takes', 'take')} it on ${winner.total}.`,
      [winner.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'bowlerina-win', { total: winner.total, gutters: winner.gutters });
    // Going down in front of the whole yard is a thing the house remembers.
    runs.filter(r => r.collapsed && r !== winner).forEach(r => api.popDelta(r.name, -1));

    const entries = runs.map(r => ({ name: r.name, score: r.total, threw: r.threw }));

    return toResult(entries, {
      beats, breakdown, variant: 'precision',
      text: `${winner.name} wins Bowlerina on ${winner.total} points.`,
    });
  },
};
