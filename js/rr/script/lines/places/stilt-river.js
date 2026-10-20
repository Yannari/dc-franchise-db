// Stilt River's own lines (js/rr/places/stilt-river.js), 1:1 with the real leg ("Ca-Noodling"), in our own words:
//   the boat       up the river: weed round the propeller.
//   the catfish    Superteam: the teams that reach the bank together catch six catfish by hand out of the muddy
//                  shallows; one that wriggles out of the basket swims off and has to be caught again. (The lines are
//                  the a/b team's; the team they're joined with is "the others".)
//   the tunnels    All-In: old tunnels, low and dark, with harmless traps (trapdoors into mud, tripwires that drop sand,
//                  dead ends) and one torch, to the Don Box with the map out; a wrong turn or a sprung trap and it's back
//                  to the last junction.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'stilt-river' };
const CF = { taskId: 'catfish' };
const TN = { taskId: 'tunnels' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'str.op1', when: P, turns: [
      beat("Don stands in a long wooden boat on a wide brown river, holding an umbrella against the sun, a village on stilts behind him."),
      don("Welcome to Stilt River! A village on legs, a river the colour of chocolate milk, and catfish the size of a small dog."),
      don("Today, teams work together. In big groups. Whether they like each other or not. Mostly not."),
      beat('A catfish breaks the surface beside the boat with a loud slap. Don nearly drops the umbrella.'),
    ] },
    { id: 'str.op2', when: P, turns: [
      don("Stilt River. Everything here is built on stilts, because in the rainy season the river comes to visit. It stays for months."),
      don("Racers, your long-tail boats are at the jetty. Keep your hands in the boat. The catfish are friendly. Mostly."),
      beat('A child in a canoe paddles past Don, much faster than his boat, and waves.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'str.op3', when: P, turns: [
      beat("Don is lying in a hammock strung under a stilt hut, swinging gently, eating fruit from a bowl."),
      don("Stilt River. Very relaxing. Unless you're a racer. Boats are at the jetty."),
      don("Go and make some friends. You'll need them."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'str.ar1', when: P, turns: [
      beat("The boat comes round a bend, and there's the village: wooden huts on tall legs, standing in the river, washing on every line."),
      by('a', "The whole village is standing in the water."),
      by('b', "On stilts. Look, the kids are fishing off the front step."),
      by('a', "I want a front step you can fish off."),
    ] },
    { id: 'str.ar2', when: P, turns: [
      by('b', "It's so green. Everything that isn't river is green."),
      by('a', "And everything that is river is brown."),
      by('b', "It's beautiful. Brown and green."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'str.ad1', when: P, turns: [
      by('a', "The tip says 'bare hands'. Catfish. With bare hands."),
      by('b', "Do catfish bite?"),
      by('a', "I think we're about to find out."),
    ] },
    { id: 'str.ad2', when: P, turns: [
      by('b', "And then 'tunnels'. Dark tunnels. With traps."),
      by('a', "Harmless traps. It says harmless."),
      by('b', "Everything is harmless until it happens to you."),
    ] },
  ],
};

// ── the boat (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'str.tm1', when: { taskId: 'longtail-boat', mishap: 'tangled-propeller' }, turns: [
      beat("The long-tail boat's engine whines, then chokes, and the boatman lifts the propeller out of the water. It's wrapped in river weed."),
      by('a', "Can we help? Do you need help?"),
      by('b', "He's got a knife. He doesn't need help."),
      beat('Twenty minutes of cutting and untangling later, the boat roars off again.'),
    ] },
  ],
};

