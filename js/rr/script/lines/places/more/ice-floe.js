// Ice Floe, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/ice-floe.js: at the ice edge, a digs a ring out of the snow and
// throws it from behind the line onto the narwhal's tusk (a miss sinks, so dig for another), b watches; at the igloo
// village, both saw blocks and build, ring by ring, and a local who has built a thousand inspects it and crawls in.
import { V, mergePools } from '../_kit.js';

const NW = { taskId: 'narwhal' };
const IG = { taskId: 'igloo' };

const narwhal = {
  'task-start.any': [
    { id: 'ifl2.nw-s1', when: NW, turns: [
      { beat: '{a} digs both arms into the snow up to the shoulders and comes out with a ring, a pebble and a lot of snow down {a.posAdj} sleeves.' },
      { by: 'a', say: "Found one. I'm so cold." },
      { by: 'b', say: "Shake your sleeves out and throw." },
    ] },
    { id: 'ifl2.nw-s2', when: NW, turns: [
      { by: 'b', say: "Watch the bubbles. Bubbles come up before the tusk does." },
      { by: 'a', say: "How do you know that?" },
      { by: 'b', say: "I've been watching the other teams." },
    ] },
    { id: 'ifl2.nw-s3', when: NW, turns: [
      { beat: 'The narwhal rises, the long spiral tusk coming up out of the black water.' },
      { by: 'a', say: "It's beautiful. It's actually beautiful. I don't want to throw things at it." },
      { by: 'b', say: "It doesn't hurt it. Just throw." },
    ] },
    { id: 'ifl2.nw-s4', when: NW, turns: [
      { by: 'a', say: "Underarm or overarm?" },
      { by: 'b', say: "Underarm. Nice and soft." },
      { by: 'a', say: "Okay. Underarm." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'ifl2.nw-f1', when: NW, turns: [
      { beat: 'The ring spins through the air, drops over the tip of the tusk and slides all the way down to the narwhal\'s nose.' },
      { by: 'b', say: "It's on! All the way down!" },
      { by: 'a', say: "We did it!" },
    ] },
    { id: 'ifl2.nw-f2', when: NW, turns: [
      { by: 'a', say: "I threw it before it came up. It came up into the ring." },
      { by: 'b', say: "You guessed where it was going to be?" },
      { by: 'a', say: "I just watched where it came up last time." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'ifl2.nw-a1', when: NW, turns: [
      { by: 'b', say: "The wind's taking it left. Every single one. Aim right of the tusk." },
      { by: 'a', say: "Aim at nothing? On purpose?" },
      { beat: '{a} aims at nothing. The wind carries the ring left, straight onto the tusk.' },
      { by: 'a', say: "It worked! The wind took it!" },
    ] },
    { id: 'ifl2.nw-a2', when: NW, turns: [
      { beat: 'Five rings at the bottom of the sea. {a} digs out the sixth, breathes on it, and throws without thinking at all.' },
      { by: 'b', say: "It's on! You didn't even aim!" },
      { by: 'a', say: "I just stopped thinking about it." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'ifl2.nw-t1', when: NW, turns: [
      { by: 'a', say: "My eyelashes are frozen. Can you freeze an eyelash?" },
      { by: 'b', say: "Blink a lot." },
      { by: 'a', say: "If I blink, I'll miss the tusk!" },
    ] },
    { id: 'ifl2.nw-t2', when: NW, turns: [
      { beat: '{a} is on {a.posAdj} knees in the snow, digging with both mittens, and has been for five minutes.' },
      { by: 'a', say: "Where are they? Everybody else is finding rings." },
      { by: 'b', say: "Everybody else already dug that bit. Dig somewhere new." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'ifl2.nw-x1', when: NW, turns: [
      { beat: 'The ring lands on the tusk, spins twice, and the narwhal dives, leaving the ring floating on the surface. Then it sinks.' },
      { by: 'a', say: "It was on! It came off!" },
      { by: 'b', say: "It doesn't count! Dig another!" },
    ] },
    { id: 'ifl2.nw-x2', when: NW, turns: [
      { beat: '{a} winds up, throws, and the frozen mitten flies off with the ring, both landing in the sea.' },
      { by: 'b', say: "Your mitten!" },
      { by: 'a', say: "I know! I'll tie it on! Find another ring!" },
    ] },
  ],
  'task-done.any': [
    { id: 'ifl2.nw-dn1', when: NW, turns: [
      { by: 'a', say: "It's swimming off with our ring." },
      { by: 'b', say: "That was amazing." },
      { by: 'a', say: "I'll never forget that." },
    ] },
    { id: 'ifl2.nw-dn2', when: NW, turns: [
      { beat: '{a} stuffs both hands inside {a.posAdj} coat, under {a.posAdj} armpits, and walks away with {a.posAdj} elbows out.' },
      { by: 'b', say: "You look so cold." },
      { by: 'a', say: "I am so cold." },
    ] },
    { id: 'ifl2.nw-dn3', when: NW, turns: [
      { by: 'b', say: "Igloos next. We build a house out of snow." },
      { by: 'a', say: "Okay. Let's go." },
      { by: 'b', say: "Come on." },
    ] },
  ],
};

const igloo = {
  'task-start.any': [
    { id: 'ifl2.ig-s1', when: IG, turns: [
      { beat: '{a} saws into the snow. The saw sticks halfway, and {a} has to stand on the block to pull it out.' },
      { by: 'a', say: "The snow's harder than it looks." },
      { by: 'b', say: "Good. Hard snow holds." },
    ] },
    { id: 'ifl2.ig-s2', when: IG, turns: [
      { by: 'b', say: "First ring, big blocks. Then smaller and smaller, all the way to the top." },
      { by: 'a', say: "Okay. Smaller each time." },
      { by: 'b', say: "Yes. Go." },
    ] },
    { id: 'ifl2.ig-s3', when: IG, turns: [
      { beat: 'The local walks past their patch, kicks the snow with her boot, and nods at a different patch.' },
      { by: 'a', say: "Is she telling us to build over there?" },
      { by: 'b', say: "She's built a thousand of these. We build over there." },
    ] },
    { id: 'ifl2.ig-s4', when: IG, turns: [
      { by: 'a', say: "How big? Does it need to fit both of us?" },
      { by: 'b', say: "It just needs to fit her. She's small." },
      { by: 'a', say: "Okay. Small." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'ifl2.ig-f1', when: IG, turns: [
      { beat: '{b} drops the last block into the hole at the top, and it fits perfectly.' },
      { by: 'b', say: "The lid's on! The lid fitted first time!" },
      { beat: 'The local crawls in, knocks once on the ceiling, and stays.' },
    ] },
    { id: 'ifl2.ig-f2', when: IG, turns: [
      { by: 'a', say: "Is she still in there? She's been in there a while." },
      { by: 'b', say: "She likes it!" },
      { beat: 'A mitten pokes out of the doorway with the tip in it.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'ifl2.ig-a1', when: IG, turns: [
      { by: 'a', say: "The gaps let the wind in. Fill every gap with snow." },
      { beat: '{a} packs every crack with handfuls of snow, smoothing them with a mitten. The local walks round the whole thing and crawls in.' },
      { by: 'b', say: "Filling the gaps worked!" },
    ] },
    { id: 'ifl2.ig-a2', when: IG, turns: [
      { beat: 'After the second one falls in, {b} builds the third from the inside, standing in the middle and laying blocks round {b.ref}.' },
      { by: 'b', say: "I'll build it round me. Cut me a door when it's done." },
      { beat: '{a} cuts a door. {b} crawls out. The local crawls in, and stays.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'ifl2.ig-t1', when: IG, turns: [
      { by: 'b', say: "It's not an igloo. It's just a wall." },
      { by: 'a', say: "It's the first half of an igloo." },
      { by: 'b', say: "It's been half an igloo for an hour!" },
    ] },
    { id: 'ifl2.ig-t2', when: IG, turns: [
      { beat: '{a} carries a block over, and it snaps in half in {a.posAdj} arms. And again with the next one.' },
      { by: 'a', say: "They keep breaking. I'm holding them too tight." },
      { by: 'b', say: "Then hold them underneath!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'ifl2.ig-x1', when: IG, turns: [
      { beat: 'The local crawls in. Ten seconds later, the whole dome settles down around her, very softly, and she crawls back out of the snow.' },
      { by: 'a', say: "Is she okay? Is she angry?" },
      { by: 'b', say: "She's pointing at the snow. Down it comes. Again." },
    ] },
    { id: 'ifl2.ig-x2', when: IG, turns: [
      { beat: 'The local looks at their igloo, holds up her hand, and puts it straight through a gap between two blocks.' },
      { by: 'a', say: "Her whole hand fits!" },
      { by: 'b', say: "Then the wind gets in. Pull it down and start again." },
    ] },
  ],
  'task-done.any': [
    { id: 'ifl2.ig-dn1', when: IG, turns: [
      { by: 'a', say: "She's still in there. Should we say goodbye?" },
      { by: 'b', say: "Thank you! Bye!" },
      { beat: 'A muffled voice from inside calls something back.' },
    ] },
    { id: 'ifl2.ig-dn2', when: IG, turns: [
      { beat: '{a} and {b} jog off across the ice, looking back at their igloo every few steps.' },
      { by: 'a', say: "It looks so small from here." },
      { by: 'b', say: "Keep running." },
    ] },
    { id: 'ifl2.ig-dn3', when: IG, turns: [
      { by: 'b', say: "We built a home today." },
      { by: 'a', say: "And it actually held." },
      { by: 'b', say: "I'm so proud of that igloo." },
    ] },
  ],
};

export default mergePools(narwhal, igloo);
