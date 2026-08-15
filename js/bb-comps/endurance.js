// ══════════════════════════════════════════════════════════════════════
// bb-comps/endurance.js — the ones that end when people let go
// ══════════════════════════════════════════════════════════════════════
//
// Endurance competitions are the format's signature: everybody starts, nobody
// finishes quickly, and the story is the order people drop. That order is the
// narration — the early casualty, the one who was clearly beaten an hour before
// admitting it, the two who end up alone out there staring at each other.
//
// The deals matter too. A houseguest hanging on with one ally left will take a
// promise to come down, and that promise is real state the rest of the season
// reads.

import { pronouns } from '../players.js';
import { scoreField, toResult, beat, margin, makePicker, THROW_LINES, vb } from './_shared.js';
import { bond } from '../bb-events/_read.js';
import { coldComfort } from './cold-comfort.js';

const WALL_DROP = [
  (n, p) => `${n} goes at the first serious tilt — no drama, just gone, and ${p.sub} ${vb(p, 'is', 'are')} honest enough to admit ${p.sub} ${vb(p, 'was', 'were')} never winning this one.`,
  (n, p) => `${n} holds until ${p.posAdj} hands stop being ${p.posAdj} hands, and then holds a little past that, and then does not.`,
  (n, p) => `A gust, a slip, and ${n} is in the safety padding before ${p.sub} ${vb(p, 'has', 'have')} decided to let go.`,
  (n, p) => `${n} drops without a word. No excuse, no speech. Just down, and straight inside.`,
  (n, p) => `${n} lasts long enough to be surprised at ${p.ref}, which is its own kind of win, and then goes.`,
];

const WALL_HOLD = [
  n => `${n} has stopped moving entirely. Whatever is being spent up there, it is not being spent on looking comfortable.`,
  n => `${n} is talking to nobody in particular now, which is the point in every one of these where the talking stops being for anyone else.`,
  n => `Somebody offers ${n} a deal from the ground. ${n} does not answer, which is an answer.`,
  n => `${n} adjusts once, badly, and everyone watching decides that was the moment — then ${n} is still there twenty minutes later.`,
];

export const pressureWall = {
  id: 'bb-endurance-wall',
  name: 'Hold the Line',
  category: 'endurance',
  types: ['hoh', 'veto'],
  desc: 'The whole house hangs off narrow grips on a wall face that tilts, shakes and sprays them in waves, and the waves get worse the longer it runs. There is no score and no clock — losing your grip or stepping down simply ends your night, in front of everybody. The last houseguest still on the wall wins, and once it is down to two the competition is usually settled by a conversation rather than a fall.',
  // Temperament here was standing in for determination, which it is not: it
  // is volatility. It keeps its place on the bars because it still decides
  // nights — as the SPREAD around somebody's staying power rather than as part
  // of the staying power itself. See scoreField's swingBy.
  stats: { endurance: 0.50, physical: 0.20, temperament: 0.18, boldness: 0.12 },
  roles: {
    capacity: { endurance: 0.62, physical: 0.24, boldness: 0.14 },
    steadiness: { temperament: 1 },
  },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      mix: this.roles.capacity, swingBy: this.roles.steadiness, luck: 2.2, context, rng,
    });
    const beats = [];
    const say = makePicker(rng);
    const order = [...entries].reverse();     // first out is worst score

    beats.push(beat(
      `The wall starts level and stays that way for about four minutes. Then it does not.`,
      participants.slice(0, 3), 'THE WALL BEGINS'));

    // People fall off in reverse order of how well they did.
    order.slice(0, Math.max(1, order.length - 2)).forEach((e, i) => {
      const p = pronouns(e.name);
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      const text = say(WALL_DROP)(e.name, p);
      beats.push(beat(text, [e.name], i === 0 ? 'FIRST OUT' : 'DROPS'));
      // A long hold costs the body and buys nothing but respect.
      if (i > order.length - 5) api.popDelta(e.name, 1);
    });

    // The last two, and the deal that sometimes ends it.
    const [winner, runnerUp] = entries;
    if (runnerUp) {
      beats.push(beat(say(WALL_HOLD)(runnerUp.name), [runnerUp.name], 'STILL UP'));
      const close = bond(winner.name, runnerUp.name);
      if (close >= 3) {
        // Allies do not fight each other for three more hours.
        beats.push(beat(
          `${runnerUp.name} and ${winner.name} are the only two left, and they are on the same side. It takes ninety seconds of quiet negotiation before ${runnerUp.name} comes down.`,
          [winner.name, runnerUp.name], 'DEAL STRUCK', 'green'));
        api.addBond(winner.name, runnerUp.name, 0.9);
        api.record(runnerUp.name, 'stepped-down-for-ally', { ally: winner.name });
      }
    }

    const m = margin(entries);
    beats.push(beat(
      m.word === 'photo finish'
        ? `${winner.name} outlasts the field by a margin nobody watching could have called.`
        : `${winner.name} is the last one on the wall.`,
      [winner.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'endurance-win', { margin: m.gap });

    return toResult(entries, {
      beats, breakdown, variant: 'wall',
      text: `${winner.name} wins Hold the Line, the last houseguest still on the wall.`,
    });
  },
};

// Cold Comfort used to live here as a second `scoreField` roll with a different
// set of drop lines on it. It now runs its own night hour by hour and has its
// own file; this keeps the import so the pool below reads as the whole
// endurance shelf rather than half of one.
export const ENDURANCE_COMPS = [pressureWall, coldComfort];

/** Re-exported: this was Cold Comfort's home before it earned a file. */
export { coldComfort, coldComfort as coldSoak };
