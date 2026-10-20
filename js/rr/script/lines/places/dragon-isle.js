// Dragon Isle's own lines (js/rr/places/dragon-isle.js), 1:1 with the real leg ("Got Venom"), in our own words:
//   the boat       to the island: the engine cuts out.
//   the drool      All-In: under the stilt huts, one holds a giant lizard's attention with a forked stick, the other
//                  dabs its lip with a sponge on a pole and squeezes it into a vial; a hiss or a charge and they run, a
//                  spilled vial and they start again.
//   the rugs       All-In: a mountain of woven rugs in the jungle, and one with the race's mark; the wrong one to the
//                  weaver and it's back to the pile.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'dragon-isle' };
const VE = { taskId: 'venom' };
const RU = { taskId: 'rugs' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'drg.op1', when: P, turns: [
      beat("Don stands on a beach of pink sand, very still, while behind him a lizard the length of a canoe walks slowly past."),
      don("Welcome to Dragon Isle! Home of the biggest lizards on earth. They're slow. They're lazy. Unless they're hungry."),
      don("Today, teams collect a little gift from one of them. A very little gift. In a very little bottle."),
      beat('The lizard stops, flicks its forked tongue, and looks at Don. Don does not move a single muscle.'),
    ] },
    { id: 'drg.op2', when: P, turns: [
      don("Dragon Isle. Real dragons. No fire, no wings, but the bite is supposed to be very, very bad. I'm told not to mention that."),
      don("Racers, your boat to the island is at the dock. Keep your hands inside it at all times."),
      beat('A ranger, standing behind him with a long forked stick, nods slowly and seriously.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'drg.op3', when: P, turns: [
      beat("Don is sitting in a lifeguard's chair, high above the beach, well out of reach of anything with legs."),
      don("Dragon Isle. I'm up here for a reason. Boat's at the dock."),
      don("Go and visit the lizards. I'll wave."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'drg.ar1', when: P, turns: [
      beat("The boat rounds a headland, and the island appears: bare brown hills, a pink beach, and a village on stilts over the water."),
      by('a', "The beach is pink. Actually pink."),
      by('b', "And there's a dinosaur on it. Look. That's a dinosaur."),
      by('a', "It's a lizard. A very, very big lizard."),
    ] },
    { id: 'drg.ar2', when: P, turns: [
      by('b', "The huts are on legs. The whole village is on legs."),
      by('a', "So the lizards can't get in."),
      by('b', "That's not comforting. That's the opposite."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'drg.ad1', when: P, turns: [
      by('a', "Read the tip again. What does 'collect drool' mean?"),
      by('b', "It means exactly what it says."),
      by('a', "That's what I was afraid of."),
    ] },
    { id: 'drg.ad2', when: P, turns: [
      beat("As the boat pulls in, a lizard lying on the jetty opens its mouth wide, very slowly, and closes it again."),
      by('b', "Was that a yawn? Or a warning?"),
      by('a', "Let's not find out. Get off at the other end."),
    ] },
  ],
};

// ── the boat (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'drg.tm1', when: { taskId: 'isle-boat', mishap: 'engine-cuts-out' }, turns: [
      beat("Halfway across the strait, the boat's engine coughs twice and goes silent. They drift."),
      by('a', "Why have we stopped?"),
      by('b', "The driver's hitting the engine with a shoe."),
      beat('Twenty minutes and one shoe later, the engine roars back to life.'),
    ] },
  ],
};

