// ══════════════════════════════════════════════════════════════════════
// bb-comps/luck.js — the ones nobody can plan around
// ══════════════════════════════════════════════════════════════════════
//
// A crapshoot is a real Big Brother competition type, not a failure of design,
// and leaving it out would make the house far too predictable. Every so often
// the power lands on whoever it lands on: the floater who has not won anything,
// the nominee who was already packing, the person the entire house had agreed
// to keep weak.
//
// Mechanically this is the one competition where aptitude barely registers. The
// stat profile exists so the dispatcher can still describe it, but `luck` is set
// high enough to drown it — which is the point, and is why a house can never
// fully plan a week.

import { pronouns } from '../players.js';
import { scoreField, toResult, beat, choose } from './_shared.js';
import { threat, bond } from '../bb-events/_read.js';

export const theDraw = {
  id: 'bb-luck-draw',
  name: 'Pure Chance',
  category: 'luck',
  types: ['hoh', 'veto', 'arena', 'tiebreaker'],
  desc: 'A competition with no skill in it whatsoever, which everybody understands and nobody can do anything about.',
  // Present so the dispatcher can render a formula; deliberately almost inert.
  stats: { intuition: 0.4, boldness: 0.35, temperament: 0.25 },
  weight(ctx) {
    // Rarer than the skill competitions — a house where power is random every
    // week has no strategy in it at all.
    return ctx.type === 'hoh' ? 0.45 : 0.6;
  },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, {
      // Luck this high means the stat profile is noise. That is the design.
      mix: this.stats, luck: 14, context, rng, throwPenalty: 2,
    });
    const beats = [];
    beats.push(beat(
      `There is no skill in this one and everybody works that out inside thirty seconds. After that it is just watching.`,
      participants.slice(0, 3), 'PURE CHANCE'));

    const winner = entries[0];
    const p = pronouns(winner.name);
    // The story of a crapshoot is who it landed on, so read the house's view.
    const strong = threat(winner.name) >= threat(entries.at(-1).name) * 1.4;
    const nominated = (context.nominees || []).includes(winner.name);

    if (nominated) {
      beats.push(beat(
        `It lands on ${winner.name}, who was on the block an hour ago and is now holding the only thing in this house that matters. The plan for the week dies in real time, on camera, in front of the person whose plan it was.`,
        [winner.name], 'THE BLOCK SAVES ITSELF', 'gold'));
      api.popDelta(winner.name, 3);
    } else if (strong) {
      beats.push(beat(
        `Of course it is ${winner.name}. The one person the house did not need to have any more power lands the one competition nobody could stop ${p.obj} winning.`,
        [winner.name], 'THE WRONG WINNER', 'red'));
      api.popDelta(winner.name, 1);
    } else {
      beats.push(beat(
        `${winner.name} wins, and the house has to spend the rest of the evening pretending to be pleased about it.`,
        [winner.name], 'PURE CHANCE', 'gold'));
      api.popDelta(winner.name, 2);
    }

    // Losing a competition to nothing but chance is its own small grievance.
    const unlucky = entries.at(-1);
    if (unlucky && !unlucky.threw && unlucky.name !== winner.name) {
      beats.push(beat(
        `${unlucky.name} does everything identically to everyone else and finishes last, which is the only outcome this competition can produce for somebody.`,
        [unlucky.name], 'NOTHING TO BLAME', 'grey'));
    }

    api.record(winner.name, 'luck-win', { nominated, strong });
    return toResult(entries, {
      beats, breakdown, variant: 'crapshoot',
      text: `${winner.name} wins Pure Chance, a competition with nothing in it to be good at.`,
    });
  },
};

export const LUCK_COMPS = [theDraw];
