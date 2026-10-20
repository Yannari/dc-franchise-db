// Dragon Isle, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/dragon-isle.js: under the stilt huts, b keeps a monitor lizard
// looking at the forked stick while a creeps in with the sponge on a pole and squeezes its drool into the vial (a
// lizard that wakes, hisses or charges sends them running; a spilled vial starts again); in the jungle, a mountain of
// woven rugs, and only one has the race's mark, unrolled at the weaver's feet.
import { V, mergePools } from '../_kit.js';

const VE = { taskId: 'venom' };
const RU = { taskId: 'rugs' };

const venom = {
  'task-start.any': [
    { id: 'drg2.ve-s1', when: VE, turns: [
      { beat: 'A monitor lizard flicks its long forked tongue out, tastes the air in {a}\'s direction, and pulls it back in.' },
      { by: 'a', say: "It just tasted me. From over there." },
      { by: 'b', say: "What did you taste like?" },
      { by: 'a', say: "Scared. I tasted scared." },
    ] },
    { id: 'drg2.ve-s2', when: VE, turns: [
      { by: 'b', say: "I'll wiggle the stick like a snake. They love snakes." },
      { by: 'a', say: "To eat?" },
      { by: 'b', say: "Everything's to eat with these. That's why the stick's long." },
    ] },
    { id: 'drg2.ve-s3', when: VE, turns: [
      { beat: '{a} creeps forward under the hut in a low crouch, sponge on its pole held out in front like a fishing rod.' },
      { by: 'a', say: "How close do I have to get?" },
      { by: 'b', say: "Pole's length. Not one step closer. Not one." },
    ] },
    { id: 'drg2.ve-s4', when: VE, turns: [
      { by: 'a', say: "Which one's the sleepiest?" },
      { by: 'b', ...V("The big one. Big ones are lazy. Like cats.", "The big one. Big ones are lazy.", "The big one.", "The BIG one! Big ones are LAZY!", "Try the big one, big ones tend to be lazy.", "The big one. It has nothing left to prove.") },
      { by: 'a', say: "The big one is also the big one." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'drg2.ve-f1', when: VE, turns: [
      { beat: 'The lizard follows {b}\'s stick round in a slow circle. {a} dabs the sponge on its lip from behind, and it never even turns its head.' },
      { by: 'b', say: "It didn't notice! It didn't notice at all!" },
      { by: 'a', say: "I'm a ninja. A drool ninja." },
    ] },
    { id: 'drg2.ve-f2', when: VE, turns: [
      { by: 'a', say: "Squeezing. Squeezing. It's going in. It's all going in." },
      { beat: 'One long string of drool slides off the sponge and into the vial, right up to the line. The ranger nods.' },
      { by: 'b', say: "One squeeze! You did it in one squeeze!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'drg2.ve-a1', when: VE, turns: [
      { by: 'b', say: "It keeps seeing you because you're in the sun. Come in from the shady side." },
      { beat: '{a} goes round the back of the post, through the shade, and the lizard doesn\'t see a thing. The sponge comes back dripping.' },
      { by: 'a', say: "Shady side! I'm a shadow now!" },
    ] },
    { id: 'drg2.ve-a2', when: VE, turns: [
      { beat: 'On the third try, {b} holds the vial right under the sponge, so the drool goes straight in without a single step between.' },
      { by: 'b', say: "No walking. No spilling. Just squeeze." },
      { beat: '{a} squeezes. The vial fills to the line. The ranger hands them the tip.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'drg2.ve-t1', when: VE, turns: [
      { by: 'a', say: "It's licking the sponge. It thinks the sponge is food." },
      { by: 'b', say: "Is that good?" },
      { by: 'a', say: "It's eating my sponge! It's eating all the drool back!" },
    ] },
    { id: 'drg2.ve-t2', when: VE, turns: [
      { beat: '{b} has been waving the forked stick for ten minutes. Both arms are trembling.' },
      { by: 'b', say: "My arms are dying. Get the drool. Get any drool." },
      { by: 'a', say: "It won't open its mouth! It's got nothing to say!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'drg2.ve-x1', when: VE, turns: [
      { beat: 'The lizard hisses. {a} jumps backwards, trips over the pole, and the sponge flips drool all over {b}\'s trousers.' },
      { by: 'b', say: "That was going in the vial!" },
      { by: 'a', say: "It's on your knee now! I'm not taking it off your knee! Again!" },
    ] },
    { id: 'drg2.ve-x2', when: VE, turns: [
      { beat: 'The ranger holds up their vial. Half of it is drool. The other half is sand.' },
      { by: 'a', say: "How did sand get in there?" },
      { by: 'b', say: "You dropped it and scooped it back up. New vial." },
    ] },
  ],
  'task-done.any': [
    { id: 'drg2.ve-dn1', when: VE, turns: [
      { by: 'a', say: "What do they even do with the drool?" },
      { by: 'b', say: "I asked the ranger. He said 'science'." },
      { by: 'a', say: "Science is lucky to have us." },
    ] },
    { id: 'drg2.ve-dn2', when: VE, turns: [
      { beat: '{a} and {b} walk backwards out from under the huts, never taking their eyes off the lizards.' },
      { by: 'b', say: "Keep walking backwards. All the way to the jungle." },
      { by: 'a', say: "The jungle's a mile away." },
    ] },
    { id: 'drg2.ve-dn3', when: VE, turns: [
      { by: 'b', say: "Next tip says rugs. Just rugs." },
      { by: 'a', say: "Rugs don't bite. Rugs don't drool. I love rugs." },
      { by: 'b', say: "Say that after you've seen how many there are." },
    ] },
  ],
};

const rugs = {
  'task-start.any': [
    { id: 'drg2.ru-s1', when: RU, turns: [
      { beat: '{a} pulls one rug out of the bottom of the pile. The whole mountain shifts, and six rugs slide down on top of {a.obj}.' },
      { by: 'a', say: "Don't pull from the bottom. Learnt that." },
      { by: 'b', say: "Top down. Like a sensible person." },
    ] },
    { id: 'drg2.ru-s2', when: RU, turns: [
      { by: 'b', say: "You unroll. I look. Then we swap when your arms get tired." },
      { by: 'a', say: "Why don't your arms get tired?" },
      { by: 'b', say: "Because I'm looking. Looking is very restful." },
    ] },
    { id: 'drg2.ru-s3', when: RU, turns: [
      { beat: 'The weaver sits at her loom beside the pile, weaving another rug, very slowly, and adding it to the mountain.' },
      { by: 'a', say: "She's making more. She's making it worse." },
      { by: 'b', say: "Then we'd better be faster than her." },
    ] },
    { id: 'drg2.ru-s4', when: RU, turns: [
      { by: 'a', say: "Flag inside a circle. Say it with me. Flag inside a circle." },
      { by: 'b', say: "Flag inside a circle." },
      { by: 'a', say: "Anything else, we don't even finish unrolling it." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'drg2.ru-f1', when: RU, turns: [
      { beat: '{b} lifts the corner of a rug halfway down the pile and sees the edge of a circle woven in gold.' },
      { by: 'b', say: "Gold thread! Nobody else used gold thread!" },
      { beat: 'They pull it out and unroll it at the weaver\'s feet. The mark is right in the middle. She hands over the tip.' },
    ] },
    { id: 'drg2.ru-f2', when: RU, turns: [
      { by: 'a', say: "I'm going to guess. This one. Because it's ugly." },
      { beat: '{a} unrolls the ugliest rug in the pile. The race\'s mark is woven right in the centre.' },
      { by: 'b', say: "You picked the ugly one and it was the one!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'drg2.ru-a1', when: RU, turns: [
      { by: 'b', say: "We keep checking the same rugs. Done ones go behind us. Behind us, and they stay there." },
      { beat: 'Behind them, the done pile grows. In front of them, the mountain shrinks. Near the bottom, {b} finds the mark.' },
      { by: 'a', say: "A system! We had a system!" },
    ] },
    { id: 'drg2.ru-a2', when: RU, turns: [
      { beat: 'After two wrong rugs, {a} stops unrolling and just looks at the edges, where the patterns show.' },
      { by: 'a', say: "The mark's woven into the border. You don't have to open them all." },
      { beat: 'Edge after edge, and then the flag inside a circle. The weaver nods.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'drg2.ru-t1', when: RU, turns: [
      { by: 'a', say: "Is this a flag inside a circle, or a bird inside an egg?" },
      { by: 'b', say: "It's a bird inside an egg." },
      { by: 'a', say: "They all look like birds inside eggs now." },
    ] },
    { id: 'drg2.ru-t2', when: RU, turns: [
      { beat: '{a} and {b} sit on top of the mountain of rugs, sweating, surrounded by unrolled cloth in every direction.' },
      { by: 'b', say: "We've made it bigger. The pile was smaller when we got here." },
      { by: 'a', say: "Unrolled rugs take up more room. That's maths." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'drg2.ru-x1', when: RU, turns: [
      { beat: '{a} unrolls a rug at the weaver\'s feet with a flourish. She turns it the right way up. The flag is a fish.' },
      { by: 'a', say: "It was upside down! Upside down, it's a flag!" },
      { by: 'b', say: "She doesn't do upside down. Back to the pile." },
    ] },
    { id: 'drg2.ru-x2', when: RU, turns: [
      { beat: '{b} runs a rug over to the weaver. She holds up the tip card next to it. The circle on the tip is red. The circle on the rug is blue.' },
      { by: 'b', say: "There's a blue one too? Who made a blue one?" },
      { by: 'a', say: "She did! She did, to trick us! Back!" },
    ] },
  ],
  'task-done.any': [
    { id: 'drg2.ru-dn1', when: RU, turns: [
      { by: 'b', say: "Should we roll it back up for her?" },
      { by: 'a', say: "Should we roll all of them back up for her?" },
      { by: 'b', say: "That's a no. Let's just say thank you and run." },
    ] },
    { id: 'drg2.ru-dn2', when: RU, turns: [
      { beat: '{a} and {b} jog up the jungle trail towards the hill, the sun going orange through the trees.' },
      { by: 'a', say: "Drool and rugs. Strangest shopping trip of my life." },
      { by: 'b', say: "And we didn't even get to keep anything." },
    ] },
    { id: 'drg2.ru-dn3', when: RU, turns: [
      { by: 'a', say: "I've got fluff in my nose. In my ears. In my eyebrows." },
      { by: 'b', say: "You look like a very old man." },
      { by: 'a', say: "I feel like a very old man." },
    ] },
  ],
};

export default mergePools(venom, rugs);