// ── the dragon drool (All-In) ──
const venom = {
  'don-demo.gag': [
    { id: 'drg.ve-d1', when: VE, turns: [
      don("In this All-In, fill this little vial with drool from one of those lizards. One of you keeps its attention with a stick, the other dabs its lip with a sponge."),
      beat('He holds up the sponge on a long pole, very far out in front of him, at arm\'s length, pointing nowhere near a lizard.'),
      don("I'm demonstrating the technique. From a safe distance. The safest distance."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'drg.ve-d2', when: VE, turns: [
      don("If it hisses, back off. If it charges, run. If you spill the vial, you start again."),
      don("Show the ranger a full vial, and the next tip is yours. Do not try to pat it. It doesn't want to be patted."),
      beat('Under the stilt huts, a lizard drools a long, shining string onto the sand. A racer gags.'),
    ] },
  ],
  'task-start.any': [
    { id: 'drg.ve-s1', when: VE, turns: [
      beat("{a} and {b} creep under the stilt huts, where a giant lizard lies in the shade, eyes half closed."),
      by('a', "Is it asleep?"),
      by('b', "I don't know. How do you tell if a dragon's asleep?"),
    ] },
    { id: 'drg.ve-s2', when: VE, turns: [
      by('b', "I wave the stick. You go in with the sponge. Quick dab, quick squeeze."),
      by('a', "Why do I get the dangerous end?"),
      by('b', "Both ends are the dangerous end."),
    ] },
    { id: 'drg.ve-s3', when: VE, turns: [
      beat("{a} edges the sponge forward, centimetre by centimetre, towards the lizard's mouth."),
      by('a', "Nice dragon. Good dragon. I'm just going to borrow some drool."),
      by('b', "Don't talk to it! It doesn't care!"),
    ] },
    { id: 'drg.ve-s4', when: VE, turns: [
      by('a', "The ranger said they can run as fast as a dog."),
      by('b', "Then we run faster than a dog."),
      by('a', "I've never run faster than a dog."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'drg.ve-f1', when: VE, turns: [
      beat("{b} waves the stick, the lizard turns its head, and {a} dabs its lip and backs away with a dripping sponge."),
      by('a', "Got it! Got a whole spongeful!"),
      by('b', "Squeeze it in! Squeeze it in the vial!"),
    ] },
    { id: 'drg.ve-f2', when: VE, turns: [
      by('a', "The vial's full! It's full of dragon spit!"),
      beat('The ranger holds the vial up to the light, nods, and hands over the tip.'),
      by('b', "That's the grossest thing I've ever been proud of."),
    ] },
    { id: 'drg.ve-f3', when: VE, turns: [
      beat("The lizard yawns, wide, and {a} slips the sponge right in and out before it closes again."),
      by('b', "You went in its mouth! You went in!"),
      by('a', "It yawned! I took my chance!"),
    ] },
    { id: 'drg.ve-f4', when: VE, turns: [
      by('b', "First try! First try with a dragon!"),
      by('a', "Can we leave? Can we leave right now?"),
      by('b', "We're leaving. Slowly. Don't run."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'drg.ve-a1', when: VE, turns: [
      by('b', "That one's too awake. Try the sleepy one by the post."),
      beat('The sleepy one by the post barely opens an eye, and {a} fills the vial from its chin.'),
      by('a', "Sleepy dragons! Always pick a sleepy dragon!"),
    ] },
    { id: 'drg.ve-a2', when: VE, turns: [
      beat("This time {b} keeps the stick moving the whole time, and the lizard never looks at {a} once."),
      by('b', "Keep its eyes on the stick! Go now!"),
      beat("{a} fills the vial. The ranger nods. The tip is theirs."),
    ] },
    { id: 'drg.ve-a3', when: VE, turns: [
      by('a', "We keep spilling it. So this time, you hold the vial. Steady. Don't move."),
      beat("{b} holds the vial like it's made of gold. {a} squeezes. It fills right to the top."),
      by('b', "Full! Not a drop spilled!"),
    ] },
    { id: 'drg.ve-a4', when: VE, turns: [
      beat("After two charges and one long sprint, {a} creeps back in, dabs once, and comes out with enough to fill the vial."),
      by('a', "Third time. Third dragon. Done."),
      by('b', "I can't believe we went back in."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'drg.ve-t1', when: VE, turns: [
      beat("{a} and {b} stand behind a stilt post, peeking out at the lizard, which is staring straight at them."),
      by('a', "It's looking at us. Why is it looking at us?"),
      by('b', "Maybe it's hungry."),
      by('a', "Don't say that."),
    ] },
    { id: 'drg.ve-t2', when: VE, turns: [
      by('b', "Every time you get close, it hisses."),
      by('a', "Maybe it doesn't like me."),
      by('b', "It doesn't like anybody. That's its whole thing."),
    ] },
    { id: 'drg.ve-t3', when: VE, turns: [
      beat("The sponge is bone dry. The lizard has shut its mouth and won't open it for anything."),
      by('a', "It's not drooling. It's stopped drooling."),
      by('b', "Make it hungry. Wave the stick like food."),
    ] },
  ],
  'task-done.any': [
    { id: 'drg.ve-dn1', when: VE, turns: [
      by('a', "I'm going to dream about that lizard."),
      by('b', "Good dreams or bad dreams?"),
      by('a', "Dreams where I'm running."),
    ] },
    { id: 'drg.ve-dn2', when: VE, turns: [
      beat("{a} and {b} jog out from under the stilt huts, wiping their hands on their shorts again and again."),
      by('b', "It's on my hands. The drool is on my hands."),
      by('a', "Stop smelling your hands."),
    ] },
    { id: 'drg.ve-dn3', when: VE, turns: [
      by('b', "We got drool from a real dragon. Who else can say that?"),
      by('a', "The ranger. Probably every day."),
      by('b', "Who else apart from him?"),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'drg.ve-x1', when: VE, turns: [
      beat("The lizard hisses, rises up on its legs, and lunges. {a} and {b} sprint for the beach."),
      by('a', "Run! Run! It's coming!"),
      by('b', "It stopped! It stopped! Go back!"),
    ] },
    { id: 'drg.ve-x2', when: VE, turns: [
      beat("{a} squeezes the sponge, misses the vial completely, and the drool lands on {b}'s shoe."),
      by('b', "My shoe! It's on my shoe!"),
      by('a', "Can we scrape it off into the vial?"),
    ] },
    { id: 'drg.ve-x3', when: VE, turns: [
      beat("{b} trips running back, and the vial flies out of {b.posAdj} hand and smashes on a rock."),
      by('b', "No! It was almost full!"),
      by('a', "New vial. New dragon. Go."),
    ] },
  ],
};

// ── the race rug (All-In) ──
const rugs = {
  'don-demo.gag': [
    { id: 'drg.ru-d1', when: RU, turns: [
      don("In this All-In, find the one rug with the race's mark woven into it. It's in this pile. Somewhere."),
      beat('He gestures at a pile of rugs taller than a barn, then picks up the one on top and unrolls it. Not it.'),
      don("Well, it's not that one. That narrows it down to all the others."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'drg.ru-d2', when: RU, turns: [
      don("Bring the weaver the wrong rug, and you go back to the pile. Bring her the right one, and the next tip is yours."),
      don("She made every single one of these by hand. Don't throw them in the mud. She will see you."),
      beat('The weaver, sitting at her loom, looks up at Don, and he puts the rug he is holding down very neatly.'),
    ] },
  ],
  'task-start.any': [
    { id: 'drg.ru-s1', when: RU, turns: [
      beat("{a} and {b} stare up at the mountain of rugs, every colour and every pattern you could imagine."),
      by('a', "How many are there?"),
      by('b', "All of them. Every rug on the island."),
    ] },
    { id: 'drg.ru-s2', when: RU, turns: [
      by('b', "We do it properly. One side each. Unroll, check, roll back up, put it on the done pile."),
      by('a', "That'll take forever."),
      by('b', "Forever, but properly."),
    ] },
    { id: 'drg.ru-s3', when: RU, turns: [
      beat("{a} pulls a rug from the bottom of the pile, and the whole stack slides down on top of {a.obj}."),
      by('a', "Help! I'm under the rugs!"),
      by('b', "Check the ones on top of you while you're there!"),
    ] },
    { id: 'drg.ru-s4', when: RU, turns: [
      by('a', "What does the race's mark even look like?"),
      by('b', "It's on the tip. Look. Like a little race flag."),
      by('a', "There are flags on half of these rugs."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'drg.ru-f1', when: RU, turns: [
      beat("{b} unrolls a red rug, and there in the middle, woven in gold thread, is the race's mark."),
      by('b', "It's this one! It's this one! First rug!"),
      by('a', "First rug? Out of all of them?"),
    ] },
    { id: 'drg.ru-f2', when: RU, turns: [
      by('a', "This one's heavier. Feel it. It's different."),
      beat("They unroll it at the weaver's feet. The mark is right there. She smiles and gives them the tip."),
      by('b', "You found a rug by weight! Who does that?"),
    ] },
    { id: 'drg.ru-f3', when: RU, turns: [
      beat("{a} climbs up to the very top of the pile, pulls out the rug at the peak, and unrolls it. That's the one."),
      by('a', "They always hide it at the top! Nobody looks at the top!"),
      by('b', "How did you know that?"),
    ] },
    { id: 'drg.ru-f4', when: RU, turns: [
      by('b', "It's the one! The weaver's nodding!"),
      by('a', "Can we keep it?"),
      by('b', "It's the most beautiful rug I've ever seen, and no."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'drg.ru-a1', when: RU, turns: [
      by('b', "We keep bringing ones with flags. The mark isn't just a flag. It's a flag inside a circle."),
      beat('A flag inside a circle. Twelve rugs later, {b} finds it.'),
      by('a', "A circle! Should have read the tip properly!"),
    ] },
    { id: 'drg.ru-a2', when: RU, turns: [
      beat("After an hour of unrolling, {a} pulls out a rug near the bottom, flips it, and finds the mark."),
      by('a', "There! There! The real one!"),
      by('b', "Roll it up! Don't let anyone else see!"),
    ] },
    { id: 'drg.ru-a3', when: RU, turns: [
      by('a', "The weaver keeps looking at the left side of the pile. Every time we're wrong."),
      beat('They search the left side of the pile. The third rug they unroll has the mark.'),
      by('b', "She was helping us! She was helping us with her eyes!"),
    ] },
    { id: 'drg.ru-a4', when: RU, turns: [
      beat("{a} and {b} work in silence, unroll, check, roll, until {b} freezes over one rug."),
      by('b', "This one. It's this one. I'm sure."),
      beat('The weaver looks, nods, and hands over the tip.'),
    ] },
  ],
  'task-try.struggling': [
    { id: 'drg.ru-t1', when: RU, turns: [
      beat("{a} and {b} sit in the middle of a sea of unrolled rugs, the pile still taller than both of them."),
      by('a', "We've done a hundred. There's still a mountain."),
      by('b', "A smaller mountain."),
    ] },
    { id: 'drg.ru-t2', when: RU, turns: [
      by('b', "Have we checked this one before?"),
      by('a', "I don't know. They all look the same now."),
      by('b', "They're all different. That's the problem."),
    ] },
    { id: 'drg.ru-t3', when: RU, turns: [
      beat("{a} sneezes, then sneezes again, then can't stop sneezing."),
      by('a', "Dust! There's a hundred years of dust in these!"),
      by('b', "Sneeze and search at the same time!"),
    ] },
  ],
  'task-done.any': [
    { id: 'drg.ru-dn1', when: RU, turns: [
      by('a', "I never want to see another rug."),
      by('b', "We've got rugs at home."),
      by('a', "I'm throwing them all out."),
    ] },
    { id: 'drg.ru-dn2', when: RU, turns: [
      beat("{a} and {b} run up the jungle path towards the hill, as the sun starts to sink."),
      by('b', "The Chill Zone's on the hill. Look at that sunset."),
      by('a', "Look at it later. Run now."),
    ] },
    { id: 'drg.ru-dn3', when: RU, turns: [
      by('b', "The weaver smiled at us. She actually smiled."),
      by('a', "Because we found her rug."),
      by('b', "Because we folded them all back up."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'drg.ru-x1', when: RU, turns: [
      beat("{a} unrolls a rug at the weaver's feet with a flourish. She looks at it, and shakes her head."),
      by('a', "It's got a flag on it!"),
      by('b', "It's got a fish on it. Back to the pile."),
    ] },
    { id: 'drg.ru-x2', when: RU, turns: [
      beat("{b} drags a heavy rug all the way over to the weaver, and she points back at the pile before it's even unrolled."),
      by('b', "She didn't even look at it!"),
      by('a', "She doesn't need to. She made it."),
    ] },
    { id: 'drg.ru-x3', when: RU, turns: [
      beat("{a} sees the mark from across the pile, dives for it, and comes up with the rug next to it."),
      by('a', "This is the one!"),
      by('b', "That's the one next to the one! Go back!"),
    ] },
  ],
};

export default mergePools(place, roads, venom, rugs);
