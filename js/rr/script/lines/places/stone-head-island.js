// Stone Head Island's own lines (js/rr/places/stone-head-island.js), in our own words:
//   the jeep         across the island: wild horses on the track.
//   the eggs         All-In: dozens of eggs hidden in the cracks, under the chins, behind the ears and in the sand round
//                    the giant stone heads, three in the team's colour; a cracked egg or another team's colour goes back.
//   the condor nest  Botch or Watch: up the rock spire with the eggs in a pouch, into the giant nest, back down, while the
//                    condor circles and swoops; a crack, a slip or a retreat and it's the bottom again. a climbs, b
//                    watches from the foot.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'stone-head-island' };
const EG = { taskId: 'eggs' };
const CN = { taskId: 'condor-nest' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'shi.op1', when: P, turns: [
      beat("Don stands on a grassy hill in front of a row of giant stone heads, all staring out to sea, all looking much more serious than he does."),
      don("Welcome to Stone Head Island! The most remote island on the planet, guarded by giant stone heads nobody can quite explain. They're very judgemental."),
      don("Today, teams hunt for eggs. Painted ones. And then give them back to a very large, very protective bird."),
      beat('Don glances at the nearest stone head, then shifts slightly to the left to get out of its line of sight.'),
    ] },
    { id: 'shi.op2', when: P, turns: [
      don("Stone Head Island. Thousands of miles from anywhere. The nearest neighbour is a fish. The second nearest is a different fish."),
      don("Racers, jeeps are at the airstrip. The roads are dirt. The horses are wild. They don't care about your race."),
      beat('A herd of wild horses gallops across the hill behind him, manes flying, and disappears over the ridge.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'shi.op3', when: P, turns: [
      beat("Don leans against the back of a stone head, in its shade, eating a sandwich."),
      don("Stone Head Island. It's very quiet. These heads don't talk. I like them. Jeeps are at the airstrip."),
      don("Off you go. Don't wake the condor."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'shi.ar1', when: P, turns: [
      beat("The jeep crests a hill, and there they are: a long row of giant stone heads along the beach, backs to the sea, faces to the island."),
      by('a', "They're enormous. They're so much bigger than in pictures."),
      by('b', "How did anybody move them? There's nothing here but grass."),
      by('a', "Nobody knows. That's what makes it amazing."),
    ] },
    { id: 'shi.ar2', when: P, turns: [
      by('b', "It's so empty. The sea goes on forever in every direction."),
      by('a', "We're the furthest from home we've ever been."),
      by('b', "And the stone heads are watching."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'shi.ad1', when: P, turns: [
      by('a', "The tip says 'condor'. That's a giant bird, isn't it?"),
      by('b', "The biggest bird that flies."),
      by('a', "And we're taking its eggs back to it."),
    ] },
    { id: 'shi.ad2', when: P, turns: [
      by('b', "'Who can climb?' Up what? Up where?"),
      by('a', "Up that. That spire."),
      by('b', "That's a tower made of rock."),
    ] },
  ],
};

// ── the jeep (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'shi.tm1', when: { taskId: 'island-jeep', mishap: 'wild-horses' }, turns: [
      beat("The jeep stops as a herd of wild horses thunders across the dirt track and then stops right in the middle of it, grazing."),
      by('a', "They've just stopped. In the road."),
      by('b', "It's their island. We're the visitors."),
      beat('Twenty minutes later, the herd wanders off, and the jeep bumps on towards the beach.'),
    ] },
  ],
};

