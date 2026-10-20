// Swamp Prison's own lines (js/rr/places/swamp-prison.js), 1:1 with the real leg ("Shawshank Ridonc-tion"), in our own
// words:
//   the taxi       to the old prison: an alligator sunning itself in the road.
//   the cell       All-In: locked in, four ways out (a spoon and a soft wall, a guard to talk round, a hidden key, the
//                  air vent); a solid wall, an unmoved guard or a dead-end vent and it's on to another way.
//   the raft       All-In: a raft out of barrels, planks, rope and old doors, sailed down the river to the dock; sink,
//                  fall apart or drift into the reeds and it's back to the bank to build again.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'swamp-prison' };
const CL = { taskId: 'prison-cell' };
const RF = { taskId: 'swamp-raft' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'swp.op1', when: P, turns: [
      beat('Don stands on a rotting dock in the swamp, fog hanging over the water, swatting at a cloud of gnats.'),
      don("Welcome to Swamp Prison! An old jail on the edge of a swamp, closed for fifty years, because even the prisoners complained."),
      don("Today, teams get locked up, break out, and sail to the Chill Zone on a raft they build themselves. From junk."),
      beat('Something large slides off the bank into the water behind him. Don very slowly steps away from the edge.'),
    ] },
    { id: 'swp.op2', when: P, turns: [
      don("Swamp Prison. Hot, sticky, and full of things with teeth. And that's just the crew."),
      don("Racers, your taxis are waiting. The prison is at the end of the road. The road is mostly mud."),
      beat('A frog the size of a dinner plate croaks at his feet. Don croaks back, and immediately regrets it.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'swp.op3', when: P, turns: [
      beat("Don is sitting in a rocking chair on the dock, fanning himself with his hat, a jug of iced tea beside him."),
      don("Swamp Prison. Too hot to do anything but rock. So I'm rocking."),
      don("Go break out of jail. I'll be here. Rocking."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'swp.ar1', when: P, turns: [
      beat('The taxi comes out of the trees beside the swamp: still black water, moss hanging off every branch, and herons standing on one leg.'),
      by('a', "It's so quiet. It's spooky, but it's beautiful."),
      by('b', "It looks like a painting. A painting with alligators in it."),
      by('a', "Don't say alligators."),
    ] },
    { id: 'swp.ar2', when: P, turns: [
      beat('The old prison rises out of the swamp ahead of them, grey walls, barred windows, a rusted gate.'),
      by('b', "That's it. That's the prison. We're going in there on purpose."),
      by('a', "Most people try to get out of places like that."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'swp.ad1', when: P, turns: [
      by('a', "Read the tip again. 'Get yourselves locked up.'"),
      by('b', "And then?"),
      by('a', "It just says 'good luck'."),
    ] },
    { id: 'swp.ad2', when: P, turns: [
      by('b', "Something just splashed. Something big just splashed."),
      by('a', "It was a fish."),
      by('b', "That was not a fish. Fish don't splash like that."),
    ] },
  ],
};

// ── the taxi (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'swp.tm1', when: { taskId: 'bayou-taxi', mishap: 'alligator-on-the-road' }, turns: [
      beat('The taxi brakes hard. An alligator is lying across the road, sunning itself, in no hurry at all.'),
      by('a', "Can we go round it?"),
      by('b', "The driver says no. The driver says we wait for it to get bored."),
      beat('Twenty minutes later, the alligator yawns, and slides off into the swamp.'),
    ] },
  ],
};

