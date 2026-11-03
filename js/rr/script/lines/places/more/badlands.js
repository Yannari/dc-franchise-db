// Badlands, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/badlands.js: both dig the bones out of the striped hills and build the
// skeleton on the frame for the palaeontologist; at the buried barrel, a reads the old map and digs the grid while b
// watches from the rig.
import { V, mergePools } from '../_kit.js';

const DN = { taskId: 'dino' };
const OB = { taskId: 'oil-barrel' };

const dino = {
  'task-start.any': [
    { id: 'bdl2.dn-s5', when: DN, turns: [
      { beat: '{b} kneels in the dirt with a tiny brush, sweeping the bone very slowly.' },
      { by: 'a', say: "Can you go a bit faster?" },
      { by: 'b', say: "If I go faster, I'll break it." },
    ] },
    { id: 'bdl2.dn-s6', when: DN, turns: [
      { by: 'a', say: "Skull, spine, ribs, legs, tail. Five things. We need five kinds of bone." },
      { by: 'b', say: "And we've got fifty bones that all look like the same kind." },
      { by: 'a', say: "Then let's just start with the big ones." },
    ] },
    { id: 'bdl2.dn-s7', when: DN, turns: [
      { beat: '{a} lifts the pickaxe over {a.posAdj} head, and the palaeontologist, from across the dig, winces before it even comes down.' },
      { by: 'b', say: "Smaller swings. She's watching." },
      { by: 'a', say: "I'm being gentle. I promise." },
    ] },
    { id: 'bdl2.dn-s8', when: DN, turns: [
      { by: 'b', ...V("Every stripe in the hill is a different time. The bones are all in the same stripe.", "The bones are all in one stripe.", "Same stripe.", "Every STRIPE is a different time! The bones are in ONE stripe!", "I think each stripe is a different time, and the bones are all in one of them.", "The hill is a book, and our dinosaur is on one page.") },
      { by: 'a', say: "Which stripe?" },
      { by: 'b', say: "The dark one. Look, there's one sticking out." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'bdl2.dn-f5', when: DN, turns: [
      { beat: '{a} lays the bones out on the ground in the shape of the dinosaur first, then {b} lifts each one onto the frame in its place.' },
      { by: 'a', say: "Floor first, then frame." },
      { beat: 'The palaeontologist walks round it slowly, taps the skull, and hands over the tip.' },
      { by: 'b', say: "It worked! Laying it out worked!" },
    ] },
    { id: 'bdl2.dn-f6', when: DN, turns: [
      { by: 'b', say: "This one's a hip. It's got two holes, and the legs go in the holes." },
      { by: 'a', say: "How do you know that?" },
      { by: 'b', say: "It's just like ours. Trust me." },
      { beat: 'Hips first, then everything clips onto the hips, and the skeleton stands whole on the first go.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'bdl2.dn-a5', when: DN, turns: [
      { by: 'a', say: "It keeps falling over because all the weight's at the front. The tail holds it up. It's a see-saw." },
      { by: 'b', say: "So the tail's not just for show?" },
      { by: 'a', say: "No. It's there to balance it." },
      { beat: 'Tail on first, then the head, and the skeleton balances, nose to tail. The palaeontologist approves.' },
    ] },
    { id: 'bdl2.dn-a6', when: DN, turns: [
      { beat: 'This time {a} and {b} lay every rib out on the ground, longest to shortest, before any of them goes on the frame.' },
      { by: 'b', say: "Long ones in the middle, short ones at the ends." },
      { beat: 'The ribs curve the right way, the chest looks like a chest, and the palaeontologist nods and hands over the tip.' },
      { by: 'a', say: "That's it! It looks right now!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'bdl2.dn-t4', when: DN, turns: [
      { beat: '{a} is holding the huge skull up on the end of the spine with both arms, and can\'t let go, because nothing else is holding it.' },
      { by: 'a', say: "Find something to hold it! A neck! Anything!" },
      { by: 'b', say: "We used all the neck bones on the tail!" },
    ] },
    { id: 'bdl2.dn-t5', when: DN, turns: [
      { by: 'b', say: "This one could be a toe or a tooth." },
      { by: 'a', say: "How can it be either?" },
      { by: 'b', say: "I don't know. I'm so tired I can't tell any more." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'bdl2.dn-x4', when: DN, turns: [
      { beat: 'The palaeontologist looks at the skeleton, then picks one bone off the frame and holds it up. It\'s a rock, not a bone.' },
      { by: 'a', say: "That's a rock? It looked like a bone!" },
      { by: 'b', say: "Out it comes! Dig again!" },
    ] },
    { id: 'bdl2.dn-x5', when: DN, turns: [
      { beat: 'A gust of wind comes down the canyon, catches the skeleton\'s ribs like a sail, and pushes the whole thing off the frame.' },
      { by: 'b', say: "The wind knocked it down! No!" },
      { by: 'a', say: "Rebuild! Quick! Tail first!" },
    ] },
  ],
  'task-done.any': [
    { id: 'bdl2.dn-dn4', when: DN, turns: [
      { by: 'b', say: "What do you think it ate?" },
      { by: 'a', say: "Look at its teeth. Everything." },
      { by: 'b', say: "I'm glad it's not alive." },
    ] },
    { id: 'bdl2.dn-dn5', when: DN, turns: [
      { beat: 'The palaeontologist hangs a little paper label on the skeleton with the names of the team who built it.' },
      { by: 'a', say: "It's got our names on. We're in a museum." },
      { by: 'b', say: "Our names, on a dinosaur." },
      { by: 'a', say: "That's so cool." },
    ] },
    { id: 'bdl2.dn-dn6', when: DN, turns: [
      { by: 'a', say: "I've got so much dirt under my fingernails." },
      { by: 'b', say: "And now we're digging again." },
      { by: 'a', say: "I know. Let's just go." },
    ] },
  ],
};

const barrel = {
  'task-start.any': [
    { id: 'bdl2.ob-s5', when: OB, turns: [
      { beat: '{a} spreads the old map on the ground and pins the corners with rocks. It\'s very old, and part of the grid has worn away.' },
      { by: 'a', say: "What if our square is in the bit that's worn away?" },
      { by: 'b', say: "Then we guess. Let's hope it isn't." },
    ] },
    { id: 'bdl2.ob-s6', when: OB, turns: [
      { by: 'b', say: "Count the squares. Across, then down." },
      { by: 'a', say: "Three across, five down. Or five across, three down?" },
      { by: 'b', say: "Pick one and dig. We'll find out." },
    ] },
    { id: 'bdl2.ob-s7', when: OB, turns: [
      { beat: '{a} drives the shovel into the ground. It goes in about a finger\'s width and stops, ringing, on hard dry earth.' },
      { by: 'a', say: "This ground is so hard." },
      { by: 'b', ...V("Jump on the shovel. Use your whole body. Stomp it.", "Jump on it.", "Stomp.", "JUMP on it! Use your WHOLE body!", "Try jumping on the shovel, using your whole body.", "Dig like the ground owes you money.") },
    ] },
    { id: 'bdl2.ob-s8', when: OB, turns: [
      { by: 'a', say: "Which square would you bury a barrel in? If you were a mean person?" },
      { by: 'b', say: "The one furthest from the rig. So you'd have to roll it the furthest." },
      { by: 'a', say: "That makes sense. Let's try it." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'bdl2.ob-f5', when: OB, turns: [
      { beat: '{a} walks the grid slowly, stamping each square. Thud. Thud. Thud. Then a hollow boom.' },
      { by: 'a', say: "That one sounds empty underneath." },
      { beat: 'Three shovels down, the blade clangs on metal, and the barrel with their names on it comes up out of the ground.' },
      { by: 'b', say: "You heard it! That's amazing!" },
    ] },
    { id: 'bdl2.ob-f6', when: OB, turns: [
      { by: 'b', say: "There's a little cactus drawn on the map. And there's a little cactus right there." },
      { beat: '{a} digs right beside the little cactus and hits the barrel almost at once.' },
      { by: 'a', say: "The cactus! The map had a cactus!" },
      { by: 'b', say: "That was so smart." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'bdl2.ob-a5', when: OB, turns: [
      { by: 'b', say: "We've been counting squares from the wrong corner. The map's corner is the one with the rig. Not ours." },
      { by: 'a', say: "So everything's flipped?" },
      { by: 'b', say: "Everything's flipped. Dig the opposite square." },
      { beat: '{a} digs the opposite square. Clang. Their barrel, their names, rolled up out of the pit.' },
    ] },
    { id: 'bdl2.ob-a6', when: OB, turns: [
      { beat: 'After two empty holes, {a} pours a cup of water on each square in the row. Most soak it up slowly. One drinks it straight down.' },
      { by: 'a', say: "Loose dirt. That's where somebody dug." },
      { beat: 'Two shovels down, the blade hits metal, and the barrel comes out with their names facing up.' },
      { by: 'b', say: "That's so smart! The water trick worked!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'bdl2.ob-t4', when: OB, turns: [
      { beat: '{a} is filling in the third empty hole, slowly, shovel by shovel.' },
      { by: 'a', say: "Filling it in is worse than digging it." },
      { by: 'b', say: "I know. It has to be the next one." },
    ] },
    { id: 'bdl2.ob-t5', when: OB, turns: [
      { by: 'b', say: "There's an X on the map, and another X, and another X." },
      { by: 'a', say: "How many Xs are there?" },
      { by: 'b', say: "Too many. I don't know which one's real." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'bdl2.ob-x4', when: OB, turns: [
      { beat: 'Clang. {a} cheers, digs round it, and lifts out a rusty old tin can.' },
      { by: 'a', say: "That's not a barrel. It's a can." },
      { by: 'b', say: "Put it back! Fill it in! Next square!" },
    ] },
    { id: 'bdl2.ob-x5', when: OB, turns: [
      { beat: '{a} digs down until the shovel bangs on solid rock, the hole as deep as {a} is tall, and empty.' },
      { by: 'a', say: "There's nothing down here. Nothing." },
      { by: 'b', say: "Fill it in! Pick another square!" },
    ] },
  ],
  'task-done.any': [
    { id: 'bdl2.ob-dn4', when: OB, turns: [
      { beat: '{a} rolls the barrel out of the pit and across the dirt, and it keeps rolling on its own down a slope towards the rig.' },
      { by: 'a', say: "Stop it! It's getting away!" },
      { by: 'b', say: "Run after it! It's going to the rig anyway!" },
    ] },
    { id: 'bdl2.ob-dn5', when: OB, turns: [
      { by: 'b', say: "What's in the barrel? Is it oil?" },
      { by: 'a', say: "I don't know. Something's in it." },
      { by: 'b', say: "Then let's not open it." },
    ] },
    { id: 'bdl2.ob-dn6', when: OB, turns: [
      { by: 'a', say: "I've dug so many holes today." },
      { by: 'b', say: "And filled them all back in." },
      { by: 'a', say: "I never want to see a shovel again." },
    ] },
  ],
};

export default mergePools(dino, barrel);
