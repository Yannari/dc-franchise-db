// ══════════════════════════════════════════════════════════════════════
// pm/talk/sports-day.js — the draft and the events of Sports Day (challenges-more.js)
// ══════════════════════════════════════════════════════════════════════
//   sports-pick  [a, b, (c)]  captain a picks b. `of`: partner · last (b was picked last)
//                             · stir (b is the other captain c's partner)
//   sports-race  [a, b, (c)]  a beat b. `of`: sack · egg · tug (a and b are the captains);
//                             `how`: clean · fall (b fell) · cheat (a cheated); c is a's partner
import { build } from './build.js';

export const SPORTS_PICK = build('sports-pick', {
  tiered: false,
  plans: { featured: ['pick', 'land?'], short: ['pick'] },
  moves: {
    pick: [
      { when: { of: 'partner' }, turns: [['a', "First pick. Obviously. Get over here, {b}."], ['b', "If you'd picked anyone else, I'd have gone home tonight."]] },
      { when: { of: 'partner' }, turns: [['a', "{b}. Don't even look surprised."], ['b', "I'm not surprised. I'm relieved."]] },
      { when: { of: 'partner' }, turns: [['a', "I'm going with my heart, and my heart says {b}."], ['b', "Your heart can't run, though."], ['a', "Neither can you. We'll lose together."]] },
      { when: { of: 'last' }, stage: "It's down to the last one standing, and that's {b}.", turns: [['a', "And… {b}. Welcome to the team!"], ['b', "Last. Last! I'll remember that."]] },
      { when: { of: 'last' }, stage: "{b} is the only one left standing on the lawn, arms folded.", turns: [['a', "Come on, then, {b}. I was saving the best till last."], ['b', "No, you weren't."]] },
      { when: { of: 'stir' }, stage: "{a} looks straight at {c}, and smiles.", turns: [['a', "I'll have {b}."], ['c', "Are you serious?"], ['a', "It's sports day. I'm picking the best players. Nothing personal."]] },
      { when: { of: 'stir' }, turns: [['a', "{b}. Come here."], ['c', "That's my partner."], ['a', "Not today, it isn't."]] },
    ],
    land: [
      { when: { of: 'stir' }, turns: [], beat: "{c} spends the rest of the draft glaring at {a}, and doesn't stop." },
      { when: { of: 'last' }, turns: [], beat: "{b} jogs over and stands at the very back of the team." },
    ],
  },
});
SPORTS_PICK.facts = () => ({ cAway: false });

export const SPORTS_RACE = build('sports-race', {
  tiered: false,
  plans: { featured: ['race', 'cheer?', 'land?'], short: ['race'] },
  moves: {
    race: [
      { when: { of: 'sack', how: 'clean' }, stage: "The sack race. {a} and {b} hop down the lawn side by side, and {a} pulls ahead at the end.", turns: [['a', "Yes! Point to us!"]] },
      { when: { of: 'sack', how: 'fall' }, stage: "The sack race. {b} is level with {a} for about two hops, and then goes face first onto the lawn.", turns: [['b', "I'm fine. I'm fine! Don't film me."]] },
      { when: { of: 'sack', how: 'cheat' }, stage: "The sack race. {a} is out of the sack and running before anyone can say anything.", turns: [['b', "That's cheating! {a} got out of the sack!"], ['a', "Where does it say I can't?"]] },
      { when: { of: 'egg', how: 'clean' }, stage: "The egg and spoon. {a} walks the whole way, very slowly, and the egg never moves.", turns: [['b', "How? How is it not moving?"], ['a', "Focus. Something you wouldn't know about."]] },
      { when: { of: 'egg', how: 'fall' }, stage: "The egg and spoon. {b}'s egg lasts four steps, and then it's on the lawn.", turns: [['b', "The spoon was wonky!"], ['a', "The spoon was fine."]] },
      { when: { of: 'egg', how: 'cheat' }, stage: "The egg and spoon. {a} crosses the line with a thumb very firmly on the egg.", turns: [['b', "Thumb! {a}'s got a thumb on it!"], ['a', "That's just how I hold spoons."]] },
      { when: { of: 'tug' }, stage: "The tug of war. Everyone on the rope, and the two teams pulling until somebody's feet go.", turns: [['a', "Pull! Come on, pull as hard as you can!"], ['b', "Dig your feet in and hold it!"]], beat: "{b}'s team goes down in a heap, and {a}'s goes over on top of them." },
    ],
    cheer: [
      { when: { cast: 3 }, turns: [['c', "That's my partner! Did everyone see that?"]] },
      { when: { cast: 3, how: ['cheat'] }, turns: [['c', "It counts. It definitely counts."], ['b', "Of course you'd say that."]] },
    ],
    land: [
      { when: { how: 'cheat' }, turns: [], beat: "The point stands. {b} doesn't let it go for the rest of the afternoon." },
      { turns: [], beat: "The scoreboard gets updated with a marker pen, and somebody argues about it." },
    ],
  },
});
SPORTS_RACE.facts = (state, ev) => ({ how: ev.extra?.how || null });
