// Cliff Pool Isle's own lines (js/rr/places/cliff-pool-isle.js), in our own words:
//   the minibus     round the coast: a goat gets on.
//   the falls dive  Botch or Watch: off the top of the waterfall into the lagoon, a little chest off the bottom, carried
//                   back up the slippery cliff path; a refused jump, an empty dive or a dropped chest and it's back to the
//                   edge. a dives, b waits at the top.
//   the bobsled     All-In: push, jump in, ride the concrete track three times; the three times together beat the board,
//                   or it's a fresh set of three.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'cliff-pool-isle' };
const FD = { taskId: 'falls-dive' };
const BS = { taskId: 'bobsled' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'cpi.op1', when: P, turns: [
      beat("Don stands on a white beach under a palm tree, in sunglasses and a flowered shirt, reggae drifting from a beach bar behind him."),
      don("Welcome to Cliff Pool Isle! Waterfalls, white sand, and the most relaxed people on earth. Everybody here is so calm. It's making me very nervous."),
      don("Today, teams dive off a waterfall for treasure, and then ride a bobsled. On a tropical island. Don't ask me how. Somebody built it."),
      beat('A man on the beach bar waves at Don, slowly. Don waves back, quickly. The man laughs.'),
    ] },
    { id: 'cpi.op2', when: P, turns: [
      don("Cliff Pool Isle. It's hot, it's beautiful, and nobody here has hurried since about nineteen sixty."),
      don("Racers, the minibus round the coast leaves when the driver feels like it. Get on it. Wait."),
      beat('The minibus driver, behind him, is asleep at the wheel. Don looks at the camera.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'cpi.op3', when: P, turns: [
      beat("Don lies in a hammock between two palm trees, a drink with a tiny umbrella balanced on his stomach."),
      don("Cliff Pool Isle. No problem. Everything's no problem. The minibus is on the road."),
      don("Go. I'm being calm. It's harder than it looks."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'cpi.ar1', when: P, turns: [
      beat("The minibus rounds a bend, and there it is: a waterfall pouring off a green cliff into a lagoon so clear they can see the bottom."),
      by('a', "That's the most beautiful thing I've ever seen."),
      by('b', "And we have to jump off it."),
      by('a', "It's still the most beautiful thing I've ever seen."),
    ] },
    { id: 'cpi.ar2', when: P, turns: [
      by('b', "Everybody here is so happy. Everybody's waving."),
      by('a', "Wave back! Everybody, wave back!"),
      by('b', "I love it here. I want to stay."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'cpi.ad1', when: P, turns: [
      by('a', "The tip says 'bobsled'. Bobsled? It's thirty degrees."),
      by('b', "Maybe it's a typo."),
      by('a', "It's in big letters. With a picture of a bobsled."),
    ] },
    { id: 'cpi.ad2', when: P, turns: [
      by('b', "'Who is a strong swimmer?' Why do they always ask that?"),
      by('a', "Because they're always about to throw one of us into water."),
      by('b', "That makes sense, actually."),
    ] },
  ],
};

// ── the minibus (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'cpi.tm1', when: { taskId: 'coast-minibus', mishap: 'goat-on-the-bus' }, turns: [
      beat("The minibus stops for a woman at the roadside, who gets on with a goat. Then it stops for her cousin. Then her cousin's cousin."),
      by('a', "Is this bus ever going to move?"),
      by('b', "The goat's sitting on my bag. I've made peace with it."),
      beat('Twenty minutes, four relatives and one goat later, the bus reaches the falls.'),
    ] },
  ],
};

