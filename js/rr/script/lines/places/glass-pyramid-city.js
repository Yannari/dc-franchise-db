// Glass Pyramid City's own lines (js/rr/places/glass-pyramid-city.js), in our own words:
//   the taxi         to the museum: round and round the big roundabout.
//   the statue       All-In: a head, a body and a pair of legs hidden among the exhibits, fitted back together on the
//                    plinth for the curator, while a bear and other show animals wander the galleries.
//   the runway       Botch or Watch: a towering designer outfit, a strut, a pose, a turn and back, no trip, no stop,
//                    no giggle. a walks, b watches from the side.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'glass-pyramid-city' };
const BS = { taskId: 'broken-statue' };
const RW = { taskId: 'runway' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'gpc.op1', when: P, turns: [
      beat("Don stands in front of a great glass pyramid in a palace courtyard, in a beret and a striped shirt, holding a long loaf of bread."),
      don("Welcome to Glass Pyramid City! The city of art, love, and very small coffees that cost a very large amount of money."),
      don("Today, teams put a broken statue back together, and then walk a runway. It's a city of culture. We're bringing it down to our level."),
      beat('A pigeon lands on the loaf of bread and starts eating it. Don lets it. He has given up.'),
    ] },
    { id: 'gpc.op2', when: P, turns: [
      don("Glass Pyramid City. Every street is beautiful, every building is old, and every waiter has looked at me like I'm a disappointment."),
      don("Racers, there are taxis on the boulevard. Go to the museum. Touch nothing except what you're told to touch."),
      beat('A waiter walks past behind him, looks at Don, and sighs.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'gpc.op3', when: P, turns: [
      beat("Don sits at a tiny café table on the pavement, a tiny cup of coffee in front of him, watching the world go by."),
      don("Glass Pyramid City. I'm being very sophisticated. Taxis are on the boulevard."),
      don("Off you go. Try not to look like tourists. You will, but try."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'gpc.ar1', when: P, turns: [
      beat("The taxi crosses a bridge over the river, and the city spreads out on both banks: grand buildings, golden domes and a hundred bridges."),
      by('a', "Look at it. Every building looks like a palace."),
      by('b', "And there's the pyramid. A glass pyramid. In front of an actual palace."),
      by('a', "Who thought of that? Whoever it was, they were right."),
    ] },
    { id: 'gpc.ar2', when: P, turns: [
      by('b', "Smell that. Fresh bread. Every street smells like fresh bread."),
      by('a', "I want to stop at every bakery."),
      by('b', "We can't stop. But I want to as well."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'gpc.ad1', when: P, turns: [
      by('a', "The tip says 'statue' and 'broken'. Did we break it?"),
      by('b', "Not yet."),
      by('a', "I don't like the 'yet'."),
    ] },
    { id: 'gpc.ad2', when: P, turns: [
      by('b', "'Who can strut?' What does strut mean?"),
      by('a', "It means walk like you're the most important person in the room."),
      by('b', "I've never been the most important person in any room."),
    ] },
  ],
};

// ── the taxi (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'gpc.tm1', when: { taskId: 'museum-taxi', mishap: 'roundabout-loop' }, turns: [
      beat("The taxi enters a huge roundabout around a stone arch, with twelve roads coming off it, and can't get out."),
      by('a', "We've been round three times! I recognise that statue!"),
      by('b', "The driver says everybody goes round three times. It's tradition."),
      beat('Twenty minutes and a lot of honking later, they escape down the right road.'),
    ] },
  ],
};

