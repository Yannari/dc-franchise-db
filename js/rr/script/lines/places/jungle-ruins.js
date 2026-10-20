// Jungle Ruins' own lines (js/rr/places/jungle-ruins.js), in our own words:
//   the canoe        up the river: it tips over.
//   the jungle trail All-In: painted stones through the rainforest, a log over a piranha stream, giant hairy caterpillars
//                    dropping from branches; off the log, lost stones or turning back and it's the last stone again.
//   the golden idol  All-In: dozens of golden idols in the carved wall, one real, the rest painted clay; the old guide
//                    scratches each with a coin.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'jungle-ruins' };
const JT = { taskId: 'jungle-trail' };
const GI = { taskId: 'golden-idol' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'jgr.op1', when: P, turns: [
      beat("Don stands on a riverbank in the rainforest, in a safari hat with a net over his face, completely covered in bug spray."),
      don("Welcome to the Jungle Ruins! A rainforest so thick the sun never reaches the ground, and at the end of it, a city nobody has lived in for five hundred years."),
      don("Today, teams cross the jungle, avoid the piranhas, and find some gold. Real gold. One piece of real gold. Good luck."),
      beat('A caterpillar the size of a hot dog drops from a branch onto his hat. He does not look up. He knows.'),
    ] },
    { id: 'jgr.op2', when: P, turns: [
      don("The Jungle Ruins. Hot, wet, and full of things that bite. And that's just the air."),
      don("Racers, your canoes are on the bank. Paddle upstream. Keep your hands out of the water. I'll explain why later. Or the piranhas will."),
      beat('Something silver flashes in the river beside him. Don steps back from the edge.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'jgr.op3', when: P, turns: [
      beat("Don lies in a hammock under a mosquito net, fanning himself with a giant leaf, sipping from a coconut."),
      don("Jungle Ruins. I'm in a net. The bugs are out there. Canoes are on the bank."),
      don("Go find some gold. Bring me back a coconut."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'jgr.ar1', when: P, turns: [
      beat("The canoe rounds a bend, and through a gap in the trees, the ruins appear high on the mountain: stone walls and steps, half eaten by the jungle."),
      by('a', "Look! Up there! A whole city!"),
      by('b', "Made of stone. On top of a mountain. Five hundred years ago."),
      by('a', "How did they even get the stones up there?"),
    ] },
    { id: 'jgr.ar2', when: P, turns: [
      by('b', "Everything is so green. I didn't know there were this many greens."),
      by('a', "And so loud. Every tree is singing."),
      by('b', "That's not singing. That's bugs."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'jgr.ad1', when: P, turns: [
      by('a', "The tip says 'piranhas'. With an arrow."),
      by('b', "An arrow pointing where?"),
      by('a', "Pointing at the river."),
    ] },
    { id: 'jgr.ad2', when: P, turns: [
      beat("Something big and hairy crawls slowly along a branch at head height, right next to {a}."),
      by('a', "What is that? Is that a caterpillar?"),
      by('b', "It's the size of my arm. That's not a caterpillar. That's a scarf."),
    ] },
  ],
};

// ── the canoe (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'jgr.tm1', when: { taskId: 'river-canoe', mishap: 'canoe-tips' }, turns: [
      beat("{a} reaches for an overhanging branch, the canoe leans, and tips both of them into the brown river."),
      by('a', "Out! Out of the water! Before anything bites!"),
      by('b', "Grab the paddles! Grab the canoe!"),
      beat('Twenty dripping minutes later, they are back in the canoe, paddling twice as hard.'),
    ] },
  ],
};