// ── the painted eggs (All-In) ──
const eggs = {
  'don-demo.gag': [
    { id: 'shi.eg-d1', when: EG, turns: [
      don("In this All-In, search the stone heads for three eggs painted in your team's colour. They're hidden in cracks, under chins, behind ears, in the sand."),
      beat('He reaches under the chin of the nearest stone head, feels around, and pulls out an egg. The wrong colour. He puts it back.'),
      don("That one isn't for anybody here. That's a decoy. There are many decoys."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'shi.eg-d2', when: EG, turns: [
      don("A cracked egg, or one in another team's colour, goes back, and you keep searching. Use the padded basket."),
      don("Three unbroken eggs in your colour, and the next tip is yours. The heads won't help you. They never help anybody."),
      beat('A racer behind him climbs onto a stone head\'s shoulder to look behind its ear. The head stares on, unmoved.'),
    ] },
  ],
  'task-start.any': [
    { id: 'shi.eg-s1', when: EG, turns: [
      beat("{a} and {b} stand at the end of the long row of stone heads, every one of them taller than the two of them stacked up."),
      by('a', "Where do we even start?"),
      by('b', "At the first head. And then the second head."),
    ] },
    { id: 'shi.eg-s2', when: EG, turns: [
      by('b', "You check the top half, I'll check the bottom half and the sand."),
      by('a', "How am I meant to reach the top half?"),
      by('b', "Climb. Gently. They're very old."),
    ] },
    { id: 'shi.eg-s3', when: EG, turns: [
      beat("{a} reaches into a crack in a stone head's cheek and pulls out a blue egg."),
      by('a', "Blue! Are we blue?"),
      by('b', "We're green! Put it back!"),
    ] },
    { id: 'shi.eg-s4', when: EG, turns: [
      by('a', "Why are their faces so serious?"),
      by('b', "Because people keep poking them looking for eggs."),
      by('a', "Sorry, heads."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'shi.eg-f1', when: EG, turns: [
      beat("{a} finds one under a chin, {b} finds one behind an ear, and the third is buried in the sand at the base of the last head."),
      by('b', "Three! All three! Not a crack on them!"),
      by('a', "First go! The heads were on our side!"),
    ] },
    { id: 'shi.eg-f2', when: EG, turns: [
      by('a', "Look in the nose. Nobody looks in the nose."),
      beat("{a} reaches up into a giant stone nostril, and pulls out an egg in exactly their colour."),
      by('b', "In the nose! It was in the nose!"),
    ] },
    { id: 'shi.eg-f3', when: EG, turns: [
      beat("{a} and {b} carry the basket very slowly to the judge, all three eggs nestled in the padding, and the judge counts them."),
      by('a', "Three. Our colour. No cracks."),
      beat('The judge nods, and hands over the tip.'),
    ] },
    { id: 'shi.eg-f4', when: EG, turns: [
      by('b', "First try. Three eggs."),
      by('a', "I feel like an egg detective."),
      by('b', "A very gentle egg detective."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'shi.eg-a1', when: EG, turns: [
      by('b', "We cracked the last one because we ran. Walk. Walk everywhere. Carry it like a baby."),
      beat("Walking everywhere, carrying every egg like a baby, they bring three unbroken ones to the judge."),
      by('a', "Walking! Who knew walking was the answer?"),
    ] },
    { id: 'shi.eg-a2', when: EG, turns: [
      beat("Second search. This time {a} and {b} dig round the base of every head, and find the last egg buried deep in the sand."),
      by('a', "It was buried! Right at the bottom!"),
      by('b', "That's three! Our colour!"),
    ] },
    { id: 'shi.eg-a3', when: EG, turns: [
      by('a', "We keep picking up the wrong colour in the shade. Check every egg in the sunlight."),
      beat("They check every egg in the sunlight, and find the third green one, which looked blue in the shade."),
      by('b', "The sunlight! It was green all along!"),
    ] },
    { id: 'shi.eg-a4', when: EG, turns: [
      beat("After one cracked egg and one wrong colour, {a} and {b} finally hand over three perfect eggs."),
      by('a', "Third time! Three perfect eggs!"),
      by('b', "We've checked every head on this beach."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'shi.eg-t1', when: EG, turns: [
      beat("{a} is up on a stone head's shoulder, peering behind its ear, and can't get down."),
      by('a', "I'm stuck up here! How do I get down?"),
      by('b', "The same way you got up! Backwards!"),
    ] },
    { id: 'shi.eg-t2', when: EG, turns: [
      by('b', "We've found eight eggs. None of them are ours."),
      by('a', "Every other team's eggs are here except ours."),
      by('b', "The heads are hiding ours on purpose."),
    ] },
    { id: 'shi.eg-t3', when: EG, turns: [
      beat("{a} and {b} have dug a hole in the sand so deep {b} is standing in it up to the waist."),
      by('a', "Anything down there?"),
      by('b', "Sand. More sand. A crab."),
    ] },
  ],
  'task-done.any': [
    { id: 'shi.eg-dn1', when: EG, turns: [
      by('a', "I never want to look up a stone nose again."),
      by('b', "You were the one who thought of it."),
      by('a', "And now I regret it."),
    ] },
    { id: 'shi.eg-dn2', when: EG, turns: [
      beat("{a} and {b} carry the basket of eggs towards the tall rock spire, a dark shape circling high above it."),
      by('b', "Is that the condor?"),
      by('a', "That's the condor. And it's watching."),
    ] },
    { id: 'shi.eg-dn3', when: EG, turns: [
      by('b', "Thank you, heads."),
      by('a', "Are you thanking the stone heads?"),
      by('b', "They let us find the eggs. It's only polite."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'shi.eg-x1', when: EG, turns: [
      beat("{b} trips on a rock, and the basket bumps the ground. Crack. One of the eggs has a line down the middle."),
      by('b', "It's cracked! Only a little bit!"),
      by('a', "A little bit is still cracked! Find another!"),
    ] },
    { id: 'shi.eg-x2', when: EG, turns: [
      beat("The judge looks into their basket, picks up one egg, and holds it next to their team's colour. It doesn't match."),
      by('a', "It looked the same!"),
      by('b', "It's a different green! Back to the heads!"),
    ] },
    { id: 'shi.eg-x3', when: EG, turns: [
      beat("{a} grabs an egg from behind an ear, and it slips, falls, and smashes on the stone shoulder."),
      by('a', "No! It was ours!"),
      by('b', "It's not ours now! Keep looking!"),
    ] },
  ],
};

// ── the condor nest (Botch or Watch: a climbs, b watches from the foot) ──
const nest = {
  'don-demo.gag': [
    { id: 'shi.cn-d1', when: CN, turns: [
      don("In this Botch or Watch, climb this rock spire with your three eggs, put them in the condor's nest at the top, and climb back down."),
      beat('A huge shadow passes over Don. He looks up at the condor circling overhead, and quietly takes three steps backwards.'),
      don("The condor would like its eggs back. The condor is very, very large. Climb quickly."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'shi.cn-d2', when: CN, turns: [
      don("Crack an egg, slip into the harness, or retreat from the condor, and you climb down and start again. The other one of you watches from the bottom."),
      don("Three eggs in the nest and both feet back on the ground gets you the next tip. The condor swoops at anyone who dawdles. Don't dawdle."),
      beat('Halfway up the spire behind him, a racer ducks as the condor swoops past, wings as wide as a car.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'shi.cn-w1', when: CN, turns: [
      by('b', "You did the last one? No, that was me. So you're climbing."),
      by('a', "Up that? With a giant bird?"),
      by('b', "With a very grateful giant bird. You're bringing its eggs back."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'shi.cn-w2', when: CN, turns: [
      by('a', "I'll climb. I've always been a climber. Trees, walls, wardrobes."),
      by('b', "Wardrobes?"),
      by('a', "I was a very curious child."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'shi.cn-w3', when: CN, turns: [
      by('b', "Birds hate me. Every bird I've ever met. You climb."),
      by('a', "Birds don't hate you."),
      by('b', "A seagull stole my whole lunch last summer. They hate me."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'shi.cn-w4', when: CN, turns: [
      by('a', "'Who can climb?' You went to that climbing wall for your birthday."),
      by('b', "I got halfway up and cried."),
      by('a', "Halfway is more than me."),
    ] },
  ],
  'task-start.any': [
    { id: 'shi.cn-s1', when: CN, turns: [
      beat("{a} straps the pouch of eggs across {a.posAdj} chest, clips into the harness, and grabs the first handhold on the spire."),
      by('a', "Here goes. Don't let me fall."),
      by('b', "The harness won't let you fall. Go."),
    ] },
    { id: 'shi.cn-s2', when: CN, turns: [
      by('b', "Keep your body away from the rock. Protect the eggs."),
      by('a', "How do I climb without touching the rock?"),
      by('b', "Touch it with your hands and feet. Not your egg chest."),
    ] },
    { id: 'shi.cn-s3', when: CN, turns: [
      beat("Halfway up, a huge shadow falls over {a}. The condor circles, close enough to hear its wings."),
      by('a', "It's right there. It's right next to me."),
      by('b', "Keep climbing! You're bringing its babies home!"),
    ] },
    { id: 'shi.cn-s4', when: CN, turns: [
      by('a', "Which way up is the nest?"),
      by('b', "Up. It's always up. Keep going up."),
      by('a', "Thank you, that's very specific."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'shi.cn-f1', when: CN, turns: [
      beat("{a} climbs to the top, places the three eggs gently in the giant nest, and climbs back down without a slip, as the condor settles on its eggs."),
      by('b', "You did it! First climb!"),
      by('a', "The condor looked at me! It looked grateful!"),
    ] },
    { id: 'shi.cn-f2', when: CN, turns: [
      by('a', "Eggs are in! Coming down!"),
      beat("{a} climbs down so fast and so smooth, {b} can barely keep track, and jumps the last bit onto the grass."),
      by('b', "That was like watching a spider!"),
    ] },
    { id: 'shi.cn-f3', when: CN, turns: [
      beat("The condor swoops at {a} near the top. {a} doesn't flinch, just holds still, and the condor flies off and lets {a} reach the nest."),
      by('b', "You didn't even move!"),
      by('a', "I was too scared to move. It worked."),
    ] },
    { id: 'shi.cn-f4', when: CN, turns: [
      by('b', "First try! Up and down!"),
      by('a', "I want to go back up and watch it with its eggs."),
      by('b', "We have a race to win."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'shi.cn-a1', when: CN, turns: [
      by('b', "You keep backing off when it swoops. Don't back off. Keep still and let it pass."),
      beat("The condor swoops. {a} keeps still. It passes. {a} climbs the rest of the way and fills the nest."),
      by('a', "Keep still! It just wants to check on us!"),
    ] },
    { id: 'shi.cn-a2', when: CN, turns: [
      beat("Second climb. This time {a} takes the long way round the back of the spire, where the condor doesn't fly, and reaches the nest."),
      by('a', "The back way! It never comes round the back!"),
      by('b', "Clever! Now come down!"),
    ] },
    { id: 'shi.cn-a3', when: CN, turns: [
      by('a', "I cracked an egg on the rock. This time, I climb with my chest away from the spire. Arms straight."),
      beat("Arms straight, chest away from the rock, {a} reaches the nest with every egg unbroken."),
      by('b', "Arms straight! It worked!"),
    ] },
    { id: 'shi.cn-a4', when: CN, turns: [
      beat("After one slip and one swoop, {a} finally puts three eggs in the nest and climbs back down to the grass."),
      by('a', "Third time! It's done! I'm down!"),
      by('b', "The condor's sitting on them! It's happy!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'shi.cn-t1', when: CN, turns: [
      beat("{a} is clinging to the spire halfway up, not moving, as the condor circles overhead."),
      by('a', "It's watching me. Every time I move, it watches me."),
      by('b', "It's watching its eggs! Keep going!"),
    ] },
    { id: 'shi.cn-t2', when: CN, turns: [
      by('b', "That's the third time it's chased you down."),
      by('a', "It's very protective."),
      by('b', "You're bringing its eggs BACK! Tell it that!"),
    ] },
    { id: 'shi.cn-t3', when: CN, turns: [
      beat("{a} reaches the top, looks into the nest, and the condor lands on the edge of it, right in front of {a}'s face."),
      by('a', "Hello. Hi. I have your eggs. Please don't."),
      by('b', "Put them in slowly! Very slowly!"),
    ] },
  ],
  'task-done.any': [
    { id: 'shi.cn-dn1', when: CN, turns: [
      by('a', "I was nose to beak with a condor."),
      by('b', "What was it like?"),
      by('a', "Very big. Very beaky."),
    ] },
    { id: 'shi.cn-dn2', when: CN, turns: [
      beat("{a} and {b} walk away from the spire towards the dune, and behind them the condor settles down on its three eggs."),
      by('b', "Look. It's sitting on them."),
      by('a', "We did a good thing today."),
    ] },
    { id: 'shi.cn-dn3', when: CN, turns: [
      by('b', "You climbed a tower of rock with a giant bird attacking you."),
      by('a', "It wasn't attacking. It was supervising."),
      by('b', "Very aggressively supervising."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'shi.cn-x1', when: CN, turns: [
      beat("The condor swoops, {a} ducks, loses a handhold, and drops into the harness, swinging against the rock."),
      by('a', "I'm fine! I'm in the harness! The eggs!"),
      by('b', "Check the eggs! Come down and start again!"),
    ] },
    { id: 'shi.cn-x2', when: CN, turns: [
      beat("{a} bumps the pouch against the rock. A tiny crack appears in one egg."),
      by('a', "It's cracked! A hairline!"),
      by('b', "Come down! We need a new egg!"),
    ] },
    { id: 'shi.cn-x3', when: CN, turns: [
      beat("The condor swoops twice in a row, and {a} climbs straight back down to the bottom."),
      by('a', "I can't. Not with it doing that."),
      by('b', "Take a breath, then go again."),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'shi.cn-v1', when: CN, turns: [
      by('b', "Climb! You're a mountain goat! A mountain goat with eggs!"),
      by('a', "Stop shouting! You'll upset the bird!"),
      by('b', "The bird is already upset!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'shi.cn-v2', when: CN, turns: [
      beat("{b} stands at the bottom of the spire, flinching every time the condor swoops."),
      by('b', "Watch out! Behind you! No, the other behind!"),
      by('a', "I can't watch behind me! I'm climbing!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'shi.cn-v3', when: CN, turns: [
      beat("{b} starts climbing the spire too, to help {a} reach the top."),
      by('b', "I'll catch up! I'll hold the pouch!"),
      beat("The judge blows a whistle and points {b} back to the bottom. A penalty."),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'shi.cn-v4', when: CN, turns: [
      beat("{b} stands at the bottom in total silence, holding the safety rope, eyes on {a} the whole way."),
      by('a', "Are you still there?"),
      by('b', "I'm here. I'm holding the rope. I'm not letting go."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'shi.cn-h1', when: CN, turns: [
      beat("While the judge looks out to sea, {b} waves a jacket in the air at the far side of the spire, and the condor flies off to look."),
      by('a', "Where did the condor go?"),
      by('b', "It got distracted. Climb. Fast."),
    ] },
  ],
};

export default mergePools(place, roads, eggs, nest);