// ── the catfish (Superteam) ──
const catfish = {
  'don-demo.gag': [
    { id: 'str.cf-d1', when: CF, turns: [
      don("In this Superteam, teams that get to the bank together become one big team, and catch six catfish out of the shallows. With their hands. No nets."),
      beat('He reaches into the water to demonstrate, feels something move against his fingers, and pulls his hand straight out.'),
      don("They're down there. They're definitely down there. I've confirmed it. That's enough demonstrating."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'str.cf-d2', when: CF, turns: [
      don("Every fish goes in the fisherman's basket. If one wriggles out, it swims away, and you catch it again."),
      don("When the fisherman counts six, everybody in the Superteam gets the next tip. Everybody. Even the ones who did nothing. You know who you are."),
      beat('The old fisherman sits on the bank beside his basket, smoking a pipe, unimpressed already.'),
    ] },
  ],
  'task-start.any': [
    { id: 'str.cf-s1', when: CF, turns: [
      beat("{a} and {b} wade into the shallows up to their knees. The water is warm, brown, and full of things that move."),
      by('a', "Something just touched my leg."),
      by('b', "Grab it!"),
    ] },
    { id: 'str.cf-s2', when: CF, turns: [
      by('b', "Line up with the others. We walk forward together and push them into the corner."),
      by('a', "Like a wall."),
      by('b', "Like a wall made of people who are scared of fish."),
    ] },
    { id: 'str.cf-s3', when: CF, turns: [
      beat("{a} feels along the muddy bottom with both hands, face screwed up, as the others spread out."),
      by('a', "It's all mud. It's all mud, and some of the mud is moving."),
      by('b', "The moving mud is the fish!"),
    ] },
    { id: 'str.cf-s4', when: CF, turns: [
      by('a', "How do you even hold a catfish?"),
      by('b', "The fisherman says under the belly, behind the whiskers."),
      by('a', "It has whiskers? Nobody said whiskers."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'str.cf-f1', when: CF, turns: [
      beat("The whole group sweeps forward, and the fish come thrashing out of the mud. {a} grabs one, then another, and the others grab the rest."),
      by('a', "Six! The basket's got six!"),
      by('b', "The fisherman's counting! He's nodding! We did it together!"),
    ] },
    { id: 'str.cf-f2', when: CF, turns: [
      by('b', "Got one! A big one! It's looking at me!"),
      beat("{b} holds up a catfish nearly as long as {b.posAdj} arm, and drops it into the basket. Number six."),
      by('a', "That's the last one! That's all six!"),
    ] },
    { id: 'str.cf-f3', when: CF, turns: [
      beat("{a} dives, comes up covered in mud from head to foot, and holding a catfish in each hand."),
      by('a', "Two! Two at once!"),
      by('b', "You're a legend! You're a muddy legend!"),
    ] },
    { id: 'str.cf-f4', when: CF, turns: [
      by('a', "That was fast. Was that fast?"),
      by('b', "The fisherman put his pipe down. I think that means it was fast."),
      by('a', "He's actually smiling. Look at him."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'str.cf-a1', when: CF, turns: [
      by('b', "They keep jumping out of the basket. So somebody sits on the lid. Me."),
      beat("{b} sits on the basket lid. Nothing gets out. The others bring the rest, and the count reaches six."),
      by('a', "Sitting on it! That was the answer!"),
    ] },
    { id: 'str.cf-a2', when: CF, turns: [
      beat("After the third one slips away, {a} stops grabbing and starts scooping, both arms under the fish at once."),
      by('a', "Scoop, don't grab! Tell the others! Scoop!"),
      beat("Everyone scoops. The basket fills to six."),
    ] },
    { id: 'str.cf-a3', when: CF, turns: [
      by('a', "We keep scaring them off. Everybody stand still, and let them come to us."),
      beat('Everybody stands still in the brown water. One by one, the catfish swim right into their hands.'),
      by('b', "Patience! Who knew?"),
    ] },
    { id: 'str.cf-a4', when: CF, turns: [
      beat("It's taken an hour and everybody is soaked, but the sixth catfish finally lands in the basket."),
      by('b', "Six! Finally! Six!"),
      by('a', "I'm never eating catfish again. I've met too many of them."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'str.cf-t1', when: CF, turns: [
      beat("{a} is sitting in the shallows, soaked, holding an empty pair of hands up to the sky."),
      by('a', "I had it. I had it right here, and it just left."),
      by('b', "They're slippery! Get up! Try again!"),
    ] },
    { id: 'str.cf-t2', when: CF, turns: [
      by('b', "The others have caught three. We've caught none."),
      by('a', "We've caught lots. We just haven't kept any."),
      by('b', "That's the same thing!"),
    ] },
    { id: 'str.cf-t3', when: CF, turns: [
      beat("A catfish slaps {a} right across the face with its tail and swims off."),
      by('a', "It hit me! A fish hit me!"),
      by('b', "It's winning! Don't let it win!"),
    ] },
  ],
  'task-done.any': [
    { id: 'str.cf-dn1', when: CF, turns: [
      by('a', "I smell like a river. A whole river."),
      by('b', "We all do. It's fine. We all smell like a river together."),
      by('a', "That's the nicest thing anybody's ever said to me."),
    ] },
    { id: 'str.cf-dn2', when: CF, turns: [
      beat("{a} and {b} wade out of the river, covered in mud, and grab the tip from the fisherman."),
      by('b', "Tunnels next. Dark tunnels."),
      by('a', "At least it'll be dry."),
    ] },
    { id: 'str.cf-dn3', when: CF, turns: [
      by('b', "That other team was actually great."),
      by('a', "Don't tell them that."),
      by('b', "Too late. I already did."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'str.cf-x1', when: CF, turns: [
      beat("{a} drops a catfish into the basket. It immediately flips over the side and swims away."),
      by('a', "No! Come back! You were number five!"),
      by('b', "Back down to four! Again!"),
    ] },
    { id: 'str.cf-x2', when: CF, turns: [
      beat("{b} grabs a catfish by the tail, and it wriggles free in a spray of brown water."),
      by('b', "Tail's no good! You have to get the belly!"),
      by('a', "Then why did you grab the tail?"),
    ] },
    { id: 'str.cf-x3', when: CF, turns: [
      beat("{a} holds up a fish to the fisherman. He shakes his head. It's not a catfish, it's a small, very confused eel."),
      by('a', "What is it, then?"),
      by('b', "Put it back! Put it back gently!"),
    ] },
  ],
};

// ── the tunnels (All-In) ──
const tunnels = {
  'don-demo.gag': [
    { id: 'str.tn-d1', when: TN, turns: [
      don("In this All-In, crawl through these old tunnels until you find the Don Box with the map to the way out. You get one torch. One."),
      beat('He crouches at the tunnel entrance, shines his torch inside, and a bat flies straight out past his ear.'),
      don("The traps are harmless. Trapdoors into mud, tripwires that drop sand. The bats are not traps. The bats are just there."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'str.tn-d2', when: TN, turns: [
      don("Take a wrong turn, or set off a trap, and you go back to the last junction. Lose your torch, and you feel your way in the dark."),
      don("Out of the tunnels with the map gets you the next tip. If you're claustrophobic, today is going to be a very long day."),
      beat('A distant thud echoes out of the tunnel, followed by somebody shouting. Don smiles.'),
    ] },
  ],
  'task-start.any': [
    { id: 'str.tn-s1', when: TN, turns: [
      beat("{a} and {b} squeeze into the tunnel on their hands and knees. The torch shows a few metres of red earth, then nothing."),
      by('a', "It's so small. It's so, so small."),
      by('b', "Keep moving. Don't think about how small it is."),
    ] },
    { id: 'str.tn-s2', when: TN, turns: [
      by('b', "I'll hold the torch. You go first and look for wires."),
      by('a', "Why do I go first?"),
      by('b', "Because I've got the torch."),
    ] },
    { id: 'str.tn-s3', when: TN, turns: [
      beat("The tunnel splits three ways. {a} shines the torch down each one in turn."),
      by('a', "Left, middle, or right?"),
      by('b', "Which one has the fewest bats?"),
    ] },
    { id: 'str.tn-s4', when: TN, turns: [
      by('a', "Feel along the floor before you put your hand down. In case of trapdoors."),
      by('b', "Are you saying that because you know, or because you're scared?"),
      by('a', "Both."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'str.tn-f1', when: TN, turns: [
      beat("The torch lands on a small Don Box in an alcove, right where the third tunnel bends."),
      by('a', "There! There it is! The box!"),
      by('b', "Grab the map! Get us out of here!"),
    ] },
    { id: 'str.tn-f2', when: TN, turns: [
      by('b', "Stop. There's a wire. Right there, at ankle height. Step over it."),
      beat("{a} steps over the wire, crawls round the corner, and there's the Don Box."),
      by('a', "You saw the wire! You saved us!"),
    ] },
    { id: 'str.tn-f3', when: TN, turns: [
      beat("{a} and {b} crawl out of the tunnel into daylight, blinking, with the map in hand."),
      by('a', "First try. No traps. No wrong turns."),
      by('b', "One bat. There was one bat. But no traps."),
    ] },
    { id: 'str.tn-f4', when: TN, turns: [
      by('a', "Follow the fresh air. The way out has fresh air."),
      beat('Following the fresh air takes them straight past the Don Box, and out to the light.'),
      by('b', "Fresh air! How did you know that?"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'str.tn-a1', when: TN, turns: [
      by('b', "We keep going left. Every time we go left, it's a trap. So we go right."),
      beat("They go right, then right again, and find the Don Box at the end of the second turn."),
      by('a', "Right! Right was right!"),
    ] },
    { id: 'str.tn-a2', when: TN, turns: [
      beat("After two trapdoors and a faceful of sand, {a} crawls slower, feeling every bit of the floor."),
      by('a', "Slowly. Slowly. And there it is."),
      by('b', "The box! Finally the box!"),
    ] },
    { id: 'str.tn-a3', when: TN, turns: [
      by('a', "We mark every turn we take. With a scratch on the wall. So we don't do it twice."),
      beat("Scratch, scratch, scratch, and the next unscratched tunnel leads them to the Don Box."),
      by('b', "We made a map to find the map!"),
    ] },
    { id: 'str.tn-a4', when: TN, turns: [
      beat("Crawling in the dark, the torch long gone, {b} puts a hand down, and touches the edge of a box."),
      by('b', "Box. I can feel a box. Is it the box?"),
      by('a', "It's the box! Open it! Find the map!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'str.tn-t1', when: TN, turns: [
      beat("{a} has stopped moving in the middle of a tunnel, breathing fast, eyes shut."),
      by('a', "I need a minute. The walls are too close."),
      by('b', "Hold my ankle. Just hold my ankle and follow me."),
    ] },
    { id: 'str.tn-t2', when: TN, turns: [
      by('b', "We've been past that rock before. That's the same rock."),
      by('a', "All the rocks look the same in the dark."),
      by('b', "That one has my handprint on it."),
    ] },
    { id: 'str.tn-t3', when: TN, turns: [
      beat("The torch flickers, dims, and goes out. Total dark."),
      by('a', "Did you drop it? Please tell me you dropped it."),
      by('b', "No. The battery died."),
    ] },
  ],
  'task-done.any': [
    { id: 'str.tn-dn1', when: TN, turns: [
      by('a', "Sky. I can see the sky. I love the sky."),
      by('b', "You were only in there an hour."),
      by('a', "An hour too long."),
    ] },
    { id: 'str.tn-dn2', when: TN, turns: [
      beat("{a} and {b} crawl out into the light, covered in red dust, and run for the temple path."),
      by('b', "I've got dirt in places I didn't know I had."),
      by('a', "Run first. Wash later."),
    ] },
    { id: 'str.tn-dn3', when: TN, turns: [
      by('b', "You were so brave in there."),
      by('a', "I screamed four times."),
      by('b', "Brave people scream too."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'str.tn-x1', when: TN, turns: [
      beat("{a} puts a hand on the floor, and the floor opens. A trapdoor. {a} slides down into a pit of mud."),
      by('a', "Mud! I'm in mud! Up to my neck in mud!"),
      by('b', "Back to the last junction! Climb out!"),
    ] },
    { id: 'str.tn-x2', when: TN, turns: [
      beat("{b} catches a tripwire with one foot, and a bucket of sand pours down on both of them."),
      by('a', "Sand! Everywhere! In my mouth!"),
      by('b', "Back to the junction! Again!"),
    ] },
    { id: 'str.tn-x3', when: TN, turns: [
      beat("The tunnel ends in a flat wall of earth. A dead end."),
      by('a', "Nothing. It just stops."),
      by('b', "Turn round. Back the way we came. Slowly."),
    ] },
  ],
};

export default mergePools(place, roads, catfish, tunnels);
