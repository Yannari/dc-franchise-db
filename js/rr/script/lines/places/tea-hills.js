// Tea Hills' own lines (js/rr/places/tea-hills.js), 1:1 with the real leg ("Darjeel With It"), in our own words:
//   the jeep       up the hill road: a landslide across it.
//   the tea        All-In: baskets on backs, only the top two leaves and the bud; the old picker tips it out, and old
//                  leaves, stalks or a basket not full means back up the terraces.
//   the train      All-In: a packed little steam train, carriage by carriage to the front one, which is the only one
//                  that stops at the right station; stuck, rude or off at the wrong stop and it's the next train.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'tea-hills' };
const TB = { taskId: 'tea-basket' };
const TT = { taskId: 'toy-train' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'tea.op1', when: P, turns: [
      beat("Don stands on a terrace of bright green tea bushes that roll down the hills into the mist, a cup of tea in his hand."),
      don("Welcome to the Tea Hills! Some of the finest tea in the world grows on these slopes. I've had eleven cups since breakfast. I can see sounds."),
      don("Today, teams pick tea, and then catch a train. A very small, very crowded, very slow train."),
      beat('His hand is shaking slightly. The cup rattles on its saucer.'),
    ] },
    { id: 'tea.op2', when: P, turns: [
      don("The Tea Hills. Cool air, steep slopes, and a little steam train that has been running up this mountain for more than a hundred years."),
      don("Racers, a jeep will take you up the hill road. Hold on. It's mostly corners."),
      beat('A jeep swerves round a bend behind him, honking, and he steps neatly out of the way.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'tea.op3', when: P, turns: [
      beat("Don sits on a wicker chair on a veranda, a pot of tea and a plate of biscuits beside him, watching the mist."),
      don("Tea Hills. I'm having a tea break. It's a very long tea break. Jeeps are at the bottom."),
      don("Off you go. Mind the corners. Don't spill anything."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'tea.ar1', when: P, turns: [
      beat("The jeep climbs out of the clouds, and the hills appear: every slope combed into neat green rows, as far as they can see."),
      by('a', "It looks like a giant green fingerprint."),
      by('b', "It's tea. All of that is tea."),
      by('a', "That's a lot of cups."),
    ] },
    { id: 'tea.ar2', when: P, turns: [
      beat("Far below, a little blue steam train puffs its way round the side of the hill, a long white trail behind it."),
      by('b', "That's the train! That tiny one!"),
      by('a', "It looks like a toy. It looks like somebody's toy train."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'tea.ad1', when: P, turns: [
      by('a', "The tip says 'fill a basket'. How big is the basket?"),
      by('b', "It's a basket you wear on your back."),
      by('a', "That's a big basket."),
    ] },
    { id: 'tea.ad2', when: P, turns: [
      by('b', "The hills are so steep. How do people pick tea on these?"),
      by('a', "Very carefully, I imagine."),
      by('b', "We're not careful people."),
    ] },
  ],
};

// ── the jeep (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'tea.tm1', when: { taskId: 'hill-jeep', mishap: 'landslide-on-the-road' }, turns: [
      beat("Round a hairpin bend, the jeep stops. Half the hillside is lying across the road in a heap of mud and rocks."),
      by('a', "Is that the road? Where did the road go?"),
      by('b', "Under that. The road is under that."),
      beat('Twenty minutes later, a crew with shovels has cleared a path just wide enough for the jeep.'),
    ] },
  ],
};

