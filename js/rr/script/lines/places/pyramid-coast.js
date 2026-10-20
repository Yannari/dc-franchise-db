// Pyramid Coast's own lines (js/rr/places/pyramid-coast.js), 1:1 with the real leg ("El Bunny Supremo"), in our own
// words:
//   the taxi       to the cliffs: goats on the road.
//   pepper + jump  All-In: one eats a mild, hot or fiery pepper and waves its flag; the other jumps into the sea from the
//                  ledge of that colour (the hotter the pepper, the lower the jump) and swims back a canteen of milk; a
//                  pepper not finished or a jump refused means picking again. a eats, b jumps.
//   the burros     along the coast to the step pyramid: a burro sits down in the road.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'pyramid-coast' };
const PC = { taskId: 'pepper-cliff' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'pyc.op1', when: P, turns: [
      beat("Don stands on a cliff above a bright blue sea, in a huge straw hat, a step pyramid in the hazy distance behind him."),
      don("Welcome to Pyramid Coast! Ancient pyramids, beautiful beaches, and food so spicy it can strip paint. I know. I tried it. My lips are still numb."),
      don("Today, one of you eats a pepper, and one of you jumps off a cliff. Which one is worse depends on the pepper."),
      beat('A street vendor offers him a chilli on a stick. Don shakes his head very fast.'),
    ] },
    { id: 'pyc.op2', when: P, turns: [
      don("Pyramid Coast. The sea is warm, the sun is hot, and the peppers are hotter. Everything here wants to make you sweat."),
      don("Racers, there's a taxi at the end of the road. Hold on to it. The road has goats on it."),
      beat('A goat wanders past behind him and eats the corner of his script. He lets it.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'pyc.op3', when: P, turns: [
      beat("Don is lying in a hammock under a palm-leaf roof, a glass of milk balanced on his chest."),
      don("Pyramid Coast. This is milk. You're going to want it later. Taxi's on the road."),
      don("I'm not sharing."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'pyc.ar1', when: P, turns: [
      beat("The road climbs round a headland, and the coast opens up: blue sea, white sand, and a stone pyramid rising out of the jungle."),
      by('a', "There's a pyramid. On the beach. Just sitting there."),
      by('b', "Somebody built that by hand. Hundreds of years ago."),
      by('a', "And now we get to look at it. That's amazing."),
    ] },
    { id: 'pyc.ar2', when: P, turns: [
      by('b', "Smell that. Something's cooking. Something good."),
      by('a', "Something spicy."),
      by('b', "Something amazing and spicy."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'pyc.ad1', when: P, turns: [
      by('a', "The tip has a picture of a pepper, and a picture of a cliff."),
      by('b', "Are they connected? Tell me they're not connected."),
      by('a', "There's an arrow between them."),
    ] },
    { id: 'pyc.ad2', when: P, turns: [
      beat("{a} looks over the edge of the cliff at the waves crashing far below."),
      by('a', "That's a long way down."),
      by('b', "That's the high ledge. There are lower ones."),
    ] },
  ],
};

// ── the taxi and the burros (mishaps) ──
const roads = {
  'travel-mishap.any': [
    { id: 'pyc.tm1', when: { taskId: 'cliff-taxi', mishap: 'goats-on-the-road' }, turns: [
      beat("The taxi stops dead. A herd of goats is standing in the road, chewing, and not in a hurry."),
      by('a', "Beep at them!"),
      by('b', "He did. They looked at him. They kept chewing."),
      beat('Twenty minutes later, the last goat wanders off into the bushes.'),
    ] },
    { id: 'pyc.tm2', when: { taskId: 'burro-ride', mishap: 'burro-sits-down' }, turns: [
      beat("Halfway along the coast trail, {a}'s burro stops, folds its legs, and sits down in the dust."),
      by('a', "It sat down! With me on it!"),
      by('b', "Ask it nicely to stand up!"),
      beat('It takes twenty minutes and most of a bag of carrots before the burro stands up again.'),
    ] },
  ],
};

// ── the pepper and the jump (All-In: a eats, b jumps) ──
const pepper = {
  'don-demo.gag': [
    { id: 'pyc.pc-d1', when: PC, turns: [
      don("In this All-In, one of you eats a whole pepper: mild, hot, or fiery. The other one jumps into the sea from the ledge with the same colour flag."),
      beat('He holds up a tiny red pepper, sniffs it, and his eyes immediately start to water.'),
      don("The hotter the pepper, the lower the ledge. The milder the pepper, the bigger the jump. Choose wisely. Choose very wisely."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'pyc.pc-d2', when: PC, turns: [
      don("The jumper grabs a canteen of milk at the bottom and swims it back up to the eater. If the pepper isn't finished, or the jump is refused, you pick again."),
      don("Milk in a burning mouth gets you the next tip. Trust me, you'll want it."),
      beat('The pepper vendor grins, and arranges the fiery peppers at the front of the cart.'),
    ] },
  ],
  'task-start.any': [
    { id: 'pyc.pc-s1', when: PC, turns: [
      beat("{a} and {b} stand at the chilli cart, looking at three bowls of peppers: green, orange, and a deep, angry red."),
      by('a', "Mild means you jump off the top."),
      by('b', "Fiery means you eat the red one. Choose."),
    ] },
    { id: 'pyc.pc-s2', when: PC, turns: [
      by('b', "I'm a good jumper. Eat the mild one. I'll jump from the top."),
      by('a', "That's a really long way down."),
      by('b', "And that's a really small pepper. Eat it."),
    ] },
    { id: 'pyc.pc-s3', when: PC, turns: [
      beat("{a} picks up the red pepper, looks at it, and puts it down again. Then picks it up again."),
      by('a', "It's small. How bad can something this small be?"),
      by('b', "Ask the man. He's laughing."),
    ] },
    { id: 'pyc.pc-s4', when: PC, turns: [
      by('a', "If I eat the hot one, you only have to jump off the middle bit."),
      by('b', "And if you can't finish it?"),
      by('a', "Then I'm finishing it."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'pyc.pc-f1', when: PC, turns: [
      beat("{a} eats the fiery pepper in one bite, waves the red flag, and {b} jumps off the low ledge in the same second."),
      by('a', "Milk! Milk! Milk, milk, milk!"),
      beat("{b} swims back with the canteen. {a} drinks the whole thing without stopping."),
    ] },
    { id: 'pyc.pc-f2', when: PC, turns: [
      by('b', "Green flag! Mild! I'm going off the top!"),
      beat("{b} runs off the highest ledge, screaming all the way down, and comes up holding the canteen."),
      by('a', "You did it! You did the high one!"),
    ] },
    { id: 'pyc.pc-f3', when: PC, turns: [
      beat("{a} eats the hot pepper, chews twice, swallows, and calmly waves the orange flag."),
      by('b', "Are you okay? You look okay."),
      by('a', "I'm not okay. Jump. Jump now. Bring milk."),
    ] },
    { id: 'pyc.pc-f4', when: PC, turns: [
      by('a', "That was so much better than I expected!"),
      by('b', "The pepper or the jump?"),
      by('a', "The milk. The milk was so much better than I expected."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'pyc.pc-a1', when: PC, turns: [
      by('b', "I couldn't do the top one. So go hotter. I'll do the middle."),
      beat("{a} eats the hot pepper. {b} jumps off the middle ledge without stopping to look, and comes up with the milk."),
      by('a', "Milk! Give me the milk!"),
    ] },
    { id: 'pyc.pc-a2', when: PC, turns: [
      beat("Second pepper. {a} doesn't chew this time, just swallows it whole, and waves the flag."),
      by('a', "Don't chew! Never chew! Jump!"),
      beat("{b} jumps. The milk comes back up the cliff. The tip is theirs."),
    ] },
    { id: 'pyc.pc-a3', when: PC, turns: [
      by('a', "Fine. The red one. The fiery one. So you can jump off the lowest ledge."),
      beat('{a} eats it, turns purple, and waves the red flag. {b} is in the water before the flag stops moving.'),
      by('b', "Milk's coming! Hold on!"),
    ] },
    { id: 'pyc.pc-a4', when: PC, turns: [
      beat("{b} stands on the high ledge for the second time, takes a deep breath, and this time jumps."),
      by('b', "I did it! I did it! Where's the milk?"),
      by('a', "Under you! It's right under you! Swim!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'pyc.pc-t1', when: PC, turns: [
      beat("{a} has eaten half the pepper and is fanning {a.posAdj} mouth with both hands, eyes streaming."),
      by('a', "I can't finish it. I can't. It's on fire. I'm on fire."),
      by('b', "Half a pepper isn't a pepper! Finish it!"),
    ] },
    { id: 'pyc.pc-t2', when: PC, turns: [
      by('b', "I can't jump. I've been standing here five minutes, and I can't."),
      by('a', "I ate a pepper for you!"),
      by('b', "I know! I'm trying!"),
    ] },
    { id: 'pyc.pc-t3', when: PC, turns: [
      beat("{b} is in the water, swimming in circles, looking for the canteen."),
      by('b', "Where's the milk? I can't find the milk!"),
      by('a', "Left! It's floating left! Hurry!"),
    ] },
  ],
  'task-done.any': [
    { id: 'pyc.pc-dn1', when: PC, turns: [
      by('a', "I can't feel my tongue."),
      by('b', "I can't feel my legs."),
      by('a', "Then we're even."),
    ] },
    { id: 'pyc.pc-dn2', when: PC, turns: [
      beat("{a} and {b} walk away from the cliff, {b} dripping, {a} still drinking milk out of a second canteen."),
      by('b', "Where did you get another one?"),
      by('a', "The pepper man felt sorry for me."),
    ] },
    { id: 'pyc.pc-dn3', when: PC, turns: [
      by('b', "Burros next. We ride donkeys to a pyramid."),
      by('a', "That's the best thing anybody has said to me today."),
      by('b', "It's been a weird day."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'pyc.pc-x1', when: PC, turns: [
      beat("{a} bites the fiery pepper, coughs, and spits the whole thing out into the dust."),
      by('a', "Nope. No. Absolutely not."),
      by('b', "That means a new pepper! Pick again!"),
    ] },
    { id: 'pyc.pc-x2', when: PC, turns: [
      beat("{b} walks to the edge of the high ledge, looks down, and walks straight back."),
      by('b', "I can't. It's too high. I'm sorry."),
      by('a', "Then I'm eating a hotter one. Back to the cart."),
    ] },
    { id: 'pyc.pc-x3', when: PC, turns: [
      beat("{a} waves the orange flag, and {b} jumps off the ledge with the green flag. The judge on the cliff shakes his head."),
      by('a', "Wrong ledge! You jumped off the wrong ledge!"),
      by('b', "They all look the same from up there!"),
    ] },
  ],
};

export default mergePools(place, roads, pepper);
