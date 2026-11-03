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
      don("Tomb Sands! Home of the great pyramid, the great river, and a lot of sand!"),
      don("Teams must go over the pyramid or under it, cross the desert by camel, and build a boat to cross a river full of crocodiles."),
      { beat: 'He tips sand out of one shoe.' },
      don("And somewhere in that tomb, there's a curse. Probably. I'm not going in to check."),
    ] },
    { id: 'tms.op2', when: P, turns: [
      don("Welcome to Tomb Sands, home of pharaohs, mummies, and one of the oldest wonders in the world!"),
      { beat: 'A camel wanders up behind him and sniffs his sleeve.' },
      don("Not the suit. Not the suit! Somebody get this camel off my suit!"),
    ] },
  ],
  'don-opener.bored': [
    { id: 'tms.op3', when: P, turns: [
      { beat: 'Don sits in the shade of a palm tree, fanning himself with a papyrus scroll.' },
      don("Tomb Sands. Hot. Old. Sandy. Very, very hot."),
      don("The teams have a pyramid to deal with today, so let's see how they do!"),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'tms.ar1', when: P, turns: [
      { beat: 'The great pyramid rises out of the desert, enormous, golden in the morning sun.' },
      { by: 'a', ...V("That's thousands of years old. People built that by hand.", "Thousands of years old. By hand.", "Built by hand.", "That's THOUSANDS of years OLD! People built that by HAND!", "That's thousands of years old, and people built it by hand.", "Ancient people stacked that. With no cranes.") },
      { by: 'b', say: "I've seen it in books my whole life. It's so much bigger in real life." },
      { by: 'a', say: "It's huge." },
    ] },
    { id: 'tms.ar2', when: P, turns: [
      { by: 'b', say: "We're standing where the pharaohs stood." },
      { by: 'a', say: "And we're about to climb it." },
      { by: 'b', say: "Carefully. We'll climb carefully." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'tms.ad1', when: P, turns: [
      { by: 'a', say: "Mummies. There are going to be mummies, aren't there." },
      { by: 'b', say: "They're just mummies. They don't move." },
      { by: 'a', say: "Say that again. Slowly." },
    ] },
    { id: 'tms.ad2', when: P, turns: [
      { beat: 'The sun is already blazing, and it isn\'t even nine in the morning.' },
      { by: 'b', say: "It's so hot already." },
      { by: 'a', say: "And it's not even nine." },
      { by: 'b', say: "Drink some water." },
    ] },
  ],
};

// ── over or under ──
const pyramid = {
  'don-demo.gag': [
    { id: 'tms.py-d1', when: PY, turns: [
      don("In this Either/Or, teams choose. Over: climb the great pyramid and get down the other side. Under: go through the tomb, and find the way out."),
      { beat: 'He peers into the dark doorway of the tomb. Something inside groans, very softly.' },
      don("That's the wind. That's definitely the wind. Mostly. I'd go over."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'tms.py-d2', when: PY, turns: [
      don("Over is hot, steep and very high. Under is dark, and only one of the three doors leads out!"),
      { beat: 'He holds up three cards with three symbols on them: an eye, a bird, a dog.' },
      don("Choose wisely. Or quickly. Ideally both."),
    ] },
  ],
  'decide-side.agree': [
    { id: 'tms.py-dc1', when: { ...PY, side: 'over' }, turns: [
      { by: 'a', say: "Over or under?" },
      { by: 'b', say: "Over. I'm not going into a tomb." },
      { by: 'a', say: "Over it is. Up we go." },
    ] },
  ],
  'decide-side.overruled': [
    { id: 'tms.py-dc2', when: { ...PY, side: 'under' }, turns: [
      { by: 'b', say: "Over. Over, over, over." },
      { by: 'a', say: "Under's quicker if we pick the right door. We're going under." },
      { by: 'b', say: "If anything goes wrong in there, it's your fault." },
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
      { by: 'a', say: "These steps are huge." },
      { by: 'b', say: "Climb. Don't talk. Save your breath." },
    ] },
    { id: 'tms.ov-s2', when: OV, turns: [
      { by: 'b', say: "How many steps do you think there are?" },
      { by: 'a', say: "Don't count them." },
      { by: 'b', say: "Too late. I've counted forty and we're not halfway." },
    ] },
    { id: 'tms.un-s1', when: UN, turns: [
      { beat: '{a} and {b} step into the tomb. Three doorways in front of them: an eye, a bird and a dog.' },
      { by: 'a', say: "Which one? The eye, the bird or the dog?" },
      { by: 'b', say: "The dog. I've got a good feeling about the dog." },
    ] },
    { id: 'tms.un-s2', when: UN, turns: [
      { by: 'b', say: "It's so dark. I can't see my own hand." },
      { by: 'a', say: "Hold the wall. Hold the wall and keep walking." },
      { by: 'b', say: "The wall is so cold." },
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
      { by: 'b', say: "That was so much fun." },
    ] },
    { id: 'tms.un-f1', when: UN, turns: [
      { beat: 'The dog door leads down a long corridor and out into the sunlight on the far side.' },
      { by: 'b', say: "The dog! I told you!" },
      { by: 'a', say: "Okay. You were right." },
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
      { by: 'a', say: "I can climb. I just can't believe I have to do it again." },
      { beat: 'The second climb is slower, but they make it to the top.' },
    ] },
    { id: 'tms.ov-a2', when: OV, turns: [
      { by: 'b', say: "Zigzag. Go up in a zigzag. It's less steep." },
      { by: 'a', say: "Okay. Zigzag." },
      { beat: 'The zigzag works.' },
    ] },
    { id: 'tms.un-a1', when: UN, turns: [
      { beat: 'The bird door ends in a wall. Back to the start.' },
      { by: 'a', say: "Not the bird. Never the bird. The eye, then." },
      { by: 'b', say: "Okay. The eye." },
      { beat: 'The eye door leads out.' },
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
      { by: 'a', say: "Then look up. Look at the top." },
    ] },
    { id: 'tms.un-t1', when: UN, turns: [
      { beat: 'A statue wrapped in bandages stands in the corridor ahead of them.' },
      { by: 'a', say: "Is that a mummy? Tell me that's not a mummy." },
      { by: 'b', say: "It's a statue. It's just a statue. Walk past it." },
      { beat: 'They walk past it very slowly.' },
    ] },
    { id: 'tms.un-t2', when: UN, turns: [
      { by: 'b', say: "My torch is dying. Why is my torch dying?" },
      { by: 'a', say: "Because it's been an hour. We've been in here an hour." },
      { by: 'b', say: "It felt so much longer." },
    ] },
  ],
  'task-done.any': [
    { id: 'tms.py-dn1', when: PY, turns: [
      { beat: '{a} and {b} reach the Don Box on the far side of the pyramid and grab the tip.' },
      { by: 'a', say: "Camels. To the river." },
      { by: 'b', say: "Camels? Real camels?" },
    ] },
    { id: 'tms.py-dn2', when: PY, turns: [
      { by: 'b', say: "We climbed a pyramid." },
      { by: 'a', say: "We climbed a pyramid, and we've got sand everywhere." },
      { by: 'b', say: "Worth it." },
    ] },
    { id: 'tms.py-dn3', when: PY, turns: [
      { beat: '{a} shakes sand out of {a.posAdj} hair. A small cloud of it.' },
      { by: 'a', say: "Is there sand in my hair?" },
      { by: 'b', say: "So much sand." },
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
      { by: 'a', say: "Beetles! Beetles everywhere!" },
      { by: 'b', say: "Out! Out! Back the way we came!" },
    ] },
    { id: 'tms.un-x2', when: UN, turns: [
      { beat: 'The corridor ends in a solid stone wall covered in carvings.' },
      { by: 'b', say: "Dead end. It's a dead end." },
      { by: 'a', say: "Back to the three doors. We picked the wrong one." },
    ] },
  ],
};

// ── the camel ride ──
const camel = {
  'ride.any': [
    { id: 'tms.cm-r1', when: CM, turns: [
      { beat: '{a} and {b} sway across the dunes on a camel, the pyramid shrinking behind them.' },
      { by: 'b', say: "I'm getting the hang of this. Up, down, up, down." },
      { by: 'a', say: "I feel sick. It's like a boat." },
    ] },
    { id: 'tms.cm-r2', when: CM, turns: [
      { by: 'a', say: "Talk to it. Maybe it goes faster if you talk to it." },
      { by: 'b', say: "Come on, camel. Please go faster." },
      { beat: 'The camel speeds up.' },
    ] },
    { id: 'tms.cm-r3', when: CM, turns: [
      { by: 'b', say: "Is that the river? There's a line of green. That has to be the river." },
      { by: 'a', say: "Green means water. Water means river. Go, camel!" },
      { by: 'b', say: "Look at it go! It can smell the water!" },
    ] },
    { id: 'tms.cm-r4', when: CM, turns: [
      { beat: 'The camel turns its head and looks at {a}.' },
      { by: 'a', say: "Why is it looking at me like that?" },
      { by: 'b', say: "I don't know. Just hold on." },
    ] },
  ],
  'travel-mishap.any': [
    { id: 'tms.cm-m1', when: { ...CM, mishap: 'camel-sits' }, turns: [
      { beat: 'Halfway across the dunes, the camel folds its legs and sits down in the sand. It will not get up.' },
      { by: 'a', say: "Up! Come on! Up! Please!" },
      { by: 'b', say: "It's tired. It wants a rest." },
      { beat: 'Twenty minutes later, the camel finally gets up.' },
    ] },
    { id: 'tms.cm-m2', when: { ...CM, mishap: 'scarab-swarm' }, turns: [
      { beat: 'A hot wind whips up the sand and blows it straight into their faces.' },
      { by: 'b', say: "Sand! I can't see!" },
      { by: 'a', say: "Cover your face! Keep going!" },
      { beat: 'They pull their shirts over their faces and ride on, slowly, until the wind drops.' },
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
      { by: 'b', say: "No. Never." },
      { by: 'a', say: "Me neither. Let's just try." },
    ] },
    { id: 'tms.rb-s2', when: RB, turns: [
      { by: 'b', say: "Bundle them up. Tie them tight. Then tie them tighter." },
      { by: 'a', say: "How tight is tighter?" },
      { by: 'b', say: "As tight as you can." },
    ] },
    { id: 'tms.rb-s3', when: RB, turns: [
      { beat: 'On the far bank, a crocodile slides into the water and disappears.' },
      { by: 'a', say: "Where did it go? Where did the crocodile go?" },
      { by: 'b', say: "Don't think about it. Build the boat." },
    ] },
    { id: 'tms.rb-s4', when: RB, turns: [
      { by: 'a', say: "Does it need to look like a boat, or just float like a boat?" },
      { by: 'b', say: "Just float. Floating is all that matters." },
      { by: 'a', say: "Then it's going to be an ugly boat." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tms.rb-f1', when: RB, turns: [
      { beat: '{a} and {b} push their reed boat into the river. It floats. They climb in. It keeps floating.' },
      { by: 'b', say: "It floats! We built a boat, and it floats!" },
      { by: 'a', say: "Paddle! Paddle!" },
    ] },
    { id: 'tms.rb-f2', when: RB, turns: [
      { by: 'a', say: "Keep to the middle. The crocodiles stay by the banks." },
      { beat: 'They paddle straight down the middle of the river, past a row of watching crocodiles, and land safely.' },
      { by: 'b', say: "They watched us the whole way." },
    ] },
    { id: 'tms.rb-f3', when: RB, turns: [
      { beat: 'The boat is lopsided, ugly and leaking slightly. It gets them all the way across.' },
      { by: 'b', say: "It's so ugly, but it worked." },
      { by: 'a', say: "I love that boat." },
    ] },
    { id: 'tms.rb-f4', when: RB, turns: [
      { by: 'b', say: "We're nearly there. Don't splash. Don't attract attention." },
      { by: 'a', say: "Quiet paddling. Okay." },
      { beat: 'They land without a single crocodile looking up.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tms.rb-a1', when: RB, turns: [
      { beat: 'Back on the bank, soaked, {a} and {b} tie every bundle twice over.' },
      { by: 'b', say: "Double knots. Triple knots." },
      { by: 'a', say: "That's a lot of knots." },
      { beat: 'The new boat floats.' },
    ] },
    { id: 'tms.rb-a2', when: RB, turns: [
      { by: 'a', ...V("Make it bigger. The first one was too small for both of us.", "Make it bigger this time.", "Bigger. Two people.", "Make it BIGGER! The first one was TOO SMALL for BOTH of us!", "We need to make it bigger. The first one was too small for both of us.", "A grander vessel. Fit for two pharaohs.") },
      { beat: 'The bigger boat holds both of them, and gets them across.' },
      { by: 'b', say: "Bigger worked." },
    ] },
    { id: 'tms.rb-a3', when: RB, turns: [
      { beat: 'Third boat. This time {a} and {b} stuff the inside with extra reeds, like a mattress.' },
      { by: 'b', say: "It's more of a raft now." },
      { by: 'a', say: "It floats. That's a boat." },
    ] },
    { id: 'tms.rb-a4', when: RB, turns: [
      { by: 'b', say: "Copy that team's boat. Theirs worked. Look at the shape." },
      { by: 'a', say: "Pointy at the front. Okay." },
      { beat: 'Pointy at the front, and it cuts straight across the river.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tms.rb-t1', when: RB, turns: [
      { beat: 'The reeds keep slipping out of the knots. {a}\'s hands are red raw from the rope.' },
      { by: 'a', say: "They won't stay tied. Why won't they stay tied?" },
      { by: 'b', say: "Wet them first. I think they stay better wet." },
    ] },
    { id: 'tms.rb-t2', when: RB, turns: [
      { by: 'b', ...V("We're the only team still on this side.", "We're the last ones here.", "Only us left.", "We're the ONLY team STILL on THIS SIDE!", "We're the only team still on this side of the river.", "We are alone on the wrong bank.") },
      { by: 'a', say: "Then we've got all the reeds to ourselves. Take the good ones." },
      { by: 'b', say: "The good ones are all gone. These are the leftover reeds." },
    ] },
    { id: 'tms.rb-t3', when: RB, turns: [
      { beat: 'Halfway across, the boat is sitting lower and lower in the water.' },
      { by: 'a', say: "Paddle faster! Faster than it sinks!" },
      { by: 'b', say: "I'm paddling as fast as I can!" },
    ] },
  ],
  'task-done.any': [
    { id: 'tms.rb-dn1', when: RB, turns: [
      { beat: '{a} and {b} leap out of the reed boat onto the far bank and scramble up the slope.' },
      { by: 'a', say: "We did it! We crossed the river!" },
      { by: 'b', say: "On a reed boat! We built that!" },
    ] },
    { id: 'tms.rb-dn2', when: RB, turns: [
      { by: 'b', say: "The Chill Zone's at the foot of the pyramid. Over there." },
      { by: 'a', say: "We started at a pyramid, and we're ending at one." },
      { by: 'b', say: "Come on. Nearly there." },
    ] },
    { id: 'tms.rb-dn3', when: RB, turns: [
      { beat: '{a} looks back at the crocodiles one last time.' },
      { by: 'a', say: "Bye, crocodiles." },
      { by: 'b', say: "Don't look at them. Just go." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tms.rb-x1', when: RB, turns: [
      { beat: 'Ten metres out, the reed boat comes apart, bundle by bundle, and {a} and {b} are swimming.' },
      { by: 'a', say: "Swim! Back to the bank! Don't look at the crocodiles!" },
      { by: 'b', say: "I'm not looking! Just swim!" },
    ] },
    { id: 'tms.rb-x2', when: RB, turns: [
      { beat: 'The boat floats perfectly, until {b} climbs in, and it rolls over.' },
      { by: 'b', say: "It rolled! It rolled over!" },
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
