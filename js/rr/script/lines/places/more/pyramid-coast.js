// Pyramid Coast, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/pyramid-coast.js: at the chilli cart, a eats a whole mild, hot or
// fiery pepper and waves its flag; b jumps into the sea from the ledge of that colour (mild is the highest, fiery the
// lowest) and swims a canteen of milk back up to a. A pepper not finished, or a jump refused, means picking again.
import { V, mergePools } from '../_kit.js';

const PC = { taskId: 'pepper-cliff' };

const pepper = {
  'task-start.any': [
    { id: 'pyc2.pc-s1', when: PC, turns: [
      { beat: 'The pepper vendor holds out three peppers on a tray: a fat green one, a shiny orange one, and a tiny wrinkled red one.' },
      { by: 'a', say: "Why is the scary one the smallest?" },
      { by: 'b', say: "Because it doesn't need to be big. It's got nothing to prove." },
    ] },
    { id: 'pyc2.pc-s2', when: PC, turns: [
      { by: 'b', say: "Look at the ledges first. Then pick the pepper." },
      { beat: '{a} leans over the cliff edge, looks at the top ledge, and looks very quickly back at the cart.' },
      { by: 'a', say: "I've looked. I'm eating the red one. I'm saving your life." },
    ] },
    { id: 'pyc2.pc-s3', when: PC, turns: [
      { beat: '{b} stands on the high ledge in a wet T-shirt, holding the green flag, looking at the sea a long way down.' },
      { by: 'b', say: "The water's very blue. Very far, and very blue." },
      { by: 'a', say: "I already ate the pepper! Don't make it be for nothing!" },
    ] },
    { id: 'pyc2.pc-s4', when: PC, turns: [
      { by: 'a', say: "Eat it in one bite or lots of little bites?" },
      { by: 'b', ...V("One bite. Little bites is just lots of pain, one after the other.", "One bite. Little bites is more pain.", "One bite.", "ONE bite! Little bites is just LOTS of pain!", "One bite, I think, little bites just spread the pain out.", "One bite. Do not give the pepper time to plan.") },
      { by: 'a', say: "That's either very wise or very cruel." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'pyc2.pc-f1', when: PC, turns: [
      { beat: '{a} eats the orange pepper, waves the orange flag, and {b} is off the middle ledge before {a} has finished waving.' },
      { by: 'a', say: "Milk! Milk, quickly, milk!" },
      { beat: '{b} climbs up dripping and hands over the canteen. {a} drinks the whole thing. The vendor hands over the tip.' },
    ] },
    { id: 'pyc2.pc-f2', when: PC, turns: [
      { by: 'b', say: "That was fun! I want to go again!" },
      { by: 'a', say: "You don't get to go again. I'm not eating another one so you can have fun." },
      { by: 'b', say: "Fair. Drink your milk." },
    ] },
    { id: 'pyc2.pc-f3', when: PC, turns: [
      { beat: '{a} eats the fiery pepper, goes completely silent, and points down the cliff without a word.' },
      { by: 'b', say: "Going! Going!" },
      { beat: 'Low ledge, quick splash, quick swim, and {a} has milk before the pepper has fully got going. The tip is theirs.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'pyc2.pc-a1', when: PC, turns: [
      { by: 'a', say: "Last time I couldn't finish it because I chewed. This time, I swallow it whole, like a pill." },
      { beat: '{a} swallows the hot pepper whole, eyes streaming, and waves the flag. {b} jumps, swims, and is back with the milk.' },
      { by: 'a', say: "The pill was the trick! The pill's still burning, but it was the trick!" },
    ] },
    { id: 'pyc2.pc-a2', when: PC, turns: [
      { beat: 'Back on the ledge, {b} stops looking down and stares straight out at the horizon.' },
      { by: 'b', say: "Looking at the boats. Just the boats. There's no cliff." },
      { beat: '{b} steps off looking at the boats, hits the water, and comes up with the milk. The vendor nods.' },
    ] },
    { id: 'pyc2.pc-a3', when: PC, turns: [
      { by: 'b', say: "Pick the middle one. I couldn't do the top. You couldn't do the red. Middle's for us." },
      { by: 'a', say: "The middle's for cowards." },
      { by: 'b', say: "The middle's for winners." },
      { beat: 'The middle is for winners. Orange pepper, middle ledge, milk, tip.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'pyc2.pc-t1', when: PC, turns: [
      { by: 'a', say: "My lips have gone numb. Are they still there?" },
      { by: 'b', say: "They're there. They're much bigger than they were." },
      { by: 'a', say: "Bigger lips are fine. Bigger lips are fashionable." },
    ] },
    { id: 'pyc2.pc-t2', when: PC, turns: [
      { beat: '{b} is treading water at the bottom of the cliff, holding the canteen, looking up at the long climb back.' },
      { by: 'b', say: "Nobody told me there'd be climbing." },
      { by: 'a', say: "Nobody told me there'd be this much pepper! Climb!" },
    ] },
    { id: 'pyc2.pc-t3', when: PC, turns: [
      { by: 'a', say: "Is there water? Can I have water instead?" },
      { by: 'b', say: "Water makes it worse. Everybody knows that." },
      { by: 'a', say: "Then why do I want it so much?" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'pyc2.pc-x1', when: PC, turns: [
      { beat: '{a} gets the fiery pepper halfway down, then spits the rest into the bushes. The vendor shakes his head and takes the flag back.' },
      { by: 'a', say: "Half's enough! Half is plenty!" },
      { by: 'b', say: "Half isn't a pepper! Pick again!" },
    ] },
    { id: 'pyc2.pc-x2', when: PC, turns: [
      { beat: '{b} walks to the edge of the top ledge, looks down, and walks straight back up the path to the cart.' },
      { by: 'b', say: "Not that one. I can't do that one. Another pepper." },
      { by: 'a', say: "A hotter one? Fine. For you. Again." },
    ] },
    { id: 'pyc2.pc-x3', when: PC, turns: [
      { beat: '{b} swims back with a canteen. {a} opens it, drinks, and spits. It is orange juice. Someone else\'s colour.' },
      { by: 'a', say: "That's not milk! That's somebody else's!" },
      { by: 'b', say: "It was floating! Back in, find the milk!" },
    ] },
  ],
  'task-done.any': [
    { id: 'pyc2.pc-dn1', when: PC, turns: [
      { by: 'a', say: "I'm going to smell like milk and pepper for the rest of the race." },
      { by: 'b', say: "And I'm going to smell like the sea." },
      { by: 'a', say: "Together we smell like a fish curry." },
    ] },
    { id: 'pyc2.pc-dn2', when: PC, turns: [
      { beat: '{a} and {b} walk to the burros, {a} still fanning {a.posAdj} mouth with the coloured flag.' },
      { by: 'b', say: "You can put the flag down." },
      { by: 'a', say: "The flag's helping. It's the only thing helping." },
    ] },
    { id: 'pyc2.pc-dn3', when: PC, turns: [
      { by: 'b', say: "Burros to a pyramid. After a cliff and a pepper." },
      { by: 'a', say: "I just want to sit down on something that walks for me." },
      { by: 'b', say: "That's exactly what a burro is." },
    ] },
  ],
};

export default mergePools(pepper);
