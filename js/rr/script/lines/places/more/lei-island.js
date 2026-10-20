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
      { by: 'b', say: "Do the fish thing with your hands. Like a little arrow." },
      { by: 'a', say: "That's for diving in. Not for finding rings." },
      { by: 'b', say: "Then find the ring with your little arrow hands." },
    ] },
    { id: 'lei2.rd-s3', when: RD, turns: [
      { beat: '{a} sits on the edge of the pier, feet dangling, peering down at the sand through the clear water.' },
      { by: 'a', say: "There's a turtle down there." },
      { by: 'b', say: "Is the turtle wearing a ring?" },
      { by: 'a', say: "Not that I can see." },
    ] },
    { id: 'lei2.rd-s4', when: RD, turns: [
      { by: 'a', say: "How do I know a wedding ring from any other ring?" },
      { by: 'b', ...V("It'll be plain. Plain and gold. Married people are boring.", "Plain and gold. Married people are boring.", "Plain gold.", "PLAIN! GOLD! Married people are BORING!", "It'll be a plain gold one, married people like plain.", "It will look like a promise. And also like gold.") },
      { by: 'a', say: "My parents' rings have little diamonds." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'lei2.rd-f1', when: RD, turns: [
      { beat: '{a} surfaces with the ring held up between finger and thumb, like a jeweller showing it to the light.' },
      { by: 'b', say: "First dive! Swim it over!" },
      { by: 'a', say: "Hold on. I'm having a moment with it." },
    ] },
    { id: 'lei2.rd-f2', when: RD, turns: [
      { by: 'a', say: "It was sitting on a starfish. Like a little cushion." },
      { by: 'b', say: "The starfish was keeping it safe for you!" },
      { beat: '{a} hands the ring up onto the pier. The crew member checks it and gives them the tip.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'lei2.rd-a1', when: RD, turns: [
      { by: 'b', say: "Stop picking up shells to check. Run your fingers through the sand like a comb." },
      { beat: '{a} goes down and drags both hands through the sand. On the second sweep, something gold catches between {a.posAdj} fingers.' },
      { by: 'a', say: "A comb! I combed a ring out of the sea!" },
    ] },
    { id: 'lei2.rd-a2', when: RD, turns: [
      { beat: 'Five dives in, {a} floats on {a.posAdj} back for a full minute, breathing slowly, then goes down one more time.' },
      { by: 'b', say: "Was that a nap? Were you napping in the sea?" },
      { beat: '{a} comes back up and opens a fist. A gold ring.' },
      { by: 'a', say: "That was a rest. And then a ring." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'lei2.rd-t1', when: RD, turns: [
      { by: 'a', say: "Everything I pick up turns out to be a crab." },
      { by: 'b', say: "Then stop picking up crabs!" },
      { by: 'a', say: "They don't look like crabs until they wave!" },
    ] },
    { id: 'lei2.rd-t2', when: RD, turns: [
      { beat: '{a} holds onto the pier ladder, eyes red from the salt, staring at the water.' },
      { by: 'a', say: "My eyes sting. Everything's blurry. The pier's blurry. You're blurry." },
      { by: 'b', say: "I'm always a bit blurry. Go down again." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'lei2.rd-x1', when: RD, turns: [
      { beat: '{a} surfaces holding something round and gold. It is the ring pull from a can.' },
      { by: 'a', say: "Is it?" },
      { by: 'b', say: "It isn't. Somebody married a fizzy drink. Back down!" },
    ] },
    { id: 'lei2.rd-x2', when: RD, turns: [
      { beat: 'Halfway down, {a} runs out of air, turns round and kicks for the surface empty-handed.' },
      { by: 'b', say: "You were so close to the bottom!" },
      { by: 'a', say: "The bottom moved! Bigger breath this time!" },
    ] },
  ],
  'task-done.any': [
    { id: 'lei2.rd-dn1', when: RD, turns: [
      { by: 'a', say: "Somebody threw that away for luck, and now it's our luck." },
      { by: 'b', say: "That's not how luck works." },
      { by: 'a', say: "It is today." },
    ] },
    { id: 'lei2.rd-dn2', when: RD, turns: [
      { beat: '{a} shakes like a dog on the pier, and {b} gets most of it.' },
      { by: 'b', say: "Thanks. I'd been feeling left out." },
      { by: 'a', say: "Now we're both ready for the fire. Nice and damp." },
    ] },
    { id: 'lei2.rd-dn3', when: RD, turns: [
      { by: 'b', say: "Next tip says grass skirts." },
      { by: 'a', say: "I've got seaweed on me. Does seaweed count as a grass skirt?" },
      { by: 'b', say: "It's a start." },
    ] },
  ],
};

const fire = {
  'task-start.any': [
    { id: 'lei2.fw-s1', when: FW, turns: [
      { beat: '{a} ties the grass skirt on, does a test wiggle, and the whole thing rustles like a hedge.' },
      { by: 'b', say: "You sound like a shrub." },
      { by: 'a', say: "A shrub that's about to carry you over fire. Be nice to the shrub." },
    ] },
    { id: 'lei2.fw-s2', when: FW, turns: [
      { by: 'b', say: "Hold me in your arms. Like a bride. It's a wedding island." },
      { by: 'a', say: "Brides are lighter." },
      { by: 'b', say: "Brides are whatever weight they want to be. Pick me up." },
    ] },
    { id: 'lei2.fw-s3', when: FW, turns: [
      { beat: 'The fire dancer at the far end spins two flaming batons and grins at them.' },
      { by: 'a', say: "Why is he so happy?" },
      { by: 'b', say: "Because he's not the one walking. Climb on." },
    ] },
    { id: 'lei2.fw-s4', when: FW, turns: [
      { by: 'a', say: "Leis on. Both of them. If we lose a lei, we start again." },
      { by: 'b', say: "Do we? Is that a rule?" },
      { by: 'a', say: "It's my rule. Nothing comes off on the coals. Nothing." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'lei2.fw-f1', when: FW, turns: [
      { beat: '{a} crosses the coals in a stiff, fast march, knees high, {b} clinging on like a backpack.' },
      { by: 'b', say: "We're over! You marched us over!" },
      { by: 'a', say: "Like a soldier. A soldier in a grass skirt." },
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
      { by: 'a', say: "Follow the fire. I'll never forget that." },
    ] },
    { id: 'lei2.fw-a2', when: FW, turns: [
      { beat: 'This time {b} wraps both arms round {a}\'s neck and both legs round {a}\'s waist, and doesn\'t move a muscle.' },
      { by: 'a', say: "That's better. You're not wriggling." },
      { beat: 'A dozen quick steps, and they are across. The dancer hands over the tip.' },
      { by: 'b', say: "I was being a backpack. A good backpack." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'lei2.fw-t1', when: FW, turns: [
      { by: 'a', say: "My skirt's shedding. There's grass all over the coals." },
      { by: 'b', say: "Is the grass catching fire?" },
      { by: 'a', say: "Not yet! Don't say yet!" },
    ] },
    { id: 'lei2.fw-t2', when: FW, turns: [
      { beat: '{a} stands at the start of the coals with {b} on {a.posAdj} back, inching one toe forward and pulling it back.' },
      { by: 'b', say: "You've done that toe thing nine times." },
      { by: 'a', say: "The toe's not convinced yet." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'lei2.fw-x1', when: FW, turns: [
      { beat: 'Halfway over, {b}\'s lei slides off and lands on the coals with a sizzle and a smell of roasting flowers.' },
      { by: 'b', say: "My lei! My lovely lei!" },
      { by: 'a', say: "Get a new one! Back to the start!" },
    ] },
    { id: 'lei2.fw-x2', when: FW, turns: [
      { beat: '{a} takes three steps, yelps, and hops sideways off the coals onto the grass, with {b} still on {a.posAdj} back.' },
      { by: 'b', say: "Why are we on the grass?" },
      { by: 'a', say: "My feet chose the grass! Back to the start, and this time I'm in charge of my feet!" },
    ] },
  ],
  'task-done.any': [
    { id: 'lei2.fw-dn1', when: FW, turns: [
      { by: 'a', say: "Look at the soles of my feet. Are they black?" },
      { by: 'b', say: "They're a bit black." },
      { by: 'a', say: "Then I've done it. I'm a fire walker. It's official." },
    ] },
    { id: 'lei2.fw-dn2', when: FW, turns: [
      { beat: '{a} and {b} run for the tiki hut, grass skirts swishing, leis bouncing.' },
      { by: 'b', say: "Don's going to laugh at us." },
      { by: 'a', say: "Let him. We walked on fire. What did Don do today?" },
    ] },
    { id: 'lei2.fw-dn3', when: FW, turns: [
      { by: 'b', say: "Thank you for carrying me." },
      { by: 'a', say: "You're welcome. You owe me one fire." },
      { by: 'b', say: "I'll carry you over the next fire. If there's a next fire." },
    ] },
  ],
};

export default mergePools(ring, fire);