// ── the cell (All-In) ──
const cell = {
  'don-demo.gag': [
    { id: 'swp.cl-d1', when: CL, turns: [
      don("In this All-In, the guard locks you both in a cell. There are four ways out: a spoon and a soft wall, the guard himself, a hidden key, or the air vent."),
      beat('He steps into a cell to show them. The guard slams the door behind him and turns the key.'),
      don("...That was a demonstration. You can open it now. Hello? Officer? This isn't in the script."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'swp.cl-d2', when: CL, turns: [
      don("Every way out takes time, and not every way out works for everyone. A wall that won't dig, a guard who won't budge, try something else."),
      don("Out of the cell, out of the gate, and the next tip is on the fence. The guard does not take bribes. I've tried."),
      beat('The guard stands at the end of the corridor, arms crossed, chewing on a toothpick, unmoved by anything.'),
    ] },
  ],
  'task-start.any': [
    { id: 'swp.cl-s1', when: CL, turns: [
      beat('The cell door slams shut behind {a} and {b}, and the key turns in the lock.'),
      by('a', "Okay. We're in jail. What do people in films do?"),
      by('b', "Dig with a spoon for twenty years."),
    ] },
    { id: 'swp.cl-s2', when: CL, turns: [
      by('b', "You check the bed. I'll check the toilet."),
      by('a', "Why do I get the bed?"),
      by('b', "Because I'm braver than you."),
    ] },
    { id: 'swp.cl-s3', when: CL, turns: [
      beat("{a} knocks on every brick in the wall, one by one, listening."),
      by('a', "Solid. Solid. Solid. Is this one hollow, or am I imagining it?"),
      by('b', "Knock it again."),
    ] },
    { id: 'swp.cl-s4', when: CL, turns: [
      by('a', "Maybe we just ask the guard nicely."),
      by('b', "Look at his face. He's never done anything nicely in his life."),
      by('a', "Everybody has a soft side."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'swp.cl-f1', when: CL, turns: [
      beat('{a} lifts the corner of the mattress, and there, taped underneath it, is a rusty key.'),
      by('a', "First place I looked! First place!"),
      by('b', "Open the door! Open it before he notices!"),
    ] },
    { id: 'swp.cl-f2', when: CL, turns: [
      by('b', "Officer, my partner's mother is very sick, and she's only got this race to watch, and if we lose today..."),
      beat('The guard looks at {b} for a long time, takes the toothpick out of his mouth, and unlocks the door.'),
      by('a', "What? That worked? That actually worked?"),
    ] },
    { id: 'swp.cl-f3', when: CL, turns: [
      beat('{a} unscrews the grille on the air vent with a spoon handle and squeezes up and into the dark.'),
      by('a', "It goes somewhere! It goes outside! Follow me!"),
      by('b', "Is it clean in there?"),
    ] },
    { id: 'swp.cl-f4', when: CL, turns: [
      by('a', "This brick moves. This one's loose. Spoon!"),
      beat('Three minutes of scraping later, a hole opens in the wall, and daylight shines through.'),
      by('b', "We dug out of jail! With a spoon! Like a film!"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'swp.cl-a1', when: CL, turns: [
      by('b', "Wall's solid, guard won't talk. So it has to be the key. We look everywhere. Everywhere."),
      beat('Everywhere turns out to be inside the hollow leg of the bed. {b} shakes it, and a key falls out.'),
      by('a', "Who hides a key in a bed leg?"),
    ] },
    { id: 'swp.cl-a2', when: CL, turns: [
      beat("This time {a} doesn't beg the guard. {a} just talks to him about fishing, for ten whole minutes."),
      by('a', "...and that's when I knew the catfish was bigger than the boat."),
      beat('The guard laughs, for the first time all day, and unlocks the door.'),
    ] },
    { id: 'swp.cl-a3', when: CL, turns: [
      by('a', "The vent was a dead end. So we try the other vent. Behind the bed."),
      beat('The other vent behind the bed leads all the way outside. They crawl out into the sunshine.'),
      by('b', "Second vent! It's always the second vent!"),
    ] },
    { id: 'swp.cl-a4', when: CL, turns: [
      beat("Twenty minutes of scraping at the one soft brick, and finally {b}'s spoon breaks through."),
      by('b', "Daylight! I can see daylight!"),
      by('a', "Make it bigger! I'm not fitting through a spoon-sized hole!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'swp.cl-t1', when: CL, turns: [
      beat("{a} is sitting on the bed, head in hands, while {b} scrapes uselessly at a solid wall."),
      by('a', "We're going to be here forever. We live here now."),
      by('b', "Keep looking! There are four ways out!"),
    ] },
    { id: 'swp.cl-t2', when: CL, turns: [
      by('b', "I've told him every sad story I know. He hasn't even blinked."),
      by('a', "Maybe he doesn't like sad stories."),
      by('b', "Everybody likes sad stories!"),
    ] },
    { id: 'swp.cl-t3', when: CL, turns: [
      beat("{a} is stuck halfway into the air vent, legs kicking in the air of the cell."),
      by('a', "I'm stuck! I'm stuck in the vent!"),
      by('b', "Breathe out! Make yourself thinner!"),
    ] },
  ],
  'task-done.any': [
    { id: 'swp.cl-dn1', when: CL, turns: [
      by('a', "We broke out of jail. We're fugitives."),
      by('b', "We're not fugitives. They let us out."),
      by('a', "We're fugitives in my heart."),
    ] },
    { id: 'swp.cl-dn2', when: CL, turns: [
      beat('{a} and {b} run out of the prison gate, grab the tip off the fence, and head for the swamp.'),
      by('b', "A raft. We build a raft now."),
      by('a', "Out of what?"),
    ] },
    { id: 'swp.cl-dn3', when: CL, turns: [
      by('b', "That guard is going to haunt my dreams."),
      by('a', "He waved at us when we left."),
      by('b', "That's what makes it worse."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'swp.cl-x1', when: CL, turns: [
      beat("{a} scrapes at the wall with the spoon until it bends in half. The wall doesn't have a scratch on it."),
      by('a', "The spoon broke! The wall won!"),
      by('b', "Then this wall isn't the way out. Something else!"),
    ] },
    { id: 'swp.cl-x2', when: CL, turns: [
      beat('{b} finishes a long, emotional speech at the bars. The guard just shakes his head.'),
      by('b', "Nothing? Not even a little bit?"),
      by('a', "Try something else. He's made of stone."),
    ] },
    { id: 'swp.cl-x3', when: CL, turns: [
      beat("{a} crawls all the way through the air vent, and comes out right back in the cell."),
      by('a', "It goes in a circle! The vent goes in a circle!"),
      by('b', "Who builds a vent that goes in a circle?"),
    ] },
  ],
};

// ── the raft (All-In) ──
const raft = {
  'don-demo.gag': [
    { id: 'swp.rf-d1', when: RF, turns: [
      don("In this All-In, build a raft out of whatever's on the bank: barrels, planks, rope, old doors. Then sail it down the river to the Chill Zone."),
      beat('He kicks a barrel on the pile. It rolls into the water and sinks, quietly.'),
      don("Try not to use that one. Or anything like it."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'swp.rf-d2', when: RF, turns: [
      don("If it sinks, falls apart, or drifts into the reeds, swim back to the bank and build it again."),
      don("The river is slow, warm, and almost certainly fine. I've only seen two things in it with teeth today."),
      beat('Something with teeth surfaces briefly in the river behind him, and disappears again. Don does not turn round.'),
    ] },
  ],
  'task-start.any': [
    { id: 'swp.rf-s1', when: RF, turns: [
      beat('{a} and {b} stand over the junk pile on the bank: barrels, planks, a door, a lot of rope.'),
      by('a', "Have you ever built a raft?"),
      by('b', "I built a bookshelf once. It leaned."),
    ] },
    { id: 'swp.rf-s2', when: RF, turns: [
      by('b', "Barrels underneath, door on top, rope round everything. Lots of rope."),
      by('a', "How much rope?"),
      by('b', "All of it. Use all the rope."),
    ] },
    { id: 'swp.rf-s3', when: RF, turns: [
      beat("{a} ties a knot, pulls it tight, and it slides straight off the barrel."),
      by('a', "Do you know any knots?"),
      by('b', "I know the one you do on shoes."),
    ] },
    { id: 'swp.rf-s4', when: RF, turns: [
      by('a', "What do we steer with?"),
      by('b', "A plank. We steer with a plank. And hope."),
      by('a', "Mostly hope, then."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'swp.rf-f1', when: RF, turns: [
      beat("{a} and {b} push the raft into the water. It floats. It stays together. It even goes the right way."),
      by('a', "It's working! We built a boat!"),
      by('b', "We built a boat out of a door! Paddle!"),
    ] },
    { id: 'swp.rf-f2', when: RF, turns: [
      by('b', "Left, round the big tree. Then it's straight to the dock."),
      beat('The raft drifts round the big tree, down the river, and bumps gently into the dock.'),
      by('a', "We sailed! We sailed through a swamp!"),
    ] },
    { id: 'swp.rf-f3', when: RF, turns: [
      beat('Their raft glides down the river, smooth and steady, as a heron watches from the bank.'),
      by('a', "This is actually lovely. I could do this all day."),
      by('b', "Don't. Paddle faster. Enjoy it at the dock."),
    ] },
    { id: 'swp.rf-f4', when: RF, turns: [
      by('a', "First raft. First try. Not even wet."),
      by('b', "Your feet are wet."),
      by('a', "Not even very wet."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'swp.rf-a1', when: RF, turns: [
      by('b', "It sank because it was too heavy. No door this time. Just barrels and planks."),
      beat('Just barrels and planks floats perfectly. They paddle all the way down to the dock.'),
      by('a', "Lighter is better. Lighter is always better."),
    ] },
    { id: 'swp.rf-a2', when: RF, turns: [
      beat("This time, {a} ties every knot twice, then a third time, and the raft holds together all the way down the river."),
      by('a', "Three knots! Three knots on everything!"),
      by('b', "That's the dock! We made it!"),
    ] },
    { id: 'swp.rf-a3', when: RF, turns: [
      by('a', "Keep it in the middle of the river. Away from the reeds. The reeds are what got us."),
      beat('They keep it in the middle the whole way, paddling hard, and reach the dock at last.'),
      by('b', "The middle! The middle was the answer!"),
    ] },
    { id: 'swp.rf-a4', when: RF, turns: [
      beat("{a} and {b} rebuild the raft for the third time, soaked and covered in mud, and it finally floats."),
      by('b', "It floats! Third raft's the one!"),
      by('a', "Get on before it changes its mind!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'swp.rf-t1', when: RF, turns: [
      beat("The raft spins slowly in a circle in the middle of the river, going nowhere."),
      by('a', "Why are we spinning?"),
      by('b', "Because you're paddling one way, and I'm paddling the other!"),
    ] },
    { id: 'swp.rf-t2', when: RF, turns: [
      by('b', "We've run out of rope."),
      by('a', "There was so much rope!"),
      by('b', "There was. We used it on the first two rafts."),
    ] },
    { id: 'swp.rf-t3', when: RF, turns: [
      beat("The raft is stuck in the reeds, and {a} is pushing it with a plank, getting nowhere."),
      by('a', "It won't move! The reeds have got it!"),
      by('b', "Push harder! And keep an eye out for teeth!"),
    ] },
  ],
  'task-done.any': [
    { id: 'swp.rf-dn1', when: RF, turns: [
      by('a', "Can we keep the raft?"),
      by('b', "It's made of a door."),
      by('a', "It's our door. We earned it."),
    ] },
    { id: 'swp.rf-dn2', when: RF, turns: [
      beat("{a} and {b} jump off the raft onto the dock, and it slowly drifts away down the river without them."),
      by('b', "Goodbye, raft. You were a good raft."),
      by('a', "You sank twice. But you were a good raft."),
    ] },
    { id: 'swp.rf-dn3', when: RF, turns: [
      by('b', "We broke out of jail and sailed home on a door."),
      by('a', "Nobody's going to believe us."),
      by('b', "It was on television."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'swp.rf-x1', when: RF, turns: [
      beat("{a} and {b} push off from the bank, and the raft sinks slowly, gently, all the way to the bottom."),
      by('a', "It's going down! We're going down!"),
      by('b', "Swim back! Build another!"),
    ] },
    { id: 'swp.rf-x2', when: RF, turns: [
      beat('Halfway down the river, the ropes slip, and the raft comes apart into planks and barrels.'),
      by('b', "Grab a barrel! Grab anything!"),
      by('a', "Back to the bank! Again!"),
    ] },
    { id: 'swp.rf-x3', when: RF, turns: [
      beat("The raft drifts gently sideways, straight into the reeds, and stops, completely stuck."),
      by('a', "Not the reeds. Anything but the reeds."),
      by('b', "We'll have to swim it back and start over."),
    ] },
  ],
};

export default mergePools(place, roads, cell, raft);
