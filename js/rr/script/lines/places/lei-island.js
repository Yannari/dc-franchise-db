// Lei Island's own lines (js/rr/places/lei-island.js), 1:1 with the real leg ("Hawaiian Honeyruin"), in our own words:
//   the taxi       to the pier: a flat tyre.
//   the ring       Botch or Watch: dive under the pier where newlyweds throw their rings, and come up with a real one;
//                  a shell or a bottle cap and it's back down. a dives, b waits on the pier.
//   the fire walk  All-In: grass skirts and leis, and one carries the other over the hot coals; a stop, a step off the
//                  side or a dropped partner and it's back to the start of the coals. a carries, b is carried.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'lei-island' };
const RD = { taskId: 'ring-dive' };
const FW = { taskId: 'fire-walk' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'lei.op1', when: P, turns: [
      beat('Don stands on a white beach in a flowered shirt and a lei, a drink with a tiny umbrella in his hand.'),
      don("Welcome to Lei Island! Sun, surf, flowers, and the most romantic bay in the world, which today is full of wedding rings."),
      don("Teams will dive for a ring, and then carry each other over hot coals. That last part is less romantic."),
      beat('A wave rolls in and soaks his shoes. He keeps smiling, but only with his mouth.'),
    ] },
    { id: 'lei.op2', when: P, turns: [
      don("Lei Island. Paradise. I've been asked by the tourist board to say it's paradise, and they paid for the drinks, so: paradise."),
      don("Racers, your taxis are waiting. Aloha, and good luck. Mostly good luck."),
      beat('A hula dancer sways past behind him. He tries, very briefly, to join in, and stops.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'lei.op3', when: P, turns: [
      beat('Don is asleep in a hammock between two palm trees, a lei over his eyes.'),
      don("Lei Island. I'm on a beach. I'm not getting up. The tip's in the taxi."),
      don("Off you go. Somebody bring me a coconut on the way back."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'lei.ar1', when: P, turns: [
      beat('The taxi rounds a headland, and the bay appears: turquoise water, white sand, and a long wooden pier.'),
      by('a', "This doesn't look real. It looks like a screensaver."),
      by('b', "It looks like the place my parents went on their honeymoon."),
      by('a', "It probably is. Look at all the couples."),
    ] },
    { id: 'lei.ar2', when: P, turns: [
      beat('A woman at the airport drapes a lei of flowers around each of their necks and smiles.'),
      by('b', "Flowers! We got flowers!"),
      by('a', "First nice thing anybody's done for us this whole race."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'lei.ad1', when: P, turns: [
      by('a', "Read the second part of the tip. 'Fire walk.'"),
      by('b', "Fire walk. Like, walking? On fire?"),
      by('a', "On fire, while carrying you."),
    ] },
    { id: 'lei.ad2', when: P, turns: [
      by('b', "It's too hot. How is it this hot by the sea?"),
      by('a', "Because the sea is also hot."),
      by('b', "That's not how seas work."),
    ] },
  ],
};

// ── the taxi (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'lei.tm1', when: { taskId: 'pier-taxi', mishap: 'flat-tyre' }, turns: [
      beat('With a bang and a long hiss, the taxi lurches to the side of the coast road. Flat tyre.'),
      by('a', "We're in paradise, and we've got a flat tyre."),
      by('b', "Even paradise has flat tyres, apparently."),
      beat('Twenty minutes, one spare wheel and a lot of sweating later, they are moving again.'),
    ] },
  ],
};

