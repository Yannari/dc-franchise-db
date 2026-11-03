// Bamboo Wall Hills' own lines (js/rr/places/bamboo-wall-hills.js), in our own words:
//   the bus           through the bamboo hills: a panda sitting in the road.
//   the wall race     All-In: a section of the ancient wall, steep steps up to one watchtower and down to the next, to
//                     the last tower before the monk strikes his gong; late, or without the partner, and it's the start.
//   the delicacies    Botch or Watch: thousand-year eggs, fried scorpions on sticks, a soup with things floating in it,
//                     and one the cook won't name; every bite. a eats, b watches.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'bamboo-wall-hills' };
const WL = { taskId: 'wall-race' };
const DL = { taskId: 'delicacies' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'bwh.op1', when: P, turns: [
      beat("Don stands on top of an ancient stone wall that winds away over misty green hills, a forest of bamboo swaying below."),
      don("Welcome to the Bamboo Wall Hills! Bamboo as far as the eye can see, pandas eating it, and a wall that's hundreds of years old!"),
      don("Today, teams race along the wall against a gong, and then eat a meal I was too scared to look at. I looked at it. I'm still scared."),
      beat('Somewhere along the wall, a gong booms, and Don jumps.'),
    ] },
    { id: 'bwh.op2', when: P, turns: [
      don("The Bamboo Wall Hills. The steps on this wall are all different heights. On purpose. To trip people. Nine hundred years ago, it worked. It still works."),
      don("Racers, buses leave from the village. Hold on to the rails. The roads are mostly bends."),
      beat('A bus winds round a hairpin bend far below, horn blaring the whole way round.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'bwh.op3', when: P, turns: [
      beat("Don sits in a little tea room on the wall, sipping from a tiny cup, a bowl of dumplings in front of him."),
      don("Bamboo Wall Hills. These dumplings are perfect. You'll be eating something else. The bus is at the village."),
      don("Off you go. Take the steps slowly. Or fast. It's a race."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'bwh.ar1', when: P, turns: [
      beat("The bus climbs out of the bamboo, and the wall appears, snaking along the top of every ridge, watchtower after watchtower, into the mist."),
      by('a', "It goes on forever. Look, it disappears into the clouds."),
      by('b', "People built that. By hand. Stone by stone."),
      by('a', "And we have to run on it."),
    ] },
    { id: 'bwh.ar2', when: P, turns: [
      beat("In the bamboo beside the road, a panda sits chewing a stalk, looking completely unbothered by everything."),
      by('b', "A panda! A real panda!"),
      by('a', "It's so cute. I want to stay and watch it."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'bwh.ad1', when: P, turns: [
      by('a', "The tip says 'before the gong'. When is the gong?"),
      by('b', "It doesn't say. Only the monk knows."),
      by('a', "So we just run and hope."),
    ] },
    { id: 'bwh.ad2', when: P, turns: [
      by('b', "'Who will eat anything?' That's never a good question."),
      by('a', "It means food. Weird food."),
      by('b', "I know. I'm scared."),
    ] },
  ],
};

// ── the bus (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'bwh.tm1', when: { taskId: 'bamboo-bus', mishap: 'panda-in-the-road' }, turns: [
      beat("The bus stops. A panda is sitting in the middle of the road, eating bamboo, and has no plans to move."),
      by('a', "Can we go round it?"),
      by('b', "The driver says you never move a panda. You wait for the panda."),
      beat('Twenty minutes and one finished stalk of bamboo later, the panda rolls off into the forest.'),
    ] },
  ],
};

