// Ice Floe's own lines (js/rr/places/ice-floe.js), 1:1 with the real leg ("Lord of the Ring Toss"), in our own words:
//   the small plane  to the tundra airstrip: a whiteout.
//   the narwhal      Botch or Watch: dig a ring out of the snow, throw it from behind the line onto the narwhal's tusk;
//                    a miss sinks, so it's back to digging. a throws, b watches.
//   the igloo        All-In: saw blocks, build the dome ring by ring; a local inspects it, and one that sags, gaps or
//                    falls in comes down to be built again.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'ice-floe' };
const NW = { taskId: 'narwhal' };
const IG = { taskId: 'igloo' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'ifl.op1', when: P, turns: [
      beat("Don stands on the ice in the biggest parka ever made, only his eyes visible through the fur, his breath freezing in the air."),
      don("Welcome to Ice Floe! The top of the world. It's forty below. I can't feel my face. I can't feel my anything."),
      don("Today, teams play ring toss with a narwhal, and build their own home out of ice!"),
      beat('A gust of wind blows his hood back, and he pulls it straight back up.'),
    ] },
    { id: 'ifl.op2', when: P, turns: [
      don("Ice Floe. In summer, the sun never sets. In winter, it never rises. Today, it's somewhere in between, and so am I."),
      don("Racers, there's a tiny plane on the runway, and it's the only way in!"),
      beat('Behind him, the propeller of a very small plane coughs, splutters and starts.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'ifl.op3', when: P, turns: [
      beat("Don sits inside a heated tent, only his face poking out of the flap, holding a mug of soup in both mittens."),
      don("Ice Floe. I'm not coming out of this tent. Plane's on the runway."),
      don("Go on. Bring me back a narwhal. Kidding. Please don't."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'ifl.ar1', when: P, turns: [
      beat('The little plane drops out of the clouds over a world of white: ice to the horizon, cracked by black lines of open sea.'),
      by('a', "There's nothing. Just white. Forever."),
      by('b', "It's so beautiful."),
      by('a', "And so cold."),
    ] },
    { id: 'ifl.ar2', when: P, turns: [
      beat("Out of the little plane's window, a long spiral tusk rises out of the water by the ice edge, and a narwhal breathes out, a puff of mist."),
      by('b', "What is that? Is that a narwhal?"),
      by('a', "It's a narwhal. They're real. I didn't know they were real."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'ifl.ad1', when: P, turns: [
      by('a', "My eyelashes are frozen."),
      by('b', "Mine too. Blink a lot."),
      by('a', "It's so cold!"),
    ] },
    { id: 'ifl.ad2', when: P, turns: [
      by('b', "It says 'build an igloo'. I can't build a sandcastle."),
      by('a', "It's just blocks of snow."),
      by('b', "I hope so."),
    ] },
  ],
};

// ── the small plane (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'ifl.tm1', when: { taskId: 'tundra-hop', mishap: 'whiteout' }, turns: [
      beat("The snow starts sideways, then everywhere, and the pilot banks the tiny plane round in a slow circle, waiting."),
      by('a', "Why are we going round in circles?"),
      by('b', "Because the pilot can't see the runway."),
      beat('Twenty minutes later the snow thins, a strip of lights appears, and the plane bumps down onto the ice.'),
    ] },
  ],
};

