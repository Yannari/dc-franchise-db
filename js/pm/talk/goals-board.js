// ══════════════════════════════════════════════════════════════════════
// pm/talk/goals-board.js — one board turned round in Couple Goals (challenges.js coupleGoals)
// ══════════════════════════════════════════════════════════════════════
//   goals-board [a, b, c, d]  couple a+b turn their board round: it names c+d.
//               `of`: marry (most likely to get married) · fake (the most fake) ·
//               break (first to break up); `again`: the board before said c+d too
import { build } from './build.js';

export const GOALS_BOARD = build('goals-board', {
  tiered: false,
  plans: { featured: ['turn', 'react'], short: ['turn', 'react'] },
  moves: {
    turn: [
      { when: { again: false }, stage: "{a} and {b} turn their board round. It says {c} and {d}.", turns: [] },
      { when: { again: false }, stage: "{a} holds the board up, and {b} reads it out: {c} and {d}.", turns: [] },
      { when: { again: true }, stage: "The next board goes round. {c} and {d}. Again.", turns: [] },
      { when: { again: true }, stage: "{a} and {b} turn theirs round, and the villa groans. {c} and {d}, for the second time.", turns: [] },
    ],
    react: [
      { when: { of: 'marry' }, turns: [['c', "Aw. Stop it."], ['d', "We'll take that. We'll definitely take that."]] },
      { when: { of: 'marry' }, turns: [['d', "Did you hear that? They think we're getting married."], ['c', "Don't get any ideas."]] },
      { when: { of: 'fake', again: false }, turns: [['c', "Fake? Us? Based on what?"], ['a', "Based on watching you."]] },
      { when: { of: 'fake', again: false }, turns: [['d', "Wow. Okay. Thanks, {a}."], ['a', "It's only a game."], ['d', "It's not, though, is it?"]] },
      { when: { of: 'fake', again: true }, turns: [['c', "Twice? Twice now?"], ['d', "Are we the only couple in here or something?"]] },
      { when: { of: 'break', again: false }, turns: [['c', "First to break up? We're the strongest couple in here!"], ['b', "That's what everyone thinks about themselves."]] },
      { when: { of: 'break', again: false }, turns: [['d', "Why us?"], ['b', "You argue more than anyone. Sorry. You do."]] },
      { when: { of: 'break', again: true }, turns: [['c', "Is there a vote I didn't know about?"], ['d', "Apparently everyone's already planning our break-up."]] },
    ],
  },
});
