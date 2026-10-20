// Stone Head Island, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/stone-head-island.js: both search the stone heads for three unbroken
// eggs in the team's colour; at the condor nest, a climbs the spire with the eggs in a pouch while the condor swoops,
// and b watches from the bottom.
import { V, mergePools } from '../_kit.js';

const EG = { taskId: 'eggs' };
const CN = { taskId: 'condor-nest' };

const eggs = {
  'task-start.any': [
    { id: 'shi2.eg-s5', when: EG, turns: [
      { beat: '{a} stands in front of the first stone head and looks up at it. It looks down at {a}, as it has looked at everything for hundreds of years.' },
      { by: 'a', say: "I feel like it's judging me." },
      { by: 'b', say: "It's judging everybody. Look under its chin." },
    ] },
    { id: 'shi2.eg-s6', when: EG, turns: [
      { by: 'b', say: "Egg in the basket the second you find it. Don't hold it. Don't wave it about." },
      { by: 'a', say: "What if I want to celebrate?" },
      { by: 'b', say: "Celebrate with your face. Not your hands." },
    ] },
    { id: 'shi2.eg-s7', when: EG, turns: [
      { beat: '{b} feels along the base of a head, finds something round in the sand, and digs it out. A coconut.' },
      { by: 'b', say: "That is the biggest egg I've ever seen." },
      { by: 'a', say: "Put it down. Unless you want to sit on it for a month." },
    ] },
    { id: 'shi2.eg-s8', when: EG, turns: [
      { by: 'a', ...V("Every head's got cracks. Hundreds of cracks. An egg could be in any of them.", "Hundreds of cracks.", "So many cracks.", "HUNDREDS of cracks! An egg could be ANYWHERE!", "There are hundreds of little cracks, and an egg could be in any of them.", "These heads have more hiding places than my sofa.") },
      { by: 'b', say: "Then we check every one." },
      { by: 'a', say: "We're going to be here until we look like these heads." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'shi2.eg-f5', when: EG, turns: [
      { beat: '{a} spots a little smudge of paint in their colour on the rock, follows a trail of them round the back of the third head, and finds a nest of three.' },
      { by: 'a', say: "Somebody painted them here and got paint on the heads!" },
      { by: 'b', say: "Messy painters! I love messy painters!" },
    ] },
    { id: 'shi2.eg-f6', when: EG, turns: [
      { by: 'b', say: "Every head's looking out to sea. Except that one. It's looking at the sand." },
      { beat: '{a} digs in the sand where the odd head is looking. Three eggs, in their colour, wrapped in a cloth.' },
      { by: 'a', say: "It was looking at them! It was showing us!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'shi2.eg-a5', when: EG, turns: [
      { by: 'a', say: "We keep finding other teams' eggs. They're all low down. Ours must be high up." },
      { by: 'b', say: "Why?" },
      { by: 'a', say: "Because we've looked everywhere low." },
      { beat: '{a} climbs onto a stone shoulder and finds the last of their three tucked into the top of a stone ear. Into the basket, unbroken.' },
    ] },
    { id: 'shi2.eg-a6', when: EG, turns: [
      { beat: 'This time {b} lines the bottom of the basket with both of their jackets before they put a single egg in.' },
      { by: 'b', say: "Nothing breaks on a jacket." },
      { beat: 'Three eggs in their colour go into the jackets, and the judge counts all three, whole and unbroken.' },
      { by: 'a', say: "It's cold, but it's worth it." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'shi2.eg-t4', when: EG, turns: [
      { beat: '{a} has one arm up to the shoulder in a crack in the side of a stone head, and can\'t pull it back out.' },
      { by: 'a', say: "There's an egg in here. I can feel it. I just can't get it or my arm." },
      { by: 'b', say: "Wiggle! Wiggle gently!" },
    ] },
    { id: 'shi2.eg-t5', when: EG, turns: [
      { by: 'b', say: "That one's our colour." },
      { by: 'a', say: "Is it, though? Or is it the one that's nearly our colour?" },
      { by: 'b', say: "I don't know anymore. I've seen too many eggs." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'shi2.eg-x4', when: EG, turns: [
      { beat: 'A seagull lands on the edge of the basket, pecks the top egg, and flies off. The egg now has a hole in it.' },
      { by: 'a', say: "That bird just ate our egg!" },
      { by: 'b', say: "Most of our egg! Back to searching!" },
    ] },
    { id: 'shi2.eg-x5', when: EG, turns: [
      { beat: 'The judge picks an egg out of their basket, rubs it with a thumb, and the colour comes off. Under it, it\'s another team\'s.' },
      { by: 'b', say: "Somebody painted over it!" },
      { by: 'a', say: "Somebody's cheating! Back to the heads!" },
    ] },
  ],
  'task-done.any': [
    { id: 'shi2.eg-dn4', when: EG, turns: [
      { by: 'b', say: "Should we say goodbye to the heads?" },
      { by: 'a', say: "They didn't say hello to us." },
      { by: 'b', say: "They're shy. Bye, heads." },
    ] },
    { id: 'shi2.eg-dn5', when: EG, turns: [
      { beat: '{a} carries the padded basket so carefully that {a.sub} walk like a waiter with a very full tray.' },
      { by: 'b', say: "You can walk normally now. We've found them." },
      { by: 'a', say: "And now they've got to go up a rock. Nothing about this is normal." },
    ] },
    { id: 'shi2.eg-dn6', when: EG, turns: [
      { by: 'a', say: "Who carved all those heads? And why?" },
      { by: 'b', say: "I think they wanted company." },
      { by: 'a', say: "Then I hope we were good company." },
    ] },
  ],
};

const condor = {
  'task-start.any': [
    { id: 'shi2.cn-s5', when: CN, turns: [
      { beat: '{a} looks up at the spire. It goes up and up, thin as a finger, with a nest like a big hat on the top.' },
      { by: 'a', say: "Who decided to put a nest up there?" },
      { by: 'b', say: "The condor. It doesn't want visitors." },
      { by: 'a', say: "I'm bringing it presents." },
    ] },
    { id: 'shi2.cn-s6', when: CN, turns: [
      { by: 'b', say: "If it comes at you, make yourself big. Big and loud. Like a bear." },
      { by: 'a', say: "I'm on a spire. How am I going to be big on a spire?" },
      { by: 'b', say: "Be big in your heart." },
    ] },
    { id: 'shi2.cn-s7', when: CN, turns: [
      { beat: '{a} fastens the pouch with the three eggs and pats it, very gently, twice.' },
      { by: 'a', say: "Stay. Don't roll. Don't knock into each other." },
      { by: 'b', say: "Are you talking to the eggs?" },
      { by: 'a', say: "Somebody has to." },
    ] },
    { id: 'shi2.cn-s8', when: CN, turns: [
      { by: 'a', ...V("How long is too long? When does it start swooping?", "When does it start swooping?", "When does it swoop?", "How long is TOO long? When does it SWOOP?", "I'd like to know how long is too long before it starts swooping.", "Does the condor have a clock, or just a feeling?") },
      { by: 'b', say: "I don't know. Go now and find out never." },
      { beat: 'High above the spire, the condor tilts one wing and starts a slow, lazy circle.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'shi2.cn-f5', when: CN, turns: [
      { beat: '{a} climbs like a lizard, quick and flat against the rock, sets the three eggs in the nest before the condor finishes its first circle, and climbs down again.' },
      { by: 'b', say: "It didn't even get a swoop in!" },
      { by: 'a', say: "It's still up there wondering who I was." },
    ] },
    { id: 'shi2.cn-f6', when: CN, turns: [
      { by: 'a', say: "Good bird. Nice bird. I'm a friend. I've brought your eggs." },
      { beat: '{a} talks to the condor the whole way up, softly, and the condor circles but never swoops. Three eggs go into the nest, and {a} comes down.' },
      { by: 'b', say: "You sweet-talked a condor." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'shi2.cn-a5', when: CN, turns: [
      { by: 'b', say: "It swoops when you stop. You keep stopping to look at it. Don't look at it. Just climb." },
      { by: 'a', say: "Don't look at the giant bird." },
      { by: 'b', say: "Don't look at the giant bird." },
      { beat: '{a} never looks up, never stops, and the condor never swoops. Three eggs in the nest, and both feet back on the grass.' },
    ] },
    { id: 'shi2.cn-a6', when: CN, turns: [
      { beat: 'Back at the bottom again, {a} waits until the condor flies off over the sea to hunt, and then climbs as fast as {a.sub} can.' },
      { by: 'a', say: "It's gone fishing! Go, go, go!" },
      { beat: 'Up, eggs in, down. When the condor comes back, {a} is already standing next to {b} on the grass.' },
      { by: 'b', say: "It's going to be so confused." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'shi2.cn-t4', when: CN, turns: [
      { beat: '{a} is just under the nest, one hand on the edge, and the condor is sitting in it, looking down at {a}.' },
      { by: 'a', say: "It's in the nest. I can't put the eggs in. It's sitting on the spot." },
      { by: 'b', say: "Ask it to move up a bit!" },
    ] },
    { id: 'shi2.cn-t5', when: CN, turns: [
      { by: 'b', say: "There's a feather stuck in your hair. A huge one." },
      { by: 'a', say: "It's a warning. It's leaving me warnings." },
      { by: 'b', say: "It's a souvenir. Keep climbing." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'shi2.cn-x4', when: CN, turns: [
      { beat: '{a} puts all three eggs in the nest, turns to climb down, and the condor lands, picks up one egg and drops it over the side. It cracks on the rocks.' },
      { by: 'a', say: "It threw one away! It threw its own egg away!" },
      { by: 'b', say: "It didn't like that one! Come down! New egg!" },
    ] },
    { id: 'shi2.cn-x5', when: CN, turns: [
      { beat: '{a} reaches the nest and opens the pouch. One egg has rolled out somewhere on the way up, and is lying in a crack halfway down.' },
      { by: 'a', say: "I've only got two! Where did the third one go?" },
      { by: 'b', say: "It's in the rock! Come down and start again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'shi2.cn-dn4', when: CN, turns: [
      { by: 'a', say: "Do you think the condor knows they're not its eggs?" },
      { by: 'b', say: "Shh. Don't tell it." },
      { by: 'a', say: "Let it be happy." },
    ] },
    { id: 'shi2.cn-dn5', when: CN, turns: [
      { beat: '{a} jumps the last bit onto the grass, unclips the harness, and lies flat on {a.posAdj} back.' },
      { by: 'b', say: "Are you okay?" },
      { by: 'a', say: "I'm keeping an eye on the sky. In case it comes back." },
    ] },
    { id: 'shi2.cn-dn6', when: CN, turns: [
      { by: 'b', say: "That was the bravest climbing I've ever seen." },
      { by: 'a', say: "That was the only climbing I've ever done." },
      { by: 'b', say: "Still the bravest." },
    ] },
  ],
};

export default mergePools(eggs, condor);