// ── the waterfall dive (Botch or Watch: a dives, b waits at the top) ──
const falls = {
  'don-demo.gag': [
    { id: 'cpi.fd-d1', when: FD, turns: [
      don("In this Botch or Watch, one of you jumps off the top of this waterfall into the lagoon, finds a treasure chest on the bottom, and carries it back up the cliff path."),
      beat('He leans over the edge to look down at the lagoon, very far below, and leans straight back.'),
      don("It's deep. It's perfectly safe. It's very, very high. I'm told all three of those are true."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'cpi.fd-d2', when: FD, turns: [
      don("Refuse the jump, come up empty, or drop the chest on the climb, and you go back to the edge. The other one of you waits at the top."),
      don("Set the chest down at the top of the falls, and the next tip is yours. The path is slippery. Very slippery."),
      beat('A racer, halfway up the cliff path with a chest, slips, slides back down, and lands in the lagoon with a splash.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'cpi.fd-w1', when: FD, turns: [
      by('b', "You did the last one? No, that was me. So it's you."),
      by('a', "Are you sure it was you?"),
      by('b', "I remember it very clearly. I still have a bruise. Jump."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'cpi.fd-w2', when: FD, turns: [
      by('a', "I'll jump. I've always wanted to jump off a waterfall."),
      by('b', "Have you ever jumped off anything?"),
      by('a', "A diving board. Once. Belly first. But I wanted to do it."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'cpi.fd-w3', when: FD, turns: [
      by('b', "I'm not going off that. No way. You."),
      by('a', "What if I'm scared too?"),
      by('b', "Then you'll be scared and wet. Go."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'cpi.fd-w4', when: FD, turns: [
      by('a', "'Who is a strong swimmer?' You swim every morning."),
      by('b', "In a pool. With lanes. And a lifeguard."),
      by('a', "That's still swimming."),
    ] },
  ],
  'task-start.any': [
    { id: 'cpi.fd-s1', when: FD, turns: [
      beat("{a} stands at the edge of the waterfall, toes curled over the rock, the water roaring all around."),
      by('a', "It's so high. It didn't look this high from the bus."),
      by('b', "Don't look down! Look at the horizon!"),
    ] },
    { id: 'cpi.fd-s2', when: FD, turns: [
      by('b', "Feet first. Arms in. And hold your nose."),
      by('a', "Why hold my nose?"),
      by('b', "Trust me. Hold your nose."),
    ] },
    { id: 'cpi.fd-s3', when: FD, turns: [
      beat("{a} counts to three, jumps on two, and drops into the lagoon with a huge splash."),
      by('b', "Are you okay? Come up! Say something!"),
      beat("{a} pops up, gasping and grinning, and dives straight back under."),
    ] },
    { id: 'cpi.fd-s4', when: FD, turns: [
      by('a', "How deep is the lagoon?"),
      by('b', "Deep enough to jump into. Hopefully not too deep to find a chest."),
      by('a', "Hopefully."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'cpi.fd-f1', when: FD, turns: [
      beat("{a} jumps, dives, comes up with a little wooden chest, and climbs the cliff path without a single slip."),
      by('b', "You got it! First go! And you didn't fall!"),
      by('a', "I'm a treasure hunter now. That's my job."),
    ] },
    { id: 'cpi.fd-f2', when: FD, turns: [
      by('b', "There! On the bottom! I can see it from up here!"),
      beat("{a} dives straight down to where {b} is pointing, and comes up with the chest."),
      by('a', "You were right! Right where you said!"),
    ] },
    { id: 'cpi.fd-f3', when: FD, turns: [
      beat("{a} carries the chest up the slippery path one careful step at a time, and sets it down at the top."),
      by('a', "That's it. That's it. Done."),
      by('b', "You were so careful! So, so careful!"),
    ] },
    { id: 'cpi.fd-f4', when: FD, turns: [
      by('a', "First jump. First chest. First climb."),
      by('b', "That was amazing."),
      by('a', "It really was. Can I do it again? For fun?"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cpi.fd-a1', when: FD, turns: [
      by('b', "You keep slipping on the path. Go barefoot. Your shoes are the problem."),
      beat("{a} kicks off the wet shoes, climbs barefoot, and sets the chest down at the top."),
      by('a', "Barefoot! Why didn't I think of that?"),
    ] },
    { id: 'cpi.fd-a2', when: FD, turns: [
      beat("Second jump. This time {a} doesn't hesitate at the edge, just jumps, and finds a chest on the first dive."),
      by('a', "Didn't think! Just jumped! It worked!"),
      by('b', "Now bring it up! Carefully!"),
    ] },
    { id: 'cpi.fd-a3', when: FD, turns: [
      by('a', "I keep coming up with nothing because I'm looking in the middle. They're all at the edges."),
      beat("{a} dives at the edge of the lagoon, and comes up holding a chest."),
      by('b', "The edges! It was always the edges!"),
    ] },
    { id: 'cpi.fd-a4', when: FD, turns: [
      beat("After one refusal and one dropped chest, {a} finally carries a chest all the way to the top."),
      by('a', "Third time! Finally at the top!"),
      by('b', "I was starting to think we'd live here."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'cpi.fd-t1', when: FD, turns: [
      beat("{a} has been standing at the edge of the waterfall for five minutes, not moving."),
      by('a', "I'm going. I'm going. I'm nearly going."),
      by('b', "You've been nearly going for five minutes!"),
    ] },
    { id: 'cpi.fd-t2', when: FD, turns: [
      by('b', "That's three dives with nothing. Can you see them down there?"),
      by('a', "I can see fish. And rocks. And more fish."),
      by('b', "Look past the fish!"),
    ] },
    { id: 'cpi.fd-t3', when: FD, turns: [
      beat("{a} slips on the cliff path, catches a vine, and dangles there, clutching the chest in the other arm."),
      by('a', "I'm holding on! I'm holding the chest!"),
      by('b', "Hold both! Don't let go of either!"),
    ] },
  ],
  'task-done.any': [
    { id: 'cpi.fd-dn1', when: FD, turns: [
      by('a', "I jumped off a waterfall. A real waterfall."),
      by('b', "You did. I'll be telling everyone."),
      by('a', "Tell them I wasn't scared."),
    ] },
    { id: 'cpi.fd-dn2', when: FD, turns: [
      beat("{a} stands dripping at the top of the falls, chest in hand, as {b} gives {a.obj} a big, soggy hug."),
      by('b', "You're so wet."),
      by('a', "You hugged me. Now you're wet too."),
    ] },
    { id: 'cpi.fd-dn3', when: FD, turns: [
      by('b', "Bobsled next. On a tropical island."),
      by('a', "This is the strangest place we've ever been."),
      by('b', "And the most beautiful."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cpi.fd-x1', when: FD, turns: [
      beat("{a} comes up out of the lagoon empty-handed, gasping."),
      by('a', "I couldn't find one! I couldn't see!"),
      by('b', "Back to the top! Jump again!"),
    ] },
    { id: 'cpi.fd-x2', when: FD, turns: [
      beat("Halfway up the cliff path, the chest slips out of {a}'s wet hands and bounces all the way back down into the lagoon."),
      by('a', "No! No, no, no!"),
      by('b', "Back down! Back to the edge!"),
    ] },
    { id: 'cpi.fd-x3', when: FD, turns: [
      beat("{a} walks to the edge, looks down, and steps straight back."),
      by('a', "I can't. Not yet. Give me a minute."),
      by('b', "Take your minute. Then jump."),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'cpi.fd-v1', when: FD, turns: [
      by('b', "Jump! You can do it! You're a dolphin! You're a dolphin!"),
      by('a', "Dolphins don't jump off waterfalls!"),
      by('b', "This one does!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'cpi.fd-v2', when: FD, turns: [
      beat("{b} leans over the edge of the falls, watching the spot where {a} went under, not breathing."),
      by('b', "Come up. Come up. Please come up."),
      beat("{a} bursts up out of the water. {b} lets out the breath."),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'cpi.fd-v3', when: FD, turns: [
      beat("{b} climbs halfway down the cliff path to take the chest off {a} and carry it the rest of the way."),
      by('b', "Give it here! I'll take it up!"),
      beat("A local guide at the top blows a whistle and points {b} back up. A penalty."),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'cpi.fd-v4', when: FD, turns: [
      beat("{b} sits on a rock at the top, saying nothing, eyes fixed on the lagoon far below."),
      by('a', "You're very quiet up there."),
      by('b', "I'm praying. Silently. With all my might."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'cpi.fd-h1', when: FD, turns: [
      beat("While the guide is looking the other way, {b} tosses a rope down the steepest bit of the path for {a} to hold."),
      by('a', "Where did this rope come from?"),
      by('b', "The island provides. Climb."),
    ] },
  ],
};

// ── the bobsled (All-In) ──
const sled = {
  'don-demo.gag': [
    { id: 'cpi.bs-d1', when: BS, turns: [
      don("In this All-In, ride the island's bobsled track. Push it off the start, jump in, and ride it down. Three times."),
      beat('He sits in a bobsled at the top of the track to demonstrate. Somebody pushes it. He disappears down the track, screaming.'),
      don("...I'm fine! I'm at the bottom! Your three times added up have to beat the number on the board!"),
    ] },
  ],
  'don-demo.dry': [
    { id: 'cpi.bs-d2', when: BS, turns: [
      don("Tip over, jump in too late, or add up too slow, and you start a fresh set of three runs."),
      don("Beat the board, and the next tip is yours. The track is concrete and painted wood. It is not ice. It is very hot."),
      beat('A sled rattles past behind him, sparks flying off the bottom, a team screaming inside it.'),
    ] },
  ],
  'task-start.any': [
    { id: 'cpi.bs-s1', when: BS, turns: [
      beat("{a} and {b} grab the handles at the back of the bobsled, at the top of the track, and look down the first bend."),
      by('a', "Push on three, jump in on four."),
      by('b', "There is no four in a countdown!"),
    ] },
    { id: 'cpi.bs-s2', when: BS, turns: [
      by('b', "I'll steer. You lean."),
      by('a', "Lean which way?"),
      by('b', "The way I scream."),
    ] },
    { id: 'cpi.bs-s3', when: BS, turns: [
      beat("{a} and {b} push the sled off the line, run three steps, and jump in, just in time."),
      by('a', "We're in! We're going!"),
      by('b', "We're going very, very fast!"),
    ] },
    { id: 'cpi.bs-s4', when: BS, turns: [
      by('a', "Three runs. What's the time on the board?"),
      by('b', "Faster than any of the teams so far."),
      by('a', "Then we'd better be the fastest team so far."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'cpi.bs-f1', when: BS, turns: [
      beat("{a} and {b} fly down the track three times, each run faster than the last, and the total flashes up under the board's number."),
      by('b', "We beat it! First set of three!"),
      by('a', "We're bobsledders! On a tropical island!"),
    ] },
    { id: 'cpi.bs-f2', when: BS, turns: [
      by('a', "Lean left! Lean right! Lean left!"),
      beat("They lean perfectly round every bend, and the last run is the fastest of the day."),
      by('b', "Fastest of the day! The crowd's cheering!"),
    ] },
    { id: 'cpi.bs-f3', when: BS, turns: [
      beat("The sled shoots across the finish line, and the island crowd on the hillside erupts."),
      by('b', "They're cheering for us! A whole hill of people!"),
      by('a', "We're famous here now. We're island famous."),
    ] },
    { id: 'cpi.bs-f4', when: BS, turns: [
      by('b', "First try. Three runs. Beat the board."),
      by('a', "I've got sunburn and track burn."),
      by('b', "Small price."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cpi.bs-a1', when: BS, turns: [
      by('b', "We're losing time on the push. Push longer, jump in later."),
      beat("They push for twice as long, jump in at the last moment, and the total beats the board."),
      by('a', "A longer push! That's the whole trick!"),
    ] },
    { id: 'cpi.bs-a2', when: BS, turns: [
      beat("Second set of three. {a} and {b} are tucked so low in the sled their heads barely show, and every run is quicker."),
      by('a', "Low is fast! Stay low!"),
      beat("The total flashes up. It beats the board."),
    ] },
    { id: 'cpi.bs-a3', when: BS, turns: [
      by('a', "We tipped on the big bend. So on the big bend, we both lean in. Hard."),
      beat("They lean in hard on the big bend, stay upright, and post their best total yet."),
      by('b', "The big bend didn't beat us!"),
    ] },
    { id: 'cpi.bs-a4', when: BS, turns: [
      beat("After one tip-over and one slow set, {a} and {b} finally post three runs fast enough to beat the board."),
      by('a', "Beat it! Finally beat it!"),
      by('b', "My bottom will never be the same."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'cpi.bs-t1', when: BS, turns: [
      beat("{a} and {b} sit in the stopped sled halfway down the track, stuck on a flat bit."),
      by('a', "Why did we stop?"),
      by('b', "Because it's not ice! It's concrete! Push with your hands!"),
    ] },
    { id: 'cpi.bs-t2', when: BS, turns: [
      by('b', "That's six runs. Six. And we're still too slow."),
      by('a', "Every run is the same time. Exactly the same."),
      by('b', "Then we need to do something different!"),
    ] },
    { id: 'cpi.bs-t3', when: BS, turns: [
      beat("{a} misses the jump into the sled, and runs after it down the track as it disappears round the bend."),
      by('a', "Wait! Wait for me!"),
      by('b', "I can't wait! It's a sled!"),
    ] },
  ],
  'task-done.any': [
    { id: 'cpi.bs-dn1', when: BS, turns: [
      by('a', "I never thought I'd bobsled on a beach."),
      by('b', "I never thought I'd bobsled at all."),
      by('a', "Life is full of surprises."),
    ] },
    { id: 'cpi.bs-dn2', when: BS, turns: [
      beat("{a} and {b} walk down to the resort, shaking the dust off, past people cheering from their porches."),
      by('b', "Everybody here is so nice."),
      by('a', "Everybody here is so calm. I want to be this calm."),
    ] },
    { id: 'cpi.bs-dn3', when: BS, turns: [
      by('b', "The pool. The Chill Zone is by the pool."),
      by('a', "Can we get in the pool?"),
      by('b', "We've earned the pool."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cpi.bs-x1', when: BS, turns: [
      beat("The sled hits the big bend too fast, rides up the wall, and tips over, spilling {a} and {b} onto the track."),
      by('a', "Ow! Ow! Everybody okay?"),
      by('b', "Okay! Back to the top! New set!"),
    ] },
    { id: 'cpi.bs-x2', when: BS, turns: [
      beat("Three runs. The total flashes up. It's two seconds slower than the board."),
      by('a', "Two seconds! Two!"),
      by('b', "Two seconds is too slow! Again!"),
    ] },
    { id: 'cpi.bs-x3', when: BS, turns: [
      beat("{b} jumps into the sled too late, misses, and the sled goes down the track with only {a} in it."),
      by('a', "Where are you?"),
      by('b', "Up here! It has to be both of us! Start again!"),
    ] },
  ],
};

export default mergePools(place, roads, falls, sled);
