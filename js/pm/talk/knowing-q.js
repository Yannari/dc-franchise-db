// ══════════════════════════════════════════════════════════════════════
// pm/talk/knowing-q.js — a question in Knowing Me, Knowing You (challenges.js knowingMe)
// ══════════════════════════════════════════════════════════════════════
//   knowing-q  [a, b, c, (d)]  b guesses a's answer. c is the true answer; d is
//              b's wrong guess (only when b got it wrong). `of`:
//                friend   "Who's my best friend in here?"
//                nemesis  "Who winds me up the most?"
//                fancy    "Who would I go for, if I wasn't with you?"
//              `guessed`: b got it right
import { build } from './build.js';

const R = { guessed: true }, W = { guessed: false };

export const KNOWING_Q = build('knowing-q', {
  tiered: false,
  plans: { featured: ['ask', 'answer', 'land?'], short: ['ask', 'answer'] },
  moves: {
    ask: [
      { when: { of: 'friend' }, stage: "{a} and {b} sit back to back on the stools, whiteboards on their knees.", turns: [['a', "Question one. Who's my best friend in the villa?"]] },
      { when: { of: 'friend' }, turns: [['b', "Right. Who's your best friend in here? I know this. I definitely know this."]] },
      { when: { of: 'nemesis' }, stage: "The next card makes the whole villa go 'ooh'.", turns: [['a', "Who in here winds me up the most?"]] },
      { when: { of: 'nemesis' }, turns: [['b', "Who annoys you the most in the villa. Oh, this is going to cause problems."]] },
      { when: { of: 'fancy' }, stage: "{a} turns the card over, reads it, and goes pale.", turns: [['a', "'If you weren't with your partner, who would you go for?'"], ['b', "Oh, I want to know this one."]] },
      { when: { of: 'fancy' }, stage: "The villa goes very quiet for this card.", turns: [['b', "Who would you go for, if you weren't with me? And I'm guessing what you've written."]] },
    ],
    answer: [
      { when: { of: 'friend', ...R }, turns: [['b', "{c}. Easy."], ['a', "Correct!"], ['c', "Obviously. Who else would it be?"]] },
      { when: { of: 'friend', ...R }, turns: [['b', "It's {c}. You two are always together."], ['a', "That's right. Point to us."]] },
      { when: { of: 'friend', ...W }, turns: [['b', "{d}?"], ['a', "{d}? It's {c}! I've known {c} longest!"], ['c', "I'm actually hurt."]] },
      { when: { of: 'friend', ...W }, turns: [['b', "I'm going to say {d}."], ['a', "No! {c}! How do you not know that?"]] },
      { when: { of: 'nemesis', ...R }, turns: [['b', "{c}."], ['a', "Correct. Sorry, {c}."], ['c', "Wow. Thanks."]] },
      { when: { of: 'nemesis', ...R }, turns: [['b', "Has to be {c}."], ['a', "It's {c}."], ['c', "I'm right here, you know."]] },
      { when: { of: 'nemesis', ...W }, turns: [['b', "{d}?"], ['a', "No, I love {d}. It's {c}."], ['c', "Oh, nice. In front of everyone."]] },
      { when: { of: 'nemesis', ...W }, turns: [['b', "I've written {d}."], ['a', "{d}'s fine! It's {c}, and you know it's {c}."]] },
      { when: { of: 'fancy', ...R }, turns: [['b', "{c}. I've written {c}."], ['a', "…Yeah. I've written {c} too."], ['b', "I knew it. I knew it before you even turned the board round."]] },
      { when: { of: 'fancy', ...R }, turns: [['b', "It's {c}, isn't it."], ['a', "It's only a game."], ['b', "That's not a no."]] },
      { when: { of: 'fancy', ...W }, turns: [['b', "{d}?"], ['a', "No. It's… {c}."], ['b', "{c}? Since when?"]] },
      { when: { of: 'fancy', ...W }, turns: [['b', "I've put {d}. Please say it's {d}."], ['a', "It's {c}."], ['b', "Right. Okay. Good to know."]] },
    ],
    land: [
      { when: { of: 'fancy' }, turns: [], beat: "{c} looks over at {a}, and then very quickly looks anywhere else." },
      { when: { of: 'fancy' }, turns: [], beat: "{b} smiles all the way through the next question, and doesn't mean it." },
      { when: { of: ['friend', 'nemesis'], ...R }, turns: [], beat: "{a} and {b} high-five, and the villa groans." },
      { when: { of: 'nemesis' }, turns: [], beat: "{c} folds {c.posAdj} arms, and keeps them folded for the rest of the game." },
    ],
  },
});
