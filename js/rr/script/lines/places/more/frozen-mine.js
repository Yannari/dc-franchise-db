// Frozen Mine, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/frozen-mine.js: on the frozen lake, both in swimsuits, one steers
// the ice yacht and one works the sail (tip over, spin out or go the wrong way, and drag it back to the start); at the
// mine, a is lowered down the borehole on a winch with a headlamp to find the one red ball among the white ones, and
// b works the winch and can only shout down the shaft.
import { V, mergePools } from '../_kit.js';

const IY = { taskId: 'ice-yacht' };
const BH = { taskId: 'borehole' };

const yacht = {
  'task-start.any': [
    { id: 'fzm2.iy-s1', when: IY, turns: [
      { beat: '{a} steps out of the changing tent in a swimsuit and snow boots, and a gust of wind hits {a.obj} like a door.' },
      { by: 'a', say: "Nope. My body says nope." },
      { by: 'b', say: "My body said nope ten seconds ago. Get on the yacht." },
    ] },
    { id: 'fzm2.iy-s2', when: IY, turns: [
      { by: 'b', say: "Sit low. Lean in when we turn. If we lean out, we go over." },
      { by: 'a', say: "Lean in, onto the ice?" },
      { by: 'b', say: "Lean in towards the middle! Not onto anything!" },
    ] },
    { id: 'fzm2.iy-s3', when: IY, turns: [
      { beat: 'The sail fills with a snap, and the yacht jumps forward so fast that {a} grabs the side with both hands.' },
      { by: 'a', say: "It's going! Nobody's steering and it's going!" },
      { by: 'b', say: "You're steering! The stick! The stick by your hand!" },
    ] },
    { id: 'fzm2.iy-s4', when: IY, turns: [
      { by: 'a', say: "Do we get towels at the other end?" },
      { by: 'b', ...V("We get a tip at the other end. Towels are a dream.", "We get a tip. Towels are a dream.", "Tip. No towels.", "We get a TIP! Towels are a DREAM!", "We get a tip at the other end, I don't think towels are coming.", "There are no towels in this country. Only tips.") },
      { by: 'a', say: "Then I'm sailing towards a dream." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fzm2.iy-f1', when: IY, turns: [
      { beat: 'The yacht skims straight across the lake, hissing on its skates, and slides to a stop right in front of the mine gate.' },
      { by: 'b', say: "Parked it! Like a car!" },
      { by: 'a', say: "Like a car with no doors, roof, heating or clothes!" },
    ] },
    { id: 'fzm2.iy-f2', when: IY, turns: [
      { by: 'a', say: "Pull now! Let it out! Pull!" },
      { beat: '{b} pulls and lets out the rope exactly when {a} says, all the way across the ice. They arrive first time, blue but upright.' },
      { by: 'b', say: "We're a crew! A proper sailing crew!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fzm2.iy-a1', when: IY, turns: [
      { by: 'a', say: "Every time the wind gusts, you pull harder. Let it out when it gusts." },
      { by: 'b', say: "That feels wrong." },
      { beat: 'It feels wrong, and it works. The yacht stays flat on the ice all the way to the mine.' },
      { by: 'b', say: "Wrong is right on a lake!" },
    ] },
    { id: 'fzm2.iy-a2', when: IY, turns: [
      { beat: 'After the second spin-out, {b} ties a scarf to the top of the mast to see which way the wind is blowing.' },
      { by: 'b', say: "Now we can see it. Wind that way, sail this way." },
      { beat: 'Following the scarf, they reach the mine gate on the third run. The scarf is frozen solid.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'fzm2.iy-t1', when: IY, turns: [
      { by: 'a', say: "My legs have gone blotchy. Red and white, like a map." },
      { by: 'b', say: "A map of where?" },
      { by: 'a', say: "Of somewhere much colder than I'd like!" },
    ] },
    { id: 'fzm2.iy-t2', when: IY, turns: [
      { beat: 'The yacht is going across the lake, beautifully, very fast, in completely the wrong direction.' },
      { by: 'b', say: "Is the mine behind us?" },
      { by: 'a', say: "Everything is behind us. We're going towards some trees." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fzm2.iy-x1', when: IY, turns: [
      { beat: 'The yacht lifts on one skate, hangs there for a long second, and gently lays itself down on its side. {a} and {b} slide off onto the ice.' },
      { by: 'a', say: "The ice is so cold! Why is the ice so cold?" },
      { by: 'b', say: "Because it's ice! Drag it back! Again!" },
    ] },
    { id: 'fzm2.iy-x2', when: IY, turns: [
      { beat: 'The rope whips out of {b}\'s frozen fingers, the sail flaps loose, and the yacht spins round in a lazy circle and stops.' },
      { by: 'b', say: "My hands just opened. I didn't tell them to." },
      { by: 'a', say: "Back to the start! Sit on your hands on the way!" },
    ] },
  ],
  'task-done.any': [
    { id: 'fzm2.iy-dn1', when: IY, turns: [
      { beat: '{a} and {b} sprint to the bag of clothes at the gate and put on everything in it, including each other\'s hats.' },
      { by: 'b', say: "That's my hat." },
      { by: 'a', say: "Possession is nine tenths of being warm." },
    ] },
    { id: 'fzm2.iy-dn2', when: IY, turns: [
      { by: 'a', say: "Next is a borehole. Deep under the ice." },
      { by: 'b', say: "Is it warmer down there?" },
      { by: 'a', say: "It's deeper down there. I don't know about warmer." },
    ] },
    { id: 'fzm2.iy-dn3', when: IY, turns: [
      { by: 'b', say: "We sailed. In swimsuits. Across a lake made of ice." },
      { by: 'a', say: "It sounds like a holiday when you say it fast." },
      { by: 'b', say: "Never say it slowly. Never." },
    ] },
  ],
};

const borehole = {
  'task-start.any': [
    { id: 'fzm2.bh-s1', when: BH, turns: [
      { beat: '{a} clips into the harness, switches on the headlamp, and looks down the shaft. The light doesn\'t reach the bottom.' },
      { by: 'a', say: "The light just stops. It gives up." },
      { by: 'b', say: "Then you'll have to go and find where it gave up." },
    ] },
    { id: 'fzm2.bh-s2', when: BH, turns: [
      { by: 'b', say: "Two tugs on the rope means pull you up. One tug means stop." },
      { by: 'a', say: "And three tugs?" },
      { by: 'b', say: "Three tugs means you're panicking. I'll pull you up for that too." },
    ] },
    { id: 'fzm2.bh-s3', when: BH, turns: [
      { beat: 'The winch creaks. {a} sinks into the hole, very slowly, until only the top of the headlamp is showing.' },
      { by: 'a', say: "Talk to me. Tell me anything." },
      { by: 'b', say: "There's a sauna at the end of today." },
      { by: 'a', say: "Keep talking about the sauna." },
    ] },
    { id: 'fzm2.bh-s4', when: BH, turns: [
      { by: 'a', say: "Am I at the bottom yet?" },
      { by: 'b', say: "You've been going for ten seconds." },
      { by: 'a', say: "It feels like a lot more than ten seconds in here!" },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fzm2.bh-f1', when: BH, turns: [
      { beat: 'At the bottom, {a} sweeps the headlamp round once. In the middle of a sea of white balls, one red one glows like a cherry.' },
      { by: 'a', say: "Cherry! I mean red! I mean pull me up!" },
      { by: 'b', say: "Winching! Winching as fast as I've ever winched!" },
    ] },
    { id: 'fzm2.bh-f2', when: BH, turns: [
      { by: 'b', say: "What's happening down there? Talk to me!" },
      { beat: '{a} comes up out of the hole, holding the red ball up in front of the headlamp so it lights up like a lantern.' },
      { by: 'a', say: "This is happening. First go." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fzm2.bh-a1', when: BH, turns: [
      { by: 'b', say: "Stop picking up balls to look at them. Lie down and look across the top of them." },
      { beat: '{a} lies flat on the pile and looks along it with the headlamp. One ball, at the far wall, catches the light red.' },
      { by: 'a', say: "Across the top! It's there! It's red! Pull!" },
    ] },
    { id: 'fzm2.bh-a2', when: BH, turns: [
      { beat: 'On the third trip down, {a} takes the balls one handful at a time and throws the white ones to one side of the cavern.' },
      { by: 'a', say: "White pile, not-yet pile. White pile, not-yet pile." },
      { beat: 'Halfway through the not-yet pile, red. {b} winches {a} up into the light.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'fzm2.bh-t1', when: BH, turns: [
      { by: 'a', say: "There's an echo down here. Everything I say, it says back." },
      { by: 'b', say: "What does it say?" },
      { by: 'a', say: "It says 'red ball' a lot. It's as desperate as I am." },
    ] },
    { id: 'fzm2.bh-t2', when: BH, turns: [
      { beat: 'At the top, {b} leans right over the hole, shouting down into the dark, and hears only dripping water.' },
      { by: 'b', say: "Are you looking? Tell me you're looking!" },
      { beat: 'Far below, faintly, {a} shouts back up the shaft.' },
      { by: 'a', say: "I'm looking! They're all white! All of them!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fzm2.bh-x1', when: BH, turns: [
      { beat: '{a} comes up out of the hole, pushes up the headlamp and looks at the ball properly. It is pink. Very pale pink. Basically white.' },
      { by: 'a', say: "It's nearly red! It's on its way to red!" },
      { by: 'b', say: "It's white with a blush. Back down!" },
    ] },
    { id: 'fzm2.bh-x2', when: BH, turns: [
      { beat: 'Halfway up, {a} sneezes, and the ball drops out of {a.posAdj} hand and bounces back down into the dark.' },
      { by: 'b', say: "Was that the red one?" },
      { by: 'a', say: "I'm not going to tell you. Just lower me back down." },
    ] },
  ],
  'task-done.any': [
    { id: 'fzm2.bh-dn1', when: BH, turns: [
      { beat: '{a} climbs out of the harness and sits down on the snow, staring at the red ball in {a.posAdj} hands.' },
      { by: 'a', say: "I'm going to name it." },
      { by: 'b', say: "Name it on the way to the sauna." },
    ] },
    { id: 'fzm2.bh-dn2', when: BH, turns: [
      { by: 'b', say: "My arms are noodles. Winching noodles." },
      { by: 'a', say: "You winched me out of the earth. Those are heroic noodles." },
      { by: 'b', say: "I'll take heroic noodles." },
    ] },
    { id: 'fzm2.bh-dn3', when: BH, turns: [
      { beat: '{a} and {b} run along the snowy path towards the lights of the sauna, steam rising from its chimney.' },
      { by: 'a', say: "Can you see the steam? That's warm air. That's real warm air." },
      { by: 'b', say: "I can see it. I want to live in it." },
    ] },
  ],
};

export default mergePools(yacht, borehole);
