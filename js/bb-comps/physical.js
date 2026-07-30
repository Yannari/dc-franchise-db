// ══════════════════════════════════════════════════════════════════════
// bb-comps/physical.js — slides, aim, and the one that runs in rounds
// ══════════════════════════════════════════════════════════════════════
//
// The backyard competitions. Two shapes matter here and they are different
// animals: a timed run where everyone goes at once, and a round-based knockout
// where the house watches somebody get eliminated every few minutes. The second
// is the better television and the better simulation, because it produces an
// order rather than a number.

import { pronouns } from '../players.js';
import { scoreField, toResult, beat, margin, makePicker, THROW_LINES } from './_shared.js';
import { bond, dislikes } from '../bb-events/_read.js';

const SLIDE_LINES = [
  (n, p) => `${n} goes down the slide face first, which is fast and, as ${p.sub} discovers, unsteerable.`,
  (n, p) => `${n} takes the slope carefully and pays for the care at the bottom.`,
  (n, p) => `${n} hits the mush, comes up unrecognisable, and gets the round's only cheer.`,
  (n, p) => `${n} loses a shoe on the way down and finishes the round without it.`,
];

export const slideKnockout = {
  id: 'bb-physical-slide',
  name: 'Slip Shift',
  category: 'physical',
  types: ['veto', 'arena', 'hoh'],
  desc: 'Rounds down a soaped slope to find one answer. Slowest each round goes out.',
  stats: { physical: 0.34, endurance: 0.24, mental: 0.20, boldness: 0.12, intuition: 0.10 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.2, context, rng });
    const beats = [];
    const say = makePicker(rng);
    const order = [...entries].reverse();     // eliminated worst-first

    beats.push(beat(
      `The slope is soaped, the pit at the bottom is not water, and every round somebody goes home from it.`,
      participants.slice(0, 3), 'ROUND ONE'));

    order.slice(0, Math.max(1, order.length - 1)).forEach((e, i) => {
      const p = pronouns(e.name);
      if (e.threw) {
        beats.push(beat(say(THROW_LINES)(e.name), [e.name], 'THREW IT', 'grey'));
        return;
      }
      beats.push(beat(say(SLIDE_LINES)(e.name, p), [e.name], `OUT · ROUND ${i + 1}`));
    });

    // Rounds put two people side by side, which is where competitions get personal.
    const [a, b] = entries;
    if (b && dislikes(a.name, b.name)) {
      beats.push(beat(
        `${a.name} and ${b.name} end up in the last round together, which neither of them wanted and both of them enjoy far too much.`,
        [a.name, b.name], 'GRUDGE ROUND', 'red'));
      api.addBond(a.name, b.name, -0.5);
    }

    const winner = entries[0];
    const m = margin(entries);
    beats.push(beat(
      `${winner.name} takes the last round${m.word === 'photo finish' ? ' by nothing at all' : ''}.`,
      [winner.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'knockout-win', { rounds: order.length });

    return toResult(entries, {
      beats, breakdown, variant: 'knockout',
      text: `${winner.name} wins Slip Shift.`,
    });
  },
};

export const precisionRoll = {
  id: 'bb-physical-precision',
  name: 'Long Roll',
  category: 'precision',
  types: ['hoh', 'veto', 'arena', 'tiebreaker'],
  desc: 'Roll for the far pocket. Nerve counts more than strength, and everybody watches every attempt.',
  stats: { temperament: 0.34, intuition: 0.24, physical: 0.18, mental: 0.14, boldness: 0.10 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 4, context, rng });
    const beats = [];
    beats.push(beat(
      `One roll at a time, everyone watching, nowhere to hide. The competition is mostly nerve and everybody knows it.`,
      participants.slice(0, 2), 'LONG ROLL'));

    const choker = entries.find(e => e.base > entries[0].base && e.name !== entries[0].name);
    if (choker) {
      const p = pronouns(choker.name);
      beats.push(beat(
        `${choker.name} has the best touch in the house and proves it twice, then has to do it once more with the whole yard silent, and does not.`,
        [choker.name], 'CHOKED', 'red'));
      api.popDelta(choker.name, -1);
      api.record(choker.name, 'choked', {});
    }

    const winner = entries[0];
    beats.push(beat(`${winner.name}'s last roll drops into the far pocket and stays there.`,
      [winner.name], context.type === 'veto' ? 'VETO' : 'HOH', 'gold'));
    api.popDelta(winner.name, 2);
    api.record(winner.name, 'precision-win', {});

    return toResult(entries, {
      beats, breakdown, variant: 'precision',
      text: `${winner.name} wins Long Roll.`,
    });
  },
};

export const PHYSICAL_COMPS = [slideKnockout, precisionRoll];
