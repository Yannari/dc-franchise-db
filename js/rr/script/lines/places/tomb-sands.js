// Tomb Sands' own lines (js/rr/places/tomb-sands.js), from World Tour's first leg, adapted for pairs, in our own words:
//   over or under   climb the great pyramid's giant steps and get down the far side, or go through the tomb: three
//                   doorways with symbols, a dead end, a trap of scarabs, something in mummy wrappings.
//   the camel       across the dunes to the river: a camel that sits down, a swarm of scarabs.
//   the reed boat   tie reeds into a boat, paddle it past the crocodiles; it sinks, and you swim back.
// Gated on place / taskId / side / mishap.
import { V, mergePools } from './_kit.js';

const P = { place: 'tomb-sands' };
const PY = { taskId: 'pyramid' };
const OV = { taskId: 'pyramid', side: 'over' };
const UN = { taskId: 'pyramid', side: 'under' };
const CM = { taskId: 'tomb-camel' };
const RB = { taskId: 'reed-boat' };
const don = say => ({ by: 'don', say });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'tms.op1', when: P, turns: [
      { beat: 'Don stands in front of the great pyramid in a linen suit and sunglasses, sweating very slightly.' },
      don("Tomb Sands! Home of the great pyramid, the great river, and the great amount of sand currently in my shoes."),
      don("Teams must go over the pyramid or under it, cross the desert by camel, and build a boat to cross a river full of crocodiles."),
      { beat: 'He tips sand out of one shoe.' },
      don("And somewhere in that tomb, there's a curse. Probably. I'm not going in to check."),
    ] },
    { id: 'tms.op2', when: P, turns: [
      don("Welcome to Tomb Sands, home of pharaohs, mummies, and the oldest tourist attraction in the world. Apart from me."),
      { beat: 'A camel wanders up behind him and starts chewing his sleeve.' },
      don("Not the suit. Not the suit! Somebody get this camel off my suit!"),
    ] },
  ],
  'don-opener.bored': [
    { id: 'tms.op3', when: P, turns: [
      { beat: 'Don sits in the shade of a palm tree, fanning himself with a papyrus scroll.' },
      don("Tomb Sands. Hot. Old. Sandy. Very, very hot."),
      don("The teams have a pyramid to deal with. I have this palm tree. We all have our challenges."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'tms.ar1', when: P, turns: [
      { beat: 'The great pyramid rises out of the desert, enormous, golden in the morning sun.' },
      { by: 'a', ...V("That's thousands of years old. People built that by hand.", "Thousands of years old. By hand.", "Built by hand.", "That's THOUSANDS of years OLD! People built that by HAND!", "That's thousands of years old, and people built it by hand.", "Ancient people stacked that. With no cranes.") },
      { by: 'b', say: "I've seen it in books my whole life. It's so much bigger in real life." },
      { by: 'a', say: "Everything's bigger in real life. Except the hotel rooms." },
    ] },
    { id: 'tms.ar2', when: P, turns: [
      { by: 'b', say: "We're standing where the pharaohs stood." },
      { by: 'a', say: "And we're about to climb all over their tomb." },
      { by: 'b', say: "Respectfully. We'll climb respectfully." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'tms.ad1', when: P, turns: [
      { by: 'a', say: "Mummies. There are going to be mummies, aren't there." },
      { by: 'b', ...V("Mummies aren't real. Well, they're real. But they don't move.", "Mummies don't move.", "They don't move.", "Mummies aren't REAL! Well, they're REAL! But they don't MOVE!", "Mummies are real, but they don't move. They definitely don't move.", "The mummies are retired. They don't chase people.") },
      { by: 'a', say: "Say that again, slower. Make me believe it." },
    ] },
    { id: 'tms.ad2', when: P, turns: [
      { beat: 'The sun is already blazing, and it isn\'t even nine in the morning.' },
      { by: 'b', say: "It's so hot I can feel my eyebrows sweating." },
      { by: 'a', say: "Eyebrows can't sweat." },
      { by: 'b', say: "Mine can. Mine are." },
    ] },
  ],
};

// ── over or under ──
const pyramid = {
  'don-demo.gag': [
    { id: 'tms.py-d1', when: PY, turns: [
      don("In this Either/Or, teams choose. Over: climb the great pyramid and get down the other side. Under: go through the tomb, and find the way out."),
      { beat: 'He peers into the dark doorway of the tomb. Something inside moans, very softly.' },
      don("That's the wind. That's definitely the wind. Mostly. I'd go over."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'tms.py-d2', when: PY, turns: [
      don("Over is hot, steep and very high. Under is dark, and only one of the three doors leads out. The other two lead to things I'm not allowed to tell you about."),
      { beat: 'He holds up three cards with three symbols on them: an eye, a bird, a dog.' },
      don("Choose wisely. Or quickly. Ideally both."),
    ] },
  ],
  'decide-side.agree': [
    { id: 'tms.py-dc1', when: { ...PY, side: 'over' }, turns: [
      { by: 'a', say: "Over or under?" },
      { by: 'b', ...V("Over. I'm not going into a tomb. Tombs are for the dead.", "Over. Tombs are for the dead.", "Over. No tombs.", "OVER! I'm NOT going into a TOMB! Tombs are for the DEAD!", "Over, please. I'm not going into a tomb, tombs are for the dead.", "Over. Under is where the curses live.") },
      { by: 'a', say: "Over it is. Up we go." },
    ] },
  ],
  'decide-side.overruled': [
    { id: 'tms.py-dc2', when: { ...PY, side: 'under' }, turns: [
      { by: 'b', say: "Over. Over, over, over." },
      { by: 'a', say: "Under's quicker if we pick the right door. We're going under." },
      { by: 'b', say: "If a mummy grabs me, I'm blaming you for the rest of eternity." },
    ] },
  ],
  'decide-side.swayed-by-watching': [
    { id: 'tms.py-dc3', when: { ...PY, side: 'over' }, turns: [
      { beat: 'A team comes running out of the tomb, screaming, covered in beetles.' },
      { by: 'a', say: "Did you see that? They were covered in bugs." },
      { by: 'b', say: "Over. We're going over." },
    ] },
  ],
  'task-start.any': [
    { id: 'tms.ov-s1', when: OV, turns: [
      { beat: '{a} and {b} start up the giant stone steps. Each one comes up to their waist.' },
      { by: 'a', say: "These aren't steps. These are boulders that think they're steps." },
      { by: 'b', ...V("Climb, don't talk. Talking wastes water.", "Don't talk. Climb.", "Climb. Save your breath.", "CLIMB, DON'T talk! Talking WASTES WATER!", "Climb and don't talk, talking wastes water.", "Silence. Ascend.") },
    ] },
    { id: 'tms.ov-s2', when: OV, turns: [
      { by: 'b', say: "How many steps do you think there are?" },
      { by: 'a', say: "Don't count them. If you count them, you'll know." },
      { by: 'b', say: "Too late. I've counted forty and we're not halfway." },
    ] },
    { id: 'tms.un-s1', when: UN, turns: [
      { beat: '{a} and {b} step into the tomb. Three doorways in front of them: an eye, a bird and a dog.' },
      { by: 'a', say: "Which one? The eye, the bird or the dog?" },
      { by: 'b', ...V("The dog. Dogs are loyal. Dogs always lead you home.", "The dog. Dogs lead you home.", "Dog. Loyal.", "The DOG! Dogs are LOYAL! Dogs ALWAYS lead you HOME!", "The dog. Dogs are loyal, they always lead you home.", "The dog. A good boy will guide us.") },
    ] },
    { id: 'tms.un-s2', when: UN, turns: [
      { by: 'b', say: "It's so dark. I can't see my own hand." },
      { by: 'a', say: "Hold the wall. Hold the wall and keep walking." },
      { by: 'b', say: "The wall is very cold, and very old, and I don't like it." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tms.ov-f1', when: OV, turns: [
      { beat: '{a} and {b} reach the top of the pyramid and see the whole desert spread out below.' },
      { by: 'b', say: "We're on top of a pyramid. We're on top of a pyramid!" },
      { by: 'a', say: "Now we just have to get down without falling." },
    ] },
    { id: 'tms.ov-f2', when: OV, turns: [
      { by: 'a', ...V("Slide down! The far side's smooth! We can slide!", "Slide down! It's smooth!", "Slide!", "SLIDE down! The FAR SIDE'S smooth! We can SLIDE!", "We can slide down! The far side's smooth!", "To the slide! The ancient slide!") },
      { beat: '{a} and {b} sit down and slide all the way to the bottom, whooping.' },
      { by: 'b', say: "That was the best slide in history. Literally. In history." },
    ] },
    { id: 'tms.un-f1', when: UN, turns: [
      { beat: 'The dog door leads down a long corridor and out into the sunlight on the far side.' },
      { by: 'b', say: "The dog led us home! I told you! Dogs always lead you home!" },
      { by: 'a', say: "Good boy. Good stone boy." },
    ] },
    { id: 'tms.un-f2', when: UN, turns: [
      { by: 'a', say: "Follow the breeze. If there's a breeze, there's a way out." },
      { beat: 'They follow the breeze, round two corners and out into the light.' },
      { by: 'b', say: "How did you know that?" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tms.ov-a1', when: OV, turns: [
      { beat: '{a} slips on a loose stone and slides halfway back down. They have to climb it all again.' },
      { by: 'b', say: "Are you okay? Can you climb?" },
      { by: 'a', say: "I can climb. I just can't believe I have to." },
      { beat: 'The second climb is slower, but they make it to the top.' },
    ] },
    { id: 'tms.ov-a2', when: OV, turns: [
      { by: 'b', say: "Zigzag. Go up in a zigzag. It's less steep." },
      { by: 'a', ...V("You and your zigzags.", "You and your zigzags.", "Zigzags again.", "You and your ZIGZAGS!", "You and your zigzags, honestly.", "The zigzag strikes again.") },
      { beat: 'The zigzag works, again.' },
    ] },
    { id: 'tms.un-a1', when: UN, turns: [
      { beat: 'The bird door ended in a wall. Back to the start.' },
      { by: 'a', say: "Not the bird. Never the bird. The eye, then." },
      { by: 'b', say: "The eye is watching us. I don't like the eye." },
      { beat: 'The eye door leads out. They don\'t look back.' },
    ] },
    { id: 'tms.un-a2', when: UN, turns: [
      { by: 'a', say: "We've been past that statue twice. We're going in circles." },
      { by: 'b', say: "Then turn left at the statue. We keep turning right." },
      { beat: 'Left at the statue, and there\'s daylight at the end of the corridor.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tms.ov-t1', when: OV, turns: [
      { beat: '{b} is clinging to a stone halfway up the pyramid, not moving.' },
      { by: 'b', say: "Don't look down. I made the mistake of looking down." },
      { by: 'a', say: "Then look up. Up is where the top is." },
    ] },
    { id: 'tms.un-t1', when: UN, turns: [
      { beat: 'Something wrapped in bandages is standing in the corridor ahead of them, perfectly still.' },
      { by: 'a', say: "Is that a mummy? Tell me that's not a mummy." },
      { by: 'b', ...V("It's a statue. It's just a statue. Walk past it.", "It's a statue. Walk past.", "Statue. Walk.", "It's a STATUE! It's JUST a STATUE! Walk PAST it!", "It's only a statue. Just walk past it.", "It's a decoration. A very scary decoration.") },
      { beat: 'They walk past it very slowly. It doesn\'t move. Probably.' },
    ] },
    { id: 'tms.un-t2', when: UN, turns: [
      { by: 'b', say: "My torch is dying. Why is my torch dying?" },
      { by: 'a', say: "Because it's been an hour. We've been in here an hour." },
      { by: 'b', say: "It felt like a day." },
    ] },
  ],
  'task-done.any': [
    { id: 'tms.py-dn1', when: PY, turns: [
      { beat: '{a} and {b} reach the Don Box on the far side of the pyramid and grab the tip.' },
      { by: 'a', say: "Camels. To the river." },
      { by: 'b', ...V("Camels? Nobody said anything about camels!", "Camels again?", "More camels?", "CAMELS again? We've DONE camels!", "Camels again? We've already done camels!", "The camels have found us once more.") },
    ] },
    { id: 'tms.py-dn2', when: PY, turns: [
      { by: 'b', say: "We conquered a pyramid." },
      { by: 'a', say: "We conquered a pyramid, and we've got sand in places sand should never be." },
      { by: 'b', say: "Worth it." },
    ] },
    { id: 'tms.py-dn3', when: PY, turns: [
      { beat: '{a} shakes sand out of {a.posAdj} hair. A small cloud of it.' },
      { by: 'a', say: "Is there sand in my hair?" },
      { by: 'b', say: "Your hair is mostly sand now." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tms.ov-x1', when: OV, turns: [
      { beat: 'A stone crumbles under {b}\'s foot, and {b} slides all the way back to the bottom.' },
      { by: 'b', say: "I'm okay! I'm okay! I'm at the bottom again, but I'm okay!" },
      { by: 'a', say: "Then back up we go." },
    ] },
    { id: 'tms.un-x1', when: UN, turns: [
      { beat: '{a} leans on a stone in the wall. It sinks in with a click. Hundreds of scarab beetles pour from the ceiling.' },
      { by: 'a', ...V("Bugs! Bugs! Bugs everywhere!", "Bugs everywhere!", "Bugs!", "BUGS! BUGS! BUGS EVERYWHERE!", "Bugs! There are bugs everywhere!", "A plague! A plague of beetles!") },
      { by: 'b', say: "Out! Out! Back the way we came!" },
    ] },
    { id: 'tms.un-x2', when: UN, turns: [
      { beat: 'The corridor ends in a solid stone wall covered in carvings.' },
      { by: 'b', say: "Dead end. It's a dead end." },
      { by: 'a', say: "Back to the three doors. We picked the wrong animal." },
    ] },
  ],
};

// ── the camel ride ──
const camel = {
  'ride.any': [
    { id: 'tms.cm-r1', when: CM, turns: [
      { beat: '{a} and {b} sway across the dunes on a camel, the pyramid shrinking behind them.' },
      { by: 'b', say: "I'm getting the hang of this. Up, down, up, down." },
      { by: 'a', ...V("I'm getting seasick on a camel.", "Seasick on a camel.", "I'm camel-sick.", "I'm getting SEASICK on a CAMEL!", "I'm getting seasick, on a camel, somehow.", "I have invented camel sickness.") },
    ] },
    { id: 'tms.cm-r2', when: CM, turns: [
      { by: 'a', say: "Talk to it. Maybe it goes faster if you talk to it." },
      { by: 'b', say: "Hello, camel. Please go faster. We'd really appreciate it." },
      { beat: 'The camel speeds up. Nobody can explain it.' },
    ] },
    { id: 'tms.cm-r3', when: CM, turns: [
      { by: 'b', say: "Is that the river? There's a line of green. That has to be the river." },
      { by: 'a', say: "Green means water. Water means river. Go, camel!" },
      { by: 'b', say: "The camel heard 'water'. Look at it go." },
    ] },
    { id: 'tms.cm-r4', when: CM, turns: [
      { beat: 'The camel turns its head and looks {a} directly in the eye.' },
      { by: 'a', say: "Why is it looking at me like that?" },
      { by: 'b', say: "It's sizing you up. Don't blink." },
    ] },
  ],
  'travel-mishap.any': [
    { id: 'tms.cm-m1', when: { ...CM, mishap: 'camel-sits' }, turns: [
      { beat: 'Halfway across the dunes, the camel folds its legs and sits down in the sand. It will not get up.' },
      { by: 'a', say: "Up! Come on! Up! Please!" },
      { by: 'b', ...V("It's having a rest. It's decided to have a rest.", "It's resting.", "It's on a break.", "It's having a REST! It's DECIDED to have a REST!", "It's just decided to have a rest, hasn't it?", "The camel has declared a holiday.") },
      { beat: 'Twenty minutes later, the camel gets up, entirely on its own terms.' },
    ] },
    { id: 'tms.cm-m2', when: { ...CM, mishap: 'scarab-swarm' }, turns: [
      { beat: 'A buzzing cloud of scarab beetles rises from the sand and swarms around them.' },
      { by: 'b', say: "Beetles! Why are there flying beetles?" },
      { by: 'a', say: "Sing! Somebody said singing calms them! Sing something!" },
      { beat: 'They sing, badly, all the way across the dunes. The beetles leave. It might be the singing.' },
    ] },
  ],
};

// ── the reed boat ──
const reedBoat = {
  'don-demo.gag': [
    { id: 'tms.rb-d1', when: RB, turns: [
      don("In this All-In, teams build a boat out of these reeds and paddle it across the river to the far bank. Watch out for the crocodiles."),
      { beat: 'He sits in a tiny reed boat he built himself. It slowly fills with water.' },
      don("It's a prototype. It's sinking. I'm getting out. Interns! Interns!"),
    ] },
  ],
  'don-demo.dry': [
    { id: 'tms.rb-d2', when: RB, turns: [
      don("Tie the reeds tight. Loose reeds mean a sinking boat, and a sinking boat means swimming back. Past the crocodiles."),
      { beat: 'A crocodile opens its jaws on the far bank, lazily, in the sun.' },
      don("They've been fed. Mostly. Good luck!"),
    ] },
  ],
  'task-start.any': [
    { id: 'tms.rb-s1', when: RB, turns: [
      { beat: '{a} and {b} kneel by a pile of reeds and a coil of rope.' },
      { by: 'a', say: "Have you ever built a boat?" },
      { by: 'b', ...V("I built a model ship once. In a bottle.", "A model ship. In a bottle.", "In a bottle, once.", "I built a MODEL SHIP once! In a BOTTLE!", "I built a model ship once, in a bottle.", "I built a tiny ship in a bottle. I'm basically a shipwright.") },
      { by: 'a', say: "Then you're in charge." },
    ] },
    { id: 'tms.rb-s2', when: RB, turns: [
      { by: 'b', say: "Bundle them up. Tie them tight. Then tie them tighter." },
      { by: 'a', say: "How tight is tighter?" },
      { by: 'b', say: "Crocodile tight." },
    ] },
    { id: 'tms.rb-s3', when: RB, turns: [
      { beat: 'On the far bank, a crocodile slides into the water and disappears.' },
      { by: 'a', say: "Where did it go? Where did the crocodile go?" },
      { by: 'b', say: "Don't think about it. Build the boat." },
    ] },
    { id: 'tms.rb-s4', when: RB, turns: [
      { by: 'a', say: "Does it need to look like a boat, or just float like a boat?" },
      { by: 'b', say: "Just float. Floating is all that matters." },
      { by: 'a', say: "Then I'm building a very ugly boat." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tms.rb-f1', when: RB, turns: [
      { beat: '{a} and {b} push their reed boat into the river. It floats. They climb in. It keeps floating.' },
      { by: 'b', say: "It floats! We built a boat, and it floats!" },
      { by: 'a', ...V("Paddle! Paddle before it changes its mind!", "Paddle! Quickly!", "Paddle!", "PADDLE! Paddle before it CHANGES its MIND!", "Paddle, quickly, before it changes its mind!", "Row! Row before the river notices us!") },
    ] },
    { id: 'tms.rb-f2', when: RB, turns: [
      { by: 'a', say: "Keep to the middle. The crocodiles stay by the banks." },
      { beat: 'They paddle straight down the middle of the river, past a row of watching crocodiles, and land safely.' },
      { by: 'b', say: "They watched us the whole way. Every single one." },
    ] },
    { id: 'tms.rb-f3', when: RB, turns: [
      { beat: 'The boat is lopsided, ugly and leaking slightly. It gets them all the way across.' },
      { by: 'b', say: "It's the ugliest boat in the world, and I love it." },
      { by: 'a', say: "We should name it. Something noble." },
    ] },
    { id: 'tms.rb-f4', when: RB, turns: [
      { by: 'b', say: "We're nearly there. Don't splash. Don't attract attention." },
      { by: 'a', say: "Quiet paddling. The quietest paddling in the world." },
      { beat: 'They land without a single crocodile looking up.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tms.rb-a1', when: RB, turns: [
      { beat: 'Back on the bank, soaked, {a} and {b} tie every bundle twice over.' },
      { by: 'b', say: "Double knots. Triple knots. All the knots." },
      { by: 'a', say: "This boat is more knot than reed." },
      { beat: 'The knotty boat floats beautifully.' },
    ] },
    { id: 'tms.rb-a2', when: RB, turns: [
      { by: 'a', ...V("Make it bigger. The first one was too small for both of us.", "Make it bigger this time.", "Bigger. Two people.", "Make it BIGGER! The first one was TOO SMALL for BOTH of us!", "We need to make it bigger. The first one was too small for both of us.", "A grander vessel. Fit for two pharaohs.") },
      { beat: 'The bigger boat holds both of them, and gets them across.' },
      { by: 'b', say: "Size matters. In boats." },
    ] },
    { id: 'tms.rb-a3', when: RB, turns: [
      { beat: 'Third boat. This time {a} and {b} stuff the inside with extra reeds, like a mattress.' },
      { by: 'b', say: "It's not even a boat now. It's a raft. A very comfortable raft." },
      { by: 'a', say: "It floats. That's a boat." },
    ] },
    { id: 'tms.rb-a4', when: RB, turns: [
      { by: 'b', say: "Copy that team's boat. Theirs worked. Look at the shape." },
      { by: 'a', say: "Pointy at the front. Okay. Pointy at the front." },
      { beat: 'Pointy at the front, and it cuts straight across the river.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tms.rb-t1', when: RB, turns: [
      { beat: 'The reeds keep slipping out of the knots. {a}\'s hands are red raw from the rope.' },
      { by: 'a', say: "They won't stay tied. Why won't they stay tied?" },
      { by: 'b', say: "Wet them. Wet reeds stay put. I read that somewhere." },
    ] },
    { id: 'tms.rb-t2', when: RB, turns: [
      { by: 'b', ...V("We're the only team still on this side.", "We're the last ones here.", "Only us left.", "We're the ONLY team STILL on THIS SIDE!", "We're the only team still on this side of the river.", "We are alone on the wrong bank.") },
      { by: 'a', say: "Then we've got all the reeds to ourselves. Take the good ones." },
      { by: 'b', say: "The good ones are all gone. These are the leftover reeds." },
    ] },
    { id: 'tms.rb-t3', when: RB, turns: [
      { beat: 'Halfway across, the boat is sitting lower and lower in the water.' },
      { by: 'a', say: "Paddle faster! Faster than it sinks!" },
      { by: 'b', say: "I'm paddling as fast as it's sinking!" },
    ] },
  ],
  'task-done.any': [
    { id: 'tms.rb-dn1', when: RB, turns: [
      { beat: '{a} and {b} leap out of the reed boat onto the far bank and scramble up the slope.' },
      { by: 'a', say: "We did it! We crossed a river on grass!" },
      { by: 'b', ...V("Reeds! It's reeds! But yes! We did it!", "Reeds, but yes!", "Reeds! Yes!", "REEDS! It's REEDS! But YES! We DID it!", "It's reeds, not grass, but yes, we did it!", "Reeds, technically. But victory, also technically.") },
    ] },
    { id: 'tms.rb-dn2', when: RB, turns: [
      { by: 'b', say: "The Chill Zone's at the foot of the pyramid. Over there." },
      { by: 'a', say: "We started at a pyramid, and we're ending at one." },
      { by: 'b', say: "It's a pyramid kind of day." },
    ] },
    { id: 'tms.rb-dn3', when: RB, turns: [
      { beat: '{a} looks back at the crocodiles one last time.' },
      { by: 'a', say: "Goodbye, crocodiles. Thank you for not eating us." },
      { by: 'b', say: "Don't thank them. They might change their minds." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tms.rb-x1', when: RB, turns: [
      { beat: 'Ten metres out, the reed boat comes apart, bundle by bundle, and {a} and {b} are swimming.' },
      { by: 'a', say: "Swim! Back to the bank! Don't look at the crocodiles!" },
      { by: 'b', say: "I'm not looking! I'm swimming with my eyes shut!" },
    ] },
    { id: 'tms.rb-x2', when: RB, turns: [
      { beat: 'The boat floats perfectly, until {b} climbs in, and it rolls over.' },
      { by: 'b', ...V("It doesn't like me! The boat doesn't like me!", "The boat hates me!", "It doesn't like me!", "It DOESN'T like me! The BOAT doesn't LIKE me!", "The boat just doesn't like me, does it?", "The vessel has rejected me!") },
      { by: 'a', say: "Build it wider. It needs to be wider." },
    ] },
    { id: 'tms.rb-x3', when: RB, turns: [
      { beat: 'A crocodile glides towards the boat, very slowly, eyes just above the water.' },
      { by: 'a', say: "Back! Back to the bank! Now!" },
      { beat: 'They paddle back to the start faster than they have ever paddled.' },
    ] },
  ],
};

export default mergePools(place, pyramid, camel, reedBoat);
