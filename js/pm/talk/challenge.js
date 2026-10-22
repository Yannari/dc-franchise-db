// ══════════════════════════════════════════════════════════════════════
// pm/talk/challenge.js — the afternoon challenge's two small scenes
// ══════════════════════════════════════════════════════════════════════
//
// challenge-kiss: {a} picks {b} to kiss in a challenge; {pa} is {a}'s partner
//   (behind taken), watching from the line. {pb} is {b}'s (behind bTaken).
// challenge-win: {a} and {b}, a couple, win it.
import { build } from './build.js';

export const CHALLENGE_KISS = build('challenge-kiss', {
  plans: {
    featured: ['kiss', 'react', 'after?'],
    short: ['kiss', 'react'],
  },
  moves: {
    kiss: [
      { stage: "It's {a}'s turn. {a} walks straight past the line and stops in front of {b}.", turns: [
        ['a', "Sorry, everyone. It has to be {b}."],
      ], beat: "{a} kisses {b}, and the whole line erupts." },
      { stage: "{a} reads the card, thinks for a second, and goes to {b}.", turns: [
        ['a', "Who I'd most like to kiss? Easy."],
      ], beat: "{a} grabs {b} and kisses {b.obj}. It goes on longer than it needs to." },
      { stage: "{a} hesitates, looks at the line, and then picks {b}.", turns: [
        ['a', "I'm going to get in so much trouble for this."],
      ], beat: "{a} kisses {b}. Somebody behind them goes very quiet." },
      { when: { taken: true }, stage: "{a} looks over at {pa}, then walks over to {b}.", turns: [
        ['a', "It's a game. Remember it's a game."],
      ], beat: "{a} kisses {b}, and {pa}'s face says it doesn't feel like a game." },
    ],
    react: [
      { turns: [
        ['b', "Well, I wasn't expecting that."],
        ['a', "Neither was I, honestly."],
      ] },
      { turns: [
        ['b', "That was a bit much for a Tuesday afternoon."],
        ['a', "It's a challenge. You've got to commit."],
      ] },
      { when: { bTaken: true }, turns: [
        ['b', "Oh my God. {pb} is going to kill me."],
        ['a', "It's a game!"],
        ['b', "Tell that to {pb}'s face."],
      ] },
      { turns: [
        ['a', "Sorry. Was that okay?"],
        ['b', "That was more than okay."],
      ] },
    ],
    after: [
      { when: { taken: true }, turns: [], beat: "{pa} doesn't clap with everyone else. {pa} just stares at the floor." },
      { turns: [], beat: "Back on the line, everyone is whispering." },
      { when: { taken: true }, turns: [], beat: "{a} tries to catch {pa}'s eye on the way back. {pa} won't look." },
    ],
  },
  notes: [
    { stage: "In the challenge, {a} picks {b} for a kiss." },
    { when: { taken: true }, stage: "{a} kisses {b} in the challenge, right in front of {pa}." },
  ],
});

export const CHALLENGE_WIN = build('challenge-win', {
  leads: ['rowedToday'],
  plans: {
    featured: ['win', 'after?'],
    short: ['win'],
  },
  moves: {
    win: [
      { when: { rowedToday: true }, stage: "{a} and {b} win the challenge, and for a moment the row is forgotten.", turns: [
        ['a', "We were barely speaking this morning, and now look at us."],
        ['b', "Maybe we just needed something to win together."],
        ['a', "Truce?"],
        ['b', "Truce. Champions don't sulk."],
      ] },
      { stage: "{a} and {b} win the challenge and jump into each other's arms.", turns: [
        ['a', "We did it! We actually did it!"],
        ['b', "I told you we would! I told you!"],
        ['a', "You said we'd come last."],
        ['b', "I was being modest."],
      ] },
      { stage: "{a} and {b} are crowned the winners.", turns: [
        ['b', "Teamwork. That's what that was. Pure teamwork."],
        ['a', "It was mostly me."],
        ['b', "It was mostly you. But I was there."],
      ] },
      { stage: "{a} and {b} celebrate their win, covered in whatever the challenge threw at them.", turns: [
        ['a', "I've got it in my ears. I've got it everywhere."],
        ['b', "Worth it, though."],
        ['a', "So worth it."],
      ] },
      { stage: "{a} lifts {b} off the ground when their win is called.", turns: [
        ['b', "Put me down! Put me down, you'll drop me!"],
        ['a', "I'll never drop you. Champions!"],
      ] },
    ],
    after: [
      { turns: [['b', "Best couple in the villa. It's official."], ['a', "We should get it on a T-shirt."]] },
      { turns: [], beat: "They're still grinning about it at dinner." },
    ],
  },
  notes: [
    { when: { rowedToday: true }, stage: "{a} and {b} put their row behind them and win the challenge together." },
    { stage: "{a} and {b} win the challenge." },
  ],
});
