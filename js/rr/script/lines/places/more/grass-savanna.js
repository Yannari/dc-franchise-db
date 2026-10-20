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
      { beat: 'A little girl in a football shirt three sizes too big lines up a ball, looks straight at {a}, and smiles.' },
      { by: 'a', say: "She's aiming at me. She's so small, and she's aiming at me." },
      { by: 'b', say: "Smile back. Maybe she'll aim at someone else." },
    ] },
    { id: 'gsv2.pl-s6', when: PL, turns: [
      { by: 'b', say: "Only the purple ones. The green ones aren't ready." },
      { by: 'a', say: "The purple ones are at the top." },
      { by: 'b', say: "Of course they are. Climb." },
    ] },
    { id: 'gsv2.pl-s7', when: PL, turns: [
      { beat: '{a} gives the tree a shake. Plums rain down all over {a} and {b}, and so does a startled lizard.' },
      { by: 'b', say: "That's one way to do it." },
      { by: 'a', ...V("Pick them up before the children see. The ground's a free target.", "Grab them before the children notice.", "Grab them. Fast.", "PICK them UP before they SEE us!", "Let's pick them up quickly, before the children notice they're on the ground.", "Plums on the ground are plums in danger.") },
    ] },
    { id: 'gsv2.pl-s8', when: PL, turns: [
      { by: 'a', say: "How full is full? Is level full, or heaped full?" },
      { by: 'b', say: "Heaped. It said to the brim." },
      { by: 'a', say: "The brim's a long way up for a basket this big." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsv2.pl-f5', when: PL, turns: [
      { beat: '{b} holds the basket out in front like a goalkeeper, catching plums from {a} with one hand and batting footballs away with the other.' },
      { by: 'a', say: "You're saving everything!" },
      { by: 'b', say: "I'm a wall! A plum-catching wall!" },
      { beat: 'Not one ball gets through, and the elder takes the brimming basket with a big, slow nod.' },
    ] },
    { id: 'gsv2.pl-f6', when: PL, turns: [
      { by: 'a', say: "Put your jacket over the top. Every time we drop some in, close the lid." },
      { beat: 'Plums in, jacket over, plums in, jacket over. The balls bounce off the jacket every time, and the basket arrives at the elder full to the brim.' },
      { by: 'b', say: "My jacket took one for the team. Twenty for the team." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gsv2.pl-a5', when: PL, turns: [
      { by: 'b', say: "They only kick when we're bending down. So we don't bend down. Pick high, never low." },
      { by: 'a', say: "And the ones on the ground?" },
      { by: 'b', say: "Leave them. They're the children's now." },
      { beat: 'Picking only from the high branches, standing tall, they fill the basket before the children find a way to hit it.' },
    ] },
    { id: 'gsv2.pl-a6', when: PL, turns: [
      { beat: 'This time {a} hands the children a plum each before starting. They stop kicking to eat them.' },
      { by: 'a', say: "Pick! Pick while they're chewing!" },
      { beat: 'By the time the last child has finished, the basket is full, and the elder is laughing too hard to stand up straight.' },
      { by: 'b', say: "You bribed them with plums!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gsv2.pl-t4', when: PL, turns: [
      { beat: '{a} is up the plum tree, out of reach of the footballs, and won\'t come down.' },
      { by: 'b', say: "Throw them down to me!" },
      { by: 'a', say: "If I throw, they'll see me! I'm hiding!" },
    ] },
    { id: 'gsv2.pl-t5', when: PL, turns: [
      { by: 'b', say: "There are more children than before. Where are they coming from?" },
      { by: 'a', say: "The word's out. We're the best game in the village." },
      { by: 'b', say: "I don't want to be a game!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsv2.pl-x4', when: PL, turns: [
      { beat: '{b} dives to save the basket from a shot, catches the ball, and lands on the basket. Plum juice everywhere.' },
      { by: 'b', say: "I saved it! I saved the basket!" },
      { by: 'a', say: "You sat on the plums! Squashed ones don't count! Pick again!" },
    ] },
    { id: 'gsv2.pl-x5', when: PL, turns: [
      { beat: 'A goat wanders over while they\'re picking, puts its head in the basket and tips it over to get at the plums.' },
      { by: 'a', say: "The goat! The goat's on their side!" },
      { by: 'b', say: "Everything's on their side! Pick them up!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gsv2.pl-dn4', when: PL, turns: [
      { by: 'a', say: "Do you think they practise on everyone? Or just us?" },
      { by: 'b', say: "Everyone. That girl had a list." },
      { by: 'a', say: "I hope she crossed us off." },
    ] },
    { id: 'gsv2.pl-dn5', when: PL, turns: [
      { beat: 'As {a} and {b} leave the village, the children chase after them, kicking one football along, all the way to the edge of the plum trees.' },
      { by: 'b', say: "They're seeing us off." },
      { by: 'a', say: "They're making sure we actually leave." },
    ] },
    { id: 'gsv2.pl-dn6', when: PL, turns: [
      { by: 'b', say: "My hands are purple." },
      { by: 'a', say: "My back's purple. That's from the footballs." },
      { by: 'b', say: "We match." },
    ] },
  ],
};

const gourds = {
  'task-start.any': [
    { id: 'gsv2.gd-s5', when: GD, turns: [
      { beat: '{a} gives the cricket bat a practice swing. It\'s much heavier than it looks and swings {a} round half a turn.' },
      { by: 'a', say: "The bat's in charge. I'm just holding on." },
      { by: 'b', say: "Then point the bat at the gourds and hope." },
    ] },
    { id: 'gsv2.gd-s6', when: GD, turns: [
      { by: 'b', say: "In order. You have to go in order. Don't skip to the easy-looking ones." },
      { by: 'a', say: "They all look easy. They're on sticks." },
      { by: 'b', say: "That's what they want you to think." },
    ] },
    { id: 'gsv2.gd-s7', when: GD, turns: [
      { beat: '{a} walks down the row, looking at each gourd up close. One has a face drawn on it in charcoal.' },
      { by: 'a', say: "Somebody's drawn a face on number six." },
      { by: 'b', say: "That's just to make you feel bad." },
      { by: 'a', say: "It's working." },
    ] },
    { id: 'gsv2.gd-s8', when: GD, turns: [
      { by: 'a', say: "Feet apart. Bat back. Eye on the gourd. Anything else?" },
      { by: 'b', say: "Breathe. You always forget to breathe." },
      { by: 'a', say: "Feet, bat, eye, breathe. That's too many things." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsv2.gd-f5', when: GD, turns: [
      { beat: '{a} smashes the first gourd, steps, smashes the second, steps, and smashes the rest the same way, like a farmer cutting wheat.' },
      { by: 'b', say: "You didn't even stop to look!" },
      { by: 'a', say: "If I'd stopped, I'd have started thinking." },
    ] },
    { id: 'gsv2.gd-f6', when: GD, turns: [
      { by: 'b', say: "Pretend every one is something that annoys you." },
      { by: 'a', say: "Alarm clock. Traffic. Socks that slip down. Cold toast." },
      { beat: 'Ten annoying things, ten swings, ten gourds in the grass. The ranger claps.' },
      { by: 'a', say: "That was very healing." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gsv2.gd-a5', when: GD, turns: [
      { by: 'b', say: "You're swinging down at them, like chopping wood. Swing flat. Like you're sweeping a table." },
      { by: 'a', say: "Sweep the table." },
      { beat: '{a} sweeps the table ten times, and ten gourds fly off ten posts.' },
      { by: 'b', say: "Clean table!" },
    ] },
    { id: 'gsv2.gd-a6', when: GD, turns: [
      { beat: 'Before the next row, {a} wraps a strip of cloth round the handle of the bat so it stops slipping in {a.posAdj} sweaty hands.' },
      { by: 'a', say: "Grip. That's all I needed. Grip." },
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
      { by: 'b', say: "That was a great swing. It just didn't hit anything." },
      { by: 'a', say: "Thank you." },
      { by: 'b', say: "That wasn't a compliment." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsv2.gd-x4', when: GD, turns: [
      { beat: '{a} hits the gourd perfectly. It flies off, hits the next post along, and knocks that gourd off too. Wrong order.' },
      { by: 'a', say: "Two for one! That's good, isn't it?" },
      { by: 'b', say: "One swing each! It doesn't count! Back up they go!" },
    ] },
    { id: 'gsv2.gd-x5', when: GD, turns: [
      { beat: 'Nine gourds down. {a} turns to grin at {b}, swings at the tenth without looking, and hits the air.' },
      { by: 'a', say: "Don't say it." },
      { by: 'b', say: "Never look away! Back to the start!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gsv2.gd-dn4', when: GD, turns: [
      { beat: 'A pair of birds land in the grass and start pecking at the smashed gourds.' },
      { by: 'b', say: "At least somebody's getting lunch out of it." },
      { by: 'a', say: "Tell them they're welcome." },
    ] },
    { id: 'gsv2.gd-dn5', when: GD, turns: [
      { by: 'a', say: "Ten for ten. Write it on something." },
      { by: 'b', say: "It took us thirty swings to get to ten for ten." },
      { by: 'a', say: "Nobody needs to know about the other twenty." },
    ] },
    { id: 'gsv2.gd-dn6', when: GD, turns: [
      { by: 'b', say: "Can I have a go? Just one? For fun?" },
      { by: 'a', say: "They're all smashed." },
      { by: 'b', say: "Then I'll wait for the next team's." },
    ] },
  ],
};

const safari = {
  'task-start.any': [
    { id: 'gsv2.sf-s5', when: SF, turns: [
      { beat: 'The ranger hands {a} the blowpipe and {b} a little pouch of darts, then puts a finger to his lips.' },
      { by: 'a', say: "Why is it so long? It's longer than my arm." },
      { by: 'b', say: "Shh. He said shh." },
      { by: 'a', say: "He didn't say anything. He did a finger." },
    ] },
    { id: 'gsv2.sf-s6', when: SF, turns: [
      { by: 'b', say: "What animal is it? Did he say?" },
      { by: 'a', say: "He just said 'big'." },
      { by: 'b', say: "Everything here is big. The grass is big." },
    ] },
    { id: 'gsv2.sf-s7', when: SF, turns: [
      { beat: '{a} and {b} crawl into the grass on their elbows, very slowly, and immediately put their hands in something warm.' },
      { by: 'a', say: "Don't look down." },
      { by: 'b', ...V("At least we know it was here. It was very recently here.", "At least we know it was here.", "It was here.", "At least we KNOW it was here! Very RECENTLY here!", "Well, at least we know it was here, and quite recently.", "The animal has left us a message.") },
    ] },
    { id: 'gsv2.sf-s8', when: SF, turns: [
      { by: 'a', say: "One whistle means left. Two whistles means right. Three means...?" },
      { by: 'b', say: "Three means run." },
      { by: 'a', say: "He didn't tell us that." },
      { by: 'b', say: "He didn't have to." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsv2.sf-f5', when: SF, turns: [
      { beat: '{b} points at a line of broken stalks. {a} follows it, parts the grass, and the animal is right there, chewing, its back turned.' },
      { by: 'a', say: "Hello. Sorry. This won't hurt." },
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
      { by: 'a', say: "My dart keeps dropping. I'm blowing too soft, like I'm cooling soup." },
      { by: 'b', say: "Blow like you're blowing out every candle on a cake." },
      { by: 'a', say: "A very old person's cake." },
      { beat: '{a} blows out a very old person\'s cake. The dart hits, the animal yawns and lies down, and the ranger tags it.' },
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
      { beat: '{a} and {b} have been crouching in the grass so long that a bird has landed on {b}\'s head.' },
      { by: 'a', say: "Don't move. You're camouflaged now." },
      { by: 'b', say: "I'm not camouflaged. I'm a nest." },
    ] },
    { id: 'gsv2.sf-t5', when: SF, turns: [
      { by: 'b', say: "Those tracks go in a circle. We've walked in a circle." },
      { by: 'a', say: "So it's behind us?" },
      { by: 'b', say: "Or we're behind it. Or we're following ourselves." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsv2.sf-x4', when: SF, turns: [
      { beat: '{a} raises the blowpipe, takes a deep breath to blow, and sneezes into it instead. The dart flops out onto the grass.' },
      { by: 'a', say: "Pollen! It's all this grass!" },
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
      { by: 'b', say: "Don't stroke it. If it wakes up, it'll remember your face." },
    ] },
    { id: 'gsv2.sf-dn5', when: SF, turns: [
      { by: 'b', say: "Did you see how it snored? It snored like my uncle." },
      { by: 'a', say: "Your uncle doesn't have a tag in his ear." },
      { by: 'b', say: "Not yet." },
    ] },
    { id: 'gsv2.sf-dn6', when: SF, turns: [
      { by: 'a', say: "I've got grass seeds in my socks, my hair, my ears..." },
      { by: 'b', say: "You're going to grow a lawn." },
      { by: 'a', say: "Then I'll be the best hiding place on the whole plain." },
    ] },
  ],
};

export default mergePools(plums, gourds, safari);