// ── the broken statue (All-In) ──
const statue = {
  'don-demo.gag': [
    { id: 'gpc.bs-d1', when: BS, turns: [
      don("In this All-In, a statue has been broken into three pieces: a head, a body, and a pair of legs. They're hidden in the museum. Find them, and put it back together."),
      beat('He gestures towards the gallery, and a bear walks slowly across the doorway behind him. Don does not turn around.'),
      don("There's also a bear. And some other animals from a travelling show. They escaped this morning. It's a long story."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gpc.bs-d2', when: BS, turns: [
      don("The wrong piece, a piece upside down, or a dropped head, and you keep searching. The curator decides when it's whole."),
      don("A whole statue on the plinth gets you the next tip. Please don't break anything else. The insurance is already furious."),
      beat('The curator stands by the empty plinth, arms folded, wincing at every footstep in her museum.'),
    ] },
  ],
  'task-start.any': [
    { id: 'gpc.bs-s1', when: BS, turns: [
      beat("{a} and {b} run into a gallery full of marble statues, every single one of them whole."),
      by('a', "How do we tell which bits are ours?"),
      by('b', "Ours are the bits that aren't attached to anything."),
    ] },
    { id: 'gpc.bs-s2', when: BS, turns: [
      by('b', "You take the left wing, I take the right. Shout if you see a head."),
      by('a', "There are a lot of heads in here."),
      by('b', "A head with no body!"),
    ] },
    { id: 'gpc.bs-s3', when: BS, turns: [
      beat("{a} creeps round a corner, and comes face to face with a large brown bear, sitting in front of a famous painting."),
      by('a', "There's a bear. There's a bear looking at art."),
      by('b', "Don't disturb it! Back away slowly!"),
    ] },
    { id: 'gpc.bs-s4', when: BS, turns: [
      by('a', "Found legs! A pair of marble legs, behind a curtain!"),
      by('b', "Bring them! Carefully! They're heavier than they look!"),
      by('a', "Everything's heavier than it looks!"),
    ] },
  ],
  'task-try.first-try': [
    { id: 'gpc.bs-f1', when: BS, turns: [
      beat("{a} and {b} carry the head, the body and the legs back to the plinth, and fit them together perfectly. The curator nods."),
      by('b', "She nodded! It's whole!"),
      by('a', "We fixed a statue! We're artists!"),
    ] },
    { id: 'gpc.bs-f2', when: BS, turns: [
      by('a', "Head on top. Legs on the bottom. Body in the middle."),
      beat("It fits perfectly the first time. The curator looks relieved, and hands over the tip."),
      by('b', "That was easy! Why was that easy?"),
    ] },
    { id: 'gpc.bs-f3', when: BS, turns: [
      beat("{b} spots the head in the hands of another statue, holding it up like a trophy, and lifts it down."),
      by('b', "Got the head! It was being held by another statue!"),
      by('a', "That's a clever hiding place."),
    ] },
    { id: 'gpc.bs-f4', when: BS, turns: [
      by('b', "First try. Not one thing broken."),
      by('a', "Not even the bear."),
      by('b', "The bear was fine. The bear was the calmest one in here."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gpc.bs-a1', when: BS, turns: [
      by('b', "It's the wrong head. Look, it's a different colour. Ours must be the white marble one."),
      beat("They find the white marble head in the next gallery. It fits perfectly. The curator smiles."),
      by('a', "Colour! It was all about the colour!"),
    ] },
    { id: 'gpc.bs-a2', when: BS, turns: [
      beat("This time {a} turns the body round before setting it on the legs. Facing the right way, it fits."),
      by('a', "It was backwards! The whole time!"),
      beat('The curator nods, and hands over the tip.'),
    ] },
    { id: 'gpc.bs-a3', when: BS, turns: [
      by('a', "The last piece is somewhere the bear went. So we follow the bear."),
      beat("They follow the bear at a safe distance, and it leads them right to the missing legs."),
      by('b', "The bear helped! The bear was on our side!"),
    ] },
    { id: 'gpc.bs-a4', when: BS, turns: [
      beat("After two wrong heads and one very long search, {a} and {b} finally put the statue together whole."),
      by('a', "There! It's complete!"),
      by('b', "It's beautiful! I've never been so happy to see a statue."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'gpc.bs-t1', when: BS, turns: [
      beat("{a} and {b} have searched three galleries and found nothing but a lot of statues that are already whole."),
      by('a', "Where are they? This museum is endless."),
      by('b', "It's one of the biggest museums in the world."),
    ] },
    { id: 'gpc.bs-t2', when: BS, turns: [
      by('b', "The bear is sitting on the body. The bear is sitting on our statue."),
      by('a', "Can we ask it to move?"),
      by('b', "Can you speak bear?"),
    ] },
    { id: 'gpc.bs-t3', when: BS, turns: [
      beat("{a} is holding the head up to the body, turning it every way, and it won't fit."),
      by('a', "It doesn't go. It just doesn't go."),
      by('b', "Maybe it's not our head."),
    ] },
  ],
  'task-done.any': [
    { id: 'gpc.bs-dn1', when: BS, turns: [
      by('a', "We fixed a priceless statue."),
      by('b', "We fixed a statue someone broke on purpose."),
      by('a', "Still priceless."),
    ] },
    { id: 'gpc.bs-dn2', when: BS, turns: [
      beat("{a} and {b} walk out of the gallery, past the bear, which is now asleep in front of a famous painting."),
      by('b', "Bye, bear."),
      by('a', "Don't wake it. Just walk."),
    ] },
    { id: 'gpc.bs-dn3', when: BS, turns: [
      by('b', "The runway next. Fashion."),
      by('a', "From statues to fashion."),
      by('b', "This city is all about looking good."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gpc.bs-x1', when: BS, turns: [
      beat("{a} sets the head on the statue. The curator raises an eyebrow, and turns it right way round."),
      by('a', "It was facing backwards?"),
      by('b', "We have the wrong body anyway! Search again!"),
    ] },
    { id: 'gpc.bs-x2', when: BS, turns: [
      beat("The marble head slips out of {b}'s hands and rolls across the gallery floor. The curator gasps."),
      by('b', "It's okay! It's okay! It's not broken!"),
      by('a', "She's pointing back at the galleries! More searching!"),
    ] },
    { id: 'gpc.bs-x3', when: BS, turns: [
      beat("They fit the pieces together. The curator looks, and shakes her head. The legs belong to a completely different statue."),
      by('a', "They're legs! They're marble legs!"),
      by('b', "They're the wrong marble legs! Again!"),
    ] },
  ],
};

// ── the runway (Botch or Watch: a walks, b watches) ──
const runway = {
  'don-demo.gag': [
    { id: 'gpc.rw-d1', when: RW, turns: [
      don("In this Botch or Watch, put on one of the designer's outfits, and walk the runway. Strut to the end, pose, turn, and walk back."),
      beat('He struts a few steps down the runway, does a pose, and catches his shoe on the edge, nearly falling off.'),
      don("Without doing that. That was a practice walk. A warning walk."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gpc.rw-d2', when: RW, turns: [
      don("Trip, stop, or laugh, and you try a new outfit and walk again. The designer is very serious about laughing. She hates it."),
      don("If she applauds, the tip is yours. The other one of you watches from the side. In silence. Laughing counts for you too."),
      beat('The designer, in black sunglasses, sits in the front row, completely still, not smiling.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'gpc.rw-w1', when: RW, turns: [
      by('b', "You did the last one? No, I did. So you're modelling."),
      by('a', "I have never modelled anything in my life."),
      by('b', "Today's your first job."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'gpc.rw-w2', when: RW, turns: [
      by('a', "I'll do it. I've been practising my walk since I was twelve."),
      by('b', "In what?"),
      by('a', "In the kitchen. For no one. But I've been practising."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'gpc.rw-w3', when: RW, turns: [
      by('b', "You've got the legs for it. I've got the legs for sitting."),
      by('a', "That's not a compliment."),
      by('b', "It is to your legs."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'gpc.rw-w4', when: RW, turns: [
      by('a', "'Who can strut?' You strut every time you walk into a room."),
      by('b', "That's not a strut. That's confidence."),
      by('a', "Same thing. You're up."),
    ] },
  ],
  'task-start.any': [
    { id: 'gpc.rw-s1', when: RW, turns: [
      beat("{a} comes out of the dressing room in an outfit made of feathers, plastic and something that might be a lampshade."),
      by('a', "What am I wearing?"),
      by('b', "Fashion. You're wearing fashion. Don't laugh."),
    ] },
    { id: 'gpc.rw-s2', when: RW, turns: [
      by('b', "Look straight ahead. Don't smile. Walk like you're angry at the floor."),
      by('a', "Why am I angry at the floor?"),
      by('b', "That's how models walk."),
    ] },
    { id: 'gpc.rw-s3', when: RW, turns: [
      beat("{a} steps onto the runway, takes a deep breath, and starts to walk, hips swinging, chin up."),
      by('b', "That's it! That's the walk!"),
      beat('{b} remembers to be silent, and puts a hand over {b.posAdj} mouth.'),
    ] },
    { id: 'gpc.rw-s4', when: RW, turns: [
      by('a', "The shoes. Why are the shoes so high?"),
      by('b', "Because fashion hates you."),
      by('a', "I'm starting to hate fashion back."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'gpc.rw-f1', when: RW, turns: [
      beat("{a} struts to the end of the runway, strikes a pose, holds it, turns, and walks back without a wobble. The designer applauds."),
      by('b', "She's clapping! She actually clapped!"),
      by('a', "I'm a model! I'm an actual model!"),
    ] },
    { id: 'gpc.rw-f2', when: RW, turns: [
      by('a', "Angry at the floor. Angry at the floor."),
      beat("{a} glares at the floor all the way down and back. The designer takes off her sunglasses, and claps."),
      by('b', "The sunglasses came off! That's a huge deal!"),
    ] },
    { id: 'gpc.rw-f3', when: RW, turns: [
      beat("{a} does a spin at the end of the runway that wasn't in the plan, and lands it perfectly. The designer stands up."),
      by('b', "She's standing! She's giving you a standing ovation!"),
      by('a', "Is that good? It feels good!"),
    ] },
    { id: 'gpc.rw-f4', when: RW, turns: [
      by('b', "First walk. Not one laugh."),
      by('a', "I was dying inside. But not one laugh."),
      by('b', "That's what fashion is."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gpc.rw-a1', when: RW, turns: [
      by('b', "You keep laughing at the turn. So don't look at me at the turn. Look at the ceiling."),
      beat("{a} looks at the ceiling at the turn, keeps a straight face, and walks back. The designer claps."),
      by('a', "The ceiling! The ceiling saved me!"),
    ] },
    { id: 'gpc.rw-a2', when: RW, turns: [
      beat("Third outfit, the most ridiculous yet, and this time {a} walks it with total, deadly seriousness."),
      by('b', "That's it! That's it!"),
      beat('The designer nods, and gives one small, approving clap. The tip is theirs.'),
    ] },
    { id: 'gpc.rw-a3', when: RW, turns: [
      by('a', "I keep tripping on the high heels. So I walk on my toes. The whole way."),
      beat("{a} walks the whole runway on {a.posAdj} toes, like a ballerina, and doesn't trip once."),
      by('b', "She loved it! She thinks it's on purpose!"),
    ] },
    { id: 'gpc.rw-a4', when: RW, turns: [
      beat("After one trip and one fit of giggles, {a} finally walks the whole runway without a single slip."),
      by('a', "I did it! Third time! I'm a model!"),
      by('b', "A model who needed three tries. Still a model."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'gpc.rw-t1', when: RW, turns: [
      beat("{a} is standing at the start of the runway in a dress made of balloons, trying very hard not to laugh."),
      by('a', "I can't. I can't do it with a straight face."),
      by('b', "Think about something sad! Think about the bear!"),
    ] },
    { id: 'gpc.rw-t2', when: RW, turns: [
      by('b', "That's the fourth outfit. Each one's worse than the last."),
      by('a', "This one has a hat with a fish on it."),
      by('b', "Wear the fish with pride."),
    ] },
    { id: 'gpc.rw-t3', when: RW, turns: [
      beat("{a} wobbles on the high heels halfway down the runway, arms windmilling."),
      by('a', "I'm going! I'm going down!"),
      by('b', "Stay up! Stay up!"),
    ] },
  ],
  'task-done.any': [
    { id: 'gpc.rw-dn1', when: RW, turns: [
      by('a', "Can I keep the shoes?"),
      by('b', "You hated the shoes."),
      by('a', "I hated them because I didn't understand them. Now I understand them."),
    ] },
    { id: 'gpc.rw-dn2', when: RW, turns: [
      beat("{a} and {b} run out of the museum towards the glass pyramid, glowing in the dark."),
      by('b', "The pyramid! Look at it, all lit up!"),
      by('a', "It's beautiful. Run faster. Admire it later."),
    ] },
    { id: 'gpc.rw-dn3', when: RW, turns: [
      by('b', "You walked like a real model. Honestly."),
      by('a', "I walked like a person who was very scared of falling."),
      by('b', "That's what models look like."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gpc.rw-x1', when: RW, turns: [
      beat("{a} catches a heel on the edge of the runway, stumbles, and only just doesn't fall. The designer shakes her head."),
      by('a', "I didn't fall! I didn't fall!"),
      by('b', "You stumbled! New outfit!"),
    ] },
    { id: 'gpc.rw-x2', when: RW, turns: [
      beat("{a} reaches the end, turns, sees {b}'s face, and bursts out laughing."),
      by('a', "It's your fault! You made a face!"),
      by('b', "I didn't make any face! New outfit!"),
    ] },
    { id: 'gpc.rw-x3', when: RW, turns: [
      beat("Halfway down the runway, {a}'s giant feathered hat slides off, and {a} stops to pick it up. The designer winces."),
      by('a', "It fell! I had to pick it up!"),
      by('b', "You stopped! You're not allowed to stop! Again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'gpc.rw-v1', when: RW, turns: [
      by('b', "Work it! Work it! You're gorgeous!"),
      by('a', "Shh! You're supposed to be quiet!"),
      by('b', "I'm whisper-cheering!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'gpc.rw-v2', when: RW, turns: [
      beat("{b} watches from the side, hands clasped, wincing at every wobble on the high heels."),
      by('b', "Don't fall. Don't fall. Please don't fall."),
      by('a', "I can hear you praying!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'gpc.rw-v3', when: RW, turns: [
      beat("{b} walks alongside the runway, doing the walk too, so {a} can copy it."),
      by('b', "Like this! Hips like this!"),
      beat('The designer points at {b}, then at the door. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'gpc.rw-v4', when: RW, turns: [
      beat("{b} stands perfectly still at the side of the runway, face blank, giving {a} nothing to laugh at."),
      by('a', "Why are you so serious?"),
      by('b', "So you don't laugh. I'm being a wall."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'gpc.rw-h1', when: RW, turns: [
      beat("While the designer adjusts her sunglasses, {b} quickly tapes down the edge of the runway where {a} keeps tripping."),
      by('a', "That bit's flat now! Who flattened it?"),
      by('b', "Nobody. Walk."),
    ] },
  ],
};

export default mergePools(place, roads, statue, runway);
