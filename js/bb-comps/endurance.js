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
  desc: 'Houseguests hold onto narrow grips on a wall that repeatedly tilts and sprays them. Falling or stepping down eliminates them; the last person still holding on wins.',
  stats: { endurance: 0.44, temperament: 0.24, physical: 0.18, boldness: 0.14 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      mix: this.stats, luck: 2.2, context, rng,
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

const SOAK_LINES = [
  n => `${n} takes a full wave to the face and does not flinch. Somewhere a producer is delighted.`,
  n => `${n} is starting to shiver, which in this competition is the beginning of the end.`,
  n => `${n} laughs at the cold, once, and then stops finding it funny.`,
  n => `${n} has water in both ears and cannot hear the count any more, which turns out not to matter.`,
];

export const coldSoak = {
  id: 'bb-endurance-soak',
  name: 'Cold Comfort',
  category: 'endurance',
  types: ['hoh', 'veto', 'arena'],
  desc: 'Houseguests remain on small platforms while cold water and wind hit them in timed waves. Stepping off eliminates them, and the last player remaining wins.',
  stats: { endurance: 0.38, temperament: 0.30, boldness: 0.18, physical: 0.14 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      mix: this.stats, luck: 2.6, context, rng,
    });
    const beats = [];
    const say = makePicker(rng);
    beats.push(beat(
      `It is not a hard competition. It is only a cold one, for a very long time, which turns out to be worse.`,
      participants.slice(0, 2), 'THE SOAK'));

    [...entries].reverse().slice(0, Math.max(1, entries.length - 1)).forEach((e, i) => {
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      if (i % 2 === 0 || i > entries.length - 4) {
        beats.push(beat(say(SOAK_LINES)(e.name), [e.name], i === 0 ? 'FIRST OUT' : 'STEPS OUT'));
      }
    });

    const winner = entries[0];
    const wp = pronouns(winner.name);
    beats.push(beat(`${winner.name} is still on ${wp.posAdj} platform when the last opponent steps off.`,
      [winner.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'endurance-win', {});

    return toResult(entries, {
      beats, breakdown, variant: 'soak',
      text: `${winner.name} outlasts the house in Cold Comfort.`,
    });
  },
};

export const ENDURANCE_COMPS = [pressureWall, coldSoak];
