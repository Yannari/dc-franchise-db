// ══════════════════════════════════════════════════════════════════════
// tr/deduction.js — what the castle believes about who is a Traitor
// ══════════════════════════════════════════════════════════════════════
//
// This is the show. Everything else — the missions, the pot, the murder — feeds
// the one question a Round Table asks, and this file is where the answer forms.
//
// It is a layer on js/knowledge.js rather than a system of its own, and the fit
// is close enough to be worth stating. That module already models a fact with a
// ground truth, a per-person belief with a confidence and a source, a
// credibility tier per source type, decay with age, and a read-skill roll on
// mental+intuition that decides both whether you accept a claim AND whether you
// see through a false one. Point all of that at a new `alignment` fact type and
// most of a social deduction engine is already written.
//
// THE ONE RULE THAT MAKES IT WORK: nobody ever OBSERVES an alignment. The
// Traitors are told theirs; everybody else can only ever deduce or hear a rumour,
// which the credibility tiers cap at 0.62 and 0.45. So no Faithful can reach
// certainty, ever, about anyone — which is exactly the state the people on this
// show are in, and it falls out of the tier table rather than out of a special
// case in every reader.
import { learn } from '../knowledge.js';
import { alignmentFactId, livingTraitors } from './roles.js';

export { alignmentFactId };

/**
 * The Traitors meet, and learn each other with certainty.
 *
 * `public` credibility (1.0) is correct and is the ONLY place it is used for an
 * alignment: they are standing in a room together wearing the cloaks. Every
 * other belief about alignment in the whole game arrives as `deduced` or
 * `rumor`. If a second caller ever passes `public` or `observed` here, the
 * ceiling that makes the format work is gone.
 */
export function seedTraitorKnowledge(ep) {
  const traitors = livingTraitors(ep);
  for (const knower of traitors) {
    for (const subject of traitors) {
      learn(knower, alignmentFactId(subject),
        { source: 'the turret', sourceType: 'public', ep, rng: () => 0 });
    }
  }
  return traitors;
}
