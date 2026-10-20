// Outback Farm's own lines (js/rr/places/outback-farm.js), 1:1 with the real leg ("Down and Outback"), in our own words:
//   the ute        to the farm: a kangaroo in the road.
//   the rabbits    All-In: ten rabbits in a sack before they wreck the wheat; a badly tied sack lets them out and the
//                  count starts again from what's still in the bag; the one white rabbit counts as all ten.
//   the glider     over the valley to the mountain mat: it loses the thermal.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'outback-farm' };
const BN = { taskId: 'bunnies' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'obf.op1', when: P, turns: [
      beat("Don stands at a farm gate in a wide-brimmed hat, flies buzzing round his face, the wheat stretching off to the horizon."),
      don("Welcome to Outback Farm! Wide open skies, endless wheat fields, and about ten thousand rabbits who are eating all of it."),
      don("Today, teams play farmer. And then they fly. Not like birds. Like people strapped to a kite."),
      beat('A rabbit hops right between his feet. Don looks down at it. It looks up at him. It wins.'),
    ] },
    { id: 'obf.op2', when: P, turns: [
      don("Outback Farm. The nearest shop is three hours away, and it only sells hats. I bought this hat."),
      don("Racers, there's a ute at the gate. It's a truck. Everybody here calls it a ute. Don't ask me why."),
      beat('A sheepdog runs up, sniffs Don\'s shoes, and walks away, unimpressed.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'obf.op3', when: P, turns: [
      beat("Don is lying on a hay bale in the shade of the barn, his hat over his face."),
      don("Outback Farm. It's very hot. There are rabbits. Go and catch some."),
      don("I'd help, but I'm busy. Being on a hay bale."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'obf.ar1', when: P, turns: [
      beat("The ute bounces down the dirt road, and the land opens out: red earth, gold wheat, and sky from edge to edge."),
      by('a', "There's nothing here. In the best way. Nothing at all."),
      by('b', "There's a kangaroo. Look, by the fence. A real one."),
      by('a', "Okay. There's nothing and a kangaroo."),
    ] },
    { id: 'obf.ar2', when: P, turns: [
      by('b', "The sky is so big here. Why is the sky bigger here?"),
      by('a', "It's the same sky. There's just nothing in the way."),
      by('b', "It feels bigger."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'obf.ad1', when: P, turns: [
      by('a', "'Catch ten rabbits.' How fast are rabbits?"),
      by('b', "Faster than us. Definitely faster than you."),
      by('a', "Thanks."),
    ] },
    { id: 'obf.ad2', when: P, turns: [
      beat('A cloud of flies finds {a} the second {a.sub} steps out of the ute.'),
      by('a', "Why are they all on me? Why only me?"),
      by('b', "You smell like a sandwich."),
    ] },
  ],
};

// ── the ute and the glider (mishaps) ──
const roads = {
  'travel-mishap.any': [
    { id: 'obf.tm1', when: { taskId: 'ute-drive', mishap: 'kangaroo-in-the-road' }, turns: [
      beat('A kangaroo bounds out of the bush and stops in the middle of the dirt road. The ute skids to a halt.'),
      by('a', "Is it going to move?"),
      by('b', "It's staring at us. It's not moving. It's winning."),
      beat("Fifteen minutes later, it finally hops off into the wheat, and they're moving again."),
    ] },
    { id: 'obf.tm2', when: { taskId: 'valley-glide', mishap: 'loses-the-thermal' }, turns: [
      beat("Halfway over the valley, the glider stops rising, and starts, gently but surely, to sink."),
      by('a', "Why are we going down? We're supposed to be going up!"),
      by('b', "We lost the warm air! Find more warm air!"),
      beat('They land in a field a long walk short of the mat, and jog the rest of the way.'),
    ] },
  ],
};

// ── the rabbits (All-In) ──
const bunnies = {
  'don-demo.gag': [
    { id: 'obf.bn-d1', when: BN, turns: [
      don("In this All-In, catch ten of the rabbits wrecking this farmer's wheat and put them in your sack. They're fast. They zigzag. They're very good at this."),
      beat('He lunges at a rabbit by his feet. It is gone before his hands get there. He lunges again at nothing.'),
      don("That one doesn't count. That was a warm-up."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'obf.bn-d2', when: BN, turns: [
      don("Tie your sack properly, or they'll get out, and you'll be counting again from whatever's left inside."),
      don("There's one rare white rabbit somewhere in the field. Catch that, and it counts as all ten. Good luck finding it."),
      beat('The farmer, beside him, holds up ten fingers, then one finger, then shrugs.'),
    ] },
  ],
  'task-start.any': [
    { id: 'obf.bn-s1', when: BN, turns: [
      beat('{a} and {b} stand at the edge of the wheat, a sack in hand, rabbits everywhere they look.'),
      by('a', "There are hundreds. How hard can ten be?"),
      by('b', "Watch that one. Watch how fast that one is."),
    ] },
    { id: 'obf.bn-s2', when: BN, turns: [
      by('b', "We corner them. You chase, I catch. Teamwork."),
      by('a', "Why do I chase?"),
      by('b', "Because I'm better at catching."),
    ] },
    { id: 'obf.bn-s3', when: BN, turns: [
      beat("{a} creeps up on a rabbit very slowly, on tiptoe, arms out, holding {a.posAdj} breath."),
      by('a', "Nice bunny. Good bunny. Stay right there, bunny."),
      beat('The rabbit waits until the very last second, and leaves.'),
    ] },
    { id: 'obf.bn-s4', when: BN, turns: [
      by('a', "Keep an eye out for the white one."),
      by('b', "I'm keeping both eyes out for any of them."),
      by('a', "The white one's worth all ten, though."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'obf.bn-f1', when: BN, turns: [
      beat("{a} and {b} work the field like sheepdogs, driving rabbit after rabbit into a corner of the fence, and bag ten without losing one."),
      by('a', "Ten! Count them! Ten!"),
      by('b', "The farmer's counting. He's nodding. Ten!"),
    ] },
    { id: 'obf.bn-f2', when: BN, turns: [
      by('b', "There! The white one! Under the tractor!"),
      beat('{b} dives under the tractor and comes out holding a fluffy white rabbit, looking very pleased with itself.'),
      by('a', "That's all ten in one! You caught all ten in one!"),
    ] },
    { id: 'obf.bn-f3', when: BN, turns: [
      beat("{a} sits down very still in the wheat, and one by one the rabbits hop right up to {a.obj}."),
      by('a', "They come to you if you're calm. Just be calm."),
      by('b', "How are you this calm? Bag them!"),
    ] },
    { id: 'obf.bn-f4', when: BN, turns: [
      by('a', "Tie it tight. Tie it so tight nothing gets out."),
      beat("Nothing gets out. The farmer opens the sack, counts ten, and hands over the tip."),
      by('b', "We're rabbit catchers now. That's a real job here."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'obf.bn-a1', when: BN, turns: [
      by('b', "They got out because we didn't tie it. So this time, we tie it after every single rabbit."),
      beat('They tie it after every single rabbit. It takes longer, but the farmer counts ten.'),
      by('a', "Slow and tied. That's the secret."),
    ] },
    { id: 'obf.bn-a2', when: BN, turns: [
      beat("After an hour of chasing, {a} trips over something soft and white in the wheat, and grabs it on instinct."),
      by('a', "It's the white one! I fell on the white one!"),
      by('b', "Don't let go! That's all ten of them!"),
    ] },
    { id: 'obf.bn-a3', when: BN, turns: [
      by('a', "Stop chasing them. Herd them. Into the corner by the barn."),
      beat('Herded into the corner by the barn, the rabbits have nowhere to go. Ten go into the sack.'),
      by('b', "Herding! Herding was the answer all along!"),
    ] },
    { id: 'obf.bn-a4', when: BN, turns: [
      beat("Back to six, then eight, then nine, and with one last dive, {b} gets the tenth."),
      by('b', "Ten! That's ten! Somebody count!"),
      beat('The farmer counts. Ten. He hands them the tip.'),
    ] },
  ],
  'task-try.struggling': [
    { id: 'obf.bn-t1', when: BN, turns: [
      beat("{a} is lying face down in the wheat after another dive, empty-handed, as a rabbit hops away."),
      by('a', "I touched it. I touched it, I swear."),
      by('b', "Touching doesn't count! Get up!"),
    ] },
    { id: 'obf.bn-t2', when: BN, turns: [
      by('b', "We had seven. We had seven, and they all got out."),
      by('a', "Who tied the sack?"),
      by('b', "You did."),
    ] },
    { id: 'obf.bn-t3', when: BN, turns: [
      beat('{a} and {b} are both chasing the same rabbit, from opposite sides, and run straight into each other.'),
      by('a', "That was my rabbit!"),
      by('b', "Nobody has a rabbit! That's the problem!"),
    ] },
  ],
  'task-done.any': [
    { id: 'obf.bn-dn1', when: BN, turns: [
      by('a', "I'm going to miss them a bit."),
      by('b', "They bit you."),
      by('a', "Only a little bit. Gently."),
    ] },
    { id: 'obf.bn-dn2', when: BN, turns: [
      beat("{a} and {b} jog away from the barn towards the glider, covered in wheat and rabbit fur."),
      by('b', "A glider now. We fly now."),
      by('a', "I've never flown anything. I've only chased rabbits."),
    ] },
    { id: 'obf.bn-dn3', when: BN, turns: [
      by('b', "The farmer smiled at us. Did you see? He actually smiled."),
      by('a', "We saved his wheat."),
      by('b', "We saved about ten stalks of his wheat."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'obf.bn-x1', when: BN, turns: [
      beat("{a} sets the sack down for one second, and three rabbits wriggle straight out of the top."),
      by('a', "No! Come back! We had you!"),
      by('b', "Count again! What's left?"),
    ] },
    { id: 'obf.bn-x2', when: BN, turns: [
      beat("The farmer opens the sack, counts, and holds up nine fingers. He shakes his head."),
      by('b', "Nine? I was sure it was ten!"),
      by('a', "One more! Just one more!"),
    ] },
    { id: 'obf.bn-x3', when: BN, turns: [
      beat("{b} dives at a rabbit, misses, and lands in a patch of thistles."),
      by('b', "Ow! Ow! Everything here bites or stings!"),
      by('a', "Get up! It went that way!"),
    ] },
  ],
};

export default mergePools(place, roads, bunnies);
