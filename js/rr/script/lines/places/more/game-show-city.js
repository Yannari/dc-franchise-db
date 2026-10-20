// Game Show City, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/game-show-city.js: the partners take turns being the ball in the
// padded suit while the other works the flippers; five lit targets before the timer, and the panda never helps.
import { V, mergePools } from '../_kit.js';

const PB = { taskId: 'pinball' };

const pinball = {
  'task-start.any': [
    { id: 'gsc2.pb-s5', when: PB, turns: [
      { beat: 'A stagehand zips {a} into the padded suit and pats the top of {a.posAdj} head, like a melon.' },
      { by: 'a', say: "Did he just check if I'm ripe?" },
      { by: 'b', say: "He's checking you'll bounce." },
      { by: 'a', say: "I don't want to be the kind of person who bounces." },
    ] },
    { id: 'gsc2.pb-s6', when: PB, turns: [
      { beat: '{b} grips the two flipper buttons. They are the size of dinner plates.' },
      { by: 'b', say: "Left button, left flipper. Right button, right flipper." },
      { by: 'a', say: "You're saying it like it's hard." },
      { by: 'b', say: "I'm saying it so I don't forget." },
    ] },
    { id: 'gsc2.pb-s7', when: PB, turns: [
      { by: 'a', ...V("How far back does the plunger go? Because it looks like it goes really far back.", "How far back does that go?", "How far back?", "How FAR does that plunger GO back?!", "I'd just like to know how far back that plunger goes, please.", "That plunger has seen things.") },
      { beat: 'The stagehand pulls the plunger back. It keeps going. It keeps going.' },
      { by: 'b', say: "Wave to me on your way past!" },
    ] },
    { id: 'gsc2.pb-s8', when: PB, turns: [
      { beat: 'The giant scoreboard above the table plays a jingle, and a voice shouts the team\'s names wrong.' },
      { by: 'b', say: "That's not even close to our names." },
      { by: 'a', say: "Let them have it. That's who we are now." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsc2.pb-f5', when: PB, turns: [
      { beat: '{a} pings off the top bumpers like a cork in a storm: ding, ding, ding, ding. {b} flips the last bounce up into the fifth target.' },
      { by: 'b', say: "That's five! Get that ball out of there!" },
      { by: 'a', say: "I can hear bells. Are those real bells?" },
    ] },
    { id: 'gsc2.pb-f6', when: PB, turns: [
      { by: 'a', say: "I'm going to keep my arms in. Arms in, eyes shut, think round thoughts." },
      { beat: 'Arms in, eyes shut, {a} rolls neatly through every lane on the board, and all five targets light.' },
      { by: 'b', say: "The round thoughts worked!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gsc2.pb-a5', when: PB, turns: [
      { by: 'b', say: "Last ball, you came down the left side every time. So I'm only watching left." },
      { beat: '{a} comes down the left. {b} is ready, and sends {a} flying up the ramp into the last two targets.' },
      { by: 'a', say: "You read me like a book!" },
      { by: 'b', say: "A very round, very loud book." },
    ] },
    { id: 'gsc2.pb-a6', when: PB, turns: [
      { beat: 'This time, when the panda wanders into the middle of the table, {a} bounces off him on purpose.' },
      { by: 'a', say: "Use the panda! The panda is a bumper!" },
      { beat: 'Panda, bumper, bumper, target. The fifth target lights and the studio buzzer goes wild.' },
      { by: 'b', say: "You used the panda! Nobody uses the panda!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gsc2.pb-t4', when: PB, turns: [
      { beat: '{a} is wedged in the gap behind a bumper, arms and legs sticking out, wriggling.' },
      { by: 'a', say: "I'm not stuck. I'm resting in a hole." },
      { by: 'b', say: "The timer's running! Rest faster!" },
    ] },
    { id: 'gsc2.pb-t5', when: PB, turns: [
      { by: 'b', say: "Which target's still dark? I can't tell from down here." },
      { by: 'a', say: "The one by the panda's foot." },
      { by: 'b', say: "Then you're going to have to go and say hello to the panda." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsc2.pb-x4', when: PB, turns: [
      { beat: '{b} hits both flipper buttons at once, a full second late. {a} rolls straight between them and into the drain.' },
      { by: 'a', say: "Both buttons? You pressed both buttons?" },
      { by: 'b', say: "I panicked! New ball, new ball!" },
    ] },
    { id: 'gsc2.pb-x5', when: PB, turns: [
      { beat: 'The plunger launches {a} so hard {a.sub} sail over the whole top of the table and slide down the back of the set.' },
      { by: 'a', say: "Is that out? That feels out." },
      { by: 'b', say: "That's very out. Back to the plunger!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gsc2.pb-dn4', when: PB, turns: [
      { beat: 'On the way out, the panda follows {a} and {b} to the studio door and offers them a high five.' },
      { by: 'a', say: "Don't. Don't high-five the panda." },
      { by: 'b', say: "It's rude not to." },
      { by: 'a', say: "He drained us twice!" },
    ] },
    { id: 'gsc2.pb-dn5', when: PB, turns: [
      { by: 'b', say: "I want to go home and play pinball, now I know how the ball feels." },
      { by: 'a', say: "Be kind to it." },
      { by: 'b', say: "I'll never let it drain again." },
    ] },
    { id: 'gsc2.pb-dn6', when: PB, turns: [
      { beat: 'The scoreboard flashes a score with eleven digits in it as {a} and {b} leave.' },
      { by: 'a', say: "Is that good? Is that a lot of points?" },
      { by: 'b', say: "It's a lot of numbers. I'm taking it." },
    ] },
  ],
};

export default mergePools(pinball);
