// ══════════════════════════════════════════════════════════════════════
// pm/talk/hideaway.js — the Hideaway night (pm/villa-day.js hideawayNight)
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%").
//   hideaway-text     [a, b]        a reads the text; b is a's partner
//   hideaway-vote     [a, b, c, d]  couple a and b give their vote to c and d
//   hideaway-win      [a, b]        the winners
//   hideaway-snub     [a, b]        the couple most into each other, with no votes
//   hideaway          [a, b]        the night itself
//   hideaway-morning  [a, b, c]     the next morning: a grills b about the night with c
import { build } from './build.js';

export const HIDEAWAY_TEXT = build('hideaway-text', {
  plans: { featured: ['text', 'react', 'land?'], short: ['text', 'land?'] },
  moves: {
    text: [
      { stage: "{a}'s phone goes off, and the villa crowds round.", turns: [['a', "I got a text! 'Islanders, tonight one lucky couple will be spending the night in the Hideaway. And you get to decide who. #BehindClosedDoors.'"]] },
      { stage: "{a} reads it out, grinning before the end of the first line.", turns: [['a', "'Islanders, please gather on the terrace. Tonight, you'll vote for the couple you think deserves a night in the Hideaway. #DoNotDisturb.'"]] },
      { turns: [['a', "Everyone, stop. Text. 'Islanders, the Hideaway is open tonight, and it's up to you which couple gets the keys. #PrivateTime.'"]] },
    ],
    react: [
      { turns: [['b', "Please be us. Please be us. Please, please be us."], ['a', "You can't vote for yourself."], ['b', "Says who?"]] },
      { turns: [['b', "Oh, this is going to cause drama. Somebody's going to be really upset tonight."], ['a', "As long as it's not us."]] },
      { turns: [['b', "A night with a door that shuts. I'd forgotten what a door that shuts even looks like."]] },
    ],
    land: [
      { turns: [], beat: "Every couple in the villa looks at every other couple, and starts doing maths." },
      { turns: [], beat: "Two islanders immediately start campaigning, very badly." },
    ],
  },
});

export const HIDEAWAY_VOTE = build('hideaway-vote', {
  plans: { featured: ['pick', 'why', 'land?'], short: ['pick', 'land?'] },
  moves: {
    pick: [
      { turns: [['a', "We both said the same couple straight away. Didn't even have to talk about it. {c} and {d}."]] },
      { turns: [['b', "This is so hard. Honestly, we'd love it to be us, obviously. But we're going with {c} and {d}."]] },
      { turns: [['a', "Our vote goes to {c} and {d}. Sorry, everyone else. It's not even close."]] },
    ],
    why: [
      { turns: [['b', "They look at each other like nobody else is in the villa. Some nights it's honestly a bit much. They deserve a room where it isn't."], ['c', "Is that a compliment?"], ['b', "Mostly."]] },
      { turns: [['a', "If anyone's earned a night without the rest of us snoring, it's them. They've had a hard week, and they came out of it stronger."]] },
      { turns: [['b', "They've been there for us since day one. Every time it's gone wrong for us, they've been the ones on the end of the bed."], ['d', "Stop it. You'll make me cry."]] },
      { turns: [['a', "They need some time on their own, just the two of them. Away from all of us. Especially away from all of us."]] },
    ],
    land: [
      { turns: [], beat: "{c} and {d} are both blushing, and holding hands a little tighter." },
      { turns: [], beat: "The villa laughs, and {d} blows them a kiss." },
    ],
  },
});

export const HIDEAWAY_WIN = build('hideaway-win', {
  tiered: false,
  plans: { featured: ['called', 'go', 'land'], short: ['called', 'land'] },
  moves: {
    called: [
      { stage: "The votes are in, and the villa has chosen: {a} and {b}.", turns: [['a', "Us? Really? Actually us?"], ['b', "Come on. Quick. Before they change their minds."]] },
      { stage: "{a} and {b} have the most votes, and the terrace erupts.", turns: [['b', "I'm not going to lie, I really, really wanted this."], ['a', "Me too. I've been wanting it since the text."]] },
      { stage: "It's {a} and {b}. The villa goes wild.", turns: [['a', "Thank you, everyone. Genuinely. We won't be telling you a single thing tomorrow."]] },
    ],
    go: [
      { turns: [['b', "Do I need to pack? What do you pack for one night? I'm taking my pillow."], ['a', "There'll be pillows."], ['b', "Not like mine."]] },
      { turns: [['a', "Is it weird that I'm nervous? It's just a room."], ['b', "It's not just a room. It's a room without twenty people in it."]] },
    ],
    land: [
      { turns: [], beat: "The whole villa cheers them all the way up the stairs." },
      { turns: [], beat: "Somebody wolf-whistles as they go, and nobody believes they won't be telling." },
    ],
  },
});