// ── the wall race (All-In) ──
const wall = {
  'don-demo.gag': [
    { id: 'bwh.wl-d1', when: WL, turns: [
      don("In this All-In, run the length of this section of the wall, up to every watchtower and down again, and reach the last tower before the monk strikes his gong."),
      beat('He jogs up three steps to demonstrate, stops, puts his hands on his knees, and breathes very heavily.'),
      don("There are a thousand of those. I did three. I'm done."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'bwh.wl-d2', when: WL, turns: [
      don("Get there after the gong, or without your partner, and you walk back to the start of the section and run it again."),
      don("Both of you in the tower before the gong, and the next tip is yours. Only the monk knows when the gong goes. Don't ask him. He doesn't talk."),
      beat('At the far tower, a tiny figure in orange robes stands beside a huge bronze gong, holding a mallet, perfectly still.'),
    ] },
  ],
  'task-start.any': [
    { id: 'bwh.wl-s1', when: WL, turns: [
      beat("{a} and {b} start up the first flight of steps, and the steps are steep, uneven, and every one is a different height."),
      by('a', "Why is this one so tall? And that one so short?"),
      by('b', "I don't know! Just watch your feet!"),
    ] },
    { id: 'bwh.wl-s2', when: WL, turns: [
      by('b', "Pace yourself. It's a long way. Don't sprint the first bit."),
      by('a', "But the gong!"),
      by('b', "We won't beat the gong if we collapse at tower two."),
    ] },
    { id: 'bwh.wl-s3', when: WL, turns: [
      beat("{a} and {b} reach the first watchtower, gasping, and see the wall drop away down a steep hill and rise up another one."),
      by('a', "That's the next bit? Down that and up that?"),
      by('b', "Down's the easy part. Go."),
    ] },
    { id: 'bwh.wl-s4', when: WL, turns: [
      by('a', "How many towers are there?"),
      by('b', "I count seven."),
      by('a', "Seven. Okay. Let's go."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'bwh.wl-f1', when: WL, turns: [
      beat("{a} and {b} charge through the last watchtower door together, and a second later, the gong booms behind them."),
      by('b', "We made it! Before the gong!"),
      by('a', "Just before! One second before!"),
    ] },
    { id: 'bwh.wl-f2', when: WL, turns: [
      by('a', "Up, down, up, down. Don't stop."),
      beat("They never stop, tower after tower, and reach the last one with the monk's mallet still raised."),
      by('b', "He hasn't even swung it yet! We're early!"),
    ] },
    { id: 'bwh.wl-f3', when: WL, turns: [
      beat("{a} grabs {b}'s hand on the steepest stretch and pulls them both up the last flight into the tower."),
      by('b', "You pulled me the whole way up!"),
      by('a', "Together! Before the gong!"),
    ] },
    { id: 'bwh.wl-f4', when: WL, turns: [
      by('b', "First try! The whole wall!"),
      by('a', "My legs are shaking so much."),
      by('b', "Mine too. But we made it."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'bwh.wl-a1', when: WL, turns: [
      by('b', "We went too fast at the start and died at the end. This time, steady. The same speed all the way."),
      beat("At the same steady speed all the way, they reach the last tower before the gong."),
      by('a', "Steady worked! We made it!"),
    ] },
    { id: 'bwh.wl-a2', when: WL, turns: [
      beat("Second run. {a} and {b} take the downhill bits at a run and the uphill bits at a walk, and beat the gong by a breath."),
      by('a', "Run down, walk up! It worked!"),
      by('b', "Just in time!"),
    ] },
    { id: 'bwh.wl-a3', when: WL, turns: [
      by('a', "I keep leaving you behind. So we hold hands. The whole way. Nobody gets left."),
      beat("Hand in hand, the whole way, and they cross into the last tower together, before the gong."),
      by('b', "Nobody left behind!"),
    ] },
    { id: 'bwh.wl-a4', when: WL, turns: [
      beat("After two gongs and two long walks back, {a} and {b} finally reach the last tower in time."),
      by('a', "Third time! Before the gong!"),
      by('b', "I never want to see this wall again."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'bwh.wl-t1', when: WL, turns: [
      beat("{a} is sitting on a step halfway up a hill, head between knees, breathing very hard."),
      by('a', "I can't. These steps are too big."),
      by('b', "One step at a time! Just the next one!"),
    ] },
    { id: 'bwh.wl-t2', when: WL, turns: [
      by('b', "We've run it twice and missed the gong twice."),
      by('a', "Maybe he's watching us. Maybe he waits till we're close."),
      by('b', "He's not. We're just too slow. Come on."),
    ] },
    { id: 'bwh.wl-t3', when: WL, turns: [
      beat("The mist rolls in so thick that {a} and {b} can barely see the next step in front of them."),
      by('a', "Where's the next tower? I can't see the next tower!"),
      by('b', "Keep going up! The tower's always up!"),
    ] },
  ],
  'task-done.any': [
    { id: 'bwh.wl-dn1', when: WL, turns: [
      by('a', "I'll never complain about stairs again."),
      by('b', "These weren't stairs. They were mountains."),
      by('a', "My legs are never going to forgive me."),
    ] },
    { id: 'bwh.wl-dn2', when: WL, turns: [
      beat("{a} and {b} sit on the floor of the last watchtower, while the monk bows to them, very slightly."),
      by('b', "He bowed! He bowed to us!"),
      by('a', "Bow back! Quickly, bow back!"),
    ] },
    { id: 'bwh.wl-dn3', when: WL, turns: [
      by('b', "Food next. The bowl."),
      by('a', "After all that running?"),
      by('b', "That's the order on the tip."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'bwh.wl-x1', when: WL, turns: [
      beat("BONG. The gong booms across the hills while {a} and {b} are still two towers away."),
      by('a', "No! Not yet!"),
      by('b', "Back to the start! Again!"),
    ] },
    { id: 'bwh.wl-x2', when: WL, turns: [
      beat("{a} reaches the last tower before the gong, turns round, and {b} is still a whole hill behind."),
      by('a', "We have to be together!"),
      by('b', "I know! Back to the start!"),
    ] },
    { id: 'bwh.wl-x3', when: WL, turns: [
      beat("{b} trips on one of the uneven steps and slides back down a whole flight."),
      by('b', "Ow! These steps!"),
      by('a', "Up you get! We'll never beat the gong now! Back to the start!"),
    ] },
  ],
};

// ── the bowl of delicacies (Botch or Watch: a eats, b watches) ──
const bowl = {
  'don-demo.gag': [
    { id: 'bwh.dl-d1', when: DL, turns: [
      don("In this Botch or Watch, eat this bowl of the hills' finest delicacies. Every bite."),
      beat('He lifts the lid. A thousand-year egg, black and green, stares up at him. He puts the lid back on.'),
      don("There's a thousand-year egg, fried scorpions, a soup with things in it, and something the cook won't tell me about. Enjoy!"),
    ] },
  ],
  'don-demo.dry': [
    { id: 'bwh.dl-d2', when: DL, turns: [
      don("Leave anything, or bring anything back up, and you get a fresh bowl. The other one of you watches. From a safe distance."),
      don("An empty bowl, shown to the cook, gets you the next tip. The cook made all of this with love. Remember that while you're chewing."),
      beat('The cook, behind the table, smiles warmly and holds up a scorpion on a stick.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'bwh.dl-w1', when: DL, turns: [
      by('b', "I did the last one. So you're eating."),
      by('a', "Of course I am. Of course it's the bowl."),
      by('b', "Think of it as lunch."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'bwh.dl-w2', when: DL, turns: [
      by('a', "I'll eat it. I'll eat anything."),
      by('b', "Are you sure?"),
      by('a', "I'm sure. Let me do it."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'bwh.dl-w3', when: DL, turns: [
      by('b', "I'm a really fussy eater. You know that. You do it."),
      by('a', "I'm fussy too!"),
      by('b', "You eat cold pizza for breakfast. You're not fussy."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'bwh.dl-w4', when: DL, turns: [
      by('a', "'Who will eat anything?' You. You've eaten things off the floor."),
      by('b', "Only if they just fell."),
      by('a', "Exactly. You'll eat anything."),
    ] },
  ],
  'task-start.any': [
    { id: 'bwh.dl-s1', when: DL, turns: [
      beat("{a} sits down in front of the bowl, picks up the chopsticks, and stares at the thousand-year egg staring back."),
      by('a', "It's black. Why is it black?"),
      by('b', "It's meant to be! Just eat it!"),
    ] },
    { id: 'bwh.dl-s2', when: DL, turns: [
      by('b', "Scorpions first. Get the crunchy ones out of the way."),
      by('a', "Is that a good strategy?"),
      by('b', "It's the only strategy I've got."),
    ] },
    { id: 'bwh.dl-s3', when: DL, turns: [
      beat("{a} picks up a fried scorpion on a stick, holds it at arm's length, and looks at it for a long time."),
      by('a', "I can't. I can see its legs."),
      by('b', "Don't look at the legs! Eat it!"),
    ] },
    { id: 'bwh.dl-s4', when: DL, turns: [
      by('a', "What's the thing in the soup?"),
      by('b', "Don't ask. Just drink."),
      by('a', "Okay. Okay. Drinking."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'bwh.dl-f1', when: DL, turns: [
      beat("{a} eats everything in the bowl, one thing after another, without stopping, and slams the empty bowl down."),
      by('b', "You ate the whole thing! First go!"),
      by('a', "Don't talk to me for an hour."),
    ] },
    { id: 'bwh.dl-f2', when: DL, turns: [
      by('a', "Done. Done. Don't let me think about it."),
      beat("The cook looks into the empty bowl, beams, and hands over the tip."),
      by('b', "She's so happy! Look at her!"),
    ] },
    { id: 'bwh.dl-f3', when: DL, turns: [
      beat("{a} tastes the thousand-year egg, stops, and looks surprised."),
      by('a', "That's actually nice. That's really nice."),
      by('b', "Then eat the rest of it! Quickly, before you change your mind!"),
    ] },
    { id: 'bwh.dl-f4', when: DL, turns: [
      by('b', "First try! Every bite!"),
      by('a', "Even the one she wouldn't tell us about."),
      by('b', "What did it taste like?"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'bwh.dl-a1', when: DL, turns: [
      by('b', "You didn't chew last time. Chew. Slowly. And breathe through your nose."),
      beat("{a} chews slowly, breathes through {a.posAdj} nose, and gets through the whole second bowl."),
      by('a', "That was so much better."),
    ] },
    { id: 'bwh.dl-a2', when: DL, turns: [
      beat("Second bowl. This time {a} eats it in the order the cook recommends, and it all stays down."),
      by('a', "Her way worked! It all stayed down!"),
      by('b', "Thank you! Thank you so much!"),
    ] },
    { id: 'bwh.dl-a3', when: DL, turns: [
      by('a', "I'm going to pretend it's all chicken. Every bit of it."),
      beat("{a} keeps going, bite after bite, and empties the bowl to the last drop."),
      by('b', "You did it! Every bite!"),
    ] },
    { id: 'bwh.dl-a4', when: DL, turns: [
      beat("After two bowls that didn't stay down, {a} finally finishes the third one."),
      by('a', "Third bowl. Finished. Don't talk to me."),
      by('b', "Nobody's moving. Take your time."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'bwh.dl-t1', when: DL, turns: [
      beat("{a} has had a scorpion halfway to {a.posAdj} mouth for a whole minute and hasn't moved it any closer."),
      by('a', "I can't. Its legs."),
      by('b', "Don't look at its legs! Eat it!"),
    ] },
    { id: 'bwh.dl-t2', when: DL, turns: [
      by('b', "How much is left?"),
      by('a', "The thing she won't name."),
      by('b', "That's the only thing left?"),
    ] },
    { id: 'bwh.dl-t3', when: DL, turns: [
      beat("{a} sips the soup, finds something chewy floating in it, and puts the spoon down very slowly."),
      by('a', "There's something in it. I don't know what it is."),
      by('b', "Don't look! Just drink!"),
    ] },
  ],
  'task-done.any': [
    { id: 'bwh.dl-dn1', when: DL, turns: [
      by('a', "I'm never eating an egg again."),
      by('b', "Not even a normal one?"),
      by('a', "Not for a long time."),
    ] },
    { id: 'bwh.dl-dn2', when: DL, turns: [
      beat("{a} and {b} walk away from the table, {a} still sipping water, very, very slowly."),
      by('b', "You were so brave."),
      by('a', "I'm never doing that again."),
    ] },
    { id: 'bwh.dl-dn3', when: DL, turns: [
      by('b', "Did you ever find out what the last thing was?"),
      by('a', "I asked her after. She just smiled."),
      by('b', "I don't want to know."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'bwh.dl-x1', when: DL, turns: [
      beat("{a} eats the thousand-year egg, goes pale, and runs for the edge of the wall."),
      by('b', "Oh no. Oh no, no, no."),
      beat('The cook sighs, and sets down a fresh bowl.'),
    ] },
    { id: 'bwh.dl-x2', when: DL, turns: [
      beat("{a} shows the cook the bowl. She looks inside, finds one scorpion leg at the bottom, and shakes her head."),
      by('a', "One leg! It's one tiny leg!"),
      by('b', "It still counts! New bowl!"),
    ] },
    { id: 'bwh.dl-x3', when: DL, turns: [
      beat("{a} hides the unnamed thing under a napkin. The cook lifts the napkin, and points at a fresh bowl."),
      by('a', "How did she know?"),
      by('b', "She watched you do it! Start again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'bwh.dl-v1', when: DL, turns: [
      by('b', "You can do it! Keep going!"),
      by('a', "I'm chewing! Don't make me laugh while I'm chewing!"),
      by('b', "Sorry! Just keep going!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'bwh.dl-v2', when: DL, turns: [
      beat("{b} watches {a} eat with both hands over {b.posAdj} mouth."),
      by('b', "I can't watch. I feel sick for you."),
      by('a', "Then stop watching!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'bwh.dl-v3', when: DL, turns: [
      beat("{b} reaches over and quietly eats one of the scorpions out of {a}'s bowl."),
      by('b', "There. That's one fewer for you."),
      beat('The cook sees it, tuts, and points at {b}. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'bwh.dl-v4', when: DL, turns: [
      beat("{b} sits across the table in total silence, giving {a} a thumbs up after every bite."),
      by('a', "Say something."),
      by('b', "You're doing great. I just don't want to put you off."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'bwh.dl-h1', when: DL, turns: [
      beat("While the cook turns to the stove, {b} slides a big jug of water right next to {a}'s bowl."),
      by('a', "Where did the water come from?"),
      by('b', "Don't worry about it. Drink."),
    ] },
  ],
};

export default mergePools(place, roads, wall, bowl);
