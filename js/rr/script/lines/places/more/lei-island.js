// Lei Island, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/lei-island.js: at the pier, a dives for a wedding ring and b shouts
// from the pier; at the fire walk, both in grass skirts and leis, and one carries the other over the coals (mostly a
// carries b).
import { V, mergePools } from '../_kit.js';

const RD = { taskId: 'ring-dive' };
const FW = { taskId: 'fire-walk' };

const ring = {
  'task-start.any': [
    { id: 'lei2.rd-s1', when: RD, turns: [
      { beat: 'A pair of newlyweds at the end of the pier kiss and throw a ring into the bay. {a} watches exactly where it goes in.' },
      { by: 'a', say: "Did you see that? That one. I'm getting that one." },
      { by: 'b', say: "Go before it settles! Go, go, go!" },
    ] },
    { id: 'lei2.rd-s2', when: RD, turns: [
      { by: 'b', say: "Dive head first. Hands together." },
      { by: 'a', say: "I know how to dive." },
      { by: 'b', say: "Then go! Before it settles!" },
    ] },
    { id: 'lei2.rd-s3', when: RD, turns: [
      { beat: '{a} sits on the edge of the pier, feet dangling, peering down at the sand through the clear water.' },
      { by: 'a', say: "There's a turtle down there." },
      { by: 'b', say: "Is it near the rings?" },
      { by: 'a', say: "I don't know. I'll look." },
    ] },
    { id: 'lei2.rd-s4', when: RD, turns: [
      { by: 'a', say: "How do I know a wedding ring from any other ring?" },
      { by: 'b', say: "It'll be plain. Plain and gold, probably." },
      { by: 'a', say: "My parents' rings have little diamonds." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'lei2.rd-f1', when: RD, turns: [
      { beat: '{a} surfaces with the ring held up between finger and thumb.' },
      { by: 'b', say: "First dive! Swim it over!" },
      { by: 'a', say: "It's so pretty." },
    ] },
    { id: 'lei2.rd-f2', when: RD, turns: [
      { by: 'a', say: "It was sitting on a starfish." },
      { by: 'b', say: "That's amazing!" },
      { beat: '{a} hands the ring up onto the pier. The crew member checks it and gives them the tip.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'lei2.rd-a1', when: RD, turns: [
      { by: 'b', say: "Stop picking up shells to check. Run your fingers through the sand." },
      { beat: '{a} goes down and drags both hands through the sand. On the second sweep, something gold catches between {a.posAdj} fingers.' },
      { by: 'a', say: "I got it! I got a ring!" },
    ] },
    { id: 'lei2.rd-a2', when: RD, turns: [
      { beat: 'Five dives in, {a} floats on {a.posAdj} back for a full minute, breathing slowly, then goes down one more time.' },
      { by: 'b', say: "What are you doing?" },
      { beat: '{a} comes back up and opens a fist. A gold ring.' },
      { by: 'a', say: "I just needed a rest." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'lei2.rd-t1', when: RD, turns: [
      { by: 'a', say: "Everything I pick up is a shell." },
      { by: 'b', say: "Then pick up something else!" },
      { by: 'a', say: "Everything looks like a ring under there!" },
    ] },
    { id: 'lei2.rd-t2', when: RD, turns: [
      { beat: '{a} holds onto the pier ladder, eyes red from the salt, staring at the water.' },
      { by: 'a', say: "My eyes sting. Everything's blurry." },
      { by: 'b', say: "Rub them. Then go down again." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'lei2.rd-x1', when: RD, turns: [
      { beat: '{a} surfaces holding something round and gold. It\'s the ring pull from a can.' },
      { by: 'a', say: "Is it?" },
      { by: 'b', say: "It isn't. It's a ring pull. Back down!" },
    ] },
    { id: 'lei2.rd-x2', when: RD, turns: [
      { beat: 'Halfway down, {a} runs out of air, turns round and kicks for the surface empty-handed.' },
      { by: 'b', say: "You were so close to the bottom!" },
      { by: 'a', say: "It's so deep! Bigger breath this time!" },
    ] },
  ],
  'task-done.any': [
    { id: 'lei2.rd-dn1', when: RD, turns: [
      { by: 'a', say: "Somebody threw that in for luck, and now it's helped us." },
      { by: 'b', say: "I like that." },
      { by: 'a', say: "Come on. Coals next." },
    ] },
    { id: 'lei2.rd-dn2', when: RD, turns: [
      { beat: '{a} shakes off the water on the pier, and {b} gets wet.' },
      { by: 'b', say: "Hey! Thanks." },
      { by: 'a', say: "Sorry. Come on." },
    ] },
    { id: 'lei2.rd-dn3', when: RD, turns: [
      { by: 'b', say: "Next tip says grass skirts." },
      { by: 'a', say: "Grass skirts. Okay." },
      { by: 'b', say: "And then the coals." },
    ] },
  ],
};

const fire = {
  'task-start.any': [
    { id: 'lei2.fw-s1', when: FW, turns: [
      { beat: '{a} ties the grass skirt on and does a test wiggle.' },
      { by: 'b', say: "You look amazing." },
      { by: 'a', say: "Thanks. Now get on." },
    ] },
    { id: 'lei2.fw-s2', when: FW, turns: [
      { by: 'b', say: "Hold me in your arms. Like a bride. It's a wedding island." },
      { by: 'a', say: "You're heavier than a bride." },
      { by: 'b', say: "Rude. Pick me up." },
    ] },
    { id: 'lei2.fw-s3', when: FW, turns: [
      { beat: 'The fire dancer at the far end spins two flaming batons and grins at them.' },
      { by: 'a', say: "Why is he so happy?" },
      { by: 'b', say: "Because he's not the one walking. Climb on." },
    ] },
    { id: 'lei2.fw-s4', when: FW, turns: [
      { by: 'a', say: "Leis on. Both of them. If we lose a lei, we start again." },
      { by: 'b', say: "Do we? Is that a rule?" },
      { by: 'a', say: "No. But let's not lose them." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'lei2.fw-f1', when: FW, turns: [
      { beat: '{a} crosses the coals in a fast march, knees high, {b} clinging on.' },
      { by: 'b', say: "We're over! You marched us over!" },
      { by: 'a', say: "I don't know how, but we did." },
    ] },
    { id: 'lei2.fw-f2', when: FW, turns: [
      { by: 'a', say: "Talk to me the whole way. Anything. Distract me." },
      { by: 'b', say: "Our first holiday, the tent blew away, and you chased it for a mile..." },
      { beat: 'By the time the story ends, they are across. The fire dancer hands over the tip.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'lei2.fw-a1', when: FW, turns: [
      { by: 'b', say: "You stop because you look down. Look at the dancer's batons. Follow the fire." },
      { beat: '{a} follows the spinning batons with both eyes, walks straight across, and never looks down once.' },
      { by: 'a', say: "That worked." },
    ] },
    { id: 'lei2.fw-a2', when: FW, turns: [
      { beat: 'This time {b} wraps both arms round {a}\'s neck and both legs round {a}\'s waist, and doesn\'t move a muscle.' },
      { by: 'a', say: "That's better. You're not wriggling." },
      { beat: 'A dozen quick steps, and they are across. The dancer hands over the tip.' },
      { by: 'b', say: "I didn't move once." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'lei2.fw-t1', when: FW, turns: [
      { by: 'a', say: "My skirt's shedding. There's grass all over the coals." },
      { by: 'b', say: "Is the grass catching fire?" },
      { by: 'a', say: "Not yet! Just hurry!" },
    ] },
    { id: 'lei2.fw-t2', when: FW, turns: [
      { beat: '{a} stands at the start of the coals with {b} on {a.posAdj} back, inching one toe forward and pulling it back.' },
      { by: 'b', say: "You keep doing that." },
      { by: 'a', say: "I know. I'm scared." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'lei2.fw-x1', when: FW, turns: [
      { beat: 'Halfway over, {b}\'s lei slides off and lands on the coals.' },
      { by: 'b', say: "My lei! It fell off!" },
      { by: 'a', say: "Get a new one! Back to the start!" },
    ] },
    { id: 'lei2.fw-x2', when: FW, turns: [
      { beat: '{a} takes three steps, yelps, and hops sideways off the coals onto the grass, with {b} still on {a.posAdj} back.' },
      { by: 'b', say: "Why are we on the grass?" },
      { by: 'a', say: "I couldn't stand it! Back to the start!" },
    ] },
  ],
  'task-done.any': [
    { id: 'lei2.fw-dn1', when: FW, turns: [
      { by: 'a', say: "Look at the soles of my feet. Are they black?" },
      { by: 'b', say: "They're a bit black." },
      { by: 'a', say: "I walked on fire. I actually walked on fire." },
    ] },
    { id: 'lei2.fw-dn2', when: FW, turns: [
      { beat: '{a} and {b} run for the tiki hut, grass skirts swishing, leis bouncing.' },
      { by: 'b', say: "Don's going to laugh at us." },
      { by: 'a', say: "Let him. We walked on fire." },
    ] },
    { id: 'lei2.fw-dn3', when: FW, turns: [
      { by: 'b', say: "Thank you for carrying me." },
      { by: 'a', say: "You're welcome. You owe me." },
      { by: 'b', say: "I'll carry you next time." },
    ] },
  ],
};

export default mergePools(ring, fire);
