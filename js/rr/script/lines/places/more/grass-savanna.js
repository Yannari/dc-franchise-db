// Grass Savanna, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/grass-savanna.js: both fill the plum basket while the village
// children kick footballs at them; at the gourds, a swings the cricket bat down the row and b watches; on the safari,
// both track the animal through the tall grass to a sleepy-dart so the ranger can tag it.
import { V, mergePools } from '../_kit.js';

const PL = { taskId: 'plums' };
const GD = { taskId: 'gourds' };
const SF = { taskId: 'safari' };

const plums = {
  'task-start.any': [
    { id: 'gsv2.pl-s5', when: PL, turns: [
      { beat: 'A little girl in a football shirt that\'s too big for her lines up a ball, looks straight at {a}, and smiles.' },
      { by: 'a', say: "She's aiming at me." },
      { by: 'b', say: "Just pick. Fast." },
    ] },
    { id: 'gsv2.pl-s6', when: PL, turns: [
      { by: 'b', say: "Only the purple ones. The green ones aren't ready." },
      { by: 'a', say: "The purple ones are at the top." },
      { by: 'b', say: "Then climb. I'll hold the basket." },
    ] },
    { id: 'gsv2.pl-s7', when: PL, turns: [
      { beat: '{a} gives the tree a shake, and plums rain down all over {a} and {b}.' },
      { by: 'b', say: "That works! Pick them up!" },
      { by: 'a', say: "Pick them up before the children get to them." },
    ] },
    { id: 'gsv2.pl-s8', when: PL, turns: [
      { by: 'a', say: "How full is full? Is level full, or heaped full?" },
      { by: 'b', say: "Heaped. It said to the brim." },
      { by: 'a', say: "That's a lot of plums." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsv2.pl-f5', when: PL, turns: [
      { beat: '{b} holds the basket out in front, catching plums from {a} with one hand and batting footballs away with the other.' },
      { by: 'a', say: "You're saving everything!" },
      { by: 'b', say: "Keep picking! I've got this!" },
      { beat: 'Not one ball gets through, and the elder takes the brimming basket with a big, slow nod.' },
    ] },
    { id: 'gsv2.pl-f6', when: PL, turns: [
      { by: 'a', say: "Put your jacket over the top. Every time we drop some in, close the lid." },
      { beat: 'Plums in, jacket over, plums in, jacket over. The balls bounce off the jacket every time, and the basket arrives at the elder full to the brim.' },
      { by: 'b', say: "My jacket got hit so many times." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gsv2.pl-a5', when: PL, turns: [
      { by: 'b', say: "They only kick when we're bending down. So we don't bend down. Pick high, never low." },
      { by: 'a', say: "And the ones on the ground?" },
      { by: 'b', say: "Leave them. Just pick high." },
      { beat: 'Picking only from the high branches, standing tall, they fill the basket before the children find a way to hit it.' },
    ] },
    { id: 'gsv2.pl-a6', when: PL, turns: [
      { beat: 'This time {a} hands the children a plum each before starting. They stop kicking to eat them.' },
      { by: 'a', say: "Pick! Pick while they're chewing!" },
      { beat: 'By the time the last child has finished, the basket is full, and the elder is laughing.' },
      { by: 'b', say: "That was so smart!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gsv2.pl-t4', when: PL, turns: [
      { beat: '{a} is up the plum tree, out of reach of the footballs, and won\'t come down.' },
      { by: 'b', say: "Throw them down to me!" },
      { by: 'a', say: "If I come down, they'll get me!" },
    ] },
    { id: 'gsv2.pl-t5', when: PL, turns: [
      { by: 'b', say: "There are more children than before. Where are they coming from?" },
      { by: 'a', say: "I think everybody in the village came to watch." },
      { by: 'b', say: "Great. Just great." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsv2.pl-x4', when: PL, turns: [
      { beat: '{b} dives to save the basket from a shot, catches the ball, and lands on the basket. Plum juice everywhere.' },
      { by: 'b', say: "I saved it! I saved the basket!" },
      { by: 'a', say: "You sat on the plums! Squashed ones don't count! Pick again!" },
    ] },
    { id: 'gsv2.pl-x5', when: PL, turns: [
      { beat: 'A football hits the basket while they\'re picking and tips it over.' },
      { by: 'a', say: "No! The basket!" },
      { by: 'b', say: "Pick them up! Quick!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gsv2.pl-dn4', when: PL, turns: [
      { by: 'a', say: "Do you think they do that to everyone?" },
      { by: 'b', say: "Everyone. That girl was so good." },
      { by: 'a', say: "She got me every time." },
    ] },
    { id: 'gsv2.pl-dn5', when: PL, turns: [
      { beat: 'As {a} and {b} leave the village, the children chase after them, kicking one football along, all the way to the edge of the plum trees.' },
      { by: 'b', say: "They're seeing us off." },
      { by: 'a', say: "That was so much fun, actually." },
    ] },
    { id: 'gsv2.pl-dn6', when: PL, turns: [
      { by: 'b', say: "My hands are purple." },
      { by: 'a', say: "My back hurts. That's from the footballs." },
      { by: 'b', say: "I'm going to be so sore tomorrow." },
    ] },
  ],
};

const gourds = {
  'task-start.any': [
    { id: 'gsv2.gd-s5', when: GD, turns: [
      { beat: '{a} gives the cricket bat a practice swing. It\'s much heavier than it looks and swings {a} round half a turn.' },
      { by: 'a', say: "This bat is so heavy." },
      { by: 'b', say: "Hold it lower. You'll be fine." },
    ] },
    { id: 'gsv2.gd-s6', when: GD, turns: [
      { by: 'b', say: "In order. You have to go in order. Don't skip to the easy-looking ones." },
      { by: 'a', say: "Okay. In order." },
      { by: 'b', say: "Just don't miss." },
    ] },
    { id: 'gsv2.gd-s7', when: GD, turns: [
      { beat: '{a} walks down the row, looking at each gourd up close.' },
      { by: 'a', say: "Number six is really small." },
      { by: 'b', say: "Then take your time on six." },
      { by: 'a', say: "Okay. Six. Got it." },
    ] },
    { id: 'gsv2.gd-s8', when: GD, turns: [
      { by: 'a', say: "Feet apart. Bat back. Eye on the gourd. Anything else?" },
      { by: 'b', say: "Breathe. You always forget to breathe." },
      { by: 'a', say: "Feet, bat, eye, breathe. Okay." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsv2.gd-f5', when: GD, turns: [
      { beat: '{a} smashes the first gourd, steps, smashes the second, steps, and smashes the rest the same way.' },
      { by: 'b', say: "You didn't even stop to look!" },
      { by: 'a', say: "If I stopped, I'd have missed." },
    ] },
    { id: 'gsv2.gd-f6', when: GD, turns: [
      { by: 'b', say: "Pretend every one is something that annoys you." },
      { by: 'a', say: "Okay. Okay. Here goes." },
      { beat: 'Ten swings, ten gourds in the grass. The ranger claps.' },
      { by: 'a', say: "That felt so good." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gsv2.gd-a5', when: GD, turns: [
      { by: 'b', say: "You're swinging down at them. Swing flat." },
      { by: 'a', say: "Flat. Okay." },
      { beat: '{a} swings flat ten times, and ten gourds fly off ten posts.' },
      { by: 'b', say: "That's it! All ten!" },
    ] },
    { id: 'gsv2.gd-a6', when: GD, turns: [
      { beat: 'Before the next row, {a} wraps a strip of cloth round the handle of the bat so it stops slipping in {a.posAdj} sweaty hands.' },
      { by: 'a', say: "That's so much better." },
      { beat: 'With grip, every swing lands where {a} aims it, and all ten gourds go down in ten swings.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gsv2.gd-t4', when: GD, turns: [
      { beat: '{a} is at gourd number three, bat raised, and has been there for a long time.' },
      { by: 'b', say: "Why aren't you swinging?" },
      { by: 'a', say: "This is where I missed last time. I'm scared of it now." },
    ] },
    { id: 'gsv2.gd-t5', when: GD, turns: [
      { by: 'b', say: "You'll be fine. Just swing." },
      { by: 'a', say: "Okay. Okay." },
      { by: 'b', say: "Swing!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsv2.gd-x4', when: GD, turns: [
      { beat: '{a} hits the gourd perfectly. It flies off, hits the next post along, and knocks that gourd off too. Wrong order.' },
      { by: 'a', say: "Two in one! That's good, isn't it?" },
      { by: 'b', say: "One swing each! It doesn't count! Back up they go!" },
    ] },
    { id: 'gsv2.gd-x5', when: GD, turns: [
      { beat: 'Nine gourds down. {a} turns to grin at {b}, swings at the tenth without looking, and hits the air.' },
      { by: 'a', say: "No. No." },
      { by: 'b', say: "Never look away! Back to the start!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gsv2.gd-dn4', when: GD, turns: [
      { beat: 'A pair of birds land in the grass and start pecking at the smashed gourds.' },
      { by: 'b', say: "Look at that. They're eating it." },
      { by: 'a', say: "Good. Somebody should." },
    ] },
    { id: 'gsv2.gd-dn5', when: GD, turns: [
      { by: 'a', say: "Ten for ten." },
      { by: 'b', say: "It took us thirty swings to get to ten for ten." },
      { by: 'a', say: "Nobody needs to know that." },
    ] },
    { id: 'gsv2.gd-dn6', when: GD, turns: [
      { by: 'b', say: "Can I have a go? Just one? For fun?" },
      { by: 'a', say: "They're all smashed." },
      { by: 'b', say: "Next time, then." },
    ] },
  ],
};

const safari = {
  'task-start.any': [
    { id: 'gsv2.sf-s5', when: SF, turns: [
      { beat: 'The ranger hands {a} the blowpipe and {b} a little pouch of darts, then puts a finger to his lips.' },
      { by: 'a', say: "Why is it so long? It's longer than my arm." },
      { by: 'b', say: "Shh. He said shh." },
      { by: 'a', say: "Okay. Quiet." },
    ] },
    { id: 'gsv2.sf-s6', when: SF, turns: [
      { by: 'b', say: "What animal is it? Did he say?" },
      { by: 'a', say: "He just said 'big'." },
      { by: 'b', say: "Okay. Look for something big." },
    ] },
    { id: 'gsv2.sf-s7', when: SF, turns: [
      { beat: '{a} and {b} crawl into the grass on their elbows, very slowly.' },
      { by: 'a', say: "Fresh tracks. It's close." },
      { by: 'b', say: "It was here a minute ago." },
    ] },
    { id: 'gsv2.sf-s8', when: SF, turns: [
      { by: 'a', say: "One whistle means left. Two whistles means right. Three means...?" },
      { by: 'b', say: "I don't know. Let's hope he doesn't do three." },
      { by: 'a', say: "Okay." },
      { by: 'b', say: "Shh. Listen." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsv2.sf-f5', when: SF, turns: [
      { beat: '{b} points at a line of broken stalks. {a} follows it, parts the grass, and the animal is right there, chewing, its back turned.' },
      { by: 'a', say: "Sorry. This won't hurt." },
      { beat: 'A soft puff, a little dart in its rump, a long yawn, and the animal sinks into the grass. The ranger tags its ear.' },
    ] },
    { id: 'gsv2.sf-f6', when: SF, turns: [
      { by: 'b', say: "Wait. Let it come to the water. Everything comes to the water." },
      { beat: 'They lie flat by the watering hole. The animal walks down to drink, {b} puffs the dart, and it lies down for a nap right there.' },
      { by: 'a', say: "We didn't even have to chase it!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gsv2.sf-a5', when: SF, turns: [
      { by: 'a', say: "My dart keeps dropping. I'm not blowing hard enough." },
      { by: 'b', say: "One big, hard puff. Like birthday candles." },
      { by: 'a', say: "Okay. One big puff." },
      { beat: '{a} takes a big breath and puffs hard. The dart hits, the animal yawns and lies down, and the ranger tags it.' },
    ] },
    { id: 'gsv2.sf-a6', when: SF, turns: [
      { beat: 'After losing it twice, {a} climbs a termite mound and looks out over the top of the grass.' },
      { by: 'a', say: "I can see the grass moving! It's going round to the trees!" },
      { beat: '{b} cuts through to the trees, waits, and darts the animal as it steps out. It naps, and the ranger tags it.' },
      { by: 'b', say: "The view from up there! We should've climbed it first!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gsv2.sf-t4', when: SF, turns: [
      { beat: '{a} and {b} have been crouching in the grass for a long time, not moving.' },
      { by: 'a', say: "My legs are going numb." },
      { by: 'b', say: "Don't move. It's close." },
    ] },
    { id: 'gsv2.sf-t5', when: SF, turns: [
      { by: 'b', say: "Those tracks go in a circle. We've walked in a circle." },
      { by: 'a', say: "So it's behind us?" },
      { by: 'b', say: "I don't know. Let's ask the ranger." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsv2.sf-x4', when: SF, turns: [
      { beat: '{a} raises the blowpipe, takes a deep breath to blow, and sneezes into it instead. The dart flops out onto the grass.' },
      { by: 'a', say: "Sorry! It's the grass!" },
      { by: 'b', say: "It heard you! It's gone! After it!" },
    ] },
    { id: 'gsv2.sf-x5', when: SF, turns: [
      { beat: 'The dart hits. The animal yawns, wobbles, and lies down. The ranger walks over, looks at it, and shakes his head. It\'s a warthog, not their animal.' },
      { by: 'b', say: "It's asleep, though! That's something!" },
      { by: 'a', say: "Let it nap. Back to the tracks!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gsv2.sf-dn4', when: SF, turns: [
      { beat: 'The ranger lets {a} and {b} kneel beside the sleeping animal for a moment while he checks the tag.' },
      { by: 'a', say: "It's so soft. I didn't think it'd be soft." },
      { by: 'b', say: "Don't touch it. Let it sleep." },
    ] },
    { id: 'gsv2.sf-dn5', when: SF, turns: [
      { by: 'b', say: "Did you hear it snoring?" },
      { by: 'a', say: "It was so cute." },
      { by: 'b', say: "Come on. Let's go." },
    ] },
    { id: 'gsv2.sf-dn6', when: SF, turns: [
      { by: 'a', say: "I've got grass seeds in my socks, my hair, my ears..." },
      { by: 'b', say: "Me too. I'm so itchy." },
      { by: 'a', say: "We'll get it out later. Come on." },
    ] },
  ],
};

export default mergePools(plums, gourds, safari);