export const HIDEAWAY_SNUB = build('hideaway-snub', {
  plans: { featured: ['notice', 'talk', 'land?'], short: ['notice', 'talk'] },
  moves: {
    notice: [
      { stage: "While the villa celebrates, {a} and {b} sit a little apart from everyone. They didn't get a single vote.", turns: [] },
      { stage: "The votes are read out, and {a} and {b}'s names never come up. Not once.", turns: [] },
    ],
    talk: [
      { turns: [['a', "Not one. Not one vote. I thought we were the obvious couple."], ['b', "It doesn't matter what they think."], ['a', "It matters a bit."]] },
      { turns: [['b', "I'm not upset. I'm just interested. I'm interested in who our friends are."], ['a', "That's upset."], ['b', "It's a bit upset."]] },
      { turns: [['a', "We'll get our turn."], ['b', "Will we? Because that felt like the villa saying something."]] },
    ],
    land: [
      { turns: [], beat: "{b} goes to bed early, and leaves the door open in case anyone wants to say sorry." },
      { turns: [], beat: "{a} watches the stairs until the Hideaway lights go off." },
    ],
  },
});

export const HIDEAWAY = build('hideaway', {
  tiered: false,
  plans: { featured: ['arrive', 'talk', 'land'], short: ['arrive', 'land'] },
  moves: {
    arrive: [
      { stage: "The Hideaway. The door shuts, and for the first time in weeks, there's nobody else.", turns: [['a', "It's so quiet."], ['b', "I'd forgotten what quiet sounds like. I can hear my own thoughts. I don't like it."]] },
      { stage: "There are rose petals on the bed and two glasses out on the side.", turns: [['b', "They've gone all out."], ['a', "So should we."]] },
      { stage: "The Hideaway. The hot tub is on and the lights are low.", turns: [['a', "Finally."], ['b', "Nobody's going to walk in. Nobody's going to ask for the sun cream."]] },
    ],
    talk: [
      { turns: [['a', "A whole night. Just us."], ['b', "No microphones by the bed."], ['a', "There are definitely microphones by the bed."], ['b', "Then we'll whisper."]] },
      { when: { rung: ['exclusive', 'official'] }, turns: [['a', "This is the first time I've felt like we're a normal couple. Doing normal couple things."], ['b', "A normal couple, in a room with cameras in the ceiling."], ['a', "It still counts."]] },
      { turns: [['b', "Can I tell you something? I was worried we wouldn't get this. That the villa didn't see us like I see us."], ['a', "They see it. Everybody sees it."]] },
      { turns: [['a', "What do we even do with a whole night?"], ['b', "I've got a few ideas."], ['a', "Have you now."]] },
    ],
    land: [
      { turns: [], beat: "They laugh, and then they stop talking." },
      { turns: [], beat: "The lights go down, and the camera very politely looks at the ceiling." },
      { turns: [], beat: "The covers go over their heads, and that is the end of the broadcast." },
    ],
  },
});

export const HIDEAWAY_MORNING = build('hideaway-morning', {
  plans: { featured: ['catch', 'grill', 'land?'], short: ['catch', 'grill'] },
  moves: {
    catch: [
      { stage: "Breakfast. {b} comes down, and the whole kitchen goes quiet at once.", turns: [['a', "So?"], ['b', "So what?"]] },
      { stage: "{a} corners {b} by the coffee machine before {b} has even got a cup.", turns: [['a', "Details. Now. All of them."]] },
      { stage: "{b} walks out onto the lawn in last night's outfit, and {a} is already waiting.", turns: [['a', "Good morning. Very good morning, by the look of it."]] },
    ],
    grill: [
      { turns: [['b', "I'm not telling you anything."], ['a', "You've been smiling since you came down the stairs."], ['b', "It was just nice to get a good night's sleep."], ['a', "A good night's sleep. Sure."]] },
      { turns: [['b', "We talked. For hours. That's all you're getting."], ['a', "Talked."], ['b', "Mostly talked."]] },
      { turns: [['a', "Did {c} snore?"], ['b', "I'm not answering that."], ['a', "That's a yes. That's definitely a yes."]] },
      { turns: [['a', "On a scale of one to ten."], ['b', "I'm not doing a scale."], ['a', "Eleven. I can see it on your face. It's an eleven."]] },
    ],
    land: [
      { turns: [], beat: "The kitchen laughs, and {b} hides behind a mug." },
      { turns: [], beat: "{c} walks in, and everyone suddenly finds the toaster fascinating." },
    ],
  },
});
