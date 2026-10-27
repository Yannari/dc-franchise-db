// ══════════════════════════════════════════════════════════════════════
// pm/talk/tower-fall.js — the Tower of Truths comes down (challenges-more.js towerOfTruths)
// ══════════════════════════════════════════════════════════════════════
//   tower-fall [a, b, (c)]  a's pull knocks the tower over; b is a's partner. The
//              forfeit: "Have you ever thought about leaving your partner for
//              somebody in here?" `of`: nobody (true) · honest (names c) · dodge
import { build } from './build.js';

export const TOWER_FALL = build('tower-fall', {
  tiered: false,
  plans: { featured: ['fall', 'forfeit', 'answer', 'land'], short: ['fall', 'answer', 'land'] },
  moves: {
    fall: [
      { stage: "It's {a}'s turn. {a} slides a block out from near the bottom, very slowly, and the whole tower comes down.", turns: [['a', "No! No, no, no. It was already moving!"]] },
      { stage: "The tower is leaning badly now. {a} touches one block, and it goes.", turns: [['a', "I barely touched it! Everyone saw me barely touch it!"]] },
      { stage: "{a} pulls a block clean out, puts it on top, and the tower stands for one second. Then it falls.", turns: [['a', "Oh, come on!"]] },
    ],
    forfeit: [
      { turns: [['b', "You know what that means. The forfeit card."], ['a', "Read it, then. Get it over with."]] },
      { stage: "The forfeit card is handed to {b}, who reads it out loud.", turns: [] },
    ],
    answer: [
      { when: { of: 'nobody' }, turns: [['b', "'Have you ever thought about leaving your partner for somebody in here?'"], ['a', "No. Never. Not once. That's the easiest question I've had all day."]] },
      { when: { of: 'nobody' }, turns: [['b', "'Have you ever thought about leaving your partner for somebody in this villa?'"], ['a', "Honestly? No. I've had nobody else in my head since you."]] },
      { when: { of: 'honest' }, turns: [['b', "'Have you ever thought about leaving your partner for somebody in here?'"], ['a', "…Once. For about a day."], ['b', "Who?"], ['a', "{c}. But I didn't. I'm here."]] },
      { when: { of: 'honest' }, turns: [['b', "'Have you ever thought about leaving your partner for somebody in this villa?'"], ['a', "I'm not going to lie on a forfeit. Yes. {c}. It was a moment, and it passed."], ['b', "Did it?"]] },
      { when: { of: 'dodge' }, turns: [['b', "'Have you ever thought about leaving your partner for somebody in here?'"], ['a', "No. Next question. Is there a next question?"], ['b', "That was very fast."]] },
      { when: { of: 'dodge' }, turns: [['b', "'Have you ever thought about leaving your partner for somebody in this villa?'"], ['a', "What? No. Obviously not. Why is everyone looking at me?"]] },
    ],
    land: [
      { when: { of: 'nobody' }, turns: [], beat: "{b} smiles, and the villa cheers, and {a} starts picking up the blocks." },
      { when: { of: 'honest', cast: 3 }, turns: [], beat: "{c} is suddenly very interested in the blocks on the lawn. {b} doesn't take {b.posAdj} eyes off {a}." },
      { when: { of: 'dodge' }, turns: [], beat: "{b} says nothing, and helps pick up the blocks, and keeps looking at {a}." },
    ],
  },
});