// ── the tea basket (All-In) ──
const tea = {
  'don-demo.gag': [
    { id: 'tea.tb-d1', when: TB, turns: [
      don("In this All-In, strap on a basket and pick tea, by hand, until it's full. Only the top two leaves and the bud. Like this."),
      beat('He picks a leaf off the bush, holds it up proudly. An old picker behind him shakes her head and takes it away.'),
      don("Not like that. Apparently that was a stalk. I've been corrected. On camera."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'tea.tb-d2', when: TB, turns: [
      don("Bring your basket to the plantation's oldest picker. She tips it out and checks every leaf. Old leaves, stalks, or a basket that isn't full, and you go back up."),
      don("A full basket of good tea gets you the next tip. She's been doing this for sixty years. You will not fool her."),
      beat("The old picker, sitting by the scales, looks at the camera and says nothing at all."),
    ] },
  ],
  'task-start.any': [
    { id: 'tea.tb-s1', when: TB, turns: [
      beat("{a} and {b} start picking on the steep terrace, both baskets very, very empty."),
      by('a', "Two leaves and a bud. Two leaves and a bud."),
      by('b', "Say it while you pick. Don't just say it."),
    ] },
    { id: 'tea.tb-s2', when: TB, turns: [
      by('b', "Watch the pickers. Look how fast their hands go."),
      by('a', "Their hands are a blur. Mine are a mess."),
      by('b', "Then be a slow, tidy mess."),
    ] },
    { id: 'tea.tb-s3', when: TB, turns: [
      beat("{a} picks a handful of leaves and throws them over {a.posAdj} shoulder into the basket. Half of them miss."),
      by('a', "Is it in?"),
      by('b', "Some of it is in. Some of it is on the hill."),
    ] },
    { id: 'tea.tb-s4', when: TB, turns: [
      by('a', "How many leaves fill a basket?"),
      by('b', "Thousands. Maybe tens of thousands."),
      by('a', "Then why are we talking? Pick."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'tea.tb-f1', when: TB, turns: [
      beat("{a} and {b} carry their full baskets down to the old picker. She tips them out, runs her fingers through, and nods."),
      by('b', "She nodded! First go!"),
      by('a', "Sixty years of picking, and she nodded at us."),
    ] },
    { id: 'tea.tb-f2', when: TB, turns: [
      by('a', "Only the top bits. Only the top bits. Every single leaf."),
      beat("The old picker checks the basket for a long time, finds nothing wrong, and hands over the tip."),
      by('b', "Every single leaf! You were right!"),
    ] },
    { id: 'tea.tb-f3', when: TB, turns: [
      beat("{a} picks with both hands at once, like the pickers do, and the basket fills twice as fast."),
      by('b', "Where did you learn that?"),
      by('a', "Just now. From her. I've been copying her the whole time."),
    ] },
    { id: 'tea.tb-f4', when: TB, turns: [
      by('b', "First basket, and she accepted it."),
      by('a', "My back is broken, but she accepted it."),
      by('b', "A small price."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tea.tb-a1', when: TB, turns: [
      by('b', "She said too many stalks. So we check every handful before it goes in."),
      beat('Handful by handful, checked and checked again, until the basket is full. The old picker finally nods.'),
      by('a', "Slow tea is good tea."),
    ] },
    { id: 'tea.tb-a2', when: TB, turns: [
      beat("Second basket. This time {a} and {b} pick only from the very top of the bushes, the bright green new leaves."),
      by('a', "Only the bright ones. Only the young ones."),
      beat('The old picker looks, smiles for the first time, and hands over the tip.'),
    ] },
    { id: 'tea.tb-a3', when: TB, turns: [
      by('a', "It wasn't full enough. So we press it down. Pack it in."),
      by('b', "Gently. Don't crush the leaves."),
      beat("Gently packed and filled to the brim, the basket passes. The tip is theirs."),
    ] },
    { id: 'tea.tb-a4', when: TB, turns: [
      beat("A young picker shows {b} how to snap the leaf off with a thumbnail. After that, it all goes much faster."),
      by('b', "Thumbnail! It's all in the thumbnail!"),
      by('a', "Third basket. Third time lucky. She's nodding!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'tea.tb-t1', when: TB, turns: [
      beat("{a} looks into the basket after half an hour of picking. It's barely a quarter full."),
      by('a', "Where did it all go? I've been picking forever!"),
      by('b', "Leaves are small. Baskets are big."),
    ] },
    { id: 'tea.tb-t2', when: TB, turns: [
      by('b', "My back. My back is gone. This hill is too steep."),
      by('a', "The pickers are older than our grandparents, and they're fine."),
      by('b', "The pickers have been training for sixty years."),
    ] },
    { id: 'tea.tb-t3', when: TB, turns: [
      beat("{a} slips on the wet terrace and slides down a row of bushes, basket and all."),
      by('a', "I'm fine! The tea is not fine!"),
      by('b', "Pick it up! Pick it all up!"),
    ] },
  ],
  'task-done.any': [
    { id: 'tea.tb-dn1', when: TB, turns: [
      by('a', "I'm going to appreciate every cup of tea I ever drink from now on."),
      by('b', "You don't drink tea."),
      by('a', "I'm going to start, so I can appreciate it."),
    ] },
    { id: 'tea.tb-dn2', when: TB, turns: [
      beat("{a} and {b} jog down the terraces towards the railway line, rubbing their backs."),
      by('b', "The train. We have to catch a train now."),
      by('a', "Can we sit on the train?"),
    ] },
    { id: 'tea.tb-dn3', when: TB, turns: [
      by('b', "She smiled at us at the end. The old picker. Did you see?"),
      by('a', "She smiled because it was over."),
      by('b', "That's still a smile."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tea.tb-x1', when: TB, turns: [
      beat("The old picker tips out their basket, picks out a long brown stalk, and holds it up. She points back up the hill."),
      by('a', "One stalk? For one stalk?"),
      by('b', "There are lots of stalks. Back up."),
    ] },
    { id: 'tea.tb-x2', when: TB, turns: [
      beat("The old picker looks into their basket, then at them, and shakes her head. It's not full."),
      by('b', "It looks full!"),
      by('a', "It's full on top. It's hollow underneath. Back up."),
    ] },
    { id: 'tea.tb-x3', when: TB, turns: [
      beat("{a} hands over a basket full of big, dark, old leaves. The old picker sighs a sigh sixty years long."),
      by('a', "They're leaves! They're tea leaves!"),
      by('b', "They're the wrong ones! Back up!"),
    ] },
  ],
};

// ── the train (All-In) ──
const train = {
  'don-demo.gag': [
    { id: 'tea.tt-d1', when: TT, turns: [
      don("In this All-In, board the steam train at the back, and work your way to the front carriage. Only the front carriage stops at the right station."),
      beat('He climbs onto the back of the little train, looks into the carriage, packed with people, sacks and goats, and climbs straight off.'),
      don("It's very full. It's always very full. That's the challenge. And the goats."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'tea.tt-d2', when: TT, turns: [
      don("Get stuck, push past without a please, or get off at the wrong stop, and you walk back to the line and wait for the next train."),
      don("Step off the front carriage at the right station, and you're at the Chill Zone. The train goes about as fast as you can jog. So don't fall off."),
      beat('The train whistles and chugs slowly away. A boy jumps on, walks along the side, and jumps off again, grinning.'),
    ] },
  ],
  'task-start.any': [
    { id: 'tea.tt-s1', when: TT, turns: [
      beat("{a} and {b} jump onto the back step of the last carriage as the train pulls away, and look inside. It is packed to the roof."),
      by('a', "There's no room. There's no room at all."),
      by('b', "There's always room. You just have to ask nicely."),
    ] },
    { id: 'tea.tt-s2', when: TT, turns: [
      by('b', "Excuse me. Sorry. Excuse me. Lovely goat. Sorry."),
      by('a', "Are you apologising to the goat?"),
      by('b', "I'm apologising to everybody. It's working."),
    ] },
    { id: 'tea.tt-s3', when: TT, turns: [
      beat("{a} squeezes between two sacks of rice and comes face to face with a basket of chickens."),
      by('a', "Hello. Can I just... get past you?"),
      beat('The chickens do not move.'),
    ] },
    { id: 'tea.tt-s4', when: TT, turns: [
      by('a', "How many carriages are there?"),
      by('b', "Six. We're in the sixth."),
      by('a', "So, five more of this."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'tea.tt-f1', when: TT, turns: [
      beat("Carriage by carriage, smiling and apologising, {a} and {b} reach the front just as the train pulls into the station."),
      by('a', "Front carriage! Right station! Get off, get off!"),
      by('b', "Thank you, everyone! Thank you! Lovely goat!"),
    ] },
    { id: 'tea.tt-f2', when: TT, turns: [
      by('b', "A man just helped us through the whole carriage. He moved all the sacks for us!"),
      by('a', "Because you said please. Everybody likes please."),
      beat('They step off the front carriage onto the station platform. The Chill Zone is right there.'),
    ] },
    { id: 'tea.tt-f3', when: TT, turns: [
      beat("{a} and {b} climb out of a window, along the outside of a carriage, and in through the next window, to cheers from the passengers."),
      by('a', "That was so much faster than the inside!"),
      by('b', "And everyone clapped!"),
    ] },
    { id: 'tea.tt-f4', when: TT, turns: [
      by('a', "First train. Front carriage. Right station."),
      by('b', "And I got given a samosa on the way."),
      by('a', "You got a samosa?"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tea.tt-a1', when: TT, turns: [
      by('b', "We got stuck behind the goats last time. This time, we go round the goats. Outside."),
      beat("They step out onto the side ladder, go round the goat carriage, and climb back in at the front."),
      by('a', "Round the goats! Always round the goats!"),
    ] },
    { id: 'tea.tt-a2', when: TT, turns: [
      beat("Second train. This time {a} and {b} start moving the moment they board, and reach the front before the station."),
      by('a', "Front! We made it! Get ready!"),
      by('b', "This is our stop! This is actually our stop!"),
    ] },
    { id: 'tea.tt-a3', when: TT, turns: [
      by('a', "We were too pushy. This time, we say please to every single person."),
      beat("They say please to every single person. Every single person helps them through."),
      by('b', "Manners! Manners got us to the front!"),
    ] },
    { id: 'tea.tt-a4', when: TT, turns: [
      beat("After two trains and a long walk back along the line, {a} and {b} finally step off the front carriage at the right station."),
      by('a', "Third train! We're never getting on a train again."),
      by('b', "We have to. To leave."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'tea.tt-t1', when: TT, turns: [
      beat("{a} is wedged between a sack of potatoes and a large, sleeping man, and cannot move in any direction."),
      by('a', "I'm stuck. I'm completely stuck."),
      by('b', "Wiggle! Wiggle sideways!"),
    ] },
    { id: 'tea.tt-t2', when: TT, turns: [
      by('b', "How many carriages have we done?"),
      by('a', "One. We've done one."),
      by('b', "It felt like ten."),
    ] },
    { id: 'tea.tt-t3', when: TT, turns: [
      beat("A goat has decided {b}'s shoelace is lunch, and won't let go."),
      by('b', "Let go! Please let go! I need my shoe!"),
      by('a', "Leave the shoe! Leave the shoe and run!"),
    ] },
  ],
  'task-done.any': [
    { id: 'tea.tt-dn1', when: TT, turns: [
      by('a', "That was the most crowded place I've ever been."),
      by('b', "And the friendliest."),
      by('a', "The goats weren't friendly."),
    ] },
    { id: 'tea.tt-dn2', when: TT, turns: [
      beat("{a} and {b} step off the train onto the platform, and the whole carriage waves goodbye to them."),
      by('b', "They're waving! Wave back!"),
      by('a', "Goodbye! Goodbye, everyone! Goodbye, goat!"),
    ] },
    { id: 'tea.tt-dn3', when: TT, turns: [
      by('b', "I smell like a goat."),
      by('a', "Everybody on that train smells like a goat."),
      by('b', "Then we fitted right in."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tea.tt-x1', when: TT, turns: [
      beat("The train pulls into a station. {a} and {b} jump off. It's the wrong station."),
      by('a', "This isn't it? This isn't it!"),
      by('b', "The train's leaving! It's leaving without us!"),
    ] },
    { id: 'tea.tt-x2', when: TT, turns: [
      beat("{a} pushes past a woman with a basket of eggs, and an egg breaks. The conductor points them both off at the next stop."),
      by('a', "It was one egg!"),
      by('b', "Next train. We're on the next train."),
    ] },
    { id: 'tea.tt-x3', when: TT, turns: [
      beat("The train reaches the right station while {a} and {b} are still stuck two carriages from the front."),
      by('a', "That's our stop! That's our stop going past!"),
      by('b', "Off at the next one. Walk back. Next train."),
    ] },
  ],
};

export default mergePools(place, roads, tea, train);
