// ══════════════════════════════════════════════════════════════════════
// pm/talk/sorts-place.js — a couple's place read out in Couple of Sorts (challenges.js)
// ══════════════════════════════════════════════════════════════════════
//   sorts-place [a, b]  the public put a and b here. `of`: lower (they stood
//               higher than this) · higher (they stood lower) · right (where they
//               thought). The places go from the bottom up; the top is sorts-podium.
import { build } from './build.js';

export const SORTS_PLACE = build('sorts-place', {
  tiered: false,
  plans: { featured: ['place', 'react'], short: ['place', 'react'] },
  moves: {
    place: [
      { stage: "The next envelope is opened, and {a} and {b} are told to move.", turns: [] },
      { stage: "{a} and {b} hear their names, and walk to their step.", turns: [] },
      { stage: "Another couple is placed. It's {a} and {b}.", turns: [] },
    ],
    react: [
      { when: { of: 'lower' }, turns: [['a', "Down there? Are you sure?"], ['b', "Come on. Just walk. Everyone's looking."]] },
      { when: { of: 'lower' }, turns: [['b', "We were standing at the top. We put ourselves at the top."], ['a', "I know. I was there."]] },
      { when: { of: 'lower' }, turns: [['a', "So that's what they think of us out there."], ['b', "It's one vote. It's one day."]] },
      { when: { of: 'higher' }, turns: [['a', "Us? Higher? We put ourselves near the bottom!"], ['b', "They like us! The public actually like us!"]] },
      { when: { of: 'higher' }, turns: [['b', "Move up. Move up before they change their minds."]] },
      { when: { of: 'right' }, turns: [['a', "Told you. Exactly where I said."], ['b', "You said one higher."], ['a', "Basically where I said."]] },
      { when: { of: 'right' }, turns: [['b', "That's about right, isn't it."], ['a', "It's fine. It's not the top, but it's fine."]] },
      { when: { of: 'right' }, turns: [['a', "Spot on. We know exactly where we stand."], ['b', "I'd have liked to stand a bit higher, though."]] },
      { when: { of: 'right' }, turns: [], beat: "{a} and {b} don't have to move at all. They just nod at each other." },
      { when: { of: 'lower' }, turns: [], beat: "{a} and {b} walk down the steps, and every couple they pass looks away." },
      { when: { of: 'higher' }, turns: [['a', "Wait, us? Up there?"], ['b', "Don't ask questions. Just go."]] },
    ],
  },
});
