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
// Mechanically this is the one competition with NO aptitude in it at all.
//
// It used to carry a stat profile — intuition, boldness, temperament — with a
// comment calling it "deliberately almost inert" and a very high luck setting
// meant to drown it. It did not drown it. Aptitude contributed up to about ten
// points against a roll of plus-or-minus fourteen, so a well-suited houseguest
// genuinely won this more often, while the competition screen printed those
// weights as bars underneath a description promising nobody could be better at
// it. Both things could not be true, and the description was the honest one.
//
// So the profile is gone. There is nothing to be good at, nothing to throw,
// and nothing a week of slop can take away from you: the ball is the same
// ball, the mark is the same mark, and the board decides. That is the entire
// competition, and it is why a house can never fully plan a week.

import { pronouns } from '../players.js';
import { toResult, beat, choose } from './_shared.js';
import { threat, bond } from '../bb-events/_read.js';

export const theDraw = {
  id: 'bb-luck-draw',
  name: 'Pure Chance',
  category: 'luck',
  types: ['hoh', 'veto', 'arena', 'tiebreaker'],
  desc: 'Every houseguest releases an identical ball from the same mark into a concealed board of pegs and baffles. The moment it disappears there is nothing left to do — nobody can steer it, nobody can be better at it, and the board throws it wherever it throws it. The slot it drops into is the score, the highest score takes the power, and the house has to live with whoever that turns out to be.',
  // No `stats`, on purpose. The dispatcher permits it because simulate() is
  // written, the results screen draws no weight bars when there are none, and
  // the Debug tab shows an aptitude of zero for everybody — which is the true
  // reading of this competition rather than a formula that flatters it.
  //
  // Read by the have-not suite: slop cannot make a ball land worse, so this is
  // the one competition that reports no penalty for one.
  pureChance: true,
  weight(ctx) {
    // Rarer than the skill competitions — a house where power is random every
    // week has no strategy in it at all.
    return ctx.type === 'hoh' ? 0.45 : 0.6;
  },
  simulate(participants, context, api, rng) {
    // One roll per houseguest and nothing else in the sum.
    //
    // Not scoreField: every scorer in the library folds in aptitude, a throw
    // read and a have-not drag, and not one of those can reach a ball behind a
    // board. A houseguest cannot throw this competition — the release is
    // identical for everybody and the ball is out of their hands before
    // anything is decided — so there is no `threw` to report either.
    const SLOTS = 100;
    const breakdown = {};
    const entries = participants.map(name => {
      const slot = 1 + Math.floor(rng() * SLOTS);
      breakdown[name] = {
        slot,
        // The Debug tab's two levers, answered honestly: no aptitude in this
        // competition at all, and the roll IS the result.
        base: 0, roll: slot,
        haveNot: (context.haveNots || []).includes(name), haveNotPenalty: 0,
        threw: false, threwChance: 0,
        score: slot,
      };
      return { name, score: slot, threw: false };
    }).sort((a, b) => b.score - a.score);
    const beats = [];
    beats.push(beat(
      `Every player releases the same ball from the same mark. Once it disappears behind the board, nobody can steer it; they can only wait for it to land in a scoring slot.`,
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
    if (unlucky && unlucky.name !== winner.name) {
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