// ── the jungle trail (All-In) ──
const trail = {
  'don-demo.gag': [
    { id: 'jgr.jt-d1', when: JT, turns: [
      don("In this All-In, follow the painted stones through the jungle to the ruins. Across the log over the stream, past the caterpillars, all the way."),
      beat('He steps onto the log to demonstrate, looks down at the stream, where the water is bubbling with silver fish, and steps straight back.'),
      don("The stream has piranhas. Hundreds. Don't fall off the log. I'll say it again: don't fall off the log."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'jgr.jt-d2', when: JT, turns: [
      don("Fall off the log, lose the painted stones, or turn back from a caterpillar, and you go back to the last stone and find your way again."),
      don("Both of you at the foot of the ruins gets you the next tip. The caterpillars are harmless. Mostly. They're very itchy."),
      beat('A giant caterpillar drops off a branch onto a crew member, who screams and runs into the trees.'),
    ] },
  ],
  'task-start.any': [
    { id: 'jgr.jt-s1', when: JT, turns: [
      beat("{a} and {b} plunge into the jungle, following a stone painted with a bright red arrow."),
      by('a', "There's the next one! Red arrow! This way!"),
      by('b', "Watch for caterpillars! Look up as well as down!"),
    ] },
    { id: 'jgr.jt-s2', when: JT, turns: [
      by('b', "The log. That's the log. Over the piranhas."),
      by('a', "It's so thin. It's so wet."),
      by('b', "Arms out. Small steps. Don't look down."),
    ] },
    { id: 'jgr.jt-s3', when: JT, turns: [
      beat("{a} edges along the log, arms out, as the stream below boils with silver fish."),
      by('a', "They're jumping! They're jumping at my feet!"),
      by('b', "Keep going! Don't stop!"),
    ] },
    { id: 'jgr.jt-s4', when: JT, turns: [
      by('a', "Is that a stone? Or just a stone?"),
      by('b', "It's got paint on it. It's a stone stone."),
      by('a', "Good. Follow the stone stones."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'jgr.jt-f1', when: JT, turns: [
      beat("{a} and {b} cross the log without a wobble, duck every caterpillar, and burst out of the trees at the foot of the ruins."),
      by('b', "We're here! We're through!"),
      by('a', "Not one bite! Not one itch!"),
    ] },
    { id: 'jgr.jt-f2', when: JT, turns: [
      by('a', "Stone! Stone! Stone! Ruins!"),
      beat("They follow every painted stone without missing one, and the jungle opens onto the ancient steps."),
      by('b', "You're amazing at stones!"),
    ] },
    { id: 'jgr.jt-f3', when: JT, turns: [
      beat("{a} crosses the log in four quick steps, turns, and reaches out a hand to help {b} across."),
      by('b', "You were so fast!"),
      by('a', "I didn't want to give the fish time to think about it."),
    ] },
    { id: 'jgr.jt-f4', when: JT, turns: [
      by('b', "First go! The whole jungle! First go!"),
      by('a', "I've got a caterpillar on my back, haven't I?"),
      by('b', "Yes. But first go!"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'jgr.jt-a1', when: JT, turns: [
      by('b', "We lost the stones because we were running. This time we walk, and we look."),
      beat("They walk and look, and every painted stone is right where it should be, all the way to the ruins."),
      by('a', "Walking is faster than running! Who knew?"),
    ] },
    { id: 'jgr.jt-a2', when: JT, turns: [
      beat("Second try at the log. {a} crawls across on hands and knees this time, and makes it."),
      by('a', "Crawling counts! Crawling definitely counts!"),
      by('b', "It's not pretty, but it counts!"),
    ] },
    { id: 'jgr.jt-a3', when: JT, turns: [
      by('a', "Close your eyes when we pass the caterpillars. I'll lead you."),
      beat("{b} closes {b.posAdj} eyes, holds on to {a}'s shoulder, and they walk right past the caterpillar trees to the ruins."),
      by('b', "I didn't see a single one!"),
    ] },
    { id: 'jgr.jt-a4', when: JT, turns: [
      beat("After one fall off the log and one long detour, {a} and {b} finally stumble out at the foot of the ruins."),
      by('a', "We made it! We're wet and itchy, but we made it!"),
      by('b', "Mostly itchy."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'jgr.jt-t1', when: JT, turns: [
      beat("{a} is frozen in the middle of the log, arms out, refusing to move."),
      by('a', "I can't go forward. I can't go back. I'm going to live on this log."),
      by('b', "You can't live on a log! Take one step!"),
    ] },
    { id: 'jgr.jt-t2', when: JT, turns: [
      by('b', "We haven't seen a painted stone in ten minutes."),
      by('a', "Every stone is a stone. How do I know which one is painted?"),
      by('b', "The painted one has paint!"),
    ] },
    { id: 'jgr.jt-t3', when: JT, turns: [
      beat("A caterpillar drops onto {a}'s head. {a} stops dead and doesn't move a muscle."),
      by('a', "Take it off. Take it off. Please take it off."),
      by('b', "I'm not touching it! Shake your head!"),
    ] },
  ],
  'task-done.any': [
    { id: 'jgr.jt-dn1', when: JT, turns: [
      by('a', "I'm itchy everywhere. Everywhere."),
      by('b', "That's the caterpillars."),
      by('a', "I didn't even touch a caterpillar."),
    ] },
    { id: 'jgr.jt-dn2', when: JT, turns: [
      beat("{a} and {b} stand at the foot of the ancient stone wall, staring up at the ruins rising above them."),
      by('b', "It's huge. It's so much bigger up close."),
      by('a', "And somewhere in it, there's real gold."),
    ] },
    { id: 'jgr.jt-dn3', when: JT, turns: [
      by('b', "We beat the piranhas."),
      by('a', "We beat the log."),
      by('b', "We beat the jungle."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'jgr.jt-x1', when: JT, turns: [
      beat("{a} slips on the log, and goes into the stream with a splash. The water boils."),
      by('a', "Out! Out! Out!"),
      by('b', "Back to the last stone! Quickly!"),
    ] },
    { id: 'jgr.jt-x2', when: JT, turns: [
      beat("{a} and {b} push through the trees, and realise they haven't seen a painted stone in a very long time."),
      by('b', "We're lost. We're properly lost."),
      by('a', "Back. Back to the last stone we saw."),
    ] },
    { id: 'jgr.jt-x3', when: JT, turns: [
      beat("A whole cluster of caterpillars blocks the trail. {b} takes one look and turns round."),
      by('b', "No. Absolutely not. Another way."),
      by('a', "There is no other way! That's the trail!"),
    ] },
  ],
};

// ── the golden idol (All-In) ──
const idol = {
  'don-demo.gag': [
    { id: 'jgr.gi-d1', when: GI, turns: [
      don("In this All-In, find the one real golden idol in this wall. There are dozens. One is real gold. The rest are clay, painted gold."),
      beat('He picks one up, bites it like a coin, and immediately regrets it.'),
      don("That one's clay. Don't bite them. Take them to the guide, and she'll scratch them with a coin."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'jgr.gi-d2', when: GI, turns: [
      don("Bring her a fake, and it goes back in its hole, and you choose again. The carvings on the wall might help. Might."),
      don("The real golden idol gets you the next tip. The fakes get you nothing but a lecture."),
      beat('The old guide sits on the steps with a coin in her hand, ready to scratch.'),
    ] },
  ],
  'task-start.any': [
    { id: 'jgr.gi-s1', when: GI, turns: [
      beat("{a} and {b} stare up at the carved wall, a little golden idol sitting in every niche, all of them glinting."),
      by('a', "They all look the same. They all look real."),
      by('b', "Look at the carvings. There must be a clue."),
    ] },
    { id: 'jgr.gi-s2', when: GI, turns: [
      by('b', "Real gold's heavy. Pick one up. Feel how heavy it is."),
      by('a', "This one's light."),
      by('b', "Then it's fake. Next one."),
    ] },
    { id: 'jgr.gi-s3', when: GI, turns: [
      beat("{a} runs a hand along the carvings, tracing a line of little suns."),
      by('a', "The suns point somewhere. They're all pointing the same way."),
      by('b', "Follow the suns."),
    ] },
    { id: 'jgr.gi-s4', when: GI, turns: [
      by('a', "What if we just take them all to her? One after the other?"),
      by('b', "There are about fifty."),
      by('a', "Then let's be clever instead."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'jgr.gi-f1', when: GI, turns: [
      beat("{b} picks up an idol, weighs it in one hand, and frowns. It's heavy. The guide scratches it. It shines underneath."),
      by('b', "It's real! First one! It's real!"),
      by('a', "You found real gold! In a wall!"),
    ] },
    { id: 'jgr.gi-f2', when: GI, turns: [
      by('a', "The suns all point to this one. This one at the top."),
      beat("{a} climbs up, takes the idol at the top of the wall, and the guide's coin leaves a bright gold scratch."),
      by('b', "The suns were right!"),
    ] },
    { id: 'jgr.gi-f3', when: GI, turns: [
      beat("{a} notices one idol sits in a niche with no dust in it, and takes it down. It's the real one."),
      by('b', "How did you know?"),
      by('a', "Every other niche is dusty. This one wasn't. Someone put it there today."),
    ] },
    { id: 'jgr.gi-f4', when: GI, turns: [
      by('b', "Real gold. First try."),
      by('a', "Can we keep it?"),
      by('b', "No. But we held it. We held real gold."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'jgr.gi-a1', when: GI, turns: [
      by('b', "The fakes are all light. So we only take the heavy ones."),
      beat("They lift idol after idol, put back every light one, and the first heavy one is real."),
      by('a', "Heavy is real! Heavy is always real!"),
    ] },
    { id: 'jgr.gi-a2', when: GI, turns: [
      beat("After two fakes, {a} finally reads the carvings properly, and they lead straight to one idol."),
      by('a', "It's this one. The carvings say this one."),
      beat("The guide scratches it. Gold. The tip is theirs."),
    ] },
    { id: 'jgr.gi-a3', when: GI, turns: [
      by('a', "The fakes have a chip on the base. Look. Real gold wouldn't chip."),
      beat("They check every base. Only one has no chip. It's the real one."),
      by('b', "You're a detective! A gold detective!"),
    ] },
    { id: 'jgr.gi-a4', when: GI, turns: [
      beat("Third trip to the guide. She scratches it, looks at it, and smiles. Real gold."),
      by('a', "Third time! Third time lucky!"),
      by('b', "I was starting to think the real one didn't exist."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'jgr.gi-t1', when: GI, turns: [
      beat("{a} and {b} have a pile of fake idols at their feet, every one of them clay."),
      by('a', "That's nine fakes. Nine."),
      by('b', "That's nine we don't have to try again."),
    ] },
    { id: 'jgr.gi-t2', when: GI, turns: [
      by('b', "These carvings don't mean anything. They're just pictures."),
      by('a', "They're pictures that mean something to somebody."),
      by('b', "Not to us."),
    ] },
    { id: 'jgr.gi-t3', when: GI, turns: [
      beat("{a} is up on the wall, reaching for an idol at the very top, one foot in a niche, the other dangling."),
      by('a', "I can nearly reach it!"),
      by('b', "Don't fall off an ancient wall! Please!"),
    ] },
  ],
  'task-done.any': [
    { id: 'jgr.gi-dn1', when: GI, turns: [
      by('a', "I held a piece of real gold, five hundred years old."),
      by('b', "And then gave it back."),
      by('a', "And then gave it back. But I held it."),
    ] },
    { id: 'jgr.gi-dn2', when: GI, turns: [
      beat("{a} and {b} start up the ancient stone steps towards the top of the ruins, and the Chill Zone."),
      by('b', "How many steps are there?"),
      by('a', "Don't count. Just climb."),
    ] },
    { id: 'jgr.gi-dn3', when: GI, turns: [
      by('b', "That guide smiled at us."),
      by('a', "Because we finally got it right."),
      by('b', "Because she's nice."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'jgr.gi-x1', when: GI, turns: [
      beat("The guide scratches the idol with her coin. Under the gold paint is grey clay."),
      by('a', "Fake! It's a fake!"),
      by('b', "Put it back! Choose again!"),
    ] },
    { id: 'jgr.gi-x2', when: GI, turns: [
      beat("{b} drops an idol on the stone floor, and it breaks clean in half. Clay."),
      by('b', "Well, that's definitely a fake."),
      by('a', "We'll take that as a no."),
    ] },
    { id: 'jgr.gi-x3', when: GI, turns: [
      beat("The guide looks at the idol they hand her, doesn't even scratch it, and shakes her head."),
      by('a', "You didn't even check!"),
      by('b', "She didn't need to. Back to the wall."),
    ] },
  ],
};

export default mergePools(place, roads, trail, idol);