// ── ring the narwhal (Botch or Watch: a throws, b watches) ──
const narwhal = {
  'don-demo.gag': [
    { id: 'ifl.nw-d1', when: NW, turns: [
      don("In this Botch or Watch, dig a ring out of the snow and throw it onto that narwhal's tusk when it comes up for air."),
      beat('He throws a ring with confidence. It flies off at a strange angle and lands in the snow ten metres the wrong way.'),
      don("That was a practice throw. Gloves. Gloves are very hard to throw in."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'ifl.nw-d2', when: NW, turns: [
      don("Miss, and the ring sinks. So you dig for another one. The other one of you can only watch from the line."),
      don("A ring on the tusk gets you the next tip. The narwhal gets nothing. The narwhal is very patient."),
      beat('The narwhal surfaces, breathes out, and sinks again.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'ifl.nw-w1', when: NW, turns: [
      by('b', "You did the last one? No, I did the last one. So it's you."),
      by('a', "Are you sure?"),
      by('b', "I'm sure. You're up."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'ifl.nw-w2', when: NW, turns: [
      by('a', "I'll throw. I'm great at hoopla at the fair."),
      by('b', "It's forty below out here."),
      by('a', "I'll be fine."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'ifl.nw-w3', when: NW, turns: [
      by('b', "I can't feel my arms. You throw."),
      by('a', "I can't feel my arms either."),
      by('b', "You'll be fine. Go."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'ifl.nw-w4', when: NW, turns: [
      by('a', "'Who has the best aim?' You won the darts at the pub."),
      by('b', "That was luck."),
      by('a', "Then be lucky again. Go."),
    ] },
  ],
  'task-start.any': [
    { id: 'ifl.nw-s1', when: NW, turns: [
      beat("{a} digs through the snow with both mittens until something metal glints."),
      by('a', "Ring! Found one! Where's the whale?"),
      by('b', "It's not a whale, it's a narwhal. And it's under the water. Wait."),
    ] },
    { id: 'ifl.nw-s2', when: NW, turns: [
      by('b', "Throw it when the tusk is straight up. Not before."),
      by('a', "How long does it stay straight up?"),
      by('b', "About one second."),
    ] },
    { id: 'ifl.nw-s3', when: NW, turns: [
      beat("{a} stands on the line, ring in hand, staring at the black water, waiting for the tusk."),
      by('a', "Come on. Come up."),
      beat('The water ripples. The tusk rises.'),
    ] },
    { id: 'ifl.nw-s4', when: NW, turns: [
      by('a', "Should I take my mitten off?"),
      by('b', "It's too cold."),
      by('a', "Just for the throw. Then I'll put it back on."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'ifl.nw-f1', when: NW, turns: [
      beat("The tusk rises out of the water. {a} throws. The ring spins through the air and drops right over the tip of the tusk."),
      by('a', "It's on! First throw!"),
      by('b', "You did it! First throw!"),
    ] },
    { id: 'ifl.nw-f2', when: NW, turns: [
      by('b', "Now! Throw it now!"),
      beat("{a} throws on {b}'s shout, and the ring clanks onto the tusk and slides all the way down."),
      by('a', "It's on! It's on the tusk!"),
    ] },
    { id: 'ifl.nw-f3', when: NW, turns: [
      beat("{a} doesn't wait, doesn't aim, just throws the moment the tusk appears, and the ring lands on it."),
      by('b', "How? You didn't even look!"),
      by('a', "I just went for it."),
    ] },
    { id: 'ifl.nw-f4', when: NW, turns: [
      by('a', "First ring. First throw."),
      by('b', "That was amazing."),
      by('a', "I can't believe it."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'ifl.nw-a1', when: NW, turns: [
      by('b', "You keep throwing too hard. Gentle. Like a frisbee."),
      beat("{a} throws gently, like a frisbee. The ring floats over the water and drops neatly over the tusk."),
      by('a', "Gently worked!"),
    ] },
    { id: 'ifl.nw-a2', when: NW, turns: [
      beat("Fifth ring dug out of the snow. {a} waits for the tusk, breathes out, and throws. It lands."),
      by('a', "It's on! Finally!"),
      by('b', "That was perfect."),
    ] },
    { id: 'ifl.nw-a3', when: NW, turns: [
      by('a', "Mitten off this time. I don't care how cold it is."),
      beat("Bare-handed, {a} throws one perfect ring onto the tusk, and shoves the hand straight back into the mitten."),
      by('b', "It worked!"),
    ] },
    { id: 'ifl.nw-a4', when: NW, turns: [
      beat("{a} has stopped throwing at the tusk and started throwing where the tusk is about to be. It works."),
      by('a', "Aim ahead! It worked!"),
      by('b', "That was so smart!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'ifl.nw-t1', when: NW, turns: [
      beat("{a} is on both knees in the snow, digging and digging, and finding nothing but more snow."),
      by('a', "There are no more rings."),
      by('b', "There's a ring under there somewhere. Keep digging."),
    ] },
    { id: 'ifl.nw-t2', when: NW, turns: [
      by('b', "That's four in the sea."),
      by('a', "I know. I know."),
      by('b', "Dig another one."),
    ] },
    { id: 'ifl.nw-t3', when: NW, turns: [
      beat('The narwhal surfaces just as {a} bends down to dig, and sinks again before {a} can throw.'),
      by('a', "Every time! It comes up every time I look away!"),
      by('b', "Then don't look away!"),
    ] },
  ],
  'task-done.any': [
    { id: 'ifl.nw-dn1', when: NW, turns: [
      by('a', "I'll never forget that narwhal."),
      by('b', "It was amazing."),
      by('a', "I'll never forget it."),
    ] },
    { id: 'ifl.nw-dn2', when: NW, turns: [
      beat("{a} and {b} trudge away from the ice edge towards the igloo village, the narwhal blowing mist behind them."),
      by('b', "Igloos next. We're building our own home."),
      by('a', "Out of ice. In the cold."),
    ] },
    { id: 'ifl.nw-dn3', when: NW, turns: [
      by('b', "Did you see it look at you, right at the end?"),
      by('a', "It looked right at me."),
      by('b', "That was so cool."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'ifl.nw-x1', when: NW, turns: [
      beat("The ring bounces off the side of the tusk and drops into the water with a plop."),
      by('a', "It hit it! It hit it and bounced off!"),
      by('b', "It has to go on! Dig another!"),
    ] },
    { id: 'ifl.nw-x2', when: NW, turns: [
      beat("{a} throws too hard. The ring sails right over the narwhal and lands in the sea well beyond it."),
      by('a', "Too much! I put too much on it!"),
      by('b', "Back to the snow!"),
    ] },
    { id: 'ifl.nw-x3', when: NW, turns: [
      beat("{a}'s mitten flies off with the ring, and both land in the water."),
      by('a', "My mitten! My mitten's gone!"),
      by('b', "Take mine! Find another ring!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'ifl.nw-v1', when: NW, turns: [
      by('b', "You've got this!"),
      by('a', "Stop shouting, you'll scare it!"),
      by('b', "Sorry!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'ifl.nw-v2', when: NW, turns: [
      beat("{b} stands behind the line hugging {b.ref}, half from the cold, half from the nerves."),
      by('b', "Please land. Please land. Please, please land."),
      by('a', "You're making me nervous!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'ifl.nw-v3', when: NW, turns: [
      beat("{b} starts digging in the snow to find {a} the next ring."),
      by('b', "I'll find them, you throw them! Faster!"),
      beat('A local shakes her head and points {b} back behind the line. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'ifl.nw-v4', when: NW, turns: [
      beat("{b} stands perfectly still on the line, watching the water, not saying a word."),
      by('a', "Are you okay?"),
      by('b', "I'm just so cold."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'ifl.nw-h1', when: NW, turns: [
      beat("While the local isn't looking, {b} nudges a ring out of the snow with a boot, right where {a} is digging."),
      by('a', "Found one! Right here!"),
      by('b', "Lucky."),
    ] },
  ],
};

// ── the igloo (All-In) ──
const igloo = {
  'don-demo.gag': [
    { id: 'ifl.ig-d1', when: IG, turns: [
      don("In this All-In, saw blocks out of the snow and build an igloo. Ring on ring, every block leaning in, until the dome closes at the top."),
      beat('He puts one block on top of another. The top one slides off and lands on his boot.'),
      don("It takes practice, so good luck!"),
    ] },
  ],
  'don-demo.dry': [
    { id: 'ifl.ig-d2', when: IG, turns: [
      don("The local has built a thousand of these. If yours sags, has a gap, or falls in, you pull it down and build it again."),
      don("When the local crawls inside and stays inside, you get the next tip!"),
      beat('The local, beside him, crawls into a perfect igloo and immediately starts drinking tea.'),
    ] },
  ],
  'task-start.any': [
    { id: 'ifl.ig-s1', when: IG, turns: [
      beat("{a} and {b} stand in the snow with a saw each, looking at the frozen ground."),
      by('a', "Where do we even start?"),
      by('b', "With a block. Cut a block. Then another block."),
    ] },
    { id: 'ifl.ig-s2', when: IG, turns: [
      by('b', "You cut, I stack. Every block a bit smaller than the last."),
      by('a', "How much smaller?"),
      by('b', "A bit. Just a bit."),
    ] },
    { id: 'ifl.ig-s3', when: IG, turns: [
      beat("{a} saws out the first block, lifts it, and it snaps clean in half."),
      by('a', "Did I do it wrong?"),
      by('b', "Thinner. Cut thinner. And gentler."),
    ] },
    { id: 'ifl.ig-s4', when: IG, turns: [
      by('a', "Do you think it'll be warm inside?"),
      by('b', "The local says it's warmer than outside."),
      by('a', "Anything's warmer than out here."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'ifl.ig-f1', when: IG, turns: [
      beat("Block by block, ring by ring, the dome rises, and {b} drops the last block into the top. It holds."),
      by('a', "It's an igloo! We built an igloo!"),
      beat('The local crawls in, looks round, and stays.'),
    ] },
    { id: 'ifl.ig-f2', when: IG, turns: [
      by('b', "She's going in!"),
      beat('The local crawls in, knocks on the walls, and gives a thumbs up from the doorway.'),
      by('a', "A thumbs up! She likes it!"),
    ] },
    { id: 'ifl.ig-f3', when: IG, turns: [
      beat("{a} and {b} work without a word, cutting and stacking, and the igloo goes up like they've built a hundred."),
      by('b', "Have you done this before?"),
      by('a', "No. I just copied hers."),
    ] },
    { id: 'ifl.ig-f4', when: IG, turns: [
      by('a', "First try! We built an igloo!"),
      by('b', "It's actually really good."),
      by('a', "I know. Come on."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'ifl.ig-a1', when: IG, turns: [
      by('b', "It fell in because the blocks didn't lean. This time, every block leans in. Every single one."),
      beat('Every single block leans in, and the dome closes over the top without a wobble.'),
      by('a', "Leaning them in worked!"),
    ] },
    { id: 'ifl.ig-a2', when: IG, turns: [
      beat("{a} packs snow into every gap between the blocks, all the way round, inside and out."),
      by('a', "No gaps. Not one. Check it now."),
      beat('The local checks, crawls in, and settles down with her tea. The tip is theirs.'),
    ] },
    { id: 'ifl.ig-a3', when: IG, turns: [
      by('a', "Third igloo. Third time. This one's staying up."),
      beat("It stays up. The local walks around it twice, crawls inside, and doesn't come back out."),
      by('b', "She likes it!"),
    ] },
    { id: 'ifl.ig-a4', when: IG, turns: [
      beat("The local stops by, shows {a} how to hold the saw, and walks away. The next block is perfect. So is the next."),
      by('a', "That's so much better!"),
      by('b', "Keep cutting like that! Don't change anything!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'ifl.ig-t1', when: IG, turns: [
      beat("Their igloo is two rings high and already leaning badly to one side."),
      by('a', "It's leaning. Is it supposed to lean?"),
      by('b', "In. It's supposed to lean in. Not over."),
    ] },
    { id: 'ifl.ig-t2', when: IG, turns: [
      by('b', "My fingers stopped working twenty minutes ago."),
      by('a', "Mine too."),
      by('b', "Keep going. We're nearly there."),
    ] },
    { id: 'ifl.ig-t3', when: IG, turns: [
      beat("The top block keeps falling through the hole into the igloo, every single time."),
      by('a', "The hole is too big for the block!"),
      by('b', "Then cut a bigger block!"),
    ] },
  ],
  'task-done.any': [
    { id: 'ifl.ig-dn1', when: IG, turns: [
      by('a', "I love our igloo."),
      by('b', "Me too."),
      by('a', "Come on. The Chill Zone."),
    ] },
    { id: 'ifl.ig-dn2', when: IG, turns: [
      beat("{a} and {b} trudge away towards the Chill Zone, looking back at their igloo every few steps."),
      by('b', "It's so beautiful."),
      by('a', "It's the best thing we've ever built."),
    ] },
    { id: 'ifl.ig-dn3', when: IG, turns: [
      by('b', "That local said it was a good igloo. A good igloo!"),
      by('a', "She said 'not bad'."),
      by('b', "From her, that's amazing."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'ifl.ig-x1', when: IG, turns: [
      beat("{b} sets the last block on top, and the whole dome caves in."),
      by('b', "No! No, no, no!"),
      by('a', "Start again. From the bottom."),
    ] },
    { id: 'ifl.ig-x2', when: IG, turns: [
      beat("The local crawls into their igloo, looks up at a gap of daylight in the roof, and crawls straight back out."),
      by('a', "Oh no. There's a hole."),
      by('b', "She's shaking her head. Pull it down."),
    ] },
    { id: 'ifl.ig-x3', when: IG, turns: [
      beat("The local pushes one wall with a single finger, and the whole side slides away."),
      by('a', "With one finger!"),
      by('b', "Then it wasn't strong enough! Again!"),
    ] },
  ],
};

export default mergePools(place, roads, narwhal, igloo);