// ── the wedding ring (Botch or Watch: a dives, b waits on the pier) ──
const ring = {
  'don-demo.gag': [
    { id: 'lei.rd-d1', when: RD, turns: [
      don("In this Botch or Watch, one of you dives into the bay under the pier and finds a wedding ring. Couples throw them in here for luck."),
      beat('He holds up his own hand, looks at it, and puts it in his pocket.'),
      don("I've never been married. That's not relevant. Find a ring."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'lei.rd-d2', when: RD, turns: [
      don("Come up with a shell, a bottle cap, or a very surprised crab, and back down you go. The other one waits on the pier and shouts."),
      don("A real wedding ring, handed up onto the pier, gets you the next tip. Don't keep it. I know what some of you are like."),
      beat('Behind him, a newly married couple throws a ring off the end of the pier and kisses. Don rolls his eyes.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'lei.rd-w1', when: RD, turns: [
      by('b', "You're the swimmer. You're always the swimmer."),
      by('a', "I'm only the swimmer because you can't swim."),
      by('b', "Exactly. So you're the swimmer."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'lei.rd-w2', when: RD, turns: [
      by('a', "I'll dive. I've always wanted to find treasure in the sea."),
      by('b', "It's a ring, not treasure."),
      by('a', "A ring in the sea is treasure. That's the definition of treasure."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'lei.rd-w3', when: RD, turns: [
      by('b', "Your turn. I did the ants."),
      by('a', "We haven't done any ants."),
      by('b', "Then I'm saving myself for the ants. Go."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'lei.rd-w4', when: RD, turns: [
      by('a', "'Who can hold their breath?' Underwater. It's going to be underwater."),
      by('b', "You can hold your breath for ages. You did it in the bath once for a minute."),
      by('a', "That was a bath, not a bay."),
    ] },
  ],
  'task-start.any': [
    { id: 'lei.rd-s1', when: RD, turns: [
      beat('{a} stands at the edge of the pier, looking down at the clear blue water and the sand far below.'),
      by('a', "It's deeper than it looks."),
      by('b', "Everything is deeper than it looks. Just jump."),
    ] },
    { id: 'lei.rd-s2', when: RD, turns: [
      by('b', "Look for something shiny. Wedding rings are shiny."),
      by('a', "Everything at the bottom of the sea is shiny. That's the problem."),
      by('b', "Look for the shiny thing that's a ring, then."),
    ] },
    { id: 'lei.rd-s3', when: RD, turns: [
      beat('{a} takes three huge breaths, pinches {a.posAdj} nose and jumps.'),
      by('b', "Find a ring! Any ring! Make someone's honeymoon worth it!"),
      beat("{a} disappears with a splash, and the surface goes still."),
    ] },
    { id: 'lei.rd-s4', when: RD, turns: [
      by('a', "What if I find a really expensive one?"),
      by('b', "Then we hand it over and don't think about it."),
      by('a', "I'm going to think about it a little bit."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'lei.rd-f1', when: RD, turns: [
      beat("{a} bursts up out of the water and holds a gold ring above {a.posAdj} head."),
      by('a', "A ring! A real wedding ring! First go!"),
      by('b', "Hold it tight! Don't drop it back in!"),
    ] },
    { id: 'lei.rd-f2', when: RD, turns: [
      by('b', "Is that a ring? Tell me that's a ring!"),
      by('a', "It's a ring! It's got writing inside. 'Forever.'"),
      by('b', "Forever, and it's in the sea. Give it here."),
    ] },
    { id: 'lei.rd-f3', when: RD, turns: [
      beat('{a} comes up, gasping, opens a hand, and there it is: a thin silver ring, glinting.'),
      by('b', "How did you find it so fast?"),
      by('a', "It found me. It was right under the ladder."),
    ] },
    { id: 'lei.rd-f4', when: RD, turns: [
      by('a', "First dive. First ring. I'm a natural."),
      by('b', "You're a natural ring finder. Put it on your CV."),
      by('a', "Already have."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'lei.rd-a1', when: RD, turns: [
      by('b', "Stop looking near the ladder. Everybody looks near the ladder. Go out further."),
      beat('{a} swims out further, dives, and comes back up with a ring.'),
      by('a', "Further was right! Further had a ring!"),
    ] },
    { id: 'lei.rd-a2', when: RD, turns: [
      beat('On the fourth dive, {a} stays down for what feels like forever, and comes up holding a ring.'),
      by('b', "Was that a minute? That was a whole minute!"),
      by('a', "I wasn't coming up without one. Here."),
    ] },
    { id: 'lei.rd-a3', when: RD, turns: [
      by('a', "I keep bringing up shells. Every shiny thing is a shell."),
      by('b', "Then look for the shiny thing that's round and small."),
      beat("Round and small turns out to be right. {a} surfaces with a ring."),
    ] },
    { id: 'lei.rd-a4', when: RD, turns: [
      beat('{a} dives again, sifting through the sand with both hands, and comes up with a gold band.'),
      by('a', "Finally! A ring and not a bottle top!"),
      by('b', "Swim it up! Before a crab takes it!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'lei.rd-t1', when: RD, turns: [
      beat("{a} clings to the pier ladder, panting, eyes red from the salt water."),
      by('a', "There are no rings down there. Only shells and sadness."),
      by('b', "There are hundreds of rings! People throw them every day!"),
    ] },
    { id: 'lei.rd-t2', when: RD, turns: [
      by('b', "How long can you stay down there? Ten seconds?"),
      by('a', "About eight. Seven, if I'm scared."),
      by('b', "You need more than eight to find a ring."),
    ] },
    { id: 'lei.rd-t3', when: RD, turns: [
      beat("{a} comes up again, empty-handed, for the fifth time, and just floats there."),
      by('a', "I'm going to live down here now. With the shells."),
      by('b', "Breathe, and go down once more."),
    ] },
  ],
  'task-done.any': [
    { id: 'lei.rd-dn1', when: RD, turns: [
      by('a', "Somebody somewhere is married because of this ring."),
      by('b', "And now we're going to win a leg because of it."),
      by('a', "That's beautiful, in a way."),
    ] },
    { id: 'lei.rd-dn2', when: RD, turns: [
      beat('{a} climbs onto the pier, dripping and grinning, and hands over the ring.'),
      by('b', "You did so good. You're a hero."),
      by('a', "I'm a wet hero. Give me a towel."),
    ] },
    { id: 'lei.rd-dn3', when: RD, turns: [
      by('b', "What does the tip say?"),
      by('a', "Something about a fire walk."),
      by('b', "From water to fire. That's a big day."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'lei.rd-x1', when: RD, turns: [
      beat("{a} surfaces holding something triumphantly. It's a bottle cap."),
      by('a', "Ring! I found a ring!"),
      by('b', "That's a bottle cap. Back down."),
    ] },
    { id: 'lei.rd-x2', when: RD, turns: [
      beat("{a} comes up with a shell, then looks at it closely, and throws it back."),
      by('a', "It looked like a ring under the water!"),
      by('b', "Everything looks like a ring under the water!"),
    ] },
    { id: 'lei.rd-x3', when: RD, turns: [
      beat('{a} finds a ring, swims up, and drops it two metres from the surface.'),
      by('a', "No! No, no, no. I had it!"),
      by('b', "Then go and get it again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'lei.rd-v1', when: RD, turns: [
      by('b', "You've got this! You're a fish! You're a ring-finding fish!"),
      by('a', "Fish don't wear rings!"),
      by('b', "Find one anyway!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'lei.rd-v2', when: RD, turns: [
      beat("{b} stares at the water where {a} went down, counting under {b.posAdj} breath."),
      by('b', "Twelve, thirteen, fourteen. Come up. Come up. Please come up."),
      beat('{a} pops up, gasping. {b} sits down on the pier in relief.'),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'lei.rd-v3', when: RD, turns: [
      beat("{b} jumps off the pier into the water to help {a} search."),
      by('b', "Two of us will find it faster!"),
      beat('A crew member on the pier blows a whistle and waves {b} out. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'lei.rd-v4', when: RD, turns: [
      beat("{b} kneels on the end of the pier, perfectly silent, staring down into the clear water."),
      by('a', "Can you see anything from up there?"),
      by('b', "Your feet. Mostly I can see your feet."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'lei.rd-h1', when: RD, turns: [
      beat("While the crew member checks another team's ring, {b} points down at a glint in the sand and whispers."),
      by('b', "Left of the post. Left of the post!"),
      by('a', "Are you allowed to tell me that?"),
    ] },
  ],
};

// ── the fire walk (All-In: a carries, b is carried) ──
const fire = {
  'don-demo.gag': [
    { id: 'lei.fw-d1', when: FW, turns: [
      don("In this All-In, both of you put on grass skirts and leis, and one of you carries the other over a bed of hot coals."),
      beat('He puts on a grass skirt over his suit, steps to the edge of the coals, feels the heat, and steps back.'),
      don("I'm wearing the skirt. That's my contribution. The rest is you."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'lei.fw-d2', when: FW, turns: [
      don("Stop on the coals, step off the side, or drop your partner, and you go back to the start and carry them across again."),
      don("The fire dancer at the end has your tip. He's done this every day for twenty years. He doesn't even have feet any more. That's a joke."),
      beat('The fire dancer at the end of the coals waves. He definitely has feet.'),
    ] },
  ],
  'task-start.any': [
    { id: 'lei.fw-s1', when: FW, turns: [
      beat('{a} and {b} stand in grass skirts at the start of the coals, which glow orange in the shade of the trees.'),
      by('b', "We look ridiculous."),
      by('a', "We look ridiculous and we're about to walk on fire. Climb on."),
    ] },
    { id: 'lei.fw-s2', when: FW, turns: [
      by('a', "Piggyback or in my arms?"),
      by('b', "Whichever means you don't drop me."),
      by('a', "Piggyback. Hold on tight."),
    ] },
    { id: 'lei.fw-s3', when: FW, turns: [
      beat("{b} climbs onto {a}'s back, and {a} wobbles at the edge of the coals."),
      by('b', "Are you okay? Can you carry me?"),
      by('a', "Of course I can. Stop wriggling."),
    ] },
    { id: 'lei.fw-s4', when: FW, turns: [
      by('b', "Walk fast. If you walk fast, your feet don't have time to burn."),
      by('a', "Is that science?"),
      by('b', "It's hope. Go."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'lei.fw-f1', when: FW, turns: [
      beat("{a} strides across the coals without stopping, {b} on {a.posAdj} back, and steps off the end onto the cool grass."),
      by('b', "You did it! You didn't stop once!"),
      by('a', "I couldn't stop. If I stopped, I'd have cried."),
    ] },
    { id: 'lei.fw-f2', when: FW, turns: [
      by('a', "Hot, hot, hot, hot, hot, done!"),
      beat('The fire dancer at the end laughs, claps, and hands them the tip.'),
      by('b', "Was it bad?"),
    ] },
    { id: 'lei.fw-f3', when: FW, turns: [
      beat("{a} crosses the coals at a steady march, perfectly calm, {b} holding on with eyes shut."),
      by('b', "Are we across? Is it over?"),
      by('a', "We're across. You can open your eyes."),
    ] },
    { id: 'lei.fw-f4', when: FW, turns: [
      by('b', "First try! You carried me over fire on the first try!"),
      by('a', "Put that in my wedding speech one day."),
      by('b', "Whose wedding?"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'lei.fw-a1', when: FW, turns: [
      by('b', "Don't look at the coals. Look at the fire dancer. Walk to him."),
      beat("{a} fixes eyes on the fire dancer and walks straight to him, without looking down once."),
      by('a', "Done! Looking at him worked!"),
    ] },
    { id: 'lei.fw-a2', when: FW, turns: [
      beat("Third try, {a} hoists {b} into both arms, takes a deep breath, and walks the coals end to end."),
      by('b', "That's it! That's it! We're across!"),
      by('a', "Never again. But we're across."),
    ] },
    { id: 'lei.fw-a3', when: FW, turns: [
      by('a', "We swap. You carry me this time."),
      by('b', "Me? Carry you?"),
      beat("{b} carries {a} over the coals without stopping, to everyone's surprise, including {b}'s."),
    ] },
    { id: 'lei.fw-a4', when: FW, turns: [
      beat("{a} counts every step out loud this time, all the way across, and doesn't stop until the last one."),
      by('a', "Fourteen! Fourteen steps! We're off!"),
      by('b', "You counted us across a fire. That's genius."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'lei.fw-t1', when: FW, turns: [
      beat("{a} stands at the edge of the coals with {b} on {a.posAdj} back, and doesn't move."),
      by('b', "Are we going?"),
      by('a', "My feet won't go. My feet have decided."),
    ] },
    { id: 'lei.fw-t2', when: FW, turns: [
      by('b', "My grass skirt keeps falling down."),
      by('a', "Hold it up!"),
      by('b', "With what? I'm holding on to you!"),
    ] },
    { id: 'lei.fw-t3', when: FW, turns: [
      beat("{a} has had to put {b} down three times now, and is leaning on a palm tree, panting."),
      by('a', "Why are you so heavy?"),
      by('b', "Why are you so weak? Pick me up."),
    ] },
  ],
  'task-done.any': [
    { id: 'lei.fw-dn1', when: FW, turns: [
      by('a', "My feet are fine. Somehow my feet are fine."),
      by('b', "That's because you went fast."),
      by('a', "That's because I was terrified."),
    ] },
    { id: 'lei.fw-dn2', when: FW, turns: [
      beat("{a} and {b} jog away towards the beach, still in their grass skirts, leis bouncing."),
      by('b', "Are we taking these off?"),
      by('a', "No. We earned these skirts."),
    ] },
    { id: 'lei.fw-dn3', when: FW, turns: [
      by('b', "You carried me across fire. That's the most romantic thing anybody has ever done for me."),
      by('a', "It was a race task."),
      by('b', "Still counts."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'lei.fw-x1', when: FW, turns: [
      beat("Halfway across, {a} hops off the side of the coals onto the grass with a yelp."),
      by('a', "Hot! It's hot! Nobody said it would be that hot!"),
      by('b', "It's fire! Back to the start!"),
    ] },
    { id: 'lei.fw-x2', when: FW, turns: [
      beat("{b} slides off {a}'s back halfway, and lands on the grass beside the coals."),
      by('b', "You dropped me!"),
      by('a', "You let go! Back to the start!"),
    ] },
    { id: 'lei.fw-x3', when: FW, turns: [
      beat("{a} stops dead in the middle of the coals, frozen, and the fire dancer points them back to the start."),
      by('a', "I stopped. Why did I stop?"),
      by('b', "Because you're human! Go again!"),
    ] },
  ],
};

export default mergePools(place, roads, ring, fire);
